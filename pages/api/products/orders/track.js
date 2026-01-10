import prismaClient from '../../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!prismaClient) {
    console.error('[ORDER_TRACK] Prisma client is not available');
    return res.status(500).json({ error: 'Database connection not available' });
  }

  const prisma = prismaClient;

  try {
    const { order_number, email } = req.query;

    if (!order_number || !email) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['order_number', 'email']
      });
    }

    const normalizedEmail = email.toLowerCase();

    const order = await prisma.productOrder.findFirst({
      where: {
        order_number,
        order_type: 'stock_product',
        OR: [
          { guest_email: { equals: normalizedEmail, mode: 'insensitive' } },
          {
            user: {
              email: { equals: normalizedEmail, mode: 'insensitive' }
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
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
        },
        orderUpdates: {
          orderBy: { created_at: 'desc' }
        }
      },
    });

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        message: 'No order found with the provided order number and email. Please verify your information.'
      });
    }

    // If product relation is null, try to fetch from house_build_products table
    let product = order.product;
    if (!product && order.product_id) {
      try {
        product = await prisma.houseBuildProduct.findUnique({
          where: { id: order.product_id },
          select: {
            id: true,
            name: true,
            slug: true,
            image_url: true,
            price: true,
            currency: true
          }
        });
      } catch (err) {
        console.error('[ORDER_TRACK] Error fetching house build product:', err);
      }
    }

    const orderResponse = {
      id: order.id, // Include order ID for proper identification
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      amount: order.amount,
      currency: order.currency,
      order_type: order.order_type,
      order_items: order.order_items,
      shipping_address: order.shipping_address,
      tracking_number: order.tracking_number,
      carrier: order.carrier,
      customer_notes: order.customer_notes,
      estimated_ship_date: order.estimated_ship_date,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at,
      purchased_at: order.purchased_at,
      created_at: order.created_at,
      product: product,
      payment: order.payments && order.payments.length > 0 ? order.payments[0] : null,
      customer_email: order.guest_email || order.user?.email || null,
      orderUpdates: order.orderUpdates || [], // Include order updates for this specific order
      statusEvents: await prisma.orderStatusEvent.findMany({
        where: { product_order_id: order.id },
        orderBy: { created_at: 'asc' },
      }),
    };

    return res.status(200).json({
      success: true,
      order: orderResponse,
    });
  } catch (error) {
    console.error('[ORDER_TRACK] Error tracking order:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

