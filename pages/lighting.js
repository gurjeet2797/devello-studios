import React from 'react';
import SEOComponent from '../components/SEO';
import LightingStudio from '../components/pages/DevelloStudio';

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

  return (
    <>
      <SEOComponent 
        title="Devello Studios Lighting Tool – AI-Powered Photo Lighting"
        description="Add studio-quality lighting to your photos with Devello Studios' AI-powered lighting tool. Professional photo enhancement for real estate and design professionals."
        keywords="devello lighting, devello studios lighting, ai photo lighting, professional lighting tool, photo enhancement, devello ai tools, studio lighting, photo editing"
        url={pageUrl}
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

