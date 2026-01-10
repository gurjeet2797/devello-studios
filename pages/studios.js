import React from 'react';
import { useRouter } from 'next/router';
import StudiosPage from '../components/pages/StudiosPage';
import SEOComponent from '../components/SEO';
import { getSubsidiarySchema } from '../lib/seoConfig';

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
  
  const currentDomain = getCurrentDomain();
  const isStudiosDomain = currentDomain.includes('devellostudios.com');
  const seoUrl = isStudiosDomain ? currentDomain : 'https://devellostudios.com';

  // Subsidiary organization schema
  const subsidiarySchema = getSubsidiarySchema("Devello Studios", seoUrl);
  
  // SoftwareApplication schema
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Devello Studios",
    "description": "Collection of in-house tools and applications developed by Devello Inc. Including lighting studio, image editor, and AI-powered editing tools.",
    "url": seoUrl,
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "creator": {
      "@type": "Corporation",
      "@id": "https://develloinc.com/#org",
      "name": "Devello Inc",
      "url": "https://develloinc.com"
    },
    "featureList": [
      "Lighting Studio",
      "Image Editor",
      "AI-Powered Editing",
      "Assisted Edit Tools",
      "Professional Photo Processing"
    ]
  };

  return (
    <>
      <SEOComponent 
        title="Devello Studios – AI-Powered Creative Tools & Photo Editing"
        description="Devello Studios offers professional AI-powered creative tools including lighting studio, image editor, and assisted editing. Part of Devello Inc, transforming property photos and design workflows."
        keywords="devello studios, devello ai tools, image editing tools, lighting studio, photo editor, AI editing tools, design tools, photo processing, image processing software, devello photo editor"
        url={seoUrl}
        structuredData={[subsidiarySchema, softwareAppSchema]}
        breadcrumbs={[
          { name: "Home", url: seoUrl },
          { name: "Devello Studios", url: seoUrl }
        ]}
        faqs={[
          {
            question: "What is Devello Studios?",
            answer: "Devello Studios is a collection of AI-powered creative tools developed by Devello Inc. It includes professional lighting studio, image editor, and assisted editing tools designed for real estate and design professionals."
          },
          {
            question: "What tools are available in Devello Studios?",
            answer: "Devello Studios offers three main tools: Professional Lighting Studio for adding studio-quality lighting to photos, General Image Editor for comprehensive photo editing, and Assisted Edit for AI-powered editing assistance."
          },
          {
            question: "Is Devello Studios free to use?",
            answer: "Devello Studios offers both free and premium plans. Free users have access to basic features with usage limits, while premium subscribers get unlimited access to all AI-powered editing tools and features."
          }
        ]}
      />
      
      <StudiosPage onStart={handleStartLighting} />
    </>
  );
}

