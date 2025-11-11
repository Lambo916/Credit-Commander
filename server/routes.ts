import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import path from "path";
import OpenAI from "openai";
import sanitizeHtml from "sanitize-html";
import { resolveProfile, type FilingProfile } from "@shared/filing-profiles";
import { db } from "./db";
import { complianceReports, insertComplianceReportSchema, type ComplianceReport, usageTracking } from "@shared/schema";
import { eq, desc, or, and, sql } from "drizzle-orm";
import { getUserId, hasAccess, requireAuth } from "./auth";

// Get anonymous user ID from browser-provided client ID
function getAnonymousUserId(req: Request): string {
  const clientId = req.headers['x-client-id'] as string;
  if (!clientId) {
    throw new Error('X-Client-Id header is required');
  }
  return `anon_${clientId}`;
}

// Sanitize HTML content to prevent XSS
function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['style', 'class'],
    },
  });
}

// Get client IP address from request (30-report cap enforcement)
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  
  return typeof ip === 'string' ? ip.trim() : 'unknown';
}

// Normalize and validate tool parameter (prevent bypass via case/variant strings)
function normalizeTool(tool: any): 'creditcommander' | 'complipilot' {
  const normalized = String(tool || 'creditcommander').toLowerCase().trim();
  if (normalized === 'complipilot') {
    return 'complipilot';
  }
  return 'creditcommander'; // Default to creditcommander for any invalid/unknown values
}

// Check usage limit (read-only check before generation)
async function checkUsageLimit(req: Request, tool: string = 'creditcommander'): Promise<{ allowed: boolean; count: number }> {
  try {
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      console.error('[Usage] Unable to determine client IP - blocking request for security');
      return { allowed: false, count: 30 }; // Treat as limit reached to block generation
    }

    // Check current usage for this specific tool
    const existing = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool)
      ))
      .limit(1);

    const currentCount = existing.length > 0 ? existing[0].reportCount : 0;

    // Check against 30-report limit per tool
    if (currentCount >= 30) {
      console.log(`[Usage] IP ${ipAddress} has reached limit for ${tool}: ${currentCount}/30`);
      return { allowed: false, count: currentCount };
    }

    console.log(`[Usage] IP ${ipAddress} current usage for ${tool}: ${currentCount}/30`);
    return { allowed: true, count: currentCount };
  } catch (error) {
    console.error('[Usage] Check error:', error);
    // Fail open for soft launch - allow generation if usage tracking fails
    return { allowed: true, count: 0 };
  }
}

// Increment usage after successful generation (atomic with limit enforcement)
async function incrementUsage(req: Request, tool: string = 'creditcommander'): Promise<{ success: boolean; count: number; limitReached?: boolean }> {
  try {
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      console.error('[Usage] Unable to determine client IP - failing increment for security');
      return { success: false, count: 30, limitReached: true }; // Fail closed to prevent bypass
    }

    // Atomic increment with strict limit enforcement per tool
    // Only increments if count < 30 (prevents race conditions)
    const updated = await db
      .update(usageTracking)
      .set({
        reportCount: sql`${usageTracking.reportCount} + 1`,
        lastUpdated: new Date(),
      })
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool),
        sql`${usageTracking.reportCount} < 30`
      ))
      .returning();

    if (updated.length > 0) {
      // Successfully incremented
      console.log(`[Usage] IP ${ipAddress} incremented ${tool} to ${updated[0].reportCount}/30`);
      return { success: true, count: updated[0].reportCount };
    }

    // No rows updated - either doesn't exist or already at limit
    const existing = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Record exists and is at/over limit
      console.log(`[Usage] IP ${ipAddress} already at limit for ${tool}: ${existing[0].reportCount}/30`);
      return { success: false, count: existing[0].reportCount, limitReached: true };
    }

    // First report for this IP and tool - insert with count 1
    const inserted = await db
      .insert(usageTracking)
      .values({
        ipAddress,
        tool,
        reportCount: 1,
      })
      .returning();
    
    console.log(`[Usage] IP ${ipAddress} first ${tool} report: 1/30`);
    return { success: true, count: inserted[0].reportCount };
  } catch (error) {
    console.error('[Usage] Increment error - CRITICAL:', error);
    // Return error state to prevent uncounted report delivery
    return { success: false, count: 0, limitReached: true };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from public folder
  app.use(express.static(path.join(process.cwd(), "public")));
  
  // Database health check endpoint
  app.get("/api/db/ping", async (req, res) => {
    try {
      const result = await db.execute(sql`SELECT 1 as ping`);
      res.json({ 
        ok: true, 
        result: result.rows[0],
        database: 'connected'
      });
    } catch (error: any) {
      console.error("Database health check failed:", error);
      res.status(500).json({ 
        ok: false, 
        error: error.message,
        database: 'disconnected'
      });
    }
  });

  // Auth config endpoint (public)
  app.get("/api/auth/config", (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      res.json({
        supabaseUrl,
        supabaseAnonKey,
        authEnabled: true
      });
    } else {
      res.json({
        authEnabled: false,
        message: "Authentication service not configured"
      });
    }
  });
  
  // Initialize OpenAI client
  const rawApiKey = process.env.OPENAI_API_KEY;
  if (!rawApiKey) {
    throw new Error("OPENAI_API_KEY is required");
  }
  
  // Clean the API key - remove all whitespace and newlines
  const apiKey = rawApiKey.replace(/\s+/g, '').trim();
  
  
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  // Credit Commander business credit system prompt template
  const getCreditCommanderSystemPrompt = () => {
    return `You are Credit Commander, an expert business credit advisor with AI-powered capabilities.

Your role is to generate personalized, actionable credit-building roadmaps that help businesses establish and improve their business credit profiles.

CRITICAL FORMATTING RULES:
1. ALWAYS structure your response with these exact 7 sections using markdown headings:
   # Profile Summary
   ## Quick Wins (0-30 Days)
   ## Tiered Trade Lines Plan
   ## Card Strategy
   ## Banking & Data Signals
   ## 30/60/90-Day Action Plan
   ## Risk Flags & Compliance

2. Format each section as follows:
   - Profile Summary: Write 2-3 paragraphs (200-250 words) analyzing the business's current credit position, strengths, and improvement opportunities
   - Quick Wins: Write 1-2 paragraphs listing immediate actions they can take within 30 days to boost credit signals
   - Tiered Trade Lines Plan: Write 2-3 paragraphs explaining starter, net-30, and revolving tradelines with specific vendor recommendations
   - Card Strategy: Write 2-3 paragraphs detailing which business cards to target based on their profile, in what order, with utilization tips
   - Banking & Data Signals: Write 1-2 paragraphs on banking relationships, revenue verification, and D&B/Experian profile optimization
   - 30/60/90-Day Action Plan: Write a clear timeline with specific milestones for each phase
   - Risk Flags & Compliance: Write 1-2 paragraphs identifying any red flags (late payments, derogatories, utilization) and compliance issues

3. PLACEHOLDER HANDLING:
   - If information is missing, insert clean placeholders like [Pending Input] or [AWAITING DATA]
   - NEVER leave blank sections or break structure
   - Provide general guidance even with incomplete data

4. WRITING STYLE:
   - Use clear, direct business language
   - Be specific and actionable - avoid generic advice
   - Ground recommendations in the provided credit data
   - Focus on practical steps the business owner can implement
   - Maintain professional advisory tone throughout
   - Include specific dollar amounts, percentages, and timelines

5. CREDIT-SPECIFIC GUIDANCE:
   - Reference actual FICO scores, utilization percentages, and trade line counts from the input
   - Suggest specific vendors (Uline, Quill, Grainger, etc.) for trade lines
   - Recommend specific business cards based on profile (Amex Blue, Chase Ink, etc.)
   - Provide realistic timeframes based on current credit age and history
   
REMEMBER: Your roadmap should be data-driven yet actionable, helping business owners build credit systematically and compliantly.`;
  };

  // Elev8 Analyzer diagnostic system prompt template (SCAFFOLD)
  const getDiagnosticSystemPrompt = () => {
    return `You are Elev8 Analyzer, an expert business diagnostic assistant powered by GrantGenie.

Your role is to generate professional strategic analysis reports that help businesses identify opportunities, address challenges, and elevate their operations.

CRITICAL FORMATTING RULES:
1. ALWAYS structure your response with these exact 4 sections using markdown headings:
   # Executive Summary
   ## SWOT Analysis
   ## Risk & Opportunity Matrix
   ## Strategic Recommendations

2. Format each section as follows:
   - Executive Summary: Write 2-3 clear, insightful paragraphs (150-200 words) analyzing the business profile
   - SWOT Analysis: Create a markdown table with 4 columns: Strengths | Weaknesses | Opportunities | Threats
   - Risk & Opportunity Matrix: Create a markdown table with 3 columns: Factor | Impact Level | Action Priority
   - Strategic Recommendations: Use numbered list (1., 2., 3., etc.) with specific, actionable items

3. PLACEHOLDER HANDLING:
   - If business information is missing, insert clean placeholders like [Pending Input] or [AWAITING DATA]
   - NEVER leave blank sections or break table structure
   - For incomplete matrices, include at least one placeholder row

4. WRITING STYLE:
   - Use clear business language, avoid unnecessary jargon
   - Be strategic and forward-looking
   - Ground insights in the provided business data
   - Focus on actionable intelligence
   - Maintain professional consultant tone throughout

5. TABLE FORMATTING:
   - Always use proper markdown table syntax with | separators
   - Include header row with column names
   - Include separator row with dashes
   - Add at least 3-4 data rows per table (use placeholders if needed)
   
REMEMBER: Your analysis should be data-driven yet strategic, helping business owners make informed decisions.`;
  };

  // Helper: Compute timeline dates from deadline with validation
  function computeTimelineDates(timeline: any[], deadline: string | null) {
    if (!deadline) {
      return timeline.map(item => ({
        milestone: item.milestone,
        owner: item.owner,
        dueDate: `T${item.offsetDays}`,
        notes: item.notes
      }));
    }
    
    // Validate deadline format
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      console.warn(`Invalid deadline format: ${deadline}, falling back to relative dates`);
      return timeline.map(item => ({
        milestone: item.milestone,
        owner: item.owner,
        dueDate: `T${item.offsetDays}`,
        notes: item.notes
      }));
    }
    
    return timeline.map(item => {
      const dueDate = new Date(deadlineDate);
      dueDate.setDate(dueDate.getDate() + item.offsetDays);
      
      const month = String(dueDate.getMonth() + 1).padStart(2, '0');
      const day = String(dueDate.getDate()).padStart(2, '0');
      const year = dueDate.getFullYear();
      
      return {
        milestone: item.milestone,
        owner: item.owner,
        dueDate: `${month}/${day}/${year}`,
        notes: item.notes
      };
    });
  }

  // API endpoint for generating structured compliance data (HYBRID APPROACH)
  app.post("/api/generate", async (req, res) => {
    // Normalize and validate tool parameter (prevent usage cap bypass)
    const tool = normalizeTool(req.body.tool);
    const toolName = tool === 'creditcommander' ? 'Credit Commander' : 'CompliPilot';
    
    // Check 30-report usage limit BEFORE generation (soft launch protection)
    const usageCheck = await checkUsageLimit(req, tool);
    if (!usageCheck.allowed) {
      console.log(`[Express] /api/generate - Request blocked: usage limit reached for ${tool} (${usageCheck.count}/30)`);
      return res.status(429).json({
        error: `You have reached your 30-report limit for the ${toolName} soft launch. Please upgrade to continue.`,
        limitReached: true,
        count: usageCheck.count,
        limit: 30,
        tool
      });
    }

    const { formData } = req.body;
    
    try {
      console.log(`[Express] /api/generate - Starting report generation (usage: ${usageCheck.count}/30)`);
      
      // Input validation
      if (!formData) {
        return res.status(400).json({
          error: "Form data is required.",
        });
      }

      const {
        businessName,
        ein,
        entityType,
        state,
        startDate,
        utilization,
        tradeLines,
        annualRevenue,
        latePayments,
        derogatories,
        ownerFico,
        creditHistory,
        fundingGoal,
        targetLimit,
        timeframe
      } = formData;

      // Validate required fields
      if (!businessName || !ein || !entityType || !state || !startDate || 
          utilization === undefined || tradeLines === undefined || !annualRevenue || 
          latePayments === undefined || ownerFico === undefined || 
          creditHistory === undefined || !fundingGoal || !targetLimit || !timeframe) {
        return res.status(400).json({
          error: "All required fields must be completed.",
        });
      }

      console.log(`Generating credit roadmap for: ${businessName} (${entityType}) - Target: ${targetLimit}`);

      // Build credit commander prompt with all user inputs
      const creditRoadmapPrompt = `You are a business credit expert specializing in actionable credit-building strategies.

Generate a comprehensive credit roadmap for:
- Business Name: ${businessName}
- EIN: ${ein}
- Entity Type: ${entityType}
- State: ${state}
- Business Age: Started ${startDate}

CURRENT CREDIT PROFILE:
- Credit Utilization: ${utilization}%
- Trade Lines: ${tradeLines}
- Annual Revenue: ${annualRevenue}
- Late Payments (90d): ${latePayments}
- Derogatories/Collections: ${derogatories || 'None reported'}

OWNER PROFILE:
- Owner FICO Score: ${ownerFico}
- Credit History: ${creditHistory} years

GOALS:
- Funding Goal: ${fundingGoal}
- Target Credit Limit: ${targetLimit}
- Timeframe: ${timeframe}

Generate a JSON object with these fields:
{
  "profileSummary": "Write 2-3 paragraphs (200-250 words) analyzing this business's current credit position. Reference actual numbers (${utilization}% utilization, ${tradeLines} trade lines, FICO ${ownerFico}). Identify key strengths and improvement opportunities.",
  
  "quickWins": "Write 1-2 paragraphs listing 3-5 immediate actions they can take within 30 days to boost credit signals. Be specific and actionable (e.g., 'Reduce utilization from ${utilization}% to under 30%', 'Add 2 starter trade lines with Uline and Quill').",
  
  "tradeLinesPlan": "Write 2-3 paragraphs explaining a tiered approach: (1) Starter vendors (Uline, Quill, Grainger), (2) Net-30 accounts (Home Depot Business, Office Depot), (3) Revolving tradelines. Provide specific vendor names and qualification requirements based on their ${creditHistory} year history.",
  
  "vendorRecommendations": [
    {
      "name": "Vendor name (e.g., 'Uline')",
      "tier": "Starter|Net-30|Revolving",
      "minFico": minimum FICO score required (number),
      "reportsBureaus": ["Dun & Bradstreet", "Experian", etc.],
      "reason": "Why this vendor is recommended for their specific profile (1 sentence)",
      "approvalOdds": "High|Medium|Low based on their FICO ${ownerFico} and ${tradeLines} tradelines"
    }
  ],
  
  "cardStrategy": "Write 2-3 paragraphs detailing which business cards to apply for based on FICO ${ownerFico} and ${tradeLines} tradelines. Suggest specific cards (e.g., Amex Blue Business, Chase Ink, Capital One Spark) in order, with timing and utilization strategies to reach ${targetLimit}.",
  
  "cardRecommendations": [
    {
      "name": "Card name (e.g., 'American Express Blue Business Cash')",
      "issuer": "Amex|Chase|Capital One|etc.",
      "minFico": minimum FICO score required (number),
      "expectedLimit": "Estimated starting limit based on their profile (e.g., '$5,000-$10,000')",
      "reason": "Why this card is recommended for their specific profile (1 sentence)",
      "approvalOdds": "High|Medium|Low based on their FICO ${ownerFico}, ${tradeLines} tradelines, and ${creditHistory} year history",
      "applyOrder": sequence number (1, 2, 3) for when to apply
    }
  ],
  
  "bankingSignals": "Write 1-2 paragraphs on optimizing banking relationships for credit building. Cover business checking with ${annualRevenue} revenue deposits, D&B registration and DUNS number, Experian profile setup, and revenue verification.",
  
  "actionPlan": "Write a clear 30/60/90-day timeline with specific milestones for the ${timeframe} timeframe. Include: 30 days (immediate actions), 60 days (trade line maturation), 90 days (card applications and limit increases). Be concrete with dates and deliverables.",
  
  "riskFlags": "Write 1-2 paragraphs identifying red flags from the profile: ${latePayments > 0 ? latePayments + ' late payments (address immediately)' : 'no late payments (good)'}, ${utilization > 30 ? utilization + '% utilization (reduce below 30%)' : 'healthy utilization'}, ${derogatories ? 'derogatories present: ' + derogatories + ' (dispute if incorrect)' : 'no derogatories'}. Include compliance guidance on credit reporting and FCRA rights."
}

IMPORTANT: 
- Reference actual data points from the profile throughout
- Provide specific vendor names, card products, and dollar amounts
- Be direct and actionable - this is a working roadmap
- Consider the ${timeframe} timeframe in your recommendations
- Ground all advice in the provided credit metrics
- Return ONLY valid JSON, no explanations`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: getCreditCommanderSystemPrompt()
          },
          {
            role: "user",
            content: creditRoadmapPrompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 3000,
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');

      const response = {
        profileSummary: aiResponse.profileSummary || `Credit roadmap for ${businessName}.`,
        quickWins: aiResponse.quickWins || 'Focus on reducing utilization and adding trade lines.',
        tradeLinesPlan: aiResponse.tradeLinesPlan || 'Build trade lines with starter vendors.',
        vendorRecommendations: aiResponse.vendorRecommendations || [],
        cardStrategy: aiResponse.cardStrategy || 'Apply for business cards based on your profile.',
        cardRecommendations: aiResponse.cardRecommendations || [],
        bankingSignals: aiResponse.bankingSignals || 'Optimize banking relationships and data signals.',
        actionPlan: aiResponse.actionPlan || `Complete credit roadmap within ${timeframe}.`,
        riskFlags: aiResponse.riskFlags || 'Address any late payments and derogatories.'
      };

      console.log("Credit roadmap generated successfully");

      // Increment usage counter AFTER successful generation (atomic operation with limit enforcement)
      const incrementResult = await incrementUsage(req, tool);
      
      // If increment failed due to limit (race condition), reject the request
      if (!incrementResult.success && incrementResult.limitReached) {
        console.log(`[Express] /api/generate - Request completed but limit reached during increment for ${tool}: ${incrementResult.count}/30`);
        return res.status(429).json({
          error: `You have reached your 30-report limit for the ${toolName} soft launch. Please upgrade to continue.`,
          limitReached: true,
          count: incrementResult.count,
          limit: 30,
          tool
        });
      }

      res.json(response);
    } catch (error: any) {
      console.error("Error in /api/generate:", error);

      // Handle specific OpenAI errors
      if (error.code === "insufficient_quota") {
        return res.status(503).json({
          error: "Service temporarily unavailable. Please try again later.",
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          error: "Too many requests. Please wait a moment and try again.",
        });
      }

      if (error.status === 401) {
        return res.status(401).json({
          error: "Authentication failed. Please check API configuration.",
        });
      }

      // Generic error response
      res.status(500).json({
        error: "An unexpected error occurred. Please try again.",
      });
    }
  });

  // API endpoint for explaining credit roadmap (unlimited per report, no usage cap)
  app.post("/api/explain", async (req, res) => {
    const { roadmap, formData } = req.body;

    try {
      console.log('[Express] /api/explain - Generating plain-English explanation');

      // Input validation
      if (!roadmap || !formData) {
        return res.status(400).json({
          error: "Roadmap and form data are required.",
        });
      }

      const { businessName, utilization, tradeLines, ownerFico, fundingGoal, targetLimit, timeframe } = formData;

      // Sanitize user inputs for prompt (prevent JSON breaking)
      const sanitizeForPrompt = (str: any) => {
        if (typeof str !== 'string') return String(str || '');
        return str.replace(/["\n\r]/g, ' ').trim();
      };

      // Build targeted explanation prompt
      const explanationPrompt = `You are a business credit advisor translating technical credit reports into clear, actionable guidance for business owners.

Given this credit roadmap for ${sanitizeForPrompt(businessName)}:
- Current Utilization: ${utilization}%
- Trade Lines: ${tradeLines}
- Owner FICO: ${ownerFico}
- Funding Goal: ${sanitizeForPrompt(fundingGoal)}
- Target Limit: ${sanitizeForPrompt(targetLimit)}
- Timeframe: ${sanitizeForPrompt(timeframe)}

Full Roadmap Data:
${JSON.stringify(roadmap, null, 2)}

Generate a plain-English explanation as a JSON object with these fields:
{
  "keyTakeaways": "Write 2-3 sentences summarizing the most important insights from this roadmap. What does this business need to know RIGHT NOW?",
  
  "priorityActions": "List the top 3 immediate actions they should take this month. Be ultra-specific (e.g., 'Pay down your credit cards to reduce utilization from ${utilization}% to below 30%').",
  
  "timeline": "Explain their ${timeframe} timeline in simple terms. What happens in the first 30 days? Next 60 days? By 90 days?",
  
  "bottomLine": "Write 1-2 sentences answering: 'Can I reach my ${targetLimit} goal?' Be honest and direct."
}

IMPORTANT:
- Use everyday language, not credit jargon
- Be encouraging but honest
- Reference their actual numbers
- Make it feel like advice from a trusted advisor, not a robot`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a business credit advisor who explains complex credit strategies in simple, friendly language. Focus on clarity and actionability."
          },
          {
            role: "user",
            content: explanationPrompt,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const explanation = JSON.parse(completion.choices[0].message.content || "{}");

      console.log('[Express] /api/explain - Explanation generated successfully');

      res.json({
        success: true,
        explanation
      });

    } catch (error: any) {
      console.error("Error in /api/explain:", error);

      // Handle specific OpenAI errors
      if (error.code === "insufficient_quota") {
        return res.status(503).json({
          error: "Service temporarily unavailable. Please try again later.",
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          error: "Too many requests. Please wait a moment and try again.",
        });
      }

      // Generic error response
      res.status(500).json({
        error: "Failed to generate explanation. Please try again.",
      });
    }
  });

  // Save a compliance report (uses browser client ID)
  app.post("/api/reports/save", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }
      
      const reportData = insertComplianceReportSchema.parse(req.body);
      
      // Sanitize HTML content before saving
      const sanitizedData = {
        ...reportData,
        htmlContent: sanitizeHtmlContent(reportData.htmlContent),
        userId: userId, // Force ownership to authenticated user
        ownerId: '', // Clear legacy ownerId field
      };
      
      const [savedReport] = await db
        .insert(complianceReports)
        .values(sanitizedData)
        .returning();

      res.json(savedReport);
    } catch (error: any) {
      console.error("Error saving report:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(400).json({
          error: "Failed to save report. Please try again.",
        });
      } else {
        res.status(400).json({
          error: "Failed to save report. Please check your input.",
          details: error.message,
        });
      }
    }
  });

  // List all saved reports (filtered by toolkit and ownership) - uses browser client ID
  app.get("/api/reports/list", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const toolkit = req.query.toolkit as string;
      if (!toolkit) {
        return res.status(400).json({
          error: "toolkit query parameter is required",
        });
      }

      // Filter by authenticated user's ID only
      // Backward compatibility: Also retrieve legacy 'grantgenie' reports when requesting 'creditcommander'
      const toolkitFilter = toolkit === 'creditcommander' 
        ? or(
            eq(complianceReports.toolkitCode, 'creditcommander'),
            eq(complianceReports.toolkitCode, 'grantgenie')
          )
        : eq(complianceReports.toolkitCode, toolkit);

      const reports = await db
        .select({
          id: complianceReports.id,
          name: complianceReports.name,
          entityName: complianceReports.entityName,
          entityType: complianceReports.entityType,
          jurisdiction: complianceReports.jurisdiction,
          filingType: complianceReports.filingType,
          deadline: complianceReports.deadline,
          checksum: complianceReports.checksum,
          createdAt: complianceReports.createdAt,
        })
        .from(complianceReports)
        .where(and(
          toolkitFilter,
          eq(complianceReports.userId, userId)
        ))
        .orderBy(desc(complianceReports.createdAt));

      res.json(reports);
    } catch (error: any) {
      console.error("Error listing reports:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to retrieve reports. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to retrieve reports.",
          details: error.message,
        });
      }
    }
  });

  // Get a specific report by ID (with ownership validation) - uses browser client ID
  app.get("/api/reports/:id", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { id } = req.params;
      
      const [report] = await db
        .select()
        .from(complianceReports)
        .where(and(
          eq(complianceReports.id, id),
          eq(complianceReports.userId, userId) // Enforce ownership
        ));

      if (!report) {
        return res.status(404).json({
          error: "Report not found.",
        });
      }

      res.json(report);
    } catch (error: any) {
      console.error("Error retrieving report:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to retrieve report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to retrieve report.",
          details: error.message,
        });
      }
    }
  });

  // Delete a specific report by ID (with ownership validation) - uses browser client ID
  app.delete("/api/reports/:id", async (req, res) => {
    try {
      // Get anonymous user ID from browser client ID
      let userId;
      try {
        userId = getAnonymousUserId(req);
      } catch (error: any) {
        if (error.message === 'X-Client-Id header is required') {
          return res.status(400).json({ error: 'X-Client-Id header is required' });
        }
        throw error;
      }

      const { id } = req.params;
      
      // Delete only if owned by the authenticated user
      const result = await db
        .delete(complianceReports)
        .where(and(
          eq(complianceReports.id, id),
          eq(complianceReports.userId, userId) // Enforce ownership
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({
          error: "Report not found or access denied.",
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting report:", error);
      
      // Production-safe error response
      if (process.env.NODE_ENV === 'production') {
        res.status(500).json({
          error: "Failed to delete report. Please try again.",
        });
      } else {
        res.status(500).json({
          error: "Failed to delete report.",
          details: error.message,
        });
      }
    }
  });

  // Stub endpoint for merging guest owner to authenticated user (future feature)
  app.post("/api/merge-owner", async (req, res) => {
    try {
      const { owner_id } = req.body;
      
      // No-op for now - will implement when authentication is added
      // This will merge reports from owner_id to the authenticated user's userId
      
      res.json({ success: true, message: "Merge endpoint ready for future auth implementation" });
    } catch (error: any) {
      console.error("Error in merge-owner:", error);
      res.status(500).json({
        error: "Merge operation failed.",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
