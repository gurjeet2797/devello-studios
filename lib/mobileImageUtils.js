import config from './config.js';

/**
 * Mobile-optimized image utilities for HEIC support and touch interactions
 */

// HEIC/HEIF MIME types
const HEIC_MIME_TYPES = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence'
];

// Check if file is HEIC/HEIF (both formats)
export const isHeicOrHeifFile = (file) => {
  // Check MIME type first
  if (HEIC_MIME_TYPES.includes(file.type)) {
    return true;
  }
  
  // Check filename extensions
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
    return true;
  }
  
  // Check if filename contains HEIF/HEIC (for cases where extension might be missing)
  if (fileName.includes('heif') || fileName.includes('heic')) {
    return true;
  }
  
  // Check if file type is empty but filename suggests HEIF/HEIC
  if (!file.type || file.type === '') {
    if (fileName.includes('heif') || fileName.includes('heic')) {
      return true;
    }
  }
  
  return false;
};

// Check if file is from iPhone 17 Pro Max (specific HEIF handling needed)
export const isIPhone17ProMaxHEIF = (file) => {
  const userAgent = navigator.userAgent;
  const isIPhone17ProMax = /iPhone.*17.*Pro.*Max/i.test(userAgent) || 
                          /iPhone.*17.*Pro/i.test(userAgent);
  
  const isHEIF = file.type === 'image/heif' || 
                 file.type === 'image/heif-sequence' ||
                 file.name.toLowerCase().endsWith('.heif') ||
                 file.name.toLowerCase().includes('heif');
  
  return isIPhone17ProMax && isHEIF;
};

// Mobile-optimized file validation
export const validateMobileFile = (file) => {
  const errors = [];
  
  // Debug file information
  const fileAnalysis = {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    // Additional debugging for HEIF detection
    nameLower: file.name.toLowerCase(),
    hasHeifInName: file.name.toLowerCase().includes('heif'),
    hasHeicInName: file.name.toLowerCase().includes('heic'),
    endsWithHeif: file.name.toLowerCase().endsWith('.heif'),
    endsWithHeic: file.name.toLowerCase().endsWith('.heic')
  };
  
  console.log('📱 [MOBILE_HEIF] File analysis:', JSON.stringify(fileAnalysis, null, 2));
  console.log('🔍 [FILE_DEBUG] Raw file object:', JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    webkitRelativePath: file.webkitRelativePath,
    constructor: file.constructor.name
  }, null, 2));
  
  // Check file size for mobile
  const maxSize = config.mobile.optimization ? 
    config.upload.mobile.maxFileSize : 
    config.upload.maxFileSize;
    
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`);
  }
  
  // Check file type
  const allowedTypes = config.upload.allowedMimeTypes;
  const isHeic = isHeicOrHeifFile(file);
  
  const detectionDetails = {
    allowedTypes,
    fileType: file.type,
    isHeic,
    fileName: file.name,
    // Detailed detection breakdown
    mimeTypeMatch: HEIC_MIME_TYPES.includes(file.type),
    nameExtensionMatch: file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif'),
    nameContainsMatch: file.name.toLowerCase().includes('heif') || file.name.toLowerCase().includes('heic'),
    emptyTypeCheck: (!file.type || file.type === '') && (file.name.toLowerCase().includes('heif') || file.name.toLowerCase().includes('heic'))
  };
  
  console.log('📱 [MOBILE_HEIF] File type detection:', JSON.stringify(detectionDetails, null, 2));
  console.log('🔍 [DETECTION_DEBUG] Step-by-step detection:', JSON.stringify({
    step1_mimeType: HEIC_MIME_TYPES.includes(file.type),
    step2_extension: file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif'),
    step3_contains: file.name.toLowerCase().includes('heif') || file.name.toLowerCase().includes('heic'),
    step4_emptyType: (!file.type || file.type === '') && (file.name.toLowerCase().includes('heif') || file.name.toLowerCase().includes('heic')),
    finalResult: isHeic
  }, null, 2));
  
  if (!allowedTypes.includes(file.type) && !isHeic) {
    errors.push('File type not supported');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    isHeic
  };
};

// Mobile-optimized image processing
export const processMobileImage = async (file) => {
  console.log('📱 [MOBILE_HEIF] Starting mobile image processing...');
  
  const validation = validateMobileFile(file);
  
  if (!validation.isValid) {
    console.error('❌ [MOBILE_HEIF] File validation failed:', validation.errors);
    throw new Error(validation.errors.join(', '));
  }
  
  // Safari detection for HEIC conversion
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isHeicFile = validation.isHeic;
  
  console.log('🔍 [SAFARI_DETECTION] Browser info:', JSON.stringify({
    userAgent: navigator.userAgent,
    isSafari,
    isHeicFile,
    fileName: file.name,
    fileType: file.type
  }, null, 2));
  
  // Safari-specific HEIC conversion using heic2any
  if (isSafari && isHeicFile) {
    console.log('🍎 [SAFARI_HEIC] Safari detected with HEIC file - applying heic2any conversion...');
    try {
      const heic2any = (await import("heic2any")).default;
      const jpegBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.85,
        multiple: false,
        orientation: true
      });
      
      const convertedFile = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
      const processedFile = new File([convertedFile], 
        file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
        { type: 'image/jpeg' }
      );
      
      console.log('✅ [SAFARI_HEIC] HEIC conversion successful');
      console.log('🔍 [SAFARI_CONVERSION_DEBUG] Converted file properties:', JSON.stringify({
        originalName: file.name,
        originalType: file.type,
        originalSize: file.size,
        convertedName: processedFile.name,
        convertedType: processedFile.type,
        convertedSize: processedFile.size
      }, null, 2));
      
      // Apply normalization to the converted file
      const normalizedFile = await normalizeImageBlob(processedFile, config.upload.mobile.compressionQuality);
      console.log('✅ [SAFARI_HEIC] Normalization applied to converted file');
      return normalizedFile;
      
    } catch (heic2anyError) {
      console.warn('⚠️ [SAFARI_HEIC] HEIC conversion failed, falling back to normalization:', heic2anyError.message);
      // Fallback to normalization
      try {
        const normalizedFile = await normalizeImageBlob(file, config.upload.mobile.compressionQuality);
        console.log('✅ [SAFARI_HEIC] Fallback normalization successful');
        return normalizedFile;
      } catch (normalizationError) {
        console.warn('⚠️ [SAFARI_HEIC] Fallback normalization failed, returning original file:', normalizationError.message);
        return file;
      }
    }
  }
  
  // Non-Safari or non-HEIC files: Apply universal normalization
  console.log('🔄 [MOBILE_HEIF] Applying universal image normalization...');
  console.log('🔍 [NORMALIZATION_DEBUG] File properties before normalization:', JSON.stringify({
    name: file.name,
    type: file.type,
    size: file.size,
    isHeic: validation.isHeic,
    isSafari
  }, null, 2));
  
  try {
    const normalizedFile = await normalizeImageBlob(file, config.upload.mobile.compressionQuality);
    console.log('✅ [MOBILE_HEIF] Image normalization completed successfully');
    return normalizedFile;
  } catch (normalizationError) {
    console.warn('⚠️ [MOBILE_HEIF] Image normalization failed, returning original file:', normalizationError.message);
    return file;
  }
};

// Convert HEIC to JPEG using browser APIs with mobile optimizations
export const convertHeicToJpeg = async (file) => {
  try {
    console.log('📱 [MOBILE_HEIF] Starting mobile HEIF conversion...');
    
    // Use same processing logic as desktop for consistency
    
    // Use the same processing logic as desktop (heic2any + heic-to fallback)
    try {
      console.log('📱 [MOBILE_HEIF] Attempting heic2any conversion...');
      const heic2any = (await import("heic2any")).default;
      
      const jpegBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: config.upload.mobile.compressionQuality,
        multiple: false,
        orientation: true // This is crucial for iPhone 17 Pro Max HEIF
      });
      
      const finalBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
      console.log('✅ [MOBILE_HEIF] heic2any conversion successful');
      
      return new File([finalBlob], 
        file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
        { type: 'image/jpeg' }
      );
    } catch (heic2anyError) {
      console.warn('⚠️ [MOBILE_HEIF] heic2any failed, trying heic-to library:', heic2anyError.message);
      try {
        // Fallback to heic-to library (same as desktop)
        console.log('📱 [MOBILE_HEIF] Attempting heic-to conversion...');
        const { heicTo } = await import("heic-to");
        console.log('📱 [MOBILE_HEIF] heic-to imported successfully');
        
        const jpegBlob = await heicTo({
          blob: file,
          type: "image/jpeg",
          quality: config.upload.mobile.compressionQuality
        });
        
        console.log('📱 [MOBILE_HEIF] heic-to conversion result:', {
          resultType: typeof jpegBlob,
          blobSize: jpegBlob?.size,
          blobType: jpegBlob?.type
        });
        
        console.log('✅ [MOBILE_HEIF] heic-to conversion successful');
        
        return new File([jpegBlob], 
          file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
          { type: 'image/jpeg' }
        );
      } catch (heicToError) {
        console.error('❌ [MOBILE_HEIF] Both heic2any and heic-to failed:', {
          heic2anyError: heic2anyError.message,
          heicToError: heicToError.message
        });
        console.warn('⚠️ [MOBILE_HEIF] Falling back to canvas method...');
        
        // Fallback to canvas method with mobile optimizations
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        return new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              // Mobile-optimized dimensions
              const maxDimension = config.upload.mobile.maxDimensions;
              let { width, height } = img;

              // Resize if needed (mobile memory optimization)
              if (width > maxDimension || height > maxDimension) {
                const ratio = Math.min(maxDimension / width, maxDimension / height);
                width *= ratio;
                height *= ratio;
              }

              // Set canvas size with mobile memory limits
              canvas.width = Math.min(width, 2048);
              canvas.height = Math.min(height, 2048);

              // Draw with mobile-optimized settings
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              // Convert to blob with mobile compression
              canvas.toBlob((blob) => {
                if (blob) {
                  const convertedFile = new File([blob],
                    file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                    { type: 'image/jpeg' }
                  );
                  console.log('✅ [MOBILE_HEIF] Canvas conversion successful');
                  resolve(convertedFile);
                } else {
                  reject(new Error('Canvas conversion failed - no blob created'));
                }
              }, 'image/jpeg', config.upload.mobile.compressionQuality);
            } catch (canvasError) {
              console.error('❌ [MOBILE_HEIF] Canvas conversion failed:', canvasError);
              reject(new Error(`Mobile HEIF conversion failed: ${canvasError.message}`));
            }
          };

          img.onerror = (error) => {
            console.error('❌ [MOBILE_HEIF] Image load failed:', error);
            reject(new Error('Failed to load HEIC image on mobile device'));
          };
          
          // Load image with mobile-optimized settings
          const url = URL.createObjectURL(file);
          img.crossOrigin = 'anonymous';
          img.src = url;
        });
      }
    }
  } catch (error) {
    console.error('❌ [MOBILE_HEIF] All conversion methods failed:', error);
    // Return original file as last resort
    return file;
  }
};

// Touch-optimized file upload handling
export const createTouchUploadHandler = (onFileSelect, onProgress) => {
  return {
    // Handle touch file selection
    handleTouchSelect: (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    
    // Handle drag and drop for touch devices
    handleTouchDrop: (event) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    
    // Handle touch drag over
    handleTouchDragOver: (event) => {
      event.preventDefault();
    },
    
    // Create touch-optimized upload area
    createTouchArea: (element) => {
      element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Add visual feedback
        element.style.opacity = '0.7';
      });
      
      element.addEventListener('touchend', (e) => {
        e.preventDefault();
        element.style.opacity = '1';
        // Trigger file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = config.upload.allowedMimeTypes.join(',') + ',.heic,.heif';
        input.onchange = (event) => onFileSelect(event.target.files[0]);
        input.click();
      });
    }
  };
};

// Mobile performance monitoring
export const mobilePerformanceMonitor = {
  startTime: null,
  
  start: () => {
    mobilePerformanceMonitor.startTime = performance.now();
  },
  
  end: (operation) => {
    if (mobilePerformanceMonitor.startTime) {
      const duration = performance.now() - mobilePerformanceMonitor.startTime;
      console.log(`Mobile ${operation} took ${duration.toFixed(2)}ms`);
      
      // Log to analytics if available
      if (config.mobile.enableDebug) {
        console.log(`Performance: ${operation} - ${duration.toFixed(2)}ms`);
      }
      
      mobilePerformanceMonitor.startTime = null;
    }
  }
};

// Mobile-specific error handling
export const handleMobileError = (error, context) => {
  const mobileError = {
    message: error.message,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  };
  
  if (config.mobile.enableDebug) {
    console.error('Mobile Error:', mobileError);
  }
  
  return mobileError;
};


// Auto-converted HEIF orientation correction
// Normalize an image File/Blob to upright pixels with EXIF stripped
export const normalizeImageBlob = async (file, quality = 0.92) => {
  try {
    console.log('🔄 [IMAGE_NORMALIZATION] Normalizing image to upright pixels with EXIF stripped...');
    
    // 1) Read as Object URL
    const url = URL.createObjectURL(file);
    try {
      // 2) Decode with orientation applied if metadata exists
      //    (from-image respects EXIF when present, or draws as-is if EXIF missing)
      const imgBitmap = await createImageBitmap(await fetch(url).then(r => r.blob()), {
        imageOrientation: 'from-image'
      });

      // 3) Draw to canvas at decoded (upright) dimensions
      const canvas = document.createElement('canvas');
      canvas.width = imgBitmap.width;
      canvas.height = imgBitmap.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      ctx.drawImage(imgBitmap, 0, 0);

      // 4) Export to JPEG — canvas export strips EXIF entirely
      return await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const normalizedFile = new File([blob], 
              file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
              { type: 'image/jpeg' }
            );
            console.log('✅ [IMAGE_NORMALIZATION] Image normalized successfully');
            console.log('🔍 [NORMALIZATION_DEBUG] Original vs Normalized:', JSON.stringify({
              original: {
                name: file.name,
                type: file.type,
                size: file.size
              },
              normalized: {
                name: normalizedFile.name,
                type: normalizedFile.type,
                size: normalizedFile.size
              }
            }, null, 2));
            resolve(normalizedFile);
          } else {
            reject(new Error('Failed to create normalized image blob'));
          }
        }, 'image/jpeg', quality);
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('❌ [IMAGE_NORMALIZATION] Image normalization failed:', error);
    // Return original file if normalization fails
    return file;
  }
};

// iPhone 17 Pro Max specific orientation correction
export const applyIPhone17OrientationCorrection = async (blob, originalFile) => {
  try {
    console.log('📱 [IPHONE17_CORRECTION] Applying iPhone 17 Pro Max orientation correction...');
    
    // Create a canvas to apply orientation correction
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          // iPhone 17 Pro Max HEIF files often need 90-degree counter-clockwise rotation
          const { width, height } = img;
          
          // Set canvas dimensions (swap for rotation)
          canvas.width = height;
          canvas.height = width;
          
          // Apply 90-degree counter-clockwise rotation
          ctx.translate(height, 0);
          ctx.rotate(-Math.PI / 2);
          
          // Draw the image
          ctx.drawImage(img, 0, 0);
          
          // Convert back to blob
          canvas.toBlob((correctedBlob) => {
            if (correctedBlob) {
              const correctedFile = new File([correctedBlob], 
                originalFile.name.replace(/\.(heic|heif)$/i, '.jpg'), 
                { type: 'image/jpeg' }
              );
              console.log('✅ [IPHONE17_CORRECTION] Orientation correction applied successfully');
              resolve(correctedFile);
            } else {
              reject(new Error('Failed to create corrected image blob'));
            }
          }, 'image/jpeg', config.upload.mobile.compressionQuality);
        } catch (error) {
          console.error('❌ [IPHONE17_CORRECTION] Canvas correction failed:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ [IPHONE17_CORRECTION] Image load failed:', error);
        reject(new Error('Failed to load image for orientation correction'));
      };
      
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error('❌ [IPHONE17_CORRECTION] Orientation correction failed:', error);
    // Return original blob as fallback
    return new File([blob], 
      originalFile.name.replace(/\.(heic|heif)$/i, '.jpg'), 
      { type: 'image/jpeg' }
    );
  }
};

// Export mobile utilities
const mobileImageUtils = {
  isHeicOrHeifFile,
  isHeicFile: isHeicOrHeifFile, // Backward compatibility
  isIPhone17ProMaxHEIF,
  validateMobileFile,
  processMobileImage,
  convertHeicToJpeg,
  normalizeImageBlob,
  applyIPhone17OrientationCorrection,
  createTouchUploadHandler,
  mobilePerformanceMonitor,
  handleMobileError
};

export default mobileImageUtils;
