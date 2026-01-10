import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import prisma from '../../../lib/prisma';

function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Get user and partner
    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    const partner = await prisma.partner.findUnique({
      where: { user_id: prismaUser.id },
    });

    if (!partner) {
      return res.status(403).json({ error: 'Only partners can create invoices' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        partner: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify partner owns this order
    if (order.partner_id !== partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if invoice already exists for this order
    const existingInvoice = await prisma.invoice.findFirst({
      where: { order_id: orderId },
    });

    if (existingInvoice) {
      return res.status(400).json({ error: 'Invoice already exists for this order' });
    }

    // Get partner's default payment terms
    const paymentTerms = await prisma.partnerPaymentTerms.findUnique({
      where: { partner_id: partner.id },
    });

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create invoice from order
    const invoice = await prisma.invoice.create({
      data: {
        order_id: orderId,
        partner_id: partner.id,
        user_id: order.user_id,
        invoice_number: invoiceNumber,
        amount: order.total_amount || 0,
        currency: order.currency || 'usd',
        tax_amount: 0,
        status: 'draft',
        payment_terms: paymentTerms ? {
          defaultPaymentType: paymentTerms.default_payment_type,
          depositPercentage: paymentTerms.deposit_percentage,
          netDays: paymentTerms.net_days,
        } : null,
        items: [{
          description: order.title,
          amount: order.total_amount || 0,
          quantity: 1,
        }],
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        partner: true,
        order: true,
      },
    });

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error creating invoice from order:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

