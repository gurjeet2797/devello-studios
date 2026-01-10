/**
 * Dynamic Sitemap Generator
 * Generates domain-specific XML sitemaps based on the requesting domain
 */

// Studios-only pages
const STUDIOS_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/studios', priority: '0.95', changefreq: 'weekly' },
  { url: '/lighting', priority: '0.9', changefreq: 'weekly' },
  { url: '/assisted-edit', priority: '0.9', changefreq: 'weekly' },
  { url: '/general-edit', priority: '0.9', changefreq: 'weekly' },
  { url: '/about', priority: '0.8', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.4', changefreq: 'yearly' },
  { url: '/terms', priority: '0.4', changefreq: 'yearly' },
  { url: '/blog', priority: '0.7', changefreq: 'weekly' },
];

function generateSitemap(domain, pages) {
  const baseUrl = `https://${domain}`;
  const lastmod = new Date().toISOString().split('T')[0];
  
  const urlEntries = pages.map(page => {
    const fullUrl = `${baseUrl}${page.url}`;
    return `  <url>
    <loc>${fullUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export default function handler(req, res) {
  const host = req.headers.host || 'devellostudios.com';
  const domain = host.replace('www.', '').split(':')[0].toLowerCase();
  
  // Use Studios pages
  const pages = STUDIOS_PAGES;
  
  const sitemap = generateSitemap(domain, pages);
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(sitemap);
}
