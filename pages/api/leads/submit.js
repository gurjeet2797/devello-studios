// Leads form submission - Gmail SMTP

const { sendFormEmail } = require('@lib/emailService');
const { validateFormFields, validateHoneypot } = require('@lib/formValidation');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      company,
      projectType,
      projectStage,
      primaryGoal,
      role,
      description,
      targetPlatforms,
      timeline,
      budget,
      website
    } = req.body;

    // Check honeypot field (should be empty)
    const honeypotResult = validateHoneypot(website);
    if (!honeypotResult.valid) {
      console.warn('[LEADS] Spam detected - honeypot field filled', {
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      return res.status(400).json({ error: 'Invalid submission' });
    }

    // Validate required fields
    if (!name || !email || !projectType || !description) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, projectType, and description are required' 
      });
    }

    // Comprehensive form validation
    const validation = validateFormFields(
      { name, email, description, website },
      {
        requireName: true,
        requireEmail: true,
        requireSubject: false,
        requireMessage: true,
        minMessageWords: 5,
        checkHoneypot: false // Already checked above
      }
    );

    if (!validation.valid) {
      console.warn('[LEADS] Validation failed', {
        errors: validation.errors,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      // Return first error message
      const firstError = Object.values(validation.errors)[0];
      return res.status(400).json({ error: firstError });
    }

    // Create lead data object
    const leadData = {
      id: Date.now(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      company: company?.trim() || '',
      project_type: projectType,
      project_stage: projectStage || '',
      primary_goal: primaryGoal || '',
      role: role || '',
      description: description.trim(),
      target_platforms: Array.isArray(targetPlatforms) ? targetPlatforms : [],
      timeline: timeline || '',
      budget: budget || '',
      created_at: new Date().toISOString(),
      status: 'new'
    };

    console.log('[LEADS] Received lead submission', {
      name,
      email,
      projectType,
      company
    });

    // Send email notification to sales team (required)
    const emailResult = await sendLeadEmail(leadData);
    
    if (!emailResult.success) {
      console.error('[LEADS] Email sending failed:', emailResult.error);
      return res.status(500).json({ 
        error: 'Failed to send lead notification. Please try again.' 
      });
    }

    console.log('[LEADS] Lead submitted successfully', {
      messageId: emailResult.messageId
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Lead submitted successfully' 
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendLeadEmail(leadData) {
  const {
    name,
    email,
    phone,
    company,
    project_type: projectType,
    project_stage: projectStage,
    primary_goal: primaryGoal,
    role,
    description,
    target_platforms: targetPlatforms,
    timeline,
    budget
  } = leadData;

  // Format target platforms
  const platformsText = Array.isArray(targetPlatforms) && targetPlatforms.length > 0 
    ? targetPlatforms.join(', ') 
    : 'Not specified';

  const salesEmail = process.env.SALES_EMAIL || 'sales@develloinc.com';

  const colors = {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #ffffff 100%)',
    glassBg: 'rgba(59, 130, 246, 0.15)',
    glassBorder: 'rgba(59, 130, 246, 0.3)',
    accent: '#1e40af',
    lightBg: '#dbeafe',
    lighterBg: '#eff6ff'
  };

  const content = `
    <div class="glass-section">
      <h3>📞 Contact Information</h3>
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
      ${company ? `
      <div class="section">
        <span class="label">Company:</span>
        <span class="value">${company}</span>
      </div>
      ` : ''}
    </div>

    <div class="glass-section">
      <h3>🚀 Project Details</h3>
      <div class="section">
        <span class="label">Project Type:</span>
        <span class="value">${projectType === 'personal' ? 'Personal Project' : 'Commercial Project'}</span>
      </div>
      ${primaryGoal ? `
      <div class="section">
        <span class="label">Primary Goal:</span>
        <span class="value">${primaryGoal}</span>
      </div>
      ` : ''}
      ${projectStage ? `
      <div class="section">
        <span class="label">Project Stage:</span>
        <span class="value">${projectStage}</span>
      </div>
      ` : ''}
      ${role ? `
      <div class="section">
        <span class="label">Role in Decision:</span>
        <span class="value">${role}</span>
      </div>
      ` : ''}
      <div class="section">
        <span class="label">Description:</span>
        <div class="info-box">${description.replace(/\n/g, '<br>')}</div>
      </div>
    </div>

    <div class="glass-section">
      <h3>📋 Requirements & Timeline</h3>
      <div class="section">
        <span class="label">Target Platforms:</span>
        <span class="value">${platformsText}</span>
      </div>
      ${timeline ? `
      <div class="section">
        <span class="label">Timeline:</span>
        <span class="value">${timeline}</span>
      </div>
      ` : ''}
      ${budget ? `
      <div class="section">
        <span class="label">Budget:</span>
        <span class="value">${budget}</span>
      </div>
      ` : ''}
    </div>

    <div class="glass-section" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3);">
      <h3 style="color: #047857;">✅ Next Steps</h3>
      <div style="color: #374151; line-height: 1.8;">
        <p style="margin: 0 0 8px 0;">1. Review the project details above</p>
        <p style="margin: 0 0 8px 0;">2. Contact the lead at <a href="mailto:${email}" style="color: ${colors.primary}; font-weight: 500;">${email}</a></p>
        <p style="margin: 0;">3. Schedule a consultation call</p>
      </div>
    </div>
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead - ${company || name}</title>
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
        <h1>🎯 New Lead Submission</h1>
        <p>${projectType === 'personal' ? 'Personal' : 'Commercial'} Project</p>
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
    subject: `New Lead: ${projectType === 'personal' ? 'Personal' : 'Commercial'} Project - ${company || name}`,
    html: html,
    replyTo: email
  });
}
