/**
 * Dynamic robots.txt Generator
 * Generates domain-specific robots.txt files based on the requesting domain
 */

export default function handler(req, res) {
  const host = req.headers.host || 'devellostudios.com';
  const domain = host.replace('www.', '').split(':')[0].toLowerCase();
  const baseUrl = `https://${domain}`;
  
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap for this domain
Sitemap: ${baseUrl}/api/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Allow sitemap and robots (must come before Disallow: /api/)
Allow: /api/sitemap.xml
Allow: /api/robots.txt

# Disallow admin and API routes
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /private/

# Allow important pages
Allow: /
Allow: /studios
Allow: /lighting
Allow: /assisted-edit
Allow: /general-edit
Allow: /contact
Allow: /privacy
Allow: /terms
Allow: /blog
`;
  
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(robotsTxt);
}
