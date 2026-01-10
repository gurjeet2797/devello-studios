const { verifyConnection, sendMessageNotification } = require('@lib/emailService');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, testEmail } = req.body;

    // Verify SMTP connection
    if (action === 'verify') {
      const result = await verifyConnection();
      return res.status(200).json(result);
    }

    // Send test email
    if (action === 'test' && testEmail) {
      const result = await sendMessageNotification({
        recipientEmail: testEmail,
        recipientName: 'Test User',
        senderName: 'Devello Inc',
        senderEmail: 'test@devello.us',
        subject: 'Test Notification',
        messagePreview: 'This is a test email to verify your SMTP configuration is working correctly.',
        conversationLink: '/client-portal',
        isPartner: false
      });

      return res.status(200).json({
        success: true,
        message: 'Test email sent',
        result
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action. Use "verify" or "test" with testEmail parameter' 
    });
  } catch (error) {
    console.error('Test email error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

