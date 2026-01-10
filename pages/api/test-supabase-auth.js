export default async function handler(req, res) {
  try {
    console.log('🔍 [TEST_SUPABASE_AUTH] Testing Supabase authentication...');
    
    // Test 1: Check environment variables
    const envCheck = {
      hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasNextPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    };
    
    console.log('🔍 [TEST_SUPABASE_AUTH] Environment check:', envCheck);
    
    // Test 2: Try to create Supabase client
    let supabaseClient;
    try {
      const { createSupabaseServerClient } = await import('../../lib/supabaseClient');
      supabaseClient = createSupabaseServerClient();
      console.log('✅ [TEST_SUPABASE_AUTH] Supabase client created successfully');
    } catch (error) {
      console.error('❌ [TEST_SUPABASE_AUTH] Supabase client creation failed:', error.message);
      return res.status(500).json({
        error: 'Supabase client creation failed',
        details: error.message,
        env: envCheck
      });
    }
    
    // Test 3: Try to verify a dummy token (this will fail but shows if auth endpoint is reachable)
    try {
      const { data, error } = await supabaseClient.auth.getUser('dummy-token');
      console.log('✅ [TEST_SUPABASE_AUTH] Auth endpoint reachable (expected to fail with dummy token)');
      console.log('Auth response:', { data, error: error?.message });
    } catch (error) {
      console.error('❌ [TEST_SUPABASE_AUTH] Auth endpoint failed:', error.message);
      return res.status(500).json({
        error: 'Auth endpoint failed',
        details: error.message,
        env: envCheck
      });
    }
    
    return res.status(200).json({
      message: 'Supabase auth test completed',
      env: envCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [TEST_SUPABASE_AUTH] Test failed:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
}
