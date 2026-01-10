import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../Layout';
// BuildButton removed - using placeholder for now
// import BuildButton from '../BuildButton';

export default function StoreHero() {
  const { isDark } = useTheme();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Handle video playback - wait for video to be ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setVideoLoaded(true);
      // Try to play once video is ready
      video.play().catch(err => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Autoplay blocked or failed:', err);
        }
        // Don't set error, just let user interact if needed
      });
    };

    const handleLoadedData = () => {
      setVideoLoaded(true);
    };

    const handleError = (e) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Video loading error:', e);
      }
      setVideoError(true);
      setVideoLoaded(false);
    };

    const handleLoadedMetadata = () => {
      // Video metadata loaded, try to play
      video.play().catch(err => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Autoplay blocked:', err);
        }
      });
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <section className={`relative pt-20 pb-16 sm:pt-16 md:pt-24 md:pb-24 ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      <div className="max-w-5xl lg:max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Single column layout on desktop, mobile keeps original order */}
        <div className="flex flex-col gap-6 lg:gap-8 items-center">
          {/* Heading - First on mobile and desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center gap-4 order-1 pt-4 sm:pt-6 md:pt-8"
          >
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-tight text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              BÉSPOKE
              <br />
              <span className="font-semibold">CRAFTSMANSHIP</span>
            </h1>
            
            {/* Create Custom Product Button - Right below heading */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full sm:w-auto flex justify-center pt-4 pb-4 min-w-[220px] sm:min-w-[300px] md:min-w-[340px]"
            >
              {/* BuildButton removed - functionality not available in Studios */}
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg">
                Request a Custom Design
              </button>
            </motion.div>
          </motion.div>

          {/* Video - Second on mobile and desktop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative w-full order-2 flex items-center justify-center pb-8 sm:pb-0"
          >
            {/* Video container - constrained width to make video smaller */}
            <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl px-2 sm:px-4 md:px-6 lg:px-0 box-border relative rounded-[1.75rem] overflow-hidden">
              <video
                ref={videoRef}
                src="https://video.wixstatic.com/video/c6bfe7_776665ea8ca74be59310f466a3dd6e3b/720p/mp4/file.mp4"
                className={`block w-full h-auto object-contain rounded-[1.75rem] transition-opacity duration-500 ${
                  videoLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  maxHeight: 'none',
                  height: 'auto'
                }}
                muted
                playsInline
                controls={false}
                autoPlay={true}
                preload="auto"
                loop={false}
                onEnded={() => {
                  // Video ended, don't replay
                  if (videoRef.current) {
                    videoRef.current.pause();
                  }
                }}
                onError={(e) => {
                  if (process.env.NODE_ENV !== 'production') {
                    console.error('Video error:', e);
                  }
                  setVideoError(true);
                }}
              />
              {!videoLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-[1.75rem] animate-pulse" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
