import { getAuthenticatedUser } from '../../../lib/authUtils';
import prisma from '../../../lib/prisma';

/**
 * GET /api/user/orders - Fetch user's product orders
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabaseUser, prismaUser, error } = await getAuthenticatedUser(req);
    
    if (error || !supabaseUser || !prismaUser) {
      return res.status(401).json({ error: error || 'Unauthorized' });
    }

    // Fetch product orders for the user
    const productOrders = await prisma.productOrder.findMany({
      where: {
        user_id: prismaUser.id
      },
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        order_number: true,
        order_type: true,
        amount: true,
        currency: true,
        status: true,
        payment_status: true,
        preview_image_url: true,
        purchased_at: true,
        fulfilled_at: true,
        shipping_address: true,
        tracking_number: true,
        carrier: true,
        order_items: true,
        created_at: true,
        product: {
          select: {
            id: true,
            title: true,
            images: true
          }
        }
      },
      take: 50 // Limit to 50 most recent orders
    });

    // Also fetch any partner service orders
    const serviceOrders = await prisma.order.findMany({
      where: {
        user_id: prismaUser.id
      },
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        total_amount: true,
        currency: true,
        estimated_completion: true,
        completed_at: true,
        created_at: true
      },
      take: 20
    });

    // Combine and format orders
    const orders = [
      ...productOrders.map(order => ({
        ...order,
        type: 'product',
        amount: order.amount
      })),
      ...serviceOrders.map(order => ({
        ...order,
        type: 'service',
        amount: order.total_amount,
        order_number: `SVC-${order.id.slice(-8).toUpperCase()}`
      }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({ 
      orders,
      total: orders.length 
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

