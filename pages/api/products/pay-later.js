import prisma from '../../../lib/prisma';
import { createSupabaseAuthClient } from '../../../lib/supabaseClient';
import { UserService } from '../../../lib/userService';

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@develloinc.com';
const DEVELLO_PHONE = '929-266-2966';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      productId,
      productName,
      productSlug,
      variantName,
      quantity,
      dimensions,
      message,
      // Customer info (for guests)
      email,
      phone,
      fullName,
      // Shipping address
      shippingAddress,
    } = req.body;

    // Check for authenticated user
    let userId = null;
    let userEmail = email;
    let userName = fullName;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const supabase = createSupabaseAuthClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (!authError && user) {
          const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
          if (prismaUser) {
            userId = prismaUser.id;
            userEmail = user.email;
            userName = prismaUser.first_name 
              ? `${prismaUser.first_name} ${prismaUser.last_name || ''}`.trim() 
              : fullName || user.email;
          }
        }
      } catch (authError) {
        console.error('Auth error in pay-later:', authError);
        // Continue without auth
      }
    }

    // Validate required fields
    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!/\S+@\S+\.\S+/.test(userEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Create a custom order request in the database
    let requestId = null;
    try {
      const customRequest = await prisma.customOrderRequest.create({
        data: {
          user_id: userId,
          product_id: productId || null,
          product_name: productName || null,
          product_slug: productSlug || null,
          customer_email: userEmail,
          customer_phone: phone || null,
          customer_name: userName || null,
          message: message || null,
          dimensions: dimensions || null,
          quantity: quantity || 1,
          variant_name: variantName || null,
          shipping_address: shippingAddress ? JSON.stringify(shippingAddress) : null,
          request_type: 'pay_later',
          status: 'pending',
        },
      });
      requestId = customRequest.id;
    } catch (dbError) {
      console.error('DB error creating pay-later request:', dbError);
      // Continue without DB record
    }

    // Format shipping address for email
    const addressText = shippingAddress
      ? `
Shipping Address:
${shippingAddress.address_line1}
${shippingAddress.address_line2 ? shippingAddress.address_line2 + '\n' : ''}${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip_code}
${shippingAddress.country || 'US'}
      `.trim()
      : 'No shipping address provided';

    // Send email notification to admin
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName || userEmail,
          email: ADMIN_EMAIL,
          subject: `[Pay Later Request] ${productName || 'Order'}`,
          message: `
New "Pay Later" request received:

Product: ${productName || productId || 'Cart items'}
Product Slug: ${productSlug || 'N/A'}
Variant: ${variantName || 'N/A'}
Dimensions: ${dimensions || 'N/A'}
Quantity: ${quantity || 1}

Customer Details:
Name: ${userName || 'Not provided'}
Email: ${userEmail}
Phone: ${phone || 'Not provided'}
Account Type: ${userId ? 'Registered User' : 'Guest'}

${addressText}

Customer Message:
${message || 'No message provided'}

---
Request ID: ${requestId || 'N/A'}
Action Required: Contact customer to discuss payment and finalize order.
          `.trim(),
          isInternal: true,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send admin notification email');
      }
    } catch (emailError) {
      console.error('Error sending admin email:', emailError);
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Devello',
          email: userEmail,
          subject: `Your Pay Later Request - ${productName || 'Order'}`,
          message: `
Thank you for your interest in ${productName || 'our products'}!

We've received your "Pay Later" request and will be in touch within 1-2 business days to discuss your order and payment options.

Order Details:
- Product: ${productName || 'N/A'}
- Variant: ${variantName || 'N/A'}
- Quantity: ${quantity || 1}
${dimensions ? `- Dimensions: ${dimensions}` : ''}

Your Message:
${message || 'No additional message'}

If you have any questions in the meantime, feel free to call us at ${DEVELLO_PHONE} or reply to this email.

Best regards,
The Devello Team
          `.trim(),
          isInternal: false,
        }),
      });
    } catch (emailError) {
      console.error('Error sending customer confirmation email:', emailError);
    }

    return res.status(200).json({
      success: true,
      requestId,
      message: 'Pay later request submitted successfully',
      phone: DEVELLO_PHONE,
    });
  } catch (error) {
    console.error('Error creating pay-later request:', error);
    return res.status(500).json({
      error: 'Failed to submit pay later request',
      message: error.message,
    });
  }
}

