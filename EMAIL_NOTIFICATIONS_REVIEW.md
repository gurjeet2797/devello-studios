# Email Notifications Service Review

## Overview
The email notification service uses **Nodemailer with SMTP** to send various types of emails. All templates use a glassmorphism design with the `getGlassyEmailTemplate` wrapper function.

## Email Functions & Templates

| Email Function | Template Function | Template Name | Color Scheme | Icon | Recipient | Trigger Location(s) |
|---|---|---|---|---|---|---|
| `sendMessageNotification` | `getMessageNotificationTemplate` | New Message Received | Green | 💬 | Client/Partner (opt-in) | `lib/messageNotificationHelper.js` → triggered by:<br>- `pages/api/conversations/[id]/message.js`<br>- `pages/api/conversations/[id]/message-stream.js`<br>- `pages/api/conversations/[id]/request-update.js`<br>- `pages/api/partners/reply.js`<br>- `pages/api/partners/message.js`<br>- `pages/api/partners/conversations/[id]/message.js` |
| `sendFormEmail` | Custom HTML (no template) | Form Submission | N/A | N/A | sales@develloinc.com | `pages/api/contact/send.js`<br>`pages/api/custom-builds/submit.js`<br>`pages/api/software-service/submit.js`<br>`pages/api/leads/submit.js`<br>`pages/api/business-consultation/submit.js`<br>`pages/api/admin/orders/[id]/status.js`<br>`pages/api/admin/orders/[id]/quote.js` |
| `sendPartnerNotificationEmail` | Custom HTML (no template) | Partner Approval/Rejection | N/A | N/A | Partner email | `pages/api/admin/partners/approve.js` |
| `sendOrderConfirmationEmail` | `getGlassyEmailTemplate` | Order Confirmed / Custom Order Confirmed | Blue (stock) / Green (custom) | 📦 / 🏭 | Customer | `pages/api/products/purchase.js`<br>`pages/api/webhooks/stripe.js` (payment_intent.succeeded, checkout.session.completed) |
| `sendOrderStatusUpdateEmail` | `getGlassyEmailTemplate` | Order Status Update | Blue (stock) / Green (custom) | 📦 / 🏭 | Customer | `pages/api/admin/orders/product-orders/[id]/update.js`<br>`pages/api/admin/orders/product-orders/[id]/status.js`<br>`pages/api/admin/orders/product-orders/[id]/send-update.js` |
| `sendShippingNotificationEmail` | `getGlassyEmailTemplate` | Your Order Has Shipped! | Blue (stock) / Green (custom) | 🚚 | Customer | `pages/api/admin/orders/product-orders/[id]/update.js` (when status = 'shipped')<br>`pages/api/admin/orders/product-orders/[id]/status.js` (when status = 'shipped')<br>`pages/api/admin/orders/product-orders/[id]/send-update.js` |
| `sendOrderTrackingEmail` | `getGlassyEmailTemplate` | Order Tracking Information | Blue (stock) / Green (custom) | 📦 | Customer | Not currently triggered (function exists but unused) |
| `sendRefundRequestNotificationEmail` | `getGlassyEmailTemplate` | New Refund Request | Orange | 💰 | Admin (sales@develloinc.com) | `pages/api/refunds/request.js` |
| `sendRefundStatusEmail` | `getGlassyEmailTemplate` | Refund Approved/Rejected/Processed | Green/Red/Green | ✅/❌ | Customer | `pages/api/admin/refunds/[id]/approve.js` |
| `sendOrderMessageEmail` | `getGlassyEmailTemplate` | New Order Message | Blue | 💬 | Customer/Admin (bidirectional) | `pages/api/orders/product-orders/[id]/message.js`<br>`pages/api/products/orders/[id]/message.js`<br>`pages/api/admin/orders/product-orders/[id]/message.js` |
| `sendAdminOrderNotification` | `getGlassyEmailTemplate` | New Order Received | Green | 🛒 | Admin (sales@develloinc.com) | `pages/api/products/purchase.js`<br>`pages/api/webhooks/stripe.js` (payment_intent.succeeded, checkout.session.completed) |
| `sendAdminInquiryNotification` | `getGlassyEmailTemplate` | User Inquiry / User Inquiry - Order #XXX | Blue | 💬 | Admin (sales@develloinc.com) | `pages/api/orders/product-orders/[id]/message.js`<br>`pages/api/products/orders/[id]/message.js` |

## Template System

### Base Template
- **Function**: `getGlassyEmailTemplate`
- **Location**: `lib/emailService.js` (lines 142-327)
- **Features**:
  - Glassmorphism design with backdrop blur
  - Responsive layout
  - Color schemes: blue, orange, green, purple, yellow
  - Customizable icon and title

### Color Schemes Available
- **Blue**: Primary color `#3b82f6` (default for stock orders)
- **Green**: Primary color `#10b981` (custom orders, messages)
- **Orange**: Primary color `#f97316` (refund requests)
- **Purple**: Primary color `#8b5cf6`
- **Yellow**: Primary color `#eab308`

## Trigger Flow Summary

### Message Notifications
1. User/Partner sends message via conversation API
2. `notifyNewMessage()` in `lib/messageNotificationHelper.js` is called
3. Checks if recipient has email notifications enabled
4. Calls `sendMessageNotification()` with appropriate parameters

### Order Flow
1. **Purchase**: `pages/api/products/purchase.js` → `sendOrderConfirmationEmail()` + `sendAdminOrderNotification()`
2. **Stripe Webhook**: `pages/api/webhooks/stripe.js` → `sendOrderConfirmationEmail()` + `sendAdminOrderNotification()`
3. **Status Update**: Admin updates order → `sendOrderStatusUpdateEmail()` or `sendShippingNotificationEmail()`

### Form Submissions
- All form submissions use `sendFormEmail()` → goes to `sales@develloinc.com`
- Includes: contact forms, custom builds, software service requests, leads, business consultations

## Configuration

### Environment Variables Required
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@devello.us
FROM_NAME=Devello Inc
SALES_EMAIL=sales@develloinc.com
ADMIN_EMAIL=sales@develloinc.com
NEXT_PUBLIC_BASE_URL=https://develloinc.com
NEXT_PUBLIC_SITE_URL=https://develloinc.com
```

## Notes

1. **Message Notifications**: Require opt-in (`email_notifications_enabled` flag in UserProfile/Partner tables)
2. **Form Emails**: Always go to `sales@develloinc.com` (not customer)
3. **Order Emails**: Customer receives confirmation; admin receives notification
4. **Bidirectional Messages**: Order messages can be sent from admin to customer or vice versa
5. **Unused Function**: `sendOrderTrackingEmail()` exists but is not currently triggered anywhere
