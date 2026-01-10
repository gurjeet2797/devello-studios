import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import { ProductService } from '../../../../lib/productService';
import PaymentService from '../../../../lib/paymentService';

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
    const { items, shippingAddress, contactEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate shipping address if provided
    if (shippingAddress) {
      if (!shippingAddress.address_line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip_code) {
        return res.status(400).json({ error: 'Invalid shipping address: missing required fields' });
      }
    }

    // Validate all products and calculate total
    let totalAmount = 0;
    const lineItems = [];
    const validatedProducts = [];

    for (const item of items) {
      const validation = await ProductService.validateProductAvailability(item.productId);
      if (!validation.available) {
        return res.status(400).json({ error: `Product ${item.productId} is not available: ${validation.reason}` });
      }

      const product = validation.product;
      validatedProducts.push(product);
      // Always get price from database - use variant price if variantName is provided
      const price = item.variantName 
        ? ProductService.getVariantPrice(product, item.variantName)
        : product.price;
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      totalAmount += itemTotal;

      // Log if frontend sent different price (for debugging)
      if (item.price && item.price !== price) {
        console.warn('[CART_CHECKOUT] Price mismatch for product', product.id, '- frontend sent:', item.price, 'database has:', price);
      }

      lineItems.push({
        price_data: {
          currency: product.currency.toLowerCase(),
          product_data: {
            name: product.name,
            description: item.variantName 
              ? `${product.name} - ${item.variantName}`
              : product.description || undefined,
          },
          unit_amount: Math.round(price),
        },
        quantity: quantity,
      });
    }

    // Get or create Stripe customer
    let customerId = prismaUser.subscription?.stripe_customer_id;
    if (!customerId) {
      const customer = await PaymentService.ensureCustomer({
        email: prismaUser.email,
        metadata: {
          user_id: prismaUser.id,
        },
      });
      customerId = customer.id;
    }

    // Create payment intent for custom checkout
    const paymentIntentMetadata = {
      user_id: prismaUser.id,
      items: JSON.stringify(items),
    };
    if (contactEmail) {
      paymentIntentMetadata.contact_email = contactEmail;
    }

    const containsTestItems = validatedProducts.some(p => ProductService.isTestProduct(p));
    const isTestOrder = validatedProducts.length > 0 && validatedProducts.every(p => ProductService.isTestProduct(p));

    if (containsTestItems) {
      paymentIntentMetadata.contains_test_items = 'true';
    }
    if (isTestOrder) {
      paymentIntentMetadata.test_order = 'true';
    }

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

    const paymentIntent = await PaymentService.createPaymentIntent({
      amount: Math.round(totalAmount),
      currency: 'usd',
      customerId,
      metadata: paymentIntentMetadata,
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating cart checkout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

