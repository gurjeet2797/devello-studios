import React from 'react';

// Modern SVG icon components
export const getIconComponent = (iconName, className = "w-4 h-4") => {
  const iconProps = { className, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  
  switch (iconName) {
    case 'edit':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case 'ai':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case 'lighting':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    case 'consultation':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M12 12h.01" />
          <path d="M12 15h.01" />
          <path d="M12 18h.01" />
        </svg>
      );
    case 'store':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case 'custom':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'bespoke':
    case 'millwork':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M3 21h18" />
          <path d="M3 18h18" />
          <path d="M3 15h2M7 15h2M11 15h2M15 15h2M19 15h2" strokeWidth="1.5" />
          <path d="M3 12h1M6 12h2M10 12h2M14 12h2M18 12h1M21 12h2" strokeWidth="1.5" />
          <path d="M3 9h2M7 9h2M11 9h2M15 9h2M19 9h2" strokeWidth="1.5" />
          <path d="M3 6h1M6 6h2M10 6h2M14 6h2M18 6h1M21 6h2" strokeWidth="1.5" />
        </svg>
      );
    case 'apps':
    case 'studio':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <rect x="8" y="4" width="2" height="3" rx="0.5" />
          <rect x="14" y="4" width="2" height="3" rx="0.5" />
          <path d="M9 12h6M12 9v6" strokeWidth="1" opacity="0.5" />
        </svg>
      );
    case 'blog':
      return (
        <svg {...iconProps} viewBox="0 0 24 24">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8M8 11h8M8 15h4" />
        </svg>
      );
    default:
      return null;
  }
};

export default getIconComponent;

