import Stripe from 'stripe';
import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import { StripeService, SUBSCRIPTION_PLANS } from '../../../lib/stripeService';

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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user using auth client (anon key)
    const supabase = createSupabaseAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { planId, priceId, mode, successUrl, cancelUrl } = req.body;


    let plan;
    let targetPriceId;

    // Handle different request formats
    if (priceId) {
      // Direct price ID provided (from billing modal)
      targetPriceId = priceId;
      plan = { priceId: targetPriceId };
    } else if (planId && SUBSCRIPTION_PLANS[planId.toUpperCase()]) {
      // Plan ID provided (from subscription modal)
      plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
      targetPriceId = plan.priceId;
    } else {
      console.error('Invalid plan ID or price ID:', { planId, priceId });
      return res.status(400).json({ error: 'Invalid plan ID or price ID' });
    }

    // Get or create user
    const userData = await UserService.getOrCreateUser(user.id, user.email);

    // Create or get Stripe customer
    let customerId = userData.subscription?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await StripeService.createCustomer(
        user.email,
        `${userData.profile?.first_name || ''} ${userData.profile?.last_name || ''}`.trim() || user.email
      );
      customerId = customer.id;

      // Update user subscription with customer ID
      await UserService.updateSubscription(userData.id, {
        stripe_customer_id: customerId
      });
    }

    // Create checkout session
    const baseUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';
    const session = await StripeService.createCheckoutSession(
      customerId,
      targetPriceId,
      successUrl || `${baseUrl}/profile?success=true`,
      cancelUrl || `${baseUrl}/profile?canceled=true`,
      mode || 'subscription',
      {
        userId: userData.id,
        userEmail: user.email,
        planType: planId || (priceId === process.env.STRIPE_BASIC_PRICE_ID ? 'basic' : 'pro')
      }
    );

    return res.status(200).json({
      sessionId: session.id
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
