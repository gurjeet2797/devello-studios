const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupNewsletterPolicies() {
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Try to use service role key if available, otherwise use anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    
    // Test connection by trying to read from the table
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      
      if (error.message.includes('permission denied')) {
        return;
      }
    }
    
    
  } catch (error) {
    console.error('❌ Error setting up newsletter policies:', error);
  }
}

setupNewsletterPolicies();
