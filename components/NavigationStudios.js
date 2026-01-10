import React, { useState, useMemo, useCallback, useRef, useEffect, useContext } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { Pacifico } from "next/font/google";
import { useAuth } from './auth/AuthProvider';
import { AuthModal } from './auth/AuthModal';
import { useToolStateManager } from './contexts/ToolStateManager';
import { useTheme } from './Layout';
import { getSupabase } from '../lib/supabaseClient';
import { updateStatusBar } from '../lib/useStatusBar';
import { CartContext } from './store/CartContext';
import CartSidebar from './store/CartSidebar';

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

// Import shared navigation components - using explicit paths to avoid case-sensitivity issues
import DropdownNavItem from './navigation/DropdownNavItem';
import NavItem from './navigation/NavItem';
import ThemeToggle from './navigation/ThemeToggle';
import Logo, { MobileLogo } from './navigation/Logo';
import { DesktopUserMenu, MobileUserMenu } from './navigation/UserMenu';
import CartButton from './navigation/CartButton';
import MobileThemeToggle from './navigation/MobileThemeToggle';
import MobileMenuButton from './navigation/MobileMenuButton';
import { useNavTextColor } from '../hooks/useNavTextColor';

// Studios Navigation - No Services dropdown or Store button
export default function NavigationStudios({ domainType = 'studios' }) {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navRef = useRef(null);
  
  // Cart functionality
  const cartContext = useContext(CartContext);
  const cart = cartContext || null;
  const cartItemCount = cart?.getCartItemCount?.() || 0;
  
  // Check if we're on the home page
  const isHomePage = router.pathname === '/';
  
  // Dynamic text color based on background detection
  const textColorMode = useNavTextColor(navRef, {
    enabled: true,
    threshold: 0.4,
    debounceMs: 100,
    samplePoints: 5
  });
  
  // Listen for auth state changes and open cart after sign-in from guest checkout
  useEffect(() => {
    if (!user) return;
    
    const shouldOpenCart = sessionStorage.getItem('open_cart_after_signin') === 'true';
    
    if (shouldOpenCart) {
      setTimeout(() => {
        setIsCartOpen(true);
        sessionStorage.removeItem('open_cart_after_signin');
        sessionStorage.removeItem('guest_checkout_cart_backup');
      }, 500);
    }
  }, [user]);
  
  // Handle cart checkout
  const handleCartCheckout = async () => {
    setIsCartOpen(false);
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      router.push('/guest-checkout');
    } else {
      router.push('/checkout');
    }
  };
  
  
  // Detect if app is running in standalone/webapp mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkStandalone = () => {
      const isIOSStandalone = window.navigator.standalone === true;
      const isPWAStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isIOSStandalone || isPWAStandalone);
    };
    
    checkStandalone();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
      return () => mediaQuery.removeEventListener('change', checkStandalone);
    }
  }, []);
  
  
  // Check if we're on a tool page
  const isToolPage = router.pathname === '/general-edit' || router.pathname === '/lighting' || router.pathname === '/assisted-edit';

  // Get tool state manager to check for active tools
  const toolStateManager = useToolStateManager();
  
  // Memoized tool states to prevent unnecessary re-renders
  const toolStates = useMemo(() => {
    if (!toolStateManager) return {};
    
    const states = {};
    const imageTools = [
      { name: 'Editing', href: '/general-edit', icon: 'edit', toolId: 'general-edit' },
      { name: 'Lighting', href: '/lighting', icon: 'lighting', toolId: 'lighting' },
      { name: 'Assisted Edit', href: '/assisted-edit', icon: 'ai', toolId: 'assisted-edit' }
    ];
    
    imageTools.forEach(item => {
      if (item.toolId) {
        try {
          const toolState = toolStateManager.getToolState(item.toolId);
          states[item.toolId] = {
            isActive: toolState.isActive,
            isProcessing: toolState.isProcessing,
            isCompleted: toolState.isCompleted
          };
        } catch (error) {
          console.warn(`Error getting tool state for ${item.toolId}:`, error);
          states[item.toolId] = {
            isActive: false,
            isProcessing: false,
            isCompleted: false
          };
        }
      }
    });
    
    return states;
  }, [toolStateManager]);

  // Check if any tool is active
  const hasActiveTool = Object.values(toolStates).some(state => 
    state && (state.originalSrc || state.hasActiveWork || state.isProcessing)
  );
  
  // Check if we're on a tool page
  const isOnToolPage = router.pathname.includes('/general-edit') || 
                      router.pathname.includes('/assisted-edit') || 
                      router.pathname.includes('/lighting');
  
  // Use either tool state or page route to determine if tools are active
  const shouldShowToolButtons = hasActiveTool || isOnToolPage;
  
  // Memoized navigation items - Studios always shows tool buttons when active
  const navItems = useMemo(() => {
    if (shouldShowToolButtons) {
      return [
        { name: 'Editing', href: '/general-edit', icon: 'edit', toolId: 'general-edit' },
        { name: 'Lighting', href: '/lighting', icon: 'lighting', toolId: 'lighting' }
      ];
    }
    return [];
  }, [shouldShowToolButtons]);

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
      // Use push instead of reload to avoid full page reload
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [signOut, router]);

  // Enhanced active state detection
  const isActive = useCallback((item) => {
    return router.pathname === item.href;
  }, [router.pathname]);

  const handleAuthClick = useCallback((mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  }, []);

  // Close user menu when clicking outside - DESKTOP ONLY
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Helper function to get text color class based on background detection
  // Force black text in dark mode for better readability on light backgrounds
  const getTextColorClass = (defaultDark = 'text-white/90', defaultLight = 'text-black/90') => {
    // Always use black text in dark mode for studios page (light background image)
    if (isDark) {
      return 'text-black/90';
    }
    if (!isHomePage) {
      return defaultLight;
    }
    // On home page, use background detection
    return textColorMode === 'dark' ? 'text-black/90' : 'text-white/90';
  };

  // Check if any dropdown is open
  const isAnyDropdownOpen = showUserMenu;

  return (
    <div className="site-nav-root">
      {/* Backdrop blur overlay when any dropdown is open */}
      <AnimatePresence>
        {isAnyDropdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              backgroundColor: 'transparent',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
        )}
      </AnimatePresence>
      <nav 
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-[9999] build-expanded-nav pt-2 transition-colors duration-500 ${pacifico.variable}`}
        style={{
          backdropFilter: 'none',
          background: 'transparent',
          border: 'none',
          backgroundColor: 'transparent',
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))'
        }}
      >
        <div className="max-w-2xl sm:max-w-4xl mx-auto px-4 md:px-[1px] flex-shrink-0 min-w-0">
          {/* Desktop Layout - 3 column grid */}
          <div className="hidden md:grid grid-cols-3 items-center h-16 gap-4 min-w-0">
            
            {/* Left column - Logo, Apps dropdown, and Home link */}
            <div className="flex justify-start items-center space-x-3 h-full flex-shrink-0 min-w-0">
              <Logo isDark={isDark} isHomePage={isHomePage} getTextColorClass={getTextColorClass} domainType={domainType} />
              
              {/* Apps Dropdown */}
              <DropdownNavItem
                item={{
                  name: 'Apps',
                  isDropdown: true,
                  items: [
                    { name: 'Professional Lighting', href: '/lighting', icon: 'lighting', toolId: null, external: false },
                    { name: 'Assisted Edit', href: '/assisted-edit', icon: 'ai', toolId: null, external: false },
                    { name: 'General Edit', href: '/general-edit', icon: 'edit', toolId: null, external: false }
                  ]
                }}
                toolStates={toolStates}
                isDark={isDark}
                textColorMode={textColorMode}
                onOpenChange={(open) => {
                  setAppsDropdownOpen(open);
                }}
              />
              
              {/* Home button */}
              <a
                href="https://develloinc.com"
                className="about-devello-glass relative px-4 py-1.5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="text-lg font-normal" style={{ fontFamily: 'var(--font-pacifico)' }}>
                  home
                </span>
              </a>
            </div>

            {/* Center column - Tool buttons when active */}
            <div className="flex items-center justify-center space-x-2 flex-nowrap h-full flex-shrink-0 min-w-0">
              {navItems.length > 0 && (
                navItems.map((item) => (
                  item.isDropdown ? (
                    <DropdownNavItem
                      key={item.name}
                      item={item}
                      toolStates={toolStates}
                      isDark={isDark}
                      textColorMode={textColorMode}
                    />
                  ) : (
                    <NavItem
                      key={item.name}
                      item={item}
                      isActive={isActive(item)}
                      toolState={item.toolId ? toolStates[item.toolId] : null}
                      isDark={isDark}
                      textColorMode={textColorMode}
                    />
                  )
                ))
              )}
            </div>

            {/* Right column - Auth/User Menu */}
            <div className="flex justify-end items-center space-x-2 h-full flex-shrink-0 min-w-0">
              <div className="hidden md:flex items-center space-x-2">
                <DesktopUserMenu
                  user={user}
                  isDark={isDark}
                  showUserMenu={showUserMenu}
                  setShowUserMenu={setShowUserMenu}
                  handleSignOut={handleSignOut}
                  handleAuthClick={handleAuthClick}
                  userMenuRef={userMenuRef}
                />
                
                {/* Cart Button */}
                <CartButton
                  cartItemCount={cartItemCount}
                  isDark={isDark}
                  onClick={() => setIsCartOpen(true)}
                />
                
                {/* Theme Toggle */}
                <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between relative">
            {/* Left - Logo and Home link */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <MobileLogo isDark={isDark} isHomePage={isHomePage} domainType={domainType} />
              <a
                href="https://develloinc.com"
                className="about-devello-glass relative px-3 py-1.5 h-12 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <span className="text-base sm:text-base font-normal" style={{ fontFamily: 'var(--font-pacifico)' }}>
                  home
                </span>
              </a>
            </div>

            {/* Right - Cart, Theme Toggle, and Menu Button */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <CartButton
                cartItemCount={cartItemCount}
                isDark={isDark}
                onClick={() => setIsCartOpen(true)}
                className="transition-all duration-300 flex-shrink-0"
              />
              <MobileThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
              <MobileMenuButton
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-30 pointer-events-none"
              style={{
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 overflow-y-auto"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                backgroundColor: 'transparent',
                paddingTop: 'max(5rem, calc(4.5rem + env(safe-area-inset-top, 0px) + 0.5rem))',
                paddingBottom: '0'
              }}
            >
            {/* Menu Content */}
            <motion.div 
              className="px-4 space-y-3 flex flex-col items-end"
              layout
              onClick={(e) => e.stopPropagation()}
              transition={{ 
                duration: 0.6, 
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{ paddingBottom: '0' }}
            >
              {/* Relight App Button */}
              <motion.div 
                className="block mb-0 last:mb-0 flex flex-col items-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
              >
                <Link href="/lighting" onClick={() => setMobileMenuOpen(false)}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="about-devello-glass has-tint w-auto text-left px-4 py-5 rounded-full text-base font-medium transition-all duration-300 relative flex items-center gap-2"
                    style={{
                      '--tint-bg': isDark
                        ? 'color-mix(in srgb, rgba(251, 191, 36, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(251, 191, 36, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      '--tint-border': isDark ? 'rgba(252, 211, 77, 0.4)' : 'rgba(251, 191, 36, 0.3)',
                      backgroundColor: isDark
                        ? 'color-mix(in srgb, rgba(251, 191, 36, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(251, 191, 36, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      borderColor: isDark ? 'rgba(252, 211, 77, 0.4)' : 'rgba(251, 191, 36, 0.3)'
                    }}
                  >
                    <span>Relight App</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Image Editor Button */}
              <motion.div 
                className="block mb-0 last:mb-0 flex flex-col items-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
              >
                <Link href="/general-edit" onClick={() => setMobileMenuOpen(false)}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="about-devello-glass has-tint w-auto text-left px-4 py-5 rounded-full text-base font-medium transition-all duration-300 relative flex items-center gap-2"
                    style={{
                      '--tint-bg': isDark
                        ? 'color-mix(in srgb, rgba(139, 92, 246, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(139, 92, 246, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      '--tint-border': isDark ? 'rgba(167, 139, 250, 0.4)' : 'rgba(139, 92, 246, 0.3)',
                      backgroundColor: isDark
                        ? 'color-mix(in srgb, rgba(139, 92, 246, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(139, 92, 246, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      borderColor: isDark ? 'rgba(167, 139, 250, 0.4)' : 'rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <span>Image Editor</span>
                  </motion.button>
                </Link>
              </motion.div>

              {/* Product Editor Button */}
              <motion.div 
                className="block mb-0 last:mb-0 flex flex-col items-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3, ease: "easeOut" }}
              >
                <a 
                  href="https://catalog-editor-989777430052.us-west1.run.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="about-devello-glass has-tint w-auto text-left px-4 py-5 rounded-full text-base font-medium transition-all duration-300 relative flex items-center gap-2"
                    style={{
                      '--tint-bg': isDark
                        ? 'color-mix(in srgb, rgba(16, 185, 129, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(16, 185, 129, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      '--tint-border': isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.3)',
                      backgroundColor: isDark
                        ? 'color-mix(in srgb, rgba(16, 185, 129, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(16, 185, 129, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      borderColor: isDark ? 'rgba(52, 211, 153, 0.4)' : 'rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <span>Product Editor</span>
                  </motion.button>
                </a>
              </motion.div>

              {/* Decorative vertical separator line */}
              <motion.div 
                className="block mb-0 last:mb-0 flex flex-col items-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.225, duration: 0.3, ease: "easeOut" }}
              >
                <div 
                  className={`w-16 h-px ${isDark ? 'bg-white/20' : 'bg-gray-300/50'}`}
                  style={{
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                />
              </motion.div>

              {/* Options Button (User Menu) */}
              <motion.div 
                className="block mb-0 last:mb-0 flex flex-col items-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3, ease: "easeOut" }}
              >
                <MobileUserMenu
                  user={user}
                  isDark={isDark}
                  showUserMenu={showUserMenu}
                  setShowUserMenu={setShowUserMenu}
                  setMobileMenuOpen={setMobileMenuOpen}
                  handleSignOut={handleSignOut}
                  handleAuthClick={handleAuthClick}
                  servicesDropdownOpen={false}
                />
              </motion.div>
            </motion.div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />

      {/* Cart Sidebar */}
      {cartItemCount > 0 && (
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCartCheckout}
        />
      )}
    </div>
  );
}

