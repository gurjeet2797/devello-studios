import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prismaClient from '../../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ADMIN_PRODUCT_ORDERS_LIST] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    let where = { order_type: 'stock_product' };

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== 'all') {
      where.payment_status = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        where.created_at.lte = new Date(endDate);
      }
    }

    console.log('[ADMIN_PRODUCT_ORDERS_LIST] Fetching product orders with filters:', {
      where,
      skip,
      take
    });

    let orders, total;

    try {
      [orders, total] = await Promise.all([
        prisma.productOrder.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: 'desc' },
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
            payments: {
              select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                paid_at: true,
                stripe_payment_intent_id: true,
                stripe_charge_id: true,
                payment_method: true
              },
              orderBy: { paid_at: 'desc' },
              take: 1
            }
          },
        }),
        prisma.productOrder.count({ where }),
      ]);
    } catch (dbError) {
      const errorMessage = dbError.message || '';
      const errorCode = dbError.code;
      const fallbackWhere = { ...where };
      delete fallbackWhere.order_type;

      if (
        errorCode === 'P2022' ||
        errorMessage.includes('order_type') ||
        errorMessage.includes('custom_product_request_id') ||
        errorMessage.includes('does not exist')
      ) {
        console.warn('[ADMIN_PRODUCT_ORDERS_LIST] Retrying without order_type filter due to column error');
        [orders, total] = await Promise.all([
          prisma.productOrder.findMany({
            where: fallbackWhere,
            skip,
            take,
            orderBy: { created_at: 'desc' },
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
              payments: {
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  status: true,
                  paid_at: true,
                  stripe_payment_intent_id: true,
                  stripe_charge_id: true,
                  payment_method: true
                },
                orderBy: { paid_at: 'desc' },
                take: 1
              }
            },
          }),
          prisma.productOrder.count({ where: fallbackWhere }),
        ]);
      } else {
        throw dbError;
      }
    }

    // Fallback filtering if order_type column was missing
    const filteredOrders = (orders || []).filter(order => {
      const orderType = order.order_type || (order.custom_product_request_id ? 'custom_order' : 'stock_product');
      return orderType === 'stock_product';
    });
    const normalizedTotal = where.order_type ? total : filteredOrders.length;

    console.log('[ADMIN_PRODUCT_ORDERS_LIST] Successfully fetched orders:', {
      count: filteredOrders.length,
      total: normalizedTotal,
      sampleOrders: filteredOrders.slice(0, 3).map(o => ({
        id: o.id,
        order_number: o.order_number,
        user_id: o.user_id,
        user_email: o.user?.email,
        guest_email: o.guest_email,
        product_id: o.product_id,
        created_at: o.created_at
      }))
    });

    return res.status(200).json({
      success: true,
      orders: filteredOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: normalizedTotal,
        pages: Math.ceil(normalizedTotal / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('[ADMIN_PRODUCT_ORDERS_LIST] Error fetching product orders:', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
