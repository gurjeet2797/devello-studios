import React, { useState, useEffect, createContext, useContext, useMemo, memo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from './auth/AuthProvider';
import { AuthModal } from './auth/AuthModal';
import { useToolStateManager } from './contexts/ToolStateManager';
import { useCart } from './store/CartContext';
import CartSidebar from './store/CartSidebar';
import CustomCheckout from './store/CustomCheckout';
import { ShoppingCart } from 'lucide-react';
import { forceUpdateStatusBar } from '../lib/useStatusBar';

// Memoized NavItem component to prevent unnecessary re-renders
const NavItem = memo(({ item, isActive, toolState, onNavigate, isDark, isHomePage }) => {
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => onNavigate(item.href, e)}
      className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
        isActive
          ? isDark
            ? isHomePage 
              ? 'bg-transparent text-white border-none'
              : 'bg-white/20 text-white border border-white/30'
            : isHomePage
              ? 'bg-transparent text-amber-900 border-none'
              : 'bg-amber-200/60 text-amber-900 border border-amber-300/50'
          : isDark
          ? isHomePage
            ? 'text-white/70 hover:text-white hover:bg-transparent border-none'
            : 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
          : isHomePage
            ? 'text-amber-800/70 hover:text-amber-900 hover:bg-transparent border-none'
            : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-50/50 border border-transparent'
      }`}
      style={{
        backdropFilter: isHomePage ? 'none' : 'blur(10px)'
      }}
    >
      <span className="mr-2">{item.icon}</span>
      {item.name}
      {/* Dynamic indicator for tool states */}
      {item.toolId && toolState && toolState.isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
            toolState.isProcessing 
              ? 'bg-gray-600 animate-pulse' 
              : toolState.isCompleted 
                ? 'bg-blue-400' 
                : 'bg-green-400'
          }`}
        />
      )}
    </motion.button>
  );
});

NavItem.displayName = 'NavItem';

// Memoized Mobile NavItem component
const MobileNavItem = memo(({ item, isActive, toolState, onNavigate }) => {
  const { isDark } = useTheme();
  
  return (
    <motion.button
      onClick={(e) => onNavigate(item.href, e)}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 relative ${
        isActive
          ? isDark 
            ? 'bg-white/20 text-white border border-white/30'
            : 'bg-amber-100/60 text-amber-900 border border-amber-300/50'
          : isDark
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-50/50'
      }`}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <span className="mr-3">{item.icon}</span>
      {item.name}
      {/* Dynamic indicator for tool states */}
      {item.toolId && toolState && toolState.isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
            toolState.isProcessing 
              ? 'bg-gray-600 animate-pulse' 
              : toolState.isCompleted 
                ? 'bg-blue-400' 
                : 'bg-green-400'
          }`}
        />
      )}
    </motion.button>
  );
});

MobileNavItem.displayName = 'MobileNavItem';

// Memoized Theme Toggle component to prevent flickering
const ThemeToggle = memo(({ isDark, onToggle, isHomePage }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`p-2 rounded-xl transition-all duration-500 ${
        isDark 
          ? isHomePage
            ? 'bg-transparent text-white/80 hover:bg-transparent border-none'
            : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
          : isHomePage
            ? 'bg-transparent text-amber-800 hover:bg-transparent border-none'
            : 'bg-amber-100/50 text-amber-800 hover:bg-amber-200/60 border border-amber-300/30'
      }`}
      style={{ backdropFilter: isHomePage ? 'none' : 'blur(10px)' }}
    >
      <motion.div
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        className="text-lg"
      >
        {isDark ? '🌙' : '☀️'}
      </motion.div>
    </motion.button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';


// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false); // Default to light mode
  const [userPreference, setUserPreference] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const router = useRouter();

  // Initialize theme from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedPreference = localStorage.getItem('theme-preference');
    const savedInteraction = localStorage.getItem('theme-user-interacted');
    
    console.log('Theme initialization:', {
      savedPreference,
      savedInteraction,
      currentPath: window.location.pathname
    });
    
    if (savedPreference !== null) {
      const preference = savedPreference === 'dark' ? true : false;
      setUserPreference(preference);
      setIsDark(preference);
      setHasUserInteracted(true);
    } else {
      // Default to light mode if no preference is saved
      setIsDark(false);
      setUserPreference(false);
    }
  }, []);


  // Apply theme to body element and update background colors
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    // Update background colors
    const root = document.documentElement;
    const bgColor = isDark ? '#000000' : '#ffffff';
    
    // Update CSS custom properties for background
    root.style.setProperty('--bg-color', bgColor);
    
    // Update html and body background directly for immediate effect
    root.style.background = bgColor;
    root.style.backgroundAttachment = 'fixed';
    document.body.style.background = bgColor;
    document.body.style.backgroundAttachment = 'fixed';
    
    // Update status bar using centralized utility (handles meta tags and status bar area)
    forceUpdateStatusBar(isDark);
  }, [isDark]);

  // Update background colors and status bar on route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBackgroundOnRoute = () => {
      const root = document.documentElement;
      const bgColor = isDark ? '#000000' : '#ffffff';
      
      // Update CSS custom properties for background
      root.style.setProperty('--bg-color', bgColor);
      
      // Update html and body background directly for immediate effect
      root.style.background = bgColor;
      root.style.backgroundAttachment = 'fixed';
      document.body.style.background = bgColor;
      document.body.style.backgroundAttachment = 'fixed';
      
      // Status bar is handled by theme useEffect to avoid duplicate updates
    };

    const handleRouteChangeComplete = () => {
      updateBackgroundOnRoute();
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router.events, isDark]);

  const toggleTheme = () => {
    const newTheme = !isDark;
    console.log('Toggling theme:', {
      from: isDark ? 'dark' : 'light',
      to: newTheme ? 'dark' : 'light',
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
    });
    
    setIsDark(newTheme);
    setUserPreference(newTheme);
    setHasUserInteracted(true);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
      localStorage.setItem('theme-user-interacted', 'true');
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      toggleTheme,
      userPreference,
      hasUserInteracted
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

function Navigation({ onAuthClick, isHomePage }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Check if we're on store pages
  const isStorePage = router.pathname === '/custom' || router.pathname === '/storecatalogue';
  
  // Get cart count
  let cartItemCount = 0;
  let getCartItemCount = null;
  try {
    const cart = useCart();
    getCartItemCount = cart.getCartItemCount;
    cartItemCount = cart.getCartItemCount();
  } catch (e) {
    // Cart context not available (not wrapped)
  }
  
  // Debug mobile menu state changes
  useEffect(() => {
  }, [mobileMenuOpen]);

  // Close mobile menu on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setMobileMenuOpen(false);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Scroll detection for glassy button adjustments
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Get tool state manager to check for active tools
  const toolStateManager = useToolStateManager();
  
  // Memoized navigation items to prevent re-creation
  const navItems = useMemo(() => [
    { name: 'Home', href: '/', icon: '✨', toolId: null },
    { name: 'Editing', href: '/general-edit', icon: '🎨', toolId: 'general-edit' },
    { name: 'Lighting', href: '/lighting', icon: '☀️', toolId: 'lighting' }
  ], []);
  
  // Memoized tool states to prevent unnecessary re-renders
  const toolStates = useMemo(() => {
    if (!toolStateManager) return {};
    
    const states = {};
    navItems.forEach(item => {
      if (item.toolId) {
        const toolState = toolStateManager.getToolState(item.toolId);
        const isActive = toolStateManager.hasActiveWork(item.toolId);
        const isProcessing = toolState.isProcessing || toolState.isUpscaling;
        const isCompleted = toolState.showEnhanced && toolState.upscaledImage;
        
        states[item.toolId] = { isActive, isProcessing, isCompleted };
      }
    });
    
    return states;
  }, [toolStateManager, navItems]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Google sign-in error:', error);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  }, [signInWithGoogle]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Stay on current page after sign out
      router.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut, router]);

  // Enhanced active state detection
  const isActive = useCallback((item) => {
    if (item.href === '/') {
      return router.pathname === '/' && !router.query.tool;
    }
    return router.pathname === item.href;
  }, [router.pathname, router.query.tool]);

  const handleNavigation = useCallback((href, e) => {
    // Prevent default to handle navigation manually
    e.preventDefault();
    
    // Close mobile menu
    setMobileMenuOpen(false);
    
    // Use router.push for better state management
    router.push(href);
  }, [router]);

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 nav-with-status-bar ${isScrolled ? 'scrolled' : ''}`}
      style={{
        backdropFilter: 'none',
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        backgroundColor: 'transparent',
        backgroundImage: 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className={`text-2xl transition-colors duration-500 ${isDark ? 'filter drop-shadow-lg' : 'filter drop-shadow-sm'}`}
            >
              🏛️
            </motion.div>
            <Link href="/" className="group" onClick={(e) => handleNavigation('/', e)}>
              <span className="glassy-home-button">
                Devello
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive(item)}
                toolState={item.toolId ? toolStates[item.toolId] : null}
                onNavigate={handleNavigation}
                isDark={isDark}
                isHomePage={isHomePage}
              />
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Cart Button - Only on store pages */}
            {isStorePage && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                    : 'bg-amber-100/50 text-amber-800 hover:bg-amber-200/60 border border-amber-300/30'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </motion.button>
            )}
            
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} isHomePage={isHomePage} />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  : 'bg-amber-100/50 text-amber-800 hover:bg-amber-200/60 border border-amber-300/30'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="w-5 h-5 flex flex-col justify-center items-center">
                <motion.div
                  animate={{ 
                    rotate: mobileMenuOpen ? 45 : 0,
                    y: mobileMenuOpen ? 2 : -2
                  }}
                  className={`w-4 h-0.5 ${isDark ? 'bg-white/80' : 'bg-amber-800'} transition-colors duration-300`}
                />
                <motion.div
                  animate={{ 
                    rotate: mobileMenuOpen ? -45 : 0,
                    y: mobileMenuOpen ? -2 : 2
                  }}
                  className={`w-4 h-0.5 ${isDark ? 'bg-white/80' : 'bg-amber-800'} transition-colors duration-300`}
                />
              </div>
            </motion.button>
          </div>

          {/* Desktop Auth/User Menu */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Cart Button - Only on store pages */}
            {isStorePage && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartOpen(true)}
                className={`relative px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isDark 
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                    : 'bg-amber-100/50 text-amber-800 hover:bg-amber-200/60 border border-amber-300/30'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </motion.button>
            )}
            
            {user ? (
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/profile')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isDark 
                      ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                      : 'bg-amber-100/50 text-amber-800 hover:bg-amber-200/60 border border-amber-300/30'
                  }`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  👤 {user.email?.split('@')[0]}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isDark 
                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                  }`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {/* Combined Sign In with Google Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoogleSignIn}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isDark 
                      ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                  }`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign In
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAuthClick('signup')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isDark 
                      ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                  }`}
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  Sign Up
                </motion.button>
              </div>
            )}
            
            {/* Desktop Theme Toggle */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} isHomePage={isHomePage} />
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden absolute top-full left-0 right-0 z-40 ${
              isDark 
                ? 'bg-black/90 backdrop-blur-xl border-white/10' 
                : 'bg-white/90 backdrop-blur-xl border-amber-200/30'
            } border-b`}
            style={{
              backdropFilter: 'blur(20px)',
              background: isDark 
                ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(248,245,241,0.95) 0%, rgba(237,229,216,0.98) 100%)'
            }}
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.name}
                  item={item}
                  isActive={isActive(item)}
                  toolState={item.toolId ? toolStates[item.toolId] : null}
                  onNavigate={handleNavigation}
                />
              ))}
              
              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                {user ? (
                  <div className="space-y-2">
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        router.push('/profile');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                          : 'bg-amber-100/50 text-amber-800 hover:bg-amber-200/60 border border-amber-300/30'
                      }`}
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      👤 {user.email?.split('@')[0]}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                          : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                      }`}
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      Sign Out
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Combined Sign In with Google Button */}
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleGoogleSignIn();
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                      }`}
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign In
                      </div>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onAuthClick('signup');
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                      }`}
                      style={{ backdropFilter: 'blur(10px)' }}
                    >
                      Sign Up
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sidebar */}
      {isStorePage && (
        <>
          <CartSidebar
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
          <CustomCheckout
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onSuccess={async () => {
              setIsCheckoutOpen(false);
              // Route authenticated users to client portal, guests to store catalogue
              if (user) {
                router.push('/client-portal?view=product_orders');
              } else {
                router.push('/storecatalogue?success=true');
              }
            }}
          />
        </>
      )}
    </motion.nav>
  );
}

function Footer() {
  const { isDark } = useTheme();
  const router = useRouter();
  
  // Detect current domain for context-aware linking
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname.replace('www.', '');
    }
    return 'develloinc.com';
  };
  
  const currentDomain = getCurrentDomain();
  const isMainDomain = currentDomain === 'develloinc.com';
  const isStudiosDomain = currentDomain.includes('devellostudios.com');
  const isTechDomain = currentDomain.includes('devellotech.com');
  
  return (
    <footer 
      className={`transition-colors duration-700 ${
        isDark ? 'text-white/60' : 'text-amber-800/60'
      }`}
    >
      <div className="max-w-2xl sm:max-w-4xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8 py-8">
        {/* Internal Cross-Domain Links for SEO */}
        <div className="mb-6 text-center">
          <p className="text-xs mb-3 opacity-60">Devello Family of Services</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {!isMainDomain && (
              <a 
                href="https://develloinc.com" 
                className="hover:opacity-100 opacity-70 transition-opacity"
                rel="noopener noreferrer"
              >
                Devello Inc
              </a>
            )}
            {!isStudiosDomain && (
              <a 
                href="https://devellostudios.com" 
                className="hover:opacity-100 opacity-70 transition-opacity"
                rel="noopener noreferrer"
              >
                Devello Studios
              </a>
            )}
            {!isTechDomain && (
              <a 
                href="https://devellotech.com" 
                className="hover:opacity-100 opacity-70 transition-opacity"
                rel="noopener noreferrer"
              >
                Devello Tech
              </a>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm font-normal tracking-normal">
            Professional software development and digital solutions
          </p>
          <p className="text-xs mt-2 opacity-70">
            © 2024 Devello Inc. Custom software development services.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Layout({ children, title, description }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const handleAuthClick = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };
  
  // Check if we're on the home page
  const isHomePage = router.pathname === '/';

  return (
    <motion.div 
      className="min-h-screen flex flex-col transition-all duration-700"
    >
      <Navigation onAuthClick={handleAuthClick} isHomePage={isHomePage} />
      
      <main className="flex-1 flex flex-col pt-[4.5rem]">
        <div className={`flex-1 ${isHomePage ? 'max-w-none mx-auto px-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-4 sm:py-6 pt-8 sm:pt-6`}>
          {title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12 pt-8 sm:pt-12"
            >
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extralight mb-4 tracking-wide transition-colors duration-500 ${
                isDark ? 'text-white/95' : 'text-amber-900/90'
              }`}>
                {title}
              </h1>
              {description && (
                <p className={`text-lg font-light max-w-2xl mx-auto leading-relaxed tracking-wide transition-colors duration-500 ${
                  isDark ? 'text-white/70' : 'text-amber-800/70'
                }`}>
                  {description}
                </p>
              )}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </div>
      </main>
      
      <Footer />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </motion.div>
  );
} 
