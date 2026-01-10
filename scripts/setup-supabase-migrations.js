/**
 * Supabase Prisma Migration Setup Script
 * 
 * This script helps set up Prisma migrations for Supabase.
 * Supabase requires two connection strings:
 * 1. DATABASE_URL - Pooled connection (port 6543) for application queries
 * 2. DIRECT_URL - Direct connection (port 5432) for migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase Prisma migrations...\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('Please create .env.local with your Supabase connection strings.');
  process.exit(1);
}

// Read .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const hasDirectUrl = envContent.includes('DIRECT_URL');
const hasDatabaseUrl = envContent.includes('DATABASE_URL');

if (!hasDatabaseUrl) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

if (!hasDirectUrl) {
  console.warn('⚠️  DIRECT_URL not found in .env.local');
  console.log('\n📝 Supabase requires a DIRECT_URL for migrations.');
  console.log('Your DATABASE_URL is likely using the pooler (port 6543).');
  console.log('For migrations, you need a direct connection (port 5432).');
  console.log('\nAdd this to your .env.local:');
  console.log('DIRECT_URL="postgresql://postgres.vajxcznjxrfdrheqetca:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"');
  console.log('\nNote: Change port from 6543 to 5432 and remove pgbouncer parameters\n');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('\n📦 Generating Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  process.exit(1);
}

console.log('🔄 Running migrations...');
console.log('This will apply all pending migrations to your Supabase database.\n');

try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('\n✅ Migrations applied successfully!');
} catch (error) {
  console.error('\n❌ Migration failed. Trying alternative method...\n');
  console.log('Attempting prisma db push (development only)...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('\n✅ Database schema pushed successfully!');
    console.log('⚠️  Note: db push is for development. Use migrations for production.');
  } catch (pushError) {
    console.error('\n❌ Both migration methods failed.');
    console.log('\nTroubleshooting:');
    console.log('1. Verify DIRECT_URL uses port 5432 (not 6543)');
    console.log('2. Check that your Supabase password is correct');
    console.log('3. Ensure your IP is allowed in Supabase dashboard');
    console.log('4. Try connecting manually: psql "YOUR_DIRECT_URL"');
    process.exit(1);
  }
}

console.log('\n✨ Setup complete!');
console.log('\nNext steps:');
console.log('1. Verify your database: npx prisma studio');
console.log('2. Test connection: npm run dev');
