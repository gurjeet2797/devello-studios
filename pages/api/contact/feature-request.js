import { createSupabaseServerClient } from '../../../lib/supabaseClient';
import { safeLog } from '../../../lib/config';

const log = (level, message, data = {}) => safeLog(level, message, data);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createSupabaseServerClient();
    
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user data for email context
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        email,
        subscription:subscriptions!inner(
          plan_type,
          status
        )
      `)
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(400).json({ error: 'User data not found' });
    }

    // Send email using a simple email service (you can replace this with your preferred email service)
    const emailData = {
      to: 'gurjeet@devello.us',
      subject: `Feature Request from ${userData.email} (${userData.subscription.plan_type} plan)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Feature Request
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #555; margin-top: 0;">User Information</h3>
            <p><strong>Email:</strong> ${userData.email}</p>
            <p><strong>Plan:</strong> ${userData.subscription.plan_type}</p>
            <p><strong>Status:</strong> ${userData.subscription.status}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h3 style="color: #555; margin-top: 0;">Feature Request</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
            <p style="margin: 0; color: #1976d2; font-size: 14px;">
              This feature request was submitted through the Devello Inc billing management interface.
            </p>
          </div>
        </div>
      `,
      text: `
Feature Request from ${userData.email} (${userData.subscription.plan_type} plan)

User Information:
- Email: ${userData.email}
- Plan: ${userData.subscription.plan_type}
- Status: ${userData.subscription.status}
- Submitted: ${new Date().toLocaleString()}

Feature Request:
${message}

---
This feature request was submitted through the Devello Inc billing management interface.
      `
    };

    // For now, we'll use a simple console log and return success
    // In production, you would integrate with an email service like SendGrid, AWS SES, etc.
    log('info', 'Feature request email would be sent', {
      to: emailData.to,
      subject: emailData.subject,
      userEmail: userData.email,
      userPlan: userData.subscription.plan_type,
      messageLength: message.length
    });

    // TODO: Replace with actual email service integration
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send(emailData);

    return res.status(200).json({ 
      success: true, 
      message: 'Feature request submitted successfully!' 
    });

  } catch (error) {
    log('error', '❌ [FEATURE_REQUEST] Error', { error: error?.message });
    return res.status(500).json({ error: 'Failed to submit feature request' });
  }
}
