// Create a version of the original that matches the final upscaled canvas size (cover, no bars)
export const createMatchedOriginal = async (originalUrl, targetWidth, targetHeight) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Try with CORS first, fallback to no CORS if it fails
    img.crossOrigin = 'anonymous';
    
    const handleLoad = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        // Use "cover" scaling to fill entire target dimensions without letterboxing
        // This ensures perfect alignment with processed images
        const scale = Math.max(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
        const newWidth = Math.round(img.naturalWidth * scale);
        const newHeight = Math.round(img.naturalHeight * scale);
        const x = Math.round((targetWidth - newWidth) / 2);
        const y = Math.round((targetHeight - newHeight) / 2);

        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, newWidth, newHeight);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create matched original blob'));
            return;
          }
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/jpeg', 0.95);
      } catch (e) {
        reject(e);
      }
    };
    
    const handleError = () => {
      // If CORS fails, try without CORS
      if (img.crossOrigin === 'anonymous') {
        img.crossOrigin = null;
        img.onload = handleLoad;
        img.onerror = () => reject(new Error('Failed to load original image for matching (CORS and non-CORS both failed)'));
        img.src = originalUrl;
      } else {
        reject(new Error('Failed to load original image for matching'));
      }
    };
    
    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = originalUrl;
  });
};
