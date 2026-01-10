import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './Layout';

const BeforeAfterSlider = ({ 
  beforeImage = '/api/placeholder/600/400?text=Before',
  afterImage = '/api/placeholder/600/400?text=After',
  className = ""
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const { isDark } = useTheme();

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateSliderPosition(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateSliderPosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,245,241,0.8) 100%)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(180,140,90,0.2)'}`,
        boxShadow: isDark 
          ? '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 20px 40px rgba(180,140,90,0.15), inset 0 1px 0 rgba(255,255,255,0.8)'
      }}
    >
      <div
        ref={containerRef}
        className="relative aspect-video cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
      >
        {/* Before Image */}
        <div className="absolute inset-0">
          <img
            src={beforeImage}
            alt="Before transformation"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 left-4">
            <div className={`px-4 py-2 rounded-lg text-base font-medium transition-colors duration-300 ${
              isDark 
                ? 'bg-black/60 text-white/90 border border-white/20'
                : 'bg-white/80 text-amber-900 border border-amber-200/50'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
            >
              Before
            </div>
          </div>
        </div>

        {/* After Image with Clip */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={afterImage}
            alt="After transformation"
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute top-4 right-4">
            <div className={`px-4 py-2 rounded-lg text-base font-medium transition-colors duration-300 ${
              isDark 
                ? 'bg-black/60 text-white/90 border border-white/20'
                : 'bg-white/80 text-amber-900 border border-amber-200/50'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
            >
              After
            </div>
          </div>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
          style={{ 
            left: `${sliderPosition}%`,
            boxShadow: '0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.3)'
          }}
        />

        {/* Slider Handle */}
        <motion.div
          className={`absolute top-1/2 w-8 h-8 -ml-4 -mt-4 rounded-full cursor-col-resize z-20 transition-all duration-200 ${
            isDragging ? 'scale-110' : 'scale-100'
          }`}
          style={{ 
            left: `${sliderPosition}%`,
            background: isDark 
              ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,245,241,0.9) 100%)',
            backdropFilter: 'blur(10px)',
            border: `2px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(180,140,90,0.3)'}`,
            boxShadow: isDark 
              ? '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 4px 12px rgba(180,140,90,0.2), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className={`w-3 h-3 rounded-full ${
              isDark ? 'bg-white/60' : 'bg-amber-800/60'
            }`} />
          </div>
        </motion.div>

        {/* Drag Instructions */}
        {!isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
          >
            <div className={`px-4 py-2 rounded-lg text-sm font-light transition-colors duration-300 ${
              isDark 
                ? 'bg-black/40 text-white/60 border border-white/10'
                : 'bg-white/60 text-amber-800/60 border border-amber-200/30'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
            >
              Drag to compare
            </div>
          </motion.div>
        )}
      </div>

      {/* Caption */}
      <div className="p-6 text-center">
        <p className={`text-base font-normal tracking-normal transition-colors duration-300 ${
          isDark ? 'text-white/70' : 'text-gray-700'
        }`}>
          Drag the slider to compare before and after
        </p>
      </div>
    </motion.div>
  );
};

export default BeforeAfterSlider; 
