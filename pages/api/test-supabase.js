import { createSupabaseServerClient } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // Only allow in development or for debugging
  if (process.env.NODE_ENV === 'production' && req.headers['x-debug'] !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    console.log('🔍 [SUPABASE_TEST] Testing Supabase client creation...');
    
    // Test environment variables
    const envCheck = {
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('🔍 [SUPABASE_TEST] Environment check:', envCheck);
    
    // Try to create Supabase client
    let supabase;
    try {
      supabase = createSupabaseServerClient();
      console.log('✅ [SUPABASE_TEST] Supabase client created successfully');
    } catch (error) {
      console.error('❌ [SUPABASE_TEST] Failed to create Supabase client:', error);
      return res.status(500).json({
        error: 'Failed to create Supabase client',
        details: error.message,
        env: envCheck
      });
    }
    
    // Test a simple query
    try {
      const { data, error } = await supabase.auth.getUser('test-token');
      console.log('🔍 [SUPABASE_TEST] Test query result:', { hasData: !!data, hasError: !!error });
    } catch (queryError) {
      console.error('❌ [SUPABASE_TEST] Query test failed:', queryError);
    }
    
    return res.status(200).json({
      message: 'Supabase test completed',
      env: envCheck,
      supabaseClientCreated: !!supabase,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [SUPABASE_TEST] Test failed:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
}
