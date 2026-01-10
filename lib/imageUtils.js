// Image utility functions for handling EXIF orientation and other image processing

/**
 * Disabled orientation fix - returning original file to test default behavior
 * @param {File} file - The image file to fix
 * @returns {Promise<File>} - The original image file (no processing)
 */
export const fixImageOrientation = async (file) => {
  return new Promise(async (resolve) => {
    // Get device and image info for debugging
    const img = new Image();
    
    img.onload = async () => {
      const deviceInfo = getDeviceInfo();
      const imageInfo = getImageInfo(img, file);
      const orientation = await getOrientation(file);
      
      // Only log in development mode
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
        console.log({
          file: file.name,
          exifOrientation: orientation,
          deviceInfo,
          imageInfo,
          processingDisabled: true,
          note: 'Returning original file to test default browser behavior'
        });
        
      }
      resolve(file); // Return original file without any processing
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get comprehensive device information
 */
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  return {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/i.test(ua),
    isIPad: /iPad/.test(ua),
    isIPhone: /iPhone/.test(ua),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  };
};

/**
 * Get comprehensive image information
 */
const getImageInfo = (img, file) => {
  const aspectRatio = img.width / img.height;
  return {
    width: img.width,
    height: img.height,
    aspectRatio,
    isPortrait: img.height > img.width,
    isLandscape: img.width > img.height,
    isSquare: Math.abs(aspectRatio - 1) < 0.1,
    fileSize: file.size,
    fileName: file.name,
    fileType: file.type,
    isLargeImage: img.width > 2000 || img.height > 2000,
    isPhotoRatio: Math.abs(aspectRatio - 4/3) < 0.1 || Math.abs(aspectRatio - 3/4) < 0.1 || 
                   Math.abs(aspectRatio - 16/9) < 0.1 || Math.abs(aspectRatio - 9/16) < 0.1
  };
};

/**
 * Determine if orientation processing is needed
 */
const shouldProcessOrientation = (orientation, deviceInfo, imageInfo) => {
  // Always process if EXIF orientation is not normal (1)
  if (orientation !== 1) return true;
  
  // For mobile devices, check for common problematic scenarios
  if (deviceInfo.isMobile) {
    // Skip processing for images that are clearly already correct
    if (imageInfo.isLandscape && deviceInfo.screenWidth > deviceInfo.screenHeight) {
      return false; // Landscape image on landscape-oriented device
    }
    if (imageInfo.isPortrait && deviceInfo.screenHeight > deviceInfo.screenWidth) {
      return false; // Portrait image on portrait-oriented device
    }
  }
  
  return false; // Default to no processing for orientation 1
};

/**
 * Get smart orientation based on device and image analysis
 */
const getSmartOrientation = (exifOrientation, deviceInfo, imageInfo) => {
  // If EXIF orientation is not 1, trust it
  if (exifOrientation !== 1) {
    return exifOrientation;
  }
  
  // For mobile devices with orientation 1, apply smart detection
  if (deviceInfo.isMobile && imageInfo.isPortrait) {
    // Check if this looks like a mobile photo that needs rotation
    if (deviceInfo.isIOS && imageInfo.isLargeImage && imageInfo.isPhotoRatio) {
      // iOS sometimes strips EXIF but images still need rotation
      return 6; // 90° clockwise
    }
  }
  
  return exifOrientation; // Default to original orientation
};

/**
 * Apply orientation transformation to canvas
 */
const applyOrientationTransform = (ctx, canvas, img, orientation) => {
  let { width, height } = img;
  
  // Set canvas dimensions based on orientation
  if (orientation > 4) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }
  
  // Apply transformation based on orientation
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      break;
  }
  
  ctx.drawImage(img, 0, 0);
};

/**
 * Get EXIF orientation from image file with enhanced error handling
 * @param {File} file - The image file to read
 * @returns {Promise<number>} - The EXIF orientation value (1-8)
 */
export const getOrientation = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        
        // Check for JPEG signature
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1);
          return;
        }
        
        const length = view.byteLength;
        let offset = 2;
        
        while (offset < length) {
          if (offset + 2 > length) break;
          
          const marker = view.getUint16(offset, false);
          offset += 2;
          
          if (marker === 0xFFE1) {
            if (offset + 6 > length) break;
            if (view.getUint32(offset += 2, false) !== 0x45786966) {
              resolve(1);
              return;
            }
            
            if (offset + 10 > length) break;
            const little = view.getUint16(offset += 6, false) === 0x4949;
            offset += view.getUint32(offset + 4, little);
            
            if (offset + 2 > length) break;
            const tags = view.getUint16(offset, little);
            offset += 2;
            
            for (let i = 0; i < tags; i++) {
              if (offset + (i * 12) + 12 > length) break;
              if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                const orientationValue = view.getUint16(offset + (i * 12) + 8, little);
                resolve(orientationValue);
                return;
              }
            }
          } else if ((marker & 0xFF00) !== 0xFF00) {
            break;
          } else {
            if (offset + 2 > length) break;
            offset += view.getUint16(offset, false);
          }
        }
        
        resolve(1);
      } catch (error) {
        console.warn('📱 Error reading EXIF data:', error);
        resolve(1); // Default to no rotation
      }
    };
    reader.onerror = () => {
      console.warn('📱 FileReader error, defaulting to orientation 1');
      resolve(1);
    };
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
  });
};

/**
 * Compress image for better upload performance
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width for the compressed image
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} - The compressed image blob
 */
export const compressImage = (file, maxWidth = 1920, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // High-quality resize
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}; 
