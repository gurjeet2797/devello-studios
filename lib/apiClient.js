/**
 * API Client for cross-domain API calls
 * Used by studios and tech projects to call APIs on the main domain
 */

const getApiBaseUrl = () => {
  // In production, use the configured API base URL or default to main domain
  if (typeof window !== 'undefined') {
    // Client-side: use current origin for local development, or environment variable for production
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    hostname.includes('devellostudios.com') ||
                    hostname.includes('devellotech.com') ||
                    hostname.includes('develloconstruction.com') ||
                    hostname.includes('devello.shop') ||
                    (hostname.includes('devello') && window.location.port !== ''); // Any devello domain with a port (local)
    
    if (isLocal) {
      // Local development or local domain testing - use current origin
      return window.location.origin;
    }
    // Production: use environment variable or default to main domain
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://develloinc.com';
  }
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://develloinc.com';
};

/**
 * Make an API request to the main domain
 * @param {string} endpoint - API endpoint (e.g., '/api/user/profile')
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  // Check if this is a cross-origin request
  const isCrossOrigin = typeof window !== 'undefined' && 
    window.location.origin !== baseUrl;
  
  // Ensure credentials are included for cross-origin requests
  const fetchOptions = {
    ...options,
    credentials: isCrossOrigin ? 'include' : 'same-origin',
    mode: isCrossOrigin ? 'cors' : 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * GET request helper
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'GET',
  });
};

/**
 * POST request helper
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });
};

/**
 * Upload file with FormData
 */
export const apiUpload = async (endpoint, formData, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  
  const fetchOptions = {
    ...options,
    method: 'POST',
    body: formData,
    credentials: 'include',
    // Don't set Content-Type for FormData - browser will set it with boundary
    headers: {
      ...(options.headers || {}),
    },
  };

  // Remove Content-Type header if present (browser will set it)
  if (fetchOptions.headers['Content-Type']) {
    delete fetchOptions.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    console.error('API upload failed:', error);
    throw error;
  }
};

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  upload: apiUpload,
  getApiBaseUrl,
};

