// Contact form submission - Gmail SMTP

const { sendFormEmail } = require('@lib/emailService');
const { validateFormFields, validateHoneypot } = require('@lib/formValidation');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, subject, message, website } = req.body;

    console.log('[CONTACT_FORM] Received contact form submission', {
      name,
      email,
      subject,
      messageLength: message?.length || 0
    });

    // Check honeypot field (should be empty)
    const honeypotResult = validateHoneypot(website);
    if (!honeypotResult.valid) {
      console.warn('[CONTACT_FORM] Spam detected - honeypot field filled', {
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      return res.status(400).json({ error: 'Invalid submission' });
    }

    // Comprehensive form validation
    const validation = validateFormFields(
      { name, email, subject, message, website },
      {
        requireName: true,
        requireEmail: true,
        requireSubject: true,
        requireMessage: true,
        minMessageWords: 5,
        checkHoneypot: false // Already checked above
      }
    );

    if (!validation.valid) {
      console.warn('[CONTACT_FORM] Validation failed', {
        errors: validation.errors,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      // Return first error message
      const firstError = Object.values(validation.errors)[0];
      return res.status(400).json({ error: firstError });
    }

    // Create contact message data object
    const contactData = {
      id: Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      created_at: new Date().toISOString(),
      status: 'new'
    };

    // Send email notification to sales team (required)
    const emailResult = await sendContactEmail(contactData);
    
    if (!emailResult.success) {
      console.error('[CONTACT_FORM] Email sending failed:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send message. Please try again.' 
      });
    }

    console.log('[CONTACT_FORM] Contact form submitted successfully', {
      messageId: emailResult.messageId
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully' 
    });

  } catch (error) {
    console.error('[CONTACT_FORM] Contact form error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendContactEmail(contactData) {
  const {
    name,
    email,
    subject,
    message
  } = contactData;

  const salesEmail = process.env.SALES_EMAIL || 'sales@develloinc.com';

  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Contact Form Message - ${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #1e40af; }
          .value { margin-left: 10px; }
          .contact-info { background: #e0f2fe; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
          .message-box { background: #f0f9ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
          .message-text { margin-top: 10px; padding: 15px; background: white; border-radius: 4px; border-left: 3px solid #2563eb; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Form Message</h1>
            <p><strong>Subject: ${subject}</strong></p>
          </div>
          
          <div class="content">
            <div class="contact-info">
              <h3>👤 Contact Information</h3>
              <div class="section">
                <span class="label">Name:</span>
                <span class="value">${name}</span>
              </div>
              <div class="section">
                <span class="label">Email:</span>
                <span class="value"><a href="mailto:${email}">${email}</a></span>
              </div>
            </div>

            <div class="message-box">
              <h3>💬 Message</h3>
              <div class="message-text">${message.replace(/\n/g, '<br>')}</div>
            </div>

            <div style="margin-top: 30px; padding: 15px; background: #dcfce7; border-radius: 6px; text-align: center;">
              <p><strong>Next Steps:</strong></p>
              <p>Reply directly to this email to respond to <a href="mailto:${email}">${email}</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
  `;

  return await sendFormEmail({
    to: salesEmail,
    subject: `Contact Form: ${subject}`,
    html: html,
    replyTo: email
  });
}
