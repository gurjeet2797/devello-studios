// Client-side utilities for performance optimization
import { createLogger } from './logger.js';

const logger = createLogger('client-utils');

// Image compression utility
export const compressImage = async (file, maxWidth = 1920, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img;
        const aspectRatio = width / height;
        
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              logger.info('Image compressed', {
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: (blob.size / file.size).toFixed(2)
              });
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// HEIC conversion utility - simple and working
export const convertHeicToJpeg = async (file) => {
  try {
    const heic2any = (await import("heic2any")).default;
    const jpegBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.95
    });
    return jpegBlob instanceof Blob ? jpegBlob : jpegBlob[0];
  } catch (error) {
    logger.error('HEIC conversion failed', { error: error.message });
    throw new Error("HEIC images are not supported on this device/browser. Please convert to JPEG or use a different device.");
  }
};

// Optimized API client with retry logic and caching
class APIClient {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = 30000,
      retries = 2,
      cache = false,
      ...fetchOptions
    } = options;

    // Create cache key
    const cacheKey = cache ? `${method}:${endpoint}:${JSON.stringify(body)}` : null;
    
    // Check cache first
    if (cache && this.cache.has(cacheKey)) {
      logger.debug('Cache hit', { endpoint });
      return this.cache.get(cacheKey);
    }

    // Check for pending identical requests
    if (this.pendingRequests.has(cacheKey)) {
      logger.debug('Reusing pending request', { endpoint });
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this._makeRequest(endpoint, {
      method,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout,
      retries,
      ...fetchOptions
    });

    // Store pending request
    if (cacheKey) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    try {
      const result = await requestPromise;
      
      // Cache successful responses
      if (cache && result) {
        this.cache.set(cacheKey, result);
        // Auto-expire cache after 5 minutes
        setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      }
      
      return result;
    } finally {
      // Clean up pending request
      if (cacheKey) {
        this.pendingRequests.delete(cacheKey);
      }
    }
  }

  async _makeRequest(endpoint, options) {
    const { timeout, retries, ...fetchOptions } = options;
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(endpoint, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        if (attempt < retries && this._shouldRetry(error)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn('Request failed, retrying', { 
            endpoint, 
            attempt: attempt + 1, 
            delay,
            error: error.message 
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    logger.error('Request failed after all retries', { 
      endpoint, 
      error: lastError.message 
    });
    throw lastError;
  }

  _shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'AbortError' ||
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('HTTP 5')
    );
  }

  // Clear all caches
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// Singleton API client
export const apiClient = new APIClient();

// Optimized file upload with progress tracking
export const uploadFile = async (file, onProgress) => {
  const timer = logger.startTimer('file-upload');
  
  try {
    // Process file based on type
    let processedFile;
    if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
      processedFile = await convertHeicToJpeg(file);
    } else {
      processedFile = await compressImage(file);
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', processedFile, 'image.jpg');

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      };
      
      xhr.onload = () => {
        timer.end('File upload completed');
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        timer.end('File upload failed');
        reject(new Error('Network error during upload'));
      };
      
      xhr.ontimeout = () => {
        timer.end('File upload timed out');
        reject(new Error('Upload timed out'));
      };
      
      xhr.open('POST', '/api/upload');
      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });
  } catch (error) {
    timer.end('File upload preparation failed');
    throw error;
  }
};

// Prediction polling with smart intervals
export const pollPrediction = async (predictionId, onUpdate) => {
  const timer = logger.startTimer('prediction-polling');
  let attempts = 0;
  const maxAttempts = 90; // 3 minutes max
  
  while (attempts < maxAttempts) {
    try {
      const prediction = await apiClient.request(`/api/predictions/${predictionId}`);
      
      if (onUpdate) {
        onUpdate(prediction);
      }
      
      if (prediction.status === 'succeeded' || prediction.status === 'failed') {
        timer.end('Prediction polling completed');
        return prediction;
      }
      
      // Progressive delay: start fast, then slow down
      const delay = attempts < 10 ? 1000 : attempts < 30 ? 2000 : 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
      
    } catch (error) {
      logger.warn('Polling attempt failed', { 
        predictionId, 
        attempt: attempts,
        error: error.message 
      });
      
      // Continue polling even if one request fails
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
  }
  
  timer.end('Prediction polling timed out');
  throw new Error('Prediction polling timed out');
};

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure and log page load metrics
  measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.getEntriesByType('navigation')[0];
          logger.info('Page load metrics', {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
          });
        }, 0);
      });
    }
  },

  getFirstPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  },

  getFirstContentfulPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  },

  // Measure component render time
  measureRender(componentName, renderFn) {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    logger.debug('Component render time', {
      component: componentName,
      renderTime: end - start
    });
    
    return result;
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitor.measurePageLoad();
}

// Error boundary utility for React components
export const withErrorBoundary = (Component, fallback) => {
  return class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      logger.error('Component error caught', {
        error: error.message,
        stack: error.stack,
        errorInfo
      });
    }

    render() {
      if (this.state.hasError) {
        return fallback || <div>Something went wrong.</div>;
      }

      return <Component {...this.props} />;
    }
  };
};

// Local storage utilities with error handling
export const storage = {
  get(key, defaultValue = null) {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
    } catch (error) {
      logger.warn('LocalStorage get failed', { key, error: error.message });
    }
    return defaultValue;
  },

  set(key, value) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      logger.warn('LocalStorage set failed', { key, error: error.message });
    }
    return false;
  },

  remove(key) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
        return true;
      }
    } catch (error) {
      logger.warn('LocalStorage remove failed', { key, error: error.message });
    }
    return false;
  }
}; 
