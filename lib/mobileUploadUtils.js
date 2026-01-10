import { mobileSessionUtils } from './sessionManager';
import { mobileDebugger } from './mobileDebugger';
import { directUploadService } from './directUploadService';

/**
 * Mobile-specific upload utilities with retry logic
 */
export class MobileUploadUtils {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Upload with mobile-optimized retry logic
   */
  async uploadWithRetry(formData, endpoint = '/api/upload', retries = 0) {
    try {
      console.log(`📱 [MOBILE_UPLOAD] Upload attempt ${retries + 1}/${this.maxRetries + 1}`);
      
      // Get mobile-optimized auth headers
      const headers = await mobileSessionUtils.getMobileAuthHeaders();
      const isMobile = mobileSessionUtils.isMobileDevice();
      
      // Log upload attempt with debugging
      const file = formData.get('file');
      mobileDebugger.logUploadAttempt(file, headers, isMobile);
      
      console.log('📱 [MOBILE_UPLOAD] Auth headers status:', {
        hasAuth: !!headers.Authorization,
        isMobile
      });

      // Always use direct upload for better performance and reliability
      console.log('📤 [DIRECT_UPLOAD] Using direct upload (prioritized for all files)');
      const result = await directUploadService.uploadFile(file);
      
      // Log successful direct upload
      mobileDebugger.logUploadResult(true, null, { status: 200 });
      
      return {
        success: true,
        url: result.url,
        fileName: result.fileName,
        uploadId: `direct-${Date.now()}`,
        method: 'direct'
      };

    } catch (error) {
      console.error(`❌ [MOBILE_UPLOAD] Upload error (attempt ${retries + 1}):`, error.message);
      
      // Log upload failure
      mobileDebugger.logUploadResult(false, error);
      
      // If it's a 413 error and we haven't tried direct upload yet, try direct upload
      if (error.message.includes('413') && retries === 0) {
        console.log('🔄 [MOBILE_UPLOAD] 413 error detected, trying direct upload...');
        try {
          const file = formData.get('file');
          const result = await directUploadService.uploadFile(file);
          
          console.log('✅ [DIRECT_UPLOAD] Fallback direct upload successful');
          mobileDebugger.logUploadResult(true, null, { status: 200 });
          
          return {
            success: true,
            url: result.url,
            fileName: result.fileName,
            uploadId: `direct-fallback-${Date.now()}`,
            method: 'direct-fallback'
          };
        } catch (directError) {
          console.error('❌ [DIRECT_UPLOAD] Fallback also failed:', directError);
        }
      }
      
      if (retries < this.maxRetries) {
        console.log(`🔄 [MOBILE_UPLOAD] Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.uploadWithRetry(formData, endpoint, retries + 1);
      }
      
      throw error;
    }
  }

  /**
   * Check if we should retry based on error type
   */
  shouldRetry(error, response) {
    // Retry on network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true;
    }
    
    // Retry on auth errors (session might not be ready)
    if (response && (response.status === 401 || response.status === 403)) {
      return true;
    }
    
    // Retry on server errors
    if (response && response.status >= 500) {
      return true;
    }
    
    return false;
  }

  /**
   * Mobile-specific upload preparation
   */
  async prepareMobileUpload(file) {
    const isMobile = mobileSessionUtils.isMobileDevice();
    
    if (isMobile) {
      console.log('📱 [MOBILE_PREP] Preparing mobile upload...');
      
      // Add small delay for mobile browsers
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if session is likely available
      const { sessionManager } = await import('./sessionManager');
      if (!sessionManager.isSessionLikelyAvailable()) {
        console.log('📱 [MOBILE_PREP] Session not ready, waiting...');
        try {
          await sessionManager.waitForSession(3000);
        } catch (error) {
          console.warn('⚠️ [MOBILE_PREP] Session wait timeout, proceeding anyway');
        }
      }
    }
    
    return file;
  }
}

// Singleton instance
export const mobileUploadUtils = new MobileUploadUtils();

export default mobileUploadUtils;
