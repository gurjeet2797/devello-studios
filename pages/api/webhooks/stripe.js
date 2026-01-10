import { buffer } from 'micro';
import { UserService } from '../../../lib/userService';
import { subscriptionCache } from '../../../lib/subscriptionCache';
import {
  dispatchStripeEvent,
  isPaymentIntentHandled,
  isCheckoutSessionHandled,
} from '../../../lib/stripeWebhookRouter';
import { transitionProductOrder, OrderStatuses } from '../../../lib/orderStateMachine';
import PaymentService from '../../../lib/paymentService';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('[STRIPE_WEBHOOK] Incoming request headers:', {
    hasSignature: !!req.headers['stripe-signature'],
    contentType: req.headers['content-type'],
    requestId: req.headers['x-request-id'] || null,
  });

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = PaymentService.verifyStripeWebhook(buf, sig);
    
    console.log('[STRIPE_WEBHOOK] Webhook received and verified:', {
      type: event.type,
      id: event.id,
      created: new Date(event.created * 1000).toISOString(),
      paymentIntentId: event.data?.object?.id || event.data?.object?.payment_intent || null,
    });
  } catch (err) {
    console.error('❌ [STRIPE_WEBHOOK] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  let webhookRecord = null;
  try {
    const prisma = require('../../../lib/prisma').default;
    const { alreadyProcessed, record } = await PaymentService.recordWebhookEvent(event, 'processing');
    webhookRecord = record;

    if (alreadyProcessed) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    await dispatchStripeEvent({
      event,
      prisma,
      handlers: {
        'customer.subscription.created': { handler: handleSubscriptionCreated },
        'customer.subscription.updated': { handler: handleSubscriptionUpdated },
        'customer.subscription.deleted': { handler: handleSubscriptionCanceled },
        'invoice.payment_succeeded': { handler: handlePaymentSucceeded },
        'invoice.payment_failed': { handler: handlePaymentFailed },
        'payment_intent.succeeded': {
          handler: handleOneTimePaymentSucceeded,
          idempotencyCheck: async (evt, db) =>
            isPaymentIntentHandled(evt.data?.object?.id || evt.data?.object?.payment_intent, db),
        },
        'payment_intent.payment_failed': { handler: handleOneTimePaymentFailed },
        'checkout.session.completed': {
          handler: handleCheckoutSessionCompleted,
          idempotencyCheck: async (evt, db) =>
            isCheckoutSessionHandled(
              evt.data?.object?.id,
              evt.data?.object?.payment_intent,
              db
            ),
        },
        'charge.dispute.created': { handler: handleDisputeCreated },
        'charge.refunded': { handler: handleChargeRefunded },
      },
    });

    await PaymentService.markWebhookProcessed(webhookRecord?.id);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Handler error:', error);
    if (webhookRecord?.id) {
      await PaymentService.markWebhookFailed(webhookRecord.id, error.message);
    }
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleSubscriptionCreated(subscription) {
  try {
    console.log('Subscription created:', {
      id: subscription.id,
      customer: subscription.customer,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id
    });

    // Find user by Stripe customer ID
    const prisma = require('../../../lib/prisma').default;
    const user = await prisma.user.findFirst({
      where: {
        subscription: {
          stripe_customer_id: subscription.customer
        }
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.error('❌ [STRIPE_WEBHOOK] User not found for customer:', subscription.customer);
      return;
    }

    console.log('User found for subscription:', {
      userId: user.id,
      email: user.email,
      currentStatus: user.subscription?.status
    });

    // For subscription.created, only set basic info, don't set status yet
    // Status will be set to 'active' when invoice.payment_succeeded fires
    const updateData = {
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      plan_type: getPlanTypeFromPriceId(subscription.items.data[0].price.id),
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      upload_limit: getUploadLimitFromPriceId(subscription.items.data[0].price.id)
    };

    // Only set status if it's already active (immediate payment)
    if (subscription.status === 'active') {
      updateData.status = 'active';
    } else {
    }

    await UserService.updateSubscription(user.id, updateData);

    console.log('Subscription updated:', {
      status: subscription.status,
      planType: updateData.plan_type,
      uploadLimit: updateData.upload_limit
    });
    // Invalidate cache for this customer
    subscriptionCache.invalidate(subscription.customer);
  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Subscription updated:', {
      id: subscription.id,
      customer: subscription.customer,
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    });

    // Find user by Stripe customer ID
    const prisma = require('../../../lib/prisma').default;
    const user = await prisma.user.findFirst({
      where: {
        subscription: {
          stripe_customer_id: subscription.customer
        }
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.error('❌ [STRIPE_WEBHOOK] User not found for customer:', subscription.customer);
      return;
    }

    // Determine the correct status based on cancellation
    let status = subscription.status;
    let planType = getPlanTypeFromPriceId(subscription.items.data[0].price.id);
    let uploadLimit = getUploadLimitFromPriceId(subscription.items.data[0].price.id);
    
    // If subscription is marked for cancellation, update status but keep current plan and limits
    if (subscription.cancel_at_period_end) {
      status = 'canceled';
      // Keep the current plan type and upload limit until period ends
      // planType and uploadLimit remain unchanged
    }
    // If subscription was reactivated (cancel_at_period_end is false), update status to active
    else if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
      status = 'active';
      // Keep the current plan type and upload limit
      // planType and uploadLimit remain unchanged
        }
        
        console.log('Subscription status update:', {
          originalStatus: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          finalStatus: status,
          planType: planType,
          uploadLimit: uploadLimit
        });

    // Update subscription with new status
    await UserService.updateSubscription(user.id, {
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: status,
      plan_type: planType,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      upload_limit: uploadLimit
    });

    // Also update the user profile upload limit
    await UserService.updateProfile(user.id, {
      upload_limit: uploadLimit
    });

    console.log('Profile updated:', {
      finalStatus: status,
      planType: planType,
      uploadLimit: uploadLimit,
      cancel_at_period_end: subscription.cancel_at_period_end
    });
    
    // Invalidate cache for this customer
    subscriptionCache.invalidate(subscription.customer);
    
    // Trigger refresh service for immediate frontend updates
    try {
      const { RefreshService } = require('../../../lib/refreshService');
      await RefreshService.handleBillingAction('webhook_update', true);
    } catch (refreshError) {
      console.error('[STRIPE_WEBHOOK WARNING] Failed to trigger refresh service:', refreshError.message);
    }
  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Error handling subscription update:', error);
  }
}

async function handleSubscriptionCanceled(subscription) {
  try {
    console.log('Subscription canceled:', {
      id: subscription.id,
      customer: subscription.customer
    });

    const prisma = require('../../../lib/prisma').default;
    const user = await prisma.user.findFirst({
      where: {
        subscription: {
          stripe_customer_id: subscription.customer
        }
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.error('❌ [STRIPE_WEBHOOK] User not found for customer:', subscription.customer);
      return;
    }

    console.log('User found for subscription:', {
      userId: user.id,
      email: user.email,
      currentStatus: user.subscription?.status
    });

    // Update subscription to inactive
    await UserService.updateSubscription(user.id, {
      status: 'canceled',
      plan_type: 'free',
      upload_limit: 5  // Reset to free tier limit
    });

    
    // Invalidate cache for this customer
    subscriptionCache.invalidate(subscription.customer);
  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    console.log('Payment succeeded:', {
      invoiceId: invoice.id,
      customer: invoice.customer,
      subscription: invoice.subscription,
      amount: invoice.amount_paid
    });

    const prisma = require('../../../lib/prisma').default;
    const user = await prisma.user.findFirst({
      where: {
        subscription: {
          stripe_customer_id: invoice.customer
        }
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.error('❌ [STRIPE_WEBHOOK] User not found for customer:', invoice.customer);
      return;
    }

    console.log('User found for subscription:', {
      userId: user.id,
      email: user.email,
      currentStatus: user.subscription?.status
    });

    // Update subscription status to active
    await UserService.updateSubscription(user.id, {
      status: 'active'
    });

  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    console.log('Payment failed:', {
      invoiceId: invoice.id,
      customer: invoice.customer,
      subscription: invoice.subscription
    });

    const prisma = require('../../../lib/prisma').default;
    const user = await prisma.user.findFirst({
      where: {
        subscription: {
          stripe_customer_id: invoice.customer
        }
      },
      include: {
        subscription: true
      }
    });

    if (!user) {
      console.error('❌ [STRIPE_WEBHOOK] User not found for customer:', invoice.customer);
      return;
    }

    console.log('User found for subscription:', {
      userId: user.id,
      email: user.email,
      currentStatus: user.subscription?.status
    });

    // Update subscription status to past_due
    await UserService.updateSubscription(user.id, {
      status: 'past_due'
    });

  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Error handling payment failure:', error);
  }
}

function getPlanTypeFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    return 'basic';
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro';
  }
  return 'free';
}

function getUploadLimitFromPriceId(priceId) {
  if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
    return 30; // 5 free + 25 basic = 30 total
  } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 60; // 5 free + 55 pro = 60 total
  }
  return 5; // Free tier
}

// Handle one-time payment success (product orders + credits)
async function handleOneTimePaymentSucceeded(paymentIntent) {
  const metadata = normalizeMetadata(paymentIntent.metadata);
  const amount = paymentIntent.amount_received ?? paymentIntent.amount;
  const currency = paymentIntent.currency;
  const stripeChargeId = paymentIntent.charges?.data?.[0]?.id || null;
  const paidAt = paymentIntent.created ? new Date(paymentIntent.created * 1000) : new Date();

  try {
    console.log('[STRIPE_WEBHOOK] Payment intent succeeded:', {
      paymentIntentId: paymentIntent.id,
      metadata,
      amount,
      currency,
    });

    const prisma = require('../../../lib/prisma').default;
    const { ProductService } = require('../../../lib/productService');
    const { sendOrderConfirmationEmail, sendAdminOrderNotification } = require('../../../lib/emailService');

    // Keep scheduled/manual payments in sync when metadata includes payment_id
    if (metadata.paymentId) {
      const payment = await prisma.payment.findUnique({ where: { id: metadata.paymentId } });
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: stripeChargeId,
            amount,
            currency,
            status: 'succeeded',
            paid_at: paidAt,
            failed_at: null,
          },
        });

        if (payment.invoice_id) {
          await prisma.invoice.update({
            where: { id: payment.invoice_id },
            data: { status: 'paid', paid_at: paidAt },
          });
        }
        if (payment.product_order_id) {
          await prisma.productOrder.update({
            where: { id: payment.product_order_id },
            data: { payment_status: 'paid', purchased_at: paidAt },
          });
          await transitionProductOrder({
            orderId: payment.product_order_id,
            targetStatus: OrderStatuses.completed,
            reason: 'payment_succeeded',
            actorType: 'system',
            prismaClient: prisma,
          });
        }
      }
    }

    // Custom product orders
    if (metadata.customProductRequestId) {
      const { order, payment } = await handleCustomProductOrder({
        prisma,
        ProductService,
        paymentIntent,
        metadata,
        amount,
        currency,
        stripeChargeId,
        paidAt,
        sendOrderConfirmationEmail,
        sendAdminOrderNotification,
      });
      if (order || payment) return;
    }

    // Stock product orders (guest or authenticated)
    if (metadata.productId || metadata.guestEmail || metadata.orderItemsRaw) {
      const { sendAdminOrderNotification } = require('../../../lib/emailService');
      await handleStockProductOrder({
        prisma,
        ProductService,
        sendOrderConfirmationEmail,
        sendAdminOrderNotification,
        paymentIntent,
        metadata,
        amount,
        currency,
        stripeChargeId,
        paidAt,
      });
      return;
    }

    // Upload credit purchases / fallback
    await handleCreditPurchase({
      paymentIntent,
      metadata,
      amount,
      currency,
    });
  } catch (error) {
    console.error('❌ [STRIPE_WEBHOOK] Error handling one-time payment success:', {
      error: error.message,
      paymentIntentId: paymentIntent.id,
      metadata,
    });
    // Rethrow so Stripe retries the webhook instead of silently succeeding
    throw error;
  }
}

async function handleStockProductOrder({
  prisma,
  ProductService,
  sendOrderConfirmationEmail,
  sendAdminOrderNotification,
  paymentIntent,
  metadata,
  amount,
  currency,
  stripeChargeId,
  paidAt,
}) {
  try {
    const product = metadata.productId
      ? await ProductService.getProductById(metadata.productId).catch(() => null)
      : null;
    const orderItems = buildOrderItems(metadata, product, paymentIntent, amount);
    const shippingAddress =
      parseJsonField(metadata.shipping_address) ||
      parseJsonField(metadata.shippingAddress);

    if (!orderItems || orderItems.length === 0) {
      console.warn('[STRIPE_WEBHOOK WARNING] No order items parsed for stock order', {
        paymentIntentId: paymentIntent.id,
        metadata,
      });
    }

    const user = await resolveOrderUser(prisma, metadata);
    if (!user) {
      console.error('❌ [STRIPE_WEBHOOK] Could not resolve user for stock order', {
        paymentIntentId: paymentIntent.id,
        metadata,
      });
      throw new Error('User resolution failed for stock order');
    }

    // Extract height/width from metadata or first order item
    let height = metadata.height || null;
    let width = metadata.width || null;
    
    // If not in metadata, try to get from first order item (for single product orders)
    if (!height && !width && orderItems?.length === 1) {
      height = orderItems[0].height || null;
      width = orderItems[0].width || null;
    }

    const isTestOrder = await computeTestOrderFlag({
      prisma,
      orderItems,
      metadata,
      product,
    });

    const productOrderData = {
      user_id: user.id,
      product_id:
        orderItems?.length === 1
          ? orderItems[0].productId || metadata.productId || null
          : metadata.productId || null,
      order_type: 'stock_product',
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency,
      payment_status: 'succeeded',
      test_order: isTestOrder,
      guest_email:
        metadata.checkoutType === 'guest' || metadata.guestEmail || metadata.guest_email
          ? (metadata.guestEmail || metadata.guest_email)
          : null,
      shipping_address: shippingAddress,
      order_items: orderItems,
      height: height,
      width: width,
      purchased_at: paidAt,
      // Normalize optional fields to avoid column errors when missing in DB
      preview_image_url: metadata.previewImageUrl || null,
      tracking_number: metadata.trackingNumber || null,
      carrier: metadata.carrier || null,
      customer_notes: metadata.customerNotes || null,
    };

    // Only check by payment intent ID - this is unique per payment and prevents order collisions
    // DO NOT check by order_number as it could match a different user's order
    const existingOrder = await prisma.productOrder.findFirst({
      where: { stripe_payment_intent_id: paymentIntent.id },
    });

    let productOrder;
    if (existingOrder) {
      // Validate that the existing order belongs to the same user
      // This prevents accidentally updating another user's order
      const existingUserId = existingOrder.user_id;
      const existingGuestEmail = existingOrder.guest_email?.toLowerCase();
      const newUserId = user.id;
      const newGuestEmail = (metadata.guestEmail || metadata.guest_email)?.toLowerCase();
      
      const isSameUser = 
        (existingUserId === newUserId) ||
        (existingGuestEmail && newGuestEmail && existingGuestEmail === newGuestEmail);
      
      if (!isSameUser) {
        console.error('[STRIPE_WEBHOOK] CRITICAL: Attempted to update order with different user! Creating new order instead.', {
          existingOrderId: existingOrder.id,
          existingOrderNumber: existingOrder.order_number,
          existingUserId,
          existingGuestEmail,
          newUserId,
          newGuestEmail,
          paymentIntentId: paymentIntent.id
        });
        // Create a new order instead of updating the wrong one
        let orderNumber = ProductService.generateOrderNumber();
        let orderNumberExists = await prisma.productOrder.findFirst({
          where: { order_number: orderNumber },
        });
        
        let retries = 0;
        while (orderNumberExists && retries < 5) {
          orderNumber = ProductService.generateOrderNumber();
          orderNumberExists = await prisma.productOrder.findFirst({
            where: { order_number: orderNumber },
          });
          retries++;
        }
        
        productOrder = await prisma.productOrder.create({
          data: {
            ...productOrderData,
            status: OrderStatuses.pending,
            order_number: orderNumber,
          },
        });
      } else {
        // Safe to update - same user
        console.log('[STRIPE_WEBHOOK] Updating existing order:', {
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          paymentIntentId: paymentIntent.id,
          userId: user.id
        });
        productOrder = await prisma.productOrder.update({
          where: { id: existingOrder.id },
          data: {
            ...productOrderData,
            test_order: isTestOrder || existingOrder.test_order,
          },
        });
      }
    } else {
      // Create new order - ensure order_number is unique
      let orderNumber = metadata.orderNumber || ProductService.generateOrderNumber();
      
      // Check if order_number already exists and generate a new one if needed
      let orderNumberExists = await prisma.productOrder.findFirst({
        where: { order_number: orderNumber },
      });
      
      // Retry up to 5 times if order number collision occurs
      let retries = 0;
      while (orderNumberExists && retries < 5) {
        console.warn('[STRIPE_WEBHOOK] Order number collision detected, generating new one:', orderNumber);
        orderNumber = ProductService.generateOrderNumber();
        orderNumberExists = await prisma.productOrder.findFirst({
          where: { order_number: orderNumber },
        });
        retries++;
      }
      
      if (orderNumberExists) {
        throw new Error('Failed to generate unique order number after multiple attempts');
      }

      productOrder = await prisma.productOrder.create({
        data: {
          ...productOrderData,
          status: OrderStatuses.pending,
          order_number: orderNumber,
        },
      });
      
      console.log('[STRIPE_WEBHOOK] Created new order:', {
        orderId: productOrder.id,
        orderNumber: productOrder.order_number,
        userId: user.id,
        paymentIntentId: paymentIntent.id
      });
    }

    if (!productOrder?.id) {
      throw new Error('Product order was not created');
    }

    try {
      await transitionProductOrder({
        orderId: productOrder.id,
        targetStatus: OrderStatuses.processing,
        reason: 'payment_succeeded',
        actorType: metadata.checkoutType === 'guest' ? 'client' : 'system',
        actorId: user.id,
        prismaClient: prisma,
      });
    } catch (stateError) {
      console.error('[STRIPE_WEBHOOK] Failed to record status transition', {
        error: stateError.message,
        orderId: productOrder.id,
      });
      // Continue; payment record will still be created
    }

    await upsertPaymentRecord(prisma, paymentIntent.id, {
      product_order_id: productOrder.id,
      user_id: user.id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: stripeChargeId,
      amount,
      currency,
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
      payment_type: 'full',
      paid_at: paidAt,
    });

    try {
      // Check both camelCase and snake_case for guest email (guest checkout uses snake_case)
      const recipientEmail =
        metadata.guestEmail || metadata.guest_email || metadata.userEmail || user.email || null;
      if (recipientEmail) {
        const orderDetails = (orderItems || [])
          .map(
            (item) =>
              `${item.productName || 'Product'}${
                item.variantName ? ` - ${item.variantName}` : ''
              } (Qty: ${item.quantity || 1})`
          )
          .join(', ');
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          'https://develloinc.com';
        console.log('[STRIPE_WEBHOOK] Sending order confirmation email:', {
          to: recipientEmail,
          orderNumber: productOrder.order_number,
        });
        await sendOrderConfirmationEmail({
          to: recipientEmail,
          orderNumber: productOrder.order_number,
          orderType: 'stock_product',
          orderDetails: orderDetails || 'Product order',
          amount: productOrder.amount,
          currency: productOrder.currency,
          status: 'processing',
          clientPortalLink: `${baseUrl}/client-portal`,
          orderDate: productOrder.purchased_at || productOrder.created_at,
          recipientEmail: recipientEmail,
        });
      } else {
        console.warn('[STRIPE_WEBHOOK WARNING] No recipient email available for order confirmation', {
          paymentIntentId: paymentIntent.id,
        });
      }
    } catch (emailErr) {
      console.error('[STRIPE_WEBHOOK WARNING] Failed to send stock order email:', emailErr);
    }

    // Send admin notification for new orders only (not updates)
    if (!existingOrder) {
      try {
        const recipientEmail =
          metadata.guestEmail || metadata.guest_email || metadata.userEmail || user.email || null;
        const customerName = user.profile
          ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || recipientEmail || 'Customer'
          : recipientEmail || 'Customer';
        const orderDetails = (orderItems || [])
          .map(
            (item) =>
              `${item.productName || 'Product'}${
                item.variantName ? ` - ${item.variantName}` : ''
              } (Qty: ${item.quantity || 1})`
          )
          .join(', ');
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          process.env.NEXT_PUBLIC_BASE_URL ||
          'https://develloinc.com';
        
        await sendAdminOrderNotification({
          orderNumber: productOrder.order_number,
          orderType: 'stock_product',
          customerName,
          customerEmail: recipientEmail,
          orderDetails: orderDetails || 'Product order',
          amount: productOrder.amount,
          currency: productOrder.currency,
          orderDate: productOrder.purchased_at || productOrder.created_at,
          shippingAddress: productOrder.shipping_address,
          orderLink: `${baseUrl}/admin/orders/product-orders/${productOrder.id}`
        });
        console.log('[STRIPE_WEBHOOK] Admin order notification sent:', {
          orderNumber: productOrder.order_number,
        });
      } catch (adminEmailErr) {
        console.error('[STRIPE_WEBHOOK WARNING] Failed to send admin order notification:', adminEmailErr);
      }
    }

      console.log('[STRIPE_WEBHOOK] Stock product order processed:', {
      orderId: productOrder.id,
      orderNumber: productOrder.order_number,
      userId: user.id,
      userEmail: user.email,
      productId: metadata.productId || null,
      guestEmail: metadata.guestEmail || metadata.guest_email || null,
      orderItemsCount: orderItems?.length || 0,
      stripePaymentIntentId: paymentIntent.id,
      wasExisting: !!existingOrder,
      action: existingOrder ? 'updated' : 'created'
    });
  } catch (err) {
    console.error('❌ [STRIPE_WEBHOOK] Stock product order handling failed:', {
      error: err.message,
      paymentIntentId: paymentIntent.id,
      metadata,
    });
    throw err;
  }
}

async function handleCustomProductOrder({
  prisma,
  ProductService,
  paymentIntent,
  metadata,
  amount,
  currency,
  stripeChargeId,
  paidAt,
  sendOrderConfirmationEmail = null,
  sendAdminOrderNotification = null,
}) {
  console.log('Handling custom product order payment:', {
    customProductRequestId: metadata.customProductRequestId,
    quoteId: metadata.quoteId,
    paymentIntentId: paymentIntent.id,
  });

  // First check: existing order by payment intent ID (handles duplicate webhook events)
  const existingOrderByPaymentIntent = await prisma.productOrder.findFirst({
    where: {
      stripe_payment_intent_id: paymentIntent.id,
    },
  });

  if (existingOrderByPaymentIntent) {
    console.log('[STRIPE_WEBHOOK] Found existing order by payment intent ID, updating:', {
      orderId: existingOrderByPaymentIntent.id,
      orderNumber: existingOrderByPaymentIntent.order_number,
    });
    await prisma.productOrder.update({
      where: { id: existingOrderByPaymentIntent.id },
      data: {
        amount,
        currency,
        payment_status: 'succeeded',
        status: existingOrderByPaymentIntent.status === 'pending' ? 'processing' : existingOrderByPaymentIntent.status,
        purchased_at: paidAt,
      },
    });

    await upsertPaymentRecord(prisma, paymentIntent.id, {
      product_order_id: existingOrderByPaymentIntent.id,
      user_id: existingOrderByPaymentIntent.user_id,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: stripeChargeId,
      amount,
      currency,
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
      payment_type: 'full',
      paid_at: paidAt,
    });
    return { order: existingOrderByPaymentIntent };
  }

  // Second check: existing order by custom_product_request_id with succeeded payment
  // This prevents duplicates if both payment_intent.succeeded and checkout.session.completed fire
  if (metadata.customProductRequestId) {
    const existingOrderByRequest = await prisma.productOrder.findFirst({
      where: {
        custom_product_request_id: metadata.customProductRequestId,
        payment_status: 'succeeded',
      },
    });

    if (existingOrderByRequest) {
      console.log('[STRIPE_WEBHOOK] Found existing paid order for custom product request, skipping duplicate creation:', {
        orderId: existingOrderByRequest.id,
        orderNumber: existingOrderByRequest.order_number,
        customProductRequestId: metadata.customProductRequestId,
        paymentIntentId: paymentIntent.id,
      });
      // Update the existing order with the new payment intent ID if different
      if (existingOrderByRequest.stripe_payment_intent_id !== paymentIntent.id) {
        await prisma.productOrder.update({
          where: { id: existingOrderByRequest.id },
          data: {
            stripe_payment_intent_id: paymentIntent.id,
            amount,
            currency,
            purchased_at: paidAt,
          },
        });
      }
      // Still create/update payment record for this payment intent
      await upsertPaymentRecord(prisma, paymentIntent.id, {
        product_order_id: existingOrderByRequest.id,
        user_id: existingOrderByRequest.user_id,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: stripeChargeId,
        amount,
        currency,
        status: 'succeeded',
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        payment_type: 'full',
        paid_at: paidAt,
      });
      return { order: existingOrderByRequest };
    }
  }

  const customRequest = await prisma.customProductRequest.findUnique({
    where: { id: metadata.customProductRequestId },
    include: {
      quotes: {
        where: metadata.quoteId ? { id: metadata.quoteId } : { status: 'pending' },
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!customRequest) {
    console.error('Custom product request not found:', metadata.customProductRequestId);
    return {};
  }

  if (customRequest.quotes && customRequest.quotes.length > 0) {
    await prisma.quote.update({
      where: { id: customRequest.quotes[0].id },
      data: { status: 'approved' },
    });
  }

  const userId =
    (metadata.userId && metadata.userId !== 'anonymous' && metadata.userId) ||
    customRequest.user_id;

  const productOrder = await prisma.productOrder.create({
    data: {
      user_id: userId,
      product_id: null,
      custom_product_request_id: metadata.customProductRequestId,
      order_number: ProductService.generateOrderNumber(),
      order_type: 'custom_order',
      stripe_payment_intent_id: paymentIntent.id,
      amount,
      currency,
      status: 'processing',
      payment_status: 'succeeded',
      preview_image_url: customRequest.preview_image,
      purchased_at: paidAt,
    },
  });

  await prisma.customProductRequest.update({
    where: { id: metadata.customProductRequestId },
    data: { status: 'approved' },
  });

  await upsertPaymentRecord(prisma, paymentIntent.id, {
    product_order_id: productOrder.id,
    user_id: userId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_charge_id: stripeChargeId,
    amount,
    currency,
    status: 'succeeded',
    payment_method: paymentIntent.payment_method_types?.[0] || 'card',
    payment_type: 'full',
    paid_at: paidAt,
  });

  // Send email notifications for new custom product orders
  // Only send if email functions are provided and this is a new order (not an update)
  if (sendOrderConfirmationEmail || sendAdminOrderNotification) {
    try {
      // Get user details for email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });

      const recipientEmail = user?.email || customRequest.email;
      const recipientName = user?.profile
        ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim() || recipientEmail || 'Customer'
        : recipientEmail || 'Customer';

      // Send client confirmation email
      if (sendOrderConfirmationEmail && recipientEmail) {
        try {
          const orderDetails = `${customRequest.project_type}${customRequest.project_description ? `: ${customRequest.project_description.substring(0, 100)}${customRequest.project_description.length > 100 ? '...' : ''}` : ''}`;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
          
          await sendOrderConfirmationEmail({
            to: recipientEmail,
            orderNumber: productOrder.order_number,
            orderType: 'custom_order',
            orderDetails: orderDetails,
            amount: productOrder.amount,
            currency: productOrder.currency,
            status: 'processing',
            clientPortalLink: `${baseUrl}/client-portal`,
            customProductRequestId: metadata.customProductRequestId,
            orderDate: productOrder.purchased_at || productOrder.created_at,
            recipientEmail: recipientEmail,
          });
          console.log('[STRIPE_WEBHOOK] Sent custom order confirmation email:', {
            orderNumber: productOrder.order_number,
            recipientEmail,
          });
        } catch (emailErr) {
          console.error('[STRIPE_WEBHOOK WARNING] Failed to send custom order confirmation email:', emailErr);
        }
      }

      // Send admin notification
      if (sendAdminOrderNotification) {
        try {
          const customerName = recipientName;
          const orderDetails = `${customRequest.project_type}${customRequest.project_description ? `: ${customRequest.project_description.substring(0, 100)}${customRequest.project_description.length > 100 ? '...' : ''}` : ''}`;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
          
          await sendAdminOrderNotification({
            orderNumber: productOrder.order_number,
            orderType: 'custom_order',
            customerName,
            customerEmail: recipientEmail,
            orderDetails: orderDetails || 'Custom product order',
            amount: productOrder.amount,
            currency: productOrder.currency,
            orderDate: productOrder.purchased_at || productOrder.created_at,
            shippingAddress: customRequest.shipping_address,
            orderLink: `${baseUrl}/admin/orders/product-orders/${productOrder.id}`
          });
          console.log('[STRIPE_WEBHOOK] Sent admin notification for custom order:', {
            orderNumber: productOrder.order_number,
          });
        } catch (adminEmailErr) {
          console.error('[STRIPE_WEBHOOK WARNING] Failed to send admin notification for custom order:', adminEmailErr);
        }
      }
    } catch (emailError) {
      console.error('[STRIPE_WEBHOOK WARNING] Error sending emails for custom order:', emailError);
      // Don't fail the order creation if emails fail
    }
  }

  console.log('[STRIPE_WEBHOOK] Custom product order created:', {
    orderId: productOrder.id,
    orderNumber: productOrder.order_number,
    customProductRequestId: metadata.customProductRequestId,
  });

  return { order: productOrder };
}

async function handleCreditPurchase({ paymentIntent, metadata, amount, currency }) {
  const { UploadAllowanceService } = await import('../../../lib/uploadAllowanceService');

  let userId = metadata.userId;

  if (userId === 'anonymous') {
    const { GuestPurchaseService } = await import('../../../lib/guestPurchaseService');
    const sessionId = metadata.sessionId || `guest-${Date.now()}`;

    await GuestPurchaseService.createGuestPurchase(sessionId, paymentIntent.id, {
      amount,
      currency,
      purchaseType: metadata.purchaseType || 'single_upload',
      uploadsGranted: parseInt(metadata.credits || '1', 10),
      userEmail: metadata.userEmail || metadata.guestEmail,
    });
    return;
  }

  if (!userId || userId === 'anonymous') {
    console.error('❌ [STRIPE_WEBHOOK] No valid userId in payment intent metadata');
    return;
  }

  const credits = parseInt(metadata.credits || '1', 10);
  const purchase = await UploadAllowanceService.addOneTimeCredits(userId, credits, {
    paymentIntentId: paymentIntent.id,
    sessionId: metadata.sessionId,
    amount,
    currency,
    purchaseType: metadata.purchaseType || 'single_upload',
  });

  console.log('One-time purchase created:', {
    purchaseId: purchase.id,
    userId,
    credits,
  });

  try {
    const { RefreshService } = require('../../../lib/refreshService');
    await RefreshService.handleBillingAction('one_time_credit', true);
  } catch (refreshError) {
    console.error(
      '[STRIPE_WEBHOOK WARNING] Failed to trigger refresh service (one-time):',
      refreshError.message
    );
  }
}

async function resolveOrderUser(prisma, metadata) {
  try {
    if (metadata.userId && metadata.userId !== 'anonymous') {
      const existing = await prisma.user.findUnique({ where: { id: metadata.userId } });
      if (existing) return existing;
    }

    // Check both camelCase and snake_case for guest email
    const guestEmail = metadata.guestEmail || metadata.guest_email;
    if (guestEmail) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: guestEmail },
      });
      if (existingByEmail) return existingByEmail;

      const guestSupabaseId = `guest-${guestEmail}-${Date.now()}`;
      const created = await prisma.user.create({
        data: {
          email: guestEmail,
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
      console.log('[STRIPE_WEBHOOK] Guest user created for order', {
        guestEmail: guestEmail,
        userId: created.id,
      });
      return created;
    }

    console.error('❌ [STRIPE_WEBHOOK] No user or guest email in metadata');
    return null;
  } catch (err) {
    console.error('❌ [STRIPE_WEBHOOK] Error resolving order user:', {
      error: err.message,
      metadata,
    });
    throw err;
  }
}

async function upsertPaymentRecord(prisma, intentId, data) {
  const existingPayment = await prisma.payment.findFirst({
    where: { stripe_payment_intent_id: intentId },
  });

  if (existingPayment) {
    return prisma.payment.update({
      where: { id: existingPayment.id },
      data,
    });
  }

  return prisma.payment.create({ data });
}

function buildOrderItems(metadata, product, paymentIntent, amount) {
  const parsed = parseJsonField(metadata.orderItemsRaw);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed;
  }
  if (parsed && !Array.isArray(parsed)) {
    return [parsed];
  }

  const quantity = parseInt(metadata.quantity || '1', 10) || 1;
  const unitPrice =
    parseInt(metadata.variantPrice || `${amount}`, 10) ||
    amount ||
    paymentIntent.amount;

  console.warn('[STRIPE_WEBHOOK WARNING] Falling back to single-item order parsing', {
    paymentIntentId: paymentIntent.id,
    quantity,
    unitPrice,
  });

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
      stripePriceId: product?.stripe_price_id || metadata.priceId || null,
      variantName: metadata.variantName || null,
    },
  ];
}

function parseJsonField(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.error('[STRIPE_WEBHOOK WARNING] Failed to parse JSON field:', err.message);
    return null;
  }
}

function normalizeMetadata(metadata = {}) {
  return {
    productId: metadata.product_id || metadata.productId,
    productName: metadata.product_name || metadata.productName,
    userId: metadata.user_id || metadata.userId,
    userEmail: metadata.userEmail,
    guestEmail: metadata.guest_email || metadata.email || metadata.userEmail,
    checkoutType: metadata.checkout_type || metadata.checkoutType,
    quantity: metadata.quantity,
    variantName: metadata.variant_name || metadata.variantName,
    variantPrice: metadata.variant_price || metadata.variantPrice || metadata.price,
    priceId: metadata.price_id || metadata.priceId || metadata.stripe_price_id,
    orderItemsRaw:
      metadata.order_items ||
      metadata.items ||
      metadata.orderItems ||
      metadata.orderItemsRaw,
    shipping_address: metadata.shipping_address || metadata.shippingAddress,
    shippingAddress: metadata.shipping_address || metadata.shippingAddress,
    customProductRequestId:
      metadata.custom_product_request_id || metadata.customProductRequestId,
    quoteId: metadata.quote_id || metadata.quoteId,
    purchaseType: metadata.purchaseType || metadata.purchase_type,
    credits: metadata.credits,
    sessionId: metadata.sessionId,
    previewImageUrl: metadata.preview_image_url || metadata.previewImageUrl,
    trackingNumber: metadata.tracking_number || metadata.trackingNumber,
    carrier: metadata.carrier,
    customerNotes: metadata.customer_notes || metadata.customerNotes,
    orderNumber: metadata.order_number || metadata.orderNumber,
    paymentId: metadata.payment_id || metadata.paymentId,
  };
}

async function computeTestOrderFlag({ prisma, orderItems, metadata, product }) {
  if (metadata?.test_order === 'true' || metadata?.testOrder === 'true') {
    return true;
  }
  if (metadata?.contains_test_items === 'true') {
    return true;
  }

  const productIds = (orderItems || [])
    .map((item) => item.productId)
    .filter(Boolean);

  if (metadata?.productId) {
    productIds.push(metadata.productId);
  }

  const uniqueProductIds = Array.from(new Set(productIds));
  const [products, houseProducts] =
    uniqueProductIds.length > 0
      ? await Promise.all([
          prisma.product.findMany({ where: { id: { in: uniqueProductIds } } }),
          prisma.houseBuildProduct.findMany({ where: { id: { in: uniqueProductIds } } }),
        ])
      : [[], []];

  const productMap = new Map();
  for (const p of products) productMap.set(p.id, p);
  for (const p of houseProducts) productMap.set(p.id, p);

  if (product && product.id && !productMap.has(product.id)) {
    productMap.set(product.id, product);
  }

  if (productMap.size === 0) {
    return false;
  }

  return Array.from(productMap.values()).every((p) => p?.is_test === true);
}

// Handle one-time payment failure
async function handleOneTimePaymentFailed(paymentIntent) {
  try {
    
    const { UserService } = await import('../../../lib/userService');
    
    // Update scheduled/manual payments when metadata includes payment_id
    const metadata = normalizeMetadata(paymentIntent.metadata);
    const stripeChargeId = paymentIntent.charges?.data?.[0]?.id || null;
    if (metadata.paymentId) {
      const prisma = require('../../../lib/prisma').default;
      const existing = await prisma.payment.findUnique({ where: { id: metadata.paymentId } });
      if (existing) {
        await prisma.payment.update({
          where: { id: existing.id },
          data: {
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: stripeChargeId,
            status: 'failed',
            failed_at: new Date(),
          },
        });
      }
    }

    // Get user from metadata
    const userId = paymentIntent.metadata?.userId || paymentIntent.metadata?.user_id;
    if (!userId) {
      console.error('No userId in payment intent metadata');
      return;
    }

    // Update one-time purchase record to failed
    await UserService.updateOneTimePurchaseStatus(
      paymentIntent.id,
      'failed'
    );

    
  } catch (error) {
    console.error('Error handling one-time payment failure:', error);
  }
}

// Handle checkout session completed (for product purchases)
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('[STRIPE_WEBHOOK] Checkout session completed:', {
      sessionId: session.id,
      paymentIntent: session.payment_intent,
      metadata: session.metadata,
      paymentStatus: session.payment_status,
    });

    const prisma = require('../../../lib/prisma').default;
    const { ProductService } = require('../../../lib/productService');

    const userId = session.metadata?.user_id;
    const productId = session.metadata?.product_id;
    const customProductRequestId = session.metadata?.custom_product_request_id;
    const quantity = parseInt(session.metadata?.quantity || '1', 10);

    // Check if order already exists
    const existingOrder = await prisma.productOrder.findFirst({
      where: {
        OR: [
          { stripe_session_id: session.id },
          ...(session.payment_intent ? [{ stripe_payment_intent_id: session.payment_intent }] : [])
        ]
      },
    });

    if (existingOrder) {
      console.log('[STRIPE_WEBHOOK WARNING] Order already exists for this session:', existingOrder.id);
      // Still update the custom product request status if needed
      if (customProductRequestId && existingOrder.custom_product_request_id) {
        await prisma.customProductRequest.update({
          where: { id: customProductRequestId },
          data: { status: 'approved' }
        });
        console.log('[STRIPE_WEBHOOK] Updated custom product request status to approved');
      }
      return;
    }

    // Get payment intent
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    let paymentIntent;
    
    if (session.payment_intent) {
      paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
    } else {
      console.error('❌ [STRIPE_WEBHOOK] No payment intent in session');
      return;
    }

    if (paymentIntent.status !== 'succeeded') {
      console.log('[STRIPE_WEBHOOK WARNING] Payment intent not succeeded:', paymentIntent.status);
      return;
    }

    // Handle custom product request orders
    if (customProductRequestId) {
      // Additional check: if custom product request already has a paid order, don't create duplicate
      // This prevents duplicates if both payment_intent.succeeded and checkout.session.completed fire
      const existingPaidOrder = await prisma.productOrder.findFirst({
        where: {
          custom_product_request_id: customProductRequestId,
          payment_status: 'succeeded',
        },
      });

      if (existingPaidOrder) {
        console.log('[STRIPE_WEBHOOK] Custom product request already has a paid order, skipping duplicate creation:', {
          existingOrderId: existingPaidOrder.id,
          orderNumber: existingPaidOrder.order_number,
          customProductRequestId,
          sessionId: session.id,
          paymentIntentId: paymentIntent.id,
        });
        // Update existing order with session ID if not set
        if (!existingPaidOrder.stripe_session_id) {
          await prisma.productOrder.update({
            where: { id: existingPaidOrder.id },
            data: { stripe_session_id: session.id },
          });
        }
        // Still update custom product request status if needed
        await prisma.customProductRequest.update({
          where: { id: customProductRequestId },
          data: { status: 'approved' }
        });
        return;
      }

      const customRequest = await prisma.customProductRequest.findUnique({
        where: { id: customProductRequestId },
        include: {
          quotes: {
            where: { status: 'pending' },
            orderBy: { created_at: 'desc' },
            take: 1
          }
        }
      });

      if (!customRequest) {
        console.error('Custom product request not found:', customProductRequestId);
        return;
      }

      // Update quote status to approved
      if (customRequest.quotes && customRequest.quotes.length > 0) {
        await prisma.quote.update({
          where: { id: customRequest.quotes[0].id },
          data: { status: 'approved' }
        });
      }

      // Create product order for custom product
      const orderNumber = ProductService.generateOrderNumber();
      const productOrder = await prisma.productOrder.create({
        data: {
          user_id: userId !== 'guest' ? userId : customRequest.user_id,
          product_id: null, // Custom orders don't have a product
          custom_product_request_id: customProductRequestId,
          order_number: orderNumber,
          order_type: 'custom_order',
          stripe_payment_intent_id: paymentIntent.id,
          stripe_session_id: session.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'processing',
          payment_status: 'succeeded',
          preview_image_url: customRequest.preview_image,
          purchased_at: new Date(),
        },
      });

      // Update custom product request status
      await prisma.customProductRequest.update({
        where: { id: customProductRequestId },
        data: { status: 'approved' }
      });

      // Create payment record
      await prisma.payment.create({
        data: {
          product_order_id: productOrder.id,
          user_id: userId !== 'guest' ? userId : customRequest.user_id,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.charges?.data?.[0]?.id || null,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          payment_method: 'card',
          payment_type: 'full',
          paid_at: new Date(),
        },
      });

      console.log('[STRIPE_WEBHOOK] Custom product order created from checkout.session.completed:', {
        orderId: productOrder.id,
        orderNumber: productOrder.order_number,
        customProductRequestId,
        status: 'approved',
        paymentStatus: 'succeeded'
      });
      return;
    }

    // Handle regular product orders
    if (!userId || !productId) {
      console.error('Missing user_id or product_id in session metadata');
      return;
    }

    // Create product order
    const orderNumber = ProductService.generateOrderNumber();
    const productOrder = await prisma.productOrder.create({
      data: {
        user_id: userId,
        product_id: productId,
        order_number: orderNumber,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_session_id: session.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'completed',
        payment_status: 'paid',
        purchased_at: new Date(),
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        product_order_id: productOrder.id,
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0]?.id || null,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        payment_method: 'card',
        payment_type: 'full',
        paid_at: new Date(),
      },
    });

    // Fulfill order
    await ProductService.fulfillProductOrder(productOrder.id);

    console.log('Product order created:', {
      orderId: productOrder.id,
      orderNumber: productOrder.order_number,
    });
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

// Handle dispute created
async function handleDisputeCreated(dispute) {
  try {
    console.log('Dispute created:', {
      disputeId: dispute.id,
      charge: dispute.charge,
      amount: dispute.amount,
    });

    const prisma = require('../../../lib/prisma').default;

    // Find payment by charge ID
    const payment = await prisma.payment.findFirst({
      where: {
        stripe_charge_id: dispute.charge,
      },
    });

    if (payment) {
      // Create dispute record
      await prisma.paymentDispute.create({
        data: {
          payment_id: payment.id,
          invoice_id: payment.invoice_id,
          product_order_id: payment.product_order_id,
          initiated_by: payment.user_id,
          reason: dispute.reason || 'chargeback',
          description: dispute.evidence?.customer_communication || null,
          status: 'pending',
          requested_amount: dispute.amount,
          stripe_dispute_id: dispute.id,
        },
      });

      console.log('Dispute record created for payment:', payment.id);
    }
  } catch (error) {
    console.error('Error handling dispute created:', error);
  }
}

// Handle charge refunded
async function handleChargeRefunded(refund) {
  try {
    console.log('Charge refunded:', {
      refundId: refund.id,
      charge: refund.charge,
      amount: refund.amount,
    });

    const prisma = require('../../../lib/prisma').default;

    // Find payment by charge ID
    const payment = await prisma.payment.findFirst({
      where: {
        stripe_charge_id: refund.charge,
      },
    });

    if (payment) {
      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: refund.amount === payment.amount ? 'refunded' : 'partially_refunded',
        },
      });

      // Check if refund request already exists
      const existingRefund = await prisma.refundRequest.findFirst({
        where: {
          stripe_refund_id: refund.id,
        },
      });

      if (!existingRefund) {
        // Create refund request
        await prisma.refundRequest.create({
          data: {
            payment_id: payment.id,
            invoice_id: payment.invoice_id,
            product_order_id: payment.product_order_id,
            initiated_by: payment.user_id,
            reason: 'refund',
            description: refund.reason || null,
            status: 'processed',
            requested_amount: refund.amount,
            resolved_amount: refund.amount,
            stripe_refund_id: refund.id,
            resolved_at: new Date(),
          },
        });
      } else {
        // Update existing refund request
        await prisma.refundRequest.update({
          where: { id: existingRefund.id },
          data: {
            status: 'processed',
            resolved_amount: refund.amount,
            resolved_at: new Date(),
          },
        });
      }

      // Update invoice/product order if full refund
      if (refund.amount === payment.amount) {
        if (payment.invoice_id) {
          await prisma.invoice.update({
            where: { id: payment.invoice_id },
            data: { status: 'cancelled' },
          });
        }
        if (payment.product_order_id) {
          await prisma.productOrder.update({
            where: { id: payment.product_order_id },
            data: { payment_status: 'refunded' },
          });
        }
      }

      console.log('Refund processed for payment:', payment.id);
    }
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}
