import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prismaClient from '../../../../../lib/prisma';
import Stripe from 'stripe';
import { sendRefundStatusEmail } from '../../../../../lib/emailService';

const prisma = prismaClient;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(req);
    if (!authResult.isAdmin) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    const { id: refundRequestId } = req.query;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'

    if (!refundRequestId) {
      return res.status(400).json({ error: 'Refund request ID is required' });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }

    // Get refund request with related data
    const refundRequest = await prisma.refundRequest.findUnique({
      where: { id: refundRequestId },
      include: {
        payment: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        productOrder: {
          include: {
            user: {
              include: {
                profile: true
              }
            },
            product: true
          }
        }
      }
    });

    if (!refundRequest) {
      return res.status(404).json({ error: 'Refund request not found' });
    }

    if (refundRequest.status !== 'pending') {
      return res.status(400).json({ error: `Refund request is already ${refundRequest.status}` });
    }

    if (action === 'approve') {
      // Process refund via Stripe
      if (!refundRequest.payment?.stripe_charge_id) {
        return res.status(400).json({ error: 'Payment charge ID not found' });
      }

      let stripeRefund;
      try {
        stripeRefund = await stripe.refunds.create({
          charge: refundRequest.payment.stripe_charge_id,
          amount: refundRequest.requested_amount,
          reason: 'requested_by_customer',
          metadata: {
            refund_request_id: refundRequest.id,
            product_order_id: refundRequest.product_order_id || '',
          },
        });
      } catch (error) {
        console.error('[REFUND_APPROVE] Error creating Stripe refund:', error);
        return res.status(500).json({ error: 'Failed to process refund with Stripe', details: error.message });
      }

      // Update refund request
      const updatedRefund = await prisma.refundRequest.update({
        where: { id: refundRequestId },
        data: {
          status: 'processed',
          resolved_amount: refundRequest.requested_amount,
          stripe_refund_id: stripeRefund.id,
          resolved_at: new Date(),
        }
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: refundRequest.payment_id },
        data: {
          status: refundRequest.requested_amount === refundRequest.payment.amount ? 'refunded' : 'partially_refunded',
        }
      });

      // Update product order if full refund
      if (refundRequest.product_order_id) {
        if (refundRequest.requested_amount === refundRequest.payment.amount) {
          await prisma.productOrder.update({
            where: { id: refundRequest.product_order_id },
            data: { payment_status: 'refunded' },
          });
        }
      }

      // Create order update
      if (refundRequest.product_order_id) {
        await prisma.orderUpdate.create({
          data: {
            product_order_id: refundRequest.product_order_id,
            update_type: 'refund',
            message: `Refund approved and processed: ${formatCurrency(refundRequest.requested_amount)}${adminNotes ? ` - ${adminNotes}` : ''}`,
            updated_by: 'admin',
          }
        });
      }

      // Send email notification
      const customerEmail = refundRequest.productOrder?.user?.email || refundRequest.productOrder?.guest_email;
      const customerName = refundRequest.productOrder?.user?.profile
        ? `${refundRequest.productOrder.user.profile.first_name || ''} ${refundRequest.productOrder.user.profile.last_name || ''}`.trim()
        : customerEmail;

      if (customerEmail) {
        await sendRefundStatusEmail({
          to: customerEmail,
          recipientName: customerName,
          orderNumber: refundRequest.productOrder?.order_number || 'N/A',
          status: 'approved',
          requestedAmount: refundRequest.requested_amount,
          resolvedAmount: refundRequest.requested_amount,
          currency: refundRequest.payment.currency || 'usd',
          reason: refundRequest.reason,
          adminNotes: adminNotes || null,
          orderLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/client-portal`,
        });
      }

      return res.status(200).json({
        success: true,
        refundRequest: updatedRefund,
        stripeRefundId: stripeRefund.id
      });
    } else {
      // Reject refund
      const updatedRefund = await prisma.refundRequest.update({
        where: { id: refundRequestId },
        data: {
          status: 'rejected',
          resolved_at: new Date(),
        }
      });

      // Create order update
      if (refundRequest.product_order_id) {
        await prisma.orderUpdate.create({
          data: {
            product_order_id: refundRequest.product_order_id,
            update_type: 'refund',
            message: `Refund request rejected${adminNotes ? `: ${adminNotes}` : ''}`,
            updated_by: 'admin',
          }
        });
      }

      // Send email notification
      const customerEmail = refundRequest.productOrder?.user?.email || refundRequest.productOrder?.guest_email;
      const customerName = refundRequest.productOrder?.user?.profile
        ? `${refundRequest.productOrder.user.profile.first_name || ''} ${refundRequest.productOrder.user.profile.last_name || ''}`.trim()
        : customerEmail;

      if (customerEmail) {
        await sendRefundStatusEmail({
          to: customerEmail,
          recipientName: customerName,
          orderNumber: refundRequest.productOrder?.order_number || 'N/A',
          status: 'rejected',
          requestedAmount: refundRequest.requested_amount,
          resolvedAmount: null,
          currency: refundRequest.payment.currency || 'usd',
          reason: refundRequest.reason,
          adminNotes: adminNotes || null,
          orderLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/client-portal`,
        });
      }

      return res.status(200).json({
        success: true,
        refundRequest: updatedRefund
      });
    }
  } catch (error) {
    console.error('[REFUND_APPROVE] Error processing refund:', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount / 100);
}
