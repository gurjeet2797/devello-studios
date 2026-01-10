/**
 * Centralized Status Bar Control for iOS Safari
 * 
 * This utility manages the theme-color and apple-mobile-web-app-status-bar-style
 * meta tags to ensure consistent status bar appearance across the app.
 * 
 * Only two colors are allowed:
 * - Light mode: #ffffff (white)
 * - Dark mode: #000000 (black)
 */

// Add helper function to detect standalone mode
function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true || 
         window.matchMedia('(display-mode: standalone)').matches;
}

// Theme colors - these are the ONLY colors the status bar should ever be
// Same colors for both browser and webapp modes
export const STATUS_BAR_COLORS = {
  light: '#ffffff', // White for light mode
  dark: '#000000'   // Black for dark mode
};

/**
 * Get the current theme color based on dark mode state
 * Browser and webapp modes now use the same colors
 */
export function getThemeColor(isDark) {
  if (isDark) {
    return STATUS_BAR_COLORS.dark;
  }
  return STATUS_BAR_COLORS.light;
}

/**
 * Update the theme-color meta tag
 * iOS Safari requires removing and re-adding the meta tag for changes to take effect
 */
function updateThemeColorMeta(color) {
  if (typeof document === 'undefined') return;
  
  // Remove all existing theme-color meta tags
  const existingMetas = document.querySelectorAll('meta[name="theme-color"]');
  existingMetas.forEach(meta => meta.remove());
  
  // Create new theme-color meta tag
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', color);
  document.head.appendChild(meta);
}

/**
 * Update the apple-mobile-web-app-status-bar-style meta tag
 * Options: 'default', 'black', 'black-translucent'
 * - 'black-translucent': Content extends under status bar (for transparency/blur effects)
 * - 'black': Status bar is solid black
 * - 'default': Status bar uses the theme-color
 */
function updateAppleStatusBarStyle(style) {
  if (typeof document === 'undefined') return;
  
  let meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', style);
}

/**
 * Update the status bar area div background (for visual consistency)
 */
function updateStatusBarAreaDiv(color, isBlurred = false) {
  if (typeof document === 'undefined') return;
  
  const statusBarArea = document.querySelector('.status-bar-area');
  if (statusBarArea) {
    // When blurred (menu open), keep transparent so blur shows through
    // Otherwise use the theme color
    statusBarArea.style.background = isBlurred ? 'transparent' : color;
    
    if (isBlurred) {
      statusBarArea.style.backdropFilter = 'blur(20px)';
      statusBarArea.style.webkitBackdropFilter = 'blur(20px)';
    } else {
      statusBarArea.style.backdropFilter = '';
      statusBarArea.style.webkitBackdropFilter = '';
    }
  }
}

/**
 * Main function to update the status bar
 * @param {boolean} isDark - Whether dark mode is active
 * @param {Object} options - Additional options
 * @param {boolean} options.isModalOpen - Whether a modal is open (enables blur)
 * @param {boolean} options.forceBlurMode - Force blur mode for special cases
 */
export function updateStatusBar(isDark, options = {}) {
  const { isModalOpen = false, forceBlurMode = false } = options;
  
  const color = getThemeColor(isDark);
  const shouldBlur = isModalOpen || forceBlurMode;
  
  // Update theme-color meta tag
  updateThemeColorMeta(color);
  
  // Update apple status bar style
  // Use 'black-translucent' for blur effects, otherwise use theme-appropriate style
  if (shouldBlur) {
    updateAppleStatusBarStyle('black-translucent');
  } else {
    // For non-blur states, use 'black-translucent' to allow our theming to work
    // This ensures the status bar takes on the theme-color
    updateAppleStatusBarStyle('black-translucent');
  }
  
  // Update the visual status bar area div
  updateStatusBarAreaDiv(color, shouldBlur);
}

/**
 * Force update with retry logic for iOS Safari caching issues
 * @param {boolean} isDark - Whether dark mode is active
 * @param {Object} options - Additional options
 */
export function forceUpdateStatusBar(isDark, options = {}) {
  // Immediate update
  updateStatusBar(isDark, options);
  
  // Retry with delays for iOS Safari
  const delays = [50, 100, 200, 500];
  delays.forEach(delay => {
    setTimeout(() => {
      updateStatusBar(isDark, options);
    }, delay);
  });
}

/**
 * React hook for status bar control
 * Automatically reverts to theme-appropriate color on unmount
 */
import { useEffect, useCallback } from 'react';

export function useStatusBarControl(isDark) {
  const update = useCallback((options = {}) => {
    updateStatusBar(isDark, options);
  }, [isDark]);
  
  const forceUpdate = useCallback((options = {}) => {
    forceUpdateStatusBar(isDark, options);
  }, [isDark]);
  
  return { update, forceUpdate };
}

/**
 * Hook specifically for modals - sets blur mode on mount, reverts on unmount
 */
export function useModalStatusBar(isDark, isOpen) {
  useEffect(() => {
    if (isOpen) {
      updateStatusBar(isDark, { isModalOpen: true });
      
      return () => {
        // Revert to normal state when modal closes
        updateStatusBar(isDark, { isModalOpen: false });
      };
    }
  }, [isDark, isOpen]);
}

/**
 * Initialize status bar on app load
 * Should be called once at app startup
 */
export function initializeStatusBar(isDark) {
  forceUpdateStatusBar(isDark);
}

export default {
  STATUS_BAR_COLORS,
  getThemeColor,
  updateStatusBar,
  forceUpdateStatusBar,
  useStatusBarControl,
  useModalStatusBar,
  initializeStatusBar
};

