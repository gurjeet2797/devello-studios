import { getAuthenticatedUser } from '../../../lib/authUtils';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await getAuthenticatedUser(req, res);
    if (!auth) {
      return;
    }

    // Get user with partner relation
    const user = await prisma.user.findUnique({
      where: { id: auth.prismaUser.id },
      include: { partner: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Pagination params
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '20', 10), 1);
    const skip = (page - 1) * limit;

    // Get orders based on user type
    let orders;
    let total;
    const baseInclude = {
      conversation: {
        include: {
          partner: true,
          user: {
            include: { profile: true }
          }
        }
      },
      partner: true,
      user: {
        include: { profile: true }
      }
    };

    if (user.partner) {
      // Partner: get all orders for this partner
      orders = await prisma.order.findMany({
        where: { partner_id: user.partner.id },
        include: baseInclude,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      });
      total = await prisma.order.count({ where: { partner_id: user.partner.id } });
    } else {
      // Client: get all orders for this user
      orders = await prisma.order.findMany({
        where: { user_id: user.id },
        include: baseInclude,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      });
      total = await prisma.order.count({ where: { user_id: user.id } });
    }

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

