import { useCallback } from 'react';
import { getSupabase } from '../../../lib/supabaseClient';
import { fixImageOrientation, compressImage } from '../../../lib/imageUtils';
import { processMobileImage, isHeicFile, handleMobileError } from '../../../lib/mobileImageUtils';
import { convertHeicToJpeg } from '../../../lib/clientUtils';
import { recordUpload } from '../../../lib/uploadStats';
import { calculateContainerDimensions, isMobileViewport } from '../../../lib/imageContainerUtils';

export const useAssistedImageProcessing = (updateState, user, setUserData) => {
  
  // Generate image caption using Florence-2 (assisted-edit only) - optimized
  const generateImageCaption = useCallback(async (imageUrl) => {
    try {
      updateState({ isCaptionPending: true });
      
      // Reduced timeout to 30 seconds for faster failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 second timeout for faster response
      
      const response = await fetch('/api/image-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Caption generation failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Single state update with both caption and pending status
      updateState({ 
        imageCaption: result.caption, 
        isCaptionPending: false 
      });
      
      return result.caption;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ [ASSISTED_EDIT] Caption generation timed out after 30 seconds');
      } else {
        console.error('❌ [ASSISTED_EDIT] Failed to generate image caption:', error);
      }
      // Single state update to clear pending status
      updateState({ isCaptionPending: false });
      return null;
    }
  }, [updateState]);
  
  // Handle file upload and processing for assisted-edit
  const handleFileChange = useCallback(async (event, onShowPaymentModal) => {
    const file = event.target.files[0];
    if (!file) return;

    // No upload limits - apps work without restrictions


    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    updateState({
      isUploading: true,
      processError: null,
      upscaleError: null,
      originalSrc: null,
      processedSrc: null,
      showEnhanced: false,
      imageReady: false,
      isPreparingPreview: false,
      originalImageForComparison: null
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

      // Standardized image processing for all uploads
      
      try {
        // Create a standardized JPEG for all images (including HEIC)
        let standardizedBlob;
        
        // Mobile device detection
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (file.type === "image/heic" || file.type === "image/heif" || 
            file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") ||
            (file.type === "" && (file.name.toLowerCase().includes("heic") || file.name.toLowerCase().includes("heif"))) ||
            (file.type === "image/jpeg" && file.name.toLowerCase().includes("heic"))) {
          
          // Use mobile-optimized processing for mobile devices
          if (isMobileDevice) {
            try {
              const processedFile = await processMobileImage(file);
              standardizedBlob = processedFile;
            } catch (mobileError) {
              console.warn('⚠️ [ASSISTED_MOBILE_HEIF] Mobile processing failed, falling back to standard processing:', mobileError);
              // Fallback to standard processing
              standardizedBlob = await convertHeicToJpeg(file);
            }
          } else {
            // Convert HEIC to standardized JPEG using centralized utility
            standardizedBlob = await convertHeicToJpeg(file);
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
          fileType: file.type,
          uploadType: 'assisted-edit',
          predictionId: uploadResult.uploadId
        });
      } catch (error) {
        console.error('❌ [ASSISTED_EDIT] Error recording upload:', error);
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
        // Use 0.6 multiplier to leave space for chat interface
        const newDims = calculateContainerDimensions(img, isMobile, { maxHeightMultiplier: 0.6 });

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
      
      // Generate image caption in background (non-blocking) using the public URL
      generateImageCaption(uploadResult.url).catch(error => {
        console.error('❌ [ASSISTED_EDIT] Caption generation failed:', error);
        // Don't block the upload process if caption fails
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      updateState({ processError: 'Failed to upload image. Please try again.' });
    } finally {
      updateState({ isUploading: false });
    }
  }, [updateState, user, setUserData, generateImageCaption]);

  return {
    handleFileChange,
    generateImageCaption
  };
};
