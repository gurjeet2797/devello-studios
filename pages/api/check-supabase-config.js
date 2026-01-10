// Diagnostic endpoint to check Supabase OAuth configuration
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        vercelUrl: process.env.VERCEL_URL,
        productionUrl: process.env.PRODUCTION_URL || 'https://develloinc.com'
      },
      supabase: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        urlMatches: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') || false
      },
      recommendations: []
    };

    // Check for common issues
    if (!config.supabase.hasUrl) {
      config.recommendations.push('NEXT_PUBLIC_SUPABASE_URL is missing in Vercel environment variables');
    }
    
    if (!config.supabase.hasAnonKey) {
      config.recommendations.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in Vercel environment variables');
    }

    if (config.supabase.url && !config.supabase.urlMatches) {
      config.recommendations.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
    }

    // OAuth configuration recommendations
    config.oauthConfig = {
      siteUrl: `Should be set to: ${config.environment.productionUrl}`,
      redirectUrls: [
        `${config.environment.productionUrl}/auth/callback`,
        `${config.supabase.url}/auth/v1/callback`
      ],
      instructions: [
        '1. Go to Supabase Dashboard > Authentication > URL Configuration',
        `2. Set Site URL to: ${config.environment.productionUrl}`,
        `3. Add Redirect URL: ${config.environment.productionUrl}/auth/callback`,
        '4. Ensure Google OAuth provider is enabled',
        '5. Verify Google OAuth Client ID and Secret are correct',
        '6. Check that redirect URLs match in both Google Cloud Console and Supabase'
      ]
    };

    return res.status(200).json({
      success: config.recommendations.length === 0,
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Configuration check failed',
      message: error.message
    });
  }
}

