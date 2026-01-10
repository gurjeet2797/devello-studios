import { verifyAdminAccess } from '../../../../../lib/adminAuth';
import prisma from '../../../../../lib/prisma';
import { sendFormEmail } from '../../../../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access
    const { isAdmin, user: adminUser, error: authError } = await verifyAdminAccess(req);
    if (!isAdmin) {
      return res.status(401).json({ error: authError || 'Unauthorized' });
    }

    const { id } = req.query;
    const { amount, currency = 'usd', admin_notes, quote_id } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Fetch the custom product request
    const request = await prisma.customProductRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true
          }
        },
        quotes: {
          where: { status: 'pending' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    let quote;
    const isUpdate = (req.method === 'PUT' || req.method === 'PATCH') && (quote_id || request.quotes.length > 0);

    if (isUpdate) {
      // Update existing quote
      const quoteToUpdate = quote_id 
        ? await prisma.quote.findUnique({ where: { id: quote_id } })
        : request.quotes[0];

      if (!quoteToUpdate) {
        return res.status(404).json({ error: 'Quote not found' });
      }

      // Only allow updating pending quotes
      if (quoteToUpdate.status !== 'pending') {
        return res.status(400).json({ error: 'Can only update pending quotes' });
      }

      quote = await prisma.quote.update({
        where: { id: quoteToUpdate.id },
        data: {
          amount,
          currency,
          admin_notes: admin_notes !== undefined ? admin_notes : quoteToUpdate.admin_notes
        }
      });
    } else {
      // Create new quote
      quote = await prisma.quote.create({
        data: {
          custom_product_request_id: id,
          amount,
          currency,
          status: 'pending',
          admin_notes: admin_notes || null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }

    // Update request status and quote info
    const updatedRequest = await prisma.customProductRequest.update({
      where: { id },
      data: {
        status: 'quoted',
        quoted_price: amount,
        quoted_by: adminUser.id,
        quoted_at: new Date()
      }
    });

    // Send email notification to client
    try {
      const quoteAmount = (amount / 100).toFixed(2);
      const emailSubject = isUpdate 
        ? `Updated Quote for your ${request.project_type} order`
        : `Quote for your ${request.project_type} order`;
      const emailIntro = isUpdate
        ? `We've updated the quote for your request for a <strong>${request.project_type}</strong>.`
        : `We've reviewed your request for a <strong>${request.project_type}</strong> and prepared a quote for you.`;

      await sendFormEmail({
        to: request.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">${isUpdate ? 'Updated Quote' : 'Quote'} for Your Custom Order</h2>
            <p>Hello ${request.name},</p>
            <p>${emailIntro}</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Quote Details</h3>
              <p style="font-size: 24px; font-weight: bold; color: #10b981;">$${quoteAmount}</p>
              ${admin_notes ? `<p><strong>Notes:</strong> ${admin_notes}</p>` : ''}
            </div>
            <p>You can review and approve this quote in your client portal.</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://develloinc.com'}/client-portal" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">View in Client Portal</a></p>
            <p>Best regards,<br>The Devello Team</p>
          </div>
        `,
        replyTo: 'sales@devello.us'
      });
    } catch (emailError) {
      console.error('Error sending quote email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({ 
      success: true, 
      quote,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

