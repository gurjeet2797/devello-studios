import "../styles/globals.css";
import "../components/Waves.css";
import { Analytics } from "@vercel/analytics/react";
import { Tooltip } from "react-tooltip";
import { AuthProvider } from "../components/auth/AuthProvider";
import { UserProfileProvider } from "../components/contexts/UserProfileContext";
import { ThemeProvider, useTheme } from "../components/Layout";
import { ToolStateProvider } from "../components/contexts/ToolStateManager";
import { CartProvider } from "../components/store/CartContext";
// Dynamic imports for better code splitting
import dynamic from 'next/dynamic';

const PerformanceMonitor = dynamic(() => import("../components/PerformanceMonitor"), {
  ssr: false
});

const NavigationStudios = dynamic(() => import("../components/NavigationStudios"), {
  ssr: true
});

const Footer = dynamic(() => import("../components/Footer"), {
  ssr: true
});
import ErrorBoundary from "../components/ErrorBoundary";
import { ModalProvider } from "../components/ModalProvider";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { RefreshService } from "../lib/refreshService";
import { useEffect, useState } from "react";

function AppContent({ Component, pageProps }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  
  // Initialize refresh service and monthly 2FA reset
  useEffect(() => {
    const cleanup = RefreshService.initialize();
    
    return () => {
      cleanup();
    };
  }, []);

  // Handle page transitions with fade effect for all pages (mobile and desktop)
  useEffect(() => {
    // Initialize main element opacity on mount
    if (typeof window !== 'undefined') {
      const mainContent = document.querySelector('main')
      if (mainContent) {
        mainContent.style.opacity = '1'
      }
    }

    const handleStart = () => {
      // Always fade out the current page
      setIsPageTransitioning(true)
      
      // Fade out current page - works for both mobile and desktop
      if (typeof window !== 'undefined') {
        const mainContent = document.querySelector('main')
        if (mainContent) {
          // Ensure transition is set before changing opacity
          mainContent.style.transition = 'opacity 0.3s ease-out'
          // Force reflow to ensure transition applies (works on mobile and desktop)
          void mainContent.offsetHeight
          mainContent.style.opacity = '0'
        }
      }
    };
    
    const handleComplete = () => {
      // Fade in the new page - works for both mobile and desktop
      if (typeof window !== 'undefined') {
        // Use double requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const mainContent = document.querySelector('main')
            if (mainContent) {
              // Set transition first, then opacity
              mainContent.style.transition = 'opacity 0.4s ease-in'
              // Force reflow to ensure transition applies (works on mobile and desktop)
              void mainContent.offsetHeight
              mainContent.style.opacity = '1'
            }
            
            // Clean up transition styles after animation
            setTimeout(() => {
              setIsPageTransitioning(false)
              const mainContent = document.querySelector('main')
              if (mainContent) {
                mainContent.style.transition = ''
              }
            }, 400)
          })
        })
      } else {
        setIsPageTransitioning(false)
      }
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router.events]);
  
  // Handle OAuth redirect - no page flash
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // Check if we have tokens in hash (OAuth completed)
      if (window.location.hash.includes('access_token')) {
        // Wait for Supabase to process the tokens
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clear the hash to clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleOAuthRedirect();
  }, [router]);
  
  // Make background overflow visible when any modal is open (only in browser mode, not webapp)
  useEffect(() => {
    const checkModalOpen = () => {
      // Check if in standalone/webapp mode
      const isStandalone = typeof window !== 'undefined' && (
        window.navigator.standalone === true || 
        window.matchMedia('(display-mode: standalone)').matches
      );
      
      const isModalOpen = document.body.classList.contains('build-expanded-open') || 
                         document.body.classList.contains('collection-modal-open') ||
                         document.body.classList.contains('mobile-menu-open') ||
                         document.querySelector('[class*="z-[9998]"]') !== null;
      
      // Update both the app container and the motion.div
      const appContainer = document.querySelector('#__next > div');
      const motionDiv = appContainer?.querySelector('.flex.flex-col');
      
      if (appContainer) {
        // Only use overflow visible in browser mode when modal/menu is open
        // In webapp mode, no browser chrome to show through
        const shouldOverflowVisible = !isStandalone && isModalOpen;
        appContainer.style.overflow = shouldOverflowVisible ? 'visible' : 'auto';
        
        // Also update the motion.div if found
        if (motionDiv) {
          motionDiv.style.overflow = shouldOverflowVisible ? 'visible' : 'auto';
        }
      }
    };
    
    // Check on mount
    checkModalOpen();
    
    // Watch for class changes
    const observer = new MutationObserver(checkModalOpen);
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);
  
  
  // Debug logging (removed for production)
  if (process.env.NODE_ENV === 'development') {
  }
  
  // Check if we're on the home page
  const isHomePage = router.pathname === '/';
  
  // Determine footer variant based on current page
  const isToolPage = router.pathname === '/general-edit' || router.pathname === '/lighting' || router.pathname === '/assisted-edit';
  const isSimpleFooterPage = isToolPage || router.pathname === '/studios';
  const footerVariant = isSimpleFooterPage ? 'simple' : 'full';
  
  return (
    <ModalProvider>
      <motion.div 
        className={`flex flex-col transition-all duration-800`}
        style={{
          minHeight: '100vh',
          minHeight: '-webkit-fill-available',
          /* Extend into status bar area */
          paddingTop: 'env(safe-area-inset-top)',
          backgroundColor: isDark ? '#000000' : '#ffffff',
          backgroundImage: isDark ? 'none' : 'none',
          backgroundAttachment: 'fixed',
          overflow: 'auto' // Will be set to 'visible' by useEffect when modal/menu opens in browser mode
        }}
        animate={{}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Status bar area */}
        <div className="status-bar-area"></div>
        <NavigationStudios domainType="studios" />
        <main 
          className="flex-1 pt-0" 
          style={{ 
            position: 'relative', 
            zIndex: 10, 
            overflow: 'visible'
          }}
        >
          <Component key={router.asPath} {...pageProps} />
        </main>
        <Footer variant={footerVariant} loading={false} style={{ position: 'relative', zIndex: 10 }} />
      </motion.div>
    </ModalProvider>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <ErrorBoundary name="App">
      <AuthProvider>
        <UserProfileProvider>
          <ThemeProvider>
            <ToolStateProvider>
              <CartProvider>
              <Tooltip id="replicate-tooltip" />
              <Tooltip id="vercel-tooltip" />
              <Tooltip id="bytescale-tooltip" />
              <Tooltip id="github-tooltip" />
              <Tooltip id="youtube-tooltip" />
              <ErrorBoundary name="AppContent">
                <AppContent Component={Component} pageProps={pageProps} />
              </ErrorBoundary>
              <PerformanceMonitor />
              <Analytics />
            </CartProvider>
          </ToolStateProvider>
        </ThemeProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
