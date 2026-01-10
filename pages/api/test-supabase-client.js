// Test endpoint to verify Supabase client can be initialized
// This helps diagnose production environment variable issues
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables (server-side)
    const envCheck = {
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nextPublicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nextPublicAnonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };

    // Try to create a Supabase client
    let clientCreated = false;
    let clientError = null;
    
    try {
      const { createSupabaseAuthClient } = await import('../../lib/supabaseClient');
      const client = createSupabaseAuthClient();
      clientCreated = !!client;
    } catch (err) {
      clientError = {
        message: err.message,
        stack: err.stack
      };
    }

    const issues = [];
    if (!envCheck.hasNextPublicUrl) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL is missing - this will cause client-side sign-in to fail');
    }
    if (!envCheck.hasNextPublicAnonKey) {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing - this will cause client-side sign-in to fail');
    }
    if (envCheck.nextPublicUrl && !envCheck.nextPublicUrl.includes('supabase.co')) {
      issues.push('NEXT_PUBLIC_SUPABASE_URL does not look like a valid Supabase URL');
    }
    if (envCheck.nextPublicAnonKeyLength < 100) {
      issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be too short (should be ~200+ characters)');
    }

    return res.status(200).json({
      success: issues.length === 0 && clientCreated,
      env: envCheck,
      clientCreated,
      clientError,
      issues,
      recommendations: issues.length > 0 ? [
        'Check Vercel project settings > Environment Variables',
        'Ensure variables are prefixed with NEXT_PUBLIC_ for client-side access',
        'Redeploy after adding/updating environment variables',
        'Check that variables are set for the correct environment (Production/Preview/Development)'
      ] : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

