// Centralized Upload Stats Management
// Single source of truth for all upload allowance and counter logic

import { getSupabase } from './supabaseClient';
import { UploadAllowanceService } from './uploadAllowanceService';
import { getGuestUploadCount } from './uploadLimits';
import { GuestSessionService } from './guestSessionService';
import { isAdminEmail } from './adminAuth';

// Upload limits constants
export const UPLOAD_LIMITS = {
  GUEST: 5,      // Guest users (localStorage) - 5 sessions only
  FREE: 5,      // Free tier
  BASIC: 30,     // Basic subscription
  PRO: 60        // Pro subscription
};

// Local storage keys for guest users
const STORAGE_KEYS = {
  GUEST_UPLOADS: 'devello_guest_uploads',
  GUEST_SESSION: 'devello_guest_session'
};

// Global state for upload stats
let currentUploadStats = null;
let isLoading = false;
let lastFetchTime = null;
const CACHE_DURATION = 30000; // 30 seconds cache

// Event listeners for stats updates
const eventListeners = new Set();

/**
 * Create guest upload stats from localStorage or device session
 * Always shows max 5/5, limit never exceeds 5
 */
function createGuestUploadStats() {
  // Limit is always 5 (never more)
  const limit = 5;
  const usedCount = getGuestUploadCount();
  const used = Math.max(0, usedCount);
  const remaining = Math.max(0, limit - used);

  return {
    uploadCount: used,
    uploadLimit: limit,
    remaining,
    planType: 'guest',
    subscriptionStatus: 'none',
    baseLimit: limit,
    baseUsed: used,
    oneTimeCredits: 0,
    totalCreditsGranted: 0,
    creditsUsed: 0,
    breakdown: {
      base: limit,
      credits: 0,
      total: limit,
      used,
      remaining
    },
    creditSummary: {
      base: {
        limit,
        used,
        remaining
      },
      credits: {
        granted: 0,
        used: 0,
        available: 0
      }
    },
    purchases: [],
    isGuest: true
  };
}

/**
 * Create unlimited upload stats for admin users
 */
function createAdminUploadStats() {
  return {
    uploadCount: 0,
    uploadLimit: Infinity,
    remaining: Infinity,
    planType: 'admin',
    subscriptionStatus: 'active',
    baseLimit: Infinity,
    baseUsed: 0,
    oneTimeCredits: 0,
    totalCreditsGranted: 0,
    creditsUsed: 0,
    breakdown: {
      base: Infinity,
      credits: 0,
      total: Infinity,
      used: 0,
      remaining: Infinity
    },
    creditSummary: {
      base: {
        limit: Infinity,
        used: 0,
        remaining: Infinity
      },
      credits: {
        granted: 0,
        used: 0,
        available: 0
      }
    },
    purchases: [],
    isGuest: false,
    isAdmin: true
  };
}

/**
 * Fetch guest stats - optimized for localStorage-first with optional server sync
 * Works reliably without database connection
 */
async function fetchGuestStatsFromDevice() {
  // Always return localStorage stats first for fast response
  // Server sync happens in background if available
  if (typeof window === 'undefined') {
    return createGuestUploadStats();
  }

  // Get current localStorage stats immediately
  const localStats = createGuestUploadStats();

  // Try server sync in background (non-blocking)
  try {
    const deviceFingerprint = await generateDeviceFingerprint();
    
    let sessionId = localStorage.getItem('devello_guest_session');
    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('devello_guest_session', sessionId);
    }

    // Non-blocking server fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    fetch('/api/guest/upload-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, deviceFingerprint }),
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(serverStats => {
        if (serverStats && serverStats.uploadCount !== undefined) {
          // Sync: use higher count between server and local (prevents abuse)
          const serverCount = serverStats.uploadCount || 0;
          const localCount = parseInt(localStorage.getItem('devello_guest_uploads') || '0', 10);
          const maxCount = Math.max(serverCount, localCount);
          
          localStorage.setItem('devello_guest_uploads', maxCount.toString());
          localStorage.setItem('devello_guest_limit', '5');
          
          // Notify listeners of potential update
          const updatedStats = createGuestUploadStats();
          notifyListeners(updatedStats);
        }
      })
      .catch(() => {
        // Silently ignore - localStorage is primary
        clearTimeout(timeoutId);
      });
  } catch (error) {
    // Silently ignore server sync errors
  }

  // Return localStorage stats immediately
  return localStats;
}

/**
 * Fetch upload stats from database for signed-in users
 */
async function fetchSignedInUserStats() {
  try {
    // Only run in browser context
    if (typeof window === 'undefined') {
      console.warn('⚠️ [UPLOAD_STATS] Server-side context, using guest stats');
      return createGuestUploadStats();
    }

    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ [UPLOAD_STATS] Supabase unavailable, using guest stats');
      return createGuestUploadStats();
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.log('🔄 [UPLOAD_STATS] No session found, using guest stats');
      return createGuestUploadStats();
    }

    let response;
    try {
      response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
    } catch (fetchError) {
      // Network error or fetch failed
      console.warn('⚠️ [UPLOAD_STATS] Fetch failed, using guest stats:', fetchError.message);
      return createGuestUploadStats();
    }

    if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ [UPLOAD_STATS] Unauthorized profile request, using guest stats');
      return createGuestUploadStats();
    }

    if (!response.ok) {
      console.warn(`⚠️ [UPLOAD_STATS] Profile request failed with status ${response.status}, using guest stats`);
      return createGuestUploadStats();
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.warn('⚠️ [UPLOAD_STATS] Failed to parse response JSON, using guest stats:', jsonError.message);
      return createGuestUploadStats();
    }
    
    // Check if user is admin - bypass limits for admin users
    if (data.email && isAdminEmail(data.email)) {
      console.log('✅ [UPLOAD_STATS] Admin user detected, granting unlimited uploads');
      return createAdminUploadStats();
    }
    
    console.log('✅ [UPLOAD_STATS] Stats fetched from database:', data.uploadStats);
    
    return data.uploadStats || createGuestUploadStats();
  } catch (error) {
    console.error('❌ [UPLOAD_STATS] Error fetching signed-in user stats:', error);
    return createGuestUploadStats();
  }
}

/**
 * Get current upload stats (cached or fresh)
 */
export async function getUploadStats(forceRefresh = false) {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (!forceRefresh && currentUploadStats && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    return currentUploadStats;
  }

  // Prevent multiple simultaneous fetches
  if (isLoading) {
    return currentUploadStats || createGuestUploadStats();
  }

  isLoading = true;
  
  try {
    const supabase = getSupabase();
    let stats;

    if (!supabase) {
      // No Supabase available, use guest stats
      stats = createGuestUploadStats();
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        // Guest user - try to fetch from device fingerprint
        stats = await fetchGuestStatsFromDevice();
      } else {
        // Signed-in user, fetch from database
        stats = await fetchSignedInUserStats();
      }
    }

    // Update cache
    currentUploadStats = stats;
    lastFetchTime = now;
    
    // Notify listeners
    notifyListeners(stats);
    
    return stats;
  } catch (error) {
    console.error('❌ [UPLOAD_STATS] Error getting upload stats:', error);
    const fallbackStats = createGuestUploadStats();
    currentUploadStats = fallbackStats;
    lastFetchTime = now;
    return fallbackStats;
  } finally {
    isLoading = false;
  }
}

/**
 * Force refresh upload stats
 */
export async function refreshUploadStats() {
  console.log('🔄 [UPLOAD_STATS] Force refreshing upload stats...');
  return await getUploadStats(true);
}

/**
 * Get cached upload stats without fetching
 */
export function getCachedUploadStats() {
  return currentUploadStats || createGuestUploadStats();
}

/**
 * Check if user can upload
 */
export async function canUpload() {
  const stats = await getUploadStats();
  // Admin users always have unlimited uploads
  if (stats.isAdmin || stats.remaining === Infinity) {
    return true;
  }
  return stats.remaining > 0;
}

/**
 * Get remaining uploads
 */
export async function getRemainingUploads() {
  const stats = await getUploadStats();
  return stats.remaining;
}

/**
 * Get upload limit
 */
export async function getUploadLimit() {
  const stats = await getUploadStats();
  return stats.uploadLimit;
}

/**
 * Get upload count
 */
export async function getUploadCount() {
  const stats = await getUploadStats();
  return stats.uploadCount;
}

/**
 * Check if user is at upload limit
 */
export async function isAtUploadLimit() {
  const stats = await getUploadStats();
  return stats.remaining <= 0;
}

/**
 * Record an upload and update stats
 */
export async function recordUpload(uploadData) {
  try {
    console.log('📝 [UPLOAD_STATS] Recording upload:', uploadData);
    
    // Get authentication headers
    const { getSupabase } = await import('./supabaseClient');
    const supabase = getSupabase();
    let headers = {
      'Content-Type': 'application/json',
    };
    
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (authError) {
        console.warn('⚠️ [UPLOAD_STATS] Session retrieval failed:', authError.message);
        // Continue without auth headers if session retrieval fails
      }
    }
    
    // Check if user is signed in or guest
    const isSignedIn = headers['Authorization'];
    
    if (isSignedIn) {
      // Signed-in user - use existing API
      const response = await fetch('/api/upload/record', {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record upload');
      }

      const result = await response.json();
      console.log('✅ [UPLOAD_STATS] Upload recorded successfully:', result);

      // Update local cache with new stats
      if (result.uploadStats) {
        currentUploadStats = result.uploadStats;
        lastFetchTime = Date.now();
        notifyListeners(result.uploadStats);
      }

      return result;
    } else {
      // Guest user - use hybrid approach
      return await recordGuestUpload(uploadData);
    }
  } catch (error) {
    console.error('❌ [UPLOAD_STATS] Error recording upload:', error);
    throw error;
  }
}

/**
 * Record upload for guest users - localStorage-first, server sync in background
 * Optimized for reliability without database
 */
async function recordGuestUpload(uploadData) {
  try {
    // 1. IMMEDIATELY update localStorage (primary source of truth)
    const newCount = incrementGuestUploads();
    const updatedStats = createGuestUploadStats();
    currentUploadStats = updatedStats;
    lastFetchTime = Date.now();
    notifyListeners(updatedStats);

    console.log('✅ [UPLOAD_STATS] Guest upload recorded in localStorage:', updatedStats);

    // Dispatch event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('uploadRecorded', {
        detail: { uploadData, stats: updatedStats }
      }));
    }

    // 2. Attempt server sync in background (non-blocking)
    try {
      let sessionId = localStorage.getItem('devello_guest_session');
      if (!sessionId) {
        sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('devello_guest_session', sessionId);
      }

      const deviceFingerprint = await generateDeviceFingerprint();

      // Non-blocking server call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      fetch('/api/guest/record-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          uploadData,
          deviceFingerprint
        }),
        signal: controller.signal
      })
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok) {
            return response.json();
          }
          return null;
        })
        .then(result => {
          if (result && result.uploadStats) {
            // Server confirmed - sync if server has higher count
            const serverCount = result.uploadStats.uploadCount || 0;
            const localCount = getGuestUploadCount();
            if (serverCount > localCount) {
              localStorage.setItem('devello_guest_uploads', serverCount.toString());
              const syncedStats = createGuestUploadStats();
              currentUploadStats = syncedStats;
              notifyListeners(syncedStats);
            }
          }
        })
        .catch(() => {
          // Silently ignore - localStorage is already updated
          clearTimeout(timeoutId);
        });
    } catch (serverError) {
      // Silently ignore server sync errors
    }

    return { success: true, uploadStats: updatedStats };
  } catch (error) {
    console.error('❌ [UPLOAD_STATS] Error recording guest upload:', error);
    throw error;
  }
}

/**
 * Generate device fingerprint for guest tracking (hashed to avoid DB index issues)
 */
export async function generateDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server';
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprintData = JSON.stringify({
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL().substring(0, 100), // Truncate canvas data
      userAgent: navigator.userAgent.substring(0, 100)
    });
    
    // Hash the fingerprint to keep it small for database indexing
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex.substring(0, 64); // Use first 64 chars of hash
  } catch (error) {
    console.warn('⚠️ [UPLOAD_STATS] Device fingerprint generation failed:', error);
    // Fallback to simple hash
    try {
      const simple = `${screen.width}x${screen.height}-${navigator.language}-${navigator.platform}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(simple);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 64);
    } catch {
      return 'fallback-' + Date.now().toString(36);
    }
  }
}

/**
 * Increment guest upload count in localStorage
 */
export function incrementGuestUploads() {
  if (typeof window === 'undefined') return 0;
  
  const current = getGuestUploadCount();
  const newCount = current + 1;
  localStorage.setItem(STORAGE_KEYS.GUEST_UPLOADS, newCount.toString());
  
  // Update cached stats
  const updatedStats = createGuestUploadStats();
  currentUploadStats = updatedStats;
  lastFetchTime = Date.now();
  notifyListeners(updatedStats);
  
  return newCount;
}

/**
 * Add event listener for stats updates
 */
export function addStatsListener(callback) {
  eventListeners.add(callback);
  return () => eventListeners.delete(callback);
}

/**
 * Remove event listener
 */
export function removeStatsListener(callback) {
  eventListeners.delete(callback);
}

/**
 * Notify all listeners of stats updates
 */
function notifyListeners(stats) {
  eventListeners.forEach(callback => {
    try {
      callback(stats);
    } catch (error) {
      console.error('❌ [UPLOAD_STATS] Error in stats listener:', error);
    }
  });
}

/**
 * Clear cache and force refresh
 */
export function clearCache() {
  currentUploadStats = null;
  lastFetchTime = null;
  console.log('🧹 [UPLOAD_STATS] Cache cleared');
}

/**
 * Get upload stats for display in components
 */
export function getDisplayStats() {
  const stats = getCachedUploadStats();
  return {
    remaining: stats.remaining || 0,
    limit: stats.uploadLimit || 5,
    used: stats.uploadCount || 0,
    oneTimeCredits: stats.oneTimeCredits || 0,
    planType: stats.planType || 'free',
    subscriptionStatus: stats.subscriptionStatus || 'none',
    isGuest: stats.isGuest || false,
    isAtLimit: (stats.remaining || 0) <= 0,
    progressPercentage: Math.min(((stats.uploadLimit || 5) - (stats.remaining || 0)) / (stats.uploadLimit || 5) * 100, 100)
  };
}

/**
 * Initialize upload stats on app start
 */
export async function initializeUploadStats() {
  console.log('🚀 [UPLOAD_STATS] Initializing upload stats...');
  return await getUploadStats();
}

// Removed auto-refresh listeners to improve performance
// Stats are now only updated when explicitly needed

export default {
  getUploadStats,
  refreshUploadStats,
  getCachedUploadStats,
  canUpload,
  getRemainingUploads,
  getUploadLimit,
  getUploadCount,
  isAtUploadLimit,
  recordUpload,
  incrementGuestUploads,
  addStatsListener,
  removeStatsListener,
  clearCache,
  getDisplayStats,
  initializeUploadStats
};

