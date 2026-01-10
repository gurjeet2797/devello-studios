import React from 'react';
import { useRouter } from 'next/router';
import StudiosPage from '../components/pages/StudiosPage';
import SEOComponent from '../components/SEO';
import { getSubsidiarySchema } from '../lib/seoConfig';

export async function getServerSideProps(context) {
  const hostname = context.req.headers.host || '';
  const domain = hostname.split(':')[0]; // Remove port if present
  
  return {
    props: {
      hostname: domain
    }
  };
}

export default function Home({ hostname }) {
  const router = useRouter();

  const handleStartLighting = () => {
    router.push('/lighting');
  };

  const seoUrl = hostname ? `https://${hostname}` : 'https://devellostudios.com';
  const subsidiarySchema = getSubsidiarySchema("Devello Studios", seoUrl);
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Devello Studios",
    "description": "Collection of in-house tools and applications developed by Devello Inc. Including lighting studio, image editor, and AI-powered editing tools.",
    "url": seoUrl,
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web Browser",
    "creator": {
      "@type": "Organization",
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
            question: "Is Devello Studios part of Devello Inc?",
            answer: "Yes, Devello Studios is a subsidiary of Devello Inc, a hybrid construction and software development company. We combine expertise in both physical construction and digital technology solutions."
          }
        ]}
      />
      <StudiosPage onStart={handleStartLighting} />
    </>
  );
}
