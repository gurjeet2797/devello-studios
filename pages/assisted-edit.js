import React from 'react';
import SEOComponent from '../components/SEO';
import AssistedEditStudio from '../components/assisted-edit/AssistedEditStudio';

export default function AssistedEdit() {
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_STUDIOS_DOMAIN || 'https://devellostudios.com';
  };
  
  const seoUrl = getCurrentDomain();
  const pageUrl = `${seoUrl}/assisted-edit`;

  return (
    <>
      <SEOComponent 
        title="Assisted Edit – AI-Powered Image Editing"
        description="AI-powered image editing with intelligent reference image suggestions. Professional photo editing tools by Devello Studios."
        keywords="assisted edit, AI image editing, photo editor, devello studios, AI photo tools"
        url={pageUrl}
      />
      
      <AssistedEditStudio 
        onShowAuthModal={() => {}}
        onShowPaymentModal={() => {}}
        onDirectPayment={() => {}}
      />
    </>
  );
}
