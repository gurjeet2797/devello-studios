import Head from 'next/head';
import { getDomainConfig } from '../lib/seoConfig';
import { generateBreadcrumbSchema } from '../lib/breadcrumbSchema';
import { generateFAQSchema } from '../lib/faqSchema';

const SEO = ({
  title = "Devello Inc",
  description = "Premium home improvement products and construction services. Shop windows, doors, lighting fixtures, bathroom vanities, custom millwork. Expert interior renovations and design solutions.",
  keywords = "home improvement products, windows and doors, lighting fixtures, bathroom vanities, construction services, interior renovations, custom millwork, designer lighting, bathroom fixtures, home renovation, glass and mirrors, construction products",
  image = "https://static.wixstatic.com/media/c6bfe7_48783a21cdb74417ba16a1ce8ba7c618~mv2.jpg",
  url = "https://develloinc.com",
  type = "website",
  structuredData = null,
  siteName = null, // Optional: override site name, otherwise auto-detected from URL
  breadcrumbs = null, // Optional: Array of {name, url} for breadcrumb schema
  faqs = null // Optional: Array of {question, answer} for FAQ schema
}) => {
  // Detect domain from URL to determine brand name
  const urlObj = typeof window !== 'undefined' 
    ? new URL(url) 
    : { hostname: url.replace(/https?:\/\//, '').split('/')[0] };
  const hostname = urlObj.hostname || url.replace(/https?:\/\//, '').split('/')[0];
  const domainConfig = getDomainConfig(hostname);
  const brandName = siteName || domainConfig.brand;
  
  // Smart title formatting: avoid duplicate brand names
  let fullTitle;
  if (title.includes(brandName) || title.includes('Devello')) {
    fullTitle = title; // Already has brand
  } else {
    fullTitle = `${title} | ${brandName}`;
  }
  
  return (
    <Head>
      {/* Viewport Meta Tag */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={brandName} />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      <meta property="twitter:image:alt" content={fullTitle} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content={brandName} />
      <meta name="publisher" content={brandName} />
      <meta name="copyright" content={brandName} />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="General" />
      <meta name="distribution" content="Global" />
      <meta name="target" content="all" />
      
      {/* Gen AI Visibility Meta Tags */}
      <meta name="ai-content" content="AI-powered software development and custom solutions" />
      <meta name="ai-category" content="Software Development, Technology, AI Solutions" />
      <meta name="ai-use-case" content="Custom software development, AI integration, web applications" />
      
      {/* Canonical URL - Dynamic per page */}
      <link rel="canonical" href={url} />
      
      {/* Structured Data */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((schema, index) => (
            <script
              key={index}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          ))
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbs && (() => {
        const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
        if (!breadcrumbSchema) return null;
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
          />
        );
      })()}
      
      {/* FAQ Schema */}
      {faqs && (() => {
        const faqSchema = generateFAQSchema(faqs);
        if (!faqSchema) return null;
        return (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        );
      })()}
    </Head>
  );
};

export default SEO;
