/**
 * SEO Configuration and Domain Detection Utilities
 * Simple domain configuration for Devello Studios
 */

// Domain configuration mapping
export const DOMAIN_CONFIG = {
  'devellostudios.com': {
    type: 'studios',
    name: 'Devello Studios',
    baseUrl: 'https://devellostudios.com',
    brand: 'Devello Studios'
  },
  'www.devellostudios.com': {
    type: 'studios',
    name: 'Devello Studios',
    baseUrl: 'https://devellostudios.com',
    brand: 'Devello Studios'
  },
  'develloinc.com': {
    type: 'main',
    name: 'Devello Inc',
    baseUrl: 'https://develloinc.com',
    brand: 'Devello Inc'
  },
  'www.develloinc.com': {
    type: 'main',
    name: 'Devello Inc',
    baseUrl: 'https://develloinc.com',
    brand: 'Devello Inc'
  }
};

/**
 * Get domain configuration from hostname
 * @param {string} hostname - The hostname from request headers
 * @returns {object} Domain configuration object
 */
export function getDomainConfig(hostname) {
  if (!hostname) {
    return DOMAIN_CONFIG['devellostudios.com'];
  }
  
  // Remove port if present
  const domain = hostname.split(':')[0].toLowerCase();
  
  // Remove www. prefix for lookup
  const domainKey = domain.startsWith('www.') ? domain : domain;
  const wwwKey = domain.startsWith('www.') ? domain : `www.${domain}`;
  
  return DOMAIN_CONFIG[domainKey] || DOMAIN_CONFIG[wwwKey] || DOMAIN_CONFIG['devellostudios.com'];
}

/**
 * Build canonical URL for a page
 * @param {string} pathname - The pathname (e.g., '/lighting', '/software')
 * @param {string} hostname - The hostname from request headers
 * @returns {string} Full canonical URL
 */
export function getCanonicalUrl(pathname, hostname) {
  const config = getDomainConfig(hostname);
  const cleanPath = pathname === '/' ? '' : pathname.replace(/\/$/, '');
  return `${config.baseUrl}${cleanPath}`;
}
