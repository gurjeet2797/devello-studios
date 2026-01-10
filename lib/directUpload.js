// Client-side direct upload utility for large files
export class DirectUploader {
  static async uploadFile(file) {
    const fileSize = file.size;
    const maxVercelSize = 4.5 * 1024 * 1024; // 4.5MB - Vercel limit
    
    
    // Use direct upload for files over 4MB
    if (fileSize > maxVercelSize) {
      return await this.directSupabaseUpload(file);
    } else {
      return await this.standardUpload(file);
    }
  }

  static async directSupabaseUpload(file) {
    try {
      
      // Step 1: Get signed URL from our API
      const urlResponse = await fetch('/api/upload-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json();
        throw new Error(errorData.message || 'Failed to get upload URL');
      }

      const { uploadUrl, publicUrl, fileName } = await urlResponse.json();
      

      // Step 2: Upload file directly to Supabase
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Cache-Control': '3600',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Direct upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }


      return {
        url: publicUrl,
        path: fileName,
        message: 'File uploaded successfully via direct upload',
        uploadMethod: 'direct'
      };

    } catch (error) {
      console.error('❌ [DIRECT_UPLOAD] Direct upload failed:', error);
      throw new Error(`Direct upload failed: ${error.message}`);
    }
  }

  static async standardUpload(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await response.json();
      return {
        ...result,
        uploadMethod: 'standard'
      };
    } catch (error) {
      console.error('❌ [DIRECT_UPLOAD] Standard upload failed:', error);
      throw error;
    }
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 
