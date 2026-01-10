import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';
import prisma from '../../../lib/prisma';
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

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);

    const {
      paymentId,
      invoiceId,
      productOrderId,
      reason,
      description,
      requestedAmount,
    } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Validate that at least one ID is provided
    if (!paymentId && !invoiceId && !productOrderId) {
      return res.status(400).json({ error: 'Must provide paymentId, invoiceId, or productOrderId' });
    }

    // Get payment if paymentId provided
    let payment = null;
    if (paymentId) {
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
    }

    // Create dispute record
    const dispute = await prisma.paymentDispute.create({
      data: {
        payment_id: paymentId || null,
        invoice_id: invoiceId || null,
        product_order_id: productOrderId || null,
        initiated_by: prismaUser.id,
        reason,
        description: description || null,
        status: 'pending',
        requested_amount: requestedAmount ? Math.round(requestedAmount * 100) : null,
      },
      include: {
        payment: true,
        invoice: true,
        productOrder: true,
      },
    });

    // Optionally create Stripe dispute if payment has charge ID
    if (payment?.stripe_charge_id) {
      try {
        // Note: Stripe disputes are typically created automatically by Stripe
        // when a chargeback occurs. This is just for tracking purposes.
        // In production, you'd handle this via webhooks.
      } catch (error) {
        console.error('Error creating Stripe dispute:', error);
        // Continue anyway - dispute record is created
      }
    }

    // TODO: Send notifications to relevant parties

    return res.status(200).json({
      success: true,
      dispute,
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

