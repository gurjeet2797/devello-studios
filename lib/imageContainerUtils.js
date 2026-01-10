/**
 * Shared utility functions for calculating image container dimensions
 * Optimized for both desktop and mobile viewports
 */

/**
 * Calculate optimal container dimensions for an image
 * @param {HTMLImageElement} img - The image element
 * @param {boolean} isMobile - Whether the viewport is mobile
 * @param {Object} options - Additional options
 * @param {number} options.maxHeightMultiplier - Multiplier for max height (default: 0.85 for general, 0.6 for assisted)
 * @returns {{width: string, height: string}} - Container dimensions in pixels
 */
export function calculateContainerDimensions(img, isMobile = false, options = {}) {
  const {
    maxHeightMultiplier = 0.85, // Default for general edit, 0.6 for assisted edit
  } = options;

  // Max container bounds relative to viewport
  const maxWidth = Math.floor(window.innerWidth * 0.95);
  const maxHeight = Math.floor(window.innerHeight * maxHeightMultiplier);

  // Compute fit by whichever side is limiting to improve stability
  const widthScale = maxWidth / img.naturalWidth;
  const heightScale = maxHeight / img.naturalHeight;

  // Keep the same pre-upload minimums
  const minWidth = isMobile ? 280 : 400;
  const minHeight = isMobile ? 200 : 300;

  let containerWidth;
  let containerHeight;
  
  if (heightScale <= widthScale) {
    // Height is the limiting factor; compute width from aspect ratio
    containerHeight = Math.min(maxHeight, img.naturalHeight);
    containerWidth = Math.round(containerHeight * (img.naturalWidth / img.naturalHeight));
  } else {
    // Width is the limiting factor
    containerWidth = Math.min(maxWidth, img.naturalWidth);
    containerHeight = Math.round(containerWidth / (img.naturalWidth / img.naturalHeight));
  }

  // Ensure minimum dimensions
  containerWidth = Math.max(containerWidth, minWidth);
  containerHeight = Math.max(containerHeight, minHeight);

  return {
    width: `${containerWidth}px`,
    height: `${containerHeight}px`
  };
}

/**
 * Check if current viewport is mobile
 * @returns {boolean}
 */
export function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

