import { useState, useEffect, useRef } from 'react';

// Constants for contrast detection
const DEFAULT_THRESHOLD = 128;
const BRIGHTNESS_WEIGHTS = { r: 0.299, g: 0.587, b: 0.114 };
const SAMPLE_SIZE = 3;
const OVERLAP_TOLERANCE = 50; // pixels
const MAX_SEARCH_DEPTH = 20;
const MAX_PARENT_SEARCH_DEPTH = 10;
const INITIAL_DETECTION_DELAY = 200; // ms
const DELAYED_DETECTION_DELAY = 1000; // ms
const DEBOUNCE_DELAY = 50; // ms
const IMAGE_LOAD_DELAY = 100; // ms

/**
 * Hook to detect background color behind an element and determine optimal text color
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Brightness threshold (0-255), default 128
 * @param {boolean} options.enabled - Whether to enable detection, default true
 * @param {boolean} options.debug - Enable debug logging, default false
 * @returns {Object} - { textColor: string, isLight: boolean, elementRef: RefObject }
 */
export function useBackgroundContrast({ threshold = DEFAULT_THRESHOLD, enabled = true, debug = false } = {}) {
  const [textColor, setTextColor] = useState('white');
  const [isLight, setIsLight] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      setTextColor('white');
      setIsLight(false);
      return;
    }

    const detectBackgroundColor = () => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Sample multiple points for better accuracy
      const samplePoints = [
        { x: centerX, y: centerY },
        { x: rect.left + rect.width * 0.25, y: centerY },
        { x: rect.left + rect.width * 0.75, y: centerY },
        { x: centerX, y: rect.top + rect.height * 0.25 },
        { x: centerX, y: rect.top + rect.height * 0.75 },
      ];

      /**
       * Sample pixel brightness from an image at a specific point
       * @param {HTMLImageElement} img - Image element to sample
       * @param {Object} point - { x: number, y: number } in viewport coordinates
       * @returns {number|null} - Brightness value (0-255) or null if unable to sample
       */
      const sampleImagePixel = (img, point) => {
        try {
          // Check if image is loaded and has valid dimensions
          if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
            return null;
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          
          try {
            ctx.drawImage(img, 0, 0);
          } catch (corsError) {
            // CORS error - assume dark background (return low brightness)
            if (debug) console.warn('[CONTRAST_DETECT] CORS error, assuming dark background');
            return 50;
          }

          const imgRect = img.getBoundingClientRect();
          if (imgRect.width === 0 || imgRect.height === 0) return null;

          // Convert viewport coordinates to image coordinates
          const imgX = Math.floor(((point.x - imgRect.left) / imgRect.width) * img.naturalWidth);
          const imgY = Math.floor(((point.y - imgRect.top) / imgRect.height) * img.naturalHeight);

          // Validate coordinates
          if (imgX < 0 || imgX >= img.naturalWidth || imgY < 0 || imgY >= img.naturalHeight) {
            return null;
          }

          // Sample a 3x3 area for better accuracy
          const halfSample = Math.floor(SAMPLE_SIZE / 2);
          let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;
          
          for (let dy = -halfSample; dy <= halfSample; dy++) {
            for (let dx = -halfSample; dx <= halfSample; dx++) {
              const sampleX = Math.max(0, Math.min(img.naturalWidth - 1, imgX + dx));
              const sampleY = Math.max(0, Math.min(img.naturalHeight - 1, imgY + dy));
              const imageData = ctx.getImageData(sampleX, sampleY, 1, 1);
              const [r, g, b] = imageData.data;
              totalR += r;
              totalG += g;
              totalB += b;
              pixelCount++;
            }
          }
          
          const avgR = totalR / pixelCount;
          const avgG = totalG / pixelCount;
          const avgB = totalB / pixelCount;
          
          // Calculate perceived brightness using standard weights
          const brightness = (avgR * BRIGHTNESS_WEIGHTS.r + avgG * BRIGHTNESS_WEIGHTS.g + avgB * BRIGHTNESS_WEIGHTS.b);
          
          if (debug && brightness > 200) {
            console.log('[CONTRAST_DETECT] Bright image detected:', {
              brightness: brightness.toFixed(2),
              r: avgR.toFixed(0),
              g: avgG.toFixed(0),
              b: avgB.toFixed(0),
              threshold,
              willUseBlackText: brightness > threshold
            });
          }
          
          return brightness;
        } catch (e) {
          if (debug) console.warn('[CONTRAST_DETECT] Error sampling image pixel:', e);
          return null;
        }
      };

      let totalBrightness = 0;
      let validSamples = 0;

      for (const point of samplePoints) {
        // Temporarily make button non-interactive to sample what's behind it
        const originalPointerEvents = elementRef.current.style.pointerEvents;
        const originalOpacity = elementRef.current.style.opacity;
        elementRef.current.style.pointerEvents = 'none';
        elementRef.current.style.opacity = '0.01'; // Almost invisible but still in layout
        
        const elementBelow = document.elementFromPoint(point.x, point.y);
        
        // Restore button visibility
        elementRef.current.style.pointerEvents = originalPointerEvents;
        elementRef.current.style.opacity = originalOpacity;

        if (!elementBelow) continue;

        // Walk up the DOM tree to find background element (including IMG)
        let bgElement = elementBelow;
        let foundColor = null;

        // First, check if elementBelow is an IMG element directly
        if (elementBelow.tagName === 'IMG') {
          foundColor = sampleImagePixel(elementBelow, point);
          if (foundColor !== null) {
            totalBrightness += foundColor;
            validSamples++;
            continue;
          }
        }

        let depth = 0;
        while (depth++ < MAX_SEARCH_DEPTH && bgElement && bgElement !== document.body) {
          // Skip the button element itself
          if (bgElement === elementRef.current || elementRef.current.contains(bgElement)) {
            bgElement = bgElement.parentElement;
            continue;
          }

          // Check if this element is an IMG
          if (bgElement.tagName === 'IMG') {
            foundColor = sampleImagePixel(bgElement, point);
            if (foundColor !== null) break;
          }

          const styles = window.getComputedStyle(bgElement);
          const bgColor = styles.backgroundColor;

          // Check for solid background color
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1]);
              const g = parseInt(rgbMatch[2]);
              const b = parseInt(rgbMatch[3]);
              const a = bgColor.includes('rgba')
                ? parseFloat(bgColor.match(/,\s*([\d.]+)\)/)?.[1] || '1')
                : 1;

              // Only use if opaque enough
              if (a > 0.1) {
                // Calculate relative luminance (perceived brightness)
                const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                foundColor = brightness;
                break;
              }
            }
          }

          bgElement = bgElement.parentElement;
        }

        if (foundColor !== null) {
          totalBrightness += foundColor;
          validSamples++;
        }
      }

      if (validSamples > 0) {
        const avgBrightness = totalBrightness / validSamples;
        const light = avgBrightness > threshold;
        setIsLight(light);
        setTextColor(light ? 'black' : 'white');
      } else {
        // Fallback: Try to find images in parent containers more aggressively
        const buttonRect = elementRef.current.getBoundingClientRect();
        const centerPoint = {
          x: buttonRect.left + buttonRect.width / 2,
          y: buttonRect.top + buttonRect.height / 2
        };
        
        let foundImageBrightness = null;
        
        // First, try to find any image in the viewport that might be behind the button
        const allImages = document.querySelectorAll('img');
        let bestMatch = null;
        let bestBrightness = null;
        
        for (const img of allImages) {
          if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            const imgRect = img.getBoundingClientRect();
            // Check if button overlaps with this image (with tolerance)
            if (
              centerPoint.x >= imgRect.left - OVERLAP_TOLERANCE &&
              centerPoint.x <= imgRect.right + OVERLAP_TOLERANCE &&
              centerPoint.y >= imgRect.top - OVERLAP_TOLERANCE &&
              centerPoint.y <= imgRect.bottom + OVERLAP_TOLERANCE
            ) {
              const brightness = sampleImagePixel(img, centerPoint);
              if (brightness !== null) {
                // Use the image that's closest to the button center
                const distance = Math.sqrt(
                  Math.pow(centerPoint.x - (imgRect.left + imgRect.width / 2), 2) +
                  Math.pow(centerPoint.y - (imgRect.top + imgRect.height / 2), 2)
                );
                if (bestMatch === null || distance < bestMatch.distance) {
                  bestMatch = { img, distance };
                  bestBrightness = brightness;
                }
              }
            }
          }
        }
        
        if (bestBrightness !== null) {
          foundImageBrightness = bestBrightness;
        }
        
        // If still not found, search parent containers
        if (foundImageBrightness === null) {
          let parent = elementRef.current?.parentElement;
          let searchDepth = MAX_PARENT_SEARCH_DEPTH;
          while (parent && searchDepth-- > 0 && !foundImageBrightness) {
            const images = parent.querySelectorAll('img');
            for (const img of images) {
              if (img.complete && img.naturalWidth > 0) {
                foundImageBrightness = sampleImagePixel(img, centerPoint);
                if (foundImageBrightness !== null) break;
              }
            }
            parent = parent.parentElement;
          }
        }
        
        if (foundImageBrightness !== null) {
          const light = foundImageBrightness > threshold;
          setIsLight(light);
          setTextColor(light ? 'black' : 'white');
        } else {
          // No image found - default to white text (assume dark background)
          // This ensures buttons are visible even if detection fails
          setIsLight(false);
          setTextColor('white');
        }
      }
    };

    // Initial detection with delay to ensure images are loaded
    const initialTimeout = setTimeout(() => {
      detectBackgroundColor();
    }, INITIAL_DETECTION_DELAY);
    
    // Also detect after a longer delay to catch late-loading images
    const delayedTimeout = setTimeout(() => {
      detectBackgroundColor();
    }, DELAYED_DETECTION_DELAY);

    // Debounced change handler for scroll/resize events
    let changeTimeout = null;
    const handleChange = () => {
      if (changeTimeout) clearTimeout(changeTimeout);
      changeTimeout = setTimeout(detectBackgroundColor, DEBOUNCE_DELAY);
    };

    // Detect when images load
    const handleImageLoad = () => {
      setTimeout(detectBackgroundColor, IMAGE_LOAD_DELAY);
    };

    // Listen for image load events on all images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad, { once: true });
      }
    });

    window.addEventListener('scroll', handleChange, { passive: true });
    window.addEventListener('resize', handleChange, { passive: true });

    // Watch for theme changes and DOM changes (new images added)
    const observer = new MutationObserver((mutations) => {
      handleChange();
      // Check for new images
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'IMG') {
              if (node.complete) {
                handleImageLoad();
              } else {
                node.addEventListener('load', handleImageLoad, { once: true });
              }
            }
            // Check for images in subtree
            const imgs = node.querySelectorAll?.('img');
            imgs?.forEach(img => {
              if (img.complete) {
                handleImageLoad();
              } else {
                img.addEventListener('load', handleImageLoad, { once: true });
              }
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'src']
    });

    // Don't observe theme changes - we only care about images, not theme
    // observer.observe(document.documentElement, {
    //   attributes: true,
    //   attributeFilter: ['class'],
    // });

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(delayedTimeout);
      if (changeTimeout) clearTimeout(changeTimeout);
      window.removeEventListener('scroll', handleChange);
      window.removeEventListener('resize', handleChange);
      observer.disconnect();
    };
  }, [enabled, threshold, debug]);

  return { textColor, isLight, elementRef };
}

