export default async function handler(req, res) {
  try {
    console.log('🔍 [TEST_PROFILE_SIMPLE] Testing profile API...');
    
    // Test 1: Check if we can get a session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    console.log('🔍 [TEST_PROFILE_SIMPLE] Token received:', {
      hasToken: !!token,
      tokenLength: token.length,
      tokenStart: token.substring(0, 10) + '...'
    });
    
    // Test 2: Try to create Supabase client
    let supabaseClient;
    try {
      const { createSupabaseServerClient } = await import('../../lib/supabaseClient');
      supabaseClient = createSupabaseServerClient();
      console.log('✅ [TEST_PROFILE_SIMPLE] Supabase client created successfully');
    } catch (error) {
      console.error('❌ [TEST_PROFILE_SIMPLE] Supabase client creation failed:', error.message);
      return res.status(500).json({
        error: 'Supabase client creation failed',
        details: error.message
      });
    }
    
    // Test 3: Try to verify the token
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      
      if (authError || !user) {
        console.error('❌ [TEST_PROFILE_SIMPLE] Auth error:', {
          error: authError?.message,
          hasUser: !!user
        });
        return res.status(401).json({ 
          error: 'Invalid or expired token',
          details: authError?.message
        });
      }
      
      console.log('✅ [TEST_PROFILE_SIMPLE] User authenticated:', {
        userId: user.id,
        email: user.email
      });
      
      return res.status(200).json({
        message: 'Profile test successful',
        user: {
          id: user.id,
          email: user.email
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ [TEST_PROFILE_SIMPLE] Auth verification failed:', error.message);
      return res.status(500).json({
        error: 'Auth verification failed',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('❌ [TEST_PROFILE_SIMPLE] Test failed:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    });
  }
}
