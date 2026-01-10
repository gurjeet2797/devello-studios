const { verifyConnection, getTransporter } = require('@lib/emailService');

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        smtpHost: process.env.SMTP_HOST || 'NOT SET',
        smtpPort: process.env.SMTP_PORT || 'NOT SET',
        smtpSecure: process.env.SMTP_SECURE || 'NOT SET',
        smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET',
        smtpPasswordSet: !!process.env.SMTP_PASSWORD,
        fromEmail: process.env.FROM_EMAIL || 'NOT SET',
        fromName: process.env.FROM_NAME || 'NOT SET',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET'
      },
      transporter: {
        exists: !!getTransporter(),
        status: getTransporter() ? 'configured' : 'not configured'
      },
      connection: null
    };

    // Test connection if transporter exists
    if (diagnostics.transporter.exists) {
      const verifyResult = await verifyConnection();
      diagnostics.connection = {
        success: verifyResult.success,
        error: verifyResult.error || null
      };
    } else {
      diagnostics.connection = {
        success: false,
        error: 'Transporter not configured - check SMTP credentials'
      };
    }

    return res.status(200).json(diagnostics);
  } catch (error) {
    console.error('[EMAIL_DIAGNOSTICS] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

