/**
 * Engine Cache
 * 
 * Caches stage outputs by input hash to avoid regeneration.
 * Uses in-memory cache with optional persistence to database.
 */

import crypto from 'crypto';

// In-memory cache store
const cacheStore = new Map();

// Cache configuration
const CACHE_CONFIG = {
  maxEntries: 500,
  ttlMs: 1 * 60 * 60 * 1000, // 1 hour (reduced from 24h to avoid stale data)
  enabled: process.env.IDEATION_CACHE_ENABLED !== 'false'
};

/**
 * Generate cache key from input and version info
 * 
 * @param {string} stage - Pipeline stage
 * @param {Object} input - Stage input
 * @param {string} promptVersion - Prompt spec version
 * @param {string} schemaVersion - Schema version
 * @returns {string} - SHA256 hash key
 */
export function generateCacheKey(stage, input, promptVersion = '1.0', schemaVersion = '1.0') {
  const normalized = JSON.stringify({
    stage,
    input: normalizeInput(input),
    promptVersion,
    schemaVersion
  });
  
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize input for consistent hashing
 * Sorts keys and removes undefined values
 */
function normalizeInput(input) {
  if (input === null || input === undefined) return null;
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(normalizeInput);
  
  const sorted = {};
  Object.keys(input).sort().forEach(key => {
    if (input[key] !== undefined) {
      sorted[key] = normalizeInput(input[key]);
    }
  });
  return sorted;
}

/**
 * Get cached result
 * 
 * @param {string} key - Cache key
 * @returns {Object|null} - Cached result or null
 */
export function get(key) {
  if (!CACHE_CONFIG.enabled) return null;
  
  const entry = cacheStore.get(key);
  if (!entry) return null;
  
  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_CONFIG.ttlMs) {
    cacheStore.delete(key);
    return null;
  }
  
  console.log(`[ENGINE_CACHE] Cache hit for key: ${key.substring(0, 16)}...`);
  return entry.data;
}

/**
 * Set cache entry
 * 
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {Object} metadata - Optional metadata
 */
export function set(key, data, metadata = {}) {
  if (!CACHE_CONFIG.enabled) return;
  
  // Enforce max entries (LRU-style eviction)
  if (cacheStore.size >= CACHE_CONFIG.maxEntries) {
    const oldestKey = cacheStore.keys().next().value;
    cacheStore.delete(oldestKey);
  }
  
  cacheStore.set(key, {
    data,
    metadata,
    timestamp: Date.now()
  });
  
  console.log(`[ENGINE_CACHE] Cached result for key: ${key.substring(0, 16)}...`);
}

/**
 * Check if result is cached
 * 
 * @param {string} key - Cache key
 * @returns {boolean}
 */
export function has(key) {
  if (!CACHE_CONFIG.enabled) return false;
  
  const entry = cacheStore.get(key);
  if (!entry) return false;
  
  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_CONFIG.ttlMs) {
    cacheStore.delete(key);
    return false;
  }
  
  return true;
}

/**
 * Invalidate cache entry
 * 
 * @param {string} key - Cache key
 */
export function invalidate(key) {
  cacheStore.delete(key);
}

/**
 * Clear all cache entries
 */
export function clear() {
  cacheStore.clear();
  console.log('[ENGINE_CACHE] Cache cleared');
}

/**
 * Get cache statistics
 * 
 * @returns {Object} - Cache stats
 */
export function getStats() {
  let validEntries = 0;
  let expiredEntries = 0;
  const now = Date.now();
  
  for (const [, entry] of cacheStore) {
    if (now - entry.timestamp > CACHE_CONFIG.ttlMs) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }
  
  return {
    totalEntries: cacheStore.size,
    validEntries,
    expiredEntries,
    maxEntries: CACHE_CONFIG.maxEntries,
    ttlMs: CACHE_CONFIG.ttlMs,
    enabled: CACHE_CONFIG.enabled
  };
}

/**
 * Cache-aware stage execution wrapper
 * 
 * @param {string} stage - Pipeline stage
 * @param {Object} input - Stage input
 * @param {Function} executor - Function to execute if cache miss
 * @param {Object} options - Cache options
 * @returns {Promise<Object>} - Stage result
 */
export async function withCache(stage, input, executor, options = {}) {
  const { promptVersion = '1.0', schemaVersion = '1.0', skipCache = false } = options;
  
  if (skipCache) {
    return executor();
  }
  
  const cacheKey = generateCacheKey(stage, input, promptVersion, schemaVersion);
  
  // Check cache
  const cached = get(cacheKey);
  if (cached) {
    return {
      ...cached,
      fromCache: true
    };
  }
  
  // Execute and cache
  const result = await executor();
  
  if (result && !result.error) {
    set(cacheKey, result, { stage, timestamp: Date.now() });
  }
  
  return {
    ...result,
    fromCache: false
  };
}

export default {
  generateCacheKey,
  get,
  set,
  has,
  invalidate,
  clear,
  getStats,
  withCache
};
