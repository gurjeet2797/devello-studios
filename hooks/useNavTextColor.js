import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect background color behind nav buttons and determine appropriate text color
 * Returns 'dark' for black text (on light backgrounds) or 'light' for white text (on dark backgrounds)
 */
export function useNavTextColor(navRef, options = {}) {
  const { 
    enabled = true,
    threshold = 0.4, // Luminance threshold (0-1). Lower = more sensitive to light backgrounds
    debounceMs = 100,
    samplePoints = 5 // Number of points to sample behind each button
  } = options;

  const [textColorMode, setTextColorMode] = useState('light'); // 'light' = white text, 'dark' = black text
  const rafRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navRef?.current) {
      return;
    }

    const sampleBackgroundColor = (x, y) => {
      const elementBelow = document.elementFromPoint(x, y);
      if (!elementBelow) return null;

      // Skip nav elements
      if (elementBelow === navRef.current || elementBelow.closest('nav')) {
        return null;
      }

      let bgElement = elementBelow;
      let maxDepth = 15;

      while (maxDepth-- > 0 && bgElement) {
        if (bgElement === navRef.current || bgElement.closest('nav')) {
          bgElement = bgElement.parentElement;
          continue;
        }

        const styles = window.getComputedStyle(bgElement);
        const bgColor = styles.backgroundColor;

        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const a = bgColor.includes('rgba')
              ? parseFloat(bgColor.match(/,\s*([\d.]+)\)/)?.[1] || '1')
              : 1;

            if (a > 0.1) {
              return { r, g, b };
            }
          }
        }

        bgElement = bgElement.parentElement;
      }

      return null;
    };

    const detectBackgroundColor = () => {
      if (!navRef.current) return;

      const navRect = navRef.current.getBoundingClientRect();
      const samples = [];

      // Sample points across the nav bar
      const sampleXPositions = [];
      for (let i = 0; i < samplePoints; i++) {
        sampleXPositions.push(
          navRect.left + (navRect.width / (samplePoints + 1)) * (i + 1)
        );
      }

      sampleXPositions.forEach(x => {
        const y = navRect.top + navRect.height / 2;
        const color = sampleBackgroundColor(x, y);
        if (color) {
          samples.push(color);
        }
      });

      if (samples.length === 0) {
        // Default: check if we're in dark mode, otherwise assume light background
        const isDarkMode = document.documentElement.classList.contains('dark') || 
                          document.documentElement.classList.contains('html.dark');
        setTextColorMode(isDarkMode ? 'light' : 'dark');
        return;
      }

      // Calculate average luminance
      let totalLuminance = 0;
      samples.forEach(sample => {
        // Relative luminance formula
        const luminance = (0.299 * sample.r + 0.587 * sample.g + 0.114 * sample.b) / 255;
        totalLuminance += luminance;
      });

      const avgLuminance = totalLuminance / samples.length;

      // If background is light (luminance > threshold), use dark text
      // If background is dark (luminance <= threshold), use light text
      setTextColorMode(avgLuminance > threshold ? 'dark' : 'light');
    };

    const debouncedDetect = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          detectBackgroundColor();
        });
      }, debounceMs);
    };

    // Initial detection
    detectBackgroundColor();

    // Listen to scroll and resize
    window.addEventListener('scroll', debouncedDetect, { passive: true });
    window.addEventListener('resize', debouncedDetect);

    // Periodic check for dynamic content changes
    const interval = setInterval(detectBackgroundColor, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('scroll', debouncedDetect);
      window.removeEventListener('resize', debouncedDetect);
      clearInterval(interval);
    };
  }, [enabled, threshold, debounceMs, samplePoints, navRef]);

  return textColorMode;
}

