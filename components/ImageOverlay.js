import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageOverlay = ({ 
  originalSrc, 
  processedSrc, 
  showProcessed, 
  isProcessing, 
  className = "",
  onTogglePreview,
  alt = { original: "Original", processed: "Processed" },
  allowHoldCompare = true
}) => {
  const [showOriginalOnHold, setShowOriginalOnHold] = useState(false);
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const [processedImageDimensions, setProcessedImageDimensions] = useState({ width: 0, height: 0 });
  const [needsRotation, setNeedsRotation] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [processedImageSize, setProcessedImageSize] = useState({ width: 0, height: 0, left: 0, top: 0 });
  const containerRef = useRef(null);
  const originalImageRef = useRef(null);
  const processedImageRef = useRef(null);

  // Simple image load handler - just store natural dimensions for orientation detection
  const handleImageLoad = (img, imageType = 'processed') => {
    if (img) {
      // Store natural dimensions for orientation detection only
      const naturalDimensions = { width: img.naturalWidth, height: img.naturalHeight };
      
      // Log image dimensions when loaded
      console.log('Image dimensions:', {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        displayWidth: img.width,
        displayHeight: img.height,
        aspectRatio: (img.naturalWidth / img.naturalHeight).toFixed(3)
      });
      
      if (imageType === 'original') {
        setOriginalImageDimensions(naturalDimensions);
      } else if (imageType === 'processed') {
        setProcessedImageDimensions(naturalDimensions);
      }
    }
  };

  // Simplified hold start handler
  const handleHoldStart = (e) => {
    // Early return conditions
    if (!showProcessed || isProcessing || !allowHoldCompare || isHolding) return;
    
    // Prevent if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('input')) return;
    
    // Prevent default behaviors
    e.preventDefault();
    e.stopPropagation();
    
    // Set holding state and show original immediately
    setIsHolding(true);
    setShowOriginalOnHold(true);
    if (onTogglePreview) onTogglePreview(true);
  };

  // Simplified hold end handler
  const handleHoldEnd = (e) => {
    // Early return conditions
    if (!showProcessed || isProcessing || !allowHoldCompare || !isHolding) return;
    
    // Reset holding state and hide original immediately
    setIsHolding(false);
    setShowOriginalOnHold(false);
    if (onTogglePreview) onTogglePreview(false);
  };

  // Reset hold state when processing starts
  useEffect(() => {
    if (isProcessing) {
      setIsHolding(false);
      setShowOriginalOnHold(false);
    }
  }, [isProcessing]);

  // Cleanup effect - simplified
  useEffect(() => {
    return () => {
      // Reset states on cleanup
      setIsHolding(false);
      setShowOriginalOnHold(false);
    };
  }, []);

  // Enhanced rotation detection for mobile devices
  useEffect(() => {
    if (originalImageDimensions.width && originalImageDimensions.height && 
        processedImageDimensions.width && processedImageDimensions.height) {
      
      const originalIsPortrait = originalImageDimensions.height > originalImageDimensions.width;
      const processedIsPortrait = processedImageDimensions.height > processedImageDimensions.width;
      
      // Mobile device detection
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Enhanced rotation logic for mobile devices
      let shouldRotate = false;
      
      if (isMobileDevice) {
        // For mobile devices, use the same logic as desktop for consistency
        // This ensures HEIF files are handled the same way as HEIC files
        shouldRotate = originalIsPortrait !== processedIsPortrait;
        
        console.log('HEIF rotation detection:', {
          originalIsPortrait,
          processedIsPortrait,
          shouldRotate,
          note: 'Using desktop-style rotation detection for mobile HEIF/HEIC files'
        });
      } else {
        // Desktop: use original logic
        shouldRotate = originalIsPortrait !== processedIsPortrait;
        
        console.log('Desktop rotation detection:', {
          originalIsPortrait,
          processedIsPortrait,
          shouldRotate
        });
      }
      
      if (shouldRotate) {
      }
      
      setNeedsRotation(shouldRotate);
    }
  }, [originalImageDimensions, processedImageDimensions]);

  // Sync original overlay size with processed image
  useEffect(() => {
    const updateImageSize = () => {
      if (processedImageRef.current && containerRef.current && showProcessed) {
        const processedRect = processedImageRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setProcessedImageSize({
          width: processedRect.width,
          height: processedRect.height,
          left: processedRect.left - containerRect.left,
          top: processedRect.top - containerRect.top
        });
      }
    };

    // Update on mount and when images change
    updateImageSize();

    // Update on resize
    const resizeObserver = new ResizeObserver(updateImageSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (processedImageRef.current) {
      resizeObserver.observe(processedImageRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [showProcessed, processedSrc]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
      onPointerDown={allowHoldCompare && !isHolding ? handleHoldStart : undefined}
      onPointerUp={allowHoldCompare && isHolding ? handleHoldEnd : undefined}
      onPointerLeave={allowHoldCompare && isHolding ? handleHoldEnd : undefined}
      onPointerCancel={allowHoldCompare && isHolding ? handleHoldEnd : undefined}
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{ 
        touchAction: 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <AnimatePresence mode="wait">
        {/* Original Image (when no processed version exists) */}
        {originalSrc && !showProcessed && (
          <motion.img
            key="original-img"
            ref={originalImageRef}
            src={originalSrc}
            alt={alt.original}
            crossOrigin="anonymous"
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="object-contain select-none rounded-2xl"
            draggable={false}
            onLoad={(e) => {
              handleImageLoad(e.target, 'original');
            }}
            style={{ 
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              pointerEvents: 'none',
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        )}

        {/* Processed Image (main display when available) */}
        {showProcessed && processedSrc && (
          <motion.img
            key="processed-img"
            ref={processedImageRef}
            src={processedSrc}
            alt={alt.processed}
            crossOrigin="anonymous"
            data-processed-image
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`object-contain select-none rounded-2xl ${needsRotation ? 'rotate-90' : ''}`}
            draggable={false}
            onLoad={(e) => {
              handleImageLoad(e.target, 'processed');
              // Capture the processed image's computed size and position after render
              requestAnimationFrame(() => {
                if (processedImageRef.current && containerRef.current) {
                  const processedRect = processedImageRef.current.getBoundingClientRect();
                  const containerRect = containerRef.current.getBoundingClientRect();
                  setProcessedImageSize({
                    width: processedRect.width,
                    height: processedRect.height,
                    left: processedRect.left - containerRect.left,
                    top: processedRect.top - containerRect.top
                  });
                }
              });
            }}
            style={{ 
              userSelect: 'none',
              WebkitTouchCallout: 'none',
              pointerEvents: 'none',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: needsRotation ? 'rotate(90deg)' : 'none',
              transformOrigin: 'center'
            }}
          />
        )}
      </AnimatePresence>

      {/* Original Preview Overlay - Perfect Pixel Alignment */}
      {allowHoldCompare && showProcessed && showOriginalOnHold && originalSrc && (
        <motion.img
          key="hold-original"
          ref={originalImageRef}
          src={originalSrc}
          alt={`${alt.original} Preview`}
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`absolute select-none pointer-events-none object-contain rounded-2xl ${needsRotation ? 'rotate-90' : ''}`}
          draggable={false}
          onLoad={(e) => {
            handleImageLoad(e.target, 'original');
            // Update size to match processed image
            if (processedImageRef.current && containerRef.current) {
              const processedRect = processedImageRef.current.getBoundingClientRect();
              const containerRect = containerRef.current.getBoundingClientRect();
              setProcessedImageSize({
                width: processedRect.width,
                height: processedRect.height,
                left: processedRect.left - containerRect.left,
                top: processedRect.top - containerRect.top
              });
            }
          }}
          style={{ 
            ...(processedImageSize.width > 0 && processedImageSize.height > 0 ? {
              width: `${processedImageSize.width}px`,
              height: `${processedImageSize.height}px`,
              left: `${processedImageSize.left}px`,
              top: `${processedImageSize.top}px`,
            } : {
              inset: 0,
              width: '100%',
              height: '100%',
            }),
            objectFit: 'contain',
            transform: needsRotation ? 'rotate(90deg)' : 'none',
            transformOrigin: 'center',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
            zIndex: 10
          }}
        />
      )}

      {/* Visual indicator for preview functionality */}
      {allowHoldCompare && showProcessed && !showOriginalOnHold && !isProcessing && !isHolding && (
        <div className="absolute top-16 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs font-medium opacity-70 hover:opacity-100 transition-opacity pointer-events-none z-20">
          Hold to compare
        </div>
      )}
    </div>
  );
};

export default ImageOverlay; 
