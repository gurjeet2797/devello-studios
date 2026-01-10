import { UserService } from '../../../lib/userService';
import prisma from '../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { sendRefundRequestNotificationEmail } from '../../../lib/emailService';

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
      productOrderId,
      reason,
      description,
      amount, // Optional, defaults to full refund
    } = req.body;

    if (!productOrderId) {
      return res.status(400).json({ error: 'productOrderId is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Get the product order
    const productOrder = await prisma.productOrder.findUnique({
      where: { id: productOrderId },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        product: true,
        payments: {
          where: {
            status: 'succeeded'
          },
          orderBy: { paid_at: 'desc' },
          take: 1
        }
      }
    });

    if (!productOrder) {
      return res.status(404).json({ error: 'Product order not found' });
    }

    // Verify user owns this order
    if (productOrder.user_id !== prismaUser.id) {
      return res.status(403).json({ error: 'You do not have permission to request a refund for this order' });
    }

    // Check if order is eligible for refund
    if (productOrder.payment_status !== 'succeeded') {
      return res.status(400).json({ error: 'Order must be paid to request a refund' });
    }

    // Check if there's already a pending refund request
    const existingRefund = await prisma.refundRequest.findFirst({
      where: {
        product_order_id: productOrderId,
        status: 'pending'
      }
    });

    if (existingRefund) {
      return res.status(400).json({ error: 'A refund request is already pending for this order' });
    }

    // Get payment amount
    const payment = productOrder.payments[0];
    if (!payment) {
      return res.status(400).json({ error: 'No payment found for this order' });
    }

    // Determine refund amount (default to full refund)
    const refundAmount = amount || payment.amount;

    // Validate refund amount
    if (refundAmount > payment.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
    }

    if (refundAmount <= 0) {
      return res.status(400).json({ error: 'Refund amount must be greater than 0' });
    }

    // Create refund request with pending status
    const refundRequest = await prisma.refundRequest.create({
      data: {
        product_order_id: productOrderId,
        payment_id: payment.id,
        initiated_by: prismaUser.id,
        reason,
        description: description || null,
        status: 'pending',
        requested_amount: refundAmount,
      }
    });

    // Create order update
    await prisma.orderUpdate.create({
      data: {
        product_order_id: productOrderId,
        update_type: 'refund',
        message: `Refund requested: ${reason}${description ? ` - ${description}` : ''}`,
        updated_by: prismaUser.id,
      }
    });

    // Send email notification to admin
    const userEmail = prismaUser.email;
    const userName = productOrder.user.profile?.first_name 
      ? `${productOrder.user.profile.first_name} ${productOrder.user.profile.last_name || ''}`.trim()
      : userEmail;

    await sendRefundRequestNotificationEmail({
      orderNumber: productOrder.order_number,
      customerName: userName,
      customerEmail: userEmail,
      reason,
      description: description || '',
      requestedAmount: refundAmount,
      currency: payment.currency,
      productName: productOrder.product?.name || 'Product',
      orderLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com'}/admin/orders/product-orders/${productOrderId}`,
    });

    console.log('[REFUND_REQUEST] Refund request created:', {
      refundRequestId: refundRequest.id,
      productOrderId,
      requestedAmount: refundAmount,
      reason
    });

    return res.status(200).json({
      success: true,
      refundRequest: {
        id: refundRequest.id,
        status: refundRequest.status,
        requested_amount: refundRequest.requested_amount,
        created_at: refundRequest.created_at,
      }
    });
  } catch (error) {
    console.error('[REFUND_REQUEST] Error creating refund request:', {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
