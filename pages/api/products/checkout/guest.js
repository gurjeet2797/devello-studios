import { ProductService } from '../../../../lib/productService';
import PaymentService from '../../../../lib/paymentService';

const isDev = process.env.NODE_ENV !== 'production';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { guestInfo, items } = req.body;

    // Validate guest info
    if (!guestInfo || !guestInfo.email || !guestInfo.fullName || !guestInfo.address || !guestInfo.city || !guestInfo.state || !guestInfo.zip) {
      return res.status(400).json({ error: 'Missing required guest information' });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate all products and calculate total
    let totalAmount = 0;
    const lineItems = [];
    const orderItems = [];
    const validatedProducts = [];

    for (const item of items) {
      if (!item?.productId) {
        return res.status(400).json({ error: 'Invalid cart item: missing productId' });
      }

      const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;

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
      if (!price || price <= 0) {
        return res.status(400).json({ error: `Product ${product.id} has invalid price` });
      }

      const currency = (product.currency || 'usd').toLowerCase();
      if (!currency || currency.length !== 3) {
        return res.status(400).json({ error: `Product ${product.id} has invalid currency` });
      }

      let itemTotal = price * quantity;
      // Enforce Stripe minimum $1.00 to avoid underflow
      if (itemTotal < 100) {
        itemTotal = 100;
      }
      totalAmount += itemTotal;

      // Build order items array with complete details
      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.image_url || null,
        variantName: item.variantName || null,
        variantMaterial: item.variantMaterial || null,
        quantity: quantity,
        price: price,
        total: itemTotal,
        currency: currency,
        stripePriceId: product.stripe_price_id || null,
      });

      lineItems.push({
        price_data: {
          currency: currency,
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

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid order amount calculated' });
    }

    // Create or retrieve Stripe customer for guest (by email)
    let customerId;
    try {
      const customer = await PaymentService.ensureCustomer({
        email: guestInfo.email,
        name: guestInfo.fullName,
        metadata: {
          guest_checkout: 'true',
          guest_name: guestInfo.fullName,
        },
      });
      customerId = customer?.id;
    } catch (customerError) {
      console.error('Error creating/retrieving customer:', customerError);
      // Continue without customer - Stripe allows payment intents without customers
    }

    // Create payment intent for guest checkout
    const paymentIntentData = {
      amount: Math.round(totalAmount),
      currency: 'usd',
      metadata: {
        guest_email: guestInfo.email,
        guest_name: guestInfo.fullName,
        guest_phone: guestInfo.phone || '',
        shipping_address: JSON.stringify({
          address: guestInfo.address,
          city: guestInfo.city,
          state: guestInfo.state,
          zip: guestInfo.zip,
          country: 'US',
        }),
        order_items: JSON.stringify(orderItems),
        // Keep items for backward compatibility
        items: JSON.stringify(items),
        checkout_type: 'guest',
      },
    };

    const containsTestItems = validatedProducts.some(p => ProductService.isTestProduct(p));
    const isTestOrder = validatedProducts.length > 0 && validatedProducts.every(p => ProductService.isTestProduct(p));

    if (containsTestItems) {
      paymentIntentData.metadata.contains_test_items = 'true';
    }
    if (isTestOrder) {
      paymentIntentData.metadata.test_order = 'true';
    }

    // Add customer if we have one
    if (customerId) {
      paymentIntentData.customer = customerId;
    }

    let paymentIntent;
    try {
      paymentIntent = await PaymentService.createPaymentIntent({
        amount: paymentIntentData.amount,
        currency: paymentIntentData.currency,
        customerId,
        metadata: paymentIntentData.metadata,
      });
    } catch (stripeError) {
      console.error('[GUEST_CHECKOUT] Stripe error:', stripeError);
      return res.status(500).json({
        error: 'Failed to create payment intent',
        ...(isDev && { message: stripeError.message }),
      });
    }

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating guest checkout:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
