import { createSupabaseClient } from './supabaseClient';

/**
 * Direct upload service to bypass Vercel function limits
 */
export class DirectUploadService {
  constructor() {
    this.supabase = createSupabaseClient();
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Upload file directly to Supabase storage
   */
  async uploadFile(file, bucket = 'images') {
    try {
      console.log('📤 [DIRECT_UPLOAD] Starting direct upload to Supabase...');
      
      // Validate file size
      if (file.size > this.maxFileSize) {
        throw new Error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB (max: ${this.maxFileSize / (1024 * 1024)}MB)`);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${randomId}.${fileExtension}`;

      console.log('📤 [DIRECT_UPLOAD] Uploading file:', {
        originalName: file.name,
        fileName,
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2),
        type: file.type
      });

      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ [DIRECT_UPLOAD] Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      console.log('✅ [DIRECT_UPLOAD] Upload successful:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: data.path,
        size: file.size,
        type: file.type
      };

    } catch (error) {
      console.error('❌ [DIRECT_UPLOAD] Upload failed:', error);
      throw error;
    }
  }

  /**
   * Check if direct upload is needed (file size > 10MB)
   */
  shouldUseDirectUpload(file) {
    // Always use direct upload for better performance and reliability
    // This bypasses Vercel function limits and improves upload speed
    return true;
  }

  /**
   * Get upload method recommendation
   */
  getUploadMethod(file) {
    if (this.shouldUseDirectUpload(file)) {
      return {
        method: 'direct',
        reason: 'File too large for Vercel functions',
        size: file.size,
        sizeMB: (file.size / (1024 * 1024)).toFixed(2)
      };
    }
    return {
      method: 'api',
      reason: 'File size within Vercel limits',
      size: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  }
}

// Singleton instance
export const directUploadService = new DirectUploadService();

export default directUploadService;
