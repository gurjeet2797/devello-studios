import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function Loader({ message = null, showMessage = true, animatedMessages = false, isUploading = false }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Animated processing messages
  const processingMessages = [
    "Viewing the scene...",
    "Editing details...",
    "Blending colors...",
    "Rendering the scene...",
    "Polishing results...",
    "Almost ready..."
  ];
  
  // Animated upload messages
  const uploadMessages = [
    "Preparing your image...",
    "Finalizing upload..."
  ];
  
  // Choose message set based on context
  const messageSet = isUploading ? uploadMessages : processingMessages;
  
  // Cycle through animated messages
  useEffect(() => {
    if (!animatedMessages) return;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messageSet.length);
    }, 2000); // Change message every 2 seconds
    
    return () => clearInterval(interval);
  }, [animatedMessages, messageSet.length]);
  
  const displayMessage = animatedMessages ? messageSet[currentMessageIndex] : message;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full mb-3"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <AnimatePresence mode="wait">
        {showMessage && displayMessage && (
          <motion.div
            key={displayMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-white/90 text-sm font-medium text-center px-4"
            style={{ 
              textShadow: '0 0 15px rgba(255,255,255,0.4)',
              maxWidth: '250px'
            }}
          >
            {displayMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
