const nodemailer = require('nodemailer');

// Initialize transporter based on environment variables
let transporter = null;

function getTransporter() {
  if (transporter) {
    console.log('[EMAIL_SERVICE] [CONFIG] Using cached transporter');
    return transporter;
  }

  console.log('[EMAIL_SERVICE] [CONFIG] Initializing SMTP transporter');

  // SMTP configuration from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  console.log('[EMAIL_SERVICE] [CONFIG] SMTP configuration', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user ? `${smtpConfig.auth.user.substring(0, 3)}***` : 'NOT SET',
    hasPassword: !!smtpConfig.auth.pass
  });

  // If no SMTP config, return null (emails will fail gracefully)
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.warn('[EMAIL_SERVICE] [CONFIG] [ERROR] SMTP credentials not configured. Email notifications will be disabled.');
    return null;
  }

  transporter = nodemailer.createTransport(smtpConfig);
  console.log('[EMAIL_SERVICE] [CONFIG] SMTP transporter initialized successfully');
  return transporter;
}

// Helper function to validate email format
function validateEmailFormat(email) {
  if (!email) return false;
  return /\S+@\S+\.\S+/.test(email);
}

// Helper function to get common email configuration
function getEmailConfig() {
  return {
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com',
    fromName: process.env.FROM_NAME || 'Devello Inc',
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com',
    adminEmail: process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || 'sales@develloinc.com',
    salesEmail: process.env.SALES_EMAIL || 'sales@develloinc.com',
  };
}

// Helper function to validate email and get transporter (common pattern)
function validateEmailAndGetTransporter(email, emailType = 'email') {
  if (!email) {
    console.error(`[EMAIL_SERVICE] [${emailType.toUpperCase()}] [ERROR] Recipient email is required`);
    return { valid: false, error: 'Recipient email is required', transporter: null };
  }

  if (!validateEmailFormat(email)) {
    console.error(`[EMAIL_SERVICE] [${emailType.toUpperCase()}] [ERROR] Invalid recipient email format`, { email });
    return { valid: false, error: 'Invalid recipient email format', transporter: null };
  }

  const mailTransporter = getTransporter();
  if (!mailTransporter) {
    console.error(`[EMAIL_SERVICE] [${emailType.toUpperCase()}] [ERROR] SMTP not configured`);
    return { valid: false, error: 'SMTP not configured', transporter: null };
  }

  return { valid: true, error: null, transporter: mailTransporter };
}

// Fetch featured products for email footer
async function getFeaturedProducts(limit = 4) {
  try {
    const prisma = require('./prisma').default;
    const products = await prisma.product.findMany({
      where: {
        status: 'active',
        is_test: false,
        visible_in_catalog: true
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        image_url: true,
        price: true,
        currency: true,
        metadata: true
      }
    });
    return products;
  } catch (error) {
    console.error('[EMAIL_SERVICE] Error fetching featured products:', error);
    return [];
  }
}

// Get product image URL with fallback
function getProductImageUrl(product) {
  if (product?.image_url) return product.image_url;
  
  const category = product?.metadata?.category || 'custom';
  const categoryImages = {
    windows: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop',
    doors: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop',
    hardware: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=400&fit=crop',
    custom: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop',
    glass: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop',
    mirrors: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop',
    millwork: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop',
  };
  return categoryImages[category] || categoryImages.custom;
}

// Service color schemes (for backward compatibility with old email functions)
const SERVICE_COLORS = {
  blue: {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    primaryLight: '#60a5fa',
    accent: '#1e40af',
    lightBg: '#dbeafe',
    lighterBg: '#eff6ff'
  },
  orange: {
    primary: '#f97316',
    primaryDark: '#ea580c',
    primaryLight: '#fb923c',
    accent: '#c2410c',
    lightBg: '#fed7aa',
    lighterBg: '#ffedd5'
  },
  green: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    accent: '#047857',
    lightBg: '#a7f3d0',
    lighterBg: '#d1fae5'
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#7c3aed',
    primaryLight: '#a78bfa',
    accent: '#6d28d9',
    lightBg: '#c4b5fd',
    lighterBg: '#e9d5ff'
  },
  yellow: {
    primary: '#eab308',
    primaryDark: '#ca8a04',
    primaryLight: '#fbbf24',
    accent: '#a16207',
    lightBg: '#fef08a',
    lighterBg: '#fef9c3'
  }
};

// Unified email template - Clean SCHOOLHOUSE style
async function getUnifiedEmailTemplate({
  title,
  greeting,
  mainContent,
  buttonText,
  buttonLink,
  footerNote,
  products = null, // For product order emails
  featuredProducts = null, // For featured products section
  orderNumber = null,
  orderDate = null,
  shopUrl = null // Optional shop URL for featured products (defaults to baseUrl)
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
  const shopBaseUrl = shopUrl || baseUrl;
  
  // Fetch featured products if not provided
  if (!featuredProducts) {
    featuredProducts = await getFeaturedProducts(4);
  }
  
  // Build product items section if products provided
  let productItemsHtml = '';
  let invoiceSummaryHtml = '';
  
  if (products && products.length > 0) {
    let subtotal = 0;
    let totalQuantity = 0;
    
    productItemsHtml = products.map((item, index) => {
      const quantity = item.quantity || 1;
      const price = item.price || item.amount || 0;
      const itemTotal = price * quantity;
      subtotal += itemTotal;
      totalQuantity += quantity;
      
      const productImage = getProductImageUrl(item.product || item);
      const productName = item.product?.name || item.name || 'Product';
      const productDescription = item.product?.description || item.description || '';
      const variantInfo = item.variant || item.variantName ? ` - ${item.variant || item.variantName}` : '';
      const itemCurrency = (item.currency || item.product?.currency || 'usd').toUpperCase();
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 20px 0; vertical-align: top;">
            <img src="${productImage}" alt="${productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />
          </td>
          <td style="padding: 20px 0 20px 15px; vertical-align: top;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${productName}${variantInfo}</div>
            ${productDescription ? `<div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">${productDescription.substring(0, 100)}${productDescription.length > 100 ? '...' : ''}</div>` : ''}
            <div style="color: #6b7280; font-size: 14px;">Quantity: × ${quantity}</div>
          </td>
          <td style="padding: 20px 0; text-align: right; vertical-align: top; font-weight: 600; color: #111827;">
            ${new Intl.NumberFormat('en-US', { style: 'currency', currency: itemCurrency }).format(itemTotal / 100)}
          </td>
        </tr>
      `;
    }).join('');
    
    const summaryCurrency = (products[0]?.currency || products[0]?.product?.currency || 'usd').toUpperCase();
    invoiceSummaryHtml = `
      <table style="width: 100%; margin-top: 30px; border-top: 2px solid #e5e7eb; padding-top: 20px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">
            ${new Intl.NumberFormat('en-US', { style: 'currency', currency: summaryCurrency }).format(subtotal / 100)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Shipping</td>
          <td style="padding: 8px 0; text-align: right; color: #6b7280;">Calculated at checkout</td>
        </tr>
        <tr style="border-top: 1px solid #e5e7eb; margin-top: 10px;">
          <td style="padding: 12px 0 0 0; font-weight: 600; color: #111827; font-size: 16px;">Total</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-weight: 700; color: #111827; font-size: 18px;">
            ${new Intl.NumberFormat('en-US', { style: 'currency', currency: summaryCurrency }).format(subtotal / 100)}
          </td>
        </tr>
      </table>
    `;
  }
  
  // Build featured products section
  let featuredProductsHtml = '';
  if (featuredProducts && featuredProducts.length > 0) {
    featuredProductsHtml = `
      <div style="margin-top: 50px; padding-top: 40px; border-top: 1px solid #e5e7eb;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 24px; text-align: center;">Featured Products</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            ${featuredProducts.map(product => {
              const productImage = getProductImageUrl(product);
              const productUrl = `${shopBaseUrl}/custom?product=${product.slug}`;
              return `
                <td style="width: 25%; padding: 0 8px; text-align: center; vertical-align: top;">
                  <a href="${productUrl}" style="text-decoration: none; color: inherit;">
                    <img src="${productImage}" alt="${product.name}" style="width: 100%; max-width: 120px; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 12px;" />
                    <div style="font-size: 13px; font-weight: 500; color: #111827; margin-bottom: 4px;">${product.name}</div>
                    <div style="font-size: 14px; font-weight: 600; color: #111827;">
                      ${new Intl.NumberFormat('en-US', { style: 'currency', currency: (product.currency || 'usd').toUpperCase() }).format(product.price / 100)}
                    </div>
                  </a>
                </td>
              `;
            }).join('')}
          </tr>
        </table>
        <div style="text-align: center; margin-top: 24px;">
          <a href="${shopBaseUrl}/custom" style="display: inline-block; padding: 12px 24px; background: #111827; color: white; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px;">Shop All Products</a>
        </div>
      </div>
    `;
  }
  
  const formattedDate = orderDate 
    ? new Date(orderDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #111827; 
      background: #f9fafb;
      padding: 0;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .header { 
      padding: 40px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .header h1 { 
      margin: 0 0 8px 0; 
      font-size: 24px; 
      font-weight: 300;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #111827;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
    .content { 
      padding: 30px;
    }
    .greeting {
      font-size: 16px;
      color: #111827;
      margin-bottom: 20px;
    }
    .main-content {
      font-size: 15px;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 30px;
    }
    .order-info {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .order-info-row {
      display: table;
      width: 100%;
      margin-bottom: 12px;
    }
    .order-info-label {
      display: table-cell;
      width: 140px;
      font-weight: 600;
      color: #6b7280;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .order-info-value {
      display: table-cell;
      color: #111827;
      font-size: 14px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: #111827;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      font-size: 14px;
    }
    .products-section {
      margin-top: 30px;
    }
    .products-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 13px;
    }
    .products-table {
      width: 100%;
      border-collapse: collapse;
    }
    .footer-note {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer {
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer a {
      color: #111827;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px; }
      .header { padding: 30px 20px 20px; }
      .order-info-row { display: block; }
      .order-info-label { display: block; margin-bottom: 4px; }
      .order-info-value { display: block; }
      .products-table td { display: block; width: 100% !important; padding: 10px 0 !important; }
      .products-table td img { width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>DEVELLO</h1>
      <p>${title}</p>
    </div>
    <div class="content">
      ${greeting ? `<div class="greeting">${greeting}</div>` : ''}
      
      ${orderNumber || orderDate ? `
        <div class="order-info">
          ${orderNumber ? `
            <div class="order-info-row">
              <div class="order-info-label">Order No.</div>
              <div class="order-info-value">${orderNumber}</div>
            </div>
          ` : ''}
          ${orderDate ? `
            <div class="order-info-row">
              <div class="order-info-label">Date</div>
              <div class="order-info-value">${formattedDate}</div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="main-content">
        ${mainContent}
      </div>
      
      ${productItemsHtml ? `
        <div class="products-section">
          <h3>Item Description</h3>
          <table class="products-table">
            ${productItemsHtml}
          </table>
          ${invoiceSummaryHtml}
        </div>
      ` : ''}
      
      ${buttonText && buttonLink ? `
        <div class="button-container">
          <a href="${buttonLink}" class="button" style="display: inline-block; padding: 14px 32px; background: #111827; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px;">${buttonText}</a>
        </div>
      ` : ''}
      
      ${footerNote ? `<div class="footer-note">${footerNote}</div>` : ''}
      
      ${featuredProductsHtml}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Devello Inc. All rights reserved.</p>
      <p style="margin-top: 8px;">
        <a href="${baseUrl}">Visit our website</a> | 
        <a href="${baseUrl}/contact">Contact us</a>
      </p>
      <p style="margin-top: 8px;">For inquiries, call <a href="tel:929-266-2966" style="color: #111827; text-decoration: none;">929-266-2966</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Compatibility wrapper for getGlassyEmailTemplate (for backward compatibility)
// Maps old glassy template calls to new unified template style
function getGlassyEmailTemplate({
  title,
  subtitle,
  content,
  serviceColor = 'blue',
  icon = '✨'
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.6; 
      color: #111827; 
      background: #f9fafb;
      padding: 0;
    }
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff;
    }
    .header { 
      padding: 40px 30px 30px;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .header h1 { 
      margin: 0 0 8px 0; 
      font-size: 24px; 
      font-weight: 300;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #111827;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
      font-weight: 300;
      letter-spacing: 0.5px;
    }
    .content { 
      padding: 30px;
    }
    .glass-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .glass-section h3 {
      margin: 0 0 15px 0;
      color: #111827;
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
      color: #6b7280; 
      display: inline-block;
      min-width: 120px;
    }
    .value { 
      color: #374151;
      margin-left: 10px; 
    }
    .value a {
      color: #111827;
      text-decoration: none;
      font-weight: 500;
    }
    .value a:hover {
      text-decoration: underline;
    }
    .info-box {
      background: #ffffff;
      border-left: 4px solid #111827;
      border-radius: 8px;
      padding: 15px;
      margin-top: 10px;
      white-space: pre-wrap;
      color: #4b5563;
    }
    .tag {
      display: inline-block;
      background: #f3f4f6;
      color: #111827;
      padding: 6px 12px;
      border-radius: 20px;
      margin: 4px 4px 4px 0;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #e5e7eb;
    }
    .footer {
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      color: #6b7280;
      font-size: 13px;
    }
    .footer a {
      color: #111827;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content { padding: 20px; }
      .header { padding: 30px 20px 20px; }
      .glass-section { padding: 15px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>DEVELLO</h1>
      <p>${subtitle || title}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Devello Inc. All rights reserved.</p>
      <p style="margin-top: 8px;">
        <a href="${baseUrl}">Visit our website</a> | 
        <a href="${baseUrl}/contact">Contact us</a>
      </p>
      <p style="margin-top: 8px;">For inquiries, call <a href="tel:929-266-2966" style="color: #111827; text-decoration: none;">929-266-2966</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Email templates
function getMessageNotificationTemplate({ 
  recipientName, 
  senderName, 
  senderEmail,
  subject, 
  messagePreview, 
  conversationLink,
  isPartner = false 
}) {
  const appName = 'Devello Inc';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'https://develloinc.com';
  const fullLink = `${baseUrl}${conversationLink}`;

  const content = `
    <p style="margin-top: 0; font-size: 16px;">Hi ${recipientName || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">You have received a new message${isPartner ? ' from a client' : ' from a partner'}:</p>
    
    <div class="glass-section">
      <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 16px;">From: ${senderName}</p>
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">${senderEmail}</p>
      <p style="margin: 0 0 15px 0; font-weight: 600; font-size: 15px;">Subject: ${subject}</p>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
        <p style="margin: 0; color: #4b5563; line-height: 1.6;">${messagePreview}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${fullLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: transform 0.2s;">
        View Conversation
      </a>
    </div>
    
    <p style="margin-bottom: 0; color: #6b7280; font-size: 14px; text-align: center;">
      You're receiving this email because you have email notifications enabled.<br>
      <a href="${baseUrl}/profile" style="color: #10b981; text-decoration: none; font-weight: 500;">Manage your notification preferences</a>
    </p>
  `;

  return getGlassyEmailTemplate({
    title: 'New Message Received',
    subtitle: isPartner ? 'Message from a client' : 'Message from a partner',
    content,
    serviceColor: 'green',
    icon: '💬'
  });
}

// Send email notification for new message
async function sendMessageNotification({
  recipientEmail,
  recipientName,
  senderName,
  senderEmail,
  subject,
  messagePreview,
  conversationLink,
  isPartner = false
}) {
  try {
    console.log('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] Starting message notification email', {
      recipientEmail,
      recipientName,
      senderName,
      senderEmail,
      subject,
      isPartner,
      timestamp: new Date().toISOString()
    });

    // Validate recipientEmail - must be provided and not be sales email
    if (!recipientEmail) {
      console.error('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] [ERROR] recipientEmail is required');
      return { success: false, error: 'recipientEmail is required' };
    }

    // Ensure recipientEmail is a valid email format
    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      console.error('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] [ERROR] Invalid recipientEmail format', { recipientEmail });
      return { success: false, error: 'Invalid recipientEmail format' };
    }

    // Message notifications should NEVER go to sales@develloinc.com
    // They should go to the actual client/partner email
    const salesEmail = process.env.SALES_EMAIL || 'sales@develloinc.com';
    if (recipientEmail.toLowerCase() === salesEmail.toLowerCase()) {
      console.error('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] [ERROR] Message notifications cannot be sent to sales email', {
        recipientEmail,
        salesEmail
      });
      return { success: false, error: 'Message notifications cannot be sent to sales email. Use sendFormEmail for form submissions.' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'https://develloinc.com';
    const unsubscribeUrl = `${baseUrl}/profile`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipientEmail,
      replyTo: senderEmail, // Allow replying directly to sender
      subject: `New Message: ${subject}`,
      html: getMessageNotificationTemplate({
        recipientName,
        senderName,
        senderEmail,
        subject,
        messagePreview: messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview,
        conversationLink,
        isPartner
      }),
      headers: {
        'X-Priority': '1', // High priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'X-Mailer': 'Devello Inc',
        'X-Auto-Response-Suppress': 'All',
        'X-Entity-Ref-ID': `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Unique message ID
      },
      // Add text version for better deliverability
      text: `Hi ${recipientName || 'there'},

You have received a new message${isPartner ? ' from a client' : ' from a partner'}:

From: ${senderName} (${senderEmail})
Subject: ${subject}

${messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}

View conversation: ${baseUrl}${conversationLink}

You're receiving this email because you have email notifications enabled.
Manage your notification preferences: ${unsubscribeUrl}

© ${new Date().getFullYear()} Devello Inc. All rights reserved.`
    };

    console.log('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] Sending message notification via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to: recipientEmail,
      recipientName,
      subject: `New Message: ${subject}`,
      isPartner,
      note: 'This is a MESSAGE NOTIFICATION - should go to client/partner email, NOT sales email'
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] Message notification sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [MESSAGE_NOTIFICATION] [ERROR] Error sending message notification:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send tailored form submission email using unified template
// Supports: custom_product, software_build, consultation
async function sendTailoredFormEmail({
  formType, // 'custom_product', 'software_build', 'consultation'
  formData, // Object containing form fields
  replyTo = null,
  adminLink = null // Optional admin link for viewing the submission
}) {
  try {
    const salesEmail = process.env.SALES_EMAIL || 'sales@develloinc.com';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    
    // Determine title and greeting based on form type
    const formConfig = {
      custom_product: {
        title: 'New Custom Product Request',
        greeting: 'A new custom product request has been submitted.',
        icon: '🏭'
      },
      software_build: {
        title: 'New Software Build Request',
        greeting: 'A new software build request has been submitted.',
        icon: '💻'
      },
      consultation: {
        title: 'New Consultation Request',
        greeting: 'A new consultation request has been submitted.',
        icon: '💼'
      }
    };

    const config = formConfig[formType] || formConfig.consultation;
    
    // Build main content based on form type
    let mainContent = `<p>${config.greeting}</p>`;
    
    // Contact Information Section
    mainContent += `
      <div style="margin-top: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Contact Information</h3>
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Name:</span>
          <span style="color: #111827;">${formData.name || 'N/A'}</span>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Email:</span>
          <a href="mailto:${formData.email || ''}" style="color: #111827; text-decoration: none;">${formData.email || 'N/A'}</a>
        </div>
        ${formData.phone ? `
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Phone:</span>
          <a href="tel:${formData.phone}" style="color: #111827; text-decoration: none;">${formData.phone}</a>
        </div>
        ` : ''}
      </div>
    `;

    // Form-specific details
    if (formType === 'custom_product') {
      mainContent += `
        <div style="margin-top: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Project Details</h3>
          ${formData.project_type ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Project Type:</span>
            <span style="color: #111827;">${formData.project_type}</span>
          </div>
          ` : ''}
          ${formData.project_stage ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Project Stage:</span>
            <span style="color: #111827;">${formData.project_stage}</span>
          </div>
          ` : ''}
          ${formData.project_description ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Project Description:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${formData.project_description}</div>
          </div>
          ` : ''}
          ${formData.additional_info ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Additional Information:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${formData.additional_info}</div>
          </div>
          ` : ''}
        </div>
      `;
    } else if (formType === 'software_build') {
      mainContent += `
        <div style="margin-top: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Project Details</h3>
          ${formData.project_type ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Project Type:</span>
            <span style="color: #111827;">${formData.project_type === 'personal' ? 'Personal' : 'Commercial'}</span>
          </div>
          ` : ''}
          ${formData.primary_goal ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Primary Goal:</span>
            <span style="color: #111827;">${formData.primary_goal}</span>
          </div>
          ` : ''}
          ${formData.project_stage ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Project Stage:</span>
            <span style="color: #111827;">${formData.project_stage}</span>
          </div>
          ` : ''}
          ${formData.target_platforms && formData.target_platforms.length > 0 ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Target Platforms:</span>
            <span style="color: #111827;">${Array.isArray(formData.target_platforms) ? formData.target_platforms.join(', ') : formData.target_platforms}</span>
          </div>
          ` : ''}
          ${formData.timeline ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Timeline:</span>
            <span style="color: #111827;">${formData.timeline}</span>
          </div>
          ` : ''}
          ${formData.budget ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Budget:</span>
            <span style="color: #111827;">${formData.budget}</span>
          </div>
          ` : ''}
          ${formData.description ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Project Description:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${formData.description}</div>
          </div>
          ` : ''}
          ${formData.additional_info ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Additional Information:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${formData.additional_info}</div>
          </div>
          ` : ''}
        </div>
      `;
    } else if (formType === 'consultation') {
      mainContent += `
        <div style="margin-top: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Business Details</h3>
          ${formData.consultation_type ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Consultation Type:</span>
            <span style="color: #111827;">${formData.consultation_type}</span>
          </div>
          ` : ''}
          ${formData.business_stage ? `
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 120px;">Business Stage:</span>
            <span style="color: #111827;">${formData.business_stage}</span>
          </div>
          ` : ''}
          ${formData.business_description ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Business Description:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${formData.business_description}</div>
          </div>
          ` : ''}
          ${formData.file_name ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Uploaded Document:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151;">
              <div style="font-weight: 600; color: #111827;">${formData.file_name}</div>
              ${formData.file_type ? `<div style="color: #6b7280; font-size: 13px; margin-top: 4px;">${formData.file_type}</div>` : ''}
            </div>
          </div>
          ` : ''}
          ${formData.additional_info ? `
          <div style="margin-top: 12px;">
            <div style="font-weight: 600; color: #6b7280; margin-bottom: 8px;">Additional Information:</div>
            <div style="padding: 12px; background: #ffffff; border-left: 4px solid #111827; border-radius: 4px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${formData.additional_info}</div>
          </div>
          ` : ''}
        </div>
      `;
    }

    const html = await getUnifiedEmailTemplate({
      title: config.title,
      greeting: null,
      mainContent,
      buttonText: adminLink ? 'VIEW SUBMISSION' : null,
      buttonLink: adminLink || null,
      orderNumber: null,
      orderDate: new Date()
    });

    return await sendFormEmail({
      to: salesEmail,
      subject: config.title,
      html: html,
      replyTo: replyTo || formData.email
    });
  } catch (error) {
    console.error('[EMAIL_SERVICE] [TAILORED_FORM] [ERROR] Error sending tailored form email:', {
      error: error.message,
      stack: error.stack,
      formType
    });
    return { success: false, error: error.message };
  }
}

// Send generic HTML email for form submissions
// NOTE: This function is for FORM SUBMISSIONS ONLY (contact forms, build requests, etc.)
// Form submissions should ALWAYS go to sales@develloinc.com
// DO NOT use this for message notifications - use sendMessageNotification instead
async function sendFormEmail({
  to,
  subject,
  html,
  replyTo = null
}) {
  try {
    console.log('[EMAIL_SERVICE] [FORM] Starting form submission email', {
      to,
      subject,
      hasReplyTo: !!replyTo,
      timestamp: new Date().toISOString(),
      note: 'This is a FORM SUBMISSION - should go to sales@develloinc.com'
    });

    // Validate recipient - form submissions should go to sales email
    if (!to) {
      console.error('[EMAIL_SERVICE] [FORM] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    // Ensure recipient is a valid email format
    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [FORM] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [FORM] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html
    };

    if (replyTo) {
      mailOptions.replyTo = replyTo;
      console.log('[EMAIL_SERVICE] [FORM] Reply-To set:', replyTo);
    }

    console.log('[EMAIL_SERVICE] [FORM] Sending form submission email via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      note: 'This is a FORM SUBMISSION email - goes to sales@develloinc.com'
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [FORM] Email sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [FORM] [ERROR] Error sending email:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send partner notification email (approval/rejection)
async function sendPartnerNotificationEmail({
  to,
  subject,
  html
}) {
  try {
    console.log('[EMAIL_SERVICE] [PARTNER] Starting partner notification email', {
      to,
      subject,
      timestamp: new Date().toISOString()
    });

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [PARTNER] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html
    };

    console.log('[EMAIL_SERVICE] [PARTNER] Sending partner notification via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      subject
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [PARTNER] Partner notification sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [PARTNER] [ERROR] Error sending partner notification:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send order confirmation email to client
async function sendOrderConfirmationEmail({
  to,
  orderNumber,
  orderType,
  orderDetails,
  amount,
  currency = 'usd',
  status = 'pending',
  clientPortalLink,
  customProductRequestId = null,
  orderDate = null,
  recipientEmail = null,
  products = null, // Array of { product, quantity, price, variant, currency }
  customMessage = null // Optional custom message to include in email
}) {
  try {
    console.log('[EMAIL_SERVICE] [ORDER_CONFIRMATION] Starting order confirmation email', {
      to,
      orderNumber,
      orderType,
      hasProducts: !!products,
      timestamp: new Date().toISOString()
    });

    if (!to) {
      console.error('[EMAIL_SERVICE] [ORDER_CONFIRMATION] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [ORDER_CONFIRMATION] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [ORDER_CONFIRMATION] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const portalLink = clientPortalLink || `${baseUrl}/client-portal`;
    
    // Build tracking URL with pre-filled order number and email
    const trackingUrl = `${baseUrl}/order-tracking${orderNumber ? `?orderNumber=${encodeURIComponent(orderNumber)}` : ''}${recipientEmail ? `&email=${encodeURIComponent(recipientEmail)}` : ''}`;
    
    const isCustomOrder = orderType === 'custom_order';
    const title = isCustomOrder ? 'Custom Order Confirmation' : 'Order Confirmation';
    
    const statusLabels = {
      pending: 'Pending',
      received: 'Received',
      quoted: 'Quoted',
      approved: 'Approved',
      completed: 'Completed',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      processing: 'Processing'
    };

    const greeting = `Hi there,`;
    
    const mainContent = `
      <p>Thank you for choosing Devello Inc. We're working to get your purchase on its way.</p>
      <p style="margin-top: 16px;">All in-stock items ship within 10 business days. Other items, including made-to-order furniture and customized products, will ship according to the provided lead time.</p>
      <p style="margin-top: 16px;">We'll email you when your order has shipped.</p>
      <p style="margin-top: 16px;">In the meantime, you can check your order status here:</p>
    `;

    const footerNote = `
      ${customMessage ? `<p style="margin-bottom: 12px;">${customMessage}</p>` : ''}
      <p style="margin-bottom: 12px;">If you need assistance, please reach out to our Customer Experience team.</p>
      <p style="margin-bottom: 0;"><strong>Please note:</strong> Once an order has been placed we are unable to make changes to it.</p>
      <p style="margin-top: 16px; margin-bottom: 0;">Warmly,<br>Devello Inc</p>
    `;

    const html = await getUnifiedEmailTemplate({
      title,
      greeting,
      mainContent,
      buttonText: 'VIEW ORDER STATUS',
      buttonLink: trackingUrl,
      footerNote,
      products: products || (orderDetails ? [{
        product: { name: orderDetails, description: '' },
        quantity: 1,
        price: amount,
        currency: currency
      }] : null),
      orderNumber,
      orderDate: orderDate || new Date(),
      shopUrl: 'https://devello.shop'
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: `${title} - Order #${orderNumber}`,
      html: html,
      replyTo: fromEmail
    };

    console.log('[EMAIL_SERVICE] [ORDER_CONFIRMATION] Sending order confirmation via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      orderNumber,
      orderType,
      hasProducts: !!products
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [ORDER_CONFIRMATION] Order confirmation sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [ORDER_CONFIRMATION] [ERROR] Error sending order confirmation:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send order status update email
async function sendOrderStatusUpdateEmail({
  to,
  recipientName,
  orderNumber,
  orderType,
  status,
  orderDetails,
  product,
  customMessage,
  subjectOverride,
  trackingLink,
  portalLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] Starting order status update email', {
      to,
      orderNumber,
      status,
      timestamp: new Date().toISOString()
    });

    if (!to) {
      console.error('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const trackingUrl = trackingLink || `${baseUrl}/order-tracking?order_number=${orderNumber}&email=${encodeURIComponent(to)}`;
    const portalUrl = portalLink || `${baseUrl}/client-portal`;

    const isCustomOrder = orderType === 'custom_order';
    const serviceColor = isCustomOrder ? 'green' : 'blue';
    const colors = SERVICE_COLORS[serviceColor] || SERVICE_COLORS.blue;
    const icon = isCustomOrder ? '🏭' : '📦';

    const statusLabels = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };

    const content = `
    <p style="margin-top: 0; font-size: 16px;">Hi ${recipientName || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your order status has been updated:</p>
    
    <div class="glass-section">
      <h3>📋 Order Information</h3>
      <div class="section">
        <span class="label">Order Number:</span>
        <span class="value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="section">
        <span class="label">Status:</span>
        <span class="tag">${statusLabels[status] || status}</span>
      </div>
      ${product ? `
      <div class="section">
        <span class="label">Product:</span>
        <span class="value">${product.name}</span>
      </div>
      ` : ''}
    </div>

    ${customMessage ? `
    <div class="glass-section">
      <h3>💬 Update Message</h3>
      <div class="info-box">${customMessage}</div>
    </div>
    ` : ''}

    <div class="glass-section">
      <h3>🔗 Track Your Order</h3>
      <p style="margin: 0 0 15px 0;">You can track your order status and view all details:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${trackingUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin: 5px;">
          Track Order
        </a>
        <a href="${portalUrl}" style="display: inline-block; padding: 14px 32px; background: rgba(255, 255, 255, 0.9); color: ${colors.primary}; text-decoration: none; border-radius: 12px; font-weight: 600; border: 2px solid ${colors.primary}; margin: 5px;">
          View in Portal
        </a>
      </div>
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title: 'Order Status Update',
      subtitle: `Order #${orderNumber} - ${statusLabels[status] || status}`,
      content,
      serviceColor,
      icon
    });

    const subject = subjectOverride || `Order Status Update - Order #${orderNumber}`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: fromEmail
    };

    console.log('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] Sending status update via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      orderNumber,
      status
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] Status update sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [ORDER_STATUS_UPDATE] [ERROR] Error sending status update:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send shipping notification email
async function sendShippingNotificationEmail({
  to,
  recipientName,
  orderNumber,
  orderType,
  trackingNumber,
  carrier,
  shippingAddress,
  estimatedDelivery,
  product,
  customMessage,
  subjectOverride,
  trackingLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] Starting shipping notification email', {
      to,
      orderNumber,
      trackingNumber,
      timestamp: new Date().toISOString()
    });

    if (!to) {
      console.error('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const trackingUrl = trackingLink || `${baseUrl}/order-tracking?order_number=${orderNumber}&email=${encodeURIComponent(to)}`;

    // Format shipping address
    let shippingAddressText = '';
    if (shippingAddress) {
      if (typeof shippingAddress === 'string') {
        shippingAddressText = shippingAddress;
      } else {
        const addr = shippingAddress;
        const parts = [];
        if (addr.address_line1) parts.push(addr.address_line1);
        if (addr.address_line2) parts.push(addr.address_line2);
        if (addr.city) parts.push(addr.city);
        if (addr.state) parts.push(addr.state);
        if (addr.zip_code) parts.push(addr.zip_code);
        if (addr.country) parts.push(addr.country);
        shippingAddressText = parts.join(', ');
      }
    }

    // Format estimated delivery date
    let estimatedDeliveryText = '';
    if (estimatedDelivery) {
      estimatedDeliveryText = new Date(estimatedDelivery).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    // Build main content
    let mainContent = `
      <p>Great news! Your order has been shipped and is on its way to you.</p>
      
      <div style="margin-top: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">Shipping Details</h3>
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 140px;">Tracking Number:</span>
          <span style="color: #111827; font-weight: 600;">${trackingNumber}</span>
        </div>
        ${carrier ? `
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 140px;">Carrier:</span>
          <span style="color: #111827;">${carrier}</span>
        </div>
        ` : ''}
        ${estimatedDeliveryText ? `
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 140px;">Estimated Delivery:</span>
          <span style="color: #111827;">${estimatedDeliveryText}</span>
        </div>
        ` : ''}
        ${product ? `
        <div style="margin-bottom: 12px;">
          <span style="font-weight: 600; color: #6b7280; display: inline-block; min-width: 140px;">Product:</span>
          <span style="color: #111827;">${product.name}</span>
        </div>
        ` : ''}
      </div>
    `;

    if (shippingAddressText) {
      mainContent += `
        <div style="margin-top: 24px; padding: 20px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Shipping Address</h3>
          <p style="margin: 0; color: #374151; line-height: 1.6;">${shippingAddressText}</p>
        </div>
      `;
    }

    if (customMessage) {
      mainContent += `
        <div style="margin-top: 24px; padding: 20px; background: #ffffff; border-left: 4px solid #111827; border-radius: 8px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Additional Information</h3>
          <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-wrap;">${customMessage}</p>
        </div>
      `;
    }

    const html = await getUnifiedEmailTemplate({
      title: 'Your Order Has Shipped!',
      greeting: `Hi ${recipientName || 'there'},`,
      mainContent,
      buttonText: 'TRACK SHIPMENT',
      buttonLink: trackingUrl,
      orderNumber,
      orderDate: new Date(),
      products: product ? [{
        product: product,
        quantity: 1,
        price: product.price || 0,
        currency: product.currency || 'usd'
      }] : null,
      shopUrl: 'https://devello.shop'
    });

    const subject = subjectOverride || `Your Order Has Shipped - Order #${orderNumber}`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: fromEmail
    };

    console.log('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] Sending shipping notification via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      orderNumber,
      trackingNumber
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] Shipping notification sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [SHIPPING_NOTIFICATION] [ERROR] Error sending shipping notification:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send order tracking email
async function sendOrderTrackingEmail({
  to,
  recipientName,
  orderNumber,
  orderType,
  trackingNumber,
  carrier,
  shippedAt,
  estimatedDelivery,
  product,
  customMessage,
  subjectOverride,
  trackingLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [ORDER_TRACKING] Starting order tracking email', {
      to,
      orderNumber,
      trackingNumber,
      timestamp: new Date().toISOString()
    });

    if (!to) {
      console.error('[EMAIL_SERVICE] [ORDER_TRACKING] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [ORDER_TRACKING] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [ORDER_TRACKING] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const trackingUrl = trackingLink || `${baseUrl}/order-tracking?order_number=${orderNumber}&email=${encodeURIComponent(to)}`;

    const isCustomOrder = orderType === 'custom_order';
    const serviceColor = isCustomOrder ? 'green' : 'blue';
    const colors = SERVICE_COLORS[serviceColor] || SERVICE_COLORS.blue;
    const icon = '📦';

    const content = `
    <p style="margin-top: 0; font-size: 16px;">Hi ${recipientName || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Here's the tracking information for your order:</p>
    
    <div class="glass-section">
      <h3>📦 Tracking Information</h3>
      <div class="section">
        <span class="label">Order Number:</span>
        <span class="value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="section">
        <span class="label">Tracking Number:</span>
        <span class="value"><strong>${trackingNumber}</strong></span>
      </div>
      ${carrier ? `
      <div class="section">
        <span class="label">Carrier:</span>
        <span class="value">${carrier}</span>
      </div>
      ` : ''}
      ${shippedAt ? `
      <div class="section">
        <span class="label">Shipped On:</span>
        <span class="value">${new Date(shippedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      ` : ''}
      ${estimatedDelivery ? `
      <div class="section">
        <span class="label">Estimated Delivery:</span>
        <span class="value">${new Date(estimatedDelivery).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      ` : ''}
      ${product ? `
      <div class="section">
        <span class="label">Product:</span>
        <span class="value">${product.name}</span>
      </div>
      ` : ''}
    </div>

    ${customMessage ? `
    <div class="glass-section">
      <h3>💬 Additional Information</h3>
      <div class="info-box">${customMessage}</div>
    </div>
    ` : ''}

    <div class="glass-section">
      <h3>🔗 Track Your Order</h3>
      <p style="margin: 0 0 15px 0;">Click below to view detailed tracking information:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${trackingUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
          View Tracking Details
        </a>
      </div>
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title: 'Order Tracking Information',
      subtitle: `Order #${orderNumber}`,
      content,
      serviceColor,
      icon
    });

    const subject = subjectOverride || `Tracking Information - Order #${orderNumber}`;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject,
      html: html,
      replyTo: fromEmail
    };

    console.log('[EMAIL_SERVICE] [ORDER_TRACKING] Sending tracking email via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      orderNumber,
      trackingNumber
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [ORDER_TRACKING] Tracking email sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [ORDER_TRACKING] [ERROR] Error sending tracking email:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send refund request notification email to admin
async function sendRefundRequestNotificationEmail({
  orderNumber,
  customerName,
  customerEmail,
  reason,
  description,
  requestedAmount,
  currency = 'usd',
  productName,
  orderLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [REFUND_REQUEST_NOTIFICATION] Starting refund request notification email', {
      orderNumber,
      customerEmail,
      timestamp: new Date().toISOString()
    });

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [REFUND_REQUEST_NOTIFICATION] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || 'sales@develloinc.com';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(requestedAmount / 100);

    const content = `
    <p style="margin-top: 0; font-size: 16px;">A new refund request has been submitted:</p>
    
    <div class="glass-section">
      <h3>📋 Order Information</h3>
      <div class="section">
        <span class="label">Order Number:</span>
        <span class="value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="section">
        <span class="label">Customer:</span>
        <span class="value">${customerName} (${customerEmail})</span>
      </div>
      <div class="section">
        <span class="label">Product:</span>
        <span class="value">${productName}</span>
      </div>
      <div class="section">
        <span class="label">Requested Amount:</span>
        <span class="value"><strong>${formattedAmount}</strong></span>
      </div>
    </div>

    <div class="glass-section">
      <h3>💬 Refund Request Details</h3>
      <div class="section">
        <span class="label">Reason:</span>
        <span class="value">${reason}</span>
      </div>
      ${description ? `
      <div class="section">
        <span class="label">Description:</span>
        <div class="info-box">${description}</div>
      </div>
      ` : ''}
    </div>

    <div class="glass-section">
      <h3>🔗 Review Request</h3>
      <p style="margin: 0 0 15px 0;">Review and process this refund request:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${orderLink || `${baseUrl}/admin/orders`}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
          Review Refund Request
        </a>
      </div>
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title: 'New Refund Request',
      subtitle: `Order #${orderNumber}`,
      content,
      serviceColor: 'orange',
      icon: '💰'
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: adminEmail,
      subject: `Refund Request - Order #${orderNumber}`,
      html: html,
      replyTo: customerEmail
    };

    console.log('[EMAIL_SERVICE] [REFUND_REQUEST_NOTIFICATION] Sending refund request notification via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      orderNumber
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [REFUND_REQUEST_NOTIFICATION] Refund request notification sent successfully', {
      messageId: info.messageId
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [REFUND_REQUEST_NOTIFICATION] [ERROR] Error sending refund request notification:', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

// Send refund status email to client
async function sendRefundStatusEmail({
  to,
  recipientName,
  orderNumber,
  status,
  requestedAmount,
  resolvedAmount,
  currency = 'usd',
  reason,
  adminNotes,
  orderLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [REFUND_STATUS] Starting refund status email', {
      to,
      orderNumber,
      status,
      timestamp: new Date().toISOString()
    });

    if (!to) {
      console.error('[EMAIL_SERVICE] [REFUND_STATUS] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [REFUND_STATUS] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [REFUND_STATUS] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const portalLink = orderLink || `${baseUrl}/client-portal`;

    const formattedRequested = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(requestedAmount / 100);

    const formattedResolved = resolvedAmount ? new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(resolvedAmount / 100) : null;

    const statusLabels = {
      approved: 'Approved',
      rejected: 'Rejected',
      processed: 'Processed'
    };

    const statusColors = {
      approved: 'green',
      rejected: 'red',
      processed: 'green'
    };

    const serviceColor = statusColors[status] || 'blue';

    const content = `
    <p style="margin-top: 0; font-size: 16px;">Hi ${recipientName || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">Your refund request has been ${statusLabels[status] || status}:</p>
    
    <div class="glass-section">
      <h3>📋 Refund Details</h3>
      <div class="section">
        <span class="label">Order Number:</span>
        <span class="value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="section">
        <span class="label">Status:</span>
        <span class="tag">${statusLabels[status] || status}</span>
      </div>
      <div class="section">
        <span class="label">Requested Amount:</span>
        <span class="value">${formattedRequested}</span>
      </div>
      ${formattedResolved ? `
      <div class="section">
        <span class="label">Refunded Amount:</span>
        <span class="value"><strong>${formattedResolved}</strong></span>
      </div>
      ` : ''}
      ${reason ? `
      <div class="section">
        <span class="label">Reason:</span>
        <span class="value">${reason}</span>
      </div>
      ` : ''}
    </div>

    ${adminNotes ? `
    <div class="glass-section">
      <h3>💬 Admin Notes</h3>
      <div class="info-box">${adminNotes}</div>
    </div>
    ` : ''}

    <div class="glass-section">
      <h3>🔗 View Order</h3>
      <p style="margin: 0 0 15px 0;">View your order details:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${portalLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
          View Order
        </a>
      </div>
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title: `Refund ${statusLabels[status] || status}`,
      subtitle: `Order #${orderNumber}`,
      content,
      serviceColor,
      icon: status === 'approved' || status === 'processed' ? '✅' : '❌'
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: `Refund ${statusLabels[status] || status} - Order #${orderNumber}`,
      html: html,
      replyTo: fromEmail
    };

    console.log('[EMAIL_SERVICE] [REFUND_STATUS] Sending refund status via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      orderNumber,
      status
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [REFUND_STATUS] Refund status email sent successfully', {
      messageId: info.messageId
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [REFUND_STATUS] [ERROR] Error sending refund status:', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

// Send order message email (bidirectional)
async function sendOrderMessageEmail({
  to,
  recipientName,
  senderName,
  senderEmail,
  orderNumber,
  message,
  isFromAdmin = false,
  orderLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [ORDER_MESSAGE] Starting order message email', {
      to,
      orderNumber,
      isFromAdmin,
      timestamp: new Date().toISOString()
    });

    if (!to) {
      console.error('[EMAIL_SERVICE] [ORDER_MESSAGE] [ERROR] Recipient email (to) is required');
      return { success: false, error: 'Recipient email is required' };
    }

    if (!/\S+@\S+\.\S+/.test(to)) {
      console.error('[EMAIL_SERVICE] [ORDER_MESSAGE] [ERROR] Invalid recipient email format', { to });
      return { success: false, error: 'Invalid recipient email format' };
    }

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [ORDER_MESSAGE] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const portalLink = orderLink || (isFromAdmin ? `${baseUrl}/client-portal` : `${baseUrl}/admin/orders`);

    const content = `
    <p style="margin-top: 0; font-size: 16px;">Hi ${recipientName || 'there'},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">You have received a new message${isFromAdmin ? ' from our team' : ' from a customer'} regarding your order:</p>
    
    <div class="glass-section">
      <h3>📋 Order Information</h3>
      <div class="section">
        <span class="label">Order Number:</span>
        <span class="value"><strong>${orderNumber}</strong></span>
      </div>
      <div class="section">
        <span class="label">From:</span>
        <span class="value">${senderName}${senderEmail ? ` (${senderEmail})` : ''}</span>
      </div>
    </div>

    <div class="glass-section">
      <h3>💬 Message</h3>
      <div class="info-box">${message}</div>
    </div>

    <div class="glass-section">
      <h3>🔗 View Order</h3>
      <p style="margin: 0 0 15px 0;">View and respond to this message:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${portalLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">
          View Order & Respond
        </a>
      </div>
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title: 'New Order Message',
      subtitle: `Order #${orderNumber}`,
      content,
      serviceColor: 'blue',
      icon: '💬'
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: `New Message - Order #${orderNumber}`,
      html: html,
      replyTo: isFromAdmin ? fromEmail : senderEmail
    };

    console.log('[EMAIL_SERVICE] [ORDER_MESSAGE] Sending order message via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to,
      orderNumber,
      isFromAdmin
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [ORDER_MESSAGE] Order message email sent successfully', {
      messageId: info.messageId
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [ORDER_MESSAGE] [ERROR] Error sending order message:', {
      error: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
}

// Send admin notification for new order
async function sendAdminOrderNotification({
  orderNumber,
  orderType,
  customerName,
  customerEmail,
  orderDetails,
  amount,
  currency = 'usd',
  orderDate,
  shippingAddress,
  orderLink
}) {
  try {
    console.log('[EMAIL_SERVICE] [ADMIN_ORDER] Starting admin order notification', {
      orderNumber,
      orderType,
      customerEmail,
      timestamp: new Date().toISOString()
    });

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [ADMIN_ORDER] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || 'sales@develloinc.com';
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';
    const adminOrderLink = orderLink || `${baseUrl}/admin/orders/product-orders`;

    // Format order date
    const formattedOrderDate = orderDate
      ? new Date(orderDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

    // Format amount
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);

    // Format shipping address
    let shippingAddressText = 'N/A';
    if (shippingAddress) {
      const addr = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
      const parts = [];
      if (addr.address_line1) parts.push(addr.address_line1);
      if (addr.address_line2) parts.push(addr.address_line2);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.zip_code) parts.push(addr.zip_code);
      if (addr.country) parts.push(addr.country);
      shippingAddressText = parts.join(', ') || 'N/A';
    }

    const title = 'New Order Received';
    const serviceColorName = 'green';
    const serviceColor = SERVICE_COLORS.green;
    const icon = '🛒';

    const content = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="margin-top: 0; font-size: 16px;">A new order has been received and requires your attention.</p>
      
      <div style="background: ${serviceColor.lighterBg}; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: ${serviceColor.primary}; font-size: 18px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Order Number:</td>
            <td style="padding: 8px 0; color: #666;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Order Type:</td>
            <td style="padding: 8px 0; color: #666;">${orderType === 'stock_product' ? 'Stock Product' : orderType === 'custom_product' ? 'Custom Product' : orderType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Customer:</td>
            <td style="padding: 8px 0; color: #666;">${customerName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Email:</td>
            <td style="padding: 8px 0; color: #666;">${customerEmail || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Order Date:</td>
            <td style="padding: 8px 0; color: #666;">${formattedOrderDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Amount:</td>
            <td style="padding: 8px 0; color: #666; font-weight: 600;">${formattedAmount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333; vertical-align: top;">Items:</td>
            <td style="padding: 8px 0; color: #666;">${orderDetails || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333; vertical-align: top;">Shipping Address:</td>
            <td style="padding: 8px 0; color: #666;">${shippingAddressText}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${adminOrderLink}" style="display: inline-block; padding: 14px 28px; background: ${serviceColor.primary}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Order in Admin Panel
        </a>
      </div>
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title,
      subtitle: `Order #${orderNumber}`,
      content,
      serviceColor: serviceColorName,
      icon
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: adminEmail,
      subject: `New Order Received - Order #${orderNumber}`,
      html: html,
      replyTo: customerEmail || fromEmail,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log('[EMAIL_SERVICE] [ADMIN_ORDER] Sending admin order notification via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      orderNumber,
      orderType
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [ADMIN_ORDER] Admin order notification sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [ADMIN_ORDER] [ERROR] Error sending admin order notification:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Send admin notification for user inquiry/message
async function sendAdminInquiryNotification({
  customerName,
  customerEmail,
  subject,
  message,
  inquiryLink,
  orderNumber = null
}) {
  try {
    console.log('[EMAIL_SERVICE] [ADMIN_INQUIRY] Starting admin inquiry notification', {
      customerEmail,
      subject,
      hasOrderNumber: !!orderNumber,
      timestamp: new Date().toISOString()
    });

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [ADMIN_INQUIRY] [ERROR] SMTP not configured');
      return { success: false, error: 'SMTP not configured' };
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SALES_EMAIL || 'sales@develloinc.com';
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'sales@develloinc.com';
    const fromName = process.env.FROM_NAME || 'Devello Inc';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://develloinc.com';

    const title = orderNumber ? `User Inquiry - Order #${orderNumber}` : 'User Inquiry';
    const serviceColorName = 'blue';
    const serviceColor = SERVICE_COLORS.blue;
    const icon = '💬';

    const content = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="margin-top: 0; font-size: 16px;">You have received a new inquiry from a customer.</p>
      
      <div style="background: ${serviceColor.lighterBg}; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: ${serviceColor.primary}; font-size: 18px;">Inquiry Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${orderNumber ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Order Number:</td>
            <td style="padding: 8px 0; color: #666;">${orderNumber}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Customer:</td>
            <td style="padding: 8px 0; color: #666;">${customerName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Email:</td>
            <td style="padding: 8px 0; color: #666;">${customerEmail || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333; vertical-align: top;">Subject:</td>
            <td style="padding: 8px 0; color: #666;">${subject || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333; vertical-align: top;">Message:</td>
            <td style="padding: 8px 0; color: #666; white-space: pre-wrap;">${message || 'N/A'}</td>
          </tr>
        </table>
      </div>

      ${inquiryLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inquiryLink}" style="display: inline-block; padding: 14px 28px; background: ${serviceColor.primary}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          View Inquiry
        </a>
      </div>
      ` : ''}
    </div>
    `;

    const html = getGlassyEmailTemplate({
      title,
      subtitle: orderNumber ? `Order #${orderNumber}` : 'New Customer Message',
      content,
      serviceColor: serviceColorName,
      icon
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: adminEmail,
      subject: orderNumber ? `User Inquiry - Order #${orderNumber}` : 'New User Inquiry',
      html: html,
      replyTo: customerEmail || fromEmail,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    console.log('[EMAIL_SERVICE] [ADMIN_INQUIRY] Sending admin inquiry notification via SMTP', {
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      customerEmail,
      subject
    });

    const info = await mailTransporter.sendMail(mailOptions);
    console.log('[EMAIL_SERVICE] [ADMIN_INQUIRY] Admin inquiry notification sent successfully', {
      messageId: info.messageId,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [ADMIN_INQUIRY] [ERROR] Error sending admin inquiry notification:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

// Verify SMTP connection
async function verifyConnection() {
  try {
    console.log('[EMAIL_SERVICE] [CONFIG] Verifying SMTP connection', {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || '587',
      user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'NOT SET',
      hasPassword: !!process.env.SMTP_PASSWORD
    });

    const mailTransporter = getTransporter();
    if (!mailTransporter) {
      console.error('[EMAIL_SERVICE] [CONFIG] [ERROR] SMTP transporter not configured');
      return { success: false, error: 'SMTP not configured' };
    }
    
    await mailTransporter.verify();
    console.log('[EMAIL_SERVICE] [CONFIG] SMTP connection verified successfully');
    return { success: true };
  } catch (error) {
    console.error('[EMAIL_SERVICE] [CONFIG] [ERROR] SMTP verification failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendMessageNotification,
  sendFormEmail,
  sendPartnerNotificationEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendShippingNotificationEmail,
  sendOrderTrackingEmail,
  sendRefundRequestNotificationEmail,
  sendRefundStatusEmail,
  sendOrderMessageEmail,
  sendAdminOrderNotification,
  sendAdminInquiryNotification,
  verifyConnection,
  getTransporter,
  getUnifiedEmailTemplate,
  getFeaturedProducts,
  getProductImageUrl
};

// Also export as named exports for ES6 imports
module.exports.sendMessageNotification = sendMessageNotification;
module.exports.sendFormEmail = sendFormEmail;
module.exports.sendTailoredFormEmail = sendTailoredFormEmail;
module.exports.sendPartnerNotificationEmail = sendPartnerNotificationEmail;
module.exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
module.exports.sendOrderStatusUpdateEmail = sendOrderStatusUpdateEmail;
module.exports.sendShippingNotificationEmail = sendShippingNotificationEmail;
module.exports.sendOrderTrackingEmail = sendOrderTrackingEmail;
module.exports.sendRefundRequestNotificationEmail = sendRefundRequestNotificationEmail;
module.exports.sendRefundStatusEmail = sendRefundStatusEmail;
module.exports.sendOrderMessageEmail = sendOrderMessageEmail;
module.exports.sendAdminOrderNotification = sendAdminOrderNotification;
module.exports.sendAdminInquiryNotification = sendAdminInquiryNotification;
module.exports.verifyConnection = verifyConnection;
module.exports.getTransporter = getTransporter;
module.exports.getUnifiedEmailTemplate = getUnifiedEmailTemplate;
module.exports.getGlassyEmailTemplate = getGlassyEmailTemplate;
module.exports.getFeaturedProducts = getFeaturedProducts;
module.exports.getProductImageUrl = getProductImageUrl;
module.exports.SERVICE_COLORS = SERVICE_COLORS;

