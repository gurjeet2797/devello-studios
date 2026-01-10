/**
 * Image Compression Utility
 * Provides functions for compressing images on the client side
 * Optimizes images for storage, transfer, and display
 */

/**
 * Compress a base64 data URL image
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {number} maxWidth - Maximum width in pixels (default: 1280)
 * @param {number} maxHeight - Maximum height in pixels (default: 1280)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export const compressDataUrl = (dataUrl, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        } else {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG (smaller than PNG) with quality setting
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

/**
 * Compress a File object
 * @param {File} file - File object to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 1280)
 * @param {number} maxHeight - Maximum height in pixels (default: 1280)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export const compressFile = (file, maxWidth = 1280, maxHeight = 1280, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      compressDataUrl(e.target.result, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(reject);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Calculate the size of a base64 data URL in MB
 * @param {string} dataUrl - Base64 data URL
 * @returns {number} Size in MB
 */
export const calculateImageSize = (dataUrl) => {
  if (!dataUrl) return 0;
  // Remove data URL prefix to get just the base64 data
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  // Base64 encoding increases size by ~33%, so we calculate the actual size
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB;
};

/**
 * Standard compression for storage (1280x1280, quality 0.7)
 * @param {string} dataUrl - Base64 data URL
 * @returns {Promise<string>} Compressed base64 data URL
 */
export const compressImageForStorage = (dataUrl) => {
  return compressDataUrl(dataUrl, 1280, 1280, 0.7);
};

/**
 * Compression for display (smaller sizes for thumbnails/list views)
 * @param {string} dataUrl - Base64 data URL
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - JPEG quality 0-1 (default: 0.8 for better quality in thumbnails)
 * @returns {Promise<string>} Compressed base64 data URL
 */
export const compressImageForDisplay = (dataUrl, maxWidth, maxHeight, quality = 0.8) => {
  return compressDataUrl(dataUrl, maxWidth, maxHeight, quality);
};

