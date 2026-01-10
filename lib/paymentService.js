import Stripe from 'stripe';
import prisma from './prisma';
import { logger as secureLogger } from './secureLogger';

const logger = secureLogger || console;

const stripeSecret =
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_TEST;
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET_TEST;

const stripeClient = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  : null;

function requireStripe() {
  if (!stripeClient) {
    throw new Error('Stripe is not configured. Missing STRIPE_SECRET_KEY.');
  }
  return stripeClient;
}

export const PaymentService = {
  async createPaymentIntent({
    amount,
    currency = 'usd',
    customerId,
    metadata = {},
    paymentMethodTypes = ['card'],
  }) {
    const stripe = requireStripe();
    return stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
      payment_method_types: paymentMethodTypes,
    });
  },

  async retrievePaymentIntent(id) {
    const stripe = requireStripe();
    return stripe.paymentIntents.retrieve(id);
  },

  getStripeClient() {
    return requireStripe();
  },

  async ensureCustomer({ email, name, metadata = {} }) {
    const stripe = requireStripe();
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      return existing.data[0];
    }
    return stripe.customers.create({
      email,
      name,
      metadata,
    });
  },

  verifyStripeWebhook(rawBody, signature) {
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    const stripe = requireStripe();
    return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  },

  async recordWebhookEvent(event, status = 'pending') {
    if (!event?.id) {
      throw new Error('Webhook event is missing an id');
    }

    const existing = await prisma.paymentWebhookEvent.findUnique({
      where: {
        provider_event_id: {
          provider: 'stripe',
          event_id: event.id,
        },
      },
    });

    if (existing) {
      return { alreadyProcessed: existing.status === 'processed', record: existing };
    }

    const record = await prisma.paymentWebhookEvent.create({
      data: {
        provider: 'stripe',
        event_id: event.id,
        type: event.type,
        payload: event,
        status,
      },
    });

    return { alreadyProcessed: false, record };
  },

  async markWebhookProcessed(recordId) {
    if (!recordId) return;
    await prisma.paymentWebhookEvent.update({
      where: { id: recordId },
      data: {
        status: 'processed',
        processed_at: new Date(),
      },
    });
  },

  async markWebhookFailed(recordId, errorMessage) {
    if (!recordId) return;
    await prisma.paymentWebhookEvent.update({
      where: { id: recordId },
      data: {
        status: 'failed',
        error_message: errorMessage?.slice(0, 500) || 'unknown error',
        processed_at: new Date(),
      },
    });
  },
};

export default PaymentService;

