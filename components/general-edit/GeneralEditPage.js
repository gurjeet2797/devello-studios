import React from 'react';
import SEOComponent from '../components/SEO';
import GeneralEditStudio from './GeneralEditStudio';

export default function GeneralEditPage() {
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_STUDIOS_DOMAIN || 'https://devellostudios.com';
  };
  
  const seoUrl = getCurrentDomain();
  const pageUrl = `${seoUrl}/general-edit`;

  return (
    <>
      <SEOComponent 
        title="General Edit – AI-Powered Image Editor"
        description="Apply custom edits and enhancements to your images with AI-powered tools. Professional photo editing by Devello Studios."
        keywords="general edit, image editor, photo editor, AI photo editing, devello studios, image processing"
        url={pageUrl}
      />
      
      <GeneralEditStudio 
        onShowAuthModal={() => {}}
        onShowPaymentModal={() => {}}
        onShowBillingModal={() => {}}
        onDirectPayment={() => {}}
      />
    </>
  );
}
