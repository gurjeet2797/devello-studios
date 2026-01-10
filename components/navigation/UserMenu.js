import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { isAdminEmail } from '../../lib/adminAuth';
import { getServiceDropdownStyle } from './navigationHelpers';
import { getIconComponent } from './NavigationIcons';

// Code Input Button Component
const CodeInputButton = ({ isDark }) => {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Get or create guest session ID
      let sessionId = localStorage.getItem('devello_guest_session');
      if (!sessionId) {
        sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('devello_guest_session', sessionId);
      }

      const response = await fetch('/api/guest/add-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.trim(),
          sessionId 
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Success - add 5 sessions to localStorage
        const currentCount = parseInt(localStorage.getItem('devello_guest_uploads') || '0', 10);
        const currentLimit = 5; // Base limit
        const newLimit = currentLimit + 5; // Add 5 more
        
        // Update localStorage with new limit (we'll track remaining as limit - used)
        // The actual limit is now higher, so remaining = newLimit - currentCount
        localStorage.setItem('devello_guest_limit', newLimit.toString());
        
        setCode('');
        setShowInput(false);
        // Refresh page to update session count
        window.location.reload();
      } else {
        // Invalid code
        alert(data.error || 'Invalid code');
        setCode('');
      }
    } catch (error) {
      console.error('Error submitting code:', error);
      alert('Error submitting code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showInput) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <motion.input
          ref={inputRef}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 120, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          className="about-devello-glass px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 outline-none"
          style={{ 
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`
          }}
          disabled={isSubmitting}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={isSubmitting || !code.trim()}
          className="about-devello-glass px-3 py-2 rounded-full text-sm font-medium transition-all duration-300"
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          {isSubmitting ? '...' : '✓'}
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setShowInput(false);
            setCode('');
          }}
          className="about-devello-glass px-3 py-2 rounded-full text-sm font-medium transition-all duration-300"
        >
          ✕
        </motion.button>
      </form>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ y: 0, scale: 0.95 }}
        onClick={() => setShowInput(true)}
        className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap"
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ transformOrigin: "center center" }}
      >
        <div className="flex items-center whitespace-nowrap">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Enter Code</span>
        </div>
      </motion.button>
    </div>
  );
};

// Desktop User Menu
export const DesktopUserMenu = ({ 
  user, 
  isDark, 
  showUserMenu, 
  setShowUserMenu, 
  handleSignOut, 
  handleAuthClick,
  userMenuRef 
}) => {
  const router = useRouter();
  // Only show Options for guests on main site (not studios)
  const isStudiosSite = router.pathname.includes('/studios') || router.pathname.includes('/general-edit') || router.pathname.includes('/lighting') || router.pathname.includes('/assisted-edit');

  if (user) {
    return (
      <div className="relative" ref={userMenuRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ y: 0, scale: 0.95 }}
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="about-devello-glass relative px-3 py-2 rounded-full font-medium transition-all duration-300 text-sm whitespace-nowrap"
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={{ transformOrigin: "center center" }}
        >
          <div className="flex items-center gap-1.5">
            <span>Options</span>
            <motion.svg 
              animate={{ x: showUserMenu ? -4 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
        </motion.button>

        {/* Account Dropdown Menu */}
        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 min-w-48 z-50"
            >
              <div className="flex flex-col items-end">
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ y: 0, scale: 0.95 }}
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push('/client-portal');
                  }}
                  className={`about-devello-glass px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer mb-3 ${
                    isDark
                      ? 'text-white/80 hover:text-white'
                      : 'text-black/80 hover:text-black'
                  }`}
                  style={{
                    transformOrigin: "center center"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Client Portal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ y: 0, scale: 0.95 }}
                  onClick={() => {
                    setShowUserMenu(false);
                    // Link to studios profile if on studios site
                    if (isStudiosSite) {
                      router.push('/profile?tab=studios');
                    } else {
                      router.push('/profile');
                    }
                  }}
                  className={`about-devello-glass px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer mb-3 ${
                    isDark
                      ? 'text-white/80 hover:text-white'
                      : 'text-black/80 hover:text-black'
                  }`}
                  style={{
                    transformOrigin: "center center"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  My Profile
                </motion.button>
                {isAdminEmail(user?.email) && (
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ y: 0, scale: 0.95 }}
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/admin/orders');
                    }}
                    className={`about-devello-glass px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer mb-3 w-fit ${
                      isDark
                        ? 'text-white/80 hover:text-white'
                        : 'text-black/80 hover:text-black'
                    }`}
                    style={{
                      transformOrigin: "center center"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    Store Management
                  </motion.button>
                )}
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ y: 0, scale: 0.95 }}
                  onClick={() => {
                    setShowUserMenu(false);
                    handleSignOut();
                  }}
                  className={`about-devello-glass has-tint px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer w-fit ${
                    isDark
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-red-700 hover:text-red-800'
                  }`}
                  style={{
                    '--tint-bg': isDark
                      ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                      : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                    '--tint-border': isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
                    backgroundColor: isDark
                      ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                      : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                    borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
                    transformOrigin: "center center"
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  Sign Out
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Guest user - show Options button with Sign On (only on main site, not studios)
  if (isStudiosSite) {
    return null;
  }
  
  return (
    <div className="relative" ref={userMenuRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ y: 0, scale: 0.95 }}
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="about-devello-glass relative px-3 py-2 rounded-full font-medium transition-all duration-300 text-sm whitespace-nowrap"
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ transformOrigin: "center center" }}
      >
        <div className="flex items-center gap-1.5">
          <span>Options</span>
          <motion.svg 
            animate={{ x: showUserMenu ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </motion.button>

      {/* Guest Options Dropdown - Only Sign On */}
      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 min-w-48 z-50"
          >
            <div className="flex flex-col items-end">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ y: 0, scale: 0.95 }}
                onClick={() => {
                  setShowUserMenu(false);
                  handleAuthClick('signin');
                }}
                className={`about-devello-glass px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer w-auto ${
                  isDark
                    ? 'text-white hover:text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
                style={{
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.2)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  transformOrigin: "center center"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign On</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Mobile User Menu
export const MobileUserMenu = ({ 
  user, 
  isDark, 
  showUserMenu, 
  setShowUserMenu, 
  setMobileMenuOpen,
  handleSignOut, 
  handleAuthClick,
  servicesDropdownOpen
}) => {
  const router = useRouter();
  // Only show Options for guests on main site (not studios)
  const isStudiosSite = router.pathname.includes('/studios') || router.pathname.includes('/general-edit') || router.pathname.includes('/lighting') || router.pathname.includes('/assisted-edit');

  if (user) {
    return (
      <div className="w-full space-y-2">
        <motion.button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="about-devello-glass w-auto text-left px-4 py-5 rounded-full text-base font-medium transition-all duration-300 relative"
        >
          <div className="flex items-center justify-between gap-3">
            <span>Options</span>
            <motion.svg 
              animate={{ x: showUserMenu ? -4 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
        </motion.button>
        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                delay: 0,
                duration: 0.6,
                ease: [0.4, 0, 0.2, 1]
              }}
              style={{ overflow: 'visible' }}
            >
              <div className="mt-2 space-y-2 w-auto flex flex-col items-end">
                {[
                  { name: 'Client Portal', href: '/client-portal', icon: null, toolId: null },
                  { name: 'My Profile', href: '/profile', icon: null, toolId: null },
                  ...(isAdminEmail(user?.email) ? [{ name: 'Store Management', href: '/admin/orders', icon: null, toolId: null }] : [])
                ].map((subItem, index) => {
                  const isActive = router.pathname === subItem.href;
                  const itemStyle = getServiceDropdownStyle(subItem, isDark, router, isActive);
                  // Link to studios profile if on studios site
                  const href = subItem.name === 'My Profile' && isStudiosSite 
                    ? '/profile?tab=studios' 
                    : subItem.href;
                  return (
                    <motion.div 
                      key={subItem.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        delay: 0.2 + (index * 0.05),
                        duration: 0.45,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <Link 
                        href={href} 
                        className="block"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserMenu(false);
                          if (setMobileMenuOpen) {
                            setMobileMenuOpen(false);
                          }
                        }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ y: 0, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className={`w-auto text-left ${itemStyle.className}`}
                          style={{ ...itemStyle.style, transformOrigin: "center center" }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{subItem.name}</span>
                            {subItem.icon && (
                              <motion.span 
                                whileHover={{ x: -4 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="flex-shrink-0"
                              >
                                {getIconComponent(subItem.icon)}
                              </motion.span>
                            )}
                          </div>
                        </motion.button>
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    delay: 0.2 + (3 * 0.05),
                    duration: 0.45,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUserMenu(false);
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ y: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={`about-devello-glass has-tint w-auto text-left px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap cursor-pointer ${
                      isDark
                        ? 'text-red-400 hover:text-red-300'
                        : 'text-red-700 hover:text-red-800'
                    }`}
                    style={{
                      '--tint-bg': isDark
                        ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      '--tint-border': isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
                      backgroundColor: isDark
                        ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
                        : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
                      borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
                      transformOrigin: "center center"
                    }}
                  >
                    Sign Out
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Guest user - show Options button with Sign On (only on main site, not studios)
  if (isStudiosSite) {
    return null;
  }
  
  return (
    <div className="w-full space-y-2">
      <motion.button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="about-devello-glass w-auto text-left px-4 py-5 rounded-full text-base font-medium transition-all duration-300 relative"
      >
        <div className="flex items-center justify-between gap-3">
          <span>Options</span>
          <motion.svg 
            animate={{ x: showUserMenu ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`w-5 h-5 transition-transform duration-300 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </motion.button>
      <AnimatePresence>
        {showUserMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              delay: 0,
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1]
            }}
            style={{ overflow: 'visible' }}
          >
            <div className="mt-2 space-y-2 w-auto flex flex-col items-end">
              <motion.button
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ y: 0, scale: 0.95 }}
                onClick={() => {
                  setShowUserMenu(false);
                  setMobileMenuOpen(false);
                  handleAuthClick('signin');
                }}
                className={`about-devello-glass w-auto px-4 py-3 rounded-full text-base font-medium transition-all duration-300 ${
                  isDark 
                    ? 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign On</span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopUserMenu;

