/**
 * SEO Configuration and Domain Detection Utilities
 * Handles multi-domain SEO setup for Devello Inc and subsidiaries
 */

// Domain configuration mapping
export const DOMAIN_CONFIG = {
  'develloinc.com': {
    type: 'main',
    name: 'Devello Inc',
    baseUrl: 'https://develloinc.com',
    brand: 'Devello Inc',
    isParent: true
  },
  'www.develloinc.com': {
    type: 'main',
    name: 'Devello Inc',
    baseUrl: 'https://develloinc.com',
    brand: 'Devello Inc',
    isParent: true
  },
  'devellostudios.com': {
    type: 'studios',
    name: 'Devello Studios',
    baseUrl: 'https://devellostudios.com',
    brand: 'Devello Studios',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'www.devellostudios.com': {
    type: 'studios',
    name: 'Devello Studios',
    baseUrl: 'https://devellostudios.com',
    brand: 'Devello Studios',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'devellotech.com': {
    type: 'tech',
    name: 'Devello Tech',
    baseUrl: 'https://devellotech.com',
    brand: 'Devello Tech',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'www.devellotech.com': {
    type: 'tech',
    name: 'Devello Tech',
    baseUrl: 'https://devellotech.com',
    brand: 'Devello Tech',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'develloconstruction.com': {
    type: 'construction',
    name: 'Devello Construction',
    baseUrl: 'https://develloconstruction.com',
    brand: 'Devello Construction',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'www.develloconstruction.com': {
    type: 'construction',
    name: 'Devello Construction',
    baseUrl: 'https://develloconstruction.com',
    brand: 'Devello Construction',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'devello.shop': {
    type: 'shop',
    name: 'Devello Shop',
    baseUrl: 'https://devello.shop',
    brand: 'Devello Shop',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'www.devello.shop': {
    type: 'shop',
    name: 'Devello Shop',
    baseUrl: 'https://devello.shop',
    brand: 'Devello Shop',
    isParent: false,
    parentUrl: 'https://develloinc.com'
  },
  'devello.us': {
    type: 'redirect',
    name: 'Devello Inc',
    baseUrl: 'https://develloinc.com',
    brand: 'Devello Inc',
    isParent: true,
    redirectsTo: 'https://develloinc.com'
  }
};

/**
 * Get domain configuration from hostname
 * @param {string} hostname - The hostname from request headers
 * @returns {object} Domain configuration object
 */
export function getDomainConfig(hostname) {
  if (!hostname) {
    return DOMAIN_CONFIG['develloinc.com'];
  }
  
  // Remove port if present
  const domain = hostname.split(':')[0].toLowerCase();
  
  // Remove www. prefix for lookup
  const domainKey = domain.startsWith('www.') ? domain : domain;
  const wwwKey = domain.startsWith('www.') ? domain : `www.${domain}`;
  
  return DOMAIN_CONFIG[domainKey] || DOMAIN_CONFIG[wwwKey] || DOMAIN_CONFIG['develloinc.com'];
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

/**
 * Get parent organization schema reference
 * @returns {object} Parent organization schema reference
 */
export function getParentOrganizationSchema() {
  return {
    "@type": "Corporation",
    "@id": "https://develloinc.com/#org",
    "name": "Devello Inc",
    "url": "https://develloinc.com"
  };
}

/**
 * Devello Inc parent corporation schema
 * Should be included on develloinc.com pages
 */
export const DEVELLO_INC_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Corporation",
  "@id": "https://develloinc.com/#org",
  "name": "Devello Inc",
  "url": "https://develloinc.com",
  "logo": "https://develloinc.com/logo.png",
  "description": "Premium home improvement products and construction services. Shop windows, doors, lighting fixtures, bathroom vanities, custom millwork and more.",
  "foundingDate": "2019",
  "founder": {
    "@type": "Person",
    "name": "Gurjeet Singh"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "New York, NY",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "url": "https://develloinc.com/contact"
  },
  "sameAs": [
    "https://www.linkedin.com/company/devello",
    "https://www.instagram.com/devello"
  ],
  "subOrganization": [
    {
      "@type": "Organization",
      "name": "Devello Construction",
      "url": "https://develloconstruction.com"
    },
    {
      "@type": "Organization",
      "name": "Devello Tech",
      "url": "https://devellotech.com"
    },
    {
      "@type": "Organization",
      "name": "Devello Studios",
      "url": "https://devellostudios.com"
    },
    {
      "@type": "Organization",
      "name": "Devello Shop",
      "url": "https://devello.shop"
    }
  ]
};

/**
 * Generate subsidiary organization schema
 * @param {string} name - Organization name (e.g., "Devello Studios")
 * @param {string} url - Organization URL
 * @returns {object} Subsidiary schema with parentOrganization reference
 */
export function getSubsidiarySchema(name, url) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": name,
    "url": url,
    "parentOrganization": getParentOrganizationSchema()
  };
}
