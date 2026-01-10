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

    const {
      orderId,
      userId,
      amount,
      currency = 'usd',
      taxAmount = 0,
      items,
      paymentTerms,
      dueDate,
    } = req.body;

    // Validate required fields
    if (!userId || !amount || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: userId, amount, and items are required' });
    }

    // Validate user exists
    const invoiceUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!invoiceUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber();

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        order_id: orderId || null,
        partner_id: partner.id,
        user_id: userId,
        invoice_number: invoiceNumber,
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        tax_amount: Math.round((taxAmount || 0) * 100),
        status: 'draft',
        due_date: dueDate ? new Date(dueDate) : null,
        payment_terms: paymentTerms || null,
        items: items,
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
    console.error('Error creating invoice:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

