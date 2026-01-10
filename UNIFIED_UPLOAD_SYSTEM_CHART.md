# Unified Upload Counter System - Complete Flow Chart

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED UPLOAD SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   All Pages     │    │ UnifiedUpload   │    │ UnifiedUpload   │
│                 │    │ Counter         │    │ Context         │
│ • DevelloStudio │───▶│                 │───▶│                 │
│ • GeneralEdit   │    │ (UI Component)  │    │ (State Manager) │
│ • AssistedEdit  │    │                 │    │                 │
│ • Profile       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ UnifiedUpload   │
                                              │ Service         │
                                              │                 │
                                              │ (API Layer)     │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │ Database APIs   │
                                              │                 │
                                              │ • /api/user/    │
                                              │   profile       │
                                              │ • /api/upload/  │
                                              │   record        │
                                              │ • /api/upload/  │
                                              │   mark-processed│
                                              └─────────────────┘
```

## Data Flow

### 1. Initial Load
```
User Opens Page
       │
       ▼
UnifiedUploadCounter Mounts
       │
       ▼
UnifiedUploadContext.fetchUploadStats()
       │
       ▼
UnifiedUploadService.getUploadStats(user)
       │
       ▼
┌─────────────────────────────────────┐
│ Check User Type:                    │
│ • user = null → Guest (3 uploads)   │
│ • user = object → Signed-in         │
│   → Call /api/user/profile          │
│   → Get database limits             │
└─────────────────────────────────────┘
       │
       ▼
Update Counter Display
```

### 2. Upload Process
```
User Uploads Image
       │
       ▼
Image Upload Hook
       │
       ▼
/api/upload/record (Database Updated)
       │
       ▼
Dispatch 'uploadRecorded' Event
       │
       ▼
UnifiedUploadContext Listens
       │
       ▼
fetchUploadStats() (Force Refresh)
       │
       ▼
Counter Updates Immediately
```

### 3. Processing Complete
```
Image Processing Finishes
       │
       ▼
markUploadAsProcessed()
       │
       ▼
/api/upload/mark-processed
       │
       ▼
Dispatch 'uploadProcessed' Event
       │
       ▼
UnifiedUploadContext Listens
       │
       ▼
fetchUploadStats() (Force Refresh)
       │
       ▼
Counter Updates
```

## Current User Limits

### Database Limits (from uploadAllowanceService.js)
```javascript
UPLOAD_LIMITS = {
  GUEST: 3,      // Trial users (localStorage)
  FREE: 10,      // Free tier (signed-in users)
  BASIC: 30,     // Basic subscription
  PRO: 60        // Pro subscription
}
```

### User Types & Limits
1. **Guest Users** (not signed in)
   - Limit: 3 uploads
   - Storage: localStorage
   - Reset: Never

2. **Free Users** (signed in, no subscription)
   - Limit: 10 uploads
   - Storage: Database
   - Reset: Monthly

3. **Basic Subscribers**
   - Limit: 30 uploads
   - Storage: Database
   - Reset: Monthly

4. **Pro Subscribers**
   - Limit: 60 uploads
   - Storage: Database
   - Reset: Monthly

## Event System

### Events Dispatched
- `uploadRecorded` - When upload is recorded in database
- `uploadProcessed` - When processing completes
- `uploadCompleted` - Legacy event (still supported)

### Event Listeners
- UnifiedUploadContext listens for all events
- 500ms debounce to prevent rapid API calls
- Force refresh on events (bypasses 30-second cache)

## Caching Strategy

### Cache Duration
- **Regular polling**: 2 minutes
- **Event-triggered**: Force refresh (bypasses cache)
- **API cache**: 30 seconds (prevents excessive calls)

### Cache Invalidation
- User authentication changes
- Upload events received
- Manual refresh calls

## API Endpoints

### Primary Endpoint
- **GET /api/user/profile** - Get user upload stats
  - Returns: uploadCount, uploadLimit, remaining, planType
  - Auth: Bearer token required

### Upload Tracking
- **POST /api/upload/record** - Record new upload
  - Updates: Database upload count
  - Returns: Updated stats

- **POST /api/upload/mark-processed** - Mark processing complete
  - Updates: Database processing status
  - Returns: Updated stats

## Error Handling

### API Failures
- **Guest users**: Use localStorage fallback
- **Signed-in users**: Use free user stats (10 uploads)
- **Network errors**: Retry with exponential backoff

### Fallback Stats
```javascript
// For signed-in users when API fails
{
  uploadCount: 0,
  uploadLimit: 10,
  remaining: 10,
  planType: 'free',
  subscriptionStatus: 'inactive'
}
```

## Performance Optimizations

1. **30-second API cache** - Prevents redundant calls
2. **500ms event debounce** - Prevents rapid-fire updates
3. **2-minute polling** - Reduced from 30 seconds
4. **Development-only logging** - Clean production logs
5. **Single source of truth** - No conflicting systems
