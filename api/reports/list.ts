import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db-serverless.js';
import { complianceReports } from '../_lib/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import crypto from 'crypto';

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler for /api/reports/list
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  setCORS(res, origin);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    return res.status(200).json(reports);

  } catch (error: any) {
    console.error('[Vercel] /api/reports/list - Error:', error);
    
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
