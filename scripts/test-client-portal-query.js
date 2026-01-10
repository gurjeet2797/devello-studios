const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testClientPortalQuery() {
  try {
    const email = 'gurjeet2797@gmail.com';
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      console.log('User not found by email');
      return;
    }
    
    console.log('Found user:', {
      id: user.id,
      email: user.email,
      supabase_user_id: user.supabase_user_id
    });
    
    // Test the where clause used in client portal
    const whereClause = {
      OR: [
        { user_id: user.id },
        { email: user.email.toLowerCase() }
      ]
    };
    
    console.log('\nWhere clause:', JSON.stringify(whereClause, null, 2));
    
    // Query like client portal does
    const requests = await prisma.customProductRequest.findMany({
      where: whereClause,
      select: {
        id: true,
        user_id: true,
        email: true,
        project_type: true,
        status: true
      }
    });
    
    console.log(`\nFound ${requests.length} requests:`);
    requests.forEach(req => {
      console.log(`  - ${req.project_type} (${req.status}) - user_id: ${req.user_id}, email: ${req.email}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testClientPortalQuery();

