/**
 * Standalone/Webapp Mode Detection Utility
 * 
 * Detects if the app is running in standalone/webapp mode (home screen)
 * Works for both iOS Safari standalone and standard PWA standalone modes
 */

export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  
  // iOS Safari standalone mode
  const isIOSStandalone = window.navigator.standalone === true;
  
  // Standard PWA standalone mode
  const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  return isIOSStandalone || isPWAStandalone;
}

/**
 * React hook for standalone mode detection
 * Returns current standalone state and updates on changes
 */
import { useState, useEffect } from 'react';

export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkStandalone = () => {
      setIsStandalone(isStandaloneMode());
    };
    
    checkStandalone();
    
    // Listen for display mode changes (in case user switches)
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
      return () => mediaQuery.removeEventListener('change', checkStandalone);
    }
  }, []);
  
  return isStandalone;
}

