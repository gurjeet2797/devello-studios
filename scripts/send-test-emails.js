const {
  sendOrderConfirmationEmail,
  sendFormEmail,
  sendTailoredFormEmail,
  sendOrderStatusUpdateEmail,
  sendShippingNotificationEmail,
  sendOrderTrackingEmail,
  sendRefundRequestNotificationEmail,
  sendRefundStatusEmail,
  sendOrderMessageEmail,
  sendAdminOrderNotification,
  sendAdminInquiryNotification
} = require('../lib/emailService');
const prisma = require('../lib/prisma').default;

async function sendTestEmails() {
  try {
    console.log('📧 Starting comprehensive test email sending...\n');

    // Get a random product
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        is_test: false
      },
      take: 5
    });

    if (products.length === 0) {
      console.error('❌ No products found. Please add products to the database first.');
      return;
    }

    const randomProduct = products[Math.floor(Math.random() * products.length)];
    console.log(`✅ Selected product: ${randomProduct.name}\n`);

    // Use gurjeet2797@gmail.com for customer test emails, sales@develloinc.com for admin emails
    const customerEmail = 'gurjeet2797@gmail.com';
    const adminEmail = process.env.SALES_EMAIL || 'sales@develloinc.com';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const orderNumber = `TEST-${Date.now()}`;
    const customerName = 'Test Customer';

    console.log(`📬 Sending customer emails to: ${customerEmail}`);
    console.log(`📬 Sending admin emails to: ${adminEmail}\n`);

    // 1. Form Submission Email (Admin)
    console.log('1️⃣  Sending form submission email (admin)...');
    const formHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h2 style="color: #111827; margin-bottom: 20px;">New Contact Form Submission</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #111827; margin-top: 0; margin-bottom: 16px;">Contact Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #111827;">John Doe</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Email:</td>
              <td style="padding: 8px 0; color: #111827;">john.doe@example.com</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Phone:</td>
              <td style="padding: 8px 0; color: #111827;">+1 (555) 123-4567</td>
            </tr>
          </table>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #111827; margin-top: 0; margin-bottom: 16px;">Message</h3>
          <p style="color: #374151; line-height: 1.6; margin: 0;">
            Hello, I'm interested in learning more about your custom window manufacturing services. 
            I'm working on a renovation project and would like to discuss options for energy-efficient windows 
            for my home. Could someone please contact me to schedule a consultation?
          </p>
        </div>
      </div>
    `;

    const formResult = await sendFormEmail({
      to: adminEmail,
      subject: 'Test Contact Form Submission',
      html: formHtml,
      replyTo: 'john.doe@example.com'
    });
    console.log(formResult.success ? '   ✅ Sent' : `   ❌ Failed: ${formResult.error}\n`);

    // 2. Order Confirmation Email
    console.log('2️⃣  Sending order confirmation email...');
    const orderResult = await sendOrderConfirmationEmail({
      to: customerEmail,
      orderNumber: orderNumber,
      orderType: 'stock_product',
      amount: randomProduct.price * 2,
      currency: randomProduct.currency || 'usd',
      status: 'completed',
      clientPortalLink: `${baseUrl}/client-portal`,
      orderDate: new Date(),
      recipientEmail: customerEmail,
      products: [{
        product: randomProduct,
        quantity: 2,
        price: randomProduct.price,
        currency: randomProduct.currency || 'usd'
      }]
    });
    console.log(orderResult.success ? '   ✅ Sent' : `   ❌ Failed: ${orderResult.error}\n`);

    // 3. Order Status Update Email
    console.log('3️⃣  Sending order status update email...');
    const statusUpdateResult = await sendOrderStatusUpdateEmail({
      to: customerEmail,
      recipientName: customerName,
      orderNumber: orderNumber,
      orderType: 'stock_product',
      status: 'processing',
      product: randomProduct,
      customMessage: 'Your order is now being processed and will be shipped soon.',
      trackingLink: `${baseUrl}/order-tracking?order_number=${orderNumber}&email=${encodeURIComponent(customerEmail)}`,
      portalLink: `${baseUrl}/client-portal`
    });
    console.log(statusUpdateResult.success ? '   ✅ Sent' : `   ❌ Failed: ${statusUpdateResult.error}\n`);

    // 4. Shipping Notification Email
    console.log('4️⃣  Sending shipping notification email...');
    const shippingResult = await sendShippingNotificationEmail({
      to: customerEmail,
      recipientName: customerName,
      orderNumber: orderNumber,
      orderType: 'stock_product',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
      shippingAddress: {
        address_line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        country: 'United States'
      },
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      product: randomProduct,
      customMessage: 'Your order has been shipped and is on its way!',
      trackingLink: `${baseUrl}/order-tracking?order_number=${orderNumber}&email=${encodeURIComponent(customerEmail)}`
    });
    console.log(shippingResult.success ? '   ✅ Sent' : `   ❌ Failed: ${shippingResult.error}\n`);

    // 5. Order Tracking Email
    console.log('5️⃣  Sending order tracking email...');
    const trackingResult = await sendOrderTrackingEmail({
      to: customerEmail,
      recipientName: customerName,
      orderNumber: orderNumber,
      orderType: 'stock_product',
      trackingNumber: '1Z999AA10123456784',
      carrier: 'UPS',
      shippedAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      product: randomProduct,
      customMessage: 'Track your shipment using the tracking number above.',
      trackingLink: `${baseUrl}/order-tracking?order_number=${orderNumber}&email=${encodeURIComponent(customerEmail)}`
    });
    console.log(trackingResult.success ? '   ✅ Sent' : `   ❌ Failed: ${trackingResult.error}\n`);

    // 6. Refund Request Notification Email (Admin)
    console.log('6️⃣  Sending refund request notification email (admin)...');
    const refundRequestResult = await sendRefundRequestNotificationEmail({
      orderNumber: orderNumber,
      customerName: customerName,
      customerEmail: customerEmail,
      reason: 'Defective Product',
      description: 'The product arrived damaged and does not meet quality standards.',
      requestedAmount: randomProduct.price * 2,
      currency: 'usd',
      productName: randomProduct.name,
      orderLink: `${baseUrl}/admin/orders/product-orders`
    });
    console.log(refundRequestResult.success ? '   ✅ Sent' : `   ❌ Failed: ${refundRequestResult.error}\n`);

    // 7. Refund Status Email (Approved)
    console.log('7️⃣  Sending refund status email (approved)...');
    const refundStatusResult = await sendRefundStatusEmail({
      to: customerEmail,
      recipientName: customerName,
      orderNumber: orderNumber,
      status: 'approved',
      requestedAmount: randomProduct.price * 2,
      resolvedAmount: randomProduct.price * 2,
      currency: 'usd',
      reason: 'Defective Product',
      adminNotes: 'Refund has been approved and will be processed within 5-7 business days.',
      orderLink: `${baseUrl}/client-portal`
    });
    console.log(refundStatusResult.success ? '   ✅ Sent' : `   ❌ Failed: ${refundStatusResult.error}\n`);

    // 8. Order Message Email (Customer)
    console.log('8️⃣  Sending order message email (to customer)...');
    const orderMessageResult = await sendOrderMessageEmail({
      to: customerEmail,
      recipientName: customerName,
      senderName: 'Devello Support Team',
      senderEmail: 'support@develloinc.com',
      orderNumber: orderNumber,
      message: 'We wanted to let you know that your order is being prepared for shipment. We expect it to ship within the next 2-3 business days. You will receive a tracking number once it ships.',
      isFromAdmin: true,
      orderLink: `${baseUrl}/client-portal`
    });
    console.log(orderMessageResult.success ? '   ✅ Sent' : `   ❌ Failed: ${orderMessageResult.error}\n`);

    // 9. Admin Order Notification
    console.log('9️⃣  Sending admin order notification...');
    const adminOrderResult = await sendAdminOrderNotification({
      orderNumber: orderNumber,
      orderType: 'stock_product',
      customerName: customerName,
      customerEmail: customerEmail,
      orderDetails: `${randomProduct.name} (Qty: 2)`,
      amount: randomProduct.price * 2,
      currency: 'usd',
      orderDate: new Date(),
      shippingAddress: {
        address_line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        country: 'United States'
      },
      orderLink: `${baseUrl}/admin/orders/product-orders`
    });
    console.log(adminOrderResult.success ? '   ✅ Sent' : `   ❌ Failed: ${adminOrderResult.error}\n`);

    // 10. Admin Inquiry Notification
    console.log('🔟 Sending admin inquiry notification...');
    const adminInquiryResult = await sendAdminInquiryNotification({
      customerName: customerName,
      customerEmail: customerEmail,
      subject: 'Question about Order #' + orderNumber,
      message: 'I have a question about my recent order. Can you please provide an update on the shipping status?',
      inquiryLink: `${baseUrl}/admin/orders/product-orders`,
      orderNumber: orderNumber
    });
    console.log(adminInquiryResult.success ? '   ✅ Sent' : `   ❌ Failed: ${adminInquiryResult.error}\n`);

    // 11. Construction Service Request Email
    console.log('1️⃣1️⃣ Sending construction service request email...');
    const constructionResult = await sendTailoredFormEmail({
      formType: 'construction',
      formData: {
        name: 'John Construction',
        email: customerEmail,
        phone: '+1 (555) 123-4567',
        project_type: 'Home Renovation',
        project_stage: 'Planning',
        project_description: 'I am looking to renovate my kitchen and need custom windows and doors. The project involves replacing 6 windows and 2 doors with energy-efficient options.',
        additional_info: 'I have a specific design in mind and would like to discuss custom sizing options.'
      },
      replyTo: customerEmail
    });
    console.log(constructionResult.success ? '   ✅ Sent' : `   ❌ Failed: ${constructionResult.error}\n`);

    // 12. Custom Product Request Email
    console.log('1️⃣2️⃣ Sending custom product request email...');
    const customProductResult = await sendTailoredFormEmail({
      formType: 'custom_product',
      formData: {
        name: 'Jane Manufacturing',
        email: customerEmail,
        phone: '+1 (555) 987-6543',
        project_type: 'Custom Windows',
        project_stage: 'Ready to Order',
        project_description: 'I need custom windows for a commercial building project. Looking for 20 units of double-pane energy-efficient windows with specific dimensions.',
        additional_info: 'Please provide a quote for bulk pricing.'
      },
      replyTo: customerEmail
    });
    console.log(customProductResult.success ? '   ✅ Sent' : `   ❌ Failed: ${customProductResult.error}\n`);

    // 13. Software Build Request Email
    console.log('1️⃣3️⃣ Sending software build request email...');
    const softwareBuildResult = await sendTailoredFormEmail({
      formType: 'software_build',
      formData: {
        name: 'Tech Startup Inc',
        email: customerEmail,
        phone: '+1 (555) 456-7890',
        project_type: 'commercial',
        primary_goal: 'Build a web application for customer management',
        description: 'We need a comprehensive web application for managing customer relationships, orders, and inventory. The system should integrate with our existing payment processing.',
        project_stage: 'Planning',
        role: 'CEO',
        target_platforms: ['web', 'api'],
        timeline: '3-6 months',
        budget: '$50,000 - $100,000',
        additional_info: 'We are open to using modern frameworks and cloud-based solutions.'
      },
      replyTo: customerEmail
    });
    console.log(softwareBuildResult.success ? '   ✅ Sent' : `   ❌ Failed: ${softwareBuildResult.error}\n`);

    // 14. Consultation Request Email
    console.log('1️⃣4️⃣ Sending consultation request email...');
    const consultationResult = await sendTailoredFormEmail({
      formType: 'consultation',
      formData: {
        name: 'Business Owner',
        email: customerEmail,
        phone: '+1 (555) 321-0987',
        consultation_type: 'Business Strategy',
        business_description: 'I run a small manufacturing business and need advice on digital transformation and process optimization.',
        business_stage: 'Established',
        additional_info: 'I would like to discuss how to modernize our operations and improve efficiency through technology.'
      },
      replyTo: customerEmail
    });
    console.log(consultationResult.success ? '   ✅ Sent' : `   ❌ Failed: ${consultationResult.error}\n`);

    console.log('\n✨ All test emails completed!');
    console.log(`\n📬 Customer emails sent to: ${customerEmail}`);
    console.log(`📬 Admin emails sent to: ${adminEmail}`);
    console.log(`\n📋 Email Summary:`);
    console.log(`   1. Form Submission (Admin) → ${adminEmail}`);
    console.log(`   2. Order Confirmation → ${customerEmail}`);
    console.log(`   3. Order Status Update → ${customerEmail}`);
    console.log(`   4. Shipping Notification → ${customerEmail}`);
    console.log(`   5. Order Tracking → ${customerEmail}`);
    console.log(`   6. Refund Request (Admin) → ${adminEmail}`);
    console.log(`   7. Refund Status (Approved) → ${customerEmail}`);
    console.log(`   8. Order Message (Customer) → ${customerEmail}`);
    console.log(`   9. Admin Order Notification → ${adminEmail}`);
    console.log(`   10. Admin Inquiry Notification → ${adminEmail}`);
    console.log(`   11. Construction Service Request → ${adminEmail}`);
    console.log(`   12. Custom Product Request → ${adminEmail}`);
    console.log(`   13. Software Build Request → ${adminEmail}`);
    console.log(`   14. Consultation Request → ${adminEmail}`);

  } catch (error) {
    console.error('❌ Error sending test emails:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  sendTestEmails();
}

module.exports = { sendTestEmails };
