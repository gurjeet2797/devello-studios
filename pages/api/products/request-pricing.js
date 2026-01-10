import prisma from '../../../lib/prisma';

// Admin email for notifications
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@develloinc.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      productId,
      productName,
      productSlug,
      email,
      phone,
      message,
      dimensions,
      quantity,
      variantName,
    } = req.body;

    // Validate required fields
    if (!email || !productId) {
      return res.status(400).json({ error: 'Email and product ID are required' });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Create a custom order request in the database
    const customRequest = await prisma.customOrderRequest.create({
      data: {
        product_id: productId,
        product_name: productName || null,
        product_slug: productSlug || null,
        customer_email: email,
        customer_phone: phone || null,
        message: message || null,
        dimensions: dimensions || null,
        quantity: quantity || 1,
        variant_name: variantName || null,
        request_type: 'pricing',
        status: 'pending',
      },
    });

    // Send email notification to admin
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email,
          email: ADMIN_EMAIL,
          subject: `[Pricing Request] ${productName || 'Product'}`,
          message: `
New pricing request received:

Product: ${productName || productId}
Product Slug: ${productSlug || 'N/A'}
Variant: ${variantName || 'N/A'}
Dimensions: ${dimensions || 'N/A'}
Quantity: ${quantity || 1}

Customer Details:
Email: ${email}
Phone: ${phone || 'Not provided'}

Customer Message:
${message || 'No message provided'}

---
Request ID: ${customRequest.id}
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

    return res.status(200).json({
      success: true,
      requestId: customRequest.id,
      message: 'Pricing request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating pricing request:', error);
    
    // Handle case where customOrderRequest table doesn't exist
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      // Try to send email anyway without DB
      try {
        const { productId, productName, productSlug, email, phone, message, dimensions, quantity, variantName } = req.body;
        
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contact/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: email,
            email: ADMIN_EMAIL,
            subject: `[Pricing Request] ${productName || 'Product'}`,
            message: `
New pricing request received:

Product: ${productName || productId}
Product Slug: ${productSlug || 'N/A'}
Variant: ${variantName || 'N/A'}
Dimensions: ${dimensions || 'N/A'}
Quantity: ${quantity || 1}

Customer Details:
Email: ${email}
Phone: ${phone || 'Not provided'}

Customer Message:
${message || 'No message provided'}
            `.trim(),
            isInternal: true,
          }),
        });

        return res.status(200).json({
          success: true,
          message: 'Pricing request submitted successfully',
        });
      } catch (fallbackError) {
        console.error('Fallback email also failed:', fallbackError);
      }
    }

    return res.status(500).json({
      error: 'Failed to submit pricing request',
      message: error.message,
    });
  }
}

