import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Middleware to extract and verify JWT from Authorization header
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // In development, allow bypass for testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (!token) {
      if (isDevelopment) {
        // Development bypass: allow anonymous requests with x-owner-id
        const ownerId = req.headers['x-owner-id'] as string;
        if (ownerId) {
          (req as any).user = {
            id: ownerId,
            email: null,
            metadata: { dev_bypass: true }
          };
          return next();
        }
      }
      
      // No token and not dev bypass - anonymous
      (req as any).user = null;
      return next();
    }

    if (!supabase) {
      console.error('Supabase client not initialized');
      (req as any).user = null;
      return next();
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token
      console.warn('Invalid auth token:', error?.message);
      (req as any).user = null;
      return next();
    }

    // Attach user to request
    (req as any).user = {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    (req as any).user = null;
    next();
  }
}

// Helper function to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ 
      error: 'Authentication required. Please sign in to continue.' 
    });
  }
  next();
}

// Get user ID from request (production-ready)
export function getUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.id || null;
}

// Check if user has access to a resource
export function hasAccess(resourceUserId: string | null, currentUserId: string | null): boolean {
  if (!resourceUserId || !currentUserId) {
    return false;
  }
  return resourceUserId === currentUserId;
}
