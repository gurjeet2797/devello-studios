// Helper function to get service page tint based on current route
export const getServicePageTint = (router, isDark) => {
  const pathname = router.pathname;
  
  if (pathname === '/software') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(56, 189, 248, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(56, 189, 248, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(125, 211, 252, 0.4)' : 'rgba(56, 189, 248, 0.3)'
    };
  } else if (pathname === '/construction') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(249, 115, 22, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(249, 115, 22, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(251, 146, 60, 0.4)' : 'rgba(249, 115, 22, 0.3)'
    };
  } else if (pathname === '/custom') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(52, 211, 153, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(52, 211, 153, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(110, 231, 183, 0.4)' : 'rgba(52, 211, 153, 0.3)'
    };
  } else if (pathname === '/storecatalogue' || pathname === '/manufacturing') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(56, 189, 248, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(56, 189, 248, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(125, 211, 252, 0.4)' : 'rgba(56, 189, 248, 0.3)'
    };
  } else if (pathname === '/consulting') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(251, 191, 36, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(251, 191, 36, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(253, 224, 71, 0.4)' : 'rgba(251, 191, 36, 0.3)'
    };
  }
  
  return null;
};

// Helper function to get glass styling for service dropdown items
// Uses same pattern as Store button with CSS variables and has-tint class
export const getServiceDropdownStyle = (subItem, isDark, router, isActive = false) => {
  const baseClasses = 'about-devello-glass dropdown-item has-tint px-4 py-3 text-sm font-medium transition-all duration-300 rounded-full whitespace-nowrap cursor-pointer';
  
  let textColor = '';
  let bgColor = '';
  let borderColor = '';
  
  // Service dropdown colors
  if (subItem.name === 'Business Consultation') {
    textColor = isDark ? 'text-yellow-300 hover:text-yellow-200' : 'text-yellow-700 hover:text-yellow-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(250, 204, 21, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(250, 204, 21, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(250, 204, 21, 0.5)' : 'rgba(250, 204, 21, 0.4)';
  } else if (subItem.name === 'Software Development') {
    textColor = isDark 
      ? (isActive ? 'text-blue-200' : 'text-blue-300 hover:text-blue-200')
      : (isActive ? 'text-blue-800' : 'text-blue-700 hover:text-blue-800');
    bgColor = isDark
      ? (isActive ? 'color-mix(in srgb, rgba(59, 130, 246, 0.3) 40%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(59, 130, 246, 0.3) 40%, rgba(220, 220, 220, 0.2))')
      : (isActive ? 'color-mix(in srgb, rgba(59, 130, 246, 0.25) 40%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(59, 130, 246, 0.25) 40%, rgba(220, 220, 220, 0.2))');
    borderColor = isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.4)';
  } else if (subItem.name === 'Construction Services' || subItem.name === 'Construction' || subItem.name === 'Interior Renovations') {
    textColor = isDark ? 'text-orange-300 hover:text-orange-200' : 'text-orange-700 hover:text-orange-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(249, 115, 22, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(249, 115, 22, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(251, 146, 60, 0.5)' : 'rgba(249, 115, 22, 0.4)';
  } else if (subItem.name === 'Custom Fabrication' || subItem.name === 'Bespoke Millwork' || subItem.name === 'Bespoke' || subItem.name === 'Millwork & Custom Builds') {
    textColor = isDark ? 'text-emerald-300 hover:text-emerald-200' : 'text-emerald-700 hover:text-emerald-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(52, 211, 153, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(52, 211, 153, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(110, 231, 183, 0.5)' : 'rgba(52, 211, 153, 0.4)';
  } 
  // Studio dropdown colors
  else if (subItem.name === 'Devello Studios' || subItem.name === 'Studios' || subItem.name === 'Apps & Studios') {
    textColor = isDark ? 'text-sky-300 hover:text-sky-200' : 'text-sky-700 hover:text-sky-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(56, 189, 248, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(56, 189, 248, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(125, 211, 252, 0.5)' : 'rgba(56, 189, 248, 0.4)';
  } else if (subItem.name === 'Lighting Studio') {
    textColor = isDark ? 'text-yellow-300 hover:text-yellow-200' : 'text-yellow-700 hover:text-yellow-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(234, 179, 8, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(234, 179, 8, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(250, 204, 21, 0.5)' : 'rgba(234, 179, 8, 0.4)';
  } else if (subItem.name === 'Image Editor') {
    textColor = isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(59, 130, 246, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(59, 130, 246, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(96, 165, 250, 0.5)' : 'rgba(59, 130, 246, 0.4)';
  } else if (subItem.name === 'Product Studio') {
    textColor = isDark ? 'text-pink-300 hover:text-pink-200' : 'text-pink-700 hover:text-pink-800';
    bgColor = isDark
      ? 'color-mix(in srgb, rgba(236, 72, 153, 0.3) 40%, rgba(220, 220, 220, 0.2))'
      : 'color-mix(in srgb, rgba(236, 72, 153, 0.25) 40%, rgba(220, 220, 220, 0.2))';
    borderColor = isDark ? 'rgba(244, 114, 182, 0.5)' : 'rgba(236, 72, 153, 0.4)';
  }
  // Account menu colors
  else if (subItem.name === 'Client Portal') {
    textColor = isDark 
      ? (isActive ? 'text-sky-200' : 'text-sky-300 hover:text-sky-200')
      : (isActive ? 'text-sky-800' : 'text-sky-700 hover:text-sky-800');
    bgColor = isDark
      ? (isActive ? 'color-mix(in srgb, rgba(56, 189, 248, 0.35) 50%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(56, 189, 248, 0.25) 50%, rgba(220, 220, 220, 0.2))')
      : (isActive ? 'color-mix(in srgb, rgba(56, 189, 248, 0.3) 50%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(56, 189, 248, 0.2) 50%, rgba(220, 220, 220, 0.2))');
    borderColor = isDark ? 'rgba(125, 211, 252, 0.5)' : 'rgba(56, 189, 248, 0.4)';
  } else if (subItem.name === 'My Profile') {
    textColor = isDark 
      ? (isActive ? 'text-amber-200' : 'text-amber-300 hover:text-amber-200')
      : (isActive ? 'text-amber-800' : 'text-amber-600 hover:text-amber-700');
    bgColor = isDark
      ? (isActive ? 'color-mix(in srgb, rgba(251, 191, 36, 0.35) 50%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(251, 191, 36, 0.25) 50%, rgba(220, 220, 220, 0.2))')
      : (isActive ? 'color-mix(in srgb, rgba(251, 191, 36, 0.3) 50%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(251, 191, 36, 0.2) 50%, rgba(220, 220, 220, 0.2))');
    borderColor = isDark ? 'rgba(253, 224, 71, 0.5)' : 'rgba(251, 191, 36, 0.4)';
  } else if (subItem.name === 'Store Management') {
    textColor = isDark 
      ? (isActive ? 'text-purple-200' : 'text-purple-300 hover:text-purple-200')
      : (isActive ? 'text-purple-800' : 'text-purple-700 hover:text-purple-800');
    bgColor = isDark
      ? (isActive ? 'color-mix(in srgb, rgba(168, 85, 247, 0.35) 50%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(168, 85, 247, 0.25) 50%, rgba(220, 220, 220, 0.2))')
      : (isActive ? 'color-mix(in srgb, rgba(168, 85, 247, 0.3) 50%, rgba(220, 220, 220, 0.2))' : 'color-mix(in srgb, rgba(168, 85, 247, 0.2) 50%, rgba(220, 220, 220, 0.2))');
    borderColor = isDark ? 'rgba(192, 132, 252, 0.5)' : 'rgba(168, 85, 247, 0.4)';
  }
  // Default (no tint)
  else {
    textColor = isDark ? 'text-white/80 hover:text-white' : 'text-black/80 hover:text-black';
    bgColor = isDark
      ? 'rgba(220, 220, 220, 0.2)'
      : 'rgba(220, 220, 220, 0.2)';
    borderColor = isDark ? 'rgba(200, 200, 200, 0.3)' : 'rgba(200, 200, 200, 0.3)';
  }
  
  return {
    className: `${baseClasses} ${textColor}`,
    style: { 
      '--tint-bg': bgColor,
      '--tint-border': borderColor,
      backgroundColor: bgColor,
      borderColor: borderColor
    }
  };
};

// Get button tint for dropdown items
export const getDropdownButtonTint = (item, toolStates, router, isDark) => {
  // For Services/Portfolio dropdown, check if we're on a service page
  if (item.name === 'Services' || item.name === 'Portfolio') {
    const serviceTint = getServicePageTint(router, isDark);
    if (serviceTint) {
      return serviceTint;
    }
  }
  
  if (!item.items) return null;
  
  // Check for active items first
  const activeItem = item.items.find(subItem => router.pathname === subItem.href);
  if (activeItem && activeItem.toolId && toolStates[activeItem.toolId]) {
    const toolState = toolStates[activeItem.toolId];
    // For Studios dropdown with tool items, use red tint when active
    if (item.name === 'Studios') {
      if (toolState.isProcessing) {
        return {
          bgColor: isDark 
            ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
            : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
          borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
          animation: 'animate-slow-pulse-glow',
          glowColor: isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.5)'
        };
      } else {
        return {
          bgColor: isDark 
            ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
            : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
          borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
          animation: ''
        };
      }
    }
    // For other dropdowns, use white tint
    if (toolState.isProcessing) {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(255, 255, 255, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(255, 255, 255, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.4)',
        animation: 'animate-slow-pulse-glow',
        glowColor: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.5)'
      };
    } else {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(255, 255, 255, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(255, 255, 255, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.4)',
        animation: ''
      };
    }
  }
  
  // Check for processing states
  const processingItem = item.items.find(subItem => 
    subItem.toolId && toolStates[subItem.toolId]?.isProcessing
  );
  if (processingItem) {
    if (item.name === 'Studios') {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: 'animate-slow-pulse-glow',
        glowColor: isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.5)'
      };
    }
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(75, 85, 99, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(75, 85, 99, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(107, 114, 128, 0.4)' : 'rgba(75, 85, 99, 0.3)',
      animation: 'animate-slow-pulse-glow',
      glowColor: isDark ? 'rgba(75, 85, 99, 0.6)' : 'rgba(75, 85, 99, 0.5)'
    };
  }
  
  // Check for completed states
  const completedItem = item.items.find(subItem => 
    subItem.toolId && toolStates[subItem.toolId]?.isCompleted
  );
  if (completedItem) {
    if (item.name === 'Studio') {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: ''
      };
    }
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(96, 165, 250, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(96, 165, 250, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(147, 197, 253, 0.4)' : 'rgba(96, 165, 250, 0.3)',
      animation: ''
    };
  }
  
  // Check for active states
  const activeToolItem = item.items.find(subItem => 
    subItem.toolId && toolStates[subItem.toolId]?.isActive
  );
  if (activeToolItem) {
    if (item.name === 'Studio') {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: ''
      };
    }
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(74, 222, 128, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(74, 222, 128, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(134, 239, 172, 0.4)' : 'rgba(74, 222, 128, 0.3)',
      animation: ''
    };
  }
  
  return null;
};

// Get button tint for NavItem
export const getNavItemButtonTint = (item, isActive, toolState, router, isDark) => {
  // Store button - matches Shop Now button (gold/amber tint)
  if (item.href === '/storecatalogue') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(201, 169, 97, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(201, 169, 97, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(201, 169, 97, 0.4)' : 'rgba(201, 169, 97, 0.5)'
    };
  }
  
  // Custom button always has green tint
  if (item.href === '/custom') {
    return {
      bgColor: isDark
        ? 'color-mix(in srgb, rgba(16, 185, 129, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(16, 185, 129, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(52, 211, 153, 0.5)' : 'rgba(16, 185, 129, 0.4)'
    };
  }
  
  // Check for service page tint first
  if (item.href && (item.href === '/software' || item.href === '/construction' || item.href === '/consulting')) {
    const serviceTint = getServicePageTint(router, isDark);
    if (serviceTint && isActive) {
      return serviceTint;
    }
  }
  
  if (!item.toolId || !toolState) return null;
  
  // If user is on this tool page, red tint takes priority
  if (isActive) {
    if (toolState.isProcessing) {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: 'animate-slow-pulse-glow',
        glowColor: isDark ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.5)'
      };
    } else {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: '',
        glowColor: null
      };
    }
  }
  
  // If not on this tool page, show processing/completion states
  if (toolState.isProcessing) {
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(75, 85, 99, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(75, 85, 99, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(107, 114, 128, 0.4)' : 'rgba(75, 85, 99, 0.3)',
      animation: 'animate-slow-pulse-glow',
      glowColor: isDark ? 'rgba(75, 85, 99, 0.6)' : 'rgba(75, 85, 99, 0.5)'
    };
  } else if (toolState.isCompleted) {
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(96, 165, 250, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(96, 165, 250, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(147, 197, 253, 0.4)' : 'rgba(96, 165, 250, 0.3)',
      animation: ''
    };
  } else if (toolState.isActive) {
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(74, 222, 128, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(74, 222, 128, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(134, 239, 172, 0.4)' : 'rgba(74, 222, 128, 0.3)',
      animation: ''
    };
  }
  
  return null;
};

// Get tool state tint for dropdown items
export const getToolStateTint = (subItem, toolStates, router, isDark) => {
  if (!subItem.toolId || !toolStates[subItem.toolId] || subItem.comingSoon) return null;
  
  const toolState = toolStates[subItem.toolId];
  const isActive = router.pathname === subItem.href;
  
  if (isActive) {
    if (toolState.isProcessing) {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: 'animate-pulse'
      };
    } else {
      return {
        bgColor: isDark 
          ? 'color-mix(in srgb, rgba(239, 68, 68, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(239, 68, 68, 0.25) 40%, rgba(220, 220, 220, 0.2))',
        borderColor: isDark ? 'rgba(248, 113, 113, 0.5)' : 'rgba(239, 68, 68, 0.4)',
        animation: ''
      };
    }
  }
  
  if (toolState.isProcessing) {
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(75, 85, 99, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(75, 85, 99, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(107, 114, 128, 0.4)' : 'rgba(75, 85, 99, 0.3)',
      animation: 'animate-pulse'
    };
  } else if (toolState.isCompleted) {
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(96, 165, 250, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(96, 165, 250, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(147, 197, 253, 0.4)' : 'rgba(96, 165, 250, 0.3)',
      animation: ''
    };
  } else if (toolState.isActive) {
    return {
      bgColor: isDark 
        ? 'color-mix(in srgb, rgba(74, 222, 128, 0.3) 40%, rgba(220, 220, 220, 0.2))'
        : 'color-mix(in srgb, rgba(74, 222, 128, 0.25) 40%, rgba(220, 220, 220, 0.2))',
      borderColor: isDark ? 'rgba(134, 239, 172, 0.4)' : 'rgba(74, 222, 128, 0.3)',
      animation: ''
    };
  }
  
  return null;
};

