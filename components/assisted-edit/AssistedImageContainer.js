import React, { forwardRef, useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ImageOverlay from '../ImageOverlay';
import Loader from '../loader';
import ActionButtons from '../general-edit/components/ActionButtons';
import AssistedEditAssistantChat from './AssistedEditAssistantChat';
import AssistedEditHotspot from './AssistedEditHotspot';
import ImageSelectionContainer from './ImageSelectionContainer';
import HotspotContainer from './HotspotContainer';
import GlassSurface from '../GlassSurface';
import { Button } from '../ui/Button';
import { useRouter } from 'next/router';
import { RESET_HOME_BUTTON_STYLE, RESET_HOME_BUTTON_CLASS } from '../ui/buttonStyles';

const AssistedImageContainer = forwardRef(({
  originalSrc,
  processedSrc,
  showEnhanced,
  isProcessing,
  isUpscaling,
  isPreparingPreview,
  isUploading,
  editHotspots,
  hotspotCounter,
  activeTab,
  imageReady,
  containerDims,
  stableContainerDims,
  isMobile,
  processError,
  upscaleError,
  updateState,
  fileInputRef,
  onShowPaymentModal,
  user,
  userData,
  setUserData,
  uploadId,
  imageCaption,
  isCaptionPending,
  userProfile,
  markUploadAsProcessed,
  refreshAfterUpload,
  originalImageForComparison,
  upscaledImage,
  processingImageUrl,
  history,
  historyIndex,
  canUndo,
  canRedo,
  processRetouch
}, ref) => {
  const router = useRouter();
  
  const containerRef = useRef(null);
  const naturalSizeRef = useRef({ width: 0, height: 0 });

  // State for dynamic background color detection
  const [hotspotColors, setHotspotColors] = useState({});
  
  // State for new layout containers
  const [referenceImages, setReferenceImages] = useState([]);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [showImageSelection, setShowImageSelection] = useState(true);
  
  // Only recompute container size on window resize, not on image change
  // The initial dimensions are set by the upload process in useAssistedImageProcessing
  useEffect(() => {
    console.log('Container dimensions:', {
      originalSrc: !!originalSrc,
      stableContainerDims,
      containerDims
    });
    
    if (!originalSrc || !stableContainerDims.width || !stableContainerDims.height) return;
    
    const recompute = () => {
      try {
        const containerWidth = Math.floor((containerRef.current?.getBoundingClientRect().width || 0));
        if (!containerWidth) return;
        
        const availableWidth = Math.min(containerWidth, Math.floor(window.innerWidth * 0.95));
        const maxHeight = Math.floor(window.innerHeight * 0.6); // Reduced to leave space for chat
        const aspect = naturalSizeRef.current.width > 0
          ? naturalSizeRef.current.height / naturalSizeRef.current.width
          : 1;
        
        // Start from width, then clamp by height if needed
        let width = Math.floor(availableWidth);
        let height = Math.floor(width * aspect);
        if (height > maxHeight) {
          height = maxHeight;
          width = Math.floor(height / aspect);
        }
        
        const newDims = { width: `${width}px`, height: `${height}px` };
        updateState({ containerDims: newDims, stableContainerDims: newDims });
      } catch (e) {
        console.error('Error recomputing container dimensions:', e);
      }
    };

    // Store natural size for resize calculations
    const img = new Image();
    img.onload = () => {
      naturalSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight };
    };
    img.src = originalSrc;

    // Only add resize listener, don't recompute immediately
    window.addEventListener('resize', recompute);
    
    return () => {
      window.removeEventListener('resize', recompute);
    };
  }, [originalSrc, stableContainerDims, updateState]);
  
  // Function to detect background color at hotspot position
  const detectBackgroundColor = useCallback((hotspot, imageElement) => {
    if (!imageElement || !hotspot) return null;
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match image
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      
      // Draw image to canvas
      ctx.drawImage(imageElement, 0, 0);
      
      // Convert hotspot percentage to pixel coordinates
      const x = Math.round((hotspot.x / 100) * imageElement.naturalWidth);
      const y = Math.round((hotspot.y / 100) * imageElement.naturalHeight);
      
      // Get pixel data at hotspot position
      const imageData = ctx.getImageData(x, y, 1, 1);
      const [r, g, b] = imageData.data;
      
      // Calculate brightness
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // Return colors based on brightness
      if (brightness > 128) {
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderColor: '#000000',
          textColor: '#ffffff'
        };
      } else {
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderColor: '#ffffff',
          textColor: '#000000'
        };
      }
    } catch (error) {
      console.error('Error detecting background color:', error);
      return null;
    }
  }, []);

  // Update hotspot colors when hotspots or image changes
  useEffect(() => {
    if (!editHotspots || !originalSrc) {
      setHotspotColors({});
      return;
    }

    const imageElement = document.querySelector('.assisted-image-overlay img');
    if (!imageElement) return;

    const newColors = {};
    editHotspots.forEach(hotspot => {
      const colors = detectBackgroundColor(hotspot, imageElement);
      if (colors) {
        newColors[hotspot.id] = colors;
      }
    });
    setHotspotColors(newColors);
  }, [editHotspots, originalSrc, detectBackgroundColor]);

  // UI Handlers
  const triggerFileSelect = () => fileInputRef.current?.click();

  // Robust hotspot add (parity with general edit): respect showEnhanced, processing, max=5, ignore interactive elements
  const handleImageClick = useCallback((event) => {
    if (!originalSrc) return;
    if (showEnhanced || isProcessing) return;

    // Ignore interactive targets
    const target = event.target;
    if (target.closest('button') || target.closest('textarea') || target.closest('input') || target.closest('[data-edit-button]')) return;

    const safeHotspots = editHotspots || [];
    if (safeHotspots.length >= 5) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100 * 100) / 100;
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100 * 100) / 100;

    // Assign next sequential ID independent of hotspotCounter to keep labels compact
    const newId = safeHotspots.length + 1;
    const newHotspot = { id: newId, x, y, prompt: '' };
    updateState({
      editHotspots: [...safeHotspots, newHotspot],
      hotspotCounter: newId + 1
    });
  }, [originalSrc, showEnhanced, isProcessing, editHotspots, hotspotCounter, updateState]);

  const removeHotspot = useCallback((hotspotId) => {
    const filtered = (editHotspots || []).filter(h => h.id !== hotspotId);
    // Renumber remaining hotspots sequentially to keep labels compact (1..N)
    const renumbered = filtered.map((h, idx) => ({ ...h, id: idx + 1 }));
    updateState({
      editHotspots: renumbered,
      hotspotCounter: renumbered.length + 1
    });
  }, [editHotspots, updateState]);

  const handleAssistantImageSelect = useCallback(async (hotspotId, imageData) => {
    
    try {
      // Handle both web_search type and direct image data from drag and drop
      if (imageData.type === 'web_search' || imageData.url) {
        // Use the web search URL directly
        const imageUrl = imageData.url;
        
        // Create reference object similar to ReferenceUploader
        const reference = {
          id: `assistant_ref_${Date.now()}`,
          name: imageData.description || `Assistant Reference ${Date.now()}`,
          preview: imageUrl,
          url: imageUrl,
          size: 0, // Unknown size for web images
          type: 'image/jpeg', // Default type for web images
          selectionPoint: null
        };
        
        // Update the hotspot with the reference image
        const updatedHotspots = editHotspots.map(hotspot => 
          hotspot.id === hotspotId 
            ? {
                ...hotspot,
                referenceImages: [...(hotspot.referenceImages || []), reference]
              }
            : hotspot
        );
        
        updateState({
          editHotspots: updatedHotspots
        });
        
      } else {
      }
    } catch (error) {
      console.error('❌ [ASSISTED_EDIT] Failed to add assistant image:', error);
    }
  }, [editHotspots, updateState]);

  // Handle reference images received from chat input
  const handleReferenceImagesReceived = useCallback((images) => {
    // Store reference images for display in image selection container
    setReferenceImages(images);
    setShowImageSelection(true);
  }, []);

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleStartOver = () => {
    updateState({
      originalSrc: null,
      processedSrc: null,
      upscaledImage: null,
      processingImageUrl: null,
      showEnhanced: false,
      imageReady: false,
      processError: null,
      upscaleError: null,
      originalImageForComparison: null,
      editHotspots: [],
      hotspotCounter: 1,
      history: [],
      historyIndex: -1
    });
  };

  // Update hotspot position (percentage within image bounds)
  const updateHotspotPosition = useCallback((hotspotId, x, y) => {
    const clampedX = Math.max(0, Math.min(100, Math.round(x * 100) / 100));
    const clampedY = Math.max(0, Math.min(100, Math.round(y * 100) / 100));
    updateState({
      editHotspots: (editHotspots || []).map(h => h.id === hotspotId ? { ...h, x: clampedX, y: clampedY } : h)
    });
  }, [editHotspots, updateState]);

  // Handle hotspot selection
  const handleHotspotSelect = useCallback((hotspot, referenceImage = null) => {
    if (referenceImage) {
      // Assign reference image to hotspot
      handleAssistantImageSelect(hotspot.id, referenceImage);
    } else {
      // Just select the hotspot
      setSelectedHotspot(hotspot);
    }
  }, [handleAssistantImageSelect]);

  // Handle hotspot removal
  const handleHotspotRemove = useCallback((hotspotId) => {
    removeHotspot(hotspotId);
    if (selectedHotspot?.id === hotspotId) {
      setSelectedHotspot(null);
    }
  }, [removeHotspot, selectedHotspot]);

  // Handle hotspot editing
  const handleHotspotEdit = useCallback((hotspot) => {
    // TODO: Implement hotspot editing modal or inline editing
  }, []);

  // Handle reference image selection
  const handleReferenceImageSelect = useCallback((imageData) => {
    // TODO: Implement reference image selection logic
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 relative z-10">
      {/* Dynamic Layout - Single column when no image, 2 columns when image uploaded */}
      <div className={`flex flex-col ${originalSrc ? 'lg:flex-row' : 'items-center justify-center'} gap-4 w-full min-h-[50vh]`}>
        
        {/* Main Image Container */}
        <div className={`${originalSrc ? 'flex-1' : 'w-full max-w-2xl'} flex flex-col items-center justify-center`}>
          <motion.div
            ref={(node) => {
              containerRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            className="relative overflow-hidden shadow-xl bg-transparent flex items-center justify-center rounded-[2rem] border"
            style={{
              width: originalSrc ? (stableContainerDims?.width || '400px') : (isMobile ? '90vw' : '500px'),
              height: originalSrc ? (stableContainerDims?.height || '300px') : (isMobile ? '35vh' : '300px'),
              maxWidth: isMobile ? '95vw' : originalSrc ? '1200px' : '500px',
              maxHeight: isMobile ? '70vh' : '70vh',
              backgroundColor: 'transparent',
              borderColor: 'rgba(200, 200, 200, 0.3)'
            }}
            onLoad={() => {
              console.log('Image container loaded:', {
                width: originalSrc ? (stableContainerDims?.width || '500px') : (isMobile ? '90vw' : '500px'),
                height: originalSrc ? (stableContainerDims?.height || '300px') : (isMobile ? '35vh' : '300px'),
                stableContainerDims,
                originalSrc: !!originalSrc
              });
            }}
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(20px)' }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              filter: 'blur(0px)',
              width: originalSrc ? (stableContainerDims?.width || '500px') : (isMobile ? '90vw' : '500px'),
              height: originalSrc ? (stableContainerDims?.height || '300px') : (isMobile ? '35vh' : '300px')
            }}
            transition={{ 
              duration: 0.6, 
              ease: "easeOut",
              layout: { duration: 0.5, ease: "easeOut" },
              filter: { duration: 0.2, delay: 0.45, ease: "easeOut" }
            }}
            layout="position"
          >
            {/* Upload Area - Only show when no image */}
            {!originalSrc && !isUploading && (
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
                className="cursor-pointer group transition-all duration-300 hover:opacity-90"
                style={{
                  background: 'rgba(220, 220, 220, 0.2)',
                  border: '1px solid rgba(200, 200, 200, 0.3)',
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)'
                }}
                onClick={triggerFileSelect}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <span className="text-6xl mb-4 opacity-60 group-hover:opacity-80 transition-opacity">📷</span>
                  <p className="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Upload Photo
                  </p>
                  <p className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-700 dark:group-hover:text-white/80 transition-colors">
                    {isMobile ? "Tap to select or take a photo" : "Click to select an image"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-1">
                    All images standardized for optimal AI processing
                  </p>
                </div>
              </GlassSurface>
            )}

            {/* Upload Processing Overlay - Only mount when actually uploading */}
            {isUploading && originalSrc && (
              <div 
                className="absolute inset-0 flex items-center justify-center rounded-2xl backdrop-blur-2xl"
                style={{
                  background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)',
                }}
              >
                <div className="text-center text-white">
                  <Loader />
                  <p className="mt-4 text-lg font-medium">Uploading your image...</p>
                  <p className="text-sm text-white/70">Please wait while we process your file</p>
                </div>
              </div>
            )}

            {/* Image Display */}
            {originalSrc && (
              <div className="relative w-full h-full" onClick={handleImageClick}>
                <ImageOverlay
                  originalSrc={originalSrc}
                  processedSrc={processedSrc}
                  showProcessed={showEnhanced}
                  isProcessing={isProcessing}
                  allowHoldCompare={true}
                  className="rounded-xl transition-all duration-300 assisted-image-overlay"
                  alt={{ original: "Original Photo", processed: "Edited Photo" }}
                />
                
                {/* Simple Hotspot indicators - only show when not processed and not processing */}
                {!showEnhanced && !isProcessing && (editHotspots || []).map((hotspot) => (
                  <AssistedEditHotspot
                    key={hotspot.id}
                    hotspot={hotspot}
                    containerDims={stableContainerDims}
                    colors={hotspotColors[hotspot.id] || {}}
                    onClick={(h) => {
                    }}
                    onRemove={(id) => removeHotspot(id)}
                    onPositionChange={(id, nx, ny) => updateHotspotPosition(id, nx, ny)}
                    onReferenceImageDrop={handleAssistantImageSelect}
                    disabled={isProcessing}
                  />
                ))}

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-2xl flex items-center justify-center rounded-2xl">
                    <div className="text-center text-white">
                      <Loader />
                      <p className="mt-4 text-lg font-medium">Processing your image...</p>
                      <p className="text-sm text-white/70">This may take a few moments</p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {(processError || upscaleError) && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-2xl">
                    <div className="text-center text-white p-4">
                      <div className="text-red-400 mb-2">⚠️ Processing Error</div>
                      <div className="text-sm">{processError || upscaleError}</div>
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
                      onClick={handleStartOver}
                      className={RESET_HOME_BUTTON_CLASS}
                      style={RESET_HOME_BUTTON_STYLE}
                      detectContrast={false}
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleBackToHome}
                      className={RESET_HOME_BUTTON_CLASS}
                      style={RESET_HOME_BUTTON_STYLE}
                      detectContrast={false}
                    >
                      ← Home
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {/* Back to Home (when no image) */}
            {!originalSrc && (
              <Button
                onClick={handleBackToHome}
                className={`absolute top-3 right-3 ${RESET_HOME_BUTTON_CLASS} z-30`}
                style={RESET_HOME_BUTTON_STYLE}
                detectContrast={false}
              >
                ← Home
              </Button>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif,image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files[0];
                if (file) {
                  // Handle file upload logic here
                }
              }}
            />
          </motion.div>
        </div>

        {/* Reference Images Container - Right side when image uploaded */}
        {originalSrc && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-80 flex-shrink-0"
          >
            <div 
              className="flex items-center justify-center"
              style={{
                height: originalSrc ? (stableContainerDims?.height || '300px') : '300px'
              }}
            >
              <ImageSelectionContainer
                referenceImages={referenceImages}
                onImageSelect={handleReferenceImageSelect}
                isVisible={true}
                containerHeight={originalSrc ? (stableContainerDims?.height || 300) : 300}
              />
            </div>
          </motion.div>
        )}

      </div>

      {/* Chat Input - Full width below the reference images */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mt-6"
      >
        <AssistedEditAssistantChat 
          imageCaption={imageCaption}
          userProfile={userProfile}
          editHotspots={editHotspots}
          onImageSelect={handleAssistantImageSelect}
          isCaptionPending={isCaptionPending}
          onReferenceImagesReceived={handleReferenceImagesReceived}
        />
      </motion.div>
    </div>
  );
});

AssistedImageContainer.displayName = 'AssistedImageContainer';

export default AssistedImageContainer;
