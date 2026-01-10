import Stripe from 'stripe';
import { createSupabaseAuthClient } from '../../../lib/supabaseClient';

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

    // Get user data
    const userData = await supabase.from('users').select('subscription').eq('id', user.id).single();

    if (userData.error || !userData.data?.subscription) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    // Create portal session
    const baseUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.data.subscription.stripe_customer_id,
      return_url: `${baseUrl}/profile`,
    });

    return res.status(200).json({
      url: session.url
    });
  } catch (error) {
    console.error('Create portal session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
