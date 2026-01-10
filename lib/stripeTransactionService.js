import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeTransactionService {
  /**
   * Fetch all transactions from Stripe and sync to database
   */
  static async syncAllTransactions() {
    try {
      console.log('🔄 Starting Stripe transaction sync...');
      
      // Fetch all payment intents
      const paymentIntents = await this.fetchAllPaymentIntents();
      console.log(`📊 Found ${paymentIntents.length} payment intents`);
      
      // Fetch all charges
      const charges = await this.fetchAllCharges();
      console.log(`📊 Found ${charges.length} charges`);
      
      // Fetch all subscription events
      const subscriptionEvents = await this.fetchAllSubscriptionEvents();
      console.log(`📊 Found ${subscriptionEvents.length} subscription events`);
      
      // Process and store all transactions
      const allTransactions = [
        ...paymentIntents,
        ...charges,
        ...subscriptionEvents
      ];
      
      console.log(`📊 Total transactions to process: ${allTransactions.length}`);
      
      return allTransactions;
    } catch (error) {
      console.error('❌ Error syncing Stripe transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch all payment intents from Stripe
   */
  static async fetchAllPaymentIntents() {
    const paymentIntents = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = {
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter })
      };

      const response = await stripe.paymentIntents.list(params);
      paymentIntents.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    return paymentIntents.map(pi => ({
      stripe_transaction_id: pi.id,
      stripe_payment_intent_id: pi.id,
      stripe_customer_id: pi.customer,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      transaction_type: 'payment',
      description: pi.description,
      stripe_metadata: pi.metadata,
      stripe_created: new Date(pi.created * 1000),
      stripe_updated: pi.updated ? new Date(pi.updated * 1000) : null,
      user_email: pi.receipt_email,
      processed: false,
      sync_status: 'pending'
    }));
  }

  /**
   * Fetch all charges from Stripe
   */
  static async fetchAllCharges() {
    const charges = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = {
        limit: 100,
        ...(startingAfter && { starting_after: startingAfter })
      };

      const response = await stripe.charges.list(params);
      charges.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    return charges.map(charge => ({
      stripe_transaction_id: charge.id,
      stripe_charge_id: charge.id,
      stripe_payment_intent_id: charge.payment_intent,
      stripe_customer_id: charge.customer,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      transaction_type: charge.refunded ? 'refund' : 'payment',
      description: charge.description,
      stripe_metadata: charge.metadata,
      stripe_created: new Date(charge.created * 1000),
      stripe_updated: charge.updated ? new Date(charge.updated * 1000) : null,
      user_email: charge.receipt_email,
      processed: false,
      sync_status: 'pending'
    }));
  }

  /**
   * Fetch all subscription events from Stripe
   */
  static async fetchAllSubscriptionEvents() {
    const subscriptions = [];
    let hasMore = true;
    let startingAfter = null;

    while (hasMore) {
      const params = {
        limit: 100,
        status: 'all',
        ...(startingAfter && { starting_after: startingAfter })
      };

      const response = await stripe.subscriptions.list(params);
      subscriptions.push(...response.data);
      
      hasMore = response.has_more;
      if (hasMore && response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    return subscriptions.map(sub => ({
      stripe_transaction_id: sub.id,
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer,
      amount: sub.items.data[0]?.price?.unit_amount || 0,
      currency: sub.currency,
      status: sub.status,
      transaction_type: 'subscription',
      description: `Subscription: ${sub.items.data[0]?.price?.nickname || 'Plan'}`,
      stripe_metadata: sub.metadata,
      stripe_created: new Date(sub.created * 1000),
      stripe_updated: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
      processed: false,
      sync_status: 'pending'
    }));
  }

  /**
   * Get recent transactions (last 30 days)
   */
  static async getRecentTransactions(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startTimestamp = Math.floor(startDate.getTime() / 1000);

      // Get recent payment intents
      const paymentIntents = await stripe.paymentIntents.list({
        created: { gte: startTimestamp },
        limit: 100
      });

      // Get recent charges
      const charges = await stripe.charges.list({
        created: { gte: startTimestamp },
        limit: 100
      });

      return {
        paymentIntents: paymentIntents.data,
        charges: charges.data
      };
    } catch (error) {
      console.error('❌ Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction by Stripe ID
   */
  static async getTransactionById(stripeId, type = 'payment_intent') {
    try {
      switch (type) {
        case 'payment_intent':
          return await stripe.paymentIntents.retrieve(stripeId);
        case 'charge':
          return await stripe.charges.retrieve(stripeId);
        case 'subscription':
          return await stripe.subscriptions.retrieve(stripeId);
        default:
          throw new Error(`Unknown transaction type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching ${type} ${stripeId}:`, error);
      throw error;
    }
  }
}
