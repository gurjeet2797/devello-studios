import Head from 'next/head';
import { getDomainConfig } from '../lib/seoConfig';

const SEO = ({
  title = "Devello Studios - AI-Powered Creative Tools",
  description = "Devello Studios offers professional AI-powered creative tools for photo editing and design. Transform your photos with AI-powered tools.",
  keywords = "devello studios, AI photo editor, image editing software, photo enhancement tools, AI creative tools, software applications",
  image = "https://static.wixstatic.com/media/c6bfe7_48783a21cdb74417ba16a1ce8ba7c618~mv2.jpg",
  url = "https://devellostudios.com",
  type = "website",
  siteName = null
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
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
    </Head>
  );
};

export default SEO;
