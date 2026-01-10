// Business Consultation Form Submission - Gmail SMTP

const { sendFormEmail } = require('@lib/emailService');
const { validateFormFields, validateHoneypot } = require('@lib/formValidation');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      consultationType,
      businessDescription,
      businessStage,
      uploadedFile,
      fileName,
      fileType,
      name,
      email,
      phone,
      additionalInfo,
      website
    } = req.body;

    // Check honeypot field (should be empty)
    const honeypotResult = validateHoneypot(website);
    if (!honeypotResult.valid) {
      console.warn('[BUSINESS_CONSULTATION] Spam detected - honeypot field filled', {
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      return res.status(400).json({ error: 'Invalid submission' });
    }

    // Validate required fields
    if (!name || !email || !consultationType) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, and consultationType are required' 
      });
    }

    // Comprehensive form validation
    const validation = validateFormFields(
      { name, email, businessDescription, website },
      {
        requireName: true,
        requireEmail: true,
        requireSubject: false,
        requireMessage: businessDescription ? true : false,
        minMessageWords: 5,
        checkHoneypot: false // Already checked above
      }
    );

    if (!validation.valid) {
      console.warn('[BUSINESS_CONSULTATION] Validation failed', {
        errors: validation.errors,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      // Return first error message
      const firstError = Object.values(validation.errors)[0];
      return res.status(400).json({ error: firstError });
    }

    // Handle large base64 files - truncate if too large for email
    let fileForEmail = uploadedFile;
    if (fileForEmail && fileForEmail.length > 1000000) { // 1MB limit for email
      fileForEmail = fileForEmail.substring(0, 1000000) + '... (truncated - file too large for email)';
    }

    // Create consultation data object
    const consultationData = {
      id: Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      consultation_type: consultationType,
      business_description: businessDescription?.trim() || '',
      business_stage: businessStage || '',
      uploaded_file: uploadedFile || null,
      file_name: fileName || null,
      file_type: fileType || null,
      file_for_email: fileForEmail || null, // Truncated version for email
      additional_info: additionalInfo?.trim() || '',
      created_at: new Date().toISOString(),
      status: 'new'
    };

    console.log('[BUSINESS_CONSULTATION] Received business consultation submission', {
      name,
      email,
      consultationType,
      hasFile: !!uploadedFile
    });

    // Send email notification to sales team
    const { sendTailoredFormEmail } = require('@lib/emailService');
    const emailResult = await sendTailoredFormEmail({
      formType: 'consultation',
      formData: {
        name: consultationData.name,
        email: consultationData.email,
        phone: consultationData.phone,
        consultation_type: consultationData.consultation_type,
        business_description: consultationData.business_description,
        business_stage: consultationData.business_stage,
        file_name: consultationData.file_name,
        file_type: consultationData.file_type,
        additional_info: consultationData.additional_info
      },
      replyTo: consultationData.email
    });
    
    if (!emailResult.success) {
      console.error('[BUSINESS_CONSULTATION] Email sending failed:', emailResult.error);
      // Still return success if email fails, but log the error
    } else {
      console.log('[BUSINESS_CONSULTATION] Business consultation submitted successfully', {
        messageId: emailResult.messageId
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Consultation request submitted successfully' 
    });

  } catch (error) {
    console.error('Consultation submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendConsultationEmail(consultationData) {
  const {
    name,
    email,
    phone,
    consultation_type,
    business_description,
    business_stage,
    uploaded_file,
    file_name,
    file_type,
    file_for_email,
    additional_info
  } = consultationData;

  const salesEmail = process.env.SALES_EMAIL || 'sales@develloinc.com';

  const colors = {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #ffffff 100%)',
    glassBg: 'rgba(139, 92, 246, 0.15)',
    glassBorder: 'rgba(139, 92, 246, 0.3)',
    accent: '#6d28d9',
    lightBg: '#c4b5fd',
    lighterBg: '#e9d5ff'
  };

  const content = `
    <div class="glass-section">
      <h3>👤 Contact Information</h3>
      <div class="section">
        <span class="label">Name:</span>
        <span class="value">${name}</span>
      </div>
      <div class="section">
        <span class="label">Email:</span>
        <span class="value"><a href="mailto:${email}">${email}</a></span>
      </div>
      ${phone ? `
      <div class="section">
        <span class="label">Phone:</span>
        <span class="value"><a href="tel:${phone}">${phone}</a></span>
      </div>
      ` : ''}
    </div>

    <div class="glass-section">
      <h3>📋 Business Details</h3>
      <div class="section">
        <span class="label">Consultation Type:</span>
        <span class="value">${consultation_type}</span>
      </div>
      ${business_stage ? `
      <div class="section">
        <span class="label">Business Stage:</span>
        <span class="value">${business_stage}</span>
      </div>
      ` : ''}
      ${business_description ? `
      <div class="section">
        <span class="label">Business Description:</span>
        <div class="info-box">${business_description.replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
      ${file_name ? `
      <div class="section">
        <span class="label">Uploaded Document:</span>
        <div class="info-box">
          <p style="margin: 0; font-weight: 600; color: ${colors.accent};">${file_name}</p>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">${file_type || 'Document'}</p>
          ${file_for_email && file_for_email.length < 1000000 ? 
            `<p style="margin: 8px 0 0 0; color: #6b7280; font-style: italic; font-size: 12px;">File attached (base64 encoded)</p>` :
            `<p style="margin: 8px 0 0 0; color: #6b7280; font-style: italic; font-size: 12px;">File was included but is too large to display in email. Please check the submission details.</p>`
          }
        </div>
      </div>
      ` : ''}
      ${additional_info ? `
      <div class="section">
        <span class="label">Additional Information:</span>
        <div class="info-box">${additional_info.replace(/\n/g, '<br>')}</div>
      </div>
      ` : ''}
    </div>
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Consultation Request - ${consultation_type}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: rgba(255, 255, 255, 0.95);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header { 
      background: ${colors.gradient};
      color: white; 
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
      animation: shimmer 3s infinite;
    }
    @keyframes shimmer {
      0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
      50% { transform: translate(-50%, -50%) rotate(180deg); }
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header h1 { 
      margin: 0 0 10px 0; 
      font-size: 28px; 
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .header p { 
      margin: 0; 
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
    }
    .content { 
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 30px; 
      border-top: 1px solid ${colors.glassBorder};
    }
    .glass-section {
      background: ${colors.glassBg};
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid ${colors.glassBorder};
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .glass-section h3 {
      margin: 0 0 15px 0;
      color: ${colors.accent};
      font-size: 18px;
      font-weight: 600;
    }
    .section { 
      margin-bottom: 15px; 
    }
    .section:last-child {
      margin-bottom: 0;
    }
    .label { 
      font-weight: 600; 
      color: ${colors.accent}; 
      display: inline-block;
      min-width: 120px;
    }
    .value { 
      color: #374151;
      margin-left: 10px; 
    }
    .value a {
      color: ${colors.primary};
      text-decoration: none;
      font-weight: 500;
    }
    .value a:hover {
      text-decoration: underline;
    }
    .info-box {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-left: 4px solid ${colors.primary};
      border-radius: 8px;
      padding: 15px;
      margin-top: 10px;
      white-space: pre-wrap;
      color: #4b5563;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
    }
    .footer {
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid ${colors.glassBorder};
      color: #6b7280;
      font-size: 14px;
    }
    @media only screen and (max-width: 600px) {
      body { padding: 10px; }
      .email-container { border-radius: 16px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content { padding: 20px; }
      .glass-section { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <h1>💼 New Business Consultation Request</h1>
        <p>Consultation Type: ${consultation_type}</p>
      </div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Devello Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendFormEmail({
    to: salesEmail,
    subject: `Business Consultation Request: ${consultation_type}`,
    html: html,
    replyTo: email
  });
}

