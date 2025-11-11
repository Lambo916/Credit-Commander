import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import { getDb } from './_lib/db-serverless.js';
import { validateEnv } from './config.js';
import OpenAI from 'openai';
import { resolveProfile } from './_lib/filing-profiles.js';
import { complianceReports, insertComplianceReportSchema } from './_lib/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';

// Validate environment on cold start
try {
  validateEnv();
} catch (error: any) {
  console.error('Environment validation failed:', error.message);
}

// Initialize Supabase client (fail hard if not configured)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: SUPABASE_URL and SUPABASE_ANON_KEY must be set in production');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

// Authenticate request and extract user ID (fail hard on errors)
async function authenticateRequest(req: VercelRequest): Promise<string> {
  const authHeader = req.headers.authorization as string;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  if (!supabase) {
    // Fail hard if Supabase is not configured
    console.error('CRITICAL: Supabase client not initialized');
    throw new Error('AUTH_SERVICE_UNAVAILABLE');
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.warn('Invalid auth token:', error?.message);
      throw new Error('UNAUTHORIZED');
    }

    return user.id;
  } catch (error: any) {
    console.error('Auth error:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'AUTH_SERVICE_UNAVAILABLE') {
      throw error;
    }
    throw new Error('UNAUTHORIZED');
  }
}

// Helper for CORS (production-locked with development support)
function setCORS(res: VercelResponse, origin: string | undefined) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const allowedOrigins = [
    'https://grant.yourbizguru.com',
    /https:\/\/.*\.vercel\.app$/,
  ];

  // In development, also allow localhost
  if (isDevelopment && origin?.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler - wrapped in comprehensive error handling
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ALWAYS set CORS headers first
  const origin = req.headers.origin as string | undefined;
  setCORS(res, origin);

  // Ensure JSON content type for all responses
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url = '', method = 'GET' } = req;
  const path = url.split('?')[0];

  // Log incoming request for debugging
  console.log(`[Vercel] ${method} ${path}`);

  try {
    // Route: /api/db/ping (Database health check - public)
    if (path.endsWith('/api/db/ping') && method === 'GET') {
      try {
        const db = getDb();
        const result = await db.execute(sql`SELECT 1 as ping`);
        return res.json({ 
          ok: true, 
          result: result.rows[0],
          database: 'connected'
        });
      } catch (error: any) {
        console.error("Database health check failed:", error);
        return res.status(500).json({ 
          ok: false, 
          error: 'Database connection failed',
          database: 'disconnected'
        });
      }
    }

    // Route: /api/auth/config (public - anon key is meant to be public)
    if (path.endsWith('/api/auth/config') && method === 'GET') {
      if (supabaseUrl && supabaseAnonKey) {
        return res.json({
          supabaseUrl,
          supabaseAnonKey,
          authEnabled: true
        });
      } else {
        return res.json({
          authEnabled: false,
          message: "Authentication service not configured"
        });
      }
    }

    // Route: /api/generate (POST) - public (for report generation)
    if (path.endsWith('/api/generate') && method === 'POST') {
      console.log('[Vercel] /api/generate - Starting report generation');
      
      const { formData } = req.body as any;
      
      if (!formData) {
        console.error('[Vercel] /api/generate - Missing formData');
        return res.status(400).json({ error: 'formData is required' });
      }

      console.log('[Vercel] /api/generate - Form data:', {
        filingType: formData.filingType,
        jurisdiction: formData.jurisdiction,
        entityType: formData.entityType
      });

      // Try pre-built profile first
      const profile = resolveProfile(
        formData.filingType || '',
        formData.jurisdiction || '',
        formData.entityType || ''
      );

      let reportHtml = '';
      
      if (profile) {
        console.log('[Vercel] /api/generate - Using pre-built profile:', profile.name);
        
        // Generate HTML from profile
        const checklistHtml = profile.checklist.map(item => 
          `<li><strong>${item.label}:</strong> ${item.description}</li>`
        ).join('\n');
        
        reportHtml = `<h2>Filing Profile: ${profile.name}</h2>
<h3>Requirements Checklist</h3>
<ul>${checklistHtml}</ul>`;
      } else {
        console.log('[Vercel] /api/generate - Using OpenAI for report generation');
        
        try {
          const ai = getOpenAI();
          const prompt = `Generate a compliance report for:
Entity: ${formData.entityName}
Type: ${formData.entityType}
Jurisdiction: ${formData.jurisdiction}
Filing Type: ${formData.filingType}
Deadline: ${formData.deadline || 'Not specified'}`;

          console.log('[Vercel] /api/generate - Calling OpenAI API...');
          
          // Add timeout protection for OpenAI call (9 seconds to be safe)
          const completion = await Promise.race([
            ai.chat.completions.create({
              model: "gpt-4o",
              messages: [{
                role: "system",
                content: "You are Credit Commander, an AI business credit building assistant. Generate professional credit roadmaps in HTML format with structured sections."
              }, {
                role: "user",
                content: prompt
              }],
              max_tokens: 4000,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('OpenAI API timeout')), 9000)
            )
          ]) as any;

          console.log('[Vercel] /api/generate - OpenAI API call completed');
          reportHtml = completion.choices[0].message.content || '';
        } catch (error: any) {
          console.error('[Vercel] /api/generate - OpenAI error:', error.message);
          
          // Return a friendly error instead of crashing
          return res.status(500).json({ 
            error: 'Failed to generate report. Please try again.',
            details: error.message 
          });
        }
      }

      console.log('[Vercel] /api/generate - Report generated successfully');
      return res.json({ reportHtml });
    }

    // All routes below require authentication
    let userId: string;
    try {
      userId = await authenticateRequest(req);
    } catch (error: any) {
      if (error.message === 'AUTH_SERVICE_UNAVAILABLE') {
        return res.status(503).json({ error: 'Authentication service temporarily unavailable.' });
      }
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Route: /api/reports/save (POST) - requires authentication
    if (path.endsWith('/api/reports/save') && method === 'POST') {
      // Strip any user-controlled fields that should be server-controlled
      const { userId: _, ownerId: __, ...sanitizedBody } = req.body as any;
      
      // Validate request body
      const reportData = insertComplianceReportSchema.parse(sanitizedBody);
      
      // Sanitize HTML content and enforce ownership
      const finalData = {
        ...reportData,
        htmlContent: sanitizeHtmlContent(reportData.htmlContent),
        userId: userId, // Always use authenticated user ID
        ownerId: '', // Clear ownerId in production
      };

      const db = getDb();
      const [report] = await db.insert(complianceReports).values(finalData).returning();
      
      return res.json(report);
    }

    // Route: /api/reports/list (GET) - requires authentication
    if (path.endsWith('/api/reports/list') && method === 'GET') {
      const toolkitCode = req.query.toolkit as string;

      if (!toolkitCode) {
        return res.status(400).json({ error: 'toolkit query parameter is required' });
      }

      const db = getDb();
      
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
          eq(complianceReports.toolkitCode, toolkitCode),
          eq(complianceReports.userId, userId)
        ))
        .orderBy(desc(complianceReports.createdAt));

      return res.json(reports);
    }

    // Route: /api/reports/:id (GET) - requires authentication
    if (path.match(/\/api\/reports\/[^/]+$/) && method === 'GET') {
      const id = path.split('/').pop() as string;
      const db = getDb();
      
      const [report] = await db
        .select()
        .from(complianceReports)
        .where(and(
          eq(complianceReports.id, id),
          eq(complianceReports.userId, userId)
        ));

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      return res.json(report);
    }

    // Route: /api/reports/:id (DELETE) - requires authentication
    if (path.match(/\/api\/reports\/[^/]+$/) && method === 'DELETE') {
      const id = path.split('/').pop() as string;
      const db = getDb();
      
      const result = await db
        .delete(complianceReports)
        .where(and(
          eq(complianceReports.id, id),
          eq(complianceReports.userId, userId)
        ))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Report not found or access denied' });
      }

      return res.json({ success: true });
    }

    // No route matched
    return res.status(404).json({ error: 'Not found' });

  } catch (error: any) {
    console.error('[Vercel] API error:', error);
    console.error('[Vercel] Error stack:', error.stack);
    console.error('[Vercel] Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // ALWAYS return JSON, never let Vercel show HTML error page
    try {
      return res.status(500).json({ 
        error: 'Something went wrong. Please try again later.',
        ...(process.env.NODE_ENV !== 'production' && { 
          debug: error.message,
          stack: error.stack 
        })
      });
    } catch (jsonError) {
      // Last resort: if JSON serialization fails, send plain text JSON
      res.status(500).send(JSON.stringify({ 
        error: 'Internal server error' 
      }));
    }
  }
}
