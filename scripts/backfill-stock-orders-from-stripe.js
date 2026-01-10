/**
 * Backfill stock product orders/payments from Stripe payment_intents.
 *
 * Usage:
 *  node scripts/backfill-stock-orders-from-stripe.js --limit=50 --from-date=2024-12-01 --dry-run
 *
 * Flags:
 *  --limit       Max intents to scan (default 50, max 100)
 *  --from-date   ISO date; only intents created after this date
 *  --dry-run     Log intended writes without touching the DB
 */

const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith('--limit='));
  const fromDateArg = args.find((a) => a.startsWith('--from-date='));
  const dryRun = args.includes('--dry-run');

  const limit = Math.min(limitArg ? parseInt(limitArg.split('=')[1], 10) : 50, 100);
  const fromDate = fromDateArg ? new Date(fromDateArg.split('=')[1]) : null;

  return { limit, fromDate: isNaN(fromDate?.getTime()) ? null : fromDate, dryRun };
}

function parseJsonField(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeMetadata(metadata = {}) {
  return {
    productId: metadata.product_id || metadata.productId,
    productName: metadata.product_name || metadata.productName,
    userId: metadata.user_id || metadata.userId,
    guestEmail: metadata.guest_email || metadata.email || metadata.userEmail,
    checkoutType: metadata.checkout_type || metadata.checkoutType,
    quantity: metadata.quantity,
    variantName: metadata.variant_name || metadata.variantName,
    variantPrice: metadata.variant_price || metadata.variantPrice || metadata.price,
    orderItemsRaw: metadata.order_items || metadata.items,
    shipping_address: metadata.shipping_address || metadata.shippingAddress,
    shippingAddress: metadata.shipping_address || metadata.shippingAddress,
  };
}

function buildOrderItems(metadata, product, paymentIntent, amount) {
  const parsed = parseJsonField(metadata.orderItemsRaw);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  if (parsed && !Array.isArray(parsed)) return [parsed];

  const quantity = parseInt(metadata.quantity || '1', 10) || 1;
  const unitPrice =
    parseInt(metadata.variantPrice || `${amount}`, 10) ||
    amount ||
    paymentIntent.amount;

  return [
    {
      productId: metadata.productId || product?.id || null,
      productName: product?.name || metadata.productName || 'Product',
      productSlug: product?.slug || null,
      productImage: product?.image_url || null,
      quantity,
      price: unitPrice,
      total: unitPrice * quantity,
      currency: paymentIntent.currency,
      stripePriceId: product?.stripe_price_id || null,
      variantName: metadata.variantName || null,
    },
  ];
}

async function resolveUser(prismaClient, metadata) {
  if (metadata.userId && metadata.userId !== 'anonymous') {
    const existing = await prismaClient.user.findUnique({ where: { id: metadata.userId } });
    if (existing) return existing;
  }

  if (metadata.guestEmail) {
    const existingByEmail = await prismaClient.user.findUnique({
      where: { email: metadata.guestEmail },
    });
    if (existingByEmail) return existingByEmail;

    const guestSupabaseId = `guest-${metadata.guestEmail}-${Date.now()}`;
    return prismaClient.user.create({
      data: {
        email: metadata.guestEmail,
        supabase_user_id: guestSupabaseId,
        profile: {
          create: {
            upload_count: 0,
            upload_limit: 5,
          },
        },
        subscription: {
          create: {
            status: 'inactive',
            plan_type: 'free',
            upload_limit: 5,
          },
        },
      },
    });
  }

  return null;
}

async function upsertPayment(prismaClient, intentId, data) {
  const existingPayment = await prismaClient.payment.findFirst({
    where: { stripe_payment_intent_id: intentId },
  });

  if (existingPayment) {
    return prismaClient.payment.update({
      where: { id: existingPayment.id },
      data,
    });
  }

  return prismaClient.payment.create({ data });
}

async function main() {
  const { limit, fromDate, dryRun } = parseArgs();
  const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_TEST;
  if (!stripeSecret) {
    throw new Error('STRIPE_SECRET_KEY missing');
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
  const { ProductService } = await import('../lib/productService.js');

  const searchParts = [`status:'succeeded'`];
  if (fromDate) {
    const ts = Math.floor(fromDate.getTime() / 1000);
    searchParts.push(`created>${ts}`);
  }
  const query = searchParts.join(' AND ');

  console.log(
    `Fetching up to ${limit} succeeded payment_intents (via search). Query: ${query}${
      dryRun ? ' [DRY RUN]' : ''
    }`
  );

  const intents = await stripe.paymentIntents.search({
    query,
    limit,
  });

  let createdCount = 0;
  let skippedCount = 0;
  let paymentUpserts = 0;
  const errors = [];

  for (const pi of intents.data) {
    try {
      const metadata = normalizeMetadata(pi.metadata);
      const amount = pi.amount_received ?? pi.amount;
      const currency = pi.currency;
      const stripeChargeId = pi.charges?.data?.[0]?.id || null;
      const purchasedAt = pi.created ? new Date(pi.created * 1000) : new Date();

      // Ignore non-stock flows
      const isGuest = metadata.checkoutType === 'guest' || !!metadata.guestEmail;
      if (!metadata.productId && !metadata.orderItemsRaw && !isGuest) {
        skippedCount += 1;
        continue;
      }

      // Skip if order already exists
      const existingOrder = await prisma.productOrder.findFirst({
        where: { stripe_payment_intent_id: pi.id },
      });
      if (existingOrder) {
        skippedCount += 1;
        continue;
      }

      const user = await resolveUser(prisma, metadata);
      if (!user) {
        console.warn('[BACKFILL] Skipping intent with no resolvable user', { intentId: pi.id });
        skippedCount += 1;
        continue;
      }

      const product = metadata.productId
        ? await ProductService.getProductById(metadata.productId).catch(() => null)
        : null;
      const orderItems = buildOrderItems(metadata, product, pi, amount);
      const productId =
        orderItems.length === 1 ? orderItems[0].productId || metadata.productId || null : metadata.productId || null;
      const shippingAddress =
        parseJsonField(metadata.shipping_address) || parseJsonField(metadata.shippingAddress);

      const orderData = {
        user_id: user.id,
        product_id: productId,
        order_number: ProductService.generateOrderNumber(),
        order_type: 'stock_product',
        stripe_payment_intent_id: pi.id,
        amount,
        currency,
        status: 'processing',
        payment_status: 'succeeded',
        guest_email: metadata.guestEmail || null,
        shipping_address: shippingAddress,
        order_items: orderItems,
        purchased_at: purchasedAt,
      };

      if (dryRun) {
        console.log('[DRY RUN] Would create order/payment:', {
          intent: pi.id,
          userId: user.id,
          guestEmail: metadata.guestEmail,
          productId,
          order_number: orderData.order_number,
          amount,
          currency,
        });
        continue;
      }

      const productOrder = await prisma.productOrder.create({ data: orderData });

      await upsertPayment(prisma, pi.id, {
        product_order_id: productOrder.id,
        user_id: user.id,
        stripe_payment_intent_id: pi.id,
        stripe_charge_id: stripeChargeId,
        amount,
        currency,
        status: 'succeeded',
        payment_method: pi.payment_method_types?.[0] || 'card',
        payment_type: 'full',
        paid_at: purchasedAt,
      });

      createdCount += 1;
      paymentUpserts += 1;
      console.log('✅ Created stock order from intent:', {
        intent: pi.id,
        orderId: productOrder.id,
        orderNumber: productOrder.order_number,
        userId: user.id,
        productId,
      });
    } catch (err) {
      errors.push({ intent: pi.id, error: err.message });
      console.error('Error processing intent', pi.id, err);
    }
  }

  console.log('Backfill complete:', {
    createdCount,
    paymentUpserts,
    skippedCount,
    errorCount: errors.length,
  });

  if (errors.length) {
    console.log('Errors:', errors.slice(0, 5));
  }
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
