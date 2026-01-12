"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { X, Link2 } from "lucide-react"

const CustomProductForm = dynamic(() => import("./CustomProductForm"), {
  ssr: false
})

const MillworkAd = ({ isDark = false }) => {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [isInAnnotationMode, setIsInAnnotationMode] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [showGlassContainer, setShowGlassContainer] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [borderRadius, setBorderRadius] = useState('40px')
  const videoRef = useRef(null)
  const glassContainerRef = useRef(null)
  const containerRef = useRef(null)

  // Update border radius based on screen size to match millwork-ad-item
  useEffect(() => {
    const updateBorderRadius = () => {
      const width = window.innerWidth
      if (width < 480) {
        setBorderRadius('18px')
      } else if (width < 768) {
        setBorderRadius('20px')
      } else if (width < 1024) {
        setBorderRadius('25px')
      } else {
        setBorderRadius('40px')
      }
    }
    
    updateBorderRadius()
    window.addEventListener('resize', updateBorderRadius)
    return () => window.removeEventListener('resize', updateBorderRadius)
  }, [])

  const millworkData = {
    id: 1,
    background: "https://static.wixstatic.com/media/c6bfe7_e6632877edc74591b30d8cb5f341b547~mv2.png",
    main: "Mill work ad",
    defaultColor: "#ED5565",
    isVideo: true,
    videoUrl: "https://video.wixstatic.com/video/c6bfe7_3b211ed488034d049fab40a7c8acca90/1080p/mp4/file.mp4",
    previewImage: "https://static.wixstatic.com/media/c6bfe7_e6632877edc74591b30d8cb5f341b547~mv2.png"
  }

  const styles = `
    .millwork-ad-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: visible;
      font-family: 'Roboto', sans-serif;
      padding: 0;
      margin: 0;
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    
    @media screen and (min-width: 1025px) {
      .millwork-ad-container {
        max-width: 1200px;
        margin-left: auto;
        margin-right: auto;
        padding: 0 2rem;
      }
    }
    
    .millwork-ad-item {
      position: relative;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      border-radius: 40px;
      opacity: 1;
      box-sizing: border-box;
    }
    
    @media screen and (min-width: 1025px) {
      .millwork-ad-item {
        max-width: 900px;
        border-radius: 40px;
      }
    }
    
    .millwork-ad-item video {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
    }
    
    .video-fade-in {
      opacity: 0;
      animation: videoFadeIn 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes videoFadeIn {
      0% {
        opacity: 0;
        transform: scale(1.02);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .millwork-ad-shadow {
      position: absolute;
      bottom: 0px;
      left: 0px;
      right: 0px;
      height: 120px;
      transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
    }
    
    .glass-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 6px 20px;
      text-align: center;
      z-index: 10;
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
      max-width: 360px;
      width: fit-content;
      min-width: 0;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      height: fit-content;
    }
    
    @media screen and (min-width: 769px) {
      .glass-container {
        padding: 8px 24px;
        max-width: 400px;
        width: fit-content;
        height: fit-content;
      }
    }
    
    .glass-container.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      animation: glassBlurIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    @keyframes glassBlurIn {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
    
    .glass-container h3 {
      color: black !important;
      font-size: 14px;
      font-weight: 200;
      margin: 0;
      padding: 0;
      text-shadow: none;
      letter-spacing: 0.5px;
      line-height: 1;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    @media screen and (min-width: 640px) {
      .glass-container h3 {
        font-size: 16px;
        font-weight: 200;
        margin: 0;
        padding: 0;
        line-height: 1;
      }
    }
    
    @media screen and (min-width: 769px) {
      .glass-container h3 {
        font-size: 18px;
        font-weight: 200;
        margin: 0;
        padding: 0;
        line-height: 1;
      }
    }
    
    .glass-container p {
      color: white !important;
      font-size: 12px;
      font-weight: 300;
      margin: 0;
      line-height: 1.4;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 100%;
      box-sizing: border-box;
    }
    
    @media screen and (min-width: 769px) {
      .glass-container p {
        font-size: 16px;
      }
    }
    
    .glass-container svg {
      color: white !important;
    }
    
    .bespoke-accent {
      position: relative;
      display: inline-block;
    }
    
    .bespoke-accent::after {
      content: '´';
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      color: inherit;
      font-weight: normal;
      line-height: 1;
    }
    
    .mobile-only {
      display: none;
    }
    
    .desktop-only {
      display: inline;
    }
    
    @media screen and (max-width: 1024px) {
      .millwork-ad-container {
        padding: 0 1rem;
        width: 100%;
      }
      
      .millwork-ad-item {
        max-width: 700px;
        border-radius: 25px;
      }
    }
    
    @media screen and (max-width: 768px) {
      .millwork-ad-container {
        padding: 0 1rem;
      }
      
      .millwork-ad-item {
        max-width: 100%;
        border-radius: 20px;
      }
    }
      
      .glass-container h3 {
        font-size: 14px;
        margin: 0;
        padding: 0;
      }
      
      .glass-container p {
        font-size: 11px;
        line-height: 1.2;
      }
      
      .mobile-only {
        display: inline;
      }
      
      .desktop-only {
        display: none;
      }
    }
    
    @media screen and (max-width: 480px) {
      .millwork-ad-container {
        padding: 0 1rem;
      }
      
      .millwork-ad-item {
        max-width: 100%;
        border-radius: 18px;
      }
    }
      
      .glass-container h3 {
        font-size: 14px;
        margin: 0;
        padding: 0;
      }
      
      .glass-container p {
        font-size: 11px;
        line-height: 1.2;
      }
      
      .mobile-only {
        display: inline;
      }
      
      .desktop-only {
        display: none;
      }
    }
  `

  // Handle video playback
  useEffect(() => {
    const playVideo = async () => {
      try {
        if (videoRef.current) {
          videoRef.current.preload = 'metadata'
          const playPromise = videoRef.current.play()
          if (playPromise !== undefined) {
            await playPromise
            console.log('Millwork video started playing')
          }
        }
      } catch (error) {
        console.warn('Failed to play millwork video:', error)
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(err => {
              console.warn('Retry failed for millwork video:', err)
            })
          }
        }, 1000)
      }
    }

    const timer = setTimeout(playVideo, 100)
    return () => clearTimeout(timer)
  }, [])

  // Show glass container after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGlassContainer(true)
    }, 1000) // 1 second delay
    
    return () => clearTimeout(timer)
  }, [])

  const handleVideoLoaded = () => {
    setVideoLoaded(true)
    setVideoError(false)
  }

  const handleVideoError = () => {
    console.warn('Millwork video failed to load')
    setVideoError(true)
  }

  const handleGlassContainerClick = () => {
    // Route to devellotech.com for software development services
    window.open('https://devellotech.com', '_blank')
  }

  // Scroll lock when expanded
  useEffect(() => {
    if (isExpanded && containerRef.current) {
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      const originalBodyPosition = document.body.style.position
      const scrollY = window.scrollY
      
      // Capture container position before locking scroll
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerTop = containerRect.top + scrollY
      
      document.body.style.overflow = "hidden"
      document.documentElement.style.overflow = "hidden"
      document.body.style.position = "fixed"
      document.body.style.width = "100%"
      document.body.style.top = `-${scrollY}px`
      document.body.style.touchAction = "none"
      
      // Lock container position
      containerRef.current.style.position = 'relative'
      containerRef.current.style.top = '0'
      
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
        
        // Reset container position
        if (containerRef.current) {
          containerRef.current.style.position = ''
          containerRef.current.style.top = ''
        }
      }
    }
  }, [isExpanded])

  const handleClose = () => {
    setIsExpanded(false)
    // No scroll restoration - page stays where it is
  }
  
  // No cleanup needed - removed all scroll manipulation

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div ref={containerRef} className="millwork-ad-container">
        <div className="millwork-ad-item">
          {!videoError ? (
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover ${!videoLoaded ? 'video-fade-in' : ''}`}
              src={millworkData.videoUrl}
              muted
              loop={false}
              playsInline
              controls={false}
              autoPlay={false}
              preload="metadata"
              poster={millworkData.previewImage}
              onLoadedData={handleVideoLoaded}
              onError={handleVideoError}
              onCanPlay={() => setVideoLoaded(true)}
            />
          ) : (
            <div 
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                backgroundImage: `url(${millworkData.previewImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          )}
          {showGlassContainer && (
            <motion.div 
              ref={glassContainerRef}
              layoutId="custom-builds-glass-container"
              className={`glass-container show about-devello-glass px-3 sm:px-6 ${isExpanded ? 'pointer-events-none invisible' : ''}`}
              style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transformOrigin: "center center", 
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: borderRadius,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleGlassContainerClick}
              whileTap={{
                scale: 0.85,
                transition: {
                  type: "spring",
                  stiffness: 600,
                  damping: 15
                }
              }}
              animate={{
                scale: 1,
                x: '-50%',
                y: '-50%'
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30
              }}
            >
              <h3 className="text-xs sm:text-base md:text-lg font-light text-black m-0 p-0 text-center flex flex-row items-center justify-center gap-1 sm:gap-2 max-w-full overflow-hidden whitespace-nowrap leading-none">
                <span className="inline whitespace-nowrap">explore</span>
                <span className="inline whitespace-nowrap">devello tech</span>
                <Link2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 text-blue-500 stroke-blue-500" strokeWidth={2} />
              </h3>
            </motion.div>
          )}
          <div className="millwork-ad-shadow"></div>
        </div>
      </div>

      {/* Expanded View */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
                layoutId="custom-builds-glass-container"
                layout
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                  layout: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
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
                className={`about-devello-glass w-full max-w-2xl transform-gpu will-change-transform overflow-x-visible relative ${
                  isInAnnotationMode 
                    ? 'h-[65vh] sm:h-[70vh] max-h-[65vh] sm:max-h-[70vh] overflow-y-auto' 
                    : 'max-h-[calc(100vh-8rem)] sm:max-h-[80vh] overflow-y-auto'
                }`}
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  borderRadius: '1.75rem'
                }}
              >
                <motion.button
                  onClick={handleClose}
                  whileTap={{ 
                    scale: 0.85,
                    transition: { 
                      type: "spring", 
                      stiffness: 600, 
                      damping: 15 
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
                <div className={`p-8 sm:p-8 md:p-12 lg:p-16 xl:p-20 sm:pt-8 sm:pb-3 md:pb-5 lg:pb-7 xl:pb-10 sm:px-8 overflow-x-visible rounded-3xl ${
                  isInAnnotationMode ? 'h-full overflow-y-auto' : 'h-auto'
                }`}>
                  <CustomProductForm 
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
  )
}

export default MillworkAd

