import React from 'react';
import { motion } from 'framer-motion';

const MobileThemeToggle = ({ isDark, toggleTheme }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ y: 0, scale: 0.95 }}
      onClick={toggleTheme}
      className={`about-devello-glass p-1 rounded-full transition-all duration-300 h-10 w-10 md:h-12 md:w-12 flex items-center justify-center flex-shrink-0 ${isDark !== false ? 'text-white' : ''}`}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      style={{ 
        transformOrigin: "center center",
        color: isDark !== false ? 'white' : undefined
      }}
    >
      <motion.div
        animate={{ rotate: isDark ? 180 : 0, scale: isDark ? 1 : 1 }}
        transition={{ duration: 0.5 }}
        className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center"
      >
        {isDark ? (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(50deg)', color: 'white' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
};

export default MobileThemeToggle;

