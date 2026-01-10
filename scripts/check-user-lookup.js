const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserLookup() {
  try {
    const email = 'gurjeet2797@gmail.com';
    
    // Check user by email
    const userByEmail = await prisma.user.findUnique({
      where: { email: email }
    });
    
    console.log('User lookup by email:', userByEmail ? `Found: ${userByEmail.id}` : 'Not found');
    
    // Check custom product requests for this user
    const userId = 'cmh8gbpyp0000sqsqn6u0qe6s';
    const requests = await prisma.customProductRequest.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true,
        project_type: true,
        status: true
      }
    });
    
    console.log(`\nCustom product requests for user ${userId}: ${requests.length}`);
    requests.forEach(req => {
      console.log(`  - ${req.project_type} (${req.status})`);
    });
    
    // Also check by email
    const requestsByEmail = await prisma.customProductRequest.findMany({
      where: {
        email: email.toLowerCase()
      },
      select: {
        id: true,
        project_type: true,
        status: true,
        user_id: true
      }
    });
    
    console.log(`\nCustom product requests for email ${email}: ${requestsByEmail.length}`);
    requestsByEmail.forEach(req => {
      console.log(`  - ${req.project_type} (${req.status}) - user_id: ${req.user_id || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserLookup();

