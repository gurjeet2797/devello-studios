const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserLookup() {
  try {
    // Simulate what the API does
    const supabaseUserId = '93f44bb9-4b5d-45ef-a5dd-d33d43a5596e'; // From previous test
    const email = 'gurjeet2797@gmail.com';
    
    // Try by supabase_user_id first
    let prismaUser = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUserId }
    });
    
    console.log('Lookup by supabase_user_id:', prismaUser ? 'Found' : 'Not found');
    
    // If not found, try email
    if (!prismaUser) {
      prismaUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      console.log('Lookup by email:', prismaUser ? 'Found' : 'Not found');
    }
    
    if (prismaUser) {
      console.log('User found:', {
        id: prismaUser.id,
        email: prismaUser.email,
        supabase_user_id: prismaUser.supabase_user_id
      });
      
      // Test the where clause
      const whereClause = {
        OR: [
          { user_id: prismaUser.id },
          { email: prismaUser.email.toLowerCase() }
        ]
      };
      
      const requests = await prisma.customProductRequest.findMany({
        where: whereClause,
        select: {
          id: true,
          project_type: true,
          status: true
        }
      });
      
      console.log(`\nFound ${requests.length} requests with this where clause`);
    } else {
      console.log('User not found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserLookup();

