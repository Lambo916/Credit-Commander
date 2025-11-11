import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { getDb } from './_lib/db-serverless.js';
import { usageTracking } from './_lib/schema.js';
import { eq, sql } from 'drizzle-orm';

// Initialize OpenAI
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    openai = new OpenAI({ apiKey: apiKey.replace(/\s+/g, '').trim() });
  }
  return openai;
}

// Get client IP address from request
function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  
  return typeof ip === 'string' ? ip.trim() : 'unknown';
}

// Check usage limit (read-only check before generation)
async function checkUsageLimit(req: VercelRequest): Promise<{ allowed: boolean; count: number }> {
  try {
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      console.error('[Usage] Unable to determine client IP - blocking request for security');
      return { allowed: false, count: 30 }; // Treat as limit reached to block generation
    }

    const db = getDb();
    
    // Check current usage
    const existing = await db
      .select()
      .from(usageTracking)
      .where(eq(usageTracking.ipAddress, ipAddress))
      .limit(1);

    const currentCount = existing.length > 0 ? existing[0].reportCount : 0;

    // Check against 30-report limit
    if (currentCount >= 30) {
      console.log(`[Usage] IP ${ipAddress} has reached limit: ${currentCount}/30`);
      return { allowed: false, count: currentCount };
    }

    console.log(`[Usage] IP ${ipAddress} current usage: ${currentCount}/30`);
    return { allowed: true, count: currentCount };
  } catch (error) {
    console.error('[Usage] Check error:', error);
    // Fail open for soft launch - allow generation if usage tracking fails
    return { allowed: true, count: 0 };
  }
}

// Increment usage after successful generation (atomic with limit enforcement)
async function incrementUsage(req: VercelRequest): Promise<{ success: boolean; count: number; limitReached?: boolean }> {
  try {
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      console.error('[Usage] Unable to determine client IP - failing increment for security');
      return { success: false, count: 30, limitReached: true }; // Fail closed to prevent bypass
    }

    const db = getDb();
    
    // Atomic increment with strict limit enforcement
    // Only increments if count < 30 (prevents race conditions)
    const updated = await db
      .update(usageTracking)
      .set({
        reportCount: sql`${usageTracking.reportCount} + 1`,
        lastUpdated: new Date(),
      })
      .where(sql`${usageTracking.ipAddress} = ${ipAddress} AND ${usageTracking.reportCount} < 30`)
      .returning();

    if (updated.length > 0) {
      // Successfully incremented
      console.log(`[Usage] IP ${ipAddress} incremented to ${updated[0].reportCount}/30`);
      return { success: true, count: updated[0].reportCount };
    }

    // No rows updated - either doesn't exist or already at limit
    const existing = await db
      .select()
      .from(usageTracking)
      .where(eq(usageTracking.ipAddress, ipAddress))
      .limit(1);

    if (existing.length > 0) {
      // Record exists and is at/over limit
      console.log(`[Usage] IP ${ipAddress} already at limit: ${existing[0].reportCount}/30`);
      return { success: false, count: existing[0].reportCount, limitReached: true };
    }

    // First report for this IP - insert with count 1
    const inserted = await db
      .insert(usageTracking)
      .values({
        ipAddress,
        reportCount: 1,
      })
      .returning();
    
    console.log(`[Usage] IP ${ipAddress} first report: 1/30`);
    return { success: true, count: inserted[0].reportCount };
  } catch (error) {
    console.error('[Usage] Increment error - CRITICAL:', error);
    // Return error state to prevent uncounted report delivery
    return { success: false, count: 0, limitReached: true };
  }
}

// Helper for CORS (production-locked with development support)
function setCORS(res: VercelResponse, origin: string | undefined) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const allowedOrigins = [
    'https://credit.yourbizguru.com',
    /https:\/\/.*\.vercel\.app$/,
    /https:\/\/.*\.replit\.dev$/,
  ];

  // In development, also allow localhost
  if (isDevelopment && origin?.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return;
  }

  let allowOrigin = false;
  if (origin) {
    allowOrigin = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      return allowed.test(origin);
    });
  }

  res.setHeader('Access-Control-Allow-Origin', allowOrigin && origin ? origin : 'https://credit.yourbizguru.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler for /api/generate
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  setCORS(res, origin);

  // Always set JSON content type
  res.setHeader('Content-Type', 'application/json');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check 30-report usage limit BEFORE generation (soft launch protection)
  const usageCheck = await checkUsageLimit(req);
  if (!usageCheck.allowed) {
    console.log(`[Vercel] /api/generate - Request blocked: usage limit reached (${usageCheck.count}/30)`);
    return res.status(429).json({
      error: 'You have reached your 30-report limit for Credit Commander. Please contact support to continue.',
      limitReached: true,
      count: usageCheck.count,
      limit: 30
    });
  }

  try {
    console.log(`[Vercel] /api/generate - Starting credit roadmap generation (usage: ${usageCheck.count}/30)`);
    
    const { formData } = req.body as any;
    
    if (!formData) {
      console.error('[Vercel] /api/generate - Missing formData');
      return res.status(400).json({ error: 'formData is required' });
    }

    const {
      businessName,
      ein,
      entityType,
      state,
      startDate,
      annualRevenue,
      utilization,
      tradeLines,
      latePayments,
      derogatories,
      ownerFico,
      creditHistory,
      fundingGoal,
      targetLimit,
      timeframe
    } = formData;

    // Validate required fields for Credit Commander
    if (!businessName || !entityType || !state) {
      return res.status(400).json({
        error: "Business name, entity type, and state are required to generate your credit roadmap.",
      });
    }

    console.log('[Vercel] /api/generate - Credit roadmap data:', {
      businessName,
      entityType,
      state,
      fundingGoal,
      timeframe
    });

    // Initialize OpenAI client
    const ai = getOpenAI();

    // Generate credit roadmap using AI
    console.log('[Vercel] /api/generate - Generating credit roadmap with AI...');
    
    const creditRoadmapPrompt = `Generate a personalized business credit-building roadmap for:

BUSINESS PROFILE:
- Business Name: ${businessName}
- Entity Type: ${entityType || 'Not specified'}
- State: ${state || 'Not specified'}
- EIN: ${ein ? 'Provided' : 'Not provided'}
- Business Start Date: ${startDate || 'Not specified'}
- Annual Revenue: ${annualRevenue || 'Not specified'}

CURRENT CREDIT METRICS:
- Credit Utilization: ${utilization || 'Not specified'}%
- Active Trade Lines: ${tradeLines || 'Not specified'}
- Late Payments (90 Days): ${latePayments || 'Not specified'}
- Derogatories/Collections: ${derogatories || 'Not specified'}
- Owner FICO Score: ${ownerFico || 'Not specified'}
- Credit History (Years): ${creditHistory || 'Not specified'}

FUNDING GOALS:
- Funding Goal: ${fundingGoal || 'Not specified'}
- Target Credit Limit: ${targetLimit || 'Not specified'}
- Timeframe: ${timeframe || 'Not specified'}

Generate a JSON object with these 9 sections (use markdown formatting):
{
  "profileSummary": "2-3 paragraphs (200-250 words) analyzing the business's current credit position, strengths, and improvement opportunities",
  
  "quickWins": "1-2 paragraphs listing immediate actions they can take within 30 days to boost credit signals",
  
  "tradeLinesPlan": "2-3 paragraphs explaining starter, net-30, and revolving tradelines strategy",
  
  "vendorRecommendations": [
    {
      "name": "Vendor name (e.g., Uline, Quill, Grainger)",
      "approvalOdds": "High|Medium|Low",
      "tier": "Starter|Net-30|Revolving",
      "minFico": 0,
      "reason": "Brief explanation why this vendor fits their profile",
      "reportsBureaus": ["Dun & Bradstreet", "Experian", "Equifax"]
    }
  ],
  
  "cardStrategy": "2-3 paragraphs detailing business card strategy, timing, and utilization tips",
  
  "cardRecommendations": [
    {
      "name": "Card name (e.g., Amex Blue Business Plus, Chase Ink Business Cash)",
      "issuer": "Issuer name (e.g., American Express, Chase)",
      "approvalOdds": "High|Medium|Low",
      "applyOrder": 1,
      "benefits": "Key benefits and rewards structure",
      "annualFee": "$0 or fee amount"
    }
  ],
  
  "bankingSignals": "1-2 paragraphs on banking relationships, revenue verification, and D&B/Experian profile optimization",
  
  "actionPlan": "A clear 30/60/90-day timeline with specific milestones for each phase (as a formatted string, not an object)",
  
  "riskFlags": "1-2 paragraphs identifying any red flags (late payments, derogatories, utilization) and compliance issues"
}

CRITICAL REQUIREMENTS:
- Be specific and actionable - reference actual data from the profile
- Generate 3-5 vendor recommendations tailored to their credit profile and business stage
- Generate 3-5 card recommendations in priority order (applyOrder: 1, 2, 3, etc.)
- Match approval odds to their actual FICO score and credit history
- Provide realistic timeframes based on current credit age
- Use clear, direct business language
- If information is missing, insert [Pending Input] but still provide general guidance
- Return ONLY valid JSON, no markdown wrapper`;

    try {
      console.log('[Vercel] /api/generate - Calling OpenAI API for credit roadmap...');
      
      const completion = await ai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are Credit Commander, an expert business credit advisor with AI-powered capabilities. Generate personalized, actionable credit-building roadmaps that help businesses establish and improve their business credit profiles. Return valid JSON only."
          },
          {
            role: "user",
            content: creditRoadmapPrompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      console.log('[Vercel] /api/generate - OpenAI API call completed');
      
      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Transform response to match Credit Commander frontend expectations (7 sections)
      const response = {
        profileSummary: aiResponse.profileSummary || 'Profile summary not generated.',
        quickWins: aiResponse.quickWins || 'Quick wins not generated.',
        tradeLinesPlan: aiResponse.tradeLinesPlan || 'Trade lines plan not generated.',
        cardStrategy: aiResponse.cardStrategy || 'Card strategy not generated.',
        bankingSignals: aiResponse.bankingSignals || 'Banking signals not generated.',
        actionPlan: typeof aiResponse.actionPlan === 'string' 
          ? aiResponse.actionPlan 
          : '30/60/90-day action plan not generated.',
        riskFlags: aiResponse.riskFlags || 'Risk flags not generated.'
      };

      console.log('[Vercel] /api/generate - Credit roadmap generated successfully');

      // Increment usage counter AFTER successful generation
      const incrementResult = await incrementUsage(req);
      
      // If increment failed due to limit (race condition), reject the request
      if (!incrementResult.success && incrementResult.limitReached) {
        console.log(`[Express] /api/generate - Request completed but limit reached during increment: ${incrementResult.count}/30`);
        return res.status(429).json({
          error: 'You have reached your 30-report limit for Credit Commander. Please contact support to continue.',
          limitReached: true,
          count: incrementResult.count,
          limit: 30
        });
      }

      return res.status(200).json(response);

    } catch (error: any) {
      console.error('[Vercel] /api/generate - OpenAI error:', error.message);
      console.error('[Vercel] /api/generate - Full error:', error);
      
      // Return a friendly error with details for debugging
      return res.status(500).json({ 
        error: 'Failed to generate credit roadmap. Please try again.',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }

  } catch (error: any) {
    console.error('[Vercel] /api/generate - Error:', error);
    console.error('[Vercel] /api/generate - Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
