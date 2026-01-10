import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { StripeSubscriptionService } from '../../../lib/stripeSubscriptionService';
import { subscriptionCache } from '../../../lib/subscriptionCache';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseAuthClient();
    if (!prisma) {
      return res.status(500).json({ error: 'Database client unavailable' });
    }
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userData = await prisma.user.findUnique({
      where: { supabase_user_id: user.id },
      include: {
        subscription: true
      }
    });

    if (!userData || !userData.subscription) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    const subscription = userData.subscription;

    // Check if user has an active subscription
    if (subscription.status === 'canceled') {
      return res.status(400).json({ error: 'Subscription is already canceled' });
    }
    
    if (subscription.status !== 'active') {
      return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    // Only allow cancellation of real Stripe subscriptions
    if (!subscription.stripe_subscription_id || !subscription.stripe_subscription_id.startsWith('sub_')) {
      return res.status(400).json({ error: 'No valid Stripe subscription found. Please contact support.' });
    }

    // Cancel the subscription in Stripe using the service
    
    try {
      await StripeSubscriptionService.cancelSubscription(subscription.stripe_subscription_id);
    } catch (stripeError) {
      console.error('❌ [CANCEL_SUBSCRIPTION] Failed to cancel Stripe subscription:', stripeError.message);
      return res.status(500).json({ error: 'Failed to cancel subscription. Please contact support.' });
    }

    // Update the subscription status in our database
    // Keep current plan and limits until period ends
    await prisma.subscription.update({
      where: { user_id: userData.id },
      data: {
        status: 'canceled'
        // Keep plan_type and upload_limit unchanged until period ends
      }
    });

    // Don't update profile upload limit - keep current limits until period ends

    // Invalidate cache for this customer
    if (userData.subscription?.stripe_customer_id) {
      subscriptionCache.invalidate(userData.subscription.stripe_customer_id);
    }


    return res.status(200).json({ 
      success: true, 
      message: 'Subscription canceled successfully. You will retain access until the end of your current billing period.' 
    });

  } catch (error) {
    console.error('❌ [CANCEL_SUBSCRIPTION] Error:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}
