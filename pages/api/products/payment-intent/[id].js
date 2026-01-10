import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import { ProductService } from '../../../../lib/productService';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get product details if product_id exists
    let product = null;
    if (metadata.product_id) {
      product = await ProductService.getProductById(metadata.product_id);
    }

    return res.status(200).json({
      success: true,
      product,
      metadata: {
        product_id: metadata.product_id,
        variantName: metadata.variantName,
        quantity: metadata.quantity,
        variant_price: metadata.variant_price,
      },
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
