/**
 * Smart caching for Stripe API calls to reduce load
 */

class SubscriptionCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get cached subscription data
   */
  get(customerId) {
    const cached = this.cache.get(customerId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(customerId);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached subscription data
   */
  set(customerId, data) {
    this.cache.set(customerId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache for a customer
   */
  invalidate(customerId) {
    this.cache.delete(customerId);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const subscriptionCache = new SubscriptionCache();
