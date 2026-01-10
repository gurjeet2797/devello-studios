import { requireAdmin } from '../../lib/adminAuth';

async function handler(req, res) {
  // SECURITY: Only allow in development, or require admin auth in production
  if (process.env.NODE_ENV === 'production') {
    // In production, this endpoint is completely disabled for security
    return res.status(404).json({ error: 'Not found' });
  }

  const envCheck = {
    // Supabase Configuration - only boolean flags, no actual values
    supabase: {
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      // SECURITY: Never expose actual URLs or keys
      nextPublicAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    },
    
    // Database Configuration - only boolean flags, never expose DATABASE_URL
    database: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresHost: !!process.env.POSTGRES_HOST,
      hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
      // SECURITY: Never expose any part of DATABASE_URL (could contain password)
    },
    
    // Environment Info
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      vercelRegion: process.env.VERCEL_REGION,
    },
    
    // Other important vars
    other: {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    }
  };

  // Check for common issues
  const issues = [];
  
  if (!envCheck.supabase.hasNextPublicUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  
  if (!envCheck.supabase.hasNextPublicAnonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }
  
  if (!envCheck.supabase.hasServiceRoleKey) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  
  if (!envCheck.database.hasDatabaseUrl) {
    issues.push('DATABASE_URL is missing');
  }

  return res.status(200).json({
    message: 'Environment debug completed',
    env: envCheck,
    issues: issues,
    timestamp: new Date().toISOString()
  });
}

// SECURITY: In production, require admin auth. In development, allow access.
export default process.env.NODE_ENV === 'production' 
  ? requireAdmin(handler)
  : handler;
