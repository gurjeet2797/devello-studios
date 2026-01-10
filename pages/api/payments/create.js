import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import prisma from '../../../lib/prisma';
import Stripe from 'stripe';
import { transitionProductOrder, OrderStatuses } from '../../../lib/orderStateMachine';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const supabase = createSupabaseAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    const userWithSubscription = await prisma.user.findUnique({
      where: { id: prismaUser.id },
      include: { subscription: true },
    });
    const stripeCustomerId = userWithSubscription?.subscription?.stripe_customer_id || undefined;

    const {
      invoiceId,
      orderId,
      productOrderId,
      amount,
      currency = 'usd',
      paymentMethodId,
      paymentType = 'full', // full, deposit, partial, final
      scheduledDate,
    } = req.body;

    // Validate that at least one of invoiceId, orderId, or productOrderId is provided
    if (!invoiceId && !orderId && !productOrderId) {
      return res.status(400).json({ error: 'Must provide invoiceId, orderId, or productOrderId' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Get the source entity (invoice, order, or product order)
    let sourceEntity;
    let partnerId;
    let customerId;

    if (invoiceId) {
      sourceEntity = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { partner: true, user: true },
      });
      if (!sourceEntity) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      partnerId = sourceEntity.partner_id;
      customerId = sourceEntity.user_id;
    } else if (orderId) {
      sourceEntity = await prisma.order.findUnique({
        where: { id: orderId },
        include: { partner: true, user: true },
      });
      if (!sourceEntity) {
        return res.status(404).json({ error: 'Order not found' });
      }
      partnerId = sourceEntity.partner_id;
      customerId = sourceEntity.user_id;
    } else if (productOrderId) {
      sourceEntity = await prisma.productOrder.findUnique({
        where: { id: productOrderId },
        include: { user: true },
      });
      if (!sourceEntity) {
        return res.status(404).json({ error: 'Product order not found' });
      }
      customerId = sourceEntity.user_id;
    }

    // For partner orders/invoices, check if we need to use Stripe Connect
    let paymentIntent;
    const amountInCents = Math.round(amount * 100);

    const idempotencyKey = `payment-create:${invoiceId || orderId || productOrderId || 'direct'}:${prismaUser.id}`;

    if (partnerId) {
      // Partner payment - use Stripe Connect
      const bankAccount = await prisma.partnerBankAccount.findUnique({
        where: { partner_id: partnerId },
      });

      if (!bankAccount || !bankAccount.stripe_account_id) {
        return res.status(400).json({ error: 'Partner has not set up payment account' });
      }

      // Create payment intent with Connect account
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          customer: stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          application_fee_amount: 0, // No platform fee for now
          transfer_data: {
            destination: bankAccount.stripe_account_id,
          },
          metadata: {
            invoice_id: invoiceId || '',
            order_id: orderId || '',
            product_order_id: productOrderId || '',
            payment_type: paymentType,
          },
        },
        { idempotencyKey }
      );
    } else {
      // Direct Devello product payment
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          customer: stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            product_order_id: productOrderId || '',
            payment_type: paymentType,
          },
        },
        { idempotencyKey }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoice_id: invoiceId || null,
        order_id: orderId || null,
        product_order_id: productOrderId || null,
        user_id: customerId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges.data[0]?.id || null,
        amount: amountInCents,
        currency: currency.toLowerCase(),
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        payment_method: 'card',
        payment_type: paymentType,
        scheduled_date: scheduledDate ? new Date(scheduledDate) : null,
        paid_at: paymentIntent.status === 'succeeded' ? new Date() : null,
      },
    });

    // Update source entity status if payment succeeded
    if (paymentIntent.status === 'succeeded') {
      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'paid', paid_at: new Date() },
        });
      }
      if (productOrderId) {
        await prisma.productOrder.update({
          where: { id: productOrderId },
          data: { payment_status: 'paid', purchased_at: new Date() },
        });
        await transitionProductOrder({
          orderId: productOrderId,
          targetStatus: OrderStatuses.completed,
          reason: 'payment_intent_succeeded',
          actorType: 'system',
          prismaClient: prisma,
        });
      }
    }

    return res.status(200).json({
      success: true,
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        client_secret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

