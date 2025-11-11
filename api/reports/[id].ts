import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db-serverless.js';
import { complianceReports } from '../_lib/schema.js';
import { eq, and } from 'drizzle-orm';
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
    'https://credit.yourbizguru.com',
    /https:\/\/.*\.vercel\.app$/,
    /https:\/\/.*\.replit\.dev$/,
  ];

  if (isDevelopment && origin?.startsWith('http://localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
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

  res.setHeader('Access-Control-Allow-Origin', allowOrigin && origin ? origin : 'https://credit.yourbizguru.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Id');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler for /api/reports/[id]
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  setCORS(res, origin);
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'DELETE') {
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

    // Extract ID from query (Vercel provides it as query parameter for dynamic routes)
    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: 'Report ID is required' });
    }

    const db = getDb();

    if (req.method === 'GET') {
      // Get report by ID
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

      return res.status(200).json(report);
    }

    if (req.method === 'DELETE') {
      // Delete report by ID
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

      return res.status(200).json({ success: true });
    }

  } catch (error: any) {
    console.error('[Vercel] /api/reports/[id] - Error:', error);
    
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
