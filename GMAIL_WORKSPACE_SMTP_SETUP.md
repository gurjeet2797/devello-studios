# Gmail Workspace SMTP Setup Guide

## Step-by-Step Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA (required for App Passwords)

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate: **Security** → **2-Step Verification** → **App passwords**
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter a name like "Devello Inc Notifications"
5. Click **Generate**
6. **Copy the 16-character password** (you won't see it again!)
   - Format: `xxxx xxxx xxxx xxxx` (remove spaces when using)

### Step 3: Set Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-workspace-email@yourdomain.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
FROM_EMAIL=your-workspace-email@yourdomain.com
FROM_NAME=Devello Inc
NEXT_PUBLIC_BASE_URL=https://devello.us
```

**Important Notes:**
- `SMTP_USER`: Your full Gmail Workspace email address (e.g., `notifications@devello.us`)
- `SMTP_PASSWORD`: The 16-character app password from Step 2 (no spaces)
- `FROM_EMAIL`: Should match your `SMTP_USER` or be a verified sender in your workspace
- `FROM_NAME`: Display name that appears in recipient's inbox

### Step 4: Verify Setup

You can test the SMTP connection by creating a simple test script or checking logs after sending a test message.

**Test via API (after deployment):**
```javascript
// Create a test file: pages/api/test-email.js
import { verifyConnection } from '../../lib/emailService';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const result = await verifyConnection();
  return res.status(200).json(result);
}
```

Or check your Vercel function logs after a message is sent - you should see:
```
[EMAIL_SERVICE] Message notification sent: <message-id>
```

### Step 5: Gmail Workspace Limits

**Daily Limits:**
- **Free tier**: 500 emails/day
- **Business Starter**: 2,000 emails/day
- **Business Standard**: 2,000 emails/day
- **Business Plus**: 2,000 emails/day

**Rate Limits:**
- Max 100 recipients per message
- Max 2,000 recipients per day (free tier)

For your notification system, this should be plenty unless you have thousands of users.

### Troubleshooting

**"Invalid login credentials"**
- Double-check the app password (no spaces)
- Ensure 2FA is enabled
- Verify email address is correct

**"Connection timeout"**
- Check firewall settings
- Verify port 587 is not blocked
- Try port 465 with `SMTP_SECURE=true`

**"Daily sending quota exceeded"**
- You've hit the 500/day limit
- Wait 24 hours or upgrade workspace plan
- Consider switching to AWS SES for higher volume

**Emails going to spam:**
- Set up SPF record: `v=spf1 include:_spf.google.com ~all`
- Set up DKIM in Google Workspace admin
- Use a consistent FROM_EMAIL address

### Security Best Practices

1. **Never commit app passwords to git** - Always use environment variables
2. **Use a dedicated email** - Create `notifications@yourdomain.com` instead of your personal email
3. **Rotate app passwords** - Change them periodically
4. **Monitor usage** - Check Google Workspace admin for unusual activity

### Alternative: Use a Dedicated Notification Email

If you want to use a specific email like `notifications@devello.us`:

1. Create the email alias/user in Google Workspace Admin
2. Generate app password for that account
3. Use that email for `SMTP_USER` and `FROM_EMAIL`

This keeps notification emails separate from your personal account.

---

## Quick Reference

**SMTP Settings:**
- Host: `smtp.gmail.com`
- Port: `587` (TLS) or `465` (SSL)
- Security: `false` for port 587, `true` for port 465
- Auth: Required (email + app password)

**Environment Variables Checklist:**
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_SECURE=false`
- [ ] `SMTP_USER=your-email@yourdomain.com`
- [ ] `SMTP_PASSWORD=16-char-app-password`
- [ ] `FROM_EMAIL=your-email@yourdomain.com`
- [ ] `FROM_NAME=Devello Inc`
- [ ] `NEXT_PUBLIC_BASE_URL=https://devello.us`

Once these are set in Vercel, redeploy your app and the email notifications will work!

