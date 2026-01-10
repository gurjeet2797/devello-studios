import { createSupabaseServerClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import { StripeSubscriptionService } from '../../../lib/stripeSubscriptionService';
import { subscriptionCache } from '../../../lib/subscriptionCache';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServerClient();
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }


    // Get user data with subscription
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

    // Check if user has a canceled subscription that can be reactivated
    if (subscription.status !== 'canceled') {
      return res.status(400).json({ error: 'Subscription is not canceled or cannot be reactivated' });
    }

    // Only allow reactivation of real Stripe subscriptions
    if (!subscription.stripe_subscription_id || !subscription.stripe_subscription_id.startsWith('sub_')) {
      return res.status(400).json({ error: 'No valid Stripe subscription found for reactivation' });
    }


    try {
      // Reactivate the subscription in Stripe
      await StripeSubscriptionService.reactivateSubscription(subscription.stripe_subscription_id);
    } catch (stripeError) {
      console.error('❌ [REACTIVATE_SUBSCRIPTION] Failed to reactivate Stripe subscription:', stripeError.message);
      return res.status(500).json({ error: 'Failed to reactivate subscription. Please contact support.' });
    }

    // Update the subscription status in our database
    await prisma.subscription.update({
      where: { user_id: userData.id },
      data: {
        status: 'active',
        // Keep the current plan type and upload limit
        plan_type: subscription.plan_type,
        upload_limit: subscription.upload_limit
      }
    });

    // Invalidate cache for this customer to ensure immediate updates
    if (userData.subscription?.stripe_customer_id) {
      subscriptionCache.invalidate(userData.subscription.stripe_customer_id);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Subscription reactivated successfully. Your billing will resume immediately.' 
    });

  } catch (error) {
    console.error('❌ [REACTIVATE_SUBSCRIPTION] Error:', error);
    return res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
}
