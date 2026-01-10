/**
 * Refresh Service
 * Handles automatic data refresh and real-time updates
 */

import { subscriptionCache } from './subscriptionCache';

export class RefreshService {
  static refreshCallbacks = new Set();
  static refreshInterval = null;
  static isRefreshing = false;

  /**
   * Register a callback to be called when data needs refresh
   */
  static registerRefreshCallback(callback) {
    this.refreshCallbacks.add(callback);
  }

  /**
   * Unregister a refresh callback
   */
  static unregisterRefreshCallback(callback) {
    this.refreshCallbacks.delete(callback);
  }

  /**
   * Trigger all registered refresh callbacks
   */
  static async triggerRefresh(reason = 'manual') {
    if (this.isRefreshing) {
      return;
    }

    // Throttle refreshes to max once per 5 seconds
    const now = Date.now();
    if (this.lastRefreshTime && (now - this.lastRefreshTime) < 5000) {
      return;
    }
    this.lastRefreshTime = now;

    this.isRefreshing = true;

    try {
      const promises = Array.from(this.refreshCallbacks).map(async (callback) => {
        try {
          await callback();
        } catch (error) {
          console.error('❌ [REFRESH_SERVICE] Refresh callback error:', error);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('❌ [REFRESH_SERVICE] Refresh error:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Start automatic refresh polling
   */
  static startAutoRefresh(intervalMs = 60000) { // 60 seconds default
    if (this.refreshInterval) {
      return;
    }

    
    this.refreshInterval = setInterval(() => {
      this.triggerRefresh('auto');
    }, intervalMs);
  }

  /**
   * Stop automatic refresh polling
   */
  static stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Clear subscription cache and trigger refresh
   */
  static async clearCacheAndRefresh(customerId = null) {
    
    if (customerId) {
      subscriptionCache.invalidate(customerId);
    } else {
      subscriptionCache.clear();
    }
    
    await this.triggerRefresh('cache_clear');
  }

  /**
   * Handle subscription changes
   */
  static async handleSubscriptionChange(customerId, changeType = 'unknown') {
    
    // Clear cache for this customer
    if (customerId) {
      subscriptionCache.invalidate(customerId);
    }
    
    // Trigger immediate refresh
    await this.triggerRefresh(`subscription_${changeType}`);
  }

  /**
   * Handle billing action completion
   */
  static async handleBillingAction(action, success = true) {
    
    if (success) {
      // Clear all caches to ensure fresh data
      subscriptionCache.clear();
      
      // Trigger refresh with delay to allow backend processing
      setTimeout(() => {
        this.triggerRefresh(`billing_${action}`);
      }, 1000);
    }
  }

  /**
   * Setup page visibility refresh
   */
  static setupVisibilityRefresh() {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        this.triggerRefresh('visibility_change');
      }
    };

    let lastFocusTime = 0;
    const handleWindowFocus = () => {
      const now = Date.now();
      // Throttle focus events to max once per 10 seconds
      if (now - lastFocusTime > 10000) {
        this.triggerRefresh('window_focus');
        lastFocusTime = now;
      } else {
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }

  /**
   * Setup custom event listeners
   */
  static setupCustomEvents() {
    if (typeof window === 'undefined') return;

    const handleUploadComplete = () => {
      this.triggerRefresh('upload_complete');
    };

    const handleSubscriptionUpdate = (event) => {
      this.triggerRefresh('subscription_event');
    };

    window.addEventListener('uploadCompleted', handleUploadComplete);
    window.addEventListener('uploadProcessed', handleUploadComplete);
    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('uploadCompleted', handleUploadComplete);
      window.removeEventListener('uploadProcessed', handleUploadComplete);
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
    };
  }

  /**
   * Initialize refresh service
   */
  static initialize() {
    
    // Setup event listeners
    const cleanupVisibility = this.setupVisibilityRefresh();
    const cleanupEvents = this.setupCustomEvents();
    
    // Start auto-refresh
    this.startAutoRefresh();
    
    return () => {
      cleanupVisibility();
      cleanupEvents();
      this.stopAutoRefresh();
    };
  }
}

export default RefreshService;
