import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    const partner = await prisma.partner.findUnique({
      where: { user_id: prismaUser.id },
    });

    const {
      invoiceId,
      orderId,
      productOrderId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      invoice_id: invoiceId || undefined,
      order_id: orderId || undefined,
      product_order_id: productOrderId || undefined,
      status: status || undefined,
      created_at: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    // If user is a partner, filter by partner's invoices/orders
    if (partner) {
      // Get partner's invoices and orders
      const partnerInvoices = await prisma.invoice.findMany({
        where: { partner_id: partner.id },
        select: { id: true },
      });
      const partnerOrders = await prisma.order.findMany({
        where: { partner_id: partner.id },
        select: { id: true },
      });

      where.OR = [
        { invoice_id: { in: partnerInvoices.map(i => i.id) } },
        { order_id: { in: partnerOrders.map(o => o.id) } },
        { user_id: prismaUser.id }, // User's own payments
      ];
    } else {
      // Regular user - only their payments
      where.user_id = prismaUser.id;
    }

    // Remove undefined values
    Object.keys(where).forEach(key => {
      if (where[key] === undefined) {
        delete where[key];
      }
    });

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          invoice: {
            include: {
              partner: true,
            },
          },
          order: {
            include: {
              partner: true,
            },
          },
          productOrder: {
            include: {
              product: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error listing payments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

