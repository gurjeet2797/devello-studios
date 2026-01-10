# Email Notifications Setup Guide

## Overview

This system provides backend email notifications for users and partners when they receive new messages in conversations. The system uses **Nodemailer with SMTP** (not SendGrid) and requires opt-in from users/partners.

## Features

- ✅ Email notifications when users/partners receive new messages
- ✅ Opt-in/opt-out preferences for users and partners
- ✅ HTML email templates with conversation links
- ✅ Graceful failure (emails don't block message sending)
- ✅ SMTP-based email delivery (no SendGrid dependency)

## Database Schema Changes

### UserProfile Table
- Added `email_notifications_enabled` (Boolean, default: false)

### Partner Table
- Added `email_notifications_enabled` (Boolean, default: false)

## Environment Variables Required

Add these to your `.env` file (or Vercel environment variables):

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com          # Your SMTP server host
SMTP_PORT=587                     # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
SMTP_USER=your-email@gmail.com   # SMTP username/email
SMTP_PASSWORD=your-app-password   # SMTP password or app-specific password

# Email From Address
FROM_EMAIL=noreply@devello.us     # Email address to send from
FROM_NAME=Devello Inc          # Display name for sender

# Base URL (for email links)
NEXT_PUBLIC_BASE_URL=https://devello.us  # Your production URL
```

### Gmail Setup Example

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASSWORD`

### Other SMTP Providers

**SendGrid (SMTP):**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

## Database Migration

Run the migration SQL file:

```sql
-- Run this SQL in your database
ALTER TABLE "user_profiles" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "partners" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;
```

Or use the migration file:
```bash
# Connect to your database and run:
psql $DATABASE_URL -f prisma/migrations/manual_add_notification_preferences.sql
```

## API Endpoints

### Get User Notification Preferences
```
GET /api/user/notifications
Authorization: Bearer <token>

Response:
{
  "emailNotificationsEnabled": false
}
```

### Update User Notification Preferences
```
PUT /api/user/notifications
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "emailNotificationsEnabled": true
}

Response:
{
  "success": true,
  "emailNotificationsEnabled": true
}
```

### Get Partner Notification Preferences
```
GET /api/partners/notifications
Authorization: Bearer <token>

Response:
{
  "emailNotificationsEnabled": false
}
```

### Update Partner Notification Preferences
```
PUT /api/partners/notifications
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "emailNotificationsEnabled": true
}

Response:
{
  "success": true,
  "emailNotificationsEnabled": true
}
```

## How It Works

1. **Message Creation**: When a message is created via any message endpoint, the system checks:
   - If the recipient has email notifications enabled
   - If the sender is different from the recipient
   - If the recipient has a valid email address

2. **Email Sending**: If all conditions are met, an email notification is sent asynchronously (doesn't block the API response)

3. **Email Content**: The email includes:
   - Sender name and email
   - Message subject
   - Message preview (first 200 characters)
   - Link to view the conversation
   - Link to manage notification preferences

## Files Created/Modified

### New Files
- `lib/emailService.js` - Email service using Nodemailer
- `lib/messageNotificationHelper.js` - Helper to send notifications
- `pages/api/user/notifications.js` - User notification preferences API
- `pages/api/partners/notifications.js` - Partner notification preferences API
- `prisma/migrations/manual_add_notification_preferences.sql` - Database migration

### Modified Files
- `prisma/schema.prisma` - Added notification preferences fields
- `pages/api/conversations/[id]/message.js` - Added notification trigger
- `pages/api/conversations/[id]/message-stream.js` - Added notification trigger
- `pages/api/partners/reply.js` - Added notification trigger
- `pages/api/partners/message.js` - Added notification trigger
- `pages/api/partners/conversations/[id]/message.js` - Added notification trigger

## Testing

1. **Test SMTP Connection**:
```javascript
const { verifyConnection } = require('./lib/emailService');
const result = await verifyConnection();
console.log(result);
```

2. **Test Email Sending**:
```javascript
const { sendMessageNotification } = require('./lib/emailService');
await sendMessageNotification({
  recipientEmail: 'test@example.com',
  recipientName: 'Test User',
  senderName: 'Test Sender',
  senderEmail: 'sender@example.com',
  subject: 'Test Subject',
  messagePreview: 'This is a test message',
  conversationLink: '/client-portal?conversation=test123',
  isPartner: false
});
```

## Troubleshooting

### Emails Not Sending

1. **Check SMTP Configuration**: Verify all environment variables are set correctly
2. **Check Logs**: Look for `[EMAIL_SERVICE]` and `[MESSAGE_NOTIFICATION]` log entries
3. **Verify SMTP Connection**: Use the `verifyConnection()` function
4. **Check Notification Preferences**: Ensure users/partners have enabled notifications

### Common Issues

- **"SMTP not configured"**: Missing or incorrect environment variables
- **"Authentication failed"**: Wrong SMTP credentials
- **"Connection timeout"**: Firewall or network issues blocking SMTP port
- **Emails going to spam**: Configure SPF/DKIM records for your domain

## Security Notes

- Email notifications are opt-in only (default: disabled)
- SMTP credentials should be stored securely (use Vercel environment variables)
- Email sending failures don't affect message delivery
- All email links include authentication tokens

## Future Enhancements

- Email digest (batch notifications)
- Notification preferences per conversation
- Push notifications integration
- Email templates customization
- Notification history/logging

