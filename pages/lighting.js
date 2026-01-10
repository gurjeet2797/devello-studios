import React from 'react';
import SEOComponent from '../components/SEO';
import LightingStudio from '../components/pages/DevelloStudio';
import { getSubsidiarySchema } from '../lib/seoConfig';

export default function LightingPage() {

  // Get current domain for SEO
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_STUDIOS_DOMAIN || 'https://devellostudios.com';
  };
  
  const currentDomain = getCurrentDomain();
  const isStudiosDomain = currentDomain.includes('devellostudios.com');
  const seoUrl = isStudiosDomain ? currentDomain : 'https://devellostudios.com';
  const pageUrl = `${seoUrl}/lighting`;

  // Subsidiary schema for Studios domain
  const schemas = [];
  if (isStudiosDomain) {
    schemas.push(getSubsidiarySchema("Devello Studios", seoUrl));
  }
  
  // SoftwareApplication schema for lighting tool
  schemas.push({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Devello Studios Lighting Tool",
    "description": "Professional AI-powered lighting studio tool by Devello Studios. Add studio-quality lighting to your photos with advanced AI enhancement technology.",
    "url": pageUrl,
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "creator": {
      "@type": "Corporation",
      "@id": "https://develloinc.com/#org",
      "name": "Devello Inc",
      "url": "https://develloinc.com"
    },
    "featureList": [
      "AI-Powered Lighting",
      "Studio Quality Enhancement",
      "Professional Photo Processing",
      "Real-time Preview"
    ]
  });

  return (
    <>
      <SEOComponent 
        title="Devello Studios Lighting Tool – AI-Powered Photo Lighting"
        description="Add studio-quality lighting to your photos with Devello Studios' AI-powered lighting tool. Professional photo enhancement for real estate and design professionals. Part of Devello Inc."
        keywords="devello lighting, devello studios lighting, ai photo lighting, professional lighting tool, photo enhancement, devello ai tools, studio lighting, photo editing"
        url={pageUrl}
        structuredData={schemas}
        breadcrumbs={[
          { name: "Home", url: seoUrl },
          { name: "Devello Studios", url: seoUrl },
          { name: "Lighting Tool", url: pageUrl }
        ]}
      />
      
      <LightingStudio 
        onShowPaymentModal={() => {}}
        onShowBillingModal={() => {}}
        onShowAuthModal={() => {}}
        onDirectPayment={() => {}}
        userData={null}
      />
    </>
  );
}

