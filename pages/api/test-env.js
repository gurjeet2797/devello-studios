import { requireAdmin } from '../../lib/adminAuth';

async function handler(req, res) {
  // SECURITY: Only allow in development, or require admin auth in production
  if (process.env.NODE_ENV === 'production') {
    // In production, this endpoint is completely disabled for security
    return res.status(404).json({ error: 'Not found' });
  }

  const envCheck = {
    hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasNextPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresHost: !!process.env.POSTGRES_HOST,
    hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
    nodeEnv: process.env.NODE_ENV,
    // SECURITY: Never expose actual URLs or keys, only lengths
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  };

  return res.status(200).json({
    message: 'Environment check completed',
    env: envCheck,
    timestamp: new Date().toISOString()
  });
}

// SECURITY: In production, require admin auth. In development, allow access.
export default process.env.NODE_ENV === 'production' 
  ? requireAdmin(handler)
  : handler;
