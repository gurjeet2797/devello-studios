import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';
import { UserService } from '../../../../../lib/userService';
import prismaClient from '../../../../../lib/prisma';
import { sendOrderMessageEmail, sendAdminInquiryNotification } from '../../../../../lib/emailService';

const prisma = prismaClient;

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
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Fetch the order
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify user owns this order
    if (order.user_id !== prismaUser.id && order.guest_email?.toLowerCase() !== prismaUser.email.toLowerCase()) {
      return res.status(403).json({ error: 'You do not have permission to send messages for this order' });
    }

    // Validate order structure
    if (!order.order_number) {
      console.error('[CLIENT_MESSAGE] Invalid order structure:', { id, order });
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Create order update record - explicitly use order.id to ensure it's tied to the order
    const orderUpdate = await prisma.orderUpdate.create({
      data: {
        product_order_id: order.id, // Use order.id instead of id from query to be extra safe
        update_type: 'message',
        message: message.trim(),
        updated_by: prismaUser.id,
      },
    });

    console.log('[CLIENT_MESSAGE] Order update created:', {
      orderUpdateId: orderUpdate.id,
      productOrderId: order.id,
      orderNumber: order.order_number,
      userId: prismaUser.id,
      productId: order.product_id
    });

    // Send email notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || 'sales@develloinc.com';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const customerName = order.user?.profile 
      ? `${order.user.profile.first_name || ''} ${order.user.profile.last_name || ''}`.trim()
      : 'Customer';
    const customerEmail = order.user?.email || order.guest_email;
    const orderLink = `${baseUrl}/admin/orders/product-orders/${id}`;
    
    try {
      // Send order message email (existing functionality)
      await sendOrderMessageEmail({
        to: adminEmail,
        recipientName: 'Admin',
        senderName: customerName,
        senderEmail: customerEmail,
        orderNumber: order.order_number,
        message: message.trim(),
        isFromAdmin: false,
        orderLink,
      });

      // Also send admin inquiry notification
      await sendAdminInquiryNotification({
        customerName,
        customerEmail,
        subject: `Order #${order.order_number} - Customer Message`,
        message: message.trim(),
        inquiryLink: orderLink,
        orderNumber: order.order_number
      });
    } catch (emailError) {
      console.error('Error sending message email to admin:', emailError);
      // Don't fail the request if email fails
    }

    console.log('[CLIENT_MESSAGE] Message sent:', {
      orderId: id,
      orderNumber: order.order_number,
      userId: prismaUser.id
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent to admin'
    });
  } catch (error) {
    console.error('[CLIENT_MESSAGE] Error sending message:', {
      error: error.message,
      stack: error.stack,
      orderId: req.query?.id
    });

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
