import config from './config.js';

class SecureLogger {
  constructor(context = 'app') {
    this.context = context;
    this.isProduction = config.isProduction;
    this.debugEnabled = config.debug;
  }

  // Safe logging that respects environment
  log(level, message, data = {}) {
    if (!config.logging.enableConsole) return;
    
    // Filter sensitive data
    const sanitizedData = this.sanitizeData(data);
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      context: this.context,
      level,
      message,
      ...(Object.keys(sanitizedData).length > 0 && { data: sanitizedData })
    };

    if (this.isProduction) {
      // In production, only log errors and warnings
      if (['error', 'warn'].includes(level)) {
        console[level](JSON.stringify(logEntry));
      }
    } else {
      // In development, log everything
      console[level](`[${this.context}] ${message}`, sanitizedData);
    }
  }

  debug(message, data = {}) {
    if (this.debugEnabled) {
      this.log('debug', message, data);
    }
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  error(message, data = {}) {
    this.log('error', message, data);
  }

  // Remove sensitive information from logs
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'api',
      'credential', 'apiToken', 'apiKey', 'authorization'
    ];
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Create timer for performance logging
  startTimer(operation) {
    const start = Date.now();
    return {
      end: (message) => {
        const duration = Date.now() - start;
        this.info(message || `${operation} completed`, { 
          operation, 
          duration: `${duration}ms`,
          slow: duration > 3000 
        });
        return duration;
      }
    };
  }
}

// Factory function
export const createSecureLogger = (context) => new SecureLogger(context);

// Default logger
export const logger = new SecureLogger();

export default SecureLogger; 
