import React, { useRef, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Button } from '../ui/Button';
import ImageOverlay from '../ImageOverlay';
import Loader from '../loader';
import ImageUploader from './ImageUploader';
import { RESET_HOME_BUTTON_STYLE, RESET_HOME_BUTTON_CLASS } from '../ui/buttonStyles';

export default function ImageContainer({
  originalSrc,
  processedSrc,
  upscaledImage,
  originalImageForComparison,
  isProcessing,
  isUpscaling,
  isUploading,
  isPreparingPreview,
  showEnhanced,
  imageReady,
  showEditFlow,
  containerDims,
  stableContainerDims,
  processError,
  upscaleError,
  editCount,
  canEdit,
  onStartOver,
  onBackToHome,
  onStartEditFlow,
  onImageUpload,
  onUploadError,
  onUploadLimitReached,
  onDownload,
  onUpscale,
  onShowAuthModal,
  onShowBillingModal,
  onDirectPayment,
  onShowPaymentModal,
  user,
  userData,
  isMobile = false
}) {
  const router = useRouter();
  const imageContainerRef = useRef(null);
  const previousObjectUrlRef = useRef(null);
  
  // State to control when child elements can render (after container expansion)
  const [containerExpanded, setContainerExpanded] = useState(false);
  
  // Set containerExpanded to true after container animation completes
  useEffect(() => {
    if (originalSrc && !containerExpanded) {
      const timer = setTimeout(() => {
        setContainerExpanded(true);
      }, 800); // Match container animation duration
      
      return () => clearTimeout(timer);
    } else if (!originalSrc) {
      setContainerExpanded(false);
    }
  }, [originalSrc, containerExpanded]);

  // Removed scroll logic to prevent page shifting

  // Get current image for display - only standardized or upscaled
  const getCurrentImage = () => {
    if (upscaledImage) return upscaledImage;
    return originalSrc; // This is the standardized image
  };

  // Log which image is currently displayed and its size
  useEffect(() => {
    if (containerExpanded && originalSrc) {
      const currentImage = getCurrentImage();
      const isUpscaled = !!upscaledImage;
      
      console.log('🖼️ [IMAGE_DISPLAY] Currently showing:', isUpscaled ? 'UPSCALED' : 'STANDARDIZED');
      console.log('🖼️ [IMAGE_DISPLAY] Image URL:', currentImage);
      
      // Log container dimensions
      console.log('📐 [CONTAINER] Dimensions:', {
        width: stableContainerDims.width,
        height: stableContainerDims.height
      });
      
      // Log standardized image info when it's displayed after processing
      if (!isUpscaled && upscaledImage) {
        console.log('📏 [STANDARDIZED_AFTER_PROCESSING] Standardized image displayed after upscaling:', {
          originalSrc: originalSrc,
          upscaledImage: upscaledImage,
          containerDims: stableContainerDims
        });
        console.log('⚠️ [ASPECT_RATIO_MISMATCH] This is likely causing the size difference!');
      }
    }
  }, [containerExpanded, originalSrc, upscaledImage, stableContainerDims]);

  // Handle image upload completion
  const handleImageUpload = (uploadData) => {
    onImageUpload(uploadData);
    // Removed scroll logic to prevent page shifting
  };

  // Handle outside clicks to close edit menu
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const editMenu = event.target.closest('[data-edit-menu]');
      const editButton = event.target.closest('[data-edit-button]');
      
      if (!editMenu && !editButton && showEditFlow) {
        onStartEditFlow(false);
      }
    };

    if (showEditFlow) {
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }
  }, [showEditFlow, onStartEditFlow]);

  return (
    <motion.div
        ref={imageContainerRef}
        className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-white/5 border flex items-center justify-center"
        style={{
          width: originalSrc ? stableContainerDims.width : (isMobile ? '80vw' : '500px'),
          borderColor: 'rgba(200, 200, 200, 0.3)',
          height: originalSrc ? stableContainerDims.height : (isMobile ? '40vh' : '300px'),
          maxWidth: '95vw',
          maxHeight: '85vh',
          marginTop: isMobile ? '60px' : '80px' // Reduced mobile spacing, keep desktop same
        }}
        initial={{ opacity: 1, scale: 1 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          width: originalSrc ? stableContainerDims.width : (isMobile ? '80vw' : '500px'),
          height: originalSrc ? stableContainerDims.height : (isMobile ? '40vh' : '300px')
        }}
        transition={{ 
          duration: 0, 
          ease: "easeInOut",
          layout: { duration: 0, ease: "easeInOut" }
        }}
        layout="position"
      >
        {/* Loading Overlay - Only for upload and preview preparation */}
        {(isUploading || isPreparingPreview) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black backdrop-blur-2xl">
            <Loader 
              message={
                isUploading ? "Uploading image..." :
                isPreparingPreview ? "Preparing preview..." : null
              } 
              showMessage={true}
              animatedMessages={isUploading}
              isUploading={isUploading}
            />
          </div>
        )}
        
        {/* Processing Overlay - Only for AI processing */}
        {isProcessing && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/30"
            style={{
              backdropFilter: isMobile ? 'blur(8px)' : 'blur(24px)',
              WebkitBackdropFilter: isMobile ? 'blur(8px)' : 'blur(24px)',
              willChange: 'auto'
            }}
          >
            <Loader 
              message={null}
              showMessage={true}
              animatedMessages={true}
              isUploading={false}
            />
          </div>
        )}
        
        {/* Upscaling Indicator - Bottom Right */}
        {isUpscaling && (
          <div className="absolute bottom-4 right-4 z-30">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm font-medium"
              style={{ 
                textShadow: '0 0 10px rgba(255,255,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              Upscaling
            </motion.div>
          </div>
        )}
        
        {/* Upload Placeholder - always show when no image */}
        {!originalSrc && (
          <ImageUploader
            onImageUpload={handleImageUpload}
            onUploadError={onUploadError}
            onUploadLimitReached={onUploadLimitReached}
            onShowAuthModal={onShowAuthModal}
            onShowBillingModal={onShowBillingModal}
            onDirectPayment={onDirectPayment}
            onShowPaymentModal={onShowPaymentModal}
            user={user}
            userData={userData}
            isMobile={isMobile}
          />
        )}

        {/* All image content - only render after container expansion */}
        {containerExpanded && originalSrc && (
          <motion.div
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="relative cursor-pointer">
              <ImageOverlay
                originalSrc={originalSrc} // Standardized image for comparison
                processedSrc={upscaledImage || processedSrc} // Show upscaled if available, otherwise processed
                showProcessed={!!(upscaledImage || processedSrc) && (showEnhanced || (isUpscaling && processedSrc))} // Show processed during upscaling if available
                isProcessing={isProcessing && !processedSrc} // Only show processing overlay if no processed image yet
                allowHoldCompare={true}
                className="rounded-2xl"
                alt={{ 
                  original: "Standardized Photo", 
                  processed: upscaledImage ? "Upscaled Photo" : "Processed Photo" 
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Action Buttons - Only show after image is ready and not processing */}
        {containerExpanded && imageReady && !isProcessing && !isUpscaling && !showEditFlow && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 inset-x-0 flex gap-2 z-30 justify-center"
          >
            {/* Edit/Enhance Button */}
            <Button
              data-edit-button
              onClick={() => {
                console.log('🔍 [EDIT_BUTTON] Clicked, canEdit:', canEdit, 'editCount:', editCount);
                onStartEditFlow(true);
              }}
              disabled={!canEdit}
              className={`px-1.5 py-1 text-sm font-medium transition-all duration-200 text-white ${
                canEdit 
                  ? '' 
                  : 'cursor-not-allowed opacity-50'
              }`}
              style={{
                background: canEdit ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.2)',
                border: canEdit ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid rgba(156, 163, 175, 0.3)',
                backdropFilter: 'blur(4px) saturate(150%)',
                WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                color: '#ffffff'
              }}
              detectContrast={false}
            >
              {!canEdit ? 'Max Edits (3/3)' : (upscaledImage ? 'Edit Again' : 'Enhance')}
            </Button>
            
            
            {/* Download Button - Only show after an edit has been performed */}
            {(showEnhanced || upscaledImage) && (
              <Button
                onClick={() => onDownload(getCurrentImage(), upscaledImage ? 'devello-upscaled' : 'devello-standardized')}
                className={`${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium transition-all duration-200`}
                style={{ 
                  minHeight: isMobile ? '32px' : 'auto',
                  background: 'rgba(34, 197, 94, 0.3)',
                  border: '1px solid rgba(74, 222, 128, 0.4)',
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)'
                }}
              >
                {isMobile ? 'Save to Photos' : 'Download'}
              </Button>
            )}
          </motion.div>
        )}

        {/* Edit Count Display - Show when image is ready */}
        {imageReady && (
          <div className="absolute top-4 left-4 z-20">
            <div className="sm:px-3 sm:py-1.5 rounded-[2rem] text-xs border text-white"
                 style={{ 
                   paddingTop: '0.25rem', 
                   paddingBottom: '0.25rem', 
                   paddingLeft: '0.5rem', 
                   paddingRight: '0.5rem',
                   background: 'rgba(59, 130, 246, 0.3)',
                   borderColor: 'rgba(96, 165, 250, 0.4)',
                   backdropFilter: 'blur(4px) saturate(150%)',
                   WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                   color: '#ffffff'
                 }}>
              Edits: {editCount || 0}/3
            </div>
          </div>
        )}

        {/* Top Right Controls */}
        {originalSrc && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 flex gap-1.5 z-30"
          >
            <Button
              onClick={onStartOver}
              className={RESET_HOME_BUTTON_CLASS}
              style={RESET_HOME_BUTTON_STYLE}
              detectContrast={false}
            >
              Reset
            </Button>
            <Button
              onClick={onBackToHome}
              className={RESET_HOME_BUTTON_CLASS}
              style={RESET_HOME_BUTTON_STYLE}
              detectContrast={false}
            >
              ← Home
            </Button>
          </motion.div>
        )}

        {/* Back to Home (when no image) */}
        {!originalSrc && (
          <Button
            onClick={onBackToHome}
            className={`absolute top-3 right-3 ${RESET_HOME_BUTTON_CLASS} z-30`}
            style={RESET_HOME_BUTTON_STYLE}
            detectContrast={false}
          >
            ← Home
          </Button>
        )}

        {/* Error Messages */}
        {processError && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-w-xs">
            <div className="px-3 py-1.5 bg-red-600/80 backdrop-blur-sm rounded-lg text-white text-xs border border-red-400/50">
              {processError}
            </div>
          </div>
        )}

        {upscaleError && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-w-xs">
            <div className="px-3 py-1.5 bg-red-600/80 backdrop-blur-sm rounded-lg text-white text-xs border border-red-400/50">
              {upscaleError}
            </div>
          </div>
        )}
    </motion.div>
  );
}
