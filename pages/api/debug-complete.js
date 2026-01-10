import { createSupabaseServerClient } from '../../lib/supabaseClient';
import prisma from '../../lib/prisma';
import { requireAdmin } from '../../lib/adminAuth';

async function handler(req, res) {
  // SECURITY: Only allow in development, or require admin auth in production
  if (process.env.NODE_ENV === 'production') {
    // In production, this endpoint is completely disabled for security
    return res.status(404).json({ error: 'Not found' });
  }

  const debugResults = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    },
    tests: {}
  };

  // Test 1: Environment Variables - SECURITY: Never expose actual URLs or secrets
  debugResults.tests.environmentVariables = {
    supabase: {
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      // SECURITY: Never expose actual URLs or keys
      nextPublicAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    },
    database: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasPostgresHost: !!process.env.POSTGRES_HOST,
      hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
      // SECURITY: Never expose any part of DATABASE_URL (could contain password)
    },
    stripe: {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      hasBasicPriceId: !!process.env.STRIPE_BASIC_PRICE_ID,
      hasProPriceId: !!process.env.STRIPE_PRO_PRICE_ID,
      stripeKeyLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    }
  };

  // Test 2: Supabase Client Creation
  try {
    const supabase = createSupabaseServerClient();
    debugResults.tests.supabaseClient = {
      success: true,
      message: 'Supabase client created successfully'
    };
  } catch (error) {
    debugResults.tests.supabaseClient = {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }

  // Test 3: Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    debugResults.tests.databaseConnection = {
      success: true,
      message: 'Database connection successful'
    };
  } catch (error) {
    debugResults.tests.databaseConnection = {
      success: false,
      error: error.message,
      code: error.code
    };
  }

  // Test 4: Supabase Auth (if we have a test token)
  try {
    const supabase = createSupabaseServerClient();
    // Test with a dummy token to see if auth endpoint is reachable
    const { data, error } = await supabase.auth.getUser('dummy-token');
    debugResults.tests.supabaseAuth = {
      success: true,
      message: 'Supabase auth endpoint reachable',
      hasError: !!error,
      errorMessage: error?.message
    };
  } catch (error) {
    debugResults.tests.supabaseAuth = {
      success: false,
      error: error.message
    };
  }

  // Test 5: Check for common issues
  const issues = [];
  
  if (!debugResults.tests.environmentVariables.supabase.hasNextPublicUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  
  if (!debugResults.tests.environmentVariables.supabase.hasNextPublicAnonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  }
  
  if (!debugResults.tests.environmentVariables.supabase.hasServiceRoleKey) {
    issues.push('SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  
  if (!debugResults.tests.environmentVariables.database.hasDatabaseUrl) {
    issues.push('DATABASE_URL is missing');
  }
  
  if (!debugResults.tests.environmentVariables.stripe.hasBasicPriceId) {
    issues.push('STRIPE_BASIC_PRICE_ID is missing');
  }
  
  if (!debugResults.tests.environmentVariables.stripe.hasProPriceId) {
    issues.push('STRIPE_PRO_PRICE_ID is missing');
  }
  
  debugResults.issues = issues;
  debugResults.overallStatus = issues.length === 0 ? 'OK' : 'ISSUES_FOUND';

  return res.status(200).json(debugResults);
}

// SECURITY: In production, require admin auth. In development, allow access.
export default process.env.NODE_ENV === 'production' 
  ? requireAdmin(handler)
  : handler;
