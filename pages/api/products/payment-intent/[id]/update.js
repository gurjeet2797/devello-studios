import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import { UserService } from '../../../../../lib/userService';
import Stripe from 'stripe';

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
    if (!prismaUser) {
      return res.status(500).json({ error: 'Failed to retrieve user account' });
    }

    const { id } = req.query;
    const { shippingAddress } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    
    // Verify the payment intent belongs to this user
    const metadata = paymentIntent.metadata;
    if (metadata.user_id !== prismaUser.id) {
      return res.status(403).json({ error: 'Payment intent does not belong to this user' });
    }

    // Update payment intent metadata with shipping address
    const updatedMetadata = { ...metadata };
    if (shippingAddress) {
      updatedMetadata.shipping_address = JSON.stringify({
        title: shippingAddress.title || null,
        address_line1: shippingAddress.address_line1,
        address_line2: shippingAddress.address_line2 || null,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip_code: shippingAddress.zip_code,
        country: shippingAddress.country || 'US',
      });
    }

    // Update the payment intent
    await stripe.paymentIntents.update(id, {
      metadata: updatedMetadata,
    });

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Error updating payment intent:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
