# Upload Allowance Logic Summary

## Upload Limit Tiers
```
┌─────────────┬─────────┬─────────────────────────────────┐
│ User Type   │ Limit   │ Description                     │
├─────────────┼─────────┼─────────────────────────────────┤
│ GUEST       │ 3       │ Not signed in                   │
│ FREE        │ 10      │ Signed in, no subscription      │
│ BASIC       │ 30      │ Basic subscription              │
│ PRO         │ 60      │ Pro subscription                │
└─────────────┴─────────┴─────────────────────────────────┘
```

## Upload Check Flow

### 1. Client-Side Check (Frontend)
```
User clicks Upload Button
         ↓
handleFileChange() in general-edit.js
         ↓
import { canUpload } from 'lib/uploadLimits.js'
         ↓
canUpload(user) checks:
  - getRemainingUploads(user) > 0
  - Uses UPLOAD_LIMITS.FREE: 50
         ↓
If canUpload = false → Show Payment Modal
If canUpload = true → Proceed with upload
```

### 2. Server-Side Check (API)
```
Upload API call (/api/upload/record.js)
         ↓
UserService.canUpload(userId)
         ↓
getUploadLimit(user) from uploadLimits.js
         ↓
Checks database + applies UPLOAD_LIMITS.FREE: 50
         ↓
If uploadCount < uploadLimit → Allow upload
If uploadCount >= uploadLimit → Return 403 error
```

## Upload Limit Calculation Logic

### getUploadLimit(user) Function
```
1. If no user → Return GUEST limit (1)
2. Set baseLimit = UPLOAD_LIMITS.FREE (50)
3. Check user.subscription.plan_type:
   - 'pro' → baseLimit = UPLOAD_LIMITS.PRO (50)
   - 'enterprise' → baseLimit = UPLOAD_LIMITS.ENTERPRISE (200)
   - default → baseLimit = UPLOAD_LIMITS.FREE (50)
4. Add one-time purchase credits: baseLimit + oneTimeCredits
5. Return final limit
```

### getRemainingUploads(user) Function
```
1. Get total limit from getUploadLimit(user)
2. Get used uploads from localStorage (guest) or database (user)
3. Return Math.max(0, totalLimit - used)
```

## Database Schema
```
UserProfile Table:
- upload_count: Int (tracks used uploads)
- upload_limit: Int @default(50) (free tier limit)

Subscription Table:
- plan_type: String ('free', 'pro', 'enterprise')
- upload_limit: Int @default(50)
- status: String ('active', 'inactive', etc.)

OneTimePurchase Table:
- uploads_granted: Int (credits purchased)
- uploads_used: Int (credits consumed)
- status: String ('completed', 'pending', etc.)
```

## Key Files & Functions

### lib/uploadLimits.js
- `UPLOAD_LIMITS` object (defines tier limits)
- `getUploadLimit(user)` - calculates effective limit
- `getRemainingUploads(user)` - calculates remaining uploads
- `canUpload(user)` - boolean check for upload permission

### lib/userService.js
- `UserService.canUpload(userId)` - server-side upload check
- `UserService.getUploadStats(userId)` - gets upload statistics
- `UserService.recordUpload()` - records successful uploads

### pages/general-edit.js
- `handleFileChange()` - client-side upload button handler
- Calls `canUpload(user)` before proceeding
- Shows PaymentOptionsModal if limit reached

## Upload Tracking

### Guest Users (Not Signed In)
- Uses localStorage: 'devello_guest_uploads'
- Weekly reset system
- Limit: 1 upload

### Signed-In Users
- Uses database: UserProfile.upload_count
- No automatic reset
- Limit: 50 (free), 50 (pro), 200 (enterprise)
- Plus one-time purchase credits

## Payment Modal Triggers
```
Upload Button Click
         ↓
canUpload(user) = false
         ↓
Show PaymentOptionsModal with:
- "Buy 1 Upload" button (one-time purchase)
- "Subscribe" button (subscription modal)
```

## Recent Changes Made
1. ✅ Updated UPLOAD_LIMITS.FREE from 5 to 50
2. ✅ Updated database schema defaults from 10 to 50
3. ✅ Updated UserService to use uploadLimits.js logic
4. ✅ Fixed client/server consistency issues
5. ✅ Re-enabled PaymentOptionsModal for upload limits
