import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db-serverless.js';
import { usageTracking } from '../_lib/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Get client IP address from request
function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
    : req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  
  return typeof ip === 'string' ? ip.trim() : 'unknown';
}

// Normalize and validate tool parameter (prevent bypass via case/variant strings)
function normalizeTool(tool: any): 'grantgenie' {
  // Always return 'grantgenie' since CompliPilot has been deprecated
  return 'grantgenie'; // All requests use grantgenie toolkit
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

  res.setHeader('Access-Control-Allow-Origin', allowOrigin && origin ? origin : 'https://grant.yourbizguru.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Main handler for /api/usage/increment
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
    const ipAddress = getClientIp(req);
    
    if (ipAddress === 'unknown') {
      return res.status(400).json({ error: 'Unable to determine client IP address' });
    }

    // Normalize and validate tool parameter (prevent usage cap bypass)
    const tool = normalizeTool(req.body?.tool);
    const toolName = 'GrantGenie'; // Always use GrantGenie since CompliPilot is deprecated

    const db = getDb();
    
    // Check if usage record exists for this IP and tool
    const existingRecord = await db
      .select()
      .from(usageTracking)
      .where(and(
        eq(usageTracking.ipAddress, ipAddress),
        eq(usageTracking.tool, tool)
      ))
      .limit(1);

    let newCount: number;

    if (existingRecord.length > 0) {
      // Check if already at limit
      if (existingRecord[0].reportCount >= 30) {
        console.log(`[Usage Increment] IP ${ipAddress} already at limit for ${tool}: ${existingRecord[0].reportCount}/30`);
        return res.status(429).json({
          reportCount: existingRecord[0].reportCount,
          hasReachedLimit: true,
          limit: 30,
          tool,
          error: `You have reached your 30-report limit for the ${toolName} soft launch. Please upgrade to continue.`
        });
      }
      
      // Update existing record
      const updated = await db
        .update(usageTracking)
        .set({
          reportCount: sql`${usageTracking.reportCount} + 1`,
          lastUpdated: new Date(),
        })
        .where(and(
          eq(usageTracking.ipAddress, ipAddress),
          eq(usageTracking.tool, tool)
        ))
        .returning();
      
      newCount = updated[0].reportCount;
    } else {
      // Create new record
      const inserted = await db
        .insert(usageTracking)
        .values({
          ipAddress,
          tool,
          reportCount: 1,
        })
        .returning();
      
      newCount = inserted[0].reportCount;
    }

    const hasReachedLimit = newCount >= 30;

    console.log(`[Usage Tracking] IP: ${ipAddress}, Tool: ${tool}, Count: ${newCount}, Limit Reached: ${hasReachedLimit}`);

    return res.status(200).json({
      reportCount: newCount,
      hasReachedLimit,
      limit: 30,
      tool
    });

  } catch (error: any) {
    console.error('[Vercel] /api/usage/increment - Error:', error);
    
    return res.status(500).json({ 
      error: 'Something went wrong. Please try again later.',
      ...(process.env.NODE_ENV !== 'production' && { debug: error.message })
    });
  }
}
