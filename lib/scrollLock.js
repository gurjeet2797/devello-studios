/**
 * Utility to lock/unlock body scroll while maintaining scrollbar space
 * Prevents layout shifts when scrollbars appear/disappear
 */

let scrollbarWidth = null;

/**
 * Calculate scrollbar width (cached)
 */
function getScrollbarWidth() {
  if (scrollbarWidth !== null) {
    return scrollbarWidth;
  }
  
  // Create a temporary div to measure scrollbar width
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.msOverflowStyle = 'scrollbar';
  document.body.appendChild(outer);
  
  const inner = document.createElement('div');
  outer.appendChild(inner);
  
  scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  
  outer.parentNode.removeChild(outer);
  
  return scrollbarWidth;
}

/**
 * Lock body scroll while maintaining scrollbar space
 * @param {number} scrollY - Current scroll position
 */
export function lockBodyScroll(scrollY) {
  const scrollbarWidth = getScrollbarWidth();
  
  // Save original styles
  const originalStyles = {
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflowY: document.body.style.overflowY,
    overflowX: document.body.style.overflowX,
    touchAction: document.body.style.touchAction,
    paddingRight: document.body.style.paddingRight
  };
  
  // Lock scroll but maintain scrollbar space
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = '100%';
  document.body.style.overflowY = 'scroll'; // Keep scrollbar space
  document.body.style.overflowX = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth}px`; // Compensate for scrollbar
  
  // Prevent zoom on mobile
  document.body.style.touchAction = 'none';
  
  // Store original styles for restoration
  document.body.setAttribute('data-scroll-lock-styles', JSON.stringify(originalStyles));
  document.body.setAttribute('data-scroll-y', scrollY.toString());
  
  return () => {
    unlockBodyScroll();
  };
}

/**
 * Unlock body scroll and restore position
 */
export function unlockBodyScroll() {
  const scrollY = parseInt(document.body.getAttribute('data-scroll-y') || '0', 10);
  const originalStylesStr = document.body.getAttribute('data-scroll-lock-styles');
  
  // Restore original styles
  if (originalStylesStr) {
    try {
      const originalStyles = JSON.parse(originalStylesStr);
      document.body.style.position = originalStyles.position || '';
      document.body.style.top = originalStyles.top || '';
      document.body.style.width = originalStyles.width || '';
      document.body.style.overflowY = originalStyles.overflowY || '';
      document.body.style.overflowX = originalStyles.overflowX || '';
      document.body.style.touchAction = originalStyles.touchAction || '';
      document.body.style.paddingRight = originalStyles.paddingRight || '';
    } catch (e) {
      // Fallback if JSON parse fails
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      document.body.style.overflowX = '';
      document.body.style.touchAction = '';
      document.body.style.paddingRight = '';
    }
  }
  
  // Remove attributes
  document.body.removeAttribute('data-scroll-lock-styles');
  document.body.removeAttribute('data-scroll-y');
  
  // Restore scroll position
  window.scrollTo(0, scrollY);
}

