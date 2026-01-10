// Production-ready logging system
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const LOG_LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG'
};

class Logger {
  constructor(context = 'app', level = LOG_LEVELS.INFO) {
    this.context = context;
    this.level = process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
    this.startTime = Date.now();
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level];
    
    const logEntry = {
      timestamp,
      level: levelName,
      context: this.context,
      message,
      ...meta
    };

    // Add performance metrics for long-running operations
    if (meta.duration) {
      logEntry.performance = {
        duration: meta.duration,
        slow: meta.duration > 5000 // Mark as slow if over 5 seconds
      };
    }

    return logEntry;
  }

  log(level, message, meta = {}) {
    if (level > this.level) return;

    const logEntry = this.formatMessage(level, message, meta);
    
    // In production, use structured logging
    if (process.env.NODE_ENV === 'production') {
    } else {
      // Development: pretty print
      const levelName = LOG_LEVEL_NAMES[level];
      const color = this.getColorForLevel(level);
      console.log(
        `${color}[${logEntry.timestamp}] ${levelName} (${this.context}): ${message}${this.resetColor()}`,
        Object.keys(meta).length > 0 ? meta : ''
      );
    }
  }

  error(message, meta = {}) {
    // Always log errors, regardless of level
    this.log(LOG_LEVELS.ERROR, message, { 
      ...meta, 
      stack: meta.error?.stack || new Error().stack 
    });
  }

  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  // Performance monitoring
  startTimer(operation) {
    const startTime = Date.now();
    return {
      end: (message = `${operation} completed`, meta = {}) => {
        const duration = Date.now() - startTime;
        this.info(message, { 
          ...meta, 
          operation, 
          duration,
          performance: {
            duration,
            slow: duration > 5000
          }
        });
        return duration;
      }
    };
  }

  // Request/Response logging for APIs
  logRequest(req, meta = {}) {
    this.info('API Request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      ...meta
    });
  }

  logResponse(req, res, duration, meta = {}) {
    this.info('API Response', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ...meta
    });
  }

  // Error tracking for monitoring services
  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context
    };

    this.error('Application Error', { error: errorInfo });

    // In production, you might want to send to external services
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // sentry.captureException(error, { extra: context });
    }
  }

  getColorForLevel(level) {
    const colors = {
      [LOG_LEVELS.ERROR]: '\x1b[31m', // Red
      [LOG_LEVELS.WARN]: '\x1b[33m',  // Yellow
      [LOG_LEVELS.INFO]: '\x1b[36m',  // Cyan
      [LOG_LEVELS.DEBUG]: '\x1b[35m'  // Magenta
    };
    return colors[level] || '';
  }

  resetColor() {
    return '\x1b[0m';
  }
}

// Factory function to create loggers
export const createLogger = (context, level) => {
  return new Logger(context, level);
};

// Default logger
export const logger = createLogger('app');

// Middleware for API logging
export const apiLogger = (req, res, next) => {
  const apiLog = createLogger('api');
  const timer = apiLog.startTimer('request');
  
  apiLog.logRequest(req);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = timer.end('API Request completed');
    apiLog.logResponse(req, res, duration);
    originalEnd.apply(this, args);
  };
  
  next?.();
};

export default Logger; 
