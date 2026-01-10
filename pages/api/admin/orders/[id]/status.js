import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prisma from '../../../../../lib/prisma';
import { sendFormEmail } from '../../../../../lib/emailService';
import { transitionProductOrder, OrderStatuses } from '../../../../../lib/orderStateMachine';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const { isAdmin, error: authError } = await verifyAdminAccess(req);
    if (!isAdmin) {
      return res.status(401).json({ error: authError || 'Unauthorized' });
    }

    const { id } = req.query;
    const { action, message } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    // Fetch the custom product request
    // Try with productOrder include first, fallback without it if column doesn't exist
    let request;
    try {
      request = await prisma.customProductRequest.findUnique({
        where: { id },
        include: {
          productOrder: true
        }
      });
    } catch (includeError) {
      // If productOrder include fails (column doesn't exist), retry without it
      const errorMessage = includeError.message || '';
      const errorCode = includeError.code;
      const isColumnError = errorCode === 'P2022' || 
                           errorMessage.includes('custom_product_request_id') || 
                           errorMessage.includes('does not exist');
      
      if (isColumnError) {
        console.log('[ADMIN_ORDER_STATUS] Note: custom_product_request_id column does not exist (expected). Querying without productOrder include.');
        request = await prisma.customProductRequest.findUnique({
          where: { id }
        });
      } else {
        // Re-throw if it's a different error
        throw includeError;
      }
    }

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    let updatedRequest;
    let emailSubject = '';
    let emailBody = '';

    switch (action) {
      case 'send_update':
        // Send update email without changing status
        emailSubject = `Update on your ${request.project_type} order`;
        emailBody = message || `We have an update on your order. Please check your client portal for details.`;
        
        // Store the update message in additional_info
        const currentInfo = request.additional_info || '';
        const updateMessage = message || 'Update sent to client';
        const updateEntry = `\n\n[ADMIN_UPDATE: ${new Date().toISOString()}]\n${updateMessage}`;
        
        updatedRequest = await prisma.customProductRequest.update({
          where: { id },
          data: {
            additional_info: currentInfo + updateEntry,
            updated_at: new Date()
          }
        });
        break;

      case 'mark_ready':
        // Mark order as delivered
        updatedRequest = await prisma.customProductRequest.update({
          where: { id },
          data: {
            status: 'delivered'
          }
        });

        if (request.productOrder) {
          await transitionProductOrder({
            orderId: request.productOrder.id,
            targetStatus: OrderStatuses.delivered,
            reason: 'admin_mark_ready',
            actorType: 'admin',
            prismaClient: prisma,
          });
          await prisma.productOrder.update({
            where: { id: request.productOrder.id },
            data: {
              delivered_at: new Date(),
            },
          });
        }

        emailSubject = `Your ${request.project_type} order is ready!`;
        emailBody = `Great news! Your ${request.project_type} order is ready for pickup/delivery.`;
        break;

      case 'cancel':
        // Cancel order
        updatedRequest = await prisma.customProductRequest.update({
          where: { id },
          data: {
            status: 'cancelled'
          }
        });

        if (request.productOrder) {
          await transitionProductOrder({
            orderId: request.productOrder.id,
            targetStatus: OrderStatuses.cancelled,
            reason: 'admin_cancel',
            actorType: 'admin',
            prismaClient: prisma,
          });
        }

        emailSubject = `Update on your ${request.project_type} order`;
        emailBody = `We're sorry to inform you that your ${request.project_type} order has been cancelled. If you have any questions, please contact us.`;
        break;

      case 'refuse':
        // Refuse order request (before payment)
        if (!message || !message.trim()) {
          return res.status(400).json({ error: 'Refusal reason is required' });
        }

        updatedRequest = await prisma.customProductRequest.update({
          where: { id },
          data: {
            status: 'cancelled',
            additional_info: (request.additional_info || '') + `\n\n[REFUSED: ${new Date().toISOString()}]\nReason: ${message.trim()}`
          }
        });

        if (request.productOrder) {
          await transitionProductOrder({
            orderId: request.productOrder.id,
            targetStatus: OrderStatuses.cancelled,
            reason: 'admin_refuse',
            actorType: 'admin',
            prismaClient: prisma,
          });
        }

        emailSubject = `Update on your ${request.project_type} order request`;
        emailBody = `We're sorry to inform you that your ${request.project_type} order request has been refused.`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Send email notification
    try {
      await sendFormEmail({
        to: request.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">${emailSubject}</h2>
            <p>Hello ${request.name},</p>
            <p>${emailBody}</p>
            ${message ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">${message}</p>
            </div>` : ''}
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://develloinc.com'}/client-portal" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">View in Client Portal</a></p>
            <p>Best regards,<br>The Devello Team</p>
          </div>
        `,
        replyTo: 'sales@devello.us'
      });
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      request: updatedRequest || request
    });
  } catch (error) {
    console.error('[ADMIN_ORDER_STATUS] Error updating order status:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      id: req.query?.id
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

