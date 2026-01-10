import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackgroundContrast } from '../../hooks/useBackgroundContrast';

export default function LightingInterface({ 
  isOpen, 
  lightingOptions, 
  onProcessImage, 
  isProcessing 
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const headerRef = useRef(null);
  const { textColor: headerTextColor, elementRef: headerElementRef } = useBackgroundContrast({ 
    enabled: true,
    threshold: 140
  });
  
  // Sync refs - attach the hook's ref to our component ref
  useEffect(() => {
    if (headerElementRef && headerRef.current) {
      headerElementRef.current = headerRef.current;
    }
  }, [headerElementRef]);
  
  // Hide interface with animation when processing starts
  useEffect(() => {
    if (isProcessing && selectedOption) {
      // Start the disappearing animation
      setIsFadingOut(true);
      // Hide the component after animation completes
      const timer = setTimeout(() => {
        setIsHidden(true);
        setIsFadingOut(false);
      }, 400); // Match the transition duration
      return () => clearTimeout(timer);
    }
  }, [isProcessing, selectedOption]);

  // Interface stays hidden after processing - user must click edit again
  
  // Reset hidden state when interface opens, hide when it closes
  useEffect(() => {
    if (isOpen) {
      setIsHidden(false);
      setIsFadingOut(false);
      setSelectedOption(null);
    } else {
      // When isOpen becomes false, hide the interface immediately
      setIsHidden(true);
      setIsFadingOut(false);
      setSelectedOption(null);
    }
  }, [isOpen]);
  
  // Only hide if explicitly closed or if hidden due to processing
  if (!isOpen || (isHidden && !isFadingOut)) return null;

  const handleOptionClick = async (option) => {
    setSelectedOption(option.key);
    
    // Add a small delay to prevent state conflicts
    setTimeout(async () => {
      await onProcessImage(option.key);
    }, 50);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isFadingOut ? 0 : 1, 
        y: isFadingOut ? 20 : 0,
        scale: isFadingOut ? 0.8 : 1
      }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-2 left-0 right-0 w-full max-w-xs mx-auto px-2 sm:max-w-sm sm:px-3 md:max-w-xs md:px-4"
      style={{ zIndex: 45 }}
      data-edit-menu
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <div 
        className="rounded-[2rem] p-4 sm:p-5 md:p-4 lg:p-4 border shadow-2xl"
        style={{
          background: 'rgba(220, 220, 220, 0.15)',
          backdropFilter: 'blur(8px) saturate(150%)',
          WebkitBackdropFilter: 'blur(8px) saturate(150%)',
          borderColor: 'rgba(200, 200, 200, 0.3)'
        }}
      >
        <div className="flex justify-center mb-3 sm:mb-4 md:mb-3">
          <div 
            ref={headerRef}
            className={`${headerTextColor === 'black' ? 'text-black' : 'text-white'} text-center font-semibold text-lg sm:text-xl md:text-base lg:text-base drop-shadow-lg px-4 py-2 md:px-4 md:py-2 w-fit`}>
            Choose Lighting Style
          </div>
        </div>
        <div className="space-y-2 sm:space-y-2.5 md:space-y-2">
          {lightingOptions.map((option) => (
            <motion.button
              key={option.key}
              onClick={() => handleOptionClick(option)}
              disabled={isProcessing || selectedOption === option.key}
              whileHover={!isProcessing && selectedOption !== option.key ? { scale: 1.02 } : {}}
              whileTap={!isProcessing && selectedOption !== option.key ? { y: 0, scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`w-full px-4 py-2 sm:px-5 sm:py-2.5 md:px-4 md:py-2 lg:px-4 lg:py-2 rounded-[2rem] font-semibold transition-all duration-200 border text-left group ${
                selectedOption === option.key
                  ? 'border-blue-400/60 drop-shadow-md'
                  : 'border-white/30 hover:border-white/40 drop-shadow-sm'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{
                transformOrigin: "center center",
                background: selectedOption === option.key 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'rgba(220, 220, 220, 0.2)',
                backdropFilter: 'blur(4px) saturate(150%)',
                WebkitBackdropFilter: 'blur(4px) saturate(150%)'
              }}
            >
              <span className="text-base sm:text-lg md:text-sm lg:text-sm font-semibold drop-shadow-sm">{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
