import React from 'react';
import { useRouter } from 'next/router';
import StudiosPage from '../components/pages/StudiosPage';
import SEOComponent from '../components/SEO';

export default function Studios() {
  const router = useRouter();

  const handleStartLighting = () => {
    router.push('/lighting');
  };

  // Get current domain for SEO
  const getCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_STUDIOS_DOMAIN || 'https://devellostudios.com';
  };
  
  const seoUrl = getCurrentDomain();

  return (
    <>
      <SEOComponent 
        title="Devello Studios – AI-Powered Creative Tools & Photo Editing"
        description="Devello Studios offers professional AI-powered creative tools including lighting studio, image editor, and assisted editing. Transform your photos with AI-powered design tools."
        keywords="devello studios, devello ai tools, image editing tools, lighting studio, photo editor, AI editing tools, design tools, photo processing, image processing software, devello photo editor"
        url={seoUrl}
      />
      
      <StudiosPage onStart={handleStartLighting} />
    </>
  );
}

