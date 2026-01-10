import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';

const ImageSelectionContainer = ({ 
  referenceImages = [], 
  onImageSelect,
  isVisible = false,
  containerHeight = 300
}) => {
  const [selectedImage, setSelectedImage] = useState(null);

  // Calculate dynamic sizing for 4 images to fit within container height
  const calculateImageSize = () => {
    const padding = 8; // 4px * 2 (p-1 on container)
    const gapSize = 8; // gap-2 = 8px
    const gaps = gapSize * 3; // 3 gaps between 4 images
    const safetyMargin = 4; // Extra margin to prevent overflow
    const availableHeight = containerHeight - padding - gaps - safetyMargin;
    const imageHeight = Math.floor(availableHeight / 4);
    return {
      height: `${imageHeight}px`,
      aspectRatio: '3/2',
      gapSize: `${gapSize}px`
    };
  };

  const imageSize = calculateImageSize();

  const handleImageClick = useCallback((imageData) => {
    setSelectedImage(imageData);
    if (onImageSelect) {
      onImageSelect(imageData);
    }
  }, [onImageSelect]);

  const handleImageDownload = useCallback((imageData) => {
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageData.url;
    link.download = imageData.description || 'reference-image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleImagePreview = useCallback((imageData) => {
    // Open image in new tab for preview
    window.open(imageData.url, '_blank');
  }, []);

  // Always show the container, even when empty
  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full h-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-3 flex flex-col"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Reference Images</h3>
          <p className="text-xs text-gray-400">Click to select or drag to hotspots</p>
        </div>
        <div className="text-xs text-gray-500">
          {referenceImages.length} image{referenceImages.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {referenceImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center mb-2">
              <span className="text-lg">🖼️</span>
            </div>
            <p className="text-xs text-gray-400 mb-1">No reference images yet</p>
            <p className="text-xs text-gray-500">Ask the AI to find images for you</p>
          </div>
        ) : (
          <div 
            className="flex flex-col p-1 h-full overflow-hidden" 
            style={{ 
              gap: imageSize.gapSize
            }}
          >
            {referenceImages.length > 0 ? referenceImages.slice(0, 4).map((image, index) => (
              <motion.div
                key={`ref-${index}-${image.url}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group cursor-pointer rounded-md overflow-hidden border transition-all duration-200 ${
                  selectedImage?.url === image.url 
                    ? 'border-teal-500 bg-teal-500/10' 
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
                style={{
                  aspectRatio: imageSize.aspectRatio,
                  height: imageSize.height,
                  flex: '1 1 auto'
                }}
                onClick={() => handleImageClick(image)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify(image));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                {/* Image - Dynamically sized */}
                <div className="w-full h-full relative">
                  <img
                    src={image.url}
                    alt={image.description || `Reference image ${index + 1}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImagePreview(image);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white p-0.5 rounded transition-colors"
                        title="Preview image"
                      >
                        <ExternalLink size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageDownload(image);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white p-0.5 rounded transition-colors"
                        title="Download image"
                      >
                        <Download size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedImage?.url === image.url && (
                    <div className="absolute top-0.5 right-0.5 bg-teal-500 text-white p-0.5 rounded-full">
                      <X size={6} />
                    </div>
                  )}
                </div>

              </motion.div>
            )) : (
              // Placeholder illustrations when no images
              Array.from({ length: 4 }, (_, index) => (
                <motion.div
                  key={`placeholder-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group rounded-md overflow-hidden border border-dashed border-zinc-600 bg-zinc-800/20 flex items-center justify-center"
                  style={{
                    aspectRatio: imageSize.aspectRatio,
                    height: imageSize.height,
                    flex: '1 1 auto'
                  }}
                >
                  <div className="text-center p-4">
                    <div className="text-2xl mb-2 opacity-50">🖼️</div>
                    <p className="text-xs text-gray-400">AI will find images</p>
                    <p className="text-xs text-gray-500 mt-1">Ask for reference images</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

    </motion.div>
  );
};

export default ImageSelectionContainer;
