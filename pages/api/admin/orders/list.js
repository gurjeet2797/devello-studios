import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure prisma is available
  if (!prismaClient) {
    console.error('[ADMIN_ORDERS_LIST] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    let isAdmin, authError, user, details;
    try {
      const authResult = await verifyAdminAccess(req);
      isAdmin = authResult.isAdmin;
      authError = authResult.error;
      user = authResult.user;
      details = authResult.details;
    } catch (authException) {
      console.error('[ADMIN_ORDERS_LIST] Exception during admin verification:', {
        error: authException.message,
        stack: authException.stack
      });
      return res.status(500).json({ 
        error: 'Authentication service error',
        message: authException.message
      });
    }
    
    if (!isAdmin) {
      console.error('[ADMIN_ORDERS_LIST] Admin verification failed:', {
        error: authError,
        details: details,
        hasAuthHeader: !!req.headers.authorization,
        authHeaderStart: req.headers.authorization?.substring(0, 20),
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ 
        error: authError || 'Unauthorized',
        details: details || undefined
      });
    }

    console.log('[ADMIN_ORDERS_LIST] Admin verified successfully:', {
      userId: user?.id,
      email: user?.email,
      timestamp: new Date().toISOString()
    });

    const { status } = req.query;

    // First, let's check what project_types exist in the database for debugging
    try {
      const allProjectTypes = await prisma.customProductRequest.findMany({
        select: {
          id: true,
          project_type: true,
          status: true
        },
        take: 10
      });
      console.log('[ADMIN_ORDERS_LIST] Sample project types in database:', 
        allProjectTypes.map(r => ({ id: r.id, project_type: r.project_type, status: r.status }))
      );
    } catch (debugError) {
      console.log('[ADMIN_ORDERS_LIST] Could not fetch sample project types:', debugError.message);
    }

    // Build where clause - show ALL custom product requests
    let where = {};
    
    // Only apply status filter if provided and not 'all'
    if (status && status !== 'all') {
      if (status === 'received' || status === 'pending') {
        where.status = 'received';
      } else if (status === 'in_process' || status === 'processing') {
        where.status = { in: ['quoted', 'approved'] };
      } else if (status === 'delivered') {
        where.status = 'delivered';
      }
    }
    
    // If where is empty, set it to undefined so Prisma returns all records
    if (Object.keys(where).length === 0) {
      where = undefined;
    }

    // Fetch custom product requests
    let requests = [];
    try {
      console.log('[ADMIN_ORDERS_LIST] Query where clause:', JSON.stringify(where, null, 2));
      // Try query with productOrder include first
      try {
        requests = await prisma.customProductRequest.findMany({
          where,
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
            quotes: {
              orderBy: {
                created_at: 'desc'
              },
              take: 1
            },
            productOrder: {
              select: {
                id: true,
                order_number: true,
                status: true,
                payment_status: true,
                amount: true,
                currency: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        });
      } catch (includeError) {
        // If productOrder include fails (column doesn't exist), retry without it
        // This is expected behavior - the column may not exist yet in the database
        const errorMessage = includeError.message || '';
        const errorCode = includeError.code;
        const isColumnError = errorCode === 'P2022' || 
                             errorMessage.includes('custom_product_request_id') || 
                             errorMessage.includes('does not exist');
        
        if (isColumnError) {
          console.log('[ADMIN_ORDERS_LIST] Note: custom_product_request_id column does not exist (expected). Querying without productOrder include.');
          requests = await prisma.customProductRequest.findMany({
            where,
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
              quotes: {
                orderBy: {
                  created_at: 'desc'
                },
                take: 1
              }
            },
            orderBy: {
              created_at: 'desc'
            }
          });
        } else {
          // Re-throw if it's a different error
          throw includeError;
        }
      }
      console.log('[ADMIN_ORDERS_LIST] Fetched custom product requests:', {
        count: requests.length,
        sample: requests.length > 0 ? {
          id: requests[0].id,
          project_type: requests[0].project_type,
          status: requests[0].status
        } : null
      });
    } catch (requestsError) {
      console.error('[ADMIN_ORDERS_LIST] Error fetching custom product requests:', {
        error: requestsError.message,
        stack: requestsError.stack
      });
      // Continue with empty array instead of failing
      requests = [];
    }

    // Fetch stock product orders
    // Stock products are those with product_id but no custom_product_request_id
    let productOrdersWhere = {
      // Only get stock products (have product_id, no custom_product_request_id)
      custom_product_request_id: null
    };

    // Apply status filter to product orders if provided
    if (status === 'received' || status === 'pending') {
      productOrdersWhere.status = 'pending';
    } else if (status === 'in_process' || status === 'processing') {
      productOrdersWhere.status = { in: ['pending', 'processing'] };
    } else if (status === 'delivered') {
      productOrdersWhere.status = 'delivered';
    }

    // Try to filter by order_type if column exists, otherwise use the above filters
    let productOrders = [];
    try {
      // First try with order_type filter
      const whereWithOrderType = {
        ...productOrdersWhere,
        order_type: 'stock_product'
      };
      
      productOrders = await prisma.productOrder.findMany({
        where: whereWithOrderType,
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
              slug: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      // Ensure we only include orders with product_id (stock products)
      productOrders = productOrders.filter(order => order.product_id);
      
      console.log('[ADMIN_ORDERS_LIST] Fetched product orders with order_type filter:', productOrders.length);
    } catch (error) {
      // If order_type column doesn't exist or query fails, use fallback query
      const errorMessage = error?.message || '';
      const isOrderTypeError = errorMessage.includes('order_type') || 
                               errorMessage.includes('Unknown column') ||
                               (errorMessage.includes('column') && errorMessage.includes('does not exist')) ||
                               errorMessage.includes('Unknown field');
      
      if (isOrderTypeError) {
        console.log('[ADMIN_ORDERS_LIST] order_type column not found, using fallback query');
      } else {
        console.error('[ADMIN_ORDERS_LIST] Error fetching product orders:', {
          error: error.message,
          code: error.code,
          stack: error.stack
        });
      }
      
      // Fallback: fetch without order_type, filter by product_id and custom_product_request_id
      try {
        productOrders = await prisma.productOrder.findMany({
          where: productOrdersWhere,
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
                slug: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        });
        
        // Double-check: filter to only stock products (those without custom_product_request_id)
        productOrders = productOrders.filter(order => 
          order.product_id && !order.custom_product_request_id
        );
        
        console.log('[ADMIN_ORDERS_LIST] Fetched product orders with fallback query:', productOrders.length);
      } catch (fallbackError) {
        console.error('[ADMIN_ORDERS_LIST] Fallback query also failed:', {
          error: fallbackError.message,
          code: fallbackError.code,
          stack: fallbackError.stack
        });
        // Set to empty array to prevent crash
        productOrders = [];
      }
    }

    console.log('[ADMIN_ORDERS_LIST] Returning orders:', {
      customRequests: requests.length,
      productOrders: productOrders.length,
      total: requests.length + productOrders.length
    });

    return res.status(200).json({ 
      requests,
      productOrders 
    });
  } catch (error) {
    console.error('[ADMIN_ORDERS_LIST] Unexpected error:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return a more helpful error message
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An error occurred while fetching orders';
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code,
        name: error.name
      } : undefined
    });
  }
}
