import config from './config.js';
import { createLogger } from './logger.js';

const logger = createLogger('middleware');

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  const headers = config.security.headers;
  
  // Filter out CSP header to avoid conflicts with next.config.js
  Object.entries(headers).forEach(([key, value]) => {
    if (key !== 'Content-Security-Policy') {
      res.setHeader(key, value);
    }
  });
  
  next?.();
};

// CORS middleware
export const corsMiddleware = (req, res, next) => {
  const { origin, credentials } = config.security.cors;
  const requestOrigin = req.headers.origin;
  
  // CRITICAL: Handle OPTIONS (preflight) requests FIRST, before any other logic
  // This prevents "Redirect is not allowed for a preflight request" errors
  if (req.method === 'OPTIONS') {
    // Allow configured origins (handle both array and string)
    const allowedOrigins = Array.isArray(origin) ? origin : [origin];
    const isOriginAllowed = !requestOrigin || 
      origin === '*' || 
      allowedOrigins.includes(requestOrigin) ||
      allowedOrigins.some(allowed => requestOrigin && requestOrigin.startsWith(allowed));
    
    if (isOriginAllowed && requestOrigin) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    } else if (origin === '*') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    // Return 200 immediately for preflight - do NOT call next()
    res.status(200).end();
    return;
  }
  
  // For non-OPTIONS requests, set CORS headers normally
  const allowedOrigins = Array.isArray(origin) ? origin : [origin];
  const isOriginAllowed = !requestOrigin || 
    origin === '*' || 
    allowedOrigins.includes(requestOrigin) ||
    allowedOrigins.some(allowed => requestOrigin && requestOrigin.startsWith(allowed));
  
  if (isOriginAllowed && requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else if (origin === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  if (credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  next?.();
};

// Rate limiting middleware
export const rateLimiter = (req, res, next) => {
  const { 
    windowMs, 
    maxRequests, 
    uploadWindowMs, 
    uploadMaxRequests, 
    authWindowMs, 
    authMaxRequests,
    formWindowMs,
    contactFormMaxRequests,
    formMaxRequests
  } = config.security.rateLimiting;
  const clientId = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Determine rate limit settings based on endpoint
  let currentWindowMs = windowMs;
  let currentMaxRequests = maxRequests;
  
  // Stricter limits for form endpoints (to prevent spam)
  if (req.url.includes('/api/contact/')) {
    currentWindowMs = formWindowMs;
    currentMaxRequests = contactFormMaxRequests;
  } else if (
    req.url.includes('/api/leads/') || 
    req.url.includes('/api/software-service/') || 
    req.url.includes('/api/business-consultation/') || 
    req.url.includes('/api/custom-builds/')
  ) {
    currentWindowMs = formWindowMs;
    currentMaxRequests = formMaxRequests;
  } else if (req.url.includes('/api/upload') || req.url.includes('/api/predictions')) {
    currentWindowMs = uploadWindowMs;
    currentMaxRequests = uploadMaxRequests;
  } else if (req.url.includes('/api/auth') || req.url.includes('/api/user')) {
    currentWindowMs = authWindowMs;
    currentMaxRequests = authMaxRequests;
  }
  
  const windowStart = now - currentWindowMs;
  
  // Clean old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.windowStart < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  // Get or create client data
  let clientData = rateLimitStore.get(clientId);
  if (!clientData || clientData.windowStart < windowStart) {
    clientData = {
      windowStart: now,
      requests: 0,
      blocked: false,
      blockUntil: 0
    };
  }
  
  // Check if client is blocked
  if (clientData.blocked && now < clientData.blockUntil) {
    const remainingBlockTime = Math.ceil((clientData.blockUntil - now) / 1000);
    logger.warn('Blocked client attempted request', { 
      clientId, 
      remainingBlockTime,
      url: req.url 
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${remainingBlockTime} seconds.`,
      retryAfter: remainingBlockTime
    });
    return;
  }
  
  clientData.requests++;
  rateLimitStore.set(clientId, clientData);
  
  // Check if rate limit exceeded
  if (clientData.requests > currentMaxRequests) {
    // Block client for extended period if they exceed limits repeatedly
    const blockDuration = clientData.blocked ? 30 * 60 * 1000 : 5 * 60 * 1000; // 30 min if already blocked, 5 min first time
    clientData.blocked = true;
    clientData.blockUntil = now + blockDuration;
    rateLimitStore.set(clientId, clientData);
    
    logger.warn('Rate limit exceeded - client blocked', { 
      clientId, 
      requests: clientData.requests, 
      maxRequests: currentMaxRequests,
      blockDuration: blockDuration / 1000,
      url: req.url
    });
    
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(blockDuration / 1000)} seconds.`,
      retryAfter: Math.ceil(blockDuration / 1000)
    });
    return;
  }
  
  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', currentMaxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, currentMaxRequests - clientData.requests));
  res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + currentWindowMs).toISOString());
  
  next?.();
};

// Request validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      // Basic validation - in production, use a library like Joi or Yup
      if (schema.method && req.method !== schema.method) {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      if (schema.requireBody && (!req.body || Object.keys(req.body).length === 0)) {
        return res.status(400).json({ error: 'Request body is required' });
      }
      
      if (schema.requiredFields) {
        const missing = schema.requiredFields.filter(field => !req.body?.[field]);
        if (missing.length > 0) {
          return res.status(400).json({ 
            error: 'Missing required fields', 
            fields: missing 
          });
        }
      }
      
      next?.();
    } catch (error) {
      logger.error('Request validation error', { error: error.message });
      res.status(400).json({ error: 'Invalid request format' });
    }
  };
};

// Error handling middleware
export const errorHandler = (error, req, res, next) => {
  logger.logError(error, {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers
  });
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.'
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// File upload validation middleware
export const validateFileUpload = (req, res, next) => {
  try {
    // This will be called after formidable parses the file
    if (req.file) {
      const { validateFileType } = require('./config.js');
      validateFileType(req.file);
    }
    next?.();
  } catch (error) {
    logger.warn('File upload validation failed', { error: error.message });
    res.status(400).json({ error: error.message });
  }
};

// Combine multiple middlewares
export const applyMiddleware = (req, res, middlewares) => {
  return new Promise((resolve, reject) => {
    let index = 0;
    
    const next = (error) => {
      if (error) {
        reject(error);
        return;
      }
      
      if (index >= middlewares.length) {
        resolve();
        return;
      }
      
      const middleware = middlewares[index++];
      try {
        middleware(req, res, next);
      } catch (err) {
        reject(err);
      }
    };
    
    next();
  });
};

// API route wrapper with common middleware
export const withMiddleware = (handler, options = {}) => {
  const middlewares = [
    securityHeaders,
    corsMiddleware,
    ...(options.rateLimit !== false ? [rateLimiter] : []),
    ...(options.validation ? [validateRequest(options.validation)] : []),
    ...(options.fileUpload ? [validateFileUpload] : [])
  ];
  
  return asyncHandler(async (req, res) => {
    try {
      await applyMiddleware(req, res, middlewares);
      return await handler(req, res);
    } catch (error) {
      errorHandler(error, req, res);
    }
  });
}; 
