// Production-specific configuration overrides
// This file contains production optimizations and security settings

const productionConfig = {
  // Disable debug logging in production
  debug: false,
  
  // Production logging settings
  logging: {
    level: 'error',
    enableConsole: false,
    enableMobileStreaming: false
  },
  
  // Enhanced security for production
  security: {
    // Enable all security features in production
    fileUpload: {
      scanForMalware: true,
      validateImageDimensions: true,
      maxImageDimensions: { width: 4000, height: 4000 } // Reduced for performance
    },
    auth: {
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours (shorter for security)
      maxLoginAttempts: 3, // Stricter
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      requireStrongPasswords: true,
      enable2FA: false
    }
  },
  
  // Production API settings
  replicate: {
    maxRetries: 5, // More retries for production reliability
    timeoutMs: 60000, // Longer timeout
  },
  
  // Production upload limits (more conservative)
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB (same as development)
    compressionQuality: 0.9, // Higher quality
    maxDimensions: 1920, // Standard HD
  },
  
  // Production processing settings
  processing: {
    maxPollAttempts: 120, // 4 minutes at 2s intervals
    initialPollDelay: 2000, // Slightly longer initial delay
    maxPollDelay: 5000, // Longer max delay
    exponentialBackoffFactor: 1.8 // More aggressive backoff
  }
};

export default productionConfig;
