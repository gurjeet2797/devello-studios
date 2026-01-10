import { verifyAdminAccess } from '../../../../../../lib/adminAuth';
import prismaClient from '../../../../../../lib/prisma';
import { sendOrderMessageEmail } from '../../../../../../lib/emailService';

const prisma = prismaClient;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { id } = req.query;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get order
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

    // Validate that id is actually an order ID, not a product ID
    // Double-check by verifying the order exists and has the expected structure
    if (!order.order_number) {
      console.error('[ADMIN_MESSAGE] Invalid order structure:', { id, order });
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Create order update - explicitly use order.id to ensure it's tied to the order, not product
    const orderUpdate = await prisma.orderUpdate.create({
      data: {
        product_order_id: order.id, // Use order.id instead of id from query to be extra safe
        update_type: req.body.update_type || 'message',
        message: message.trim(),
        updated_by: 'admin',
      },
    });

    console.log('[ADMIN_MESSAGE] Order update created:', {
      orderUpdateId: orderUpdate.id,
      productOrderId: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      productId: order.product_id
    });

    // Send email notification
    const recipientEmail = order.user?.email || order.guest_email;
    const recipientName = order.user?.profile 
      ? `${order.user.profile.first_name || ''} ${order.user.profile.last_name || ''}`.trim()
      : 'Customer';
    
    if (recipientEmail) {
      try {
        await sendOrderMessageEmail({
          to: recipientEmail,
          recipientName: recipientName || 'Customer',
          senderName: 'Devello Admin',
          senderEmail: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || 'sales@develloinc.com',
          orderNumber: order.order_number,
          message: message.trim(),
          isFromAdmin: true,
          orderLink: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/client-portal`,
        });
      } catch (emailError) {
        console.error('Error sending message email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
