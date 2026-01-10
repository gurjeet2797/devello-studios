const { verifyConnection, sendMessageNotification, getTransporter } = require('../lib/emailService');

async function testEmailService() {
  console.log('\n=== Email Service Diagnostic Test ===\n');

  // Check environment variables
  console.log('1. Checking Environment Variables:');
  const envVars = {
    SMTP_HOST: process.env.SMTP_HOST || 'NOT SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT SET',
    SMTP_USER: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET',
    FROM_EMAIL: process.env.FROM_EMAIL || 'NOT SET',
    FROM_NAME: process.env.FROM_NAME || 'NOT SET',
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'NOT SET'
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const status = value === 'NOT SET' ? '❌' : '✅';
    console.log(`   ${status} ${key}: ${value}`);
  });

  // Check transporter
  console.log('\n2. Checking SMTP Transporter:');
  const transporter = getTransporter();
  if (!transporter) {
    console.log('   ❌ Transporter is null - SMTP not configured');
    console.log('   💡 Check if SMTP_USER and SMTP_PASSWORD are set');
    return;
  }
  console.log('   ✅ Transporter created successfully');

  // Test connection
  console.log('\n3. Testing SMTP Connection:');
  try {
    const verifyResult = await verifyConnection();
    if (verifyResult.success) {
      console.log('   ✅ SMTP connection verified successfully');
    } else {
      console.log(`   ❌ SMTP connection failed: ${verifyResult.error}`);
      return;
    }
  } catch (error) {
    console.log(`   ❌ SMTP connection error: ${error.message}`);
    return;
  }

  // Test email sending (if test email provided)
  const testEmail = process.argv[2];
  if (testEmail) {
    console.log(`\n4. Testing Email Send to: ${testEmail}`);
    try {
      const result = await sendMessageNotification({
        recipientEmail: testEmail,
        recipientName: 'Test User',
        senderName: 'Devello Inc',
        senderEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@devello.us',
        subject: 'Test Notification',
        messagePreview: 'This is a test email to verify your SMTP configuration is working correctly.',
        conversationLink: '/client-portal',
        isPartner: false
      });

      if (result.success) {
        console.log(`   ✅ Test email sent successfully!`);
        console.log(`   📧 Message ID: ${result.messageId}`);
      } else {
        console.log(`   ❌ Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error sending test email: ${error.message}`);
    }
  } else {
    console.log('\n4. Skipping email send test (no email provided)');
    console.log('   💡 Run with: node scripts/test-email-service.js your-email@example.com');
  }

  console.log('\n=== Test Complete ===\n');
}

// Run the test
testEmailService().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

