import { createSupabaseServerClient } from '../../../lib/supabaseClient';

// Simple test endpoint to check table access
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Test 1: Can we access the table?
    console.log('🔍 [PARTNERS_TEST] Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('partners')
      .select('*')
      .limit(1);
    
    if (testError) {
      return res.status(500).json({
        error: 'Cannot access partners table',
        details: {
          message: testError.message,
          code: testError.code,
          details: testError.details,
          hint: testError.hint
        }
      });
    }

    // Test 2: Try to get table structure info
    const { data: allData, error: allError } = await supabase
      .from('partners')
      .select('*')
      .limit(5);

    return res.status(200).json({
      success: true,
      message: 'Table is accessible',
      testDataCount: testData?.length || 0,
      sampleData: allData || [],
      note: 'If you see this, the table exists and is accessible. Check RLS policies if inserts fail.'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Test failed',
      details: error.message
    });
  }
}

