import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { fixImageOrientation, compressImage } from '../../lib/imageUtils';
import { convertHeicToJpeg } from '../../lib/clientUtils';
import { createSecureLogger } from '../../lib/secureLogger';
import { getSupabase } from '../../lib/supabaseClient';
import { useModal } from '../ModalProvider';
import Loader from '../loader';
import GlassSurface from '../GlassSurface';
import { processMobileImage, isHeicFile, handleMobileError } from '../../lib/mobileImageUtils';
import { useToolStateManager } from '../contexts/ToolStateManager';
import { recordUpload } from '../../lib/uploadStats';
import { calculateContainerDimensions, isMobileViewport } from '../../lib/imageContainerUtils';
import { useTheme } from '../Layout';
import CodeInputModal from '../CodeInputModal';

const logger = createSecureLogger('image-uploader');

export default function ImageUploader({ 
  onImageUpload, 
  onUploadStart, 
  onUploadError,
  onUploadLimitReached,
  onShowAuthModal,
  onShowBillingModal,
  onDirectPayment,
  onShowPaymentModal,
  user,
  userData,
  className = "", 
  isMobile = false 
}) {
  // Mobile device detection - client-side only
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobileDevice(isMobile || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, [isMobile]);
  const { isDark } = useTheme();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const fileInputRef = useRef(null);
  const { openPaymentModal } = useModal();
  const toolStateManager = useToolStateManager();
  
  // Get upload stats from ToolStateManager
  const uploadStats = toolStateManager?.getUploadStats?.() || null;
  const remainingUploads = uploadStats?.remaining || 0;
  const planType = uploadStats?.planType || 'free';

  // Cache upload state in localStorage for immediate display
  const [cachedUploadState, setCachedUploadState] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('devello_upload_state');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  // Cache subscription status for immediate button text display
  const [cachedSubscriptionStatus, setCachedSubscriptionStatus] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('devello_subscription_status');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  });

  // Update cache when upload stats change
  useEffect(() => {
    if (uploadStats && typeof window !== 'undefined') {
      const stateToCache = {
        remaining: uploadStats.remaining,
        planType: uploadStats.planType,
        timestamp: Date.now()
      };
      localStorage.setItem('devello_upload_state', JSON.stringify(stateToCache));
      setCachedUploadState(stateToCache);
    }
  }, [uploadStats]);

  // Update cache when subscription status changes
  useEffect(() => {
    if (userData?.subscription && typeof window !== 'undefined') {
      const statusToCache = {
        status: userData.subscription.status,
        planType: userData.subscription.plan_type,
        timestamp: Date.now()
      };
      localStorage.setItem('devello_subscription_status', JSON.stringify(statusToCache));
      setCachedSubscriptionStatus(statusToCache);
    }
  }, [userData?.subscription]);

  // Use cached state if available and recent (within 5 minutes), otherwise use live data
  // For SSR consistency, default to showing upload interface until client-side data loads
  const [displayRemainingUploads, setDisplayRemainingUploads] = useState(1);
  
  useEffect(() => {
    if (cachedUploadState && Date.now() - cachedUploadState.timestamp < 5 * 60 * 1000) {
      setDisplayRemainingUploads(cachedUploadState.remaining);
    } else {
      setDisplayRemainingUploads(remainingUploads);
    }
  }, [cachedUploadState, remainingUploads]);

  // Determine button text using cached subscription status
  const getButtonText = () => {
    // Use cached subscription status if available and recent
    if (cachedSubscriptionStatus && Date.now() - cachedSubscriptionStatus.timestamp < 5 * 60 * 1000) {
      const hasActiveSubscription = cachedSubscriptionStatus.status === 'active' || cachedSubscriptionStatus.status === 'canceled';
      return hasActiveSubscription ? 'Manage Subscription' : 'Subscribe Now';
    }
    
    // Fallback to live data
    if (userData?.subscription) {
      const hasActiveSubscription = userData.subscription.status === 'active' || userData.subscription.status === 'canceled';
      return hasActiveSubscription ? 'Manage Subscription' : 'Subscribe Now';
    }
    
    // Default to Subscribe Now if no subscription data
    return 'Subscribe Now';
  };

  // Determine message text based on subscription status
  const getMessageText = () => {
    // Use cached subscription status if available and recent
    if (cachedSubscriptionStatus && Date.now() - cachedSubscriptionStatus.timestamp < 5 * 60 * 1000) {
      const hasActiveSubscription = cachedSubscriptionStatus.status === 'active' || cachedSubscriptionStatus.status === 'canceled';
      return hasActiveSubscription ? 'Please upgrade or request for more sessions' : 'Subscribe to get up to 60 sessions per month';
    }
    
    // Fallback to live data
    if (userData?.subscription) {
      const hasActiveSubscription = userData.subscription.status === 'active' || userData.subscription.status === 'canceled';
      return hasActiveSubscription ? 'Please upgrade or request for more sessions' : 'Subscribe to get up to 60 sessions per month';
    }
    
    // Default message for free users
    return 'Subscribe to get up to 60 sessions per month';
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // No upload limits - apps work without restrictions

    // Call onUploadStart immediately to show overlay
    onUploadStart?.();
    setIsUploading(true);

    try {
      let processedFile = file;

      // Standardized image processing for all uploads
      
      try {
        // Create a standardized JPEG for all images (including HEIC)
        let standardizedBlob;
        
        // HEIC file detection (same logic as general edit tool)
        const isHeicFile = file.type === "image/heic" || file.type === "image/heif" || 
            file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") ||
            (file.type === "" && (file.name.toLowerCase().includes("heic") || file.name.toLowerCase().includes("heif"))) ||
            (file.type === "image/jpeg" && (file.name.toLowerCase().includes("heic") || file.name.toLowerCase().includes("heif"))) ||
            // Additional HEIF/HEIC detection for iPhone 17 Pro Max
            file.type === "image/heic-sequence" || file.type === "image/heif-sequence" ||
            file.name.toLowerCase().includes("heif") || file.name.toLowerCase().includes("heic");
        
        console.log('HEIC file detection:', {
          isHeicFile,
          fileName: file.name,
          fileType: file.type,
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
        
        if (isHeicFile) {
          // Use mobile-optimized processing for mobile devices
          if (isMobileDevice) {
          console.log('📱 [MOBILE_HEIF] Using mobile-optimized HEIF processing');
          console.log('🔍 [UPLOAD_DEBUG] Original file before mobile processing:', JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          }, null, 2));
          
          try {
            const processedFile = await processMobileImage(file);
            standardizedBlob = processedFile;
            console.log('✅ [MOBILE_HEIF] Mobile processing successful');
            console.log('🔍 [UPLOAD_DEBUG] Processed file after mobile processing:', JSON.stringify({
              name: processedFile.name,
              type: processedFile.type,
              size: processedFile.size,
              lastModified: processedFile.lastModified
            }, null, 2));
          } catch (mobileError) {
            console.warn('⚠️ [MOBILE_HEIF] Mobile processing failed, falling back to standard processing:', mobileError);
            // Fallback to standard processing
            standardizedBlob = await convertHeicToJpeg(file);
          }
        } else {
          // Desktop processing - comprehensive HEIC conversion with fallbacks
          console.log('🖥️ [DESKTOP_HEIF] Using comprehensive HEIC conversion for desktop');
          console.log('🔍 [UPLOAD_DEBUG] Original file before desktop processing:', JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
          }, null, 2));
          
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
            console.log('✅ [DESKTOP_HEIF] heic2any conversion successful');
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
              console.log('✅ [DESKTOP_HEIF] heic-to conversion successful');
            } catch (heicToError) {
              console.error('❌ [HEIC_DEBUG] Both heic2any and heic-to failed:', {
                heic2anyError: heic2anyError.message,
                heicToError: heicToError.message
              });
              throw new Error(`HEIF/HEIC conversion failed: ${heicToError.message}. Please convert your image to JPEG or PNG format first.`);
            }
          }
          
          console.log('✅ [DESKTOP_HEIF] Desktop HEIC conversion successful');
          console.log('🔍 [UPLOAD_DEBUG] Processed file after desktop conversion:', JSON.stringify({
            name: standardizedBlob.name,
            type: standardizedBlob.type,
            size: standardizedBlob.size,
            lastModified: standardizedBlob.lastModified
          }, null, 2));
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
      const { mobileUploadUtils } = await import('../../lib/mobileUploadUtils');
      
      // Prepare mobile upload
      await mobileUploadUtils.prepareMobileUpload(processedFile);
      
      // Upload with retry logic
      const uploadResult = await mobileUploadUtils.uploadWithRetry(formData, '/api/upload');
      
      // Store the uploadId for later processing completion tracking
      const uploadId = uploadResult.uploadId;
      
      // Upload recording is handled by the calling component
      // No need to record here to avoid double counting
      
      // Store original image for comparison (before any conversion)
      const originalImageUrl = URL.createObjectURL(file);
      
      // Create preview URL for display (preserves orientation)
      const previewUrl = URL.createObjectURL(processedFile);
      
      // Determine container size based on actual image dimensions, fitting within viewport
      const img = new Image();
      img.onload = async () => {
        // Calculate optimal container dimensions using shared utility
        const newDims = calculateContainerDimensions(img, isMobile, { maxHeightMultiplier: 0.85 });

        // Mobile-only: prepare container first, then mount image next frame to avoid flicker
        const mobileViewport = isMobileViewport();
        if (mobileViewport) {
          setIsPreparingPreview(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              onImageUpload({
                originalSrc: previewUrl,
                originalImageForComparison: originalImageUrl,
                processingImageUrl: uploadResult.url,
                uploadId: uploadId,
                containerDims: newDims,
                originalFilename: file.name,
                fileSize: file.size,
                fileType: file.type
              });
              setIsPreparingPreview(false);
            });
          });
        } else {
          onImageUpload({
            originalSrc: previewUrl,
            originalImageForComparison: originalImageUrl,
            processingImageUrl: uploadResult.url,
            uploadId: uploadId,
            containerDims: newDims,
            originalFilename: file.name,
            fileSize: file.size,
            fileType: file.type
          });
        }
        
        // Upload recording is handled by the calling hook (useAssistedImageProcessing or useImageProcessing)
        // No need to record here to avoid double counting
      };
      img.src = previewUrl;
      
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError?.(error.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to read image dimensions from a File/Blob
  const getDimsFromFile = (blob) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to read image dimensions'));
    img.src = URL.createObjectURL(blob);
  });

  const triggerFileSelect = () => fileInputRef.current?.click();

  // Payment handler for app-level modal
  const handleOneTimePurchase = async () => {
    try {
      // Get session token for authenticated users
      const supabase = getSupabase();
      let headers = {
        'Content-Type': 'application/json',
      };
      
      if (user && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      }

      // Get guest session ID for guest users
      let guestSessionId = null;
      if (!user) {
        guestSessionId = localStorage.getItem('devello_guest_session');
        if (!guestSessionId) {
          guestSessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('devello_guest_session', guestSessionId);
        }
      }

      // Create Stripe checkout session for one-time purchase
      const response = await fetch('/api/payments/create-single-upload-session', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          success_url: `${window.location.origin}${window.location.pathname}?payment=success`,
          cancel_url: `${window.location.origin}${window.location.pathname}?payment=canceled`,
          sessionId: guestSessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { sessionId, url } = await response.json();
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('One-time purchase error:', error);
      onUploadError?.('Failed to process payment. Please try again.');
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Upload Placeholder */}
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={32}
        brightness={0}
        opacity={0}
        backgroundOpacity={0}
        blur={0}
        displace={35}
        distortionScale={-300}
        redOffset={15}
        greenOffset={25}
        blueOffset={35}
        mixBlendMode="screen"
        className={`group transition-all duration-300 ${
          displayRemainingUploads === 0 ? 'cursor-default' : 'cursor-pointer hover:opacity-90'
        }`}
        style={{
          background: 'rgba(220, 220, 220, 0.2)',
          border: '1px solid rgba(200, 200, 200, 0.3)',
          backdropFilter: 'blur(4px) saturate(150%)',
          WebkitBackdropFilter: 'blur(4px) saturate(150%)'
        }}
        onClick={displayRemainingUploads === 0 ? undefined : triggerFileSelect}
      >
        {/* Loading Overlay - Only mount when actually uploading */}
        {isUploading && (
          <div 
            className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)',
            }}
          >
            <Loader 
              message="Uploading image..."
              showMessage
            />
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center w-full h-full">
          {displayRemainingUploads === 0 ? (
            // No more uploads state
            <>
              <div className="mb-4 opacity-60">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                  {/* Door frame */}
                  <rect x="20" y="10" width="40" height="60" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
                  
                  {/* Closed door - solid panels */}
                  <rect x="22" y="12" width="36" height="56" rx="1" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.1"/>
                  
                  {/* Door handle */}
                  <circle cx="50" cy="40" r="1.5" fill="currentColor"/>
                  
                  {/* Door panel details - closed style */}
                  <line x1="30" y1="20" x2="30" y2="65" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
                  <line x1="50" y1="20" x2="50" y2="65" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
                  
                  {/* Vertical panel lines - closed door */}
                  <path d="M30 20 L35 25 M30 30 L38 38 M30 40 L40 50 M30 50 L42 62" 
                        stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" opacity="0.3"/>
                  
                  {/* Closed door indication - no opening */}
                  <rect x="22" y="12" width="36" height="56" fill="currentColor" opacity="0.05" rx="1"/>
                </svg>
              </div>
              <p className="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">
                {user ? 'Studio sessions limit reached' : 'Thank you for trying our studio'}
              </p>
              <p className="text-sm text-gray-600 dark:text-white/60 mb-4 text-center">
                {user 
                  ? getMessageText()
                  : 'Please sign in to access 5 more uploads or subscribe to our monthly plan.'
                }
              </p>
              <div className="flex justify-center pt-4">
                {user ? (
                  <motion.button
                    whileTap={{ y: 2, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show billing modal for users with active/canceled subscriptions
                      if (userData?.subscription?.status === 'active' || userData?.subscription?.status === 'canceled') {
                        if (onShowBillingModal) onShowBillingModal();
                      } else {
                        // Show subscription modal for users without subscriptions
                        if (onShowPaymentModal) onShowPaymentModal();
                      }
                    }}
                    className="about-devello-glass px-4 py-2 text-sm rounded-[2rem] font-medium transition-all duration-300"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: isDark 
                        ? 'rgba(37, 99, 235, 0.6)' 
                        : 'rgba(37, 99, 235, 0.8)',
                      borderColor: isDark 
                        ? 'rgba(59, 130, 246, 0.4)' 
                        : 'rgba(37, 99, 235, 0.3)',
                      borderWidth: '1px',
                      color: 'white'
                    }}
                  >
                    {getButtonText()}
                  </motion.button>
                ) : (
                    <motion.button
                      whileTap={{ y: 2, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCodeModal(true);
                      }}
                      className="about-devello-glass px-4 py-2 text-sm rounded-[2rem] font-medium transition-all duration-300"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark 
                          ? 'rgba(37, 99, 235, 0.6)' 
                          : 'rgba(37, 99, 235, 0.8)',
                        borderColor: isDark 
                          ? 'rgba(59, 130, 246, 0.4)' 
                          : 'rgba(37, 99, 235, 0.3)',
                        borderWidth: '1px',
                        color: 'white'
                      }}
                    >
                      Get more sessions
                    </motion.button>
                )}
              </div>
            </>
          ) : (
            // Normal upload state
            <>
              <span className="text-6xl mb-4 opacity-60 group-hover:opacity-80 transition-opacity">📷</span>
              <p className="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                Upload Photo
              </p>
              <p className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors" suppressHydrationWarning>
                {isMobile ? "Tap to select or take a photo" : "Click to select an image"}
              </p>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                All images standardized for optimal AI processing
              </p>
            </>
          )}
        </div>
      </GlassSurface>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Payment Options Modal removed - handled at app level */}
      
      {/* Code Input Modal */}
      <CodeInputModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        isDark={isDark}
      />
    </div>
  );
}
