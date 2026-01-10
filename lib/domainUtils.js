/**
 * Domain utility functions for multi-domain deployment
 */

/**
 * Get the base URL for studios domain
 */
export const getStudiosDomain = () => {
  if (typeof window !== 'undefined') {
    return 'https://devellostudios.com';
  }
  return process.env.NEXT_PUBLIC_STUDIOS_DOMAIN || 'https://devellostudios.com';
};

/**
 * Get the base URL for tech domain
 */
export const getTechDomain = () => {
  if (typeof window !== 'undefined') {
    return 'https://devellotech.com';
  }
  return process.env.NEXT_PUBLIC_TECH_DOMAIN || 'https://devellotech.com';
};

/**
 * Get the base URL for main domain
 */
export const getMainDomain = () => {
  if (typeof window !== 'undefined') {
    return 'https://develloinc.com';
  }
  return process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'https://develloinc.com';
};

/**
 * Check if we're on the studios domain
 */
export const isStudiosDomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'devellostudios.com' || 
         window.location.hostname === 'www.devellostudios.com';
};

/**
 * Check if we're on the tech domain
 */
export const isTechDomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'devellotech.com' || 
         window.location.hostname === 'www.devellotech.com';
};

/**
 * Check if we're on the main domain
 */
export const isMainDomain = () => {
  if (typeof window === 'undefined') return true; // Default to main on server
  const hostname = window.location.hostname;
  return hostname === 'develloinc.com' || 
         hostname === 'www.develloinc.com' ||
         (!isStudiosDomain() && !isTechDomain());
};

/**
 * Get studios URL (external if on main domain, internal if on studios domain)
 */
export const getStudiosUrl = (path = '') => {
  if (isStudiosDomain()) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const baseUrl = getStudiosDomain();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Get tech/software URL (external if on main domain, internal if on tech domain)
 */
export const getTechUrl = (path = '') => {
  if (isTechDomain()) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const baseUrl = getTechDomain();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

