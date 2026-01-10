const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCustomProductRequests() {
  try {
    console.log('Checking custom_product_requests table...\n');
    
    // Get total count
    const totalCount = await prisma.customProductRequest.count();
    console.log(`Total custom product requests: ${totalCount}\n`);
    
    // Get all records with their project_type
    const allRequests = await prisma.customProductRequest.findMany({
      select: {
        id: true,
        project_type: true,
        status: true,
        email: true,
        name: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    console.log('All custom product requests:');
    console.log('='.repeat(80));
    allRequests.forEach((req, index) => {
      console.log(`${index + 1}. ID: ${req.id}`);
      console.log(`   Project Type: "${req.project_type}"`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Name: ${req.name}`);
      console.log(`   Email: ${req.email}`);
      console.log(`   Created: ${req.created_at}`);
      console.log('');
    });
    
    // Check unique project_types
    const uniqueProjectTypes = [...new Set(allRequests.map(r => r.project_type))];
    console.log('\nUnique project_types found:');
    uniqueProjectTypes.forEach(type => {
      const count = allRequests.filter(r => r.project_type === type).length;
      console.log(`  - "${type}" (${count} records)`);
    });
    
    // Check product_orders table for custom orders
    console.log('\n\nChecking product_orders table for custom orders...\n');
    const customOrders = await prisma.productOrder.findMany({
      where: {
        custom_product_request_id: {
          not: null
        }
      },
      select: {
        id: true,
        order_number: true,
        custom_product_request_id: true,
        order_type: true,
        status: true,
        created_at: true
      }
    });
    
    console.log(`Total product orders with custom_product_request_id: ${customOrders.length}\n`);
    customOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order #: ${order.order_number}`);
      console.log(`   ID: ${order.id}`);
      console.log(`   Custom Request ID: ${order.custom_product_request_id}`);
      console.log(`   Order Type: ${order.order_type || 'NULL'}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomProductRequests();

