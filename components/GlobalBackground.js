import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToolStateContext } from './contexts/ToolStateManager';
import { useTheme } from './Layout';
import Aurora from './Aurora';
import LightRays from './LightRays';

export default function GlobalBackground({ toolType = 'general-edit', toolId }) {
  const context = React.useContext(ToolStateContext);
  const { isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile detection - more comprehensive
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768 || 
                            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Safety check for context and function
  const shouldShowBlackBackground = context?.shouldShowBlackBackground;
  
  // Get tool-specific background state with fallback
  const shouldFadeToBlack = shouldShowBlackBackground ? shouldShowBlackBackground(toolId) : false;

  // Define color stops based on theme
  const auroraColors = isDark 
    ? ['#FFB000', '#FFFFFF', '#FFB000'] // Dark mode: orange, white, orange
    : ['#FFFFFF', '#FFB000', '#FFFFFF']; // Light mode: white, amber, white

  return (
    <div 
      key={`background-${toolId}`} // Tool-specific key
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: -1, // Behind BeamsBackground but above body
        opacity: shouldFadeToBlack ? 0 : 1
      }}
    >
      {/* Desktop only - Aurora/LightRays */}
      {!isMobile && (
        toolType === 'general-edit' ? <Aurora colorStops={auroraColors} /> : <LightRays
          raysOrigin="top-center"
          raysColor="#fff8f0"
          raysSpeed={1}
          lightSpread={1}
          rayLength={2}
          pulsating={false}
          fadeDistance={1.0}
          saturation={1.0}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.0}
          distortion={0.0}
        />
      )}
      
      {/* Mobile fallback - simple background */}
      {isMobile && (
        <div 
          className="w-full h-full"
          style={{
            background: isDark ? '#000000' : '#ffffff', // Use theme background - white in light mode
            backgroundAttachment: 'fixed'
          }}
        />
      )}
    </div>
  );
}
