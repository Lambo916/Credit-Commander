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
    'https://grant.yourbizguru.com',
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

  res.setHeader('Access-Control-Allow-Origin', allowOrigin && origin ? origin : 'https://grant.yourbizguru.com');
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
    console.log(`[Express] /api/generate - Starting grant proposal generation (usage: ${usageCheck.count}/30)`);
    
    const { formData } = req.body as any;
    
    if (!formData) {
      console.error('[Express] /api/generate - Missing formData');
      return res.status(400).json({ error: 'formData is required' });
    }

    const {
      projectName,
      organizationType,
      grantType,
      problemStatement,
      solutionActivities,
      expectedOutcomes,
      totalBudget,
      writingTone
    } = formData;

    // Validate required fields for grant proposals
    if (!organizationType || !grantType) {
      return res.status(400).json({
        error: "Organization type and grant type are required.",
      });
    }

    console.log('[Express] /api/generate - Grant proposal data:', {
      projectName,
      organizationType,
      grantType,
      totalBudget
    });

    // Initialize OpenAI client
    const ai = getOpenAI();

    // Generate grant proposal using AI
    console.log('[Express] /api/generate - Generating grant proposal with AI...');
    
    const grantProposalPrompt = `You are an expert grant writer specializing in creating compelling, professional grant proposals that win funding.

Generate a comprehensive grant proposal for:
- Project/Organization: ${projectName || '[Project Name]'} 
- Organization Type: ${organizationType}
- Grant Type: ${grantType}
- Total Budget: ${totalBudget || 'Not specified'}
- Problem/Need: ${problemStatement || 'Not specified'}
- Solution/Activities: ${solutionActivities || 'Not specified'}
- Expected Outcomes: ${expectedOutcomes || 'Not specified'}
- Writing Tone: ${writingTone || 'Professional & Persuasive'}

CRITICAL: Create a persuasive, well-structured grant proposal with specific details. Avoid generic placeholders.

Generate a JSON object with these 7 sections:
{
  "executiveSummary": "A compelling 2-3 paragraph executive summary that captures the essence of the proposal, the problem being addressed, your unique solution, and expected impact. Make it persuasive and engaging.",
  
  "needsStatement": "3-4 paragraphs detailing: (1) The specific problem or need this project addresses, (2) Supporting evidence, statistics, or data demonstrating the need, (3) Who is affected and how, (4) Why addressing this need is urgent and important. Be specific and data-driven where possible.",
  
  "programDescription": "4-5 paragraphs describing: (1) Your proposed solution/program in detail, (2) Specific activities and methods you'll use, (3) Target population and how you'll reach them, (4) Timeline of program activities, (5) Why your approach is effective and evidence-based. Include concrete details about implementation.",
  
  "outcomesEvaluation": "3-4 paragraphs covering: (1) Specific, measurable outcomes you expect to achieve, (2) How you will measure success (evaluation methods and metrics), (3) Short-term and long-term impact, (4) How you'll use evaluation results to improve the program. Include both quantitative and qualitative measures.",
  
  "budgetNarrative": "A detailed budget narrative (3-4 paragraphs) explaining: (1) Major budget categories and amounts, (2) How each expense directly supports project goals, (3) Why the budget is reasonable and necessary, (4) Any cost-sharing or matching funds. Make the connection between budget items and program activities clear.",
  
  "implementationTimeline": "A detailed timeline (4-6 milestones/phases) showing: (1) Key project phases from start to completion, (2) Major milestones and deliverables, (3) Responsible parties, (4) Timeframes for each phase. Format as an array of milestone objects with structure: {\"phase\": \"Phase name\", \"activity\": \"What happens\", \"timeframe\": \"Month 1-3 or specific dates\", \"milestone\": \"Key deliverable\"}",
  
  "recommendations": [
    "3-5 specific, actionable recommendations for strengthening this proposal",
    "Each recommendation should be a complete sentence offering concrete advice"
  ]
}

IMPORTANT: 
- Use the ${writingTone} writing style throughout
- Be specific - avoid phrases like "we will work hard" or "we are committed"
- Include realistic details based on the provided information
- Make it persuasive and fundable
- Return ONLY valid JSON, no explanations or markdown`;

    try {
      console.log('[Express] /api/generate - Calling OpenAI API for grant proposal...');
      
      const completion = await ai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert grant writer with deep knowledge of successful grant proposals across all sectors. Create compelling, fundable proposals with specific details. Return valid JSON only."
          },
          {
            role: "user",
            content: grantProposalPrompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      console.log('[Express] /api/generate - OpenAI API call completed');
      
      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Transform response to match frontend expectations
      const response = {
        summary: aiResponse.executiveSummary || 'Executive summary not generated.',
        needsStatement: aiResponse.needsStatement || 'Needs statement not generated.',
        programDescription: aiResponse.programDescription || 'Program description not generated.',
        outcomesEvaluation: aiResponse.outcomesEvaluation || 'Outcomes and evaluation not generated.',
        budgetNarrative: Array.isArray(aiResponse.budgetNarrative) 
          ? aiResponse.budgetNarrative 
          : aiResponse.budgetNarrative ? [aiResponse.budgetNarrative] : ['Budget narrative not generated.'],
        timeline: aiResponse.implementationTimeline || [],
        recommendations: aiResponse.recommendations || ['Review and refine your proposal before submission']
      };

      console.log('[Express] /api/generate - Grant proposal generated successfully');

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
      console.error('[Express] /api/generate - OpenAI error:', error.message);
      console.error('[Express] /api/generate - Full error:', error);
      
      // Return a friendly error with details for debugging
      return res.status(500).json({ 
        error: 'Failed to generate grant proposal. Please try again.',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }

  } catch (error: any) {
    console.error('[Express] /api/generate - Error:', error);
    console.error('[Express] /api/generate - Stack:', error.stack);
    
    return res.status(500).json({
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
