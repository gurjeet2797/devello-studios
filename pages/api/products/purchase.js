import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import { ProductService } from '../../../lib/productService';
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '../../../lib/emailService';
import { isAdminEmail } from '../../../lib/adminAuth';
import { getAuthenticatedUser } from '../../../lib/authUtils';
import prisma from '../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId, paymentIntentId, bypassPayment, productId: directProductId, quantity: directQuantity, shippingAddress: directShippingAddress } = req.body;

    // Check if this is an admin bypass request
    let isAdminBypass = false;
    let userId;
    let productId;
    let quantity = 1;
    let shippingAddressData = null;

    if (bypassPayment) {
      // Admin bypass mode - verify admin access
      const authResult = await getAuthenticatedUser(req, res);
      if (!authResult) {
        return; // getAuthenticatedUser already sent the response
      }

      const { prismaUser } = authResult;
      if (!prismaUser || !isAdminEmail(prismaUser.email)) {
        return res.status(403).json({ error: 'Admin access required to bypass payment' });
      }

      isAdminBypass = true;
      userId = prismaUser.id;
      productId = directProductId;
      quantity = parseInt(directQuantity || '1');

      if (directShippingAddress) {
        shippingAddressData = typeof directShippingAddress === 'string' 
          ? JSON.parse(directShippingAddress) 
          : directShippingAddress;
      }

      console.log('[PRODUCTS] Admin bypass payment mode:', {
        adminEmail: prismaUser.email,
        productId,
        quantity
      });
    } else {
      // Normal payment flow
      if (!sessionId && !paymentIntentId) {
        return res.status(400).json({ error: 'sessionId or paymentIntentId is required' });
      }

      let session;
      let paymentIntent;

      if (sessionId) {
        session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_intent) {
          paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        }
      } else if (paymentIntentId) {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      }

      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ error: 'Payment not completed' });
      }

      const metadata = session?.metadata || paymentIntent.metadata;
      userId = metadata?.user_id;
      productId = metadata?.product_id;
      quantity = parseInt(metadata?.quantity || '1');
      
      // Parse shipping address from metadata if available
      if (metadata?.shipping_address) {
        try {
          shippingAddressData = JSON.parse(metadata.shipping_address);
        } catch (e) {
          console.error('Error parsing shipping address from metadata:', e);
        }
      }
    }

    if (!userId || !productId) {
      return res.status(400).json({ error: 'Missing required fields: userId and productId are required' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get product
    const product = await ProductService.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const isTestOrder = ProductService.isTestProduct(product);

    // Check if order already exists (only for non-bypass orders)
    if (!isAdminBypass) {
      const existingOrder = await prisma.productOrder.findFirst({
        where: {
          OR: [
            { stripe_payment_intent_id: paymentIntent.id },
            ...(sessionId ? [{ stripe_session_id: sessionId }] : [])
          ]
        },
      });

      if (existingOrder) {
        console.log('[PRODUCTS] Order already exists, returning existing order:', {
          orderId: existingOrder.id,
          orderNumber: existingOrder.order_number,
          paymentIntentId: paymentIntent.id,
          sessionId: sessionId,
        });
        return res.status(200).json({
          success: true,
          order: existingOrder,
          message: 'Order already processed',
        });
      }

      // Also check if payment record already exists for this payment intent
      const existingPayment = await prisma.payment.findFirst({
        where: {
          stripe_payment_intent_id: paymentIntent.id,
        },
      });

      if (existingPayment) {
        console.log('[PRODUCTS] Payment already exists for this payment intent, fetching associated order:', {
          paymentId: existingPayment.id,
          orderId: existingPayment.product_order_id,
          paymentIntentId: paymentIntent.id,
        });
        if (existingPayment.product_order_id) {
          const associatedOrder = await prisma.productOrder.findUnique({
            where: { id: existingPayment.product_order_id },
            include: {
              product: true,
              user: {
                include: {
                  profile: true,
                },
              },
            },
          });
          if (associatedOrder) {
            return res.status(200).json({
              success: true,
              order: associatedOrder,
              message: 'Order already processed',
            });
          }
        }
      }
    }

    // Create product order
    const orderNumber = ProductService.generateOrderNumber();
    const orderAmount = isAdminBypass ? (product.price * quantity) : paymentIntent.amount;
    const orderCurrency = isAdminBypass ? (product.currency || 'usd') : paymentIntent.currency;
    
    const productOrder = await prisma.productOrder.create({
      data: {
        user_id: userId,
        product_id: productId,
        order_number: orderNumber,
        order_type: 'stock_product',
        stripe_payment_intent_id: isAdminBypass ? null : paymentIntent.id,
        stripe_session_id: isAdminBypass ? null : (sessionId || null),
        amount: orderAmount,
        currency: orderCurrency,
        status: 'completed',
        payment_status: isAdminBypass ? 'admin_bypass' : 'paid',
        purchased_at: new Date(),
        test_order: isTestOrder,
        shipping_address: shippingAddressData ? {
          title: shippingAddressData.title,
          full_name: shippingAddressData.full_name,
          phone: shippingAddressData.phone,
          address_line1: shippingAddressData.address_line1,
          address_line2: shippingAddressData.address_line2,
          city: shippingAddressData.city,
          state: shippingAddressData.state,
          zip_code: shippingAddressData.zip_code,
          country: shippingAddressData.country || 'US',
        } : null,
      },
      include: {
        product: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Create payment record (only for non-bypass orders)
    if (!isAdminBypass) {
      await prisma.payment.create({
        data: {
          product_order_id: productOrder.id,
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.charges.data[0]?.id || null,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          payment_method: 'card',
          payment_type: 'full',
          paid_at: new Date(),
        },
      });
    } else {
      console.log('[PRODUCTS] Admin bypass - skipping payment record creation');
    }

    // Fulfill order
    await ProductService.fulfillProductOrder(productOrder.id);

    // Send confirmation email to client
    try {
      const clientEmail = user.email;
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
      
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
      console.log('[PRODUCTS] Sent confirmation email to:', clientEmail);
    } catch (emailError) {
      console.error('[PRODUCTS] Error sending confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send admin notification for new order
    try {
      const customerName = productOrder.user?.profile
        ? `${productOrder.user.profile.first_name || ''} ${productOrder.user.profile.last_name || ''}`.trim() || user.email
        : user.email;
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
      const orderDetails = product.name + (product.description ? `: ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}` : '');
      
      await sendAdminOrderNotification({
        orderNumber: productOrder.order_number,
        orderType: 'stock_product',
        customerName,
        customerEmail: user.email,
        orderDetails,
        amount: productOrder.amount,
        currency: productOrder.currency,
        orderDate: productOrder.purchased_at || productOrder.created_at,
        shippingAddress: productOrder.shipping_address,
        orderLink: `${baseUrl}/admin/orders/product-orders/${productOrder.id}`
      });
      console.log('[PRODUCTS] Sent admin order notification for order:', productOrder.order_number);
    } catch (adminEmailError) {
      console.error('[PRODUCTS] Error sending admin order notification:', adminEmailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      order: productOrder,
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

