import React from 'react';
import AboutPage from '../components/pages/AboutPage';
import SEOComponent from '../components/SEO';

export default function About() {
  // Structured Data for Gen AI and Search Engines
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Devello Inc",
    "description": "A company born from resilience and ambition, building innovative solutions that bridge physical and digital construction.",
    "url": "https://develloinc.com/about",
    "foundingDate": "2019",
    "founder": {
      "@type": "Person",
      "name": "Gurjeet Singh"
    }
  };

  return (
    <>
      <SEOComponent 
        title="About Devello Inc – Our Story, Vision & Founder"
        description="Learn about Devello Inc's journey from a ride-hailing platform to a hybrid construction and software development company. Founded by Gurjeet Singh in 2019, building innovative solutions that bridge physical and digital construction."
        keywords="about devello, devello inc, company history, gurjeet singh, devello construction, software development, digital solutions, construction company, innovation, founder"
        url="https://develloinc.com/about"
        structuredData={structuredData}
        breadcrumbs={[
          { name: "Home", url: "https://develloinc.com" },
          { name: "About", url: "https://develloinc.com/about" }
        ]}
      />
      
      <AboutPage />
    </>
  );
}

