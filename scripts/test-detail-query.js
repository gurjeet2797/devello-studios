const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDetailQuery() {
  try {
    const id = 'cmimdeprk0003eh77zloielzb';
    
    console.log('Testing detail query for:', id);
    
    // Try the exact query from the API
    try {
      const request = await prisma.customProductRequest.findUnique({
        where: { id },
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
            }
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
        }
      });
      
      if (request) {
        console.log('✅ Query successful!');
        console.log('Request ID:', request.id);
        console.log('Has user:', !!request.user);
        console.log('Has quotes:', request.quotes?.length || 0);
        console.log('Has productOrder:', !!request.productOrder);
      } else {
        console.log('❌ Request not found');
      }
    } catch (includeError) {
      console.error('❌ Error with productOrder include:', includeError.message);
      console.error('Error code:', includeError.code);
      
      // Try without productOrder
      console.log('\nTrying without productOrder include...');
      const request = await prisma.customProductRequest.findUnique({
        where: { id },
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
            }
          }
        }
      });
      
      if (request) {
        console.log('✅ Query successful without productOrder!');
        console.log('Request ID:', request.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testDetailQuery();

