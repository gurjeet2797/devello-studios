import React from 'react';
import { useRouter } from 'next/router';
import StudiosPage from '../components/pages/StudiosPage';
import SEOComponent from '../components/SEO';

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
  const isMainDomain = hostname === 'develloinc.com' || hostname === 'www.develloinc.com';
  
  // Domain-specific SEO
  const seoProps = isMainDomain ? {
    title: "Devello Inc – Custom Software Development & Digital Solutions",
    description: "Devello Inc is a software development firm specializing in custom software solutions, web applications, AI integration, and digital platform development. Professional software development services.",
    keywords: "software development, custom software, web development, app development, digital solutions, software consulting, software development company, custom software solutions, web applications, AI integration",
    url: seoUrl
  } : {
    title: "Devello Studios – AI-Powered Creative Tools & Photo Editing",
    description: "Devello Studios offers professional AI-powered creative tools including lighting studio, image editor, and assisted editing. Transform your photos with AI-powered design tools.",
    keywords: "devello studios, devello ai tools, image editing tools, lighting studio, photo editor, AI editing tools, design tools, photo processing, image processing software, devello photo editor",
    url: seoUrl
  };

  return (
    <>
      <SEOComponent {...seoProps} />
      <StudiosPage onStart={handleStartLighting} />
    </>
  );
}
