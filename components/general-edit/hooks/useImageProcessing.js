import { useCallback } from 'react';
import { getSupabase } from '../../../lib/supabaseClient';
import { fixImageOrientation, compressImage } from '../../../lib/imageUtils';
import { processMobileImage, isHeicFile, handleMobileError } from '../../../lib/mobileImageUtils';
import { recordUpload } from '../../../lib/uploadStats';
import { calculateContainerDimensions, isMobileViewport } from '../../../lib/imageContainerUtils';

export const useImageProcessing = (updateState, user, setUserData) => {
  
  
  // Handle file upload and processing
  const handleFileChange = useCallback(async (event, onShowPaymentModal) => {
    const file = event.target?.files?.[0];
    if (!file) {
      console.log('⚠️ [FILE_UPLOAD] No file in event');
      return;
    }

    // Validate file
    if (!file.type && !file.name) {
      console.error('❌ [FILE_UPLOAD] Invalid file object');
      updateState({ 
        processError: 'Invalid file. Please select a valid image file.',
        isUploading: false 
      });
      return;
    }

    console.log('📤 [FILE_UPLOAD] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown'
    });

    // No upload limits - apps work without restrictions


    // Simple file detection log
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Reset state before starting upload
    updateState({
      isUploading: true,
      processError: null,
      upscaleError: null,
      processedSrc: null,
      showEnhanced: false,
      imageReady: false,
      isPreparingPreview: false,
      originalImageForComparison: null,
      editHotspots: [],
      hotspotCounter: 1,
      uploadId: null,
      processingImageUrl: null
    });

    // helper to read image dimensions from a File/Blob
    const getDimsFromFile = (blob) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to read image dimensions'));
      img.src = URL.createObjectURL(blob);
    });

    // helper to read image dimensions from URL
    const getDimsFromUrl = (url) => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to read image dimensions'));
      img.src = url;
    });

    try {
      let processedFile = file;

      // Log original image size & dimensions
      try {
        const { width, height } = await getDimsFromFile(file);
        console.log('Original image details:', {
          name: file.name,
          type: file.type || 'unknown',
          sizeBytes: file.size,
          sizeMB: (file.size / (1024 * 1024)).toFixed(2),
          width,
          height
        });
      } catch {}
      
      // Standardized image processing for all uploads
      
      try {
        // Create a standardized JPEG for all images (including HEIC)
        let standardizedBlob;
        
        // Debug file detection
        console.log('File detection debug:', {
          name: file.name,
          type: file.type,
          size: file.size,
          nameLower: file.name.toLowerCase(),
          endsWithHeic: file.name.toLowerCase().endsWith(".heic"),
          endsWithHeif: file.name.toLowerCase().endsWith(".heif"),
          includesHeic: file.name.toLowerCase().includes("heic"),
          includesHeif: file.name.toLowerCase().includes("heif"),
          typeEmpty: file.type === "",
          typeJpeg: file.type === "image/jpeg"
        });
        
        const isHeicFile = file.type === "image/heic" || file.type === "image/heif" || 
            file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") ||
            (file.type === "" && (file.name.toLowerCase().includes("heic") || file.name.toLowerCase().includes("heif"))) ||
            (file.type === "image/jpeg" && (file.name.toLowerCase().includes("heic") || file.name.toLowerCase().includes("heif"))) ||
            // Additional HEIF/HEIC detection for iPhone 17 Pro Max
            file.type === "image/heic-sequence" || file.type === "image/heif-sequence" ||
            file.name.toLowerCase().includes("heif") || file.name.toLowerCase().includes("heic");
        
        console.log('HEIC file detection:', {
          isHeicFile,
          detectionReasons: {
            typeHeic: file.type === "image/heic",
            typeHeif: file.type === "image/heif", 
            typeHeicSequence: file.type === "image/heic-sequence",
            typeHeifSequence: file.type === "image/heif-sequence",
            endsWithHeic: file.name.toLowerCase().endsWith(".heic"),
            endsWithHeif: file.name.toLowerCase().endsWith(".heif"),
            includesHeic: file.name.toLowerCase().includes("heic"),
            includesHeif: file.name.toLowerCase().includes("heif"),
            emptyTypeWithHeic: file.type === "" && file.name.toLowerCase().includes("heic"),
            emptyTypeWithHeif: file.type === "" && file.name.toLowerCase().includes("heif"),
            jpegTypeWithHeic: file.type === "image/jpeg" && file.name.toLowerCase().includes("heic"),
            jpegTypeWithHeif: file.type === "image/jpeg" && file.name.toLowerCase().includes("heif")
          }
        });
        
        // Mobile device detection
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isHeicFile) {
          
          // Use mobile-optimized processing for mobile devices
          if (isMobileDevice) {
            try {
              const processedFile = await processMobileImage(file);
              standardizedBlob = processedFile;
            } catch (mobileError) {
              console.warn('⚠️ [MOBILE_HEIF] Mobile processing failed, falling back to standard processing:', mobileError);
              // Fallback to standard processing
              try {
                // Try heic2any first (works for most HEIC files)
                const heic2any = (await import("heic2any")).default;
                
                const jpegBlob = await heic2any({
                  blob: file,
                  toType: "image/jpeg",
                  quality: 0.85,
                  multiple: false,
                  orientation: true
                });
                console.log('HEIC conversion result:', {
                  resultType: typeof jpegBlob,
                  isArray: Array.isArray(jpegBlob),
                  blobSize: jpegBlob?.size,
                  blobType: jpegBlob?.type
                });
                
                standardizedBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
              } catch (heic2anyError) {
                console.warn('⚠️ [HEIC_DEBUG] heic2any failed, trying heic-to library:', heic2anyError.message);
                try {
                  // Fallback to heic-to library (better HEIF support)
                  const { heicTo } = await import("heic-to");
                  
                  const jpegBlob = await heicTo({
                    blob: file,
                    type: "image/jpeg",
                    quality: 0.85
                  });
                  console.log('HEIC-to conversion result:', {
                    resultType: typeof jpegBlob,
                    blobSize: jpegBlob?.size,
                    blobType: jpegBlob?.type
                  });
                  
                  standardizedBlob = jpegBlob;
                } catch (heicToError) {
                  console.error('❌ [HEIC_DEBUG] Both heic2any and heic-to failed:', {
                    heic2anyError: heic2anyError.message,
                    heicToError: heicToError.message
                  });
                  throw new Error(`HEIF/HEIC conversion failed: ${heicToError.message}. Please convert your image to JPEG or PNG format first.`);
                }
              }
            }
          } else {
            // Desktop processing
            try {
              // Try heic2any first (works for most HEIC files)
              const heic2any = (await import("heic2any")).default;
              
              const jpegBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.85,
                multiple: false,
                orientation: true
              });
              console.log('HEIC2any conversion result:', {
                resultType: typeof jpegBlob,
                isArray: Array.isArray(jpegBlob),
                blobSize: jpegBlob?.size,
                blobType: jpegBlob?.type
              });
              
              standardizedBlob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
            } catch (heic2anyError) {
              console.warn('⚠️ [HEIC_DEBUG] heic2any failed, trying heic-to library:', heic2anyError.message);
              try {
                // Fallback to heic-to library (better HEIF support)
                const { heicTo } = await import("heic-to");
                
                const jpegBlob = await heicTo({
                  blob: file,
                  type: "image/jpeg",
                  quality: 0.85
                });
                console.log('HEIC-to fallback result:', {
                  resultType: typeof jpegBlob,
                  blobSize: jpegBlob?.size,
                  blobType: jpegBlob?.type
                });
                
                standardizedBlob = jpegBlob;
              } catch (heicToError) {
                console.error('❌ [HEIC_DEBUG] Both heic2any and heic-to failed:', {
                  heic2anyError: heic2anyError.message,
                  heicToError: heicToError.message
                });
                throw new Error(`HEIF/HEIC conversion failed: ${heicToError.message}. Please convert your image to JPEG or PNG format first.`);
              }
            }
          }
          
        } else {
          // Convert other formats (JPEG, PNG, WebP) to standardized JPEG
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                // Set canvas to image dimensions
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // Draw image to canvas (preserves orientation)
                ctx.drawImage(img, 0, 0);
                
                // Convert to standardized JPEG blob
                canvas.toBlob((blob) => {
                  if (blob) {
                    standardizedBlob = blob;
                    resolve();
                  } else {
                    reject(new Error('Failed to create standardized JPEG'));
                  }
                }, 'image/jpeg', 0.85);
                
              } catch (e) {
                reject(e);
              }
            };
            img.onerror = () => reject(new Error('Failed to load image for standardization'));
            img.src = URL.createObjectURL(file);
          });
        }
        
        if (!standardizedBlob || standardizedBlob.size === 0) {
          throw new Error("Image standardization failed - empty result");
        }
        
        // Create standardized JPEG file
        const standardizedFileName = file.name
          .replace(/\.(heic|heif|png|webp)$/i, '.jpg')
          .replace(/\.(jpeg|jpg)$/i, '.jpg');
          
        processedFile = new File([standardizedBlob], standardizedFileName, {
          type: 'image/jpeg',
          lastModified: file.lastModified
        });
        
        // Log standardized image size & dimensions
        try {
              const { width, height } = await getDimsFromFile(processedFile);
              console.log('Standardized image details:', {
                originalName: file.name,
                originalType: file.type,
                standardizedName: processedFile.name,
                standardizedType: processedFile.type,
                originalSizeMB: (file.size / (1024 * 1024)).toFixed(2),
                standardizedSizeMB: (processedFile.size / (1024 * 1024)).toFixed(2),
                width,
                height
              });
        } catch {}

        
      } catch (standardizationError) {
        console.error('❌ Image standardization failed:', standardizationError.message);
        throw new Error(`Image processing failed: ${standardizationError.message}. Please try a different image.`);
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', processedFile);

      // Upload file to our backend with mobile-optimized retry logic
      
      const { mobileUploadUtils } = await import('../../../lib/mobileUploadUtils');
      
      // Prepare mobile upload
      await mobileUploadUtils.prepareMobileUpload(processedFile);
      
      // Upload with retry logic
      const uploadResult = await mobileUploadUtils.uploadWithRetry(formData, '/api/upload');
      
      // Store the uploadId for processing completion tracking
      if (uploadResult.uploadId) {
        updateState({ uploadId: uploadResult.uploadId });
      }
      
      // Record upload using centralized system
      try {
        await recordUpload({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'image/jpeg', // Default to JPEG if type is empty
          uploadType: 'general-edit',
          predictionId: uploadResult.uploadId
        });
      } catch (error) {
        console.error('❌ [GENERAL_EDIT] Error recording upload:', error);
        // Continue processing even if recording fails
      }
      
      // Store original image for comparison using the uploaded URL (persistent)
      updateState({ originalImageForComparison: uploadResult.url });
      
      // Create preview URL for display (preserves orientation)
      const previewUrl = URL.createObjectURL(processedFile);
      
      // Determine container size based on actual image dimensions, fitting within viewport
      const img = new Image();
      img.onload = () => {
        // Calculate optimal container dimensions using shared utility
        const newDims = calculateContainerDimensions(img, isMobile, { maxHeightMultiplier: 0.85 });

        console.log('Container dimensions calculated:', {
          image: { width: img.naturalWidth, height: img.naturalHeight },
          container: newDims
        });

        // Set both container dimensions for smooth transitions
        updateState({
          containerDims: newDims,
          stableContainerDims: newDims
        });
        
        // Mobile-only: prepare container first, then mount image next frame to avoid flicker
        const mobileViewport = isMobileViewport();
        if (mobileViewport) {
          updateState({ isPreparingPreview: true });
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              updateState({
                originalSrc: previewUrl,
                imageReady: true,
                isPreparingPreview: false,
                editHotspots: [],
                hotspotCounter: 1
              });
            });
          });
        } else {
          updateState({
            imageReady: true,
            originalSrc: previewUrl,
            editHotspots: [],
            hotspotCounter: 1
          });
        }
      };
      img.src = previewUrl;
      
      // Store upload URL for processing (separate from display)
      updateState({ processingImageUrl: uploadResult.url });
      
      
    } catch (error) {
      console.error('❌ [UPLOAD_ERROR] Upload error:', error);
      const errorMessage = error?.message || 'Failed to upload image. Please try again.';
      updateState({ 
        isUploading: false,
        processError: errorMessage,
        imageReady: false,
        originalSrc: null,
        processingImageUrl: null
      });
    } finally {
      // Ensure uploading state is cleared even if there was an error
      updateState({ isUploading: false });
    }
  }, [updateState, user, setUserData]);

  return {
    handleFileChange
  };
};
