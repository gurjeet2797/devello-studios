# Message Notification System Activation Plan

## Current State Review

### ✅ What's Already Built

1. **Database Schema**
   - `user_profiles.email_notifications_enabled` (Boolean, default: false)
   - `partners.email_notifications_enabled` (Boolean, default: false)

2. **Backend Infrastructure**
   - `lib/emailService.js` - SMTP email service using Nodemailer
   - `lib/messageNotificationHelper.js` - Notification logic with preference checks
   - API endpoints for managing preferences:
     - `GET/PUT /api/user/notifications`
     - `GET/PUT /api/partners/notifications`

3. **Notification Integration**
   - ✅ `pages/api/conversations/[id]/message.js` - Client messages
   - ✅ `pages/api/conversations/[id]/message-stream.js` - Streaming messages
   - ✅ `pages/api/partners/conversations/[id]/message.js` - Partner replies
   - ✅ `pages/api/partners/message.js` - Initial partner messages
   - ✅ `pages/api/partners/reply.js` - Partner replies
   - ❌ `pages/api/conversations/[id]/request-update.js` - **BUG: Wrong function signature**

### ❌ What's Missing

1. **UI Components**
   - No notification toggle in user profile page (`pages/profile.js`)
   - No notification toggle in partner dashboard (`components/PartnerDashboard.js`)

2. **Configuration**
   - SMTP environment variables need to be verified/set
   - Database migration may need to be run

3. **Bug Fixes**
   - `request-update.js` calls `notifyNewMessage` with wrong signature

---

## Activation Steps

### Step 1: Fix Bug in request-update.js ✅ COMPLETED

**File:** `pages/api/conversations/[id]/request-update.js`

**Issue:** Lines 89 and 93 called `notifyNewMessage` with wrong signature (3 params instead of object)

**Fix:** Updated to use correct signature:
```javascript
notifyNewMessage({ message: updateMessage, conversation })
```

### Step 2: Verify Database Migration

**Check if migration has been run:**
```sql
-- Check if columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'email_notifications_enabled';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'partners' 
  AND column_name = 'email_notifications_enabled';
```

**If not run, execute:**
```sql
ALTER TABLE "user_profiles" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "partners" 
ADD COLUMN IF NOT EXISTS "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false;
```

### Step 3: Verify SMTP Configuration ✅ GMAIL WORKSPACE SETUP GUIDE CREATED

**Required Environment Variables (in Vercel):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-workspace-email@yourdomain.com
SMTP_PASSWORD=your-app-password (16-char from Google)
FROM_EMAIL=your-workspace-email@yourdomain.com
FROM_NAME=Devello Inc
NEXT_PUBLIC_BASE_URL=https://devello.us
```

**📋 See `GMAIL_WORKSPACE_SMTP_SETUP.md` for detailed step-by-step instructions:**
1. Enable 2FA on Google Account
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Set environment variables in Vercel
4. Test connection

**Test SMTP Connection:**
Create a test script or use the `verifyConnection()` function from `lib/emailService.js`

### Step 4: Add UI Toggle to User Profile ✅ COMPLETED

**File:** `pages/profile.js`

**Added notification preferences section:**
- ✅ Added state for `emailNotificationsEnabled` and `notificationLoading`
- ✅ Fetch preferences in `fetchUserData()` function
- ✅ Added toggle switch UI component with proper styling
- ✅ Implemented `handleNotificationToggle()` function to save preferences via API

**Location:** Added after "Profile Information" section, within the same card

### Step 5: Add UI Toggle to Partner Dashboard ✅ COMPLETED

**File:** `components/PartnerDashboard.js`

**Added notification preferences section:**
- ✅ Added state for `emailNotificationsEnabled` and `notificationLoading`
- ✅ Added `useEffect` hook to fetch preferences on component mount
- ✅ Added toggle switch UI component with proper styling matching dashboard theme
- ✅ Implemented `handleNotificationToggle()` function to save preferences via API

**Location:** Added after "Connect Google Calendar" section as a separate card

### Step 6: Test End-to-End

**Test Scenarios:**
1. User enables notifications → Send test message → Verify email received
2. Partner enables notifications → Send test message → Verify email received
3. User disables notifications → Send message → Verify no email sent
4. Partner disables notifications → Send message → Verify no email sent
5. Guest user sends message → Verify partner gets notification (if enabled)
6. Authenticated user sends message → Verify partner gets notification (if enabled)

---

## Implementation Priority

1. **Critical (Do First):**
   - Fix bug in `request-update.js`
   - Verify database migration
   - Verify SMTP configuration

2. **High Priority:**
   - Add UI toggle to user profile
   - Add UI toggle to partner dashboard

3. **Testing:**
   - End-to-end testing
   - Verify email delivery
   - Test opt-in/opt-out flow

---

## Files Modified

1. ✅ `pages/api/conversations/[id]/request-update.js` - Fixed notification call (changed from wrong signature to correct object format)
2. ✅ `pages/profile.js` - Added notification preferences UI with toggle switch
3. ✅ `components/PartnerDashboard.js` - Added notification preferences UI with toggle switch

---

## Testing Checklist

- [ ] Database columns exist
- [ ] SMTP configuration works
- [ ] User can toggle notifications in profile
- [ ] Partner can toggle notifications in dashboard
- [ ] Email sent when user enables and receives message
- [ ] Email sent when partner enables and receives message
- [ ] No email sent when notifications disabled
- [ ] Email template renders correctly
- [ ] Email links work correctly
- [ ] Notification preferences persist after page refresh

---

## Notes

- Notifications are **opt-in only** (default: disabled)
- Email failures don't block message sending (async)
- Guest users cannot receive notifications (no email)
- All notification checks happen in `messageNotificationHelper.js`

