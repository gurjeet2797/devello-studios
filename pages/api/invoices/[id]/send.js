import { createSupabaseAuthClient } from '../../../../lib/supabaseClient';
import { UserService } from '../../../../lib/userService';
import prisma from '../../../../lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

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
      return res.status(403).json({ error: 'Only partners can send invoices' });
    }

    const { id } = req.query;

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        partner: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify partner owns this invoice
    if (invoice.partner_id !== partner.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ error: 'Invoice has already been sent' });
    }

    // Optionally create Stripe invoice if using Stripe Invoicing
    let stripeInvoiceId = invoice.stripe_invoice_id;
    
    // For now, we'll just update the status to 'sent'
    // In production, you might want to:
    // 1. Create a Stripe invoice
    // 2. Send email notification
    // 3. Set due date if not already set

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'sent',
        stripe_invoice_id: stripeInvoiceId,
      },
    });

    // TODO: Send email notification to customer
    // await sendInvoiceEmail(invoice);

    return res.status(200).json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

