import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export class StripeService {
  // Create a customer
  static async createCustomer(email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          source: 'devello_studio'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a checkout session for subscription
  static async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, mode = 'subscription', metadata = {}) {
    try {
      const baseMetadata = {
        source: 'devello_studio',
        ...metadata
      };

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: baseMetadata,
        // Ensure metadata is present on the Payment Intent for one-time payments
        ...(mode === 'payment'
          ? {
              payment_intent_data: {
                metadata: baseMetadata
              }
            }
          : {})
      });
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a portal session for subscription management
  static async createPortalSession(customerId, returnUrl) {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  // Get subscription details
  static async getSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'items.data.price']
      });
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Get customer details
  static async getCustomer(customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }

  // List customer subscriptions
  static async listCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        expand: ['data.default_payment_method']
      });
      return subscriptions;
    } catch (error) {
      console.error('Error listing customer subscriptions:', error);
      throw error;
    }
  }

  // Get price details
  static async getPrice(priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      return price;
    } catch (error) {
      console.error('Error retrieving price:', error);
      throw error;
    }
  }

  // List available prices
  static async listPrices() {
    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product']
      });
      return prices;
    } catch (error) {
      console.error('Error listing prices:', error);
      throw error;
    }
  }
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  PRO: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    uploadLimit: 60, // 5 free + 55 pro = 60 total
    features: [
      '60 uploads per month (5 free + 55 pro)',
      'Priority processing',
      'Advanced editing tools',
      'Email support',
      'Reference image search',
      'Batch processing'
    ]
  },
  BASIC: {
    name: 'Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    uploadLimit: 30, // 5 free + 25 basic = 30 total
    features: [
      '30 uploads per month (5 free + 25 basic)',
      'Standard processing',
      'Basic editing tools',
      'Email support'
    ]
  }
};

// Debug logging
console.log('Subscription plans status:', {
  PRO: SUBSCRIPTION_PLANS.PRO?.priceId ? 'configured' : 'missing price ID',
  BASIC: SUBSCRIPTION_PLANS.BASIC?.priceId ? 'configured' : 'missing price ID'
});
