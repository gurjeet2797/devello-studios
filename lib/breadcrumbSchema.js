/**
 * Breadcrumb Schema Generator
 * Creates BreadcrumbList structured data for better navigation signals
 */

/**
 * Generate breadcrumb schema for a page
 * @param {Array} items - Array of {name, url} objects representing breadcrumb trail
 * @returns {object} BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items) {
  if (!items || items.length === 0) {
    return null;
  }

  const breadcrumbList = items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbList
  };
}

/**
 * Generate breadcrumbs for common page types
 */
export function getBreadcrumbsForPage(pathname, baseUrl) {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  const parts = cleanPath.split('/').filter(Boolean);
  
  const breadcrumbs = [
    { name: "Home", url: baseUrl }
  ];

  if (parts.length === 0) {
    return breadcrumbs; // Homepage
  }

  // Build breadcrumb trail
  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath += `/${part}`;
    const name = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      name: name,
      url: `${baseUrl}${currentPath}`
    });
  });

  return breadcrumbs;
}
