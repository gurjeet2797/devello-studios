# Email Notification Testing Guide

## Quick Diagnostic Check

### 1. Check Email Diagnostics Endpoint

Visit or call:
```
GET /api/email-diagnostics
```

This will show:
- Environment variables status (without exposing passwords)
- SMTP transporter status
- Connection test results

**Example Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": {
    "smtpHost": "smtp.gmail.com",
    "smtpPort": "587",
    "smtpSecure": "false",
    "smtpUser": "not***",
    "smtpPasswordSet": true,
    "fromEmail": "notifications@devello.us",
    "fromName": "Devello Inc",
    "baseUrl": "https://devello.us"
  },
  "transporter": {
    "exists": true,
    "status": "configured"
  },
  "connection": {
    "success": true,
    "error": null
  }
}
```

### 2. Test Email Sending

**Via API:**
```bash
curl -X POST https://devello.us/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"action": "verify"}'

curl -X POST https://devello.us/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "testEmail": "your-email@example.com"}'
```

**Via Local Script:**
```bash
# Test connection only
node scripts/test-email-service.js

# Test connection + send test email
node scripts/test-email-service.js your-email@example.com
```

## Common Issues & Solutions

### Issue: "SMTP not configured"

**Symptoms:**
- `transporter.exists: false`
- `connection.success: false`
- Error: "SMTP credentials not configured"

**Solution:**
1. Check Vercel environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `FROM_EMAIL`
   - `FROM_NAME`

2. Ensure all variables are set correctly
3. Redeploy after adding variables

### Issue: "SMTP connection failed"

**Symptoms:**
- `transporter.exists: true`
- `connection.success: false`
- Error: "Invalid login" or "Connection timeout"

**Solutions:**

1. **Invalid Login:**
   - Verify `SMTP_USER` is correct email
   - Verify `SMTP_PASSWORD` is correct app password (not regular password)
   - For Gmail: Generate new app password at https://myaccount.google.com/apppasswords

2. **Connection Timeout:**
   - Check firewall settings
   - Verify port 587 is not blocked
   - Try port 465 with `SMTP_SECURE=true`

3. **Authentication Failed:**
   - Ensure 2FA is enabled on Gmail account
   - Use App Password, not regular password
   - Check if "Less secure app access" is needed (older accounts)

### Issue: "Email notifications disabled"

**Symptoms:**
- Logs show: "Partner email notifications disabled" or "User email notifications disabled"
- No email sent even though SMTP is configured

**Solution:**
1. User/Partner must enable notifications in their profile/dashboard
2. Check database:
   ```sql
   SELECT email_notifications_enabled FROM user_profiles WHERE user_id = 'xxx';
   SELECT email_notifications_enabled FROM partners WHERE id = 'xxx';
   ```

### Issue: "Guest user, skipping notification"

**Symptoms:**
- Logs show: "Guest user, skipping notification"
- No email sent for guest messages

**Solution:**
- This is expected behavior - guest users don't have email addresses
- Only authenticated users can receive email notifications

## Checking Logs

### Vercel Logs

1. Go to Vercel Dashboard → Your Project → Functions → View Logs
2. Filter by: `[EMAIL_SERVICE]` or `[MESSAGE_NOTIFICATION]`
3. Look for:
   - `[EMAIL_SERVICE] Message notification sent:` - Success
   - `[EMAIL_SERVICE] Error sending message notification:` - Failure
   - `[MESSAGE_NOTIFICATION] Starting notification process` - Notification triggered
   - `[MESSAGE_NOTIFICATION] Partner/User email notifications disabled` - Notifications off

### Local Development Logs

Check your terminal/console for:
- `[EMAIL_SERVICE]` prefixed logs
- `[MESSAGE_NOTIFICATION]` prefixed logs

## Testing Flow

1. **Verify SMTP Configuration:**
   ```bash
   curl https://devello.us/api/email-diagnostics
   ```

2. **Test SMTP Connection:**
   ```bash
   curl -X POST https://devello.us/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"action": "verify"}'
   ```

3. **Send Test Email:**
   ```bash
   curl -X POST https://devello.us/api/test-email \
     -H "Content-Type: application/json" \
     -d '{"action": "test", "testEmail": "your-email@example.com"}'
   ```

4. **Enable Notifications:**
   - User: Go to `/profile` → Toggle "Email Notifications"
   - Partner: Go to `/partners` → Toggle "Email Notifications"

5. **Send Test Message:**
   - Send a message through the portal
   - Check logs for `[MESSAGE_NOTIFICATION]` entries
   - Verify email received

## Debug Checklist

- [ ] SMTP environment variables set in Vercel
- [ ] SMTP connection verified (`/api/email-diagnostics`)
- [ ] Test email sent successfully (`/api/test-email`)
- [ ] User/Partner has notifications enabled in database
- [ ] User/Partner has notifications enabled in UI
- [ ] Message is being created successfully
- [ ] `notifyNewMessage` is being called
- [ ] Check Vercel function logs for errors

## Expected Log Flow

When a message is sent and notification should be sent:

```
[MESSAGE_NOTIFICATION] Starting notification process { messageId: '...', conversationId: '...', senderId: 'client' }
[MESSAGE_NOTIFICATION] Sending notification to partner { recipientEmail: '...', recipientName: '...', conversationId: '...' }
[EMAIL_SERVICE] Message notification sent: <message-id>
[MESSAGE_NOTIFICATION] Partner notification sent successfully { messageId: '...' }
```

If notifications are disabled:

```
[MESSAGE_NOTIFICATION] Starting notification process { messageId: '...', conversationId: '...', senderId: 'client' }
[MESSAGE_NOTIFICATION] Partner email notifications disabled, skipping { partnerId: '...', emailNotificationsEnabled: false }
```

