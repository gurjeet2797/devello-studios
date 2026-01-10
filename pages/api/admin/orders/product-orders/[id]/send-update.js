import { verifyAdminAccess } from '../../../../../../lib/adminAuth';
import prismaClient from '../../../../../../lib/prisma';
import {
  sendOrderStatusUpdateEmail,
  sendShippingNotificationEmail,
  sendOrderTrackingEmail
} from '../../../../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_PRODUCT_ORDER_SEND_UPDATE] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const {
      email_type, // 'status_update', 'shipping_notification', 'tracking'
      custom_message,
      subject_override
    } = req.body;

    if (!email_type) {
      return res.status(400).json({ 
        error: 'email_type is required',
        validTypes: ['status_update', 'shipping_notification', 'tracking']
      });
    }

    // Fetch the order with related data
    const order = await prisma.productOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            image_url: true,
            description: true
          }
        },
        customProductRequest: {
          select: {
            id: true,
            project_type: true,
            email: true,
            name: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paid_at: true
          },
          orderBy: { paid_at: 'desc' },
          take: 1
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Determine recipient email
    const recipientEmail = order.guest_email || order.user?.email || order.customProductRequest?.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'No email address found for this order' });
    }

    // Determine recipient name
    const recipientName = order.user?.profile 
      ? `${order.user.profile.first_name || ''} ${order.user.profile.last_name || ''}`.trim()
      : order.customProductRequest?.name || 'Customer';

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const trackingLink = `${baseUrl}/order-tracking?order_number=${order.order_number}&email=${encodeURIComponent(recipientEmail)}`;
    const portalLink = `${baseUrl}/client-portal`;

    let emailResult;

    switch (email_type) {
      case 'status_update':
        emailResult = await sendOrderStatusUpdateEmail({
          to: recipientEmail,
          recipientName,
          orderNumber: order.order_number,
          orderType: order.order_type,
          status: order.status,
          orderDetails: order.order_items,
          product: order.product,
          customMessage: custom_message,
          subjectOverride: subject_override,
          trackingLink,
          portalLink
        });
        break;

      case 'shipping_notification':
        if (!order.tracking_number) {
          return res.status(400).json({ 
            error: 'Tracking number is required for shipping notification',
            message: 'Please add a tracking number to the order before sending shipping notification'
          });
        }
        emailResult = await sendShippingNotificationEmail({
          to: recipientEmail,
          recipientName,
          orderNumber: order.order_number,
          orderType: order.order_type,
          trackingNumber: order.tracking_number,
          carrier: order.carrier,
          shippingAddress: order.shipping_address,
          estimatedDelivery: order.estimated_ship_date,
          product: order.product,
          customMessage: custom_message,
          subjectOverride: subject_override,
          trackingLink
        });
        break;

      case 'tracking':
        if (!order.tracking_number) {
          return res.status(400).json({ 
            error: 'Tracking number is required for tracking email',
            message: 'Please add a tracking number to the order before sending tracking email'
          });
        }
        emailResult = await sendOrderTrackingEmail({
          to: recipientEmail,
          recipientName,
          orderNumber: order.order_number,
          orderType: order.order_type,
          trackingNumber: order.tracking_number,
          carrier: order.carrier,
          shippedAt: order.shipped_at,
          estimatedDelivery: order.estimated_ship_date,
          product: order.product,
          customMessage: custom_message,
          subjectOverride: subject_override,
          trackingLink
        });
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid email_type',
          validTypes: ['status_update', 'shipping_notification', 'tracking']
        });
    }

    if (!emailResult.success) {
      return res.status(500).json({
        error: 'Failed to send email',
        message: emailResult.error
      });
    }

    console.log('[ADMIN_PRODUCT_ORDER_SEND_UPDATE] Email sent successfully:', {
      orderId: id,
      emailType: email_type,
      recipientEmail,
      messageId: emailResult.messageId
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: emailResult.messageId,
      emailType: email_type
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_ORDER_SEND_UPDATE] Error sending email:', {
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
