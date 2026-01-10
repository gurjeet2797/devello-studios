// Shared button styles for Reset and Home buttons
// These buttons use black glass background with white text for consistent visibility across themes
// IMPORTANT: These styles force black glass and white text regardless of theme
// Use detectContrast={false} on Button component to prevent automatic color detection

export const RESET_HOME_BUTTON_STYLE = {
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(4px) saturate(150%)',
  WebkitBackdropFilter: 'blur(4px) saturate(150%)',
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  fontWeight: '500',
  minHeight: '28px',
  minWidth: '60px'
};

export const RESET_HOME_BUTTON_CLASS = 'px-2 py-1 text-xs font-medium transition-all duration-200 text-white';

