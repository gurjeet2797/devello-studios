import prisma from '../../../../lib/prisma';
const { sendPartnerNotificationEmail } = require('@lib/emailService');

async function sendPartnerApprovalEmail({ partnerEmail, companyName, serviceType }) {

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'construction':
        return 'Construction';
      case 'software_development':
        return 'Software Development';
      case 'consulting':
        return 'Consulting';
      default:
        return type;
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://develloinc.com';

  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Partner Application Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
          .success-box { background: #dcfce7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations!</h1>
            <p>Your Partner Application Has Been Approved</p>
          </div>
          
          <div class="content">
            <div class="success-box">
              <h2 style="margin-top: 0; color: #065f46;">Welcome to Devello Partners!</h2>
              <p style="margin-bottom: 0;">We're excited to have <strong>${companyName}</strong> as a ${getServiceTypeLabel(serviceType)} partner.</p>
            </div>

            <p>Dear Partner,</p>
            
            <p>We're thrilled to inform you that your partner application has been approved! You're now part of the Devello network of trusted service providers.</p>

            <h3>What's Next?</h3>
            <ul>
              <li>Access your partner dashboard to manage your profile and view opportunities</li>
              <li>Start receiving client inquiries and project requests</li>
              <li>Build your reputation through quality service delivery</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${baseUrl}/partners" class="button">Access Partner Dashboard</a>
            </div>

            <p>If you have any questions, please don't hesitate to reach out to us at <a href="mailto:sales@develloinc.com">sales@develloinc.com</a>.</p>

            <p>Welcome aboard!</p>
            <p><strong>The Devello Team</strong></p>
          </div>
        </div>
      </body>
      </html>
  `;

  return await sendPartnerNotificationEmail({
    to: partnerEmail,
    subject: `Congratulations! Your Partner Application Has Been Approved`,
    html: html
  });
}

async function sendPartnerRejectionEmail({ partnerEmail, companyName, serviceType }) {

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'construction':
        return 'Construction';
      case 'software_development':
        return 'Software Development';
      case 'consulting':
        return 'Consulting';
      default:
        return type;
    }
  };

  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Partner Application Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Update on Your Partner Application</h1>
          </div>
          
          <div class="content">
            <p>Dear ${companyName},</p>
            
            <p>Thank you for your interest in becoming a Devello partner. After careful review of your application for ${getServiceTypeLabel(serviceType)} services, we regret to inform you that we are unable to proceed with your application at this time.</p>

            <div class="info-box">
              <p><strong>This decision does not reflect on your qualifications or capabilities.</strong> Our partner program is selective, and we review many applications regularly.</p>
            </div>

            <p>We encourage you to:</p>
            <ul>
              <li>Continue building your portfolio and experience</li>
              <li>Reapply in the future when you feel your application is stronger</li>
              <li>Stay in touch with us for future opportunities</li>
            </ul>

            <p>If you have any questions about this decision, please feel free to contact us at <a href="mailto:sales@develloinc.com">sales@develloinc.com</a>.</p>

            <p>Thank you for your interest in Devello.</p>
            <p><strong>The Devello Team</strong></p>
          </div>
        </div>
      </body>
      </html>
  `;

  return await sendPartnerNotificationEmail({
    to: partnerEmail,
    subject: `Update on Your Partner Application`,
    html: html
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the session
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token using auth client (anon key)
    const { createSupabaseAuthClient } = await import('../../../../lib/supabaseClient');
    const supabase = createSupabaseAuthClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !supabaseUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { supabase_user_id: supabaseUser.id }
    });

    const { isAdminEmail } = require('../../../../lib/adminAuth');
    if (!adminUser || !isAdminEmail(adminUser.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { partner_id, action } = req.body; // action: 'approve' or 'reject'

    if (!partner_id || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
    }

    // Get partner record
    const partner = await prisma.partner.findUnique({
      where: { id: partner_id },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner application not found' });
    }

    // Update partner status
    const updatedPartner = await prisma.partner.update({
      where: { id: partner_id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_at: action === 'approve' ? new Date() : null,
        approved_by: action === 'approve' ? adminUser.email : null
      },
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });

    // Send email notification to partner
    console.log('[PARTNER_ADMIN] Sending partner notification email', {
      action,
      partnerEmail: updatedPartner.user.email,
      companyName: updatedPartner.company_name
    });

    try {
      let emailResult;
      if (action === 'approve') {
        emailResult = await sendPartnerApprovalEmail({
          partnerEmail: updatedPartner.user.email,
          companyName: updatedPartner.company_name,
          serviceType: updatedPartner.service_type
        });
      } else {
        emailResult = await sendPartnerRejectionEmail({
          partnerEmail: updatedPartner.user.email,
          companyName: updatedPartner.company_name,
          serviceType: updatedPartner.service_type
        });
      }

      if (emailResult.success) {
        console.log('[PARTNER_ADMIN] Partner notification email sent successfully', {
          messageId: emailResult.messageId
        });
      } else {
        console.error('[PARTNER_ADMIN] Failed to send partner notification email:', emailResult.error);
        // Don't fail the request if email fails
      }
    } catch (emailError) {
      console.error('[PARTNER_ADMIN] Error sending partner notification email:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      success: true,
      message: `Partner application ${action}d successfully`,
      partner: {
        id: updatedPartner.id,
        status: updatedPartner.status,
        approved_at: updatedPartner.approved_at,
        approved_by: updatedPartner.approved_by
      }
    });

  } catch (error) {
    console.error('Error updating partner status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

