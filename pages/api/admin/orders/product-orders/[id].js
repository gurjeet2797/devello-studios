import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_PRODUCT_ORDER_DETAIL] Prisma client is not available');
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

    // Fetch the ProductOrder with all related data
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
            description: true,
            slug: true,
            image_url: true,
            price: true,
            currency: true
          }
        },
        customProductRequest: {
          select: {
            id: true,
            project_type: true,
            project_description: true,
            email: true,
            name: true,
            status: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            paid_at: true,
            stripe_payment_intent_id: true
          },
          orderBy: { paid_at: 'desc' }
        },
        refundRequests: {
          orderBy: { created_at: 'desc' }
        },
        orderUpdates: {
          where: {
            product_order_id: id // Explicitly ensure orderUpdates are scoped to this specific order
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('[ADMIN_PRODUCT_ORDER_DETAIL] Successfully fetched order:', {
      orderId: id,
      orderNumber: order.order_number,
      status: order.status
    });

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_ORDER_DETAIL] Error fetching order:', {
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
