import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import ImageContainer from './ImageContainer';
import ImageProcessor from './ImageProcessor';
import LightingInterface from './LightingInterface';
import { useAuth } from '../auth/AuthProvider';
import CentralizedUploadCounter from '../CentralizedUploadCounter';
// AuthModal and PaymentOptionsModal moved to parent page
import { getSupabase } from '../../lib/supabaseClient';
import { useToolState } from '../contexts/ToolStateManager';
import { ToolStateContext } from '../contexts/ToolStateManager';
import GlobalBackground from '../GlobalBackground';

export default function LightingStudio({ 
  onShowPaymentModal, 
  onShowBillingModal,
  onShowAuthModal, 
  onDirectPayment,
  userData: propUserData = null
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState(propUserData);
  // Modal state removed - handled by parent page
  
  // Use tool state manager for lighting tool
  const {
    originalSrc,
    processedSrc,
    upscaledImage,
    processingImageUrl,
    showEnhanced,
    imageReady,
    showEditFlow,
    processError,
    upscaleError,
    originalImageForComparison,
    containerDims,
    stableContainerDims,
    uploadId,
    isUploading,
    isProcessing,
    editCount,
    updateState,
    updateActivity,
    markUploadAsProcessed,
    startLightingPolling,
    stopLightingPolling,
    incrementEditCount,
    getEditCount,
    canEdit
  } = useToolState('lighting');

  // Store the original standardized image for consistent processing
  const [originalStandardizedImage, setOriginalStandardizedImage] = useState(null);
  
  // Store the last edit prompt/change for filename generation
  const [lastEditPrompt, setLastEditPrompt] = useState(null);
  
  // Preserve original standardized image reference - never overwrite once set
  const preserveOriginalStandardizedImage = useCallback((newUrl) => {
    if (!originalStandardizedImage) {
      setOriginalStandardizedImage(newUrl);
    }
  }, [originalStandardizedImage]);
  
  // Reset original standardized image when starting over
  const resetOriginalStandardizedImage = useCallback(() => {
    setOriginalStandardizedImage(null);
  }, []);

  
  // Get tool-specific background state from context
  const { updateToolBackgroundState } = React.useContext(ToolStateContext);
  
  // Sync userData from prop
  useEffect(() => {
    if (propUserData !== null) {
      setUserData(propUserData);
    }
  }, [propUserData]);
  
  // Track activity for the tool state manager
  useEffect(() => {
    updateActivity();
  }, []); // Only run once on mount

  // Update tool-specific background state when image state changes
  useEffect(() => {
    const hasImage = !!originalSrc;
    updateToolBackgroundState('lighting', hasImage);
  }, [originalSrc, updateToolBackgroundState]);

  // Handle tab visibility changes to prevent state corruption
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - preserve current state
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔍 [LIGHTING] Tab hidden, preserving state');
        }
      } else {
        // Tab is visible again - refresh state if needed
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔍 [LIGHTING] Tab visible, refreshing state');
        }
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateActivity]);

  // Handle Stripe redirect parameters for single upload purchases
  useEffect(() => {
    const { payment } = router.query;
    
    if (payment === 'success') {
      // Single upload purchase was successful
      if (process.env.NODE_ENV !== 'production') {
        console.log('Single upload purchase successful');
      }
      // Clean up URL - parent will handle userData refresh
      router.replace(router.pathname, undefined, { shallow: true });
    } else if (payment === 'canceled') {
      // Single upload purchase was canceled
      if (process.env.NODE_ENV !== 'production') {
        console.log('Single upload purchase canceled');
      }
      // Clean up URL
      router.replace(router.pathname, undefined, { shallow: true });
    }
  }, [router.query, router]);

  // Responsive breakpoints - SSR safe
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Set mobile/tablet state after component mounts
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Set initial container dimensions based on screen size
  useEffect(() => {
    const updateInitialSize = () => {
      // Only update dimensions if no image is loaded
      if (!originalSrc) {
        const mobile = window.innerWidth < 768;
        const initialDims = {
          width: mobile ? '80vw' : '500px',
          height: mobile ? '40vh' : '300px'
        };
        updateState({
          containerDims: initialDims,
          stableContainerDims: initialDims
        });
      }
    };
    
    updateInitialSize();
    window.addEventListener('resize', updateInitialSize);
    return () => window.removeEventListener('resize', updateInitialSize);
  }, [originalSrc]); // Remove updateState to prevent infinite re-renders

  // Get valid HTTP/HTTPS image URL for processing (exclude blob URLs)
  const getValidProcessingImageUrl = useCallback(() => {
    const isValidUrl = (url) => url && (url.startsWith('http://') || url.startsWith('https://'));
    
    // Priority: originalStandardizedImage > processingImageUrl > processedSrc > upscaledImage
    // Skip originalSrc as it's often a blob URL which Replicate can't access
    if (isValidUrl(originalStandardizedImage)) return originalStandardizedImage;
    if (isValidUrl(processingImageUrl)) return processingImageUrl;
    if (isValidUrl(processedSrc)) return processedSrc;
    if (isValidUrl(upscaledImage)) return upscaledImage;
    
    // Last resort: use originalSrc only if it's a valid HTTP URL
    if (isValidUrl(originalSrc)) return originalSrc;
    
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ [LIGHTING] No valid HTTP image URL found for processing', {
        originalStandardizedImage,
        processingImageUrl,
        processedSrc,
        upscaledImage,
        originalSrc
      });
    }
    return null;
  }, [originalStandardizedImage, processingImageUrl, processedSrc, upscaledImage, originalSrc]);

  // Image processor hook
  const {
    isUpscaling: rawIsUpscaling,
    lightingOptions,
    processImage: originalProcessImage,
    handleUpscale,
    createMatchedOriginal
  } = ImageProcessor({
    // Use valid HTTP/HTTPS image URL for processing (excludes blob URLs)
    processingImageUrl: getValidProcessingImageUrl(),
    parentIsProcessing: isProcessing, // Pass the parent's processing state
    incrementEditCount: incrementEditCount, // Pass edit count increment function
    onProcessingStart: () => {
      updateState({ isProcessing: true, isUpscaling: false });
    },
    onProcessingComplete: (result) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ [DEVELLO_STUDIO] Processing complete, resetting state');
      }
      // Batch all related state updates into one call
      // Note: lastEditPrompt is already set by the wrapped processImage function
      updateState({
        processedSrc: result,
        // Don't update processingImageUrl - keep using original standardized image
        showEnhanced: true,
        isProcessing: false,  // Explicitly reset processing state
        isUpscaling: false,
        showEditFlow: false  // Keep interface hidden until user clicks edit again
      });
      updateActivity();
    },
    onUpscaleStart: () => {
      // Keep processedSrc and showEnhanced true during upscaling so processed image stays visible
      updateState({ 
        isUpscaling: true,
        showEnhanced: true // Ensure processed image remains visible during upscaling
      });
    },
    onProcessingError: (error) => {
      // Batch error state updates
      updateState({ 
        processError: error,
        isProcessing: false,
        isUpscaling: false
      });
      updateActivity();
    },
    onUpscaleComplete: (result) => {
      // Add comprehensive debugging for upscaled image
      const analyzeUpscaledImage = async (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const isHeifFile = originalStandardizedImage?.includes('heif') || originalStandardizedImage?.includes('heic');
            
            const imageInfo = {
              url: url,
              originalStandardizedImage: originalStandardizedImage,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3),
              isPortrait: img.naturalHeight > img.naturalWidth,
              isLandscape: img.naturalWidth > img.naturalHeight,
              isSquare: img.naturalWidth === img.naturalHeight,
              isMobile: isMobileDevice,
              isHeifFile: isHeifFile,
              timestamp: new Date().toISOString()
            };
            
            resolve(imageInfo);
          };
          img.onerror = () => {
            resolve(null);
          };
          img.src = url;
        });
      };
      
      // Analyze the upscaled image
      analyzeUpscaledImage(result);
      
      // Log upscaled image size
      if (process.env.NODE_ENV !== 'production') {
        console.log('📏 [UPSCALE] Upscaled image completed:', {
          upscaledImageUrl: result,
          originalStandardizedImage: originalStandardizedImage
        });
      }
      
      // Resize container for upscaled image if needed
      const img = new Image();
      img.onload = () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📏 [UPSCALE] Upscaled image dimensions:', {
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3)
          });
        }
        const currentWidth = parseInt(stableContainerDims.width);
        const currentHeight = parseInt(stableContainerDims.height);
        const maxWidth = Math.floor(window.innerWidth * 0.95);
        const maxHeight = Math.floor(window.innerHeight * 0.85);
        
        // Only resize if current container is smaller than viewport limits
        if (currentWidth < maxWidth && currentHeight < maxHeight) {
          const widthScale = maxWidth / img.naturalWidth;
          const heightScale = maxHeight / img.naturalHeight;
          const scale = Math.min(widthScale, heightScale);
          const newW = Math.floor(img.naturalWidth * scale);
          const newH = Math.floor(img.naturalHeight * scale);
          
          // Only update if the new size is significantly different (prevents micro-adjustments)
          if (Math.abs(newW - currentWidth) > 10 || Math.abs(newH - currentHeight) > 10) {
            const newDims = { width: `${newW}px`, height: `${newH}px` };
            updateState({
              upscaledImage: result,
              processedSrc: result,
              containerDims: newDims,
              stableContainerDims: newDims,
              showEnhanced: true,
              isProcessing: false,
              isUpscaling: false,
              showEditFlow: false
            });
            if (process.env.NODE_ENV !== 'production') {
              console.log('📐 [LIGHTING] Container resized for upscaled image', { width: newW, height: newH });
            }
          } else {
            updateState({
              upscaledImage: result,
              processedSrc: result,
              showEnhanced: true,
              isProcessing: false,
              isUpscaling: false,
              showEditFlow: false
            });
            if (process.env.NODE_ENV !== 'production') {
              console.log('📐 [LIGHTING] Container size preserved for smooth transition');
            }
          }
        } else {
          updateState({
            upscaledImage: result,
            processedSrc: result,
            showEnhanced: true,
            isProcessing: false,
            isUpscaling: false,
            showEditFlow: false
          });
          if (process.env.NODE_ENV !== 'production') {
            console.log('📐 [LIGHTING] Container size preserved (already at viewport limits)');
          }
        }
        updateActivity();
      };
      img.src = result;
    },
    onUpscaleError: (error) => {
      // Batch error state updates
      updateState({ 
        upscaleError: error,
        isProcessing: false,
        isUpscaling: false
      });
      updateActivity();
    },
    markUploadAsProcessed,
    startLightingPolling
  });

  // Use the actual upscaling state
  const isUpscaling = rawIsUpscaling;


  // Handle image upload
  const handleImageUpload = async (uploadData) => {
    // Check if this is an upscaled/processed image being re-uploaded
    const isUpscaledImage = uploadData.originalFilename && 
      (uploadData.originalFilename.includes('upscaled') || 
       uploadData.originalFilename.includes('enhanced') ||
       uploadData.originalFilename.includes('devello-edited'));
    
    // If it's an upscaled image, preserve the current showEditFlow state
    const shouldShowEditFlow = isUpscaledImage ? showEditFlow : false;
    
    // Add comprehensive debugging for image analysis
    const analyzeImage = async (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          const isHeifFile = url.includes('heif') || url.includes('heic') || uploadData.originalFilename?.includes('heif') || uploadData.originalFilename?.includes('heic');
          const isJpgFile = url.includes('.jpg') || url.includes('.jpeg') || uploadData.originalFilename?.includes('.jpg') || uploadData.originalFilename?.includes('.jpeg');
          
          const imageInfo = {
            url: url,
            originalFilename: uploadData.originalFilename,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3),
            isPortrait: img.naturalHeight > img.naturalWidth,
            isLandscape: img.naturalWidth > img.naturalHeight,
            isSquare: img.naturalWidth === img.naturalHeight,
            fileType: isHeifFile ? 'HEIF' : isJpgFile ? 'JPEG' : 'OTHER',
            isMobile: isMobileDevice,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            isUpscaledImage: isUpscaledImage
          };
          
          resolve(imageInfo);
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = url;
      });
    };
    
    // Analyze the uploaded image
    analyzeImage(uploadData.processingImageUrl);
    
    // Store the original standardized image for consistent processing
    // Only set it if it's not already set (preserve the original reference)
    preserveOriginalStandardizedImage(uploadData.processingImageUrl);
    
    // Log standardized image size after upload
    if (process.env.NODE_ENV !== 'production') {
      console.log('📏 [UPLOAD] Standardized image after upload:', {
        originalSrc: uploadData.originalSrc,
        processingImageUrl: uploadData.processingImageUrl,
        containerDims: uploadData.containerDims,
        originalFilename: uploadData.originalFilename,
        isUpscaledImage: isUpscaledImage
      });
    }
    
    // Batch all upload-related state updates into one call
    updateState({
      originalSrc: uploadData.originalSrc,
      originalImageForComparison: uploadData.originalImageForComparison,
      processingImageUrl: uploadData.processingImageUrl,
      containerDims: uploadData.containerDims,
      stableContainerDims: uploadData.containerDims,
      imageReady: true,
      showEnhanced: false,
      showEditFlow: shouldShowEditFlow, // Preserve edit flow for upscaled images
      processError: null,
      upscaleError: null,
      isUploading: false, // Upload completed
      uploadId: uploadData.uploadId, // Store upload ID for processing completion tracking
      editCount: 0 // Reset edit count for new image
    });
    // Record upload using centralized system
    try {
      const { recordUpload } = await import('../../lib/uploadStats');
      await recordUpload({
        fileName: uploadData.originalFilename || 'lighting-upload.jpg',
        fileSize: uploadData.fileSize || 1024,
        fileType: uploadData.fileType || 'image/jpeg',
        uploadType: 'lighting',
        predictionId: uploadData.uploadId
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ [LIGHTING] Error recording upload:', error);
      }
      // Continue processing even if recording fails
    }
    
    // Track activity when image is uploaded
    updateActivity();
  };

  // Handle upload start
  const handleUploadStart = () => {
    updateState({ isUploading: true });
  };

  // Handle upload error
  const handleUploadError = (error) => {
    updateState({ processError: error, isUploading: false });
  };

  // Handle upload limit reached - disabled, no limits
  const handleUploadLimitReached = () => {
    // No limits - apps work without restrictions
  };

  // Handle auth modal actions

  // Handle start over - robust reset that kills processing
  const handleStartOver = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔄 [RESET] Starting robust reset...');
    }
    
    // Stop any active polling/processing first
    if (isProcessing) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🛑 [RESET] Stopping active processing...');
      }
      stopLightingPolling();
    }
    
    // Reset the original standardized image reference
    resetOriginalStandardizedImage();
    
    // Batch all reset state updates into one call
    updateState({
      originalSrc: null,
      processedSrc: null,
      upscaledImage: null,
      processingImageUrl: null,
      showEnhanced: false,
      imageReady: false,
      showEditFlow: false,
      processError: null,
      upscaleError: null,
      originalImageForComparison: null,
      isProcessing: false,
      isUpscaling: false,
      isUploading: false,
      editCount: 0,
      uploadId: null,
      pollingIntervalId: null
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ [RESET] Reset completed - ready for fresh upload');
    }
  };

  // Handle back to home
  const handleBackToHome = () => {
    router.push('/');
  };

  // Handle edit flow
  const handleStartEditFlow = (show) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 [HANDLE_START_EDIT_FLOW] Called with show:', show, 'Current showEditFlow:', showEditFlow, 'isProcessing:', isProcessing);
    }
    // Ensure processing state is reset when opening edit flow for second edit
    if (show && isProcessing) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️ [HANDLE_START_EDIT_FLOW] isProcessing is still true, resetting it');
      }
      updateState({ 
        showEditFlow: show,
        isProcessing: false  // Explicitly reset if still processing
      });
    } else {
      updateState({ showEditFlow: show });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 [HANDLE_START_EDIT_FLOW] State updated, new showEditFlow should be:', show);
    }
  };

  // Wrap processImage to store lighting type for filename generation
  const processImage = useCallback((lightingType) => {
    // Store the lighting type for filename generation
    setLastEditPrompt(lightingType);
    // Also store in tool state
    updateState({ lastEditPrompt: lightingType });
    // Call original processImage
    return originalProcessImage(lightingType);
  }, [originalProcessImage, updateState]);

  // Generate AI-based filename with prompt
  const generateImageFilename = async (imageUrl, prompt = null) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      const apiPromise = fetch('/api/ai/generate-image-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl,
          prompt: prompt || lastEditPrompt,
          changeDescription: prompt || lastEditPrompt
        }),
      }).then(res => res.json());
      
      const result = await Promise.race([apiPromise, timeoutPromise]);
      return result.filename || 'devello-enhanced-image';
    } catch (error) {
      console.warn('⚠️ Failed to generate AI filename, using default:', error.message);
      // Fallback: create filename from prompt if available
      if (prompt || lastEditPrompt) {
        const promptName = (prompt || lastEditPrompt)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 30);
        return `devello-${promptName}`;
      }
      return `devello-enhanced-${Date.now()}`;
    }
  };

  // Enhanced download/save function with mobile camera roll support
  const handleDownload = async (imageUrl, filename = null) => {
    try {
      // Generate AI-based filename if not provided
      let finalFilename = filename;
      if (!finalFilename) {
        finalFilename = await generateImageFilename(imageUrl, lastEditPrompt);
      }
      
      let blob;
      let extension = 'jpg';
      
      if (imageUrl.startsWith('data:')) {
        // Handle data URL
        const response = await fetch(imageUrl);
        blob = await response.blob();
        
        // Extract MIME type from data URL
        const mimeMatch = imageUrl.match(/data:([^;]+)/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          if (mimeType.includes('png')) extension = 'png';
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
          else if (mimeType.includes('webp')) extension = 'webp';
        }
      } else {
        // Handle regular URL
        const response = await fetch(imageUrl);
        blob = await response.blob();
        
        // Get file extension from URL or default to jpg
        const urlParts = imageUrl.split('.');
        extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
      }
      
      // Check if mobile device
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // For mobile devices, use a simpler approach
      if (isMobileDevice) {
        // Try Web Share API first (most direct path to camera roll)
        if (navigator.share) {
          try {
            const file = new File([blob], `${filename}.${extension}`, { 
              type: blob.type || 'image/jpeg' 
            });
            
            // Check if we can share files
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: 'Save Photo',
                text: 'Save this enhanced photo to your camera roll'
              });
              
              if (process.env.NODE_ENV !== 'production') {
                console.log('✅ Image shared successfully via Web Share API');
              }
              return;
            }
          } catch (shareError) {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Web Share API failed:', shareError);
            }
          }
        }
      }
      
      // Try File System Access API for desktop/Chrome
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: `${filename}.${extension}`,
            types: [{
              description: 'Image file',
              accept: {
                'image/*': [`.${extension}`]
              }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('✅ Image saved to device:', `${filename}.${extension}`);
          }
          return;
        } catch (saveError) {
          // Check if user cancelled the dialog
          if (saveError.name === 'AbortError') {
            if (process.env.NODE_ENV !== 'production') {
              console.log('User cancelled save dialog');
            }
            return; // Don't fall back to download if user cancelled
          }
          if (process.env.NODE_ENV !== 'production') {
            console.log('File System Access failed, falling back to download:', saveError);
          }
        }
      }
      
      // Fallback to regular download (only if File System Access is not available or failed for other reasons)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.${extension}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Download successful:', `${filename}.${extension}`);
      }
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Download failed:', error);
      }
      // Show error message and auto-clear
      updateState({ upscaleError: 'Failed to save image. Please try again.' });
      setTimeout(() => updateState({ upscaleError: null }), 3000);
    }
  };



  return (
    <>
      {/* Global Background - persists across tool switches */}
      <GlobalBackground toolType="lighting" toolId="lighting" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 relative z-10">
        <div className="flex flex-col items-center justify-center w-full min-h-[80vh]">
          <ImageContainer
            originalSrc={originalSrc}
            processedSrc={processedSrc}
            upscaledImage={upscaledImage}
            originalImageForComparison={originalImageForComparison}
            isProcessing={isProcessing}
            isUpscaling={isUpscaling}
            isUploading={isUploading}
            isPreparingPreview={false}
            showEnhanced={showEnhanced}
            imageReady={imageReady}
            showEditFlow={showEditFlow}
            containerDims={containerDims}
            stableContainerDims={stableContainerDims}
            processError={processError}
            upscaleError={upscaleError}
            editCount={editCount}
            canEdit={canEdit('lighting')}
            onStartOver={handleStartOver}
            onBackToHome={handleBackToHome}
            onStartEditFlow={handleStartEditFlow}
            onImageUpload={handleImageUpload}
            onUploadStart={handleUploadStart}
            onUploadError={handleUploadError}
            onUploadLimitReached={handleUploadLimitReached}
            onDownload={handleDownload}
            onUpscale={handleUpscale}
            onShowAuthModal={onShowAuthModal}
            onShowBillingModal={onShowBillingModal}
            onDirectPayment={onDirectPayment}
            onShowPaymentModal={onShowPaymentModal}
            user={user}
            userData={userData}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Lighting Interface - Positioned relative to viewport */}
      <LightingInterface
        isOpen={showEditFlow}
        lightingOptions={lightingOptions}
        onProcessImage={processImage}
        isProcessing={isProcessing}
      />

      {/* Upload Counter - Positioned above footer */}
      <div className="relative w-full flex justify-center z-40 mb-4">
        <CentralizedUploadCounter />
      </div>

      {/* Modals removed - handled by parent page */}
    </>
  );
}



