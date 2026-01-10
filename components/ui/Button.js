import React from 'react';
import { motion } from 'framer-motion';
import { useBackgroundContrast } from '../../hooks/useBackgroundContrast';

export function Button({ 
  children, 
  className = '', 
  detectContrast = true,
  ...props 
}) {
  const { textColor, elementRef } = useBackgroundContrast({ 
    enabled: detectContrast,
    threshold: 128 // Standard threshold - white (255) should easily pass this
  });

  // Check if className already has text color classes (text-white, text-black, etc.)
  // If user explicitly sets a text color class, respect it and disable detection
  const hasTextColorClass = /text-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)/.test(className);
  
  // Determine final text color - prioritize explicit className, then use detection
  let finalTextColorClass = '';
  let finalTextColorStyle = null;
  
  if (hasTextColorClass) {
    // User explicitly set text color - use className only, no inline style override
    finalTextColorClass = '';
    finalTextColorStyle = undefined; // Let CSS handle it
  } else if (detectContrast) {
    // Use detected color - apply both class and inline style for maximum compatibility
    finalTextColorClass = textColor === 'black' ? 'text-black' : 'text-white';
    finalTextColorStyle = textColor === 'black' ? '#000000' : '#ffffff';
  } else {
    // Detection disabled - default to white text
    finalTextColorClass = 'text-white';
    finalTextColorStyle = '#ffffff';
  }

  return (
    <motion.button
      ref={elementRef}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95, y: 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`px-4 py-2 rounded-[2rem] font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/20 disabled:opacity-50 ${finalTextColorClass} ${className}`}
      style={{ 
        transformOrigin: "center center",
        ...props.style,
        // Inline style takes precedence over CSS classes
        color: finalTextColorStyle !== undefined ? finalTextColorStyle : props.style?.color
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default Button; 
