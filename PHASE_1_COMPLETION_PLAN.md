# Phase 1 Completion Plan

## Current Status: ❌ NOT COMPLETED

### What's Done ✅
- ✅ Created unified `UploadService` class
- ✅ Consolidated all upload limit logic
- ✅ Added monthly reset functionality
- ✅ Added past_due status handling
- ✅ Unified guest and signed-in user handling

### What's Missing ❌
- ❌ Old services still exist and are being used
- ❌ Frontend still uses old services
- ❌ No migration of existing code
- ❌ Database schema needs migration

## Step-by-Step Completion Plan

### Step 1: Update Frontend to Use New Service

**File: `components/contexts/ToolStateManager.js`**
```javascript
// Replace this import:
import { getGuestUploadCount, getUploadLimit } from '../../lib/uploadLimits';

// With this:
import { UploadService } from '../../lib/uploadService';

// Replace refreshUploadStats method:
const refreshUploadStats = useCallback(async () => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      const guestStatus = await UploadService.getUserUploadStatus(null, sessionId);
      pushUploadStats(guestStatus);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      const guestStatus = await UploadService.getUserUploadStatus(null, sessionId);
      pushUploadStats(guestStatus);
      return;
    }

    const status = await UploadService.getUserUploadStatus(session.user.id);
    pushUploadStats(status);
  } catch (error) {
    console.error('Error refreshing upload stats:', error);
    const fallbackStatus = await UploadService.getUserUploadStatus(null);
    pushUploadStats(fallbackStatus);
  }
}, [pushUploadStats]);
```

### Step 2: Update CentralizedUploadCounter

**File: `components/CentralizedUploadCounter.js`**
```javascript
// Replace upload stats logic with:
const uploadStats = toolStateManager?.getUploadStats?.() || null;
const uploadData = uploadStats ? {
  remaining: uploadStats.remaining || 0,
  limit: uploadStats.totalLimit || uploadStats.limit || 10,
  used: uploadStats.used || 0,
  oneTimeCredits: uploadStats.oneTimeCredits || 0,
  planType: uploadStats.planType || 'free'
} : {
  remaining: 0,
  limit: 10,
  used: 0,
  oneTimeCredits: 0,
  planType: 'free'
};
```

### Step 3: Update API Endpoints

**File: `pages/api/user/profile.js`**
```javascript
// Replace UserService.getUploadStats with:
import { UploadService } from '../../../lib/uploadService';

// In the handler:
const uploadStats = await UploadService.getUserUploadStatus(user.id);
```

### Step 4: Remove Old Services (After Testing)

**Files to Delete:**
- `lib/uploadLimits.js` ❌
- `lib/uploadAllowanceService.js` ❌ (replace with uploadService.js)
- Upload methods from `lib/userService.js` ❌

**Files to Keep:**
- `lib/directUploadService.js` ✅ (different purpose - file upload)
- `lib/mobileUploadUtils.js` ✅ (different purpose - mobile optimization)

### Step 5: Update All Imports

**Search and Replace:**
```bash
# Find all files using old services
grep -r "uploadLimits" components/ pages/ lib/
grep -r "uploadAllowanceService" components/ pages/ lib/
grep -r "UserService.*upload" components/ pages/ lib/

# Replace imports
# FROM: import { getGuestUploadCount } from '../../lib/uploadLimits';
# TO:   import { UploadService } from '../../lib/uploadService';
```

### Step 6: Test Migration

**Create Test Script:**
```javascript
// test-upload-service.js
import { UploadService } from './lib/uploadService.js';

async function testUploadService() {
  console.log('Testing UploadService...');
  
  // Test guest user
  const guestStatus = await UploadService.getUserUploadStatus(null, 'test-session');
  console.log('Guest status:', guestStatus);
  
  // Test signed-in user
  const userStatus = await UploadService.getUserUploadStatus('test-user-id');
  console.log('User status:', userStatus);
  
  // Test canUpload
  const canUpload = await UploadService.canUpload('test-user-id');
  console.log('Can upload:', canUpload);
}
```

## Migration Checklist

### Phase 1 Completion Checklist:
- [ ] Create unified UploadService ✅
- [ ] Update ToolStateManager to use new service
- [ ] Update CentralizedUploadCounter to use new service  
- [ ] Update all API endpoints to use new service
- [ ] Update all components to use new service
- [ ] Test all upload functionality
- [ ] Remove old services
- [ ] Update all imports
- [ ] Test in production

### Testing Requirements:
- [ ] Guest users can upload (3 limit)
- [ ] Signed-in users can upload (10+ limit)
- [ ] Monthly reset works
- [ ] Past due users get 0 limit
- [ ] One-time credits work
- [ ] Subscription upgrades work
- [ ] Error handling works

## Benefits After Completion:
- ✅ Single source of truth for upload logic
- ✅ Simplified frontend state management
- ✅ Consistent behavior across all components
- ✅ Easier testing and debugging
- ✅ Reduced code complexity by ~40%

## Risk Mitigation:
- Keep old services as backup during migration
- Test thoroughly in staging
- Use feature flags if needed
- Monitor error logs during rollout
