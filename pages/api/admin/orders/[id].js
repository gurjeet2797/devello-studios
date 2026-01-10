import { verifyAdminAccess } from '../../../../lib/adminAuth';
import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ensure prisma is available
  if (!prismaClient) {
    console.error('[ADMIN_ORDERS_DETAIL] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    // Verify admin access
    let isAdmin, authError;
    try {
      const authResult = await verifyAdminAccess(req);
      isAdmin = authResult.isAdmin;
      authError = authResult.error;
    } catch (authException) {
      console.error('[ADMIN_ORDERS_DETAIL] Exception during admin verification:', {
        error: authException.message,
        stack: authException.stack
      });
      return res.status(500).json({ 
        error: 'Authentication service error',
        message: authException.message
      });
    }
    
    if (!isAdmin) {
      return res.status(401).json({ error: authError || 'Unauthorized' });
    }

    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    console.log('[ADMIN_ORDERS_DETAIL] Fetching order:', id);

    // Try query with productOrder include first - match list API structure exactly
    let request;
    try {
      console.log('[ADMIN_ORDERS_DETAIL] Attempting query with productOrder include');
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
          quotes: {
            orderBy: {
              created_at: 'desc'
            }
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
        }
      });
    } catch (includeError) {
      // If productOrder include fails (column doesn't exist), retry without it
      // Check for various column-related errors
      const errorMessage = includeError.message || '';
      const errorCode = includeError.code;
      const isColumnError = errorCode === 'P2022' || // Prisma error code for missing column
                           errorMessage.includes('custom_product_request_id') || 
                           errorMessage.includes('does not exist') ||
                           errorMessage.includes('Unknown column');
      
      if (isColumnError) {
        console.log('[ADMIN_ORDERS_DETAIL] Note: custom_product_request_id column does not exist (expected). Querying without productOrder include.');
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
            quotes: {
              orderBy: {
                created_at: 'desc'
              }
            }
          }
        });
        console.log('[ADMIN_ORDERS_DETAIL] Successfully queried without productOrder include');
      } else {
        // Re-throw if it's a different error
        console.error('[ADMIN_ORDERS_DETAIL] Unexpected error during query:', {
          error: includeError.message,
          code: includeError.code,
          stack: includeError.stack
        });
        throw includeError;
      }
    }

    if (!request) {
      console.error('[ADMIN_ORDERS_DETAIL] Request not found in database:', {
        id,
        searchedAt: new Date().toISOString()
      });
      return res.status(404).json({ error: 'Request not found' });
    }
    
    console.log('[ADMIN_ORDERS_DETAIL] Request found:', {
      id: request.id,
      project_type: request.project_type,
      status: request.status
    });

    console.log('[ADMIN_ORDERS_DETAIL] Successfully fetched request:', {
      id: request.id,
      project_type: request.project_type,
      status: request.status,
      hasUser: !!request.user,
      quotesCount: request.quotes?.length || 0,
      hasProductOrder: !!request.productOrder
    });

    return res.status(200).json({ request });
  } catch (error) {
    console.error('[ADMIN_ORDERS_DETAIL] Error fetching request:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      id: req.query?.id,
      method: req.method,
      url: req.url
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
