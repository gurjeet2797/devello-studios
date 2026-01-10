import { createSupabaseServerClient } from '../../../lib/supabaseClient';
import { StripeService } from '../../../lib/stripeService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get the authorization header (optional for one-time purchases)
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }
    
    // For one-time purchases, we can allow unauthenticated users
    // They'll be prompted to sign in during the checkout process
    const userId = user?.id || 'anonymous';
    const userEmail = user?.email || 'guest@example.com';

    const { success_url, cancel_url, sessionId } = req.body;

    if (!success_url || !cancel_url) {
      return res.status(400).json({ error: 'Missing success_url or cancel_url' });
    }

    // Create Stripe customer
    const customer = await StripeService.createCustomer(userEmail, userEmail);

    // Create checkout session for single upload
    const session = await StripeService.createCheckoutSession(
      customer.id,
      process.env.STRIPE_SINGLE_UPLOAD_PRICE_ID,
      success_url,
      cancel_url,
      'payment', // One-time payment
      {
        userId: userId,
        userEmail: userEmail,
        purchaseType: 'single_upload',
        credits: '1',
        sessionId: sessionId || `guest-${Date.now()}`
      }
    );

    return res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create single upload session error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
