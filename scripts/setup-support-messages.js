const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupSupportMessages() {
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Create the support_messages table
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
    } else {
    }
    
    // Test if we can access the table
    const { data: testData, error: testError } = await supabase
      .from('support_messages')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Table access failed:', testError.message);
      
      if (testError.message.includes('permission denied')) {
        return;
      }
    }
    
    
    // Test inserting a record
    const testMessage = {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      subject: 'Test Support Message',
      message: 'This is a test support message',
      status: 'new'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('support_messages')
      .insert([testMessage])
      .select();
    
    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return;
    }
    
    
    // Clean up test record
    const { error: deleteError } = await supabase
      .from('support_messages')
      .delete()
      .eq('id', insertData[0].id);
    
    if (deleteError) {
    } else {
    }
    
    
  } catch (error) {
    console.error('❌ Error setting up support messages:', error);
  }
}

setupSupportMessages();
