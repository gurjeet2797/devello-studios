import React from 'react';
import AboutPage from '../components/pages/AboutPage';
import SEOComponent from '../components/SEO';

export default function About() {
  return (
    <>
      <SEOComponent 
        title="About Devello Studios – AI-Powered Creative Tools"
        description="Learn about Devello Studios, a collection of AI-powered creative tools for photo editing and design. Professional tools for designers and photographers."
        keywords="about devello studios, devello studios, AI tools, photo editing software, design tools"
        url="https://devellostudios.com/about"
      />
      
      <AboutPage />
    </>
  );
}

