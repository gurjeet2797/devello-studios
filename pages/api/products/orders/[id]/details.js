import { UserService } from '../../../../../lib/userService';
import prismaClient from '../../../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[PRODUCT_ORDER_DETAIL] Prisma client is not available');
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

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // First, try to fetch as ProductOrder
    let order = await prisma.productOrder.findUnique({
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
        product: true,
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
            stripe_payment_intent_id: true,
            stripe_charge_id: true,
            payment_method: true
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

    // If not found as ProductOrder, try as CustomProductRequest
    if (!order) {
      const customRequest = await prisma.customProductRequest.findUnique({
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
            orderBy: { created_at: 'desc' }
          },
          productOrder: {
            include: {
              orderUpdates: {
                orderBy: { created_at: 'desc' }
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
                orderBy: { paid_at: 'desc' }
              }
            }
          }
        }
      });

      if (!customRequest) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify user owns this custom request
      if (customRequest.user_id && customRequest.user_id !== prismaUser.id) {
        if (customRequest.email?.toLowerCase() !== prismaUser.email.toLowerCase()) {
          return res.status(403).json({ error: 'You do not have permission to view this order' });
        }
      } else if (customRequest.email?.toLowerCase() !== prismaUser.email.toLowerCase()) {
        return res.status(403).json({ error: 'You do not have permission to view this order' });
      }

      // Transform custom request to match ProductOrder format for compatibility
      const transformedOrder = {
        id: customRequest.id,
        order_type: 'custom_order',
        status: customRequest.status,
        created_at: customRequest.created_at,
        updated_at: customRequest.updated_at,
        user: customRequest.user,
        customProductRequest: customRequest,
        productOrder: customRequest.productOrder,
        // Use orderUpdates from associated ProductOrder if it exists
        orderUpdates: customRequest.productOrder?.orderUpdates || [],
        // Use shipping_address from custom request or product order
        shipping_address: customRequest.shipping_address || customRequest.productOrder?.shipping_address,
        // Map other fields
        amount: customRequest.quoted_price,
        quoted_price: customRequest.quoted_price,
        project_type: customRequest.project_type,
        project_description: customRequest.project_description,
        product_description: customRequest.product_description,
        name: customRequest.name,
        email: customRequest.email,
        phone: customRequest.phone,
        preview_image: customRequest.preview_image,
        space_rendered_image: customRequest.space_rendered_image,
        uploaded_image: customRequest.uploaded_image,
        annotated_image: customRequest.annotated_image,
        // Include payments from productOrder if it exists
        payments: customRequest.productOrder?.payments || []
      };

      return res.status(200).json({
        success: true,
        order: transformedOrder
      });
    }

    // Verify user owns this order (for ProductOrder)
    if (order.user_id !== prismaUser.id && order.guest_email?.toLowerCase() !== prismaUser.email.toLowerCase()) {
      return res.status(403).json({ error: 'You do not have permission to view this order' });
    }

    // If product is null, try to fetch from house_build_products
    let product = order.product;
    if (!product && order.product_id) {
      try {
        product = await prisma.houseBuildProduct.findUnique({
          where: { id: order.product_id }
        });
      } catch (err) {
        console.error('[PRODUCT_ORDER_DETAIL] Error fetching house build product:', err);
      }
    }

    const orderResponse = {
      ...order,
      product: product || order.product
    };

    console.log('[PRODUCT_ORDER_DETAIL] Successfully fetched order:', {
      orderId: id,
      orderNumber: order.order_number,
      status: order.status
    });

    return res.status(200).json({
      success: true,
      order: orderResponse
    });
  } catch (error) {
    console.error('[PRODUCT_ORDER_DETAIL] Error fetching order:', {
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
