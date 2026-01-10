import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/Button';
import { canProcessEdits } from '../../../lib/editLimits';

const ActionButtons = ({
  showEnhanced,
  editHotspots,
  upscaledImage,
  canUndo,
  canRedo,
  isProcessing,
  updateState,
  processingImageUrl,
  processedSrc,
  hotspotCounter,
  uploadId,
  markUploadAsProcessed,
  refreshAfterUpload,
  processRetouch,
  isMobile = false,
  decrementEditCount,
  editCount,
  history,
  historyIndex,
  revertToHistory,
  editSessions,
  currentSession,
  originalSrc,
  customPrompt = null,
}) => {
  
  // State for process button animation
  const [processButtonAnimated, setProcessButtonAnimated] = useState(false);
  
  // Trigger animation when user has 2 hotspots and clicks image
  useEffect(() => {
    if (editHotspots && editHotspots.length >= 2 && !showEnhanced) {
      setProcessButtonAnimated(true);
      // Reset animation after 1 second
      const timer = setTimeout(() => setProcessButtonAnimated(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [editHotspots, showEnhanced]);

  // Generate AI-based filename for image with prompt
  const generateImageFilename = async (imageUrl, prompt = null) => {
    try {
      // Set a timeout to avoid blocking download
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000)
      );
      
      const apiPromise = fetch('/api/ai/generate-image-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl,
          prompt: prompt,
          changeDescription: prompt
        }),
      }).then(res => res.json());
      
      const result = await Promise.race([apiPromise, timeoutPromise]);
      return result.filename || 'devello-edited-image';
    } catch (error) {
      console.warn('⚠️ Failed to generate AI filename, using default:', error.message);
      // Fallback: create filename from prompt if available
      if (prompt) {
        const promptName = prompt
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 30);
        return `devello-${promptName}`;
      }
      return `devello-edited-${Date.now()}`;
    }
  };

  // Enhanced download/save function with mobile camera roll support
  const downloadImage = async (imageUrl, filename = null) => {
    try {
      // Generate AI-based filename if not provided
      let finalFilename = filename;
      if (!finalFilename) {
        finalFilename = await generateImageFilename(imageUrl, customPrompt);
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
              
              return;
            }
          } catch (shareError) {
          }
        }
        
        // Create image element that perfectly fills the container
        const tempImg = document.createElement('img');
        tempImg.src = imageUrl;
        tempImg.style.width = '100%';
        tempImg.style.height = '100%';
        tempImg.style.objectFit = 'contain';
        tempImg.style.objectPosition = 'center';
        tempImg.style.display = 'block';
        tempImg.style.margin = '0';
        tempImg.style.padding = '0';
        tempImg.style.border = 'none';
        tempImg.style.outline = 'none';
        tempImg.crossOrigin = 'anonymous';
        
        // Get the original container for positioning
        const containerElement = document.querySelector('.relative.rounded-2xl.overflow-hidden.shadow-2xl');
        
        // Add overlay with minimal styling
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '9998';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        
        // Create image container that perfectly overlays the original
        const imageContainer = document.createElement('div');
        if (containerElement) {
          const rect = containerElement.getBoundingClientRect();
          imageContainer.style.position = 'fixed';
          imageContainer.style.top = `${rect.top}px`;
          imageContainer.style.left = `${rect.left}px`;
          imageContainer.style.width = `${rect.width}px`;
          imageContainer.style.height = `${rect.height}px`;
          imageContainer.style.zIndex = '9999';
          imageContainer.style.borderRadius = '16px';
          imageContainer.style.overflow = 'hidden';
          imageContainer.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
          imageContainer.style.backgroundColor = 'transparent';
        } else {
          // Fallback positioning
          imageContainer.style.position = 'fixed';
          imageContainer.style.top = '50%';
          imageContainer.style.left = '50%';
          imageContainer.style.transform = 'translate(-50%, -50%)';
          imageContainer.style.width = '90vw';
          imageContainer.style.height = '90vh';
          imageContainer.style.zIndex = '9999';
          imageContainer.style.borderRadius = '16px';
          imageContainer.style.overflow = 'hidden';
        }
        
        // Add the image to the container
        imageContainer.appendChild(tempImg);
        
        // DISABLED: Hold-to-save feature removed as it's redundant with native share menu
        /*
        // Add simple text overlay
        const holdText = document.createElement('div');
        holdText.style.position = 'absolute';
        holdText.style.top = '16px';
        holdText.style.left = '16px';
        holdText.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        holdText.style.backdropFilter = 'blur(4px)';
        holdText.style.borderRadius = '8px';
        holdText.style.padding = '8px 16px';
        holdText.style.color = 'white';
        holdText.style.fontSize = '12px';
        holdText.style.fontWeight = '500';
        holdText.style.opacity = '0.7';
        holdText.style.pointerEvents = 'none';
        holdText.textContent = 'Hold to Save';
        
        imageContainer.appendChild(holdText);
        */
        overlay.appendChild(imageContainer);
        document.body.appendChild(overlay);
        
        // Close overlay when tapped
        const closeOverlay = () => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        };
        
        // Close when overlay is tapped
        overlay.addEventListener('click', closeOverlay);
        
        return;
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
          
          return;
        } catch (saveError) {
          // Check if user cancelled the dialog
          if (saveError.name === 'AbortError') {
            return; // Don't fall back to download if user cancelled
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
      
      
    } catch (error) {
      console.error('Download failed:', error);
      // Show error message
      updateState({ upscaleError: 'Failed to save image. Please try again.' });
      setTimeout(() => updateState({ upscaleError: null }), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="absolute bottom-3 inset-x-0 flex gap-2 z-30 justify-center pointer-events-none"
    >
      
      {/* Go Back Button - Show when there's history to revert to */}
      {(showEnhanced && (processedSrc || upscaledImage)) && (
        <Button
          onClick={() => {
            console.log('Go back clicked:', {
              processedSrc: !!processedSrc,
              upscaledImage: !!upscaledImage,
              showEnhanced,
              processingImageUrl: !!processingImageUrl
            });
            
            // Decrement edit count first
            if (decrementEditCount) {
              decrementEditCount('general-edit');
            }
            
            // Simple go back logic using history
            if (history && history.length > 0 && historyIndex > 0) {
              // Go back to previous edit in history
              const previousHistoryIndex = historyIndex - 1;
              revertToHistory('general-edit', previousHistoryIndex);
            } else {
              // Go back to standardized image (no more history)
              
              // If there's an active session and editCount is 0, use the originalSrc (previewUrl from upload)
              // This ensures we show the same image that was displayed after upload
              const hasActiveSession = currentSession && editSessions && editSessions.length > 0;
              const isFirstEdit = editCount === 0;
              
              let standardizedImage;
              if (hasActiveSession && isFirstEdit) {
                // Use the originalSrc (previewUrl) to match what was shown after upload
                standardizedImage = originalSrc;
                console.log('Using originalSrc (previewUrl) for first edit go back:', {
                  originalSrc,
                  hasActiveSession,
                  isFirstEdit
                });
              } else {
                // Fallback to processingImageUrl for other cases
                standardizedImage = processingImageUrl || originalSrc;
                console.log('Using processingImageUrl fallback:', {
                  processingImageUrl,
                  originalSrc,
                  hasActiveSession,
                  isFirstEdit
                });
              }
              
              updateState({
                originalSrc: standardizedImage, // Use the appropriate image source
                processedSrc: null, // No processed image
                upscaledImage: null, // No upscaled image
                showEnhanced: false, // Show original standardized image
                editHotspots: [],
                hotspotCounter: 1,
                // Reset session hotspots when going back to standardized image
                editSessions: editSessions?.map(session => 
                  session.id === currentSession 
                    ? { ...session, hotspots: [], status: 'active' }
                    : session
                ) || []
              });
            }
          }}
          className="px-2 py-1 sm:px-2 sm:py-1 text-sm sm:text-sm font-medium transition-all duration-200 pointer-events-auto"
          style={{ 
            padding: '0.25rem 0.5rem',
            minHeight: '32px',
            minWidth: '80px',
            background: 'rgba(100, 100, 100, 0.4)',
            border: '1px solid rgba(80, 80, 80, 0.5)',
            backdropFilter: 'blur(4px) saturate(150%)',
            WebkitBackdropFilter: 'blur(4px) saturate(150%)',
            color: '#ffffff'
          }}
        >
          ← Go Back
        </Button>
      )}

      {/* Back Button - Show when adding edit points - Moved before Process button */}
      {!showEnhanced && editHotspots.length > 0 && (
        <Button
          onClick={() => {
            console.log('Back button clicked - reverting to previous state');
            // Go back to the enhanced view
            updateState({
              showEnhanced: true,
              editHotspots: [],
              hotspotCounter: 1
            });
          }}
          className="px-2 py-1 sm:px-2 sm:py-1 text-sm sm:text-sm font-medium transition-all duration-200 pointer-events-auto text-white"
          style={{ 
            padding: '0.25rem 0.5rem',
            minHeight: '32px',
            minWidth: '100px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px) saturate(150%)',
            WebkitBackdropFilter: 'blur(4px) saturate(150%)',
            color: '#ffffff'
          }}
          detectContrast={false}
        >
          <span style={{ color: '#ef4444' }}>←</span> Back
        </Button>
      )}

      {/* Process Edits Button */}
      <motion.div
        animate={processButtonAnimated ? { 
          scale: [1, 1.1, 1]
        } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        style={{ background: 'transparent', border: 'none' }}
      >
        <Button
          onClick={() => {
            console.log('Enhanced edit button clicked:', {
              showEnhanced, 
              editHotspots: editHotspots?.length || 0,
              validHotspots: editHotspots?.filter(h => h.prompt.trim()).length || 0
            });
            if (showEnhanced) {
              // Use the already edited image for further edits
              const editedImageUrl = upscaledImage || processedSrc;
              updateState({
                processingImageUrl: editedImageUrl, // Update processing URL to edited image
                originalSrc: editedImageUrl, // Show current edited image for adding hotspots
                originalImageForComparison: editedImageUrl, // Update comparison image to edited image
                showEnhanced: false,
                editHotspots: [],
                hotspotCounter: 1
              });
            } else {
              // Process existing hotspots
              const validHotspots = editHotspots.filter(hotspot => hotspot.prompt.trim());
              if (validHotspots.length > 0) {
                processRetouch(validHotspots);
              }
            }
          }}
          disabled={(() => {
            if (isProcessing) return true;
            if (showEnhanced) return false;
            
            // Use centralized edit limits logic
            const canProcessResult = canProcessEdits({
              editCount,
              hotspots: editHotspots || []
            });
            
            const isDisabled = !canProcessResult.canProcess;
            console.log('Button disabled state:', {
              isDisabled, 
              isProcessing, 
              showEnhanced, 
              editHotspotsLength: editHotspots.length,
              canProcess: canProcessResult.canProcess,
              reason: canProcessResult.reason
            });
            return isDisabled;
          })()}
           className="px-2 py-1 sm:px-2 sm:py-1 text-sm sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 pointer-events-auto rounded-[2rem] focus:ring-0 focus:outline-none"
           style={{ 
             padding: '0.25rem 0.5rem',
             minHeight: '32px',
             minWidth: '100px',
             background: 'rgba(0, 0, 0, 0.8)',
             border: 'none',
             outline: 'none',
             backdropFilter: 'blur(4px) saturate(150%)',
             WebkitBackdropFilter: 'blur(4px) saturate(150%)',
             color: '#ffffff'
           }}
           detectContrast={false}
        >
{editHotspots.length > 0 
          ? (() => {
              const validHotspots = editHotspots.filter(h => h.prompt.trim());
              if (validHotspots.length === 0) {
                return 'Add descriptions to edit points';
              }
              return `Process ${validHotspots.length} Edit${validHotspots.length !== 1 ? 's' : ''}`;
            })()
          : (showEnhanced ? 'Edit Again' : 'Add Edit Points')}
        </Button>
      </motion.div>


      {/* Download Button - Show after upscaling is complete */}
      {upscaledImage && (
        <Button
          onClick={() => downloadImage(upscaledImage)}
           className={`${isMobile ? 'px-2 py-1 text-xs' : 'sm:px-2 sm:py-1 text-xs sm:text-sm'} font-medium transition-all duration-200 pointer-events-auto`}
           style={{ 
             padding: '0.25rem 0.5rem',
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
  );
};

export default ActionButtons;
