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
