let isStreaming = false;
let logBuffer = [];

export const initLogStreamer = () => {
  if (typeof window === 'undefined') return;
  
  isStreaming = true;
  
  // Send any buffered logs
  logBuffer.forEach(log => sendLog(log));
  logBuffer = [];
};

const sendLog = async (logEntry) => {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    });
  } catch (error) {
    console.warn('📡 Failed to send log:', error);
  }
};

export const streamLog = (level, message, ...args) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    args: args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
      } catch (e) {
        return String(arg);
      }
    }),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  if (isStreaming) {
    sendLog(logEntry);
  } else {
    // Buffer logs until streaming is enabled
    logBuffer.push(logEntry);
    if (logBuffer.length > 100) {
      logBuffer.shift(); // Remove oldest log to prevent memory issues
    }
  }
};

export const overrideConsole = () => {
  if (typeof window === 'undefined') return;
  
  const originalConsole = {
    warn: console.warn,
    error: console.error,
    info: console.info
  };
  
  console.log = (...args) => {
    originalConsole.log(...args);
    streamLog('log', args[0], ...args.slice(1));
  };
  
  console.warn = (...args) => {
    originalConsole.warn(...args);
    streamLog('warn', args[0], ...args.slice(1));
  };
  
  console.error = (...args) => {
    originalConsole.error(...args);
    streamLog('error', args[0], ...args.slice(1));
  };
  
  console.info = (...args) => {
    originalConsole.info(...args);
    streamLog('info', args[0], ...args.slice(1));
  };
  
  // Store original methods in case we need to restore them
  window._originalConsole = originalConsole;
};

export const restoreConsole = () => {
  if (typeof window === 'undefined' || !window._originalConsole) return;
  
  console.warn = window._originalConsole.warn;
  console.error = window._originalConsole.error;
  console.info = window._originalConsole.info;
  
  delete window._originalConsole;
};

export const disconnectLogStreamer = () => {
  isStreaming = false;
}; 
