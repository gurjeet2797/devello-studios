import React, { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { getIconComponent } from './NavigationIcons';
import { getDropdownButtonTint, getServiceDropdownStyle, getToolStateTint } from './navigationHelpers';

// Memoized DropdownNavItem component for dropdown navigation
const DropdownNavItem = memo(({ item, toolStates, isDark, onOpenChange, textColorMode = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  // Notify parent when dropdown opens/closes (for Services and Studios)
  useEffect(() => {
    if ((item.name === 'Services' || item.name === 'Portfolio' || item.name === 'Studios') && onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, item.name, onOpenChange]);

  // Check if any sub-item is active (excluding selected items)
  const hasActiveSubItem = item.items?.some(subItem => router.pathname === subItem.href && !subItem.selected);

  // Close dropdown when route changes to a service page or tool page
  useEffect(() => {
    const handleRouteChange = (url) => {
      const servicePages = ['/software', '/custom', '/consulting'];
      const toolPages = ['/general-edit', '/lighting', '/assisted-edit', '/studios', '/products'];
      if (servicePages.includes(url) || toolPages.includes(url)) {
        setIsOpen(false);
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  const buttonTint = getDropdownButtonTint(item, toolStates, router, isDark);
  
  // Dynamic text color based on background detection
  const textColor = textColorMode === 'dark' ? '#000000' : '#ffffff';
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Trigger blur transition when color changes
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [textColorMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ y: 0, scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`about-devello-glass relative px-3 py-2 rounded-full font-medium transition-all duration-300 text-sm nav-dynamic-color ${buttonTint?.animation || ''}`}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ 
          transformOrigin: "center center",
          '--dynamic-nav-color': textColor,
          color: textColor,
          filter: isTransitioning ? 'blur(2px)' : 'blur(0px)',
          transition: 'color 200ms ease-in-out, filter 200ms ease-in-out',
          ...(buttonTint ? {
            backgroundColor: buttonTint.bgColor,
            borderColor: buttonTint.borderColor
          } : {})
        }}
      >
        <div className="flex items-center gap-1.5 nav-dynamic-text" style={{ color: textColor, filter: isTransitioning ? 'blur(2px)' : 'blur(0px)', transition: 'filter 200ms ease-in-out' }}>
          <span style={{ filter: isTransitioning ? 'blur(2px)' : 'blur(0px)', transition: 'filter 200ms ease-in-out' }}>{item.name}</span>
          <motion.svg 
            animate={{ x: isOpen ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 min-w-48 z-50"
          >
            <div>
              {item.items?.map((subItem, index) => {
                const itemStyle = getServiceDropdownStyle(subItem, isDark, router, subItem.selected || router.pathname === subItem.href);
                const toolStateTint = getToolStateTint(subItem, toolStates, router, isDark);
                const isServiceItem = !subItem.toolId;
                const finalStyle = (toolStateTint && !isServiceItem)
                  ? { 
                      ...itemStyle.style, 
                      '--tint-bg': toolStateTint.bgColor,
                      '--tint-border': toolStateTint.borderColor,
                      backgroundColor: toolStateTint.bgColor, 
                      borderColor: toolStateTint.borderColor 
                    }
                  : itemStyle.style;
                const finalClassName = (toolStateTint && !isServiceItem)
                  ? `${itemStyle.className} ${toolStateTint.animation}`
                  : itemStyle.className;
                
                return (
                <motion.div 
                  key={subItem.name} 
                  className="mb-3 last:mb-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    delay: index * 0.05,
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                >
                  {subItem.external ? (
                    <a 
                      href={subItem.href}
                      onClick={() => setIsOpen(false)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ y: 0, scale: 0.95 }}
                        className={itemStyle.className}
                        style={{ ...itemStyle.style, transformOrigin: "center center" }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="mr-2">{getIconComponent(subItem.icon)}</span>
                            {subItem.name}
                            <span className="ml-2 text-xs text-gray-500">↗</span>
                          </div>
                        </div>
                      </motion.div>
                    </a>
                  ) : subItem.scroll ? (
                    <button
                      onClick={() => {
                        const element = document.querySelector(subItem.href);
                        if (element) {
                          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                          const offsetPosition = elementPosition - 70;
                          window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                          });
                        }
                        setIsOpen(false);
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ y: 0, scale: 0.95 }}
                        className={itemStyle.className}
                        style={{ ...itemStyle.style, transformOrigin: "center center" }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="mr-2">{getIconComponent(subItem.icon)}</span>
                            {subItem.name}
                          </div>
                        </div>
                      </motion.div>
                    </button>
                  ) : (
                    <Link 
                      href={subItem.comingSoon ? '#' : subItem.href} 
                      onClick={(e) => {
                        if (subItem.comingSoon) {
                          e.preventDefault();
                        } else {
                          setIsOpen(false);
                        }
                      }}
                    >
                      <motion.div
                      whileHover={subItem.comingSoon ? {} : { scale: 1.02, x: 4 }}
                      whileTap={subItem.comingSoon ? {} : { y: 0, scale: 0.95 }}
                      className={subItem.comingSoon
                        ? `about-devello-glass px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-not-allowed opacity-60 ${isDark ? 'text-white/40' : 'text-black/40'}`
                        : finalClassName
                      }
                      style={subItem.comingSoon ? {} : { ...finalStyle, transformOrigin: "center center" }}
                      transition={subItem.comingSoon ? {} : { type: "spring", stiffness: 400, damping: 17 }}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">{getIconComponent(subItem.icon)}</span>
                        {subItem.name}
                        {subItem.comingSoon && (
                          <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                      </motion.div>
                    </Link>
                  )}
                </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DropdownNavItem.displayName = 'DropdownNavItem';

export default DropdownNavItem;

