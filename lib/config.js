// Configuration and environment validation
const config = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  isVercel: process.env.VERCEL === '1',
  
  // Mobile optimization
  mobile: {
    optimization: process.env.MOBILE_OPTIMIZATION === 'true',
    heicSupport: process.env.HEIC_SUPPORT === 'true',
    touchOptimization: process.env.TOUCH_OPTIMIZATION === 'true',
    enableDebug: process.env.ENABLE_MOBILE_DEBUG === 'true'
  },
  
  // Debug mode (only enabled in development or with explicit flag)
  debug: process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true',
  
  // API Configuration
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN,
    maxRetries: 3,
    timeoutMs: 30000,
    models: {
      flux: 'black-forest-labs/flux-kontext-max',
      upscale: 'recraft-ai/recraft-crisp-upscale:71b4b8f299dd300f7199ec7eb433fa15cc1f493abca86719505d2021a21a5892'
    }
  },

  // Google AI Configuration
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
    model: 'gemini-1.5-flash',
    maxRetries: 3,
    timeoutMs: 60000
  },

  // Upload Configuration
  upload: {
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
    maxDimensions: 1920,
    // Mobile-specific settings
    mobile: {
      maxFileSize: 25 * 1024 * 1024, // 25MB for mobile
      compressionQuality: 0.8, // Slightly lower quality for faster uploads
      maxDimensions: 2048, // Higher resolution for mobile photos
      heicConversion: true
    }
  },

  // Security Configuration
  security: {
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: process.env.NODE_ENV === 'production' ? 30 : 100, // Reduced for production
      skipSuccessfulRequests: false, // Changed to false to track all requests
      // Additional rate limiting for sensitive endpoints
      uploadWindowMs: 60 * 1000, // 1 minute for uploads
      uploadMaxRequests: process.env.NODE_ENV === 'production' ? 5 : 20, // Stricter upload limits
      authWindowMs: 5 * 60 * 1000, // 5 minutes for auth
      authMaxRequests: process.env.NODE_ENV === 'production' ? 10 : 50, // Stricter auth limits
      // Form submission rate limiting (stricter to prevent spam)
      formWindowMs: 15 * 60 * 1000, // 15 minutes
      contactFormMaxRequests: process.env.NODE_ENV === 'production' ? 3 : 10, // Contact forms: 3 per 15 min
      formMaxRequests: process.env.NODE_ENV === 'production' ? 5 : 15 // Other forms: 5 per 15 min
    },
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [
            process.env.VERCEL_URL, 
            process.env.PRODUCTION_URL, 
            'https://devello-studio.vercel.app',
            'https://devello-studio-git-main.vercel.app',
            'https://develloinc.com',
            'https://www.develloinc.com',
            'https://devellostudios.com',
            'https://www.devellostudios.com',
            'https://devellotech.com',
            'https://www.devellotech.com'
          ].filter(Boolean)
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      maxAge: 86400 // 24 hours
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      // CSP is handled in next.config.js to avoid conflicts
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-DNS-Prefetch-Control': 'off'
    },
    // File upload security
    fileUpload: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.heic'],
      scanForMalware: process.env.NODE_ENV === 'production', // Enable in production
      validateImageDimensions: true,
      maxImageDimensions: { width: 8000, height: 8000 } // Reasonable max dimensions
    },
    // Authentication security
    auth: {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      requireStrongPasswords: true,
      enable2FA: false // Can be enabled later
    }
  },

  // Processing Configuration
  processing: {
    maxPollAttempts: 90, // 3 minutes at 2s intervals
    initialPollDelay: 1000,
    maxPollDelay: 3000,
    exponentialBackoffFactor: 1.5
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    connectionTimeout: 10000
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
    enableConsole: process.env.NODE_ENV !== 'production' || process.env.DEBUG_MODE === 'true',
    enableMobileStreaming: process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true'
  }
};

// Validation functions
const validateEnvironment = () => {
  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'DATABASE_URL'
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate API token format (only in development)
  if (config.debug && config.replicate.apiToken && !config.replicate.apiToken.startsWith('r8_')) {
    console.warn('REPLICATE_API_TOKEN may be invalid - should start with r8_');
  }

  // Check for Google API key (optional but recommended)
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('GOOGLE_API_KEY not found - Gemini features will be disabled');
  }
};

// Security utilities
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
};

const maskEmail = (value) => {
  if (typeof value !== 'string' || !value.includes('@')) return value;
  const [user, domain] = value.split('@');
  if (!user) return value;
  return `${user.slice(0, 3)}***@${domain}`;
};

const maskUserId = (value) => {
  if (typeof value !== 'string') return value;
  return value.length > 8 ? `${value.slice(0, 8)}***` : value;
};

const maskPhone = (value) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return value;
  return `***${digits.slice(-4)}`;
};

const maskCard = (value) => {
  if (typeof value !== 'string') return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return value;
  return `${digits.slice(0, 4)}****${digits.slice(-4)}`;
};

const sanitizeValue = (value, key) => {
  if (value == null) return value;
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes('email')) return maskEmail(value);
  if (lowerKey.includes('user') && lowerKey.includes('id')) return maskUserId(value);
  if (lowerKey.includes('phone')) return maskPhone(value);
  if (lowerKey.includes('card')) return maskCard(value);
  return value;
};

// Safe logging utility
const safeLog = (level, message, data = {}) => {
  if (!config.logging.enableConsole) return;
  
  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) =>
      !['apiToken', 'password', 'secret', 'key', 'token'].some(sensitive =>
        key.toLowerCase().includes(sensitive)
      )
    )
  );

  // Remove sensitive data in production and mask PII
  const sanitizedData = config.isProduction
    ? Object.fromEntries(
        Object.entries(filteredData).map(([key, value]) => [key, sanitizeValue(value, key)])
      )
    : filteredData;
    
  console[level]?.(message, sanitizedData);
};

// Secure error formatting
const formatError = (error, includeStack = false) => {
  const errorInfo = {
    message: error.message,
    name: error.name
  };
  
  if (includeStack && config.debug) {
    errorInfo.stack = error.stack;
  }
  
  return errorInfo;
};

// Initialize validation on import
if (typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Configuration validation failed:', error.message);
    // Don't exit in production builds - just log the error
    if (config.isProduction && process.env.NODE_ENV === 'production') {
      console.warn('Continuing with missing environment variables - some features may not work');
    } else {
      // Log error but don't exit - allows build to continue
      console.warn('Configuration validation failed, continuing with limited functionality');
    }
  }
}

export default config;
export { sanitizeFilename, safeLog, formatError }; 
