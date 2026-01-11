"use client"

/**
 * CustomBuildsButton - Separate button component for custom builds forms
 * 
 * NOTE: This is a SEPARATE component from BuildButton.js (home page button).
 * Do not confuse this with BuildButton - they serve different purposes:
 * - BuildButton: Main home page button with service selection
 * - CustomBuildsButton: Dedicated button for custom builds form on service pages
 * 
 * This component should remain independent to avoid accidental updates to the home page BuildButton.
 */

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Pacifico } from "next/font/google"
import { MousePointerClick, X } from "lucide-react"
import { useRouter } from 'next/router'
import CustomProductForm from "./CustomProductForm"
import IdeaBuildDemo from "./IdeaBuildDemo"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

const CustomBuildsButton = ({ isDark = false, formTitle = "Custom Builds", color = "green", buttonSize = "normal" }) => {
  const [isInAnnotationMode, setIsInAnnotationMode] = useState(false)
  const [showGlassButton, setShowGlassButton] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSpringing, setIsSpringing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const glassButtonRef = useRef(null)
  const router = useRouter()

  const titleLower = formTitle.toLowerCase()
  const isBuildRequest = titleLower.includes('build request')
  
  const dynamicWords = [
    "anything",
    "an app",
    "a game",
    "an image",
    "a video"
  ]

  // Get gradient for current word
  const getGradientForWord = (word) => {
    // Explicit gradients for dynamic words (build request) - more vibrant colors
    if (word === "anything") {
      return "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #ffffff 100%)" // blue
    }
    if (word === "an app") {
      return "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ffffff 100%)" // orange
    }
    if (word === "a game") {
      return "linear-gradient(135deg, #1a1a1a 0%, #404040 50%, #ffffff 100%)" // black
    }
    if (word === "an image") {
      return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #ffffff 100%)" // yellow
    }
    if (word === "a video") {
      return "linear-gradient(135deg, #059669 0%, #10b981 50%, #ffffff 100%)" // green
    }
    
    // If custom color is provided (non-build-request buttons) - more vibrant
    if (color === "orange") {
      return "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #ffffff 100%)"
    }
    if (color === "blue") {
      return "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #ffffff 100%)"
    }
    if (color === "yellow") {
      return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #ffffff 100%)"
    }
    if (color === "green") {
      return "linear-gradient(135deg, #059669 0%, #10b981 50%, #ffffff 100%)"
    }
    
    // Fallback to blue gradient
    return "linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #ffffff 100%)"
  }

  // Detect mobile and tablet screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Show glass button after fade-in delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGlassButton(true)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  // Cycle through dynamic words for build request button
  useEffect(() => {
    if (isBuildRequest && !isExpanded && showGlassButton) {
      const interval = setInterval(() => {
        setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length)
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isBuildRequest, isExpanded, showGlassButton, dynamicWords.length])

  // Check for hash to auto-open form
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#open-form' && !isExpanded && showGlassButton) {
        // Small delay to ensure page is loaded and component is ready
        setTimeout(() => {
          handleExpand();
          // Remove hash from URL without triggering reload
          if (window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }, 700);
      }
    };

    if (showGlassButton) {
      // Check on mount after button is shown
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, showGlassButton]);

  const handleExpand = () => {
    // Trigger spring animation first
    setIsSpringing(true)
    
    // Scroll to center the glass button in viewport on click
    if (glassButtonRef.current) {
      const rect = glassButtonRef.current.getBoundingClientRect()
      const scrollY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2)
      
      window.scrollTo({
        top: scrollY,
        behavior: 'smooth'
      })
      
      // Wait for scroll to complete (~300ms) and spring animation to finish, then expand
      setTimeout(() => {
        setIsExpanded(true)
        setIsSpringing(false)
      }, 300) // Reduced delay for faster expansion
    } else {
      // If no ref, expand immediately after spring animation
      setTimeout(() => {
        setIsExpanded(true)
        setIsSpringing(false)
      }, 100) // Much shorter delay if no scroll needed
    }
  }

  const handleClose = () => {
    setIsExpanded(false)
    // No scroll restoration - page stays where it is
  }

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
      
      return () => {
        // Capture scroll position from the top offset before removing fixed positioning
        const currentTop = document.body.style.top
        const scrollPosition = currentTop ? Math.abs(parseInt(currentTop)) : scrollY
        
        // Remove fixed positioning first
        document.body.style.position = originalBodyPosition
        document.body.style.top = ""
        
        // Immediately restore scroll position without animation to prevent jump
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        })
        
        // Restore other styles after scroll is set
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        document.body.style.width = ""
        document.body.style.touchAction = ""
      }
    }
  }, [isExpanded])

  return (
    <>
      {/* Glass Button - Centered */}
      <AnimatePresence>
        {showGlassButton && !isExpanded && (
          <motion.button
            layoutId="build-button-glass-container"
            onClick={handleExpand}
            ref={glassButtonRef}
            className={`about-devello-glass build-button-gradient rounded-full mx-auto relative ${
              buttonSize === 'large' 
                ? 'px-6 pr-4 sm:px-12 sm:pr-10 md:px-16 md:pr-12 py-2 sm:py-4 md:py-5'
                : 'px-4 pr-3 sm:px-10 sm:pr-8 md:px-12 md:pr-10 py-2 sm:py-3 md:py-4'
            } max-w-[95vw] font-regular tracking-[0.02em] flex flex-col items-center justify-center gap-0 z-10 ${pacifico.className}`}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ 
              opacity: 1, 
              scale: isSpringing ? 0.95 : 1,
              y: 0
            }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ 
              type: "spring",
              stiffness: isSpringing ? 800 : 300,
              damping: isSpringing ? 20 : 30,
              mass: 0.6,
              duration: isSpringing ? undefined : 0.5,
              opacity: { duration: 0.4, ease: "easeOut" }
            }}
            whileTap={{
              scale: 0.95,
              transition: {
                type: "spring",
                stiffness: 600,
                damping: 15
              }
            }}
            layout
            layoutTransition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            style={{ 
              transformOrigin: "center center", 
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'transparent',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: '2px',
              borderRadius: '9999px',
              maxWidth: buttonSize === 'large' 
                ? (isMobile ? '95vw' : 'none')
                : (isMobile ? '320px' : '340px'),
              width: 'auto',
              textAlign: 'center',
              zIndex: 10,
              padding: buttonSize === 'large' ? undefined : (isMobile ? '12px 20px' : '14px 28px'),
              minWidth: buttonSize === 'large' 
                ? (isMobile ? '200px' : isTablet ? '280px' : '320px')
                : '200px',
              minHeight: 'auto'
            }}
          >
            {/* Gradient background */}
            <motion.div
              layoutId="cta-card-bg"
              layout
              animate={{ 
                background: isBuildRequest 
                  ? getGradientForWord(dynamicWords[currentWordIndex])
                  : getGradientForWord(null)
              }}
              transition={{ 
                layout: {
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1]
                },
                background: {
                  duration: isBuildRequest ? 0.3 : 0,
                  ease: "easeInOut"
                }
              }}
              className="absolute inset-0 rounded-full"
              style={{
                borderRadius: "9999px",
                zIndex: -1,
                opacity: 0.9
              }}
            />
            <h3 className={buttonSize === 'large' ? 'text-base sm:text-xl md:text-2xl' : 'text-xl sm:text-xl'} style={{ 
              fontWeight: 300,
              fontFamily: 'inherit',
              color: 'white',
              margin: '0 0 10px 0',
              lineHeight: '1.2',
              position: 'relative',
              zIndex: 1
            }}>
              {isBuildRequest ? (
                <div className="flex items-center justify-center gap-0 flex-wrap sm:flex-nowrap">
                  <span className="whitespace-nowrap">create</span>
                  <span 
                    className="relative inline-block text-center min-w-[80px] sm:min-w-[100px] md:min-w-[110px]"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={currentWordIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="inline-block whitespace-nowrap"
                      >
                        {dynamicWords[currentWordIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>
              ) : (
                formTitle.toLowerCase()
              )}
            </h3>
            <p className={buttonSize === 'large' ? 'text-sm sm:text-base md:text-lg' : 'text-xs sm:text-xs'} style={{ 
              whiteSpace: 'nowrap', 
              fontFamily: 'Georgia, serif', 
              fontWeight: 'normal',
              color: 'white',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              position: 'relative',
              zIndex: 1
            }}>
              start here <MousePointerClick className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline-block align-middle" style={{ transform: 'translateY(-2px)' }} />
            </p>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Modal View */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center pt-28 sm:pt-8 pb-8 px-4 sm:pb-8 sm:px-8"
              style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                touchAction: 'none'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleClose();
                }
              }}
              onWheel={(e) => e.preventDefault()}
              onTouchMove={(e) => e.preventDefault()}
            >
              <motion.div
                layoutId="build-button-glass-container"
                layout
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                exit={{
                  scale: 0.8,
                  opacity: 0,
                  transition: {
                    duration: 0.4,
                    delay: 0.2,
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
                className={`about-devello-glass w-full max-w-2xl transform-gpu will-change-transform relative backdrop-blur-md ${
                  isInAnnotationMode 
                    ? 'h-[65vh] sm:h-[70vh] max-h-[65vh] sm:max-h-[70vh] overflow-y-auto overflow-x-hidden' 
                    : 'max-h-[80vh] overflow-y-auto overflow-x-hidden'
                }`}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  backgroundColor: isDark 
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(255, 255, 255, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  borderWidth: '1px',
                  borderRadius: isMobile ? '2rem' : '1.75rem'
                }}
              >
                <motion.button
                  onClick={handleClose}
                  whileTap={{
                    scale: 0.95,
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
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    borderWidth: '1px'
                  }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
                <div className={`p-4 sm:p-6 md:p-8 overflow-x-visible rounded-[2rem] sm:rounded-3xl ${
                  isInAnnotationMode ? 'h-full overflow-y-auto' : ''
                } ${
                  (() => {
                    const titleLower = formTitle.toLowerCase();
                    return (titleLower.includes('consultation') || 
                            (titleLower.includes('build') && !titleLower.includes('product') && !titleLower.includes('renovation') && !titleLower.includes('custom'))) 
                            ? 'pt-8 sm:pt-12 md:pt-16' : '';
                  })()
                }`}>
                  {(() => {
                    const titleLower = formTitle.toLowerCase();
                    const isBuildRequest = titleLower.includes('build request') || 
                                         titleLower.includes('software');
                    
                    if (isBuildRequest) {
                      return (
                        <IdeaBuildDemo 
                          isDark={isDark} 
                          onClose={handleClose}
                          onAnnotationModeChange={setIsInAnnotationMode}
                          context={{}}
                        />
                      );
                    }
                    
                    // Custom builds form for other cases
                    return (
                      <CustomProductForm 
                        isDark={isDark} 
                        onClose={handleClose}
                        onAnnotationModeChange={setIsInAnnotationMode}
                        title={formTitle}
                      />
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default CustomBuildsButton

