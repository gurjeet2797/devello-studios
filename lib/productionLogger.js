class ProductionLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Only log in development or when explicitly enabled
  log(...args) {
    if (this.isDevelopment || process.env.DEBUG_MODE === 'true') {
    }
  }

  warn(...args) {
    if (this.isDevelopment || process.env.DEBUG_MODE === 'true') {
      console.warn(...args);
    }
  }

  error(...args) {
    // Always log errors, but format them properly for production
    if (this.isProduction) {
      // In production, log structured errors
      const errorData = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: args[0],
        details: args.slice(1)
      };
      console.error(JSON.stringify(errorData));
    } else {
      console.error(...args);
    }
  }

  info(...args) {
    if (this.isDevelopment || process.env.DEBUG_MODE === 'true') {
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.isDevelopment || process.env.DEBUG_MODE === 'true') {
      console.debug(...args);
    }
  }

  // Performance monitoring (always enabled)
  time(label) {
    if (typeof performance !== 'undefined' && performance.now) {
      performance.mark(`${label}-start`);
    }
  }

  timeEnd(label) {
    if (typeof performance !== 'undefined' && performance.now) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      if (measure && this.isDevelopment) {
      }
    }
  }
}

// Create singleton instance
const productionLogger = new ProductionLogger();

// Export both the class and instance
export { ProductionLogger };
export default productionLogger;
