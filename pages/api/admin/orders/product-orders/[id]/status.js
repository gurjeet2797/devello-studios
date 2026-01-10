import { verifyAdminAccess } from '../../../../../../lib/adminAuth';
import prisma from '../../../../../../lib/prisma';
import { transitionProductOrder, OrderStatuses } from '../../../../../../lib/orderStateMachine';
import { sendOrderStatusUpdateEmail, sendShippingNotificationEmail } from '../../../../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { id } = req.query;
    const { status, message } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const allowed = new Set([
      OrderStatuses.processing,
      OrderStatuses.shipped,
      OrderStatuses.delivered,
      OrderStatuses.completed,
      OrderStatuses.cancelled,
    ]);

    if (!status || !allowed.has(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const now = new Date();
    const timestamps = {};
    if (status === OrderStatuses.shipped) timestamps.shipped_at = now;
    if (status === OrderStatuses.delivered) timestamps.delivered_at = now;

    // Fetch order with user info for email notification
    const orderWithUser = await prisma.productOrder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
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
            image_url: true
          }
        }
      }
    });

    if (!orderWithUser) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Transition via state machine
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await transitionProductOrder({
        orderId: id,
        targetStatus: status,
        reason: message || `admin_mark_${status}`,
        actorType: 'admin',
        actorId: authResult.adminId || 'admin',
        prismaClient: tx,
      });

      if (Object.keys(timestamps).length > 0) {
        await tx.productOrder.update({
          where: { id: order.id },
          data: timestamps,
        });
      }

      // Create an order update entry for the thread
      try {
        await tx.orderUpdate.create({
          data: {
            id: undefined, // Let Prisma generate the ID
            product_order_id: order.id,
            update_type: 'status',
            message: message || `Order marked as ${status}`,
            updated_by: 'admin',
          },
        });
      } catch (updateError) {
        console.error('[ADMIN_STATUS] Failed to create order update:', {
          error: updateError.message,
          code: updateError.code,
          orderId: order.id,
        });
        // Don't fail the whole transaction if order update fails
        // This is non-critical functionality
      }

      return order;
    });

    // Send email notification to customer
    try {
      const recipientEmail = orderWithUser.user?.email || orderWithUser.guest_email;
      const recipientName = orderWithUser.user?.profile 
        ? `${orderWithUser.user.profile.first_name || ''} ${orderWithUser.user.profile.last_name || ''}`.trim() || 'Customer'
        : 'Customer';

      if (recipientEmail) {
        // Use shipping notification for shipped status, status update for others
        if (status === OrderStatuses.shipped) {
          await sendShippingNotificationEmail({
            to: recipientEmail,
            recipientName: recipientName || 'Customer',
            orderNumber: updatedOrder.order_number,
            orderType: updatedOrder.order_type,
            trackingNumber: updatedOrder.tracking_number,
            carrier: updatedOrder.carrier,
            shippingAddress: updatedOrder.shipping_address,
            estimatedDelivery: updatedOrder.estimated_ship_date,
            product: orderWithUser.product,
            customMessage: message,
            trackingLink: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/order-tracking?order_number=${updatedOrder.order_number}&email=${encodeURIComponent(recipientEmail)}`
          });
          console.log('[ADMIN_STATUS] Shipping notification email sent', {
            orderId: id,
            orderNumber: updatedOrder.order_number,
            recipientEmail
          });
        } else {
          // Send status update email for other statuses
          await sendOrderStatusUpdateEmail({
            to: recipientEmail,
            recipientName: recipientName || 'Customer',
            orderNumber: updatedOrder.order_number,
            orderType: updatedOrder.order_type,
            status: status,
            orderDetails: updatedOrder.order_items,
            product: orderWithUser.product,
            customMessage: message,
            trackingLink: updatedOrder.tracking_number 
              ? `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/order-tracking?order_number=${updatedOrder.order_number}&email=${encodeURIComponent(recipientEmail)}`
              : undefined,
            portalLink: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/client-portal?view=product_orders`
          });
          console.log('[ADMIN_STATUS] Status update email sent', {
            orderId: id,
            orderNumber: updatedOrder.order_number,
            status,
            recipientEmail
          });
        }
      } else {
        console.warn('[ADMIN_STATUS] No email address found for order', {
          orderId: id,
          orderNumber: updatedOrder.order_number,
          hasUser: !!orderWithUser.user,
          hasGuestEmail: !!orderWithUser.guest_email
        });
      }
    } catch (emailError) {
      // Don't fail the status update if email fails
      console.error('[ADMIN_STATUS] Failed to send email notification:', {
        error: emailError.message,
        orderId: id,
        orderNumber: updatedOrder.order_number,
        status
      });
    }

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('[ADMIN_STATUS] Error updating order status:', {
      error: error.message,
      stack: error.stack,
      orderId: req.query?.id,
      status: req.body?.status,
      code: error.code,
      meta: error.meta,
    });
    
    // Return more detailed error in production for debugging
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to update order status',
      code: error.code,
    });
  }
}

