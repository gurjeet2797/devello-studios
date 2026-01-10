require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupPartnersTable() {
  console.log('🚀 Setting up Partners table...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('   Required: NEXT_PUBLIC_SUPABASE_URL');
    console.error('   Required: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-partners-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL statements
    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: trimmedStatement + ';'
          });
          
          if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.warn(`⚠️  Warning: ${error.message}`);
          }
        } catch (err) {
          // RPC might not be available, try direct query for simple statements
          if (trimmedStatement.toLowerCase().includes('create table')) {
            console.log('📝 Note: Table creation requires manual SQL execution in Supabase dashboard');
            console.log('   Please run the SQL from scripts/create-partners-table.sql in Supabase SQL Editor');
          }
        }
      }
    }

    // Test if we can access the table
    const { data: testData, error: testError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Table access failed:', testError.message);
      
      if (testError.message.includes('does not exist')) {
        console.log('\n📋 Please run the SQL manually in Supabase SQL Editor:');
        console.log('   1. Go to https://supabase.com/dashboard');
        console.log('   2. Select your project');
        console.log('   3. Navigate to SQL Editor');
        console.log('   4. Copy and paste the contents of scripts/create-partners-table.sql');
        console.log('   5. Click Run');
        return;
      }
    } else {
      console.log('✅ Table access successful!');
    }

    console.log('\n🎉 Partners table setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify the table exists in Supabase dashboard');
    console.log('   2. Check RLS policies are enabled');
    console.log('   3. Test partner application flow');

  } catch (error) {
    console.error('❌ Error setting up partners table:', error);
    console.log('\n📋 Please run the SQL manually in Supabase SQL Editor:');
    console.log('   File: scripts/create-partners-table.sql');
  }
}

// Run the script
setupPartnersTable()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

