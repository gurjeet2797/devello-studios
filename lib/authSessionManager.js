import { getSupabase } from './supabaseClient';

export class AuthSessionManager {
  constructor() {
    this.supabase = getSupabase();
    this.SESSION_STORAGE_KEY = 'devello_auth_session';
    this.LAST_2FA_KEY = 'devello_last_2fa';
    this.SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    this.TWO_FA_RESET_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days for 2FA reset
  }

  /**
   * Enhanced Google OAuth sign-in with better session management
   */
  async signInWithGoogle(options = {}) {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    // Check if we have a recent session that doesn't need 2FA
    const shouldSkip2FA = this.shouldSkipTwoFactorAuth();
    
    // Store original domain before OAuth redirect to preserve it through the flow
    // ALWAYS use current origin - never redirect to a different domain
    const originalOrigin = window.location.origin;
    sessionStorage.setItem('oauth_original_origin', originalOrigin);
    
    // Store redirect path for after OAuth (from modal or current page)
    // Check if redirectPath was passed in options, otherwise use current page
    const redirectPath = options.redirectPath || window.location.pathname;
    sessionStorage.setItem('oauth_redirect_page', redirectPath);
    
    // Store current domain info for callback
    sessionStorage.setItem('oauth_current_domain', window.location.hostname);
    
    // Check if expanded view is open and store that state
    // This will be checked in the callback to restore the expanded view
    if (typeof window !== 'undefined') {
      // Check if there's an expanded view indicator in the DOM or URL
      const urlParams = new URLSearchParams(window.location.search);
      const isExpanded = urlParams.get('expanded') === 'true' || 
                        document.querySelector('[data-expanded-view]') !== null;
      if (isExpanded) {
        sessionStorage.setItem('expanded_view_open', 'true');
      }
    }
    
    // Prepare OAuth options - ALWAYS use current origin for redirect
    // This ensures studios stays on studios domain, tech stays on tech domain, etc.
    // CRITICAL: Use the current origin, never default to develloinc.com
    const redirectUrl = `${originalOrigin}/auth/callback`;
    
    // Log for debugging - this should always be the current domain
    console.log('[AUTH] OAuth redirect URL:', {
      currentOrigin: originalOrigin,
      redirectUrl: redirectUrl,
      hostname: window.location.hostname
    });
    
    const oauthOptions = {
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account', // Always allow account selection
          access_type: 'offline', // Request refresh token
          include_granted_scopes: 'true',
          ...(shouldSkip2FA && { 
            // Add parameters to potentially skip 2FA for returning users
            prompt: 'select_account'
          })
        }
      }
    };

    // Add custom parameters if provided
    if (options.forceAccountSelection) {
      oauthOptions.options.queryParams.prompt = 'select_account';
    }

    if (options.forceConsent) {
      oauthOptions.options.queryParams.prompt = 'consent';
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth(oauthOptions);
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Google OAuth sign-in failed:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if user should skip 2FA based on recent authentication
   */
  shouldSkipTwoFactorAuth() {
    if (typeof window === 'undefined') return false;
    
    try {
      const last2FA = localStorage.getItem(this.LAST_2FA_KEY);
      if (!last2FA) return false;
      
      const last2FADate = new Date(last2FA);
      const now = new Date();
      const timeDiff = now.getTime() - last2FADate.getTime();
      
      // If 2FA was completed within the reset duration, allow skipping
      return timeDiff < this.TWO_FA_RESET_DURATION;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Record successful 2FA completion
   */
  recordTwoFactorCompletion() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.LAST_2FA_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error recording 2FA completion:', error);
    }
  }

  /**
   * Enhanced session management with automatic refresh
   */
  async getSession() {
    if (!this.supabase) return null;

    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Session retrieval error:', error);
        return null;
      }

      // If session exists, store it for future reference
      if (session) {
        this.storeSessionInfo(session);
      }

      return session;
    } catch (error) {
      console.error('Session management error:', error);
      return null;
    }
  }

  /**
   * Store session information for better management
   */
  storeSessionInfo(session) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessionInfo = {
        userId: session.user?.id,
        email: session.user?.email,
        expiresAt: session.expires_at,
        provider: session.user?.app_metadata?.provider,
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionInfo));
    } catch (error) {
      console.error('Error storing session info:', error);
    }
  }

  /**
   * Get stored session information
   */
  getStoredSessionInfo() {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(this.SESSION_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving stored session:', error);
      return null;
    }
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(session) {
    if (!session) return false;
    
    const now = new Date().getTime() / 1000;
    return session.expires_at > now;
  }

  /**
   * Enhanced sign out with session cleanup
   */
  async signOut() {
    try {
      // Always clear stored session info first, even if Supabase call fails
      if (typeof window !== 'undefined') {
        // Clear all Supabase-related storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('devello_auth'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear specific keys
        localStorage.removeItem(this.SESSION_STORAGE_KEY);
        localStorage.removeItem(this.LAST_2FA_KEY);
        sessionStorage.removeItem('oauth_redirect_page');
        
        // Clear all sessionStorage items related to auth
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('oauth') || key.includes('auth') || key.includes('partner'))) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }

      // Try to sign out from Supabase if client is available
      if (this.supabase) {
        try {
          const { error } = await this.supabase.auth.signOut();
          if (error) {
            console.warn('Supabase signOut returned error (continuing anyway):', error);
          }
        } catch (supabaseError) {
          console.warn('Supabase signOut threw error (continuing anyway):', supabaseError);
        }
      } else {
        console.warn('Supabase client not initialized, clearing local storage only');
      }

      // Force clear any remaining auth state
      if (typeof window !== 'undefined') {
        // Dispatch auth state change event to notify components
        window.dispatchEvent(new CustomEvent('authStateChanged', {
          detail: { event: 'SIGNED_OUT', userId: null }
        }));
      }

      return { error: null };
    } catch (error) {
      console.error('Sign out failed:', error);
      // Even if there's an error, clear local storage as fallback
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { event: 'SIGNED_OUT', userId: null }
          }));
        } catch (clearError) {
          console.error('Failed to clear storage:', clearError);
        }
      }
      return { error };
    }
  }

  /**
   * Handle OAuth callback with enhanced session management
   */
  async handleOAuthCallback() {
    if (!this.supabase) return null;

    try {
      // Get the current session
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('OAuth callback error:', error);
        return null;
      }

      if (session) {
        // Record successful authentication
        this.recordTwoFactorCompletion();
        this.storeSessionInfo(session);
        
        return session;
      }

      return null;
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      return null;
    }
  }

  /**
   * Get user's Google accounts (if available)
   */
  async getGoogleAccounts() {
    if (typeof window === 'undefined') return [];
    
    try {
      // This would require additional Google API integration
      // For now, we'll return empty array as this requires more complex setup
      return [];
    } catch (error) {
      console.error('Error retrieving Google accounts:', error);
      return [];
    }
  }

  /**
   * Force account selection on next login
   */
  forceAccountSelection() {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear stored session to force fresh login
      localStorage.removeItem(this.SESSION_STORAGE_KEY);
      localStorage.removeItem(this.LAST_2FA_KEY);
    } catch (error) {
      console.error('Error forcing account selection:', error);
    }
  }

  /**
   * Reset 2FA requirement (for monthly reset)
   */
  resetTwoFactorRequirement() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.LAST_2FA_KEY);
    } catch (error) {
      console.error('Error resetting 2FA requirement:', error);
    }
  }
}

// Export singleton instance
export const authSessionManager = new AuthSessionManager();
