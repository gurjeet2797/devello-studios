"use client"

import React, { useState, useEffect, useRef } from "react"

const OptionsSelector = ({ isDark = false }) => {
  const activeOption = 2 // Only Software ad option
  const [showGlassContainer, setShowGlassContainer] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [videoDuration, setVideoDuration] = useState(10) // Default 10 seconds
  const [video2CurrentUrl, setVideo2CurrentUrl] = useState(null)
  const video2Ref = useRef(null)
  const videoLoadTimeoutRef = useRef(null)
  const maxRetries = 3
  

  const optionsData = [
    {
      id: 2,
      background: "https://video.wixstatic.com/video/c6bfe7_6326407bba784874bf9fcac5afcc9f12/1080p/mp4/file.mp4",
      main: "Software ad",
      defaultColor: "#FFCE54",
      isVideo: true,
      videoUrl: "https://video.wixstatic.com/video/c6bfe7_6326407bba784874bf9fcac5afcc9f12/1080p/mp4/file.mp4",
      videoUrlDark: "https://video.wixstatic.com/video/c6bfe7_a753032e04904b668736913577cd2f26/1080p/mp4/file.mp4",
      videoUrlLight: "https://video.wixstatic.com/video/c6bfe7_99d6681e8dcf4da0a9f4ad8a01be29ed/1080p/mp4/file.mp4"
    }
  ]


  // No auto-cycling needed - only one option (software ad)



  // Handle video playback when component mounts
  useEffect(() => {
    // Reset video states
    setVideoLoaded(false)
    setVideoError(false)
    setRetryCount(0)
    
    // Initialize video2 URL
    const initialUrl = getVideoUrl(optionsData.find(opt => opt.id === 2))
    setVideo2CurrentUrl(initialUrl)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Initialized video2 URL:', initialUrl)
    }
    
    // Clear any existing timeout
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current)
    }
    
    // Pause and reset all videos to prevent multiple videos playing
    const pauseAllVideos = () => {
      if (video2Ref.current) {
        video2Ref.current.pause()
        video2Ref.current.currentTime = 0
        if (process.env.NODE_ENV !== 'production') {
          console.log('Paused video 2')
        }
      }
    }
    
    pauseAllVideos()

    // Set up video load timeout
    videoLoadTimeoutRef.current = setTimeout(handleVideoLoadTimeout, 10000) // 10 second timeout

    // Play the active video after a short delay with error handling
    const playVideo = async () => {
      try {
        const currentVideo = getCurrentVideoRef()
        if (currentVideo?.current) {
          // Optimize video loading
          currentVideo.current.preload = 'metadata'
          if (process.env.NODE_ENV !== 'production') {
            currentVideo.current.loadstart = () => console.log(`Video ${activeOption} started loading`)
          }
          
          // For option 2, ensure we have the correct URL
          if (activeOption === 2 && video2CurrentUrl) {
            currentVideo.current.src = video2CurrentUrl
            currentVideo.current.load()
          }
          
          // Add performance monitoring
          if (process.env.NODE_ENV !== 'production') {
            currentVideo.current.addEventListener('loadstart', () => {
              console.log(`Video ${activeOption} load started`)
            })
            
            currentVideo.current.addEventListener('progress', () => {
              if (currentVideo.current.buffered.length > 0) {
                const buffered = currentVideo.current.buffered.end(0)
                const duration = currentVideo.current.duration
                const progress = (buffered / duration) * 100
                console.log(`Video ${activeOption} buffered: ${progress.toFixed(1)}%`)
              }
            })
          }
          
          // Attempt to play with error handling - autoplay on all devices including mobile
          try {
            const playPromise = currentVideo.current.play()
            if (playPromise !== undefined) {
              await playPromise
              if (process.env.NODE_ENV !== 'production') {
                console.log(`Video ${activeOption} started playing successfully`)
              }
            }
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`Failed to play video ${activeOption}:`, error)
            }
            // If autoplay fails, try again after a short delay
            setTimeout(() => {
              if (currentVideo?.current) {
                currentVideo.current.play().catch(err => {
                  if (process.env.NODE_ENV !== 'production') {
                    console.warn(`Retry failed for video ${activeOption}:`, err)
                  }
                })
              }
            }, 1000)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Video play failed:', error)
        }
        handleVideoError()
      }
    }

    const timer = setTimeout(playVideo, 100)
    return () => {
      clearTimeout(timer)
      if (videoLoadTimeoutRef.current) {
        clearTimeout(videoLoadTimeoutRef.current)
      }
    }
  }, [activeOption])

  // Handle video loaded event
  const handleVideoLoaded = (event) => {
    setVideoLoaded(true)
    setVideoError(false)
    setRetryCount(0)
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current)
    }
    
    // Capture video duration for dynamic timing
    if (event.target && event.target.duration) {
      let duration = Math.ceil(event.target.duration)
      setVideoDuration(duration + 2) // Add 2 seconds buffer for smooth transition
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Video duration detected: ${duration}s`)
      }
    }
  }

  // Handle video error with retry logic
  const handleVideoError = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Video failed to load, attempting retry...')
    }
    setVideoError(true)
    
    if (retryCount < maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Exponential backoff with max 5s
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Retrying video load in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`)
      }
      
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        setVideoError(false)
        // Trigger reload by changing src
        const currentVideo = getCurrentVideoRef()
        if (currentVideo?.current) {
          const currentSrc = currentVideo.current.src
          currentVideo.current.src = ''
          setTimeout(() => {
            if (currentVideo.current) {
              currentVideo.current.src = currentSrc
              currentVideo.current.load()
            }
          }, 100)
        }
      }, retryDelay)
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Max retries reached, video will show fallback image')
      }
    }
  }

  // Get current video ref (always video2Ref since only one option)
  const getCurrentVideoRef = () => {
    return video2Ref
  }

  // Get correct video URL based on theme for option 2
  const getVideoUrl = (option) => {
    if (option.id === 2) {
      return isDark ? option.videoUrlDark : option.videoUrlLight
    }
    return option.videoUrl
  }

  // Handle video ended event to maintain container size
  const handleVideoEnded = () => {
    // Keep the video visible and maintain container size
    // The video will stay on the last frame due to object-cover
    if (process.env.NODE_ENV !== 'production') {
      console.log('Video ended, waiting for cycle to complete')
    }
  }

  // Video load timeout handler
  const handleVideoLoadTimeout = () => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Video load timeout, switching to fallback')
    }
    setVideoError(true)
  }

  // Cleanup function to pause all videos and clear timeouts
  const cleanupVideos = () => {
    if (video2Ref.current) {
      video2Ref.current.pause()
      video2Ref.current.currentTime = 0
    }
    if (videoLoadTimeoutRef.current) {
      clearTimeout(videoLoadTimeoutRef.current)
    }
  }

  // Handle video metadata loaded to get duration early
  const handleVideoMetadataLoaded = (event) => {
    if (event.target && event.target.duration) {
      let duration = Math.ceil(event.target.duration)
      setVideoDuration(duration + 2) // Add 2 seconds buffer for smooth transition
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Video metadata loaded - duration: ${duration}s`)
      }
    }
  }

  // Handle video can play - only set loaded state, don't restart
  const handleVideoCanPlay = () => {
    setVideoLoaded(true)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Video can play - setting loaded state')
    }
  }

  // No navigation needed - only one option (software ad)

  // No glass container for software ad
  useEffect(() => {
    setShowGlassContainer(false)
  }, [])

  // Handle theme change for option 2 video
  useEffect(() => {
    if (activeOption === 2 && video2Ref.current) {
      const newSrc = getVideoUrl(optionsData.find(opt => opt.id === 2))
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Theme change check:', {
          activeOption,
          isDark,
          currentUrl: video2CurrentUrl,
          newSrc,
          sourcesMatch: video2CurrentUrl === newSrc
        })
      }
      
      // Only change video if source is actually different
      if (video2CurrentUrl !== newSrc) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Theme changed, switching video source for option 2')
          console.log('From:', video2CurrentUrl)
          console.log('To:', newSrc)
        }
        
        // Update the state first
        setVideo2CurrentUrl(newSrc)
        
        // Reset states
        setVideoLoaded(false)
        setVideoError(false)
        
        // Pause current video first
        video2Ref.current.pause()
        video2Ref.current.currentTime = 0
        
        // Update source and reload
        video2Ref.current.src = newSrc
        video2Ref.current.load()
        
        // Wait for video to be ready, then play
        const handleVideoReady = () => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Video ready to play after theme change')
          }
          if (video2Ref.current && activeOption === 2) {
            video2Ref.current.play()
              .then(() => {
                setVideoLoaded(true)
                if (process.env.NODE_ENV !== 'production') {
                  console.log('Video 2 successfully restarted after theme change')
                }
              })
              .catch(error => {
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('Failed to play video after theme change:', error)
                }
                handleVideoError()
              })
          }
        }
        
        // Use canplay event to know when video is ready
        video2Ref.current.addEventListener('canplay', handleVideoReady, { once: true })
        
        // Also try on loadeddata event as backup
        video2Ref.current.addEventListener('loadeddata', handleVideoReady, { once: true })
        
        // Fallback timeout
        const timeout = setTimeout(() => {
          if (process.env.NODE_ENV !== 'production') {
            console.log('Fallback timeout triggered for video restart')
          }
          if (video2Ref.current) {
            handleVideoReady()
          }
        }, 3000)
        
        return () => {
          clearTimeout(timeout)
          if (video2Ref.current) {
            video2Ref.current.removeEventListener('canplay', handleVideoReady)
            video2Ref.current.removeEventListener('loadeddata', handleVideoReady)
          }
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.log('Video source unchanged, no action needed')
        }
      }
    }
  }, [isDark, activeOption])

  // Separate effect to handle video playback when video2CurrentUrl changes
  useEffect(() => {
    if (activeOption === 2 && video2Ref.current && video2CurrentUrl) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Video2 URL changed, attempting to play:', video2CurrentUrl)
      }
      
      const playVideo2 = async () => {
        try {
          if (video2Ref.current && activeOption === 2) {
            video2Ref.current.src = video2CurrentUrl
            video2Ref.current.load()
            
            // Wait a bit for the video to load
            await new Promise(resolve => setTimeout(resolve, 500))
            
            const playPromise = video2Ref.current.play()
            if (playPromise !== undefined) {
              await playPromise
            }
            
            setVideoLoaded(true)
            if (process.env.NODE_ENV !== 'production') {
              console.log('Video 2 successfully played after URL change')
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Failed to play video2 after URL change:', error)
          }
          handleVideoError()
        }
      }
      
      playVideo2()
    }
  }, [video2CurrentUrl, activeOption])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupVideos()
    }
  }, [])

  const styles = `
    .options-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      height: auto;
      min-height: 500px;
      font-family: 'Roboto', sans-serif;
      padding: 1rem 4rem 1rem 4rem;
      margin-bottom: 0;
    }
    
    .options-container * {
      box-sizing: border-box;
    }
    
    .options-wrapper {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-width: 700px;
      max-width: 1050px;
      width: calc(100% - 40px);
      height: 750px;
      min-height: 750px;
      position: relative;
      flex-shrink: 0;
    }
    
     .option-item {
       position: relative;
       width: 100%;
       height: 100%;
       min-height: 100%;
       overflow: hidden;
       background-size: cover;
       background-position: center;
       border-radius: 40px;
       opacity: 1;
       transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
       will-change: opacity;
     }
     
     .option-item video {
       position: absolute;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       object-fit: cover;
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
     
     .option-item.transitioning {
       opacity: 0;
     }
     
     .option-item.entering {
       opacity: 0;
       transform: scale(1.02);
       animation: optionEnter 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
     }
     
     @keyframes optionEnter {
       0% {
         opacity: 0;
         transform: scale(1.02);
       }
       100% {
         opacity: 1;
         transform: scale(1);
       }
     }
    
    .option-shadow {
      position: absolute;
      bottom: 0px;
      left: 0px;
      right: 0px;
      height: 120px;
      transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
    }
    
    .option-label {
      display: flex;
      position: absolute;
      right: 0px;
      top: 50%;
      transform: translateY(-50%);
      height: 40px;
      transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 12px;
      font-weight: 600;
      color: white;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      padding: 8px 4px;
      white-space: nowrap;
      z-index: 20;
    }
    
    .option-item:nth-child(1) .option-label,
    .option-item:nth-child(2) .option-label {
      color: black;
      text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    .option-item.active .option-label {
      display: none;
    }
    
    .option-label {
      display: flex;
      position: absolute;
      right: 0px;
      top: 50%;
      transform: translateY(-50%);
      height: 40px;
      transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95);
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 12px;
      font-weight: 600;
      color: white;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
      padding: 8px 4px;
      white-space: nowrap;
      z-index: 20;
    }
    
    .option-item:nth-child(1) .option-label,
    .option-item:nth-child(2) .option-label {
      color: black;
      text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    .option-item.active .option-label {
      display: none;
    }
    
    .glass-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(0px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      z-index: 10;
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
      max-width: 320px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
    }
    
    .glass-container.show {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
      animation: glassBlurIn 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    @keyframes glassBlurIn {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
        backdrop-filter: blur(0px);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
      }
      100% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
      }
    }
    
    .glass-container h3 {
      color: white;
      font-size: 22px;
      font-weight: 300;
      margin: 0 0 10px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    
    .glass-container p {
      color: #000000;
      font-size: 13px;
      font-weight: 300;
      margin: 0;
      line-height: 1.4;
      letter-spacing: 0.3px;
    }
    
    /* Show desktop text, hide mobile text on desktop */
    .mobile-only {
      display: none;
    }
    
    .desktop-only {
      display: inline;
    }
    
    /* Option 1 (Custom Millwork) - white text */
    .option-item:nth-child(1) .glass-container h3,
    .option-item:nth-child(1) .glass-container p {
      color: white;
    }
    
    .option-icon {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      min-width: 40px;
      max-width: 40px;
      height: 40px;
      border-radius: 100%;
      background-color: white;
    }
    
    /* Navigation buttons */
    .nav-buttons {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      pointer-events: none;
      z-index: 10;
    }
    
    .nav-button {
      pointer-events: auto;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      color: white;
      font-size: 16px;
      font-weight: bold;
    }
    
    .nav-button:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    .nav-button:active {
      transform: scale(0.95);
    }
    
    .nav-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      transform: none;
    }
    
    /* Mobile optimizations for navigation buttons */
    @media screen and (max-width: 768px) {
      .nav-buttons {
        padding: 0 15px;
      }
      
      .nav-button {
        width: 35px;
        height: 35px;
        font-size: 14px;
      }
      
      .nav-button:hover {
        transform: scale(1.05);
      }
    }
    
    @media screen and (max-width: 480px) {
      .nav-buttons {
        padding: 0 10px;
      }
      
      .nav-button {
        width: 32px;
        height: 32px;
        font-size: 12px;
      }
    }
    
    /* Navigation buttons animation */
    .nav-buttons {
      opacity: 0;
      transform: translateY(-50%) scale(0.9);
      transition: all 0.5s ease;
    }
    
    .nav-buttons.show {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
    
           .option-info {
             display: flex;
             flex-direction: column;
             justify-content: center;
             margin-left: 10px;
             color: white;
             white-space: pre;
             background: rgba(255, 255, 255, 0.08);
             backdrop-filter: blur(4px);
             border-radius: 8px;
             padding: 8px 12px;
             box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
           }
    
    .option-info > div {
      position: relative;
      transition: 0.5s cubic-bezier(0.05, 0.61, 0.41, 0.95), opacity 0.5s ease-out;
    }
    
    .option-main {
      font-weight: 300;
      font-size: 1.1rem;
      letter-spacing: 0.3px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }
    
    .option-sub {
      transition-delay: 0.1s;
    }
    
    
    /* Tablet and Mobile Responsive Styles */
    @media screen and (max-width: 1024px) {
      .options-container {
        padding: 0;
        height: auto;
        min-height: 320px;
        flex-direction: column;
        margin-top: 0;
        margin-bottom: 0;
      }
      
      .options-wrapper {
        display: flex;
        flex-direction: column;
        min-width: auto;
        max-width: none;
        width: 100%;
        height: auto;
        min-height: auto;
        align-items: center;
        position: relative;
      }
      
      /* Active option takes full width and proper height */
      .option-item {
        position: relative;
        width: 100%;
        max-width: 500px;
        height: 380px;
        margin: 0;
        border-radius: 25px;
        background-size: var(--option-bg-size, cover);
      }
      
      /* Ensure content is in bottom left */
      .option-item.active .option-label {
        bottom: 25px;
        left: 25px;
        right: auto;
        height: 40px;
      }
      
      .option-item.active .option-info > div {
        left: 0px;
        opacity: 1;
      }
    }
    
    /* Mobile specific adjustments */
    @media screen and (max-width: 768px) {
      .options-container {
        padding: 0 1.5rem;
        min-height: 280px;
        margin-top: 0;
        margin-bottom: 0;
      }
      
      .options-wrapper {
        height: auto !important;
        min-height: auto !important;
        max-height: none;
      }
      
      .option-item {
        height: 260px;
        border-radius: 20px;
        max-width: 400px;
        margin: 0;
      }
      
      .option-item.active .option-label {
        bottom: 20px;
        left: calc(50% - 9px);
        transform: translateX(-50%);
        right: auto;
      }
      
      .option-main {
        font-size: 0.9rem;
        font-weight: 300;
      }
    }
    
    /* Small mobile adjustments */
    @media screen and (max-width: 480px) {
      .options-container {
        padding: 0 1.5rem;
        min-height: 240px;
        align-items: flex-start;
        margin-top: 0;
        margin-bottom: 0;
      }
      
      .options-wrapper {
        height: auto !important;
        min-height: auto !important;
        max-height: none;
      }
      
      /* Reduce spacing between options and stepper */
      .options-container + * {
        margin-top: 0;
        padding-top: 0;
      }
      
      .option-item {
        height: 230px;
        border-radius: 18px;
        margin: 0 0 15px 0;
      }
      
      /* Mobile-specific option 2 height increase */
      .option-item:nth-child(2) {
        height: 280px;
      }
      
      /* Mobile-specific option 1 height increase */
      .option-item:nth-child(1) {
        height: 280px;
      }
      
      
      /* Mobile-friendly glass container text */
      .glass-container h3 {
        font-size: 16px;
        margin: 0 0 6px 0;
      }
      
      .glass-container p {
        font-size: 11px;
        line-height: 1.2;
      }
      
      /* Show mobile text, hide desktop text on mobile */
      .mobile-only {
        display: inline;
      }
      
      .desktop-only {
        display: none;
      }
      
      /* Option 1 (Custom Millwork) - white text on mobile */
      .option-item:nth-child(1) .glass-container h3,
      .option-item:nth-child(1) .glass-container p {
        color: white;
      }
      
      .option-item.active .option-label {
        bottom: 18px;
        left: calc(50% - 9px);
        transform: translateX(-50%);
        right: auto;
      }
      
      .option-main {
        font-size: 0.8rem;
        font-weight: 300;
      }
    }
  `

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="options-container">
        <div className="options-wrapper">
          {optionsData
            .filter(option => option.id === activeOption)
            .map((option) => (
            <div
              key={option.id}
              className="option-item active"
              style={{
                backgroundSize: option.id === 2 ? "none" : "cover",
                "--defaultBackground": option.defaultColor,
                "--option-bg-size": option.id === 2 ? "none" : "cover",
              }}
            >
              {/* Video for option 2 (Software) with theme switching */}
              {option.id === 2 && option.isVideo ? (
                /* Video for option 2 (Software) with theme switching */
                <>
                  {!videoError ? (
                    <video
                      ref={video2Ref}
                      className={`absolute inset-0 w-full h-full object-cover ${!videoLoaded ? 'video-fade-in' : ''}`}
                      src={video2CurrentUrl || getVideoUrl(option)}
                      muted
                      loop={false}
                      playsInline
                      controls={false}
                      autoPlay={false}
                      preload="metadata"
                      onLoadedData={handleVideoLoaded}
                      onLoadedMetadata={handleVideoMetadataLoaded}
                      onError={handleVideoError}
                      onEnded={handleVideoEnded}
                      onCanPlay={handleVideoCanPlay}
                    />
                  ) : (
                    <div 
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        backgroundImage: `url(${option.background})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                    </div>
                  )}
                </>
              ) : (
                <div 
                  className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${option.background})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </>
  )
}

export default OptionsSelector
