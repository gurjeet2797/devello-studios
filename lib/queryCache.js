/**
 * Lightweight query cache utility for API responses
 * Provides TTL-based caching, prevents duplicate simultaneous requests, and supports invalidation
 */

// Cache storage: key -> { data, timestamp, ttl }
const cache = new Map();

// Track ongoing requests to prevent duplicate simultaneous calls
const pendingRequests = new Map();

// Default TTL: 30 seconds
const DEFAULT_TTL = 30000;

/**
 * Generate cache key from endpoint and optional user identifier
 */
function generateCacheKey(endpoint, userId = null) {
  if (userId) {
    return `${endpoint}:user:${userId}`;
  }
  return endpoint;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(cacheEntry, ttl) {
  if (!cacheEntry) return false;
  const now = Date.now();
  return (now - cacheEntry.timestamp) < ttl;
}

/**
 * Get cached data if available and valid
 */
export function getCachedData(endpoint, userId = null, ttl = DEFAULT_TTL) {
  const key = generateCacheKey(endpoint, userId);
  const cacheEntry = cache.get(key);
  
  if (isCacheValid(cacheEntry, ttl)) {
    return cacheEntry.data;
  }
  
  // Remove expired entry
  if (cacheEntry) {
    cache.delete(key);
  }
  
  return null;
}

/**
 * Set cached data with TTL
 */
export function setCachedData(endpoint, data, userId = null, ttl = DEFAULT_TTL) {
  const key = generateCacheKey(endpoint, userId);
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

/**
 * Invalidate cached data for an endpoint
 */
export function invalidateCache(endpoint, userId = null) {
  const key = generateCacheKey(endpoint, userId);
  cache.delete(key);
  pendingRequests.delete(key);
}

/**
 * Invalidate all cache entries matching a pattern
 */
export function invalidateCachePattern(pattern) {
  const keysToDelete = [];
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => {
    cache.delete(key);
    pendingRequests.delete(key);
  });
}

/**
 * Clear all cached data
 */
export function clearCache() {
  cache.clear();
  pendingRequests.clear();
}

/**
 * Fetch with caching - prevents duplicate simultaneous requests
 * 
 * @param {string} endpoint - API endpoint URL
 * @param {object} options - Fetch options (headers, method, body, etc.)
 * @param {object} cacheOptions - Cache configuration
 * @param {number} cacheOptions.ttl - Time to live in milliseconds (default: 30000)
 * @param {string} cacheOptions.userId - User ID for user-specific caching
 * @param {boolean} cacheOptions.forceRefresh - Force refresh even if cached data exists
 * @returns {Promise} - Promise resolving to response data
 */
export async function fetchWithCache(endpoint, options = {}, cacheOptions = {}) {
  const {
    ttl = DEFAULT_TTL,
    userId = null,
    forceRefresh = false
  } = cacheOptions;

  const key = generateCacheKey(endpoint, userId);

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cachedData = getCachedData(endpoint, userId, ttl);
    if (cachedData !== null) {
      return cachedData;
    }

    // Check if there's already a pending request for this endpoint
    if (pendingRequests.has(key)) {
      // Wait for the existing request to complete
      return pendingRequests.get(key);
    }
  }

  // Create new fetch request
  const fetchPromise = (async () => {
    try {
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      setCachedData(endpoint, data, userId, ttl);
      
      return data;
    } catch (error) {
      // Don't cache errors
      throw error;
    } finally {
      // Remove from pending requests
      pendingRequests.delete(key);
    }
  })();

  // Store pending request
  pendingRequests.set(key, fetchPromise);

  return fetchPromise;
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    pendingRequests: pendingRequests.size,
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      ttl: value.ttl,
      isValid: isCacheValid(value, value.ttl)
    }))
  };
}

