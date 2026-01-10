import React from 'react';
import { motion } from 'framer-motion';

const Instructions = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="mt-8 max-w-md mx-auto"
    >
      <div className="p-6 bg-blue-500/20 border border-blue-400/30 rounded-2xl backdrop-blur-sm">
        <div className="text-sm space-y-3">
          <p className="font-medium text-center text-lg text-gray-800 dark:text-white/90">🎯 Multi-Point Edit Tool</p>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-white/90">1. Upload an image</p>
            <p className="text-gray-700 dark:text-white/90">2. Click on areas you want to edit</p>
            <p className="text-gray-700 dark:text-white/90">3. Type what you want to change</p>
            <p className="text-gray-700 dark:text-white/90">4. Click &quot;Process Edits&quot;</p>
          </div>
          <p className="text-xs text-gray-600 dark:text-white/70 mt-3 text-center">
            💡 Edit multiple areas at once - remove objects, change colors, enhance details
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Instructions;
