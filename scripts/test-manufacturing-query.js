const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('Testing manufacturing query...\n');
    
    // Test with empty where (should return all)
    const where = undefined;
    
    const requests = await prisma.customProductRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        quotes: {
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        },
        productOrder: {
          select: {
            id: true,
            order_number: true,
            status: true,
            payment_status: true,
            amount: true,
            currency: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log(`Found ${requests.length} requests\n`);
    
    requests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.project_type} - ${req.status}`);
      console.log(`   ID: ${req.id}`);
      console.log(`   Has user: ${!!req.user}`);
      console.log(`   Has productOrder: ${!!req.productOrder}`);
      console.log(`   Quotes: ${req.quotes?.length || 0}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();

