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
    const partner = await prisma.partner.findUnique({
      where: { user_id: prismaUser.id },
    });

    const {
      paymentId,
      invoiceId,
      productOrderId,
      reason,
      description,
      amount, // Full or partial refund amount
    } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Validate that at least one ID is provided
    if (!paymentId && !invoiceId && !productOrderId) {
      return res.status(400).json({ error: 'Must provide paymentId, invoiceId, or productOrderId' });
    }

    // Get payment
    let payment = null;
    if (paymentId) {
      payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          invoice: true,
          productOrder: true,
        },
      });
    } else if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: true,
        },
      });
      if (invoice && invoice.payments.length > 0) {
        payment = invoice.payments[0];
      }
    } else if (productOrderId) {
      const productOrder = await prisma.productOrder.findUnique({
        where: { id: productOrderId },
        include: {
          payments: true,
        },
      });
      if (productOrder && productOrder.payments.length > 0) {
        payment = productOrder.payments[0];
      }
    }

    if (!payment || !payment.stripe_charge_id) {
      return res.status(404).json({ error: 'Payment not found or no charge ID available' });
    }

    // Check permissions - only partner or the user who made the payment can refund
    if (payment.invoice_id) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: payment.invoice_id },
        include: { partner: true },
      });
      if (!partner || invoice.partner_id !== partner.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    } else if (payment.product_order_id) {
      // For product orders, only the platform (admin) or the user can refund
      if (payment.user_id !== prismaUser.id && !partner) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Calculate refund amount
    const refundAmount = amount ? Math.round(amount * 100) : payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    // Create Stripe refund
    let stripeRefund;
    try {
      stripeRefund = await stripe.refunds.create({
        charge: payment.stripe_charge_id,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          payment_id: payment.id,
          invoice_id: invoiceId || '',
          product_order_id: productOrderId || '',
        },
      });
    } catch (error) {
      console.error('Error creating Stripe refund:', error);
      return res.status(500).json({ error: 'Failed to process refund with Stripe' });
    }

    // Create refund request record
    const refundRequest = await prisma.refundRequest.create({
      data: {
        payment_id: paymentId || payment.id,
        invoice_id: invoiceId || payment.invoice_id || null,
        product_order_id: productOrderId || payment.product_order_id || null,
        initiated_by: prismaUser.id,
        reason,
        description: description || null,
        status: 'processed',
        requested_amount: refundAmount,
        resolved_amount: refundAmount,
        stripe_refund_id: stripeRefund.id,
        resolved_at: new Date(),
      },
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: refundAmount === payment.amount ? 'refunded' : 'partially_refunded',
      },
    });

    // Update invoice/product order status if full refund
    if (refundAmount === payment.amount) {
      if (payment.invoice_id) {
        await prisma.invoice.update({
          where: { id: payment.invoice_id },
          data: { status: 'cancelled' },
        });
      }
      if (payment.product_order_id) {
        await prisma.productOrder.update({
          where: { id: payment.product_order_id },
          data: { payment_status: 'refunded' },
        });
      }
    }

    // TODO: Send notifications

    return res.status(200).json({
      success: true,
      refund: refundRequest,
      stripeRefund: {
        id: stripeRefund.id,
        amount: stripeRefund.amount,
        status: stripeRefund.status,
      },
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

