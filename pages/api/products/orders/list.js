import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure prisma is available
  if (!prismaClient) {
    console.error('[PRODUCTS_ORDERS_LIST] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify the token and get user
    const supabase = createSupabaseAuthClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);

    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Match by user_id OR guest_email (in case user signed up with same email as guest order)
    let where = {
      OR: [
        { user_id: prismaUser.id },
        { guest_email: prismaUser.email }
      ],
      order_type: 'stock_product',
      status: status && status !== 'all' ? status : undefined,
      payment_status: paymentStatus && paymentStatus !== 'all' ? paymentStatus : undefined,
      created_at: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    // Remove undefined values
    Object.keys(where).forEach(key => {
      if (where[key] === undefined) {
        delete where[key];
      }
      if (key === 'created_at' && where.created_at && !where.created_at.gte && !where.created_at.lte) {
        delete where.created_at;
      }
    });
    
    console.log('[PRODUCTS_ORDERS_LIST] Fetching orders for authenticated user:', prismaUser.id, 'where:', where);

    let orders, total;
    try {
      // Try query with customProductRequest include first
      try {
        [orders, total] = await Promise.all([
          prisma.productOrder.findMany({
            where,
            skip,
            take,
            orderBy: { created_at: 'desc' },
            include: {
              product: true,
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
              },
              customProductRequest: {
                select: {
                  id: true,
                  project_type: true,
                  project_description: true,
                  status: true,
                  email: true
                }
              }
            },
          }),
          prisma.productOrder.count({ where }),
        ]);
      } catch (includeError) {
        // If customProductRequest include fails (column doesn't exist), retry without it
        // This is expected behavior - the column may not exist yet in the database
        const errorMessage = includeError.message || '';
        const errorCode = includeError.code;
        const isColumnError = errorCode === 'P2022' || 
                             errorMessage.includes('custom_product_request_id') || 
                             errorMessage.includes('order_type') ||
                             errorMessage.includes('does not exist') ||
                             errorMessage.includes('Unknown column');
        
        if (isColumnError) {
          console.log('[PRODUCTS_ORDERS_LIST] Note: Column does not exist (expected). Querying without customProductRequest include.', {
            errorCode,
            errorMessage: errorMessage.substring(0, 200)
          });
          [orders, total] = await Promise.all([
            prisma.productOrder.findMany({
              where,
              skip,
              take,
              orderBy: { created_at: 'desc' },
              include: {
                product: true,
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
        } else {
          // Re-throw if it's a different error
          throw includeError;
        }
      }
      
    } catch (dbError) {
      // Handle database errors gracefully
      const errorMessage = dbError.message || '';
      const errorCode = dbError.code;
      const isTableError = errorCode === 'P2021' || 
                          errorCode === 'P2022' ||
                          errorMessage.includes('does not exist') || 
                          errorMessage.includes('Unknown table') ||
                          (errorMessage.includes('relation') && errorMessage.includes('does not exist'));
      
      if (isTableError) {
        console.error('[PRODUCTS_ORDERS_LIST] Table or column does not exist. Please run the migration to create it.', {
          errorCode,
          errorMessage: errorMessage.substring(0, 200)
        });
      } else {
        console.error('[PRODUCTS_ORDERS_LIST] Database error:', {
          errorCode,
          errorMessage: errorMessage.substring(0, 200)
        });
      }
      // Return empty results instead of failing
      orders = [];
      total = 0;
    }

    // Add order_type if it doesn't exist (for backward compatibility)
    // Determine order_type based on relationships
    const ordersWithOrderType = orders.map(order => {
      // Check if order_type exists on the order object
      if (!order.order_type && order.order_type !== '') {
        // If order_type field doesn't exist in DB yet, infer it
        if (order.custom_product_request_id) {
          order.order_type = 'custom_order';
        } else if (order.product_id) {
          order.order_type = 'stock_product';
        } else {
          order.order_type = 'stock_product'; // default
        }
      }
      return order;
    });

    console.log('[PRODUCTS_ORDERS_LIST] Orders fetched', {
      userId: prismaUser.id,
      email: prismaUser.email,
      total,
      returned: ordersWithOrderType.length,
      where,
    });

    return res.status(200).json({
      success: true,
      orders: ordersWithOrderType,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error listing product orders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

