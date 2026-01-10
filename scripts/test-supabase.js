const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test Supabase connection

try {
  const supabase = createClient(
    `https://${process.env.POSTGRES_HOST}`,
    process.env.SUPABASE_ANON_KEY
  );
  
  // Test connection
  const { data, error } = await supabase.from('users').select('count').limit(1);
  
  if (error) {
    console.error('❌ [TEST] Connection failed:', error.message);
  } else {
  }
} catch (error) {
  console.error('❌ [TEST] Connection error:', error.message);
} 
