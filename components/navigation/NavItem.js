import React, { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { getIconComponent } from './NavigationIcons';
import { getNavItemButtonTint } from './navigationHelpers';

// Memoized NavItem component to prevent unnecessary re-renders
const NavItem = memo(({ item, isActive, toolState, isDark, textColorMode = 'light' }) => {
  const router = useRouter();
  const handleClick = (e) => {
    if (item.comingSoon) {
      e.preventDefault();
      return;
    }
  };

  const buttonTint = getNavItemButtonTint(item, isActive, toolState, router, isDark);
  
  // Dynamic text color based on background detection
  // textColorMode: 'dark' = black text (for light backgrounds), 'light' = white text (for dark backgrounds)
  const textColor = textColorMode === 'dark' ? '#000000' : '#ffffff';
  const textColorClass = textColorMode === 'dark' ? 'nav-text-dark' : 'nav-text-light';
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Trigger blur transition when color changes
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [textColorMode]);

  return (
    <Link href={item.comingSoon ? '#' : item.href} onClick={handleClick}>
      <motion.button
        whileHover={item.comingSoon ? {} : { scale: 1.02 }}
        whileTap={item.comingSoon ? {} : { y: 0, scale: 0.95 }}
        animate={buttonTint?.animation === 'animate-slow-pulse-glow' && buttonTint?.glowColor ? {
          boxShadow: [
            `0 0 0 0 ${buttonTint.glowColor}`,
            `0 0 20px 8px ${buttonTint.glowColor}`,
            `0 0 0 0 ${buttonTint.glowColor}`
          ],
          opacity: [1, 0.7, 1]
        } : {}}
        transition={buttonTint?.animation === 'animate-slow-pulse-glow' ? {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        } : { type: "spring", stiffness: 400, damping: 17 }}
        className={`about-devello-glass relative px-3 py-2 rounded-full font-medium transition-all duration-300 text-sm whitespace-nowrap flex items-center nav-dynamic-color ${textColorClass} ${
          item.comingSoon
            ? 'cursor-not-allowed opacity-60'
            : ''
        } ${buttonTint?.animation || ''} ${buttonTint ? 'has-tint' : ''}`}
        style={{ 
          transformOrigin: "center center",
          '--dynamic-nav-color': textColor,
          color: textColor,
          filter: isTransitioning ? 'blur(2px)' : 'blur(0px)',
          transition: 'color 200ms ease-in-out, filter 200ms ease-in-out',
          ...(buttonTint ? {
            '--tint-bg': buttonTint.bgColor,
            '--tint-border': buttonTint.borderColor,
            backgroundColor: buttonTint.bgColor,
            borderColor: buttonTint.borderColor
          } : {})
        }}
      >
        <span className="mr-1.5 nav-dynamic-text" style={{ color: textColor, filter: isTransitioning ? 'blur(2px)' : 'blur(0px)', transition: 'filter 200ms ease-in-out' }}>{getIconComponent(item.icon)}</span>
        <span className="nav-dynamic-text" style={{ color: textColor, filter: isTransitioning ? 'blur(2px)' : 'blur(0px)', transition: 'filter 200ms ease-in-out' }}>{item.name}</span>
        {item.comingSoon && (
          <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
            Soon
          </span>
        )}
      </motion.button>
    </Link>
  );
});

NavItem.displayName = 'NavItem';

export default NavItem;

