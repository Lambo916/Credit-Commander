import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import sanitizeHtml from 'sanitize-html';
import { getDb } from '../_lib/db-serverless.js';
import { complianceReports, insertComplianceReportSchema } from '../_lib/schema.js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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

// Get anonymous user ID from browser-provided client ID
function getAnonymousUserId(req: VercelRequest): string {
  const clientId = req.headers['x-client-id'] as string;
  if (!clientId) {
    throw new Error('X-Client-Id header is required');
  }
  return `anon_${clientId}`;
}

// Helper for CORS
function setCORS(res: VercelResponse, origin: string | undefined) {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const allowedOrigins = [
    'https://grant.yourbizguru.com',
    /https:\/\/.*\.vercel\.app$/,
    /https:\/\/.*\.replit\.dev$/,
  ];

  if (isDevelopment && origin?.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Id');
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler for /api/reports/save
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  setCORS(res, origin);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get anonymous user ID from browser client ID (until full auth is implemented)
    let userId;
    try {
      userId = getAnonymousUserId(req);
    } catch (error: any) {
      if (error.message === 'X-Client-Id header is required') {
        return res.status(400).json({ error: 'X-Client-Id header is required' });
      }
      throw error;
    }

    const body = req.body as any;

    // Validate input
    const validation = insertComplianceReportSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validation.error.errors 
      });
    }

    const data = validation.data;

    // Sanitize HTML content
    const sanitizedHtml = sanitizeHtmlContent(data.htmlContent);

    // Generate checksum for duplicate detection
    const checksum = crypto
      .createHash('md5')
      .update(`${data.entityName}-${data.jurisdiction}-${data.filingType}`)
      .digest('hex');

    const db = getDb();
    
    const [newReport] = await db
      .insert(complianceReports)
      .values({
        userId,
        toolkitCode: data.toolkitCode || 'creditcommander',
        name: data.name,
        entityName: data.entityName,
        entityType: data.entityType,
        jurisdiction: data.jurisdiction,
        filingType: data.filingType,
        deadline: data.deadline,
        htmlContent: sanitizedHtml,
        checksum,
        ownerId: data.ownerId || '',
        metadata: data.metadata || {},
      })
      .returning();

    return res.status(200).json(newReport);

  } catch (error: any) {
    console.error('[Vercel] /api/reports/save - Error:', error);
    
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
