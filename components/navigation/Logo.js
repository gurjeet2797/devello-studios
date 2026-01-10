import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

const Logo = ({ isDark, isHomePage, getTextColorClass, domainType }) => {
  const router = useRouter();
  // Initialize with domainType prop immediately to prevent glitches
  const [isStudiosDomain, setIsStudiosDomain] = useState(() => {
    // Use domainType prop if provided (server-side or initial render)
    if (domainType) {
      return domainType === 'studios';
    }
    // Client-side fallback detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return hostname === 'devellostudios.com' || hostname === 'www.devellostudios.com';
    }
    return false;
  });
  const [isMounted, setIsMounted] = useState(false);
  const isConstructionPage = router.pathname === '/construction';

  // Ensure blur animation plays on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only detect client-side if domainType wasn't provided
    if (!domainType && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsStudiosDomain(
        hostname === 'devellostudios.com' || 
        hostname === 'www.devellostudios.com'
      );
    } else if (domainType) {
      setIsStudiosDomain(domainType === 'studios');
    }
  }, [domainType]);

  // Determine logo based on domain/page
  const getLogoSrc = () => {
    if (isStudiosDomain) {
      return "https://static.wixstatic.com/media/c6bfe7_67c31351a6414d79b01e880189fdcc0f~mv2.png";
    }
    if (isConstructionPage) {
      return "https://static.wixstatic.com/media/c6bfe7_e11bbb23f48e4a16864640883ea140a7~mv2.png";
    }
    return "https://static.wixstatic.com/media/c6bfe7_6193a40bdca64eb288eabf76cc540dbd~mv2.png";
  };
  
  const logoSrc = getLogoSrc();

  return (
    <Link 
      href="/" 
      className="flex-shrink-0"
      onClick={(e) => {
        if (isHomePage) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.dispatchEvent(new CustomEvent('restartHomepageVideo'));
        }
      }}
    >
      <div className={`about-devello-glass rounded-full p-1 flex items-center justify-center flex-shrink-0 ${isStudiosDomain ? 'h-12 w-12' : 'h-12 w-12'}`}>
        <div
          className={`flex items-center justify-center cursor-pointer transition-colors duration-500 ${getTextColorClass ? getTextColorClass() : ''} ${isStudiosDomain ? 'h-10 w-10' : 'h-10 w-10'}`}
        >
          <div className={`flex-shrink-0 relative flex items-center justify-center overflow-hidden rounded-full ${isStudiosDomain ? 'h-10 w-10' : 'h-10 w-10'}`}>
            <AnimatePresence mode="wait">
              {isMounted && (
                <motion.img
                  key={logoSrc}
                  src={logoSrc}
                  alt={isConstructionPage ? "Devello Construction Logo" : isStudiosDomain ? "Devello Studios Logo" : "Devello Inc Logo"}
                  className={`${isStudiosDomain ? 'h-10 w-10' : 'h-10 w-10'} object-contain hover:scale-105`}
                  style={{ 
                    scale: isConstructionPage ? 1.15 : 1,
                  }}
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Mobile Logo variant
export const MobileLogo = ({ isDark, isHomePage, domainType }) => {
  const router = useRouter();
  // Initialize with domainType prop immediately to prevent glitches
  const [isStudiosDomain, setIsStudiosDomain] = useState(() => {
    // Use domainType prop if provided (server-side or initial render)
    if (domainType) {
      return domainType === 'studios';
    }
    // Client-side fallback detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return hostname === 'devellostudios.com' || hostname === 'www.devellostudios.com';
    }
    return false;
  });
  const [isMounted, setIsMounted] = useState(false);
  const isConstructionPage = router.pathname === '/construction';

  // Ensure blur animation plays on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only detect client-side if domainType wasn't provided
    if (!domainType && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setIsStudiosDomain(
        hostname === 'devellostudios.com' || 
        hostname === 'www.devellostudios.com'
      );
    } else if (domainType) {
      setIsStudiosDomain(domainType === 'studios');
    }
  }, [domainType]);

  // Determine logo based on domain/page
  const getLogoSrc = () => {
    if (isStudiosDomain) {
      return "https://static.wixstatic.com/media/c6bfe7_67c31351a6414d79b01e880189fdcc0f~mv2.png";
    }
    if (isConstructionPage) {
      return "https://static.wixstatic.com/media/c6bfe7_e11bbb23f48e4a16864640883ea140a7~mv2.png";
    }
    return "https://static.wixstatic.com/media/c6bfe7_6193a40bdca64eb288eabf76cc540dbd~mv2.png";
  };
  
  const logoSrc = getLogoSrc();

  return (
    <Link 
      href="/"
      onClick={(e) => {
        if (isHomePage) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.dispatchEvent(new CustomEvent('restartHomepageVideo'));
        }
      }}
    >
      <motion.div
        className={`about-devello-glass rounded-full p-1 flex items-center justify-center ${isStudiosDomain ? 'h-12 w-12' : 'h-12 w-12'}`}
        whileTap={{ y: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ transformOrigin: "center center" }}
      >
        <div className={`flex items-center justify-center cursor-pointer overflow-hidden rounded-full ${isStudiosDomain ? 'h-10 w-10' : 'h-10 w-10'}`}>
          <AnimatePresence mode="wait">
            {isMounted && (
              <motion.img
                key={logoSrc}
                src={logoSrc}
                alt={isConstructionPage ? "Devello Construction Logo" : isStudiosDomain ? "Devello Studios Logo" : "Devello Inc Logo"}
                className={`${isStudiosDomain ? 'h-10 w-10' : 'h-10 w-10'} object-contain hover:scale-105`}
                style={{ 
                  scale: isConstructionPage ? 1.15 : 1,
                }}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Link>
  );
};

export default Logo;

