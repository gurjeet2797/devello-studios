import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import { ProductService } from '../../../../lib/productService';
import Stripe from 'stripe';

const isDev = process.env.NODE_ENV !== 'production';
let stripeClient = null;

const getStripeClient = () => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  if (stripeClient) return stripeClient;
  stripeClient = new Stripe(secret, { apiVersion: '2024-06-20' });
  return stripeClient;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate Stripe configuration early
    let stripe;
    try {
      stripe = getStripeClient();
    } catch (stripeInitError) {
      console.error('[CHECKOUT] Stripe misconfiguration:', stripeInitError.message);
      return res.status(500).json({
        error: 'Payment configuration error',
        ...(isDev && { message: stripeInitError.message }),
      });
    }

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
      console.error('[CHECKOUT] Auth error:', authError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    if (!prismaUser) {
      console.error('[CHECKOUT] Failed to get or create user');
      return res.status(500).json({ error: 'Failed to retrieve user account' });
    }

    const { id } = req.query;
    if (!id) {
      console.error('[CHECKOUT] Missing product ID');
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const { quantity = 1, variantPrice, variantName, shippingAddress, height = null, width = null } = req.body;

    // Validate shipping address if provided
    if (shippingAddress) {
      if (!shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip_code) {
        return res.status(400).json({ error: 'Invalid shipping address: missing required fields' });
      }
    }

    // Validate product
    const validation = await ProductService.validateProductAvailability(id);
    if (!validation.available) {
      console.error('[CHECKOUT] Product validation failed:', validation.reason);
      return res.status(400).json({ error: validation.reason });
    }

    const product = validation.product;
    if (!product) {
      console.error('[CHECKOUT] Product not found:', id);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Always get price from database, never trust frontend price
    // If variantName is provided, get variant price from database metadata
    const unitPrice = variantName 
      ? ProductService.getVariantPrice(product, variantName)
      : product.price;
    
    if (!unitPrice || unitPrice <= 0) {
      console.error('[CHECKOUT] Invalid price:', { variantName, productPrice: product.price, unitPrice });
      return res.status(400).json({ error: 'Invalid product price' });
    }

    // Log if frontend sent different price (for debugging)
    if (variantPrice && variantPrice !== unitPrice) {
      console.warn('[CHECKOUT] Price mismatch - frontend sent:', variantPrice, 'database has:', unitPrice);
    }
    
    // Calculate pricing
    let amountInCents = Math.round(unitPrice * quantity);
    if (amountInCents <= 0) {
      console.error('[CHECKOUT] Invalid amount:', amountInCents);
      return res.status(400).json({ error: 'Invalid order amount' });
    }
    // Enforce Stripe minimum $1.00 to avoid underflow/fees on tiny items
    if (amountInCents < 100) {
      amountInCents = 100;
    }

    // Get or create Stripe customer
    let customerId = null;
    try {
      // Check if user has subscription with customer ID
      if (prismaUser.subscription?.stripe_customer_id) {
        customerId = prismaUser.subscription.stripe_customer_id;
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: prismaUser.email,
          metadata: {
            user_id: prismaUser.id,
          },
        });
        customerId = customer.id;
        
        // Update user subscription with customer ID if subscription exists
        if (prismaUser.subscription) {
          await UserService.updateSubscription(prismaUser.id, {
            stripe_customer_id: customerId,
          });
        }
      }
    } catch (customerError) {
      console.error('[CHECKOUT] Error creating/retrieving customer:', customerError);
      return res.status(500).json({ error: 'Failed to create payment customer' });
    }

    if (!customerId) {
      console.error('[CHECKOUT] No customer ID available');
      return res.status(500).json({ error: 'Failed to retrieve customer information' });
    }

    // Validate currency
    const currency = (product.currency || 'usd').toLowerCase();
    if (!currency || currency.length !== 3) {
      console.error('[CHECKOUT] Invalid currency:', product.currency);
      return res.status(400).json({ error: 'Invalid product currency' });
    }

    // Create payment intent for custom checkout (not redirect)
    try {
      const paymentIntentMetadata = {
        user_id: prismaUser.id,
        product_id: product.id,
        price_id: product.stripe_price_id || null,
        quantity: quantity.toString(),
        variantName: variantName || null,
        variant_price: unitPrice.toString(),
        height: height || null,
        width: width || null,
      };

      // Add shipping address to metadata if provided
      if (shippingAddress) {
        paymentIntentMetadata.shipping_address = JSON.stringify({
          title: shippingAddress.title || null,
          address_line1: shippingAddress.address_line1,
          address_line2: shippingAddress.address_line2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip_code: shippingAddress.zip_code,
          country: shippingAddress.country || 'US',
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency,
        customer: customerId,
        metadata: paymentIntentMetadata,
      });

      return res.status(200).json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        sessionId: paymentIntent.id, // For backward compatibility
      });
    } catch (stripeError) {
      console.error('[CHECKOUT] Stripe error:', stripeError);
      return res.status(500).json({ 
        error: 'Failed to create payment intent',
        details: stripeError.message 
      });
    }
  } catch (error) {
    console.error('[CHECKOUT] Unexpected error:', error);
    console.error('[CHECKOUT] Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

