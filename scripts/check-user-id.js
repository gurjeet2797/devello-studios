const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserId() {
  try {
    const requests = await prisma.customProductRequest.findMany({
      select: {
        id: true,
        user_id: true,
        email: true,
        name: true
      }
    });
    
    console.log('Custom Product Requests with user_id:');
    requests.forEach(req => {
      console.log(`ID: ${req.id}`);
      console.log(`  Email: ${req.email}`);
      console.log(`  User ID: ${req.user_id || 'NULL'}`);
      console.log('');
    });
    
    // Check if user exists for this email
    const email = 'gurjeet2797@gmail.com';
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    console.log(`\nUser lookup for ${email}:`);
    console.log(user ? `Found user: ${user.id}` : 'User not found');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserId();

