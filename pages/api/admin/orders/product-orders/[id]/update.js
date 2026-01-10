import { verifyAdminAccess } from '../../../../../../lib/adminAuth';
import prismaClient from '../../../../../../lib/prisma';
import { sendOrderStatusUpdateEmail, sendShippingNotificationEmail } from '../../../../../../lib/emailService';
import { OrderStatuses } from '../../../../../../lib/orderStateMachine';

export default async function handler(req, res) {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_PRODUCT_ORDER_UPDATE] Prisma client is not available');
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
      status,
      tracking_number,
      carrier,
      admin_notes,
      customer_notes,
      estimated_ship_date,
      shipped_at,
      delivered_at,
      fulfilled_at
    } = req.body;

    // Build update object
    const updateData = {};
    
    if (status !== undefined) {
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Invalid status',
          validStatuses 
        });
      }
      updateData.status = status;
    }

    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number || null;
    }

    if (carrier !== undefined) {
      updateData.carrier = carrier || null;
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes || null;
    }

    if (customer_notes !== undefined) {
      updateData.customer_notes = customer_notes || null;
    }

    if (estimated_ship_date !== undefined) {
      updateData.estimated_ship_date = estimated_ship_date ? new Date(estimated_ship_date) : null;
    }

    if (shipped_at !== undefined) {
      updateData.shipped_at = shipped_at ? new Date(shipped_at) : null;
      // Auto-set status to 'shipped' if shipped_at is set and status not explicitly provided
      if (shipped_at && status === undefined) {
        updateData.status = 'shipped';
      }
    }

    if (delivered_at !== undefined) {
      updateData.delivered_at = delivered_at ? new Date(delivered_at) : null;
      // Auto-set status to 'delivered' if delivered_at is set and status not explicitly provided
      if (delivered_at && status === undefined) {
        updateData.status = 'delivered';
      }
    }

    // Note: fulfilled_at parameter kept for backwards compatibility, maps to delivered_at
    if (fulfilled_at !== undefined) {
      updateData.delivered_at = fulfilled_at ? new Date(fulfilled_at) : null;
      // Auto-set status to 'delivered' if fulfilled_at is set
      if (fulfilled_at && !status) {
        updateData.status = 'delivered';
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Get current order to check if status changed
    const currentOrder = await prisma.productOrder.findUnique({
      where: { id },
      select: { status: true }
    });

    // Update the order
    const updatedOrder = await prisma.productOrder.update({
      where: { id },
      data: updateData,
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
            image_url: true
          }
        },
        customProductRequest: {
          select: {
            id: true,
            project_type: true,
            email: true
          }
        }
      }
    });

    console.log('[ADMIN_PRODUCT_ORDER_UPDATE] Order updated successfully:', {
      orderId: id,
      updatedFields: Object.keys(updateData),
      newStatus: updatedOrder.status
    });

    // Send email notification if status changed
    if (status !== undefined && currentOrder && currentOrder.status !== updatedOrder.status) {
      try {
        const recipientEmail = updatedOrder.user?.email || updatedOrder.guest_email;
        const recipientName = updatedOrder.user?.profile 
          ? `${updatedOrder.user.profile.first_name || ''} ${updatedOrder.user.profile.last_name || ''}`.trim() || 'Customer'
          : 'Customer';

        if (recipientEmail) {
          // Use shipping notification for shipped status, status update for others
          if (updatedOrder.status === OrderStatuses.shipped || updatedOrder.status === 'shipped') {
            await sendShippingNotificationEmail({
              to: recipientEmail,
              recipientName: recipientName || 'Customer',
              orderNumber: updatedOrder.order_number,
              orderType: updatedOrder.order_type,
              trackingNumber: updatedOrder.tracking_number,
              carrier: updatedOrder.carrier,
              shippingAddress: updatedOrder.shipping_address,
              estimatedDelivery: updatedOrder.estimated_ship_date,
              product: updatedOrder.product,
              customMessage: customer_notes || admin_notes,
              trackingLink: updatedOrder.tracking_number 
                ? `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/order-tracking?order_number=${updatedOrder.order_number}&email=${encodeURIComponent(recipientEmail)}`
                : undefined
            });
            console.log('[ADMIN_PRODUCT_ORDER_UPDATE] Shipping notification email sent', {
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
              status: updatedOrder.status,
              orderDetails: updatedOrder.order_items,
              product: updatedOrder.product,
              customMessage: customer_notes || admin_notes,
              trackingLink: updatedOrder.tracking_number 
                ? `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/order-tracking?order_number=${updatedOrder.order_number}&email=${encodeURIComponent(recipientEmail)}`
                : undefined,
              portalLink: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/client-portal?view=product_orders`
            });
            console.log('[ADMIN_PRODUCT_ORDER_UPDATE] Status update email sent', {
              orderId: id,
              orderNumber: updatedOrder.order_number,
              status: updatedOrder.status,
              recipientEmail
            });
          }
        } else {
          console.warn('[ADMIN_PRODUCT_ORDER_UPDATE] No email address found for order', {
            orderId: id,
            orderNumber: updatedOrder.order_number,
            hasUser: !!updatedOrder.user,
            hasGuestEmail: !!updatedOrder.guest_email
          });
        }
      } catch (emailError) {
        // Don't fail the update if email fails
        console.error('[ADMIN_PRODUCT_ORDER_UPDATE] Failed to send email notification:', {
          error: emailError.message,
          orderId: id,
          orderNumber: updatedOrder.order_number,
          status: updatedOrder.status
        });
      }
    }

    return res.status(200).json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_ORDER_UPDATE] Error updating order:', {
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
