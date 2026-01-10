/**
 * Mobile-specific debugging utilities
 */
export class MobileDebugger {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_MOBILE_DEBUG === 'true';
    this.debugLogs = [];
  }

  /**
   * Log mobile-specific debug information
   */
  log(level, message, data = {}) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const logEntry = {
      timestamp,
      level,
      message,
      data: {
        ...data,
        isMobile,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.debugLogs.push(logEntry);
    console[level]?.(`📱 [MOBILE_DEBUG] ${message}`, logEntry.data);
  }

  /**
   * Log session-related issues
   */
  logSessionIssue(issue, context = {}) {
    this.log('warn', `Session issue: ${issue}`, {
      ...context,
      sessionStorage: this.getSessionStorageInfo(),
      localStorage: this.getLocalStorageInfo()
    });
  }

  /**
   * Get session storage information
   */
  getSessionStorageInfo() {
    try {
      const keys = Object.keys(sessionStorage);
      return {
        keys: keys.filter(key => key.includes('supabase') || key.includes('auth')),
        totalKeys: keys.length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Get localStorage information
   */
  getLocalStorageInfo() {
    try {
      const keys = Object.keys(localStorage);
      return {
        keys: keys.filter(key => key.includes('supabase') || key.includes('auth')),
        totalKeys: keys.length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Log upload attempt with full context
   */
  logUploadAttempt(file, headers, isMobile) {
    this.log('info', 'Upload attempt started', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasAuth: !!headers.Authorization,
      isMobile,
      timestamp: Date.now()
    });
  }

  /**
   * Log upload result
   */
  logUploadResult(success, error = null, response = null) {
    this.log(success ? 'info' : 'error', `Upload ${success ? 'succeeded' : 'failed'}`, {
      success,
      error: error?.message,
      status: response?.status,
      timestamp: Date.now()
    });
  }

  /**
   * Get debug logs for analysis
   */
  getDebugLogs() {
    return this.debugLogs;
  }

  /**
   * Clear debug logs
   */
  clearLogs() {
    this.debugLogs = [];
  }

  /**
   * Export debug information
   */
  exportDebugInfo() {
    return {
      logs: this.debugLogs,
      sessionInfo: this.getSessionStorageInfo(),
      localStorageInfo: this.getLocalStorageInfo(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
export const mobileDebugger = new MobileDebugger();

export default mobileDebugger;
