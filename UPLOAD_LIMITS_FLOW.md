# Upload Limits Flow - Guest Users & Signed-In Users

## Overview

This document explains the upload limit system for guest users and signed-in users, including how limits are calculated, tracked, and reset.

## Upload Limit Tiers

| User Type | Upload Limit | Storage | Reset Period |
|-----------|-------------|---------|--------------|
| **Guest** | 3 uploads | localStorage | No automatic reset |
| **Free** | 5 uploads | Database | Monthly reset |
| **Basic** | 30 uploads | Database | Monthly reset |
| **Pro** | 60 uploads | Database | Monthly reset |

## Guest User Flow

### Initial State
```
User visits site → No account → Guest user
```

### Upload Limit Tracking
- **Storage**: Browser localStorage (`devello_guest_uploads`)
- **Initial Value**: 0
- **Limit**: 3 uploads
- **Calculation**: `remaining = 3 - usedCount`

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Guest User Flow                      │
└─────────────────────────────────────────────────────────┘

User Action: Upload Image
         ↓
Check localStorage count
         ↓
    ┌────────┐
    │ Used?  │
    └───┬────┘
        │
    Yes │ No
        │
        ↓
  ┌─────────┐
  │ < 3?    │
  └───┬─────┘
      │
  Yes │ No
      │
      ↓              ↓
  Allow Upload    Block Upload
      │              │
      ↓              ↓
  Increment      Show Auth Modal
  localStorage       │
      │              ↓
      │          "Sign in to access
      │           5 more uploads"
      │
      ↓
  Record Upload
  (localStorage)
```

### Code Location
- Guest upload tracking: `lib/uploadLimits.js`
- Guest session service: `lib/guestSessionService.js`
- Storage key: `devello_guest_uploads`

### Guest User States

| Uploads Used | Remaining | Status | Action Available |
|-------------|-----------|--------|------------------|
| 0 | 3 | ✅ Can upload | Upload allowed |
| 1 | 2 | ✅ Can upload | Upload allowed |
| 2 | 1 | ✅ Can upload | Upload allowed |
| 3 | 0 | ❌ Limit reached | Sign in required |

## Signed-In User Flow

### Initial State
```
User signs in → Account created → Free tier (5 uploads)
```

### Upload Limit Tracking
- **Storage**: Database (PostgreSQL)
- **Tables**: `user_profiles.upload_count`, `user_profiles.upload_limit`
- **Initial Value**: 0 used, 5 limit (free tier)
- **Calculation**: `remaining = upload_limit - upload_count + oneTimeCredits`

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                Signed-In User Flow                      │
└─────────────────────────────────────────────────────────┘

User Action: Upload Image
         ↓
Check user authentication
         ↓
Fetch from database:
  - upload_count
  - upload_limit (based on plan)
  - one_time_purchases (credits)
         ↓
Check monthly reset needed
         ↓
    ┌─────────┐
    │ Reset?  │ → Yes → Reset upload_count to 0
    └────┬────┘
         │ No
         ↓
Calculate remaining:
  baseLimit + creditsGranted - upload_count - creditsUsed
         ↓
    ┌─────────┐
    │ > 0?    │
    └───┬─────┘
        │
    Yes │ No
        │
        ↓              ↓
  Allow Upload    Block Upload
        │              │
        ↓              ↓
  Record Upload   Show Upgrade Modal
  in database         │
        │              ↓
        │          "Upgrade plan for
        │           more uploads"
        ↓
  Consume allowance:
  - Try one-time credits first
  - Then use base allowance
```

### Free User States

| Uploads Used | Remaining | Status | Action Available |
|-------------|-----------|--------|------------------|
| 0 | 5 | ✅ Can upload | Upload allowed |
| 1 | 4 | ✅ Can upload | Upload allowed |
| 2 | 3 | ✅ Can upload | Upload allowed |
| 3 | 2 | ✅ Can upload | Upload allowed |
| 4 | 1 | ✅ Can upload | Upload allowed |
| 5 | 0 | ❌ Limit reached | Upgrade required |

### Monthly Reset Logic

- **Reset Trigger**: First day of new month
- **Reset Action**: 
  - `upload_count` → 0
  - `last_monthly_reset` → current date
  - One-time credits expire (reset to 0)
- **Implementation**: `lib/uploadService.js` → `checkAndPerformMonthlyReset()`

## Plan Comparison

### Free Plan
- **Base Limit**: 5 uploads/month
- **One-time Credits**: Can be added via purchases
- **Reset**: Monthly
- **Storage**: Database

### Basic Plan
- **Total Limit**: 30 uploads/month (5 free + 25 basic)
- **Breakdown**: 
  - Free tier: 5 uploads
  - Basic subscription: +25 uploads
  - Total: 30 uploads
- **Reset**: Monthly
- **Storage**: Database

### Pro Plan
- **Total Limit**: 60 uploads/month (5 free + 55 pro)
- **Breakdown**:
  - Free tier: 5 uploads
  - Pro subscription: +55 uploads
  - Total: 60 uploads
- **Reset**: Monthly
- **Storage**: Database

## Session Manager Calculation

For **paid plans** (Basic & Pro), the system adds the free tier limit (5) to the remaining count calculation:

```javascript
// For paid plans, add 5 to remaining to account for free tier uploads
// Only add 5 if user hasn't exceeded their base limit
let remaining = Math.max(0, totalLimit - totalUsed);
if (planType !== 'free' && planType !== 'guest' && baseUsed <= baseLimit) {
  remaining = remaining + 5;
}
```

This ensures paid users get their full allocation including the free tier portion.

## Key Files

### Upload Limit Constants
- `lib/uploadLimits.js` - Client-side limits
- `lib/uploadService.js` - Server-side limits
- `lib/uploadAllowanceService.js` - Allowance calculation
- `lib/uploadStats.js` - Stats management

### Guest User Management
- `lib/guestSessionService.js` - Server-side guest tracking
- `lib/uploadLimits.js` - Client-side guest tracking (localStorage)

### Signed-In User Management
- `lib/userService.js` - User profile management
- `lib/uploadAllowanceService.js` - Allowance calculation
- `pages/api/user/profile.js` - Profile API endpoint

## Database Schema

### user_profiles table
```sql
upload_count INT DEFAULT 0
upload_limit INT DEFAULT 5  -- Free tier limit
last_monthly_reset TIMESTAMP
```

### subscriptions table
```sql
plan_type ENUM('free', 'basic', 'pro')
upload_limit INT DEFAULT 5  -- Free tier limit
status ENUM('active', 'canceled', 'past_due', 'inactive')
```

## Edge Cases

### Guest to Signed-In Transition
1. Guest uploads tracked in localStorage
2. User signs in
3. Guest uploads don't transfer
4. User starts fresh with 5 free uploads (if free tier)

### Subscription Cancellation
1. Subscription canceled → Plan type remains until period end
2. After period end → Reset to free tier (5 uploads)
3. Upload limit updated in database

### Past Due Status
- Users with `past_due` status get 0 uploads
- Must resolve payment to restore access

### Monthly Reset Timing
- Resets on first request of new month
- Checks: `currentMonth !== lastResetMonth`
- Updates `last_monthly_reset` timestamp

## Summary Table

| Scenario | Guest User | Free User | Basic User | Pro User |
|----------|-----------|-----------|------------|----------|
| **Limit** | 3 | 5 | 30 | 60 |
| **Storage** | localStorage | Database | Database | Database |
| **Reset** | None | Monthly | Monthly | Monthly |
| **Credits** | No | Yes | Yes | Yes |
| **Tracking** | Client-side | Server-side | Server-side | Server-side |

