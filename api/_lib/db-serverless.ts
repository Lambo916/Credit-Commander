import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Serverless-compatible database client for Vercel
// Uses PostgreSQL connection pool optimized for serverless environments

let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Create PostgreSQL connection pool for Supabase
    // Configuration optimized for serverless/edge environments
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false // Required for Supabase connections
      },
      max: 1, // Serverless functions should use minimal connections
      idleTimeoutMillis: 10000, // Close idle connections quickly in serverless
      connectionTimeoutMillis: 10000, // Timeout after 10 seconds if can't connect
    });

    db = drizzle(pool, { schema });
  }

  return db;
}

// Cleanup function for serverless environments
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

// Export for direct use
export { schema };
