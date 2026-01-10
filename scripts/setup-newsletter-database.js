const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupNewsletterDatabase() {
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test if we can access the table
    const { data: testData, error: testError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table access failed:', testError.message);
      
      if (testError.message.includes('permission denied')) {
        return;
      }
    }
    
    
    // Test inserting a record
    const testEmail = `test-${Date.now()}@example.com`;
    
    const { data: insertData, error: insertError } = await supabase
      .from('newsletter_subscribers')
      .insert([
        { 
          email: testEmail,
          subscribed_at: new Date().toISOString(),
          status: 'active'
        }
      ])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return;
    }
    
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('email', testEmail);
    
    if (deleteError) {
    } else {
    }
    
    
  } catch (error) {
    console.error('❌ Error setting up newsletter database:', error);
  }
}

setupNewsletterDatabase();
