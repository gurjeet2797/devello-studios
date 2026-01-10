import { getSupabase } from './supabaseClient';

/**
 * Enhanced session management with mobile-specific optimizations
 */
export class SessionManager {
  constructor() {
    this.sessionCache = null;
    this.lastSessionCheck = 0;
    this.sessionCheckInterval = 1000; // 1 second
    this.maxRetries = 3;
    this.retryDelay = 500; // 500ms
  }

  /**
   * Get session with retry logic and mobile optimizations
   */
  async getSessionWithRetry(retries = 0) {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        // Supabase not available - return null for guest users
        // This allows uploads to work without authentication
        console.warn('⚠️ [SESSION] Supabase client not available - continuing as guest');
        return null;
      }

      // Check cache first (mobile optimization)
      const now = Date.now();
      if (this.sessionCache && (now - this.lastSessionCheck) < this.sessionCheckInterval) {
        console.log('📱 [SESSION] Using cached session');
        return this.sessionCache;
      }

      console.log('📱 [SESSION] Fetching fresh session...');
      
      // Wrap session retrieval in try-catch to handle localStorage errors
      let session = null;
      let error = null;
      
      try {
        const result = await supabase.auth.getSession();
        session = result.data?.session;
        error = result.error;
      } catch (sessionError) {
        console.warn('⚠️ [SESSION] Session retrieval failed:', sessionError.message);
        // If localStorage error, return null instead of throwing
        if (sessionError.message.includes('getItem') || sessionError.message.includes('localStorage')) {
          console.warn('⚠️ [SESSION] localStorage error detected, returning null session');
          return null;
        }
        throw sessionError;
      }
      
      if (error) {
        console.error('❌ [SESSION] Session error:', error);
        throw error;
      }

      // Cache the session
      this.sessionCache = session;
      this.lastSessionCheck = now;

      if (!session?.access_token) {
        console.warn('⚠️ [SESSION] No access token in session');
        return null;
      }

      console.log('✅ [SESSION] Session retrieved successfully');
      return session;

    } catch (error) {
      console.error(`❌ [SESSION] Attempt ${retries + 1} failed:`, error.message);
      
      // Don't retry on localStorage errors
      if (error.message.includes('getItem') || error.message.includes('localStorage')) {
        console.warn('⚠️ [SESSION] localStorage error detected, not retrying');
        return null;
      }
      
      if (retries < this.maxRetries) {
        console.log(`🔄 [SESSION] Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.getSessionWithRetry(retries + 1);
      }
      
      throw error;
    }
  }

  /**
   * Get auth headers with mobile optimizations
   */
  async getAuthHeaders() {
    try {
      const session = await this.getSessionWithRetry();
      
      if (!session?.access_token) {
        console.warn('⚠️ [SESSION] No access token available');
        return {};
      }

      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    } catch (error) {
      console.error('❌ [SESSION] Failed to get auth headers:', error);
      return {};
    }
  }

  /**
   * Wait for session to be available (mobile-specific)
   */
  async waitForSession(timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const session = await this.getSessionWithRetry();
        if (session?.access_token) {
          console.log('✅ [SESSION] Session available after wait');
          return session;
        }
      } catch (error) {
        console.log('⏳ [SESSION] Waiting for session...');
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    throw new Error('Session timeout - no valid session available');
  }

  /**
   * Clear session cache (for logout scenarios)
   */
  clearCache() {
    this.sessionCache = null;
    this.lastSessionCheck = 0;
    console.log('🧹 [SESSION] Cache cleared');
  }

  /**
   * Check if session is likely to be available
   */
  isSessionLikelyAvailable() {
    return this.sessionCache?.access_token || 
           (typeof window !== 'undefined' && localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token'));
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Mobile-specific session utilities
export const mobileSessionUtils = {
  /**
   * Check if we're on mobile and adjust session handling
   */
  isMobileDevice: () => {
    return /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Mobile-optimized session check
   */
  async getMobileSession() {
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      console.log('📱 [MOBILE_SESSION] Using mobile-optimized session handling');
      // Add small delay for mobile browsers
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return sessionManager.getSessionWithRetry();
  },

  /**
   * Mobile-specific auth headers
   */
  async getMobileAuthHeaders() {
    const isMobile = this.isMobileDevice();
    
    if (isMobile) {
      console.log('📱 [MOBILE_AUTH] Getting mobile auth headers');
      // Try multiple times for mobile
      for (let i = 0; i < 3; i++) {
        try {
          const headers = await sessionManager.getAuthHeaders();
          if (headers.Authorization) {
            return headers;
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`⚠️ [MOBILE_AUTH] Attempt ${i + 1} failed:`, error.message);
        }
      }
    }
    
    return sessionManager.getAuthHeaders();
  }
};

export default sessionManager;
