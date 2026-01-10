// Glass/Mirror Product Order Submission

const { sendFormEmail, sendAdminOrderNotification } = require('@lib/emailService');
const prisma = require('@lib/prisma').default;
const { UserService } = require('@lib/userService');
const { createSupabaseAuthClient } = require('@lib/supabaseClient');
const { safeLog } = require('@lib/config');

const log = (level, message, data = {}) => safeLog(level, message, data);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication is optional - check if auth header exists
    let prismaUser = null;
    let authUser = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createSupabaseAuthClient();
      const { data: { user: authUserData }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && authUserData) {
        authUser = authUserData;
        prismaUser = await UserService.getOrCreateUser(authUser.id, authUser.email);
        if (!prismaUser) {
          log('warn', '[GLASS_MIRROR_ORDER] Failed to create user account, proceeding as guest', { userId: authUser.id });
        }
      }
    }

    const {
      productId,
      productName,
      productSlug,
      email,
      phone,
      orderRequirements,
      quantity,
      height,
      width,
      selectedVariant
    } = req.body;

    // Validate required fields
    if (!productId) {
      return res.status(400).json({ error: 'Missing required field: productId' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Missing required field: email is required' });
    }
    if (!orderRequirements || !orderRequirements.trim()) {
      return res.status(400).json({ error: 'Missing required field: orderRequirements is required' });
    }

    // Validate email format
    const finalEmail = email.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(finalEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get product from database
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Verify it's a glass or mirror product
    const category = product.metadata?.category;
    if (category !== 'glass' && category !== 'mirrors') {
      return res.status(400).json({ error: 'This endpoint is only for glass and mirror products' });
    }

    // Create CustomProductRequest record
    let customProductRequest;
    try {
      customProductRequest = await prisma.customProductRequest.create({
        data: {
          user_id: prismaUser?.id || null,
          project_type: `${category === 'glass' ? 'Glass' : 'Mirror'} Product Order`,
          project_description: orderRequirements.trim(),
          product_description: productName || product.name,
          height: height || null,
          width: width || null,
          name: prismaUser?.profile?.first_name || prismaUser?.email?.split('@')[0] || 'Guest User',
          email: finalEmail,
          phone: phone?.trim() || null,
          additional_info: JSON.stringify({
            productId,
            productSlug: productSlug || product.slug,
            quantity: quantity || 1,
            selectedVariant: selectedVariant || null
          }),
          status: 'received'
        }
      });
      log('info', '[GLASS_MIRROR_ORDER] Created CustomProductRequest', { id: customProductRequest.id });
    } catch (dbError) {
      log('error', '[GLASS_MIRROR_ORDER] Error creating CustomProductRequest', { error: dbError?.message });
      // Continue even if DB creation fails - email notification is more critical
    }

    // Create ProductOrder record (status: pending_quote)
    let productOrder;
    try {
      const orderNumber = `GM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      productOrder = await prisma.productOrder.create({
        data: {
          user_id: prismaUser?.id || null,
          order_number: orderNumber,
          order_type: 'custom_order',
          product_id: productId,
          quantity: quantity || 1,
          amount: 0, // No price set yet - will be quoted
          currency: 'usd',
          status: 'pending_quote',
          metadata: {
            customProductRequestId: customProductRequest?.id,
            category: category,
            orderRequirements: orderRequirements.trim(),
            height: height || null,
            width: width || null,
            selectedVariant: selectedVariant || null,
            guestEmail: finalEmail,
            guestPhone: phone?.trim() || null
          }
        }
      });
      log('info', '[GLASS_MIRROR_ORDER] Created ProductOrder', { id: productOrder.id, orderNumber });
    } catch (orderError) {
      log('error', '[GLASS_MIRROR_ORDER] Error creating ProductOrder', { error: orderError?.message });
      // Continue to send emails even if order creation fails
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const adminLink = productOrder?.id 
      ? `${baseUrl}/admin/orders/product-orders/${productOrder.id}`
      : customProductRequest?.id
      ? `${baseUrl}/admin/orders/${customProductRequest.id}`
      : null;

    // Send admin notification email
    try {
      await sendAdminOrderNotification({
        orderNumber: productOrder?.order_number || 'Pending',
        orderType: 'custom_order',
        customerName: prismaUser?.profile?.first_name || finalEmail.split('@')[0] || 'Guest',
        customerEmail: finalEmail,
        orderDetails: `${productName || product.name} - ${orderRequirements.substring(0, 100)}${orderRequirements.length > 100 ? '...' : ''}`,
        amount: 0, // No price yet
        currency: 'usd',
        orderDate: new Date(),
        shippingAddress: null,
        orderLink: adminLink,
        additionalInfo: {
          phone: phone?.trim() || 'Not provided',
          orderRequirements: orderRequirements.trim(),
          quantity: quantity || 1,
          dimensions: height && width ? `${height}" × ${width}"` : 'Not specified',
          variant: selectedVariant?.name || 'Standard'
        }
      });
      log('info', '[GLASS_MIRROR_ORDER] Sent admin notification email');
    } catch (emailError) {
      log('error', '[GLASS_MIRROR_ORDER] Error sending admin notification email', { error: emailError?.message });
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    try {
      const { sendOrderConfirmationEmail } = require('@lib/emailService');
      await sendOrderConfirmationEmail({
        to: finalEmail,
        orderNumber: productOrder?.order_number || 'Pending',
        orderType: 'custom_order',
        orderDetails: `${productName || product.name} - Custom Quote Request`,
        amount: 0,
        currency: 'usd',
        status: 'pending_quote',
        clientPortalLink: `${baseUrl}/client-portal`,
        orderDate: new Date(),
        recipientEmail: finalEmail,
        products: [{
          product: {
            name: productName || product.name,
            id: productId
          },
          quantity: quantity || 1,
          price: 0,
          currency: 'usd'
        }],
        customMessage: `Thank you for your order request. We will generate your custom price within 2 days and contact you at ${finalEmail}${phone ? ` or ${phone}` : ''}. For inquiries, call 929-266-2966.`
      });
      log('info', '[GLASS_MIRROR_ORDER] Sent customer confirmation email');
    } catch (emailError) {
      log('error', '[GLASS_MIRROR_ORDER] Error sending customer confirmation email', { error: emailError?.message });
      // Don't fail the request if email fails
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Order request submitted successfully. We will contact you within 2 days with a custom price.',
      orderId: productOrder?.id,
      orderNumber: productOrder?.order_number,
      requestId: customProductRequest?.id
    });

  } catch (error) {
    log('error', '[GLASS_MIRROR_ORDER] Order submission error', { error: error?.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}
