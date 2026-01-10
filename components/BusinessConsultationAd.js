"use client"

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointerClick } from 'lucide-react';
import { MeshGradient } from "@paper-design/shaders-react";
import { Pacifico } from "next/font/google";
import { useRouter } from 'next/router';
import BusinessConsultationForm from './BusinessConsultationForm';

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

const BusinessConsultationAd = ({ isDark }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [isInAnnotationMode, setIsInAnnotationMode] = useState(false);
  const glassContainerRef = useRef(null);
  const router = useRouter();

  const handleExpand = () => {
    setIsExpanding(true);
    
    // Scroll to center the button in viewport
    if (glassContainerRef.current) {
      const rect = glassContainerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
      window.scrollTo({
        top: scrollY,
        behavior: 'smooth'
      });
    }
    
    // Wait for scroll completion before expanding
    setTimeout(() => {
      setIsExpanded(true);
      setIsExpanding(false);
    }, 300);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsInAnnotationMode(false);
  };

  // Check for hash to auto-open form
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#open-form' && !isExpanded) {
        // Small delay to ensure page is loaded and component is ready
        setTimeout(() => {
          handleExpand();
          // Remove hash from URL without triggering reload
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }, 500);
      }
    };

    // Check on mount
    const timer = setTimeout(checkHash, 100);
    
    // Also check on route change
    const handleRouteChange = () => {
      setTimeout(checkHash, 100);
    };
    
    router.events?.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      clearTimeout(timer);
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Scroll lock when expanded
  useEffect(() => {
    if (isExpanded) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      const originalBodyPosition = document.body.style.position
      const scrollY = window.scrollY
      
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.body.style.top = `-${scrollY}px`
      document.body.style.touchAction = "none"
      document.body.classList.add('business-consultation-expanded')
      
      return () => {
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.style.position = originalBodyPosition
        document.body.style.width = ""
        document.body.style.top = ""
        document.body.style.touchAction = ""
        document.body.classList.remove('business-consultation-expanded')
        window.scrollTo(0, scrollY)
      }
    }
  }, [isExpanded])

  return (
    <>
      {/* Glass Button */}
      <div className="relative w-full min-h-[80px] flex items-center justify-center py-4">
        <motion.div 
          className="relative inline-block"
          style={{ 
            willChange: 'transform',
            contain: 'layout style'
          }}
        >
          {/* Gradient Background */}
          <motion.div
            animate={{ 
              opacity: isExpanding ? 0 : 1 
            }}
            transition={{ 
              opacity: {
                duration: 0.15,
                ease: [0.16, 1, 0.3, 1]
              }
            }}
            className="absolute inset-0 w-full h-full items-center justify-center transform-gpu will-change-transform overflow-hidden rounded-full pointer-events-none"
            style={{
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #fbbf24 0%, #fcd34d 50%, #ffffff 100%)",
            }}
          />
          <motion.div 
            ref={glassContainerRef}
            layoutId="business-consultation-glass-container"
            className={`glass-container show about-devello-glass px-6 sm:px-8 py-4 sm:py-5 cursor-pointer relative z-10`}
            onClick={handleExpand}
          whileTap={{
            scale: 0.97,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          }}
          animate={{
            scale: isExpanding ? 0.97 : 1,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            layout: false
          }}
          layout={!isExpanding}
          layoutTransition={{ 
            type: "spring",
            stiffness: 250,
            damping: 35,
            mass: 0.8
          }}
            style={{ 
              cursor: 'pointer',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              backgroundColor: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: '1px',
              borderRadius: '9999px',
              maxWidth: '360px',
              width: '100%',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            <h3 
              className={pacifico.className}
              style={{ 
                fontSize: '1.5rem', 
                fontWeight: 400, 
                color: '#000000',
                marginBottom: '0.25rem',
                lineHeight: '1.2',
                position: 'relative',
                zIndex: 1
              }}
            >
              get meaningful advice
            </h3>
            <p style={{ 
              whiteSpace: 'nowrap', 
              fontFamily: 'Georgia, serif', 
              fontWeight: 'normal',
              fontSize: '0.875rem',
              color: 'rgba(0, 0, 0, 0.8)',
              position: 'relative',
              zIndex: 1
            }}>
              start my consultation <MousePointerClick className="w-3 h-3 sm:w-4 sm:h-4 inline-block ml-0.5 align-middle" style={{ transform: 'translateY(-2px)' }} />
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Expanded View */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center pt-28 sm:pt-8 pb-8 px-4 sm:pb-8 sm:px-8"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleClose();
                }
              }}
              onWheel={(e) => e.preventDefault()}
              onTouchMove={(e) => e.preventDefault()}
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                touchAction: 'none'
              }}
            >
              <motion.div
                layoutId="business-consultation-glass-container"
                layout
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 35,
                  mass: 0.8,
                  layout: {
                    type: "spring",
                    stiffness: 250,
                    damping: 35
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className={`about-devello-glass w-full max-w-2xl transform-gpu will-change-transform overflow-x-visible relative z-[10000] backdrop-blur-md ${
                  isInAnnotationMode 
                    ? 'h-[70vh] sm:h-[75vh] max-h-[70vh] sm:max-h-[75vh] overflow-y-auto' 
                    : 'max-h-[calc(100vh-7rem)] sm:max-h-[85vh] overflow-y-auto'
                }`}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  backgroundColor: isDark 
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(255, 255, 255, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: typeof window !== 'undefined' && window.innerWidth < 640 ? '2rem' : '1.75rem'
                }}
              >
                {/* Gradient Background for Expanded Modal */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    opacity: {
                      duration: 0.2,
                      ease: [0.16, 1, 0.3, 1]
                    }
                  }}
                  className="absolute inset-0 min-h-full pointer-events-none"
                  style={{
                    borderRadius: typeof window !== 'undefined' && window.innerWidth < 640 ? '2rem' : '1.75rem',
                    height: "auto",
                    minHeight: "100%"
                  }}
                >
                  <MeshGradient
                    speed={1}
                    colors={isDark 
                      ? ["#000000", "#1a1a1a", "#2a2a2a", "#3a3a3a", "#fbbf24"]
                      : ["#fef3c7", "#fef9e7", "#ffffff", "#ffffff", "#ffffff"]
                    }
                    distortion={0.8}
                    swirl={0.1}
                    grainMixer={0}
                    grainOverlay={0}
                    className="inset-0"
                    style={{ height: "100%", width: "100%", minHeight: "100%" }}
                  />
                </motion.div>
                <motion.button
                  onClick={handleClose}
                  whileTap={{ 
                    scale: 0.85,
                    transition: { 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25 
                    }
                  }}
                  className="about-devello-glass rounded-full w-10 h-10 flex items-center justify-center z-20 hover:bg-white/10 text-white/70 hover:text-white"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    left: 'auto',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.25)'
                  }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
                <div className={`relative z-10 p-8 sm:p-8 md:p-12 lg:p-16 xl:p-20 sm:pt-8 sm:pb-3 md:pb-5 lg:pb-7 xl:pb-10 sm:px-8 overflow-x-visible rounded-[2rem] sm:rounded-3xl ${
                  isInAnnotationMode ? 'h-full overflow-y-auto' : 'h-auto'
                }`}>
                  <BusinessConsultationForm 
                    isDark={isDark} 
                    onClose={handleClose}
                    onAnnotationModeChange={setIsInAnnotationMode}
                  />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default BusinessConsultationAd;

