const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupNewsletterRLS() {
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Enable RLS on the table
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
    }
    
    // Create policy for public inserts
    
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Allow public newsletter subscriptions" 
        ON newsletter_subscribers 
        FOR INSERT 
        TO public 
        WITH CHECK (true);
      `
    });
    
    if (policyError) {
    }
    
    // Create policy for public selects (for duplicate checking)
    
    const { error: selectPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Allow public newsletter reads" 
        ON newsletter_subscribers 
        FOR SELECT 
        TO public 
        USING (true);
      `
    });
    
    if (selectPolicyError) {
    }
    
    
  } catch (error) {
    console.error('❌ Error setting up RLS policies:', error);
  }
}

setupNewsletterRLS();
