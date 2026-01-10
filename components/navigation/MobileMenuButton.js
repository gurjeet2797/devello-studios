import React from 'react';
import { motion } from 'framer-motion';

const MobileMenuButton = ({ mobileMenuOpen, setMobileMenuOpen, isDark, servicePageTint }) => {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className="about-devello-glass p-1 rounded-full h-10 w-10 min-w-[40px] flex items-center justify-center flex-shrink-0 flex-grow-0 mobile-menu-button-fix"
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{ 
        transformOrigin: "center center",
        willChange: "transform",
        ...(servicePageTint ? {
          backgroundColor: servicePageTint.bgColor,
          borderColor: servicePageTint.borderColor
        } : {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
        })
      }}
    >
      <div className="w-5 h-5 flex flex-col justify-center items-center">
        <motion.div
          animate={{ 
            rotate: mobileMenuOpen ? 45 : 0,
            y: mobileMenuOpen ? 2 : -2
          }}
          className="w-4 h-0.5 transition-colors duration-300"
          style={{ 
            backgroundColor: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.8)'
          }}
        />
        <motion.div
          animate={{ 
            rotate: mobileMenuOpen ? -45 : 0,
            y: mobileMenuOpen ? -2 : 2
          }}
          className="w-4 h-0.5 transition-colors duration-300"
          style={{ 
            backgroundColor: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.8)'
          }}
        />
      </div>
    </motion.button>
  );
};

export default MobileMenuButton;

