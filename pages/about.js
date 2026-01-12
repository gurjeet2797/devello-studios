import React from 'react';
import AboutPage from '../components/pages/AboutPage';
import SEOComponent from '../components/SEO';

export default function About() {
  return (
    <>
      <SEOComponent 
        title="About Devello Inc – Software Development Company"
        description="Learn about Devello Inc, a software development firm specializing in custom software solutions, web applications, AI integration, and digital platform development."
        keywords="about devello inc, software development company, custom software, web development, app development, digital solutions, software consulting"
        url="https://develloinc.com/about"
      />
      
      <AboutPage />
    </>
  );
}

