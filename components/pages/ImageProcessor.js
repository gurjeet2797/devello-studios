import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { createSecureLogger } from '../../lib/secureLogger';

const logger = createSecureLogger('image-processor');

export default function ImageProcessor({ 
  processingImageUrl, 
  parentIsProcessing,
  onProcessingStart,
  onProcessingComplete, 
  onProcessingError,
  onUpscaleStart,
  onUpscaleComplete,
  onUpscaleError,
  markUploadAsProcessed,
  startLightingPolling,
  incrementEditCount
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [pollingTimeout, setPollingTimeout] = useState(null);
  const [isCurrentlyProcessing, setIsCurrentlyProcessing] = useState(false);

  // Cleanup timeouts on unmount or when processing stops
  useEffect(() => {
    return () => {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        setPollingTimeout(null);
      }
    };
  }, [pollingTimeout]);

  // Stop polling when processing stops
  useEffect(() => {
    if (!isProcessing && pollingTimeout) {
      clearTimeout(pollingTimeout);
      setPollingTimeout(null);
    }
  }, [isProcessing, pollingTimeout]);

  // Sync local processing state with parent state
  useEffect(() => {
    if (isProcessing || parentIsProcessing) {
      setIsCurrentlyProcessing(true);
    } else {
      // Explicitly reset when both are false
      setIsCurrentlyProcessing(false);
      console.log('🔄 [IMAGE_PROCESSOR] Reset isCurrentlyProcessing to false', { isProcessing, parentIsProcessing });
    }
  }, [isProcessing, parentIsProcessing]);
  
  // Additional safety: Reset processing state when parentIsProcessing becomes false
  useEffect(() => {
    if (!parentIsProcessing && isCurrentlyProcessing) {
      console.log('🔄 [IMAGE_PROCESSOR] Force reset isCurrentlyProcessing because parentIsProcessing is false');
      setIsCurrentlyProcessing(false);
      setIsProcessing(false);
    }
  }, [parentIsProcessing]);

  // Cleanup timeouts on unmount only - removed problematic state interference

  // Handle tab visibility changes to continue polling when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pollingTimeout && isProcessing) {
        // Don't clear the timeout, just let it continue naturally
        // The polling will resume when the current timeout fires
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pollingTimeout, isProcessing]);

  // Updated lighting options that match our new backend API
  const lightingOptions = [
    { 
      key: 'Dramatic Daylight', 
      label: '☀️ Dramatic Daylight', 
      desc: 'Late-morning with volumetric rays' 
    },
    { 
      key: 'Midday Bright', 
      label: '🌞 Midday Bright', 
      desc: 'Crisp midday sunlight' 
    },
    { 
      key: 'Cozy Evening', 
      label: '🌙 Cozy Evening', 
      desc: 'Soft evening with interior glow' 
    }
  ];

  // Process image with selected lighting
  const processImage = async (lightingType) => {
    console.log('🎨 [LIGHTING] processImage called', { 
      lightingType, 
      hasProcessingImageUrl: !!processingImageUrl,
      isProcessing,
      isCurrentlyProcessing,
      parentIsProcessing
    });
    
    if (!processingImageUrl) {
      console.warn('⚠️ [LIGHTING] No processingImageUrl, aborting');
      return;
    }
    
    // Prevent multiple simultaneous processing - check both local and parent state
    if (isProcessing || isCurrentlyProcessing || parentIsProcessing) {
      console.warn('⚠️ [LIGHTING] Already processing, aborting', { 
        isProcessing, 
        isCurrentlyProcessing,
        parentIsProcessing 
      });
      return;
    }
    
    // console.log('🎨 [LIGHTING] Starting image processing with prompt:', lightingType);
    setIsProcessing(true);
    setIsCurrentlyProcessing(true);
    
    // Increment edit count for lighting tool
    if (incrementEditCount) {
      incrementEditCount('lighting');
    }
    
    // Notify parent component that processing has started
    if (onProcessingStart) {
      onProcessingStart();
    }
    
    try {
      // Retry logic for relight API call
      let response;
      let retryCount = 0;
      const maxRetries = 5; // Increased retries
      
      while (retryCount < maxRetries) {
        try {
          const { apiPost } = await import('../../lib/apiClient');
          response = await apiPost('/api/predictions/relight', {
            image: processingImageUrl,
            lightingType: lightingType
          });
          
          if (response.ok) {
            break;
          }
          
          // Log the error response
          const errorText = await response.text();
          
          if (response.status === 429) {
            // Rate limited, wait and retry with exponential backoff
            retryCount++;
            if (retryCount < maxRetries) {
              const delay = Math.min(retryCount * retryCount * 1000, 10000); // Max 10 seconds
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          // If not 429, throw error immediately
          throw new Error(`Failed to process image: ${response.status} - ${errorText}`);
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries && (error.message.includes('429') || error.message.includes('Failed to process image: 429'))) {
            const delay = Math.min(retryCount * retryCount * 1000, 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to process image after ${maxRetries} attempts`);
      }
      
      const prediction = await response.json();
      
      // Check if prediction already has error status
      if (prediction.status === 'Error' || prediction.status === 'error' || prediction.status === 'failed') {
        const errorMessage = prediction.error || prediction.details || prediction.message || 'Image processing failed. Please try again.';
        console.error('❌ [LIGHTING] Prediction failed immediately:', errorMessage);
        if (onProcessingError) {
          onProcessingError(errorMessage);
        }
        return;
      }
      
      console.log('⏳ [LIGHTING] Image processing started with prompt:', lightingType);
      
      // Use centralized polling from ToolStateManager
      // Note: startLightingPolling from useToolState already has toolId baked in
      if (startLightingPolling) {
        await startLightingPolling(prediction.id, (result, error, shouldUpscale = false) => {
          // Reset internal processing state when centralized polling completes
          console.log('🔄 [LIGHTING] Resetting processing state after completion');
          setIsProcessing(false);
          setIsCurrentlyProcessing(false);
          
          if (error) {
            console.error('❌ [LIGHTING] Processing failed:', error);
            if (onProcessingError) {
              onProcessingError(error);
            }
          } else {
            console.log('✅ [LIGHTING] Processing completed with prompt:', lightingType);
            if (onProcessingComplete) {
              onProcessingComplete(result);
            }
            
            // 🔧 FIX: Dispatch event to trigger upload counter refresh
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('uploadProcessed'));
            }
            
            // Trigger automatic upscaling if requested
            if (shouldUpscale && result) {
              console.log('🔄 [LIGHTING] Starting automatic upscaling after processing completion');
              handleUpscale(result);
            }
          }
        });
      } else {
        // Fallback to local polling if startLightingPolling not available
        let pollCount = 0;
        const maxPolls = 120;
        let isPolling = true;
        
        const pollResult = async () => {
          if (!isPolling || !parentIsProcessing) {
            return;
          }
          
          try {
            const statusResponse = await fetch(`/api/predictions/${prediction.id}`);
            if (!statusResponse.ok) {
              throw new Error(`API call failed: ${statusResponse.status}`);
            }
            
            const status = await statusResponse.json();
            
            if (status.status === 'succeeded' && status.output) {
              isPolling = false;
              if (markUploadAsProcessed) {
                await markUploadAsProcessed(status.id);
              }
              
              // 🔧 FIX: Dispatch event to trigger upload counter refresh
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('uploadProcessed'));
              }
              
              handleUpscale(status.output);
              return;
            }
            
            if (status.status === 'failed') {
              isPolling = false;
              throw new Error('Processing failed');
            }
            
            pollCount++;
            if (pollCount < maxPolls && isPolling && parentIsProcessing) {
              const timeoutId = setTimeout(pollResult, 2000);
              setPollingTimeout(timeoutId);
            } else {
              isPolling = false;
              throw new Error('Processing timeout');
            }
          } catch (error) {
            isPolling = false;
            onProcessingError?.(`Processing failed: ${error.message}`);
            setIsProcessing(false);
            setIsCurrentlyProcessing(false);
          }
        };
        
        const initialTimeoutId = setTimeout(pollResult, 2000);
        setPollingTimeout(initialTimeoutId);
      }
      
    } catch (error) {
      console.error('❌ [PROCESSING_ERROR] Processing failed:', error);
      console.error('❌ [PROCESSING_ERROR] Error message:', error.message);
      console.error('❌ [PROCESSING_ERROR] Error stack:', error.stack);
      onProcessingError?.(`Failed to process image: ${error.message}`);
      // Ensure state is properly reset on error
      console.log('🔄 [STATE_RESET] Resetting processing state after error');
      setIsProcessing(false);
      setIsCurrentlyProcessing(false);
    }
  };

  // Handle image upscaling
  const handleUpscale = async (imageUrl) => {
    if (!imageUrl) return;
    
    console.log('🔄 [UPSCALE] Starting upscale process for:', imageUrl);
    setIsUpscaling(true);
    
    // Notify parent component that upscaling has started
    if (onUpscaleStart) {
      onUpscaleStart();
    }
    
    try {
      // Get original standardized image dimensions to preserve aspect ratio
      // Use the processingImageUrl (original standardized image) instead of the processed image
      const originalStandardizedImg = new Image();
      originalStandardizedImg.crossOrigin = 'anonymous';
      
      const originalDimensions = await new Promise((resolve, reject) => {
        originalStandardizedImg.onload = () => {
          // Mobile device detection for orientation handling
          const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
          const dimensions = {
            width: originalStandardizedImg.naturalWidth,
            height: originalStandardizedImg.naturalHeight,
            aspectRatio: originalStandardizedImg.naturalWidth / originalStandardizedImg.naturalHeight,
            isMobile: isMobileDevice,
            isPortrait: originalStandardizedImg.naturalHeight > originalStandardizedImg.naturalWidth,
            // Add orientation preservation for HEIF files
            preserveOrientation: true,
            originalOrientation: 'preserve'
          };
          
          
          resolve(dimensions);
        };
        originalStandardizedImg.onerror = () => reject(new Error('Failed to load original standardized image'));
        originalStandardizedImg.src = processingImageUrl;
      });
      
      console.log('📏 [UPSCALE] Original standardized image dimensions:', originalDimensions);
      
      // Retry logic for upscale API call
      let response;
      let retryCount = 0;
      const maxRetries = 5; // Increased retries
      
      while (retryCount < maxRetries) {
        try {
          const upscaleParams = { 
            image: imageUrl,
            scale: 2,
            preserveAspectRatio: true,
            preserveOrientation: true,
            originalDimensions: originalDimensions
          };
          
          
          response = await fetch('/api/predictions/upscale', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(upscaleParams),
          });
          
          if (response.ok) {
            break;
          }
          
          if (response.status === 429) {
            // Rate limited, wait and retry with exponential backoff
            retryCount++;
            if (retryCount < maxRetries) {
              const delay = Math.min(retryCount * retryCount * 1000, 10000); // Max 10 seconds
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
          
          // If not 429, throw error immediately
          throw new Error(`Failed to upscale image: ${response.status}`);
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries && (error.message.includes('429') || error.message.includes('Failed to upscale image: 429'))) {
            const delay = Math.min(retryCount * retryCount * 1000, 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to upscale image after ${maxRetries} attempts`);
      }
      
      const result = await response.json();
      
      // Wait for the upscaled image to load with mobile orientation handling
      const img = new Image();
      img.onload = () => {
        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const upscaledIsPortrait = img.naturalHeight > img.naturalWidth;
        
        console.log('🔼 Upscale completed', {
          image: { 
            width: img.naturalWidth, 
            height: img.naturalHeight,
            isPortrait: upscaledIsPortrait
          },
          original: {
            width: originalDimensions.width,
            height: originalDimensions.height,
            isPortrait: originalDimensions.isPortrait
          },
          orientationMatch: upscaledIsPortrait === originalDimensions.isPortrait,
          isMobile: isMobileDevice
        });

        onUpscaleComplete?.(result.output);
        setIsProcessing(false);
        setIsUpscaling(false);
      };
      img.onerror = () => {
        onUpscaleError?.('Failed to load upscaled image. Please try again.');
        setIsProcessing(false);
        setIsUpscaling(false);
      };
      img.src = result.output;
      
    } catch (error) {
      console.error('Upscale error:', error);
      onUpscaleError?.('Failed to upscale image. Please try again.');
      setIsProcessing(false);
      setIsUpscaling(false);
    }
  };

  // Create a version of the original that matches the final upscaled canvas size (cover, no bars)
  const createMatchedOriginal = async (originalUrl, targetWidth, targetHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          // Use "contain" instead of "cover" to preserve entire image without cropping
          const scale = Math.min(targetWidth / img.naturalWidth, targetHeight / img.naturalHeight);
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
      img.onerror = () => reject(new Error('Failed to load original image for matching'));
      img.src = originalUrl;
    });
  };

  return {
    isProcessing,
    isUpscaling,
    lightingOptions,
    processImage,
    handleUpscale,
    createMatchedOriginal
  };
}
