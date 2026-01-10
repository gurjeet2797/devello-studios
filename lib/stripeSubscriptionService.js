import Stripe from 'stripe';
import { subscriptionCache } from './subscriptionCache';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export class StripeSubscriptionService {
  
  /**
   * Sync user subscription with Stripe (with caching to avoid excessive API calls)
   */
  static async syncUserSubscription(user) {
    try {
      
      // Only sync if user has a Stripe customer ID
      if (!user.subscription?.stripe_customer_id) {
        return { needsUpdate: false, subscription: null };
      }

      const customerId = user.subscription.stripe_customer_id;
      
      // Check cache first
      const cachedData = subscriptionCache.get(customerId);
      if (cachedData) {
        const needsUpdate = this.checkIfNeedsUpdate(user.subscription, cachedData);
        return { needsUpdate, subscription: cachedData };
      }
      
      // Get all active subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all', // Get all subscriptions (active, canceled, etc.)
        limit: 10
      });


      // Find the most recent active subscription
      const activeSubscription = subscriptions.data.find(sub => 
        sub.status === 'active' && 
        !sub.cancel_at_period_end
      );

      // Find the most recent subscription (even if canceled)
      const latestSubscription = subscriptions.data.sort((a, b) => 
        b.created - a.created
      )[0];

      const currentSubscription = activeSubscription || latestSubscription;

      if (!currentSubscription) {
        return { needsUpdate: true, subscription: null };
      }

      console.log('Current subscription details:', {
        id: currentSubscription.id,
        status: currentSubscription.status,
        cancel_at_period_end: currentSubscription.cancel_at_period_end,
        current_period_end: new Date(currentSubscription.current_period_end * 1000)
      });

      // Cache the subscription data
      subscriptionCache.set(customerId, currentSubscription);

      // Check if our database is out of sync
      const needsUpdate = this.checkIfNeedsUpdate(user.subscription, currentSubscription);
      
      if (needsUpdate) {
        return {
          needsUpdate: true,
          subscription: currentSubscription
        };
      }

      return { needsUpdate: false, subscription: currentSubscription };

    } catch (error) {
      console.error('❌ [STRIPE_SYNC] Error syncing subscription:', error.message);
      // Don't throw error - just log it and continue with cached data
      return { needsUpdate: false, subscription: null, error: error.message };
    }
  }

  /**
   * Check if database needs update based on Stripe data
   */
  static checkIfNeedsUpdate(dbSubscription, stripeSubscription) {
    // Check if subscription ID matches
    if (dbSubscription.stripe_subscription_id !== stripeSubscription.id) {
      return true;
    }

    // Check if status matches
    const expectedStatus = this.getExpectedStatus(stripeSubscription);
    if (dbSubscription.status !== expectedStatus) {
      return true;
    }

    // Check if plan type matches
    const expectedPlanType = this.getPlanTypeFromPriceId(stripeSubscription.items.data[0].price.id);
    if (dbSubscription.plan_type !== expectedPlanType) {
      return true;
    }

    // Check if cancel_at_period_end status matches
    const isCanceled = stripeSubscription.cancel_at_period_end || stripeSubscription.status === 'canceled';
    if (isCanceled && dbSubscription.status !== 'canceled') {
      return true;
    }

    return false;
  }

  /**
   * Get expected status from Stripe subscription
   */
  static getExpectedStatus(stripeSubscription) {
    if (stripeSubscription.status === 'canceled') {
      return 'canceled';
    }
    if (stripeSubscription.cancel_at_period_end) {
      return 'canceled'; // Mark as canceled when set to cancel at period end
    }
    if (stripeSubscription.status === 'active') {
      return 'active';
    }
    return 'inactive';
  }

  /**
   * Get plan type from Stripe price ID
   */
  static getPlanTypeFromPriceId(priceId) {
    const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
    
    if (priceId === basicPriceId) return 'basic';
    if (priceId === proPriceId) return 'pro';
    return 'free';
  }

  /**
   * Get upload limit from Stripe price ID
   */
  static getUploadLimitFromPriceId(priceId) {
    const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
    
    if (priceId === basicPriceId) return 30; // 5 free + 25 basic
    if (priceId === proPriceId) return 60; // 5 free + 55 pro
    return 5; // Free tier
  }

  /**
   * Cancel subscription in Stripe
   */
  static async cancelSubscription(subscriptionId) {
    try {
      
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          canceled_by_user: 'true',
          canceled_at: new Date().toISOString()
        }
      });

      return { success: true, subscription };
    } catch (error) {
      console.error('❌ [STRIPE_SYNC] Error canceling subscription:', error.message);
      throw error;
    }
  }

  /**
   * Reactivate subscription in Stripe
   */
  static async reactivateSubscription(subscriptionId) {
    try {
      
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        metadata: {
          reactivated_by_user: 'true',
          reactivated_at: new Date().toISOString()
        }
      });

      return { success: true, subscription };
    } catch (error) {
      console.error('❌ [STRIPE_SYNC] Error reactivating subscription:', error.message);
      throw error;
    }
  }

  /**
   * Get subscription details from Stripe
   */
  static async getSubscriptionDetails(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return { success: true, subscription };
    } catch (error) {
      console.error('❌ [STRIPE_SYNC] Error fetching subscription:', error.message);
      return { success: false, error: error.message };
    }
  }
}
