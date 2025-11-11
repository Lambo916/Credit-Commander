import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db-serverless.js';
import { usageTracking } from '../_lib/schema.js';
import { eq, and } from 'drizzle-orm';

// Get client IP address from request
function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  
  return typeof ip === 'string' ? ip.trim() : 'unknown';
}

// Normalize and validate tool parameter (prevent bypass via case/variant strings)
function normalizeTool(tool: any): 'creditcommander' {
  // Always return 'creditcommander' - Credit Commander is the only active toolkit
  return 'creditcommander';
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler for /api/usage/check
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
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      return res.status(400).json({ error: 'Unable to determine client IP address' });
    }

    // Normalize and validate tool parameter (prevent usage cap bypass)
    const tool = normalizeTool(req.query.tool);

    const db = getDb();
    
    // Check if usage record exists for this IP and tool
    const usageRecord = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool)
      ))
      .limit(1);

    const reportCount = usageRecord.length > 0 ? usageRecord[0].reportCount : 0;
    const hasReachedLimit = reportCount >= 30;

    return res.status(200).json({
      reportCount,
      hasReachedLimit,
      limit: 30,
      tool
    });

  } catch (error: any) {
    console.error('[Vercel] /api/usage/check - Error:', error);
    
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
