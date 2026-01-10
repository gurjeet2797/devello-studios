import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

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

    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs array is required' });
    }

    // Verify all orders are cancelled before deleting
    const orders = await prisma.productOrder.findMany({
      where: {
        id: { in: orderIds },
      },
      select: {
        id: true,
        status: true,
        order_number: true,
      },
    });

    // Check if all orders are cancelled
    const nonCancelledOrders = orders.filter(order => order.status !== 'cancelled');
    if (nonCancelledOrders.length > 0) {
      return res.status(400).json({
        error: 'Only cancelled orders can be removed',
        nonCancelledOrders: nonCancelledOrders.map(o => o.order_number),
      });
    }

    // Also check custom product requests
    const customRequests = await prisma.customProductRequest.findMany({
      where: {
        id: { in: orderIds },
      },
      select: {
        id: true,
        status: true,
      },
    });

    const nonCancelledCustom = customRequests.filter(req => req.status !== 'cancelled');
    if (nonCancelledCustom.length > 0) {
      return res.status(400).json({
        error: 'Only cancelled orders can be removed',
      });
    }

    // Delete product orders
    const productOrderIds = orders.map(o => o.id);
    let deletedProductOrders = 0;
    if (productOrderIds.length > 0) {
      const result = await prisma.productOrder.deleteMany({
        where: {
          id: { in: productOrderIds },
          status: 'cancelled',
        },
      });
      deletedProductOrders = result.count;
    }

    // Delete custom product requests (if any match)
    const customRequestIds = customRequests.map(r => r.id);
    let deletedCustomRequests = 0;
    if (customRequestIds.length > 0) {
      const result = await prisma.customProductRequest.deleteMany({
        where: {
          id: { in: customRequestIds },
          status: 'cancelled',
        },
      });
      deletedCustomRequests = result.count;
    }

    console.log('[REMOVE_CANCELLED_ORDERS] Deleted orders:', {
      productOrders: deletedProductOrders,
      customRequests: deletedCustomRequests,
      total: deletedProductOrders + deletedCustomRequests,
    });

    return res.status(200).json({
      success: true,
      deleted: {
        productOrders: deletedProductOrders,
        customRequests: deletedCustomRequests,
        total: deletedProductOrders + deletedCustomRequests,
      },
    });
  } catch (error) {
    console.error('[REMOVE_CANCELLED_ORDERS] Error removing orders:', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
