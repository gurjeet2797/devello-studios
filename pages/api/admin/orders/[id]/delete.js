import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prismaClient from '../../../../../lib/prisma';
const { sendOrderStatusUpdateEmail } = require('../../../../../lib/emailService');

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_ORDERS_DELETE] Prisma client is not available');
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

    console.log('[ADMIN_ORDERS_DELETE] Deleting order:', id);

    // Fetch the order first to get customer info and check if it exists
    let request = null;
    try {
      request = await prisma.customProductRequest.findUnique({
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
          productOrder: {
            select: {
              id: true,
              order_number: true,
              status: true
            }
          }
        }
      });
    } catch (queryError) {
      // If productOrder include fails, try without it
      const errorMessage = queryError.message || '';
      const errorCode = queryError.code;
      const isColumnError = errorCode === 'P2022' || 
                           errorMessage.includes('custom_product_request_id') || 
                           errorMessage.includes('does not exist') ||
                           errorMessage.includes('Unknown column');

      if (isColumnError) {
        request = await prisma.customProductRequest.findUnique({
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
            }
          }
        });
      } else {
        throw queryError;
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get customer email and name for notification
    const customerEmail = request.email || request.user?.email;
    const customerName = request.name || 
      (request.user?.profile?.first_name && request.user?.profile?.last_name
        ? `${request.user.profile.first_name} ${request.user.profile.last_name}`
        : request.user?.email || 'Customer');

    const orderNumber = request.productOrder?.order_number || `CUSTOM-${id.substring(0, 8).toUpperCase()}`;

    // Delete associated productOrder first (if exists) to avoid foreign key issues
    if (request.productOrder) {
      try {
        await prisma.productOrder.delete({
          where: { id: request.productOrder.id }
        });
        console.log('[ADMIN_ORDERS_DELETE] Deleted associated product order:', request.productOrder.id);
      } catch (productOrderError) {
        console.error('[ADMIN_ORDERS_DELETE] Error deleting product order:', productOrderError);
        // Continue with custom product request deletion even if productOrder deletion fails
      }
    }

    // Delete the custom product request (quotes will be deleted via cascade)
    await prisma.customProductRequest.delete({
      where: { id }
    });

    console.log('[ADMIN_ORDERS_DELETE] Successfully deleted order:', id);

    // Send email notification to customer
    if (customerEmail) {
      try {
        const emailResult = await sendOrderStatusUpdateEmail({
          to: customerEmail,
          recipientName: customerName,
          orderNumber: orderNumber,
          orderType: 'custom_order',
          status: 'cancelled',
          orderDetails: {
            projectType: request.project_type,
            projectDescription: request.project_description,
            material: request.material,
            size: request.size || request.custom_size
          },
          customMessage: 'We regret to inform you that your order has been deleted from our system. If you have any questions or concerns, please contact us at sales@develloinc.com.',
          subjectOverride: `Order #${orderNumber} - Deleted`
        });

        if (emailResult.success) {
          console.log('[ADMIN_ORDERS_DELETE] Deletion notification email sent successfully');
        } else {
          console.error('[ADMIN_ORDERS_DELETE] Failed to send deletion notification email:', emailResult.error);
          // Don't fail the deletion if email fails
        }
      } catch (emailError) {
        console.error('[ADMIN_ORDERS_DELETE] Error sending deletion notification email:', emailError);
        // Don't fail the deletion if email fails
      }
    } else {
      console.warn('[ADMIN_ORDERS_DELETE] No customer email found, skipping email notification');
    }

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      orderId: id,
      orderNumber: orderNumber
    });
  } catch (error) {
    console.error('[ADMIN_ORDERS_DELETE] Error deleting order:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      id: req.query?.id
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
