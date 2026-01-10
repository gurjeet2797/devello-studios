/**
 * Script to fix partners table columns to be nullable
 * This aligns the database schema with the Prisma schema
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPartnersTable() {
  try {
    console.log('🔧 Fixing partners table columns to be nullable...\n');

    // Execute the ALTER TABLE statements
    await prisma.$executeRaw`
      ALTER TABLE partners 
        ALTER COLUMN description DROP NOT NULL,
        ALTER COLUMN experience_years DROP NOT NULL,
        ALTER COLUMN phone DROP NOT NULL;
    `;

    console.log('✅ Successfully made columns nullable\n');

    // Verify the changes
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'partners'
        AND column_name IN ('description', 'experience_years', 'phone')
      ORDER BY column_name;
    `;

    console.log('📊 Current column status:');
    console.table(columns);

    console.log('\n✅ All columns are now nullable and match Prisma schema!');
  } catch (error) {
    console.error('❌ Error fixing partners table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixPartnersTable()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

