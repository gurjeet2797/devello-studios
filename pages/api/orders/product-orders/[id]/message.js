import { UserService } from '../../../../../lib/userService';
import prisma from '../../../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import { sendOrderMessageEmail, sendAdminInquiryNotification } from '../../../../../lib/emailService';

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

    const { id: productOrderId } = req.query;
    const { message } = req.body;

    if (!productOrderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get the product order
    const productOrder = await prisma.productOrder.findUnique({
      where: { id: productOrderId },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        product: true
      }
    });

    if (!productOrder) {
      return res.status(404).json({ error: 'Product order not found' });
    }

    // Verify user owns this order (clients can only message about their own orders)
    if (productOrder.user_id !== prismaUser.id) {
      return res.status(403).json({ error: 'You do not have permission to message about this order' });
    }

    // Validate order structure
    if (!productOrder.order_number) {
      console.error('[ORDER_MESSAGE] Invalid order structure:', { productOrderId, productOrder });
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Create order update - explicitly use productOrder.id to ensure it's tied to the order
    const orderUpdate = await prisma.orderUpdate.create({
      data: {
        product_order_id: productOrder.id, // Use productOrder.id instead of productOrderId from query to be extra safe
        update_type: 'message',
        message: message.trim(),
        updated_by: prismaUser.id,
      }
    });

    console.log('[ORDER_MESSAGE] Order update created:', {
      orderUpdateId: orderUpdate.id,
      productOrderId: productOrder.id,
      orderNumber: productOrder.order_number,
      userId: prismaUser.id,
      productId: productOrder.product_id
    });

    // Send email notification to admin
    const userEmail = prismaUser.email;
    const userName = productOrder.user.profile?.first_name 
      ? `${productOrder.user.profile.first_name} ${productOrder.user.profile.last_name || ''}`.trim()
      : userEmail;

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || 'sales@develloinc.com';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const orderLink = `${baseUrl}/admin/orders/product-orders/${productOrderId}`;

    // Send order message email (existing functionality)
    await sendOrderMessageEmail({
      to: adminEmail,
      recipientName: 'Admin',
      senderName: userName,
      senderEmail: userEmail,
      orderNumber: productOrder.order_number,
      message: message.trim(),
      isFromAdmin: false,
      orderLink
    });

    // Also send admin inquiry notification
    await sendAdminInquiryNotification({
      customerName: userName,
      customerEmail: userEmail,
      subject: `Order #${productOrder.order_number} - Customer Message`,
      message: message.trim(),
      inquiryLink: orderLink,
      orderNumber: productOrder.order_number
    });

    console.log('[ORDER_MESSAGE] Order message created:', {
      orderUpdateId: orderUpdate.id,
      productOrderId,
      updatedBy: prismaUser.id
    });

    return res.status(200).json({
      success: true,
      orderUpdate: {
        id: orderUpdate.id,
        update_type: orderUpdate.update_type,
        message: orderUpdate.message,
        created_at: orderUpdate.created_at,
      }
    });
  } catch (error) {
    console.error('[ORDER_MESSAGE] Error creating order message:', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
