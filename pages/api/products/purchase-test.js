import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import { ProductService } from '../../../lib/productService';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../../../lib/emailService';
import prisma from '../../../lib/prisma';

// Test endpoint for local testing - bypasses Stripe
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test endpoint not available in production' });
  }

  try {
    const { productId, quantity = 1, userId, guestEmail, shippingAddress } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    // Get user
    let user = null;
    if (userId) {
      const supabase = createSupabaseAuthClient();
      const { data: { user: authUser } } = await supabase.auth.getUser(userId);
      if (authUser) {
        user = await UserService.getUserById(authUser.id);
      }
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create test order (bypass payment)
    const orderNumber = `TEST-${Date.now()}`;
    const amount = product.price * quantity;

    const productOrder = await prisma.productOrder.create({
      data: {
        order_number: orderNumber,
        user_id: user?.id || null,
        guest_email: guestEmail || user?.email || 'test@example.com',
        product_id: product.id,
        quantity: quantity,
        amount: amount,
        currency: product.currency || 'usd',
        status: 'completed',
        order_type: 'stock_product',
        shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null,
        test_order: true,
        purchased_at: new Date()
      },
      include: {
        product: true,
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    // Fulfill order
    await ProductService.fulfillProductOrder(productOrder.id);

    // Send confirmation email with products
    try {
      const clientEmail = user?.email || guestEmail || 'test@example.com';
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      await sendOrderConfirmationEmail({
        to: clientEmail,
        orderNumber: productOrder.order_number,
        orderType: 'stock_product',
        amount: productOrder.amount,
        currency: productOrder.currency,
        status: 'completed',
        clientPortalLink: `${baseUrl}/client-portal`,
        orderDate: productOrder.purchased_at || productOrder.created_at,
        recipientEmail: clientEmail,
        products: [{
          product: product,
          quantity: quantity,
          price: product.price,
          currency: product.currency || 'usd'
        }]
      });
      console.log('[TEST_PURCHASE] Sent confirmation email to:', clientEmail);
    } catch (emailError) {
      console.error('[TEST_PURCHASE] Error sending confirmation email:', emailError);
    }

    // Send admin notification
    try {
      const customerName = productOrder.user?.profile
        ? `${productOrder.user.profile.first_name || ''} ${productOrder.user.profile.last_name || ''}`.trim() || user?.email || 'Customer'
        : user?.email || 'Customer';
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      
      await sendAdminOrderNotification({
        orderNumber: productOrder.order_number,
        orderType: 'stock_product',
        customerName,
        customerEmail: user?.email || guestEmail || 'test@example.com',
        orderDetails: `${product.name} (Qty: ${quantity})`,
        amount: productOrder.amount,
        currency: productOrder.currency,
        orderDate: productOrder.purchased_at || productOrder.created_at,
        shippingAddress: productOrder.shipping_address,
        orderLink: `${baseUrl}/admin/orders/product-orders/${productOrder.id}`
      });
      console.log('[TEST_PURCHASE] Sent admin order notification');
    } catch (adminEmailError) {
      console.error('[TEST_PURCHASE] Error sending admin order notification:', adminEmailError);
    }

    return res.status(200).json({
      success: true,
      order: productOrder,
      message: 'Test order created successfully. Check your email!'
    });
  } catch (error) {
    console.error('[TEST_PURCHASE] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
