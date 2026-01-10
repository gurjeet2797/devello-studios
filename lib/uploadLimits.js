// Upload limits management utility
export const uploadLimits = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
  compressionQuality: 0.85,
  maxDimensions: 1920
};

const UPLOAD_LIMITS = {
  GUEST: 5, // Guest users - 5 sessions only
  FREE: 5, // Free tier for signed-in users
  BASIC: 30, // Basic subscription
  PRO: 60 // Pro subscription
};

const STORAGE_KEYS = {
  GUEST_UPLOADS: 'devello_guest_uploads',
  USER_UPLOADS: 'devello_user_uploads',
  WEEKLY_RESET: 'devello_weekly_reset'
};

// Get current week number for reset tracking
const getCurrentWeek = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

// Check if weekly reset is needed
const checkWeeklyReset = () => {
  if (typeof window === 'undefined') return false;
  
  const currentWeek = getCurrentWeek();
  const lastResetWeek = localStorage.getItem(STORAGE_KEYS.WEEKLY_RESET);
  
  if (lastResetWeek !== currentWeek.toString()) {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_RESET, currentWeek.toString());
    return true;
  }
  return false;
};

// Get upload count for guest users
export const getGuestUploadCount = () => {
  if (typeof window === 'undefined') return 0;
  
  const uploads = localStorage.getItem(STORAGE_KEYS.GUEST_UPLOADS);
  return uploads ? parseInt(uploads, 10) : 0;
};

// Get guest upload limit (can be increased with code)
export const getGuestUploadLimit = () => {
  if (typeof window === 'undefined') return 5;
  
  const limit = localStorage.getItem('devello_guest_limit');
  return limit ? parseInt(limit, 10) : 5; // Default 5, can be increased to 10, 15, etc.
};

// Increment guest upload count
export const incrementGuestUploads = () => {
  if (typeof window === 'undefined') return 0;
  
  const current = getGuestUploadCount();
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEYS.GUEST_UPLOADS, newCount.toString());
  return newCount;
};

// Get upload count for signed-in users
export const getUserUploadCount = (userId) => {
  if (typeof window === 'undefined') return 0;
  
  // Check if weekly reset is needed
  if (checkWeeklyReset()) {
    // Reset all user uploads for the new week
    localStorage.removeItem(STORAGE_KEYS.USER_UPLOADS);
    return 0;
  }
  
  const uploads = localStorage.getItem(STORAGE_KEYS.USER_UPLOADS);
  if (!uploads) return 0;
  
  try {
    const userUploads = JSON.parse(uploads);
    return userUploads[userId] || 0;
  } catch {
    return 0;
  }
};

// Increment user upload count
export const incrementUserUploads = (userId) => {
  if (typeof window === 'undefined') return 0;
  
  const uploads = localStorage.getItem(STORAGE_KEYS.USER_UPLOADS);
  let userUploads = {};
  
  try {
    userUploads = uploads ? JSON.parse(uploads) : {};
  } catch {
    userUploads = {};
  }
  
  const current = userUploads[userId] || 0;
  const newCount = current + 1;
  userUploads[userId] = newCount;
  
  localStorage.setItem(STORAGE_KEYS.USER_UPLOADS, JSON.stringify(userUploads));
  return newCount;
};

// Get remaining uploads for a user
export const getRemainingUploads = async (user, sessionId = null) => {
  if (!user) {
    // Guest user - check for purchases first
    if (sessionId) {
      try {
        const response = await fetch('/api/guest/upload-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
        
        if (response.ok) {
          const stats = await response.json();
          return stats.remaining;
        }
      } catch (error) {
        console.warn('Failed to get guest upload stats:', error);
      }
    }
    
    // Fallback to localStorage
    const used = getGuestUploadCount();
    return Math.max(0, UPLOAD_LIMITS.GUEST - used);
  } else {
    // Signed-in user - use subscription-based limits + one-time purchase credits
    const used = getUserUploadCount(user.id);
    const limit = getUploadLimit(user);
    
    // Add one-time purchase credits if available
    const oneTimeCredits = user.oneTimeUploadsAvailable || 0;
    const totalLimit = limit + oneTimeCredits;
    
    return Math.max(0, totalLimit - used);
  }
};

// Check if user can upload
export const canUpload = async (user, sessionId = null) => {
  const remaining = await getRemainingUploads(user, sessionId);
  return remaining > 0;
};

// Record an upload
export const recordUpload = async (user, sessionId = null) => {
  if (!user) {
    // For guest users, try to record on server first
    if (sessionId) {
      try {
        const response = await fetch('/api/guest/record-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            uploadData: {
              fileName: 'test-upload.jpg',
              fileSize: 1024,
              fileType: 'image/jpeg',
              uploadType: 'test'
            }
          })
        });
        
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.warn('Failed to record guest upload on server:', error);
      }
    }
    
    // Fallback to localStorage
    return incrementGuestUploads();
  } else {
    return incrementUserUploads(user.id);
  }
};

// Get upload limit for display
export const getUploadLimit = (user) => {
  if (!user) {
    return UPLOAD_LIMITS.GUEST;
  }
  
  let baseLimit = UPLOAD_LIMITS.FREE;
  
  // Check if user has subscription data
  if (user.subscription) {
    switch (user.subscription.plan_type) {
      case 'pro':
        baseLimit = UPLOAD_LIMITS.PRO;
        break;
      case 'basic':
        baseLimit = UPLOAD_LIMITS.BASIC;
        break;
      default:
        baseLimit = UPLOAD_LIMITS.FREE;
    }
  }
  
  // Add one-time purchase credits if available
  const oneTimeCredits = user.oneTimeUploadsAvailable || 0;
  return baseLimit + oneTimeCredits;
};

// Get upload limit message
export const getUploadLimitMessage = async (user, sessionId = null) => {
  const remaining = await getRemainingUploads(user, sessionId);
  const limit = getUploadLimit(user);
  
  if (!user) {
    if (remaining === 0) {
      return "You've used your free trial. Sign up to unlock 5 free uploads!";
    }
    return `Try our tool with ${remaining} free image${remaining === 1 ? '' : 's'}. Sign up to unlock 5 free uploads!`;
  } else {
    if (remaining === 0) {
      return "You've reached your upload limit. Upgrade for more uploads!";
    }
    return `${remaining} of ${limit} uploads remaining`;
  }
};

// Reset all upload counts (for testing or admin purposes)
export const resetAllUploads = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.GUEST_UPLOADS);
  localStorage.removeItem(STORAGE_KEYS.USER_UPLOADS);
  localStorage.removeItem(STORAGE_KEYS.WEEKLY_RESET);
};
