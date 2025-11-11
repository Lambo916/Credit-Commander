// Environment variable validation for serverless deployment

export function validateEnv() {
  const required = ['DATABASE_URL', 'OPENAI_API_KEY'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Please configure these in your Vercel project settings.`
    );
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgres')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate OPENAI_API_KEY format
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.startsWith('sk-')) {
    console.warn('OPENAI_API_KEY does not appear to be in the correct format (should start with sk-)');
  }

  return true;
}

export function getConfig() {
  return {
    databaseUrl: process.env.DATABASE_URL!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
