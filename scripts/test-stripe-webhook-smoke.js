/**
 * Smoke test for Stripe webhook handling
 * Verifies product orders and payments are created correctly after webhook processing
 */

const prisma = require('../lib/prisma').default;

async function testWebhookSmoke() {
  console.log('🧪 Running Stripe webhook smoke tests...\n');

  try {
    // Test 1: Check recent product orders
    console.log('1. Checking recent product orders...');
    const recentOrders = await prisma.productOrder.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        payments: true,
        product: {
          select: { name: true, slug: true },
        },
      },
    });

    console.log(`   Found ${recentOrders.length} recent orders`);
    recentOrders.forEach((order) => {
      console.log(`   - Order ${order.order_number}: ${order.status}/${order.payment_status}`);
      console.log(`     Amount: ${order.amount} ${order.currency}`);
      console.log(`     Payments: ${order.payments.length}`);
      if (order.guest_email) {
        console.log(`     Guest email: ${order.guest_email}`);
      }
    });

    // Test 2: Check orders with payment intents
    console.log('\n2. Checking orders with Stripe payment intents...');
    const ordersWithIntents = await prisma.productOrder.findMany({
      where: {
        stripe_payment_intent_id: { not: null },
      },
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_number: true,
        stripe_payment_intent_id: true,
        status: true,
        payment_status: true,
        payments: {
          select: {
            id: true,
            status: true,
            stripe_payment_intent_id: true,
          },
        },
      },
    });

    console.log(`   Found ${ordersWithIntents.length} orders with payment intents`);
    ordersWithIntents.forEach((order) => {
      const matchingPayment = order.payments.find(
        (p) => p.stripe_payment_intent_id === order.stripe_payment_intent_id
      );
      if (!matchingPayment) {
        console.warn(
          `   ⚠️  Order ${order.order_number} has intent ${order.stripe_payment_intent_id} but no matching payment`
        );
      } else {
        console.log(
          `   ✓ Order ${order.order_number}: payment ${matchingPayment.status}`
        );
      }
    });

    // Test 3: Check for orphaned payments
    console.log('\n3. Checking for orphaned payments (no order)...');
    const orphanedPayments = await prisma.payment.findMany({
      where: {
        product_order_id: null,
        stripe_payment_intent_id: { not: null },
      },
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        stripe_payment_intent_id: true,
        amount: true,
        status: true,
      },
    });

    if (orphanedPayments.length > 0) {
      console.warn(`   ⚠️  Found ${orphanedPayments.length} orphaned payments`);
      orphanedPayments.forEach((p) => {
        console.warn(`      Payment ${p.id}: ${p.amount} ${p.status}`);
      });
    } else {
      console.log('   ✓ No orphaned payments found');
    }

    // Test 4: Check schema columns exist (preview_image_url, order_items, etc.)
    console.log('\n4. Verifying schema columns...');
    try {
      const testOrder = await prisma.productOrder.findFirst({
        select: {
          id: true,
          preview_image_url: true,
          order_items: true,
          shipping_address: true,
          tracking_number: true,
          admin_notes: true,
        },
      });
      console.log('   ✓ Schema columns accessible');
    } catch (err) {
      if (err.code === 'P2022') {
        console.error('   ❌ Schema mismatch detected:', err.message);
        console.error('   Run migration: prisma/migrations/20251207_add_product_order_columns');
      } else {
        throw err;
      }
    }

    // Test 5: Check guest orders
    console.log('\n5. Checking guest orders...');
    const guestOrders = await prisma.productOrder.findMany({
      where: {
        guest_email: { not: null },
      },
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        order_number: true,
        guest_email: true,
        status: true,
        user_id: true,
      },
    });

    console.log(`   Found ${guestOrders.length} guest orders`);
    guestOrders.forEach((order) => {
      console.log(
        `   - Order ${order.order_number}: ${order.guest_email} (user: ${order.user_id})`
      );
    });

    console.log('\n✅ Smoke tests completed');
  } catch (error) {
    console.error('\n❌ Smoke test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testWebhookSmoke();
}

module.exports = { testWebhookSmoke };
