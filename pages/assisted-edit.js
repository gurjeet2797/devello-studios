import React from 'react';
import Head from 'next/head';
import AssistedEditStudio from '../components/assisted-edit/AssistedEditStudio';

export default function AssistedEdit() {

  
  
  return (
    <>
      <Head>
        <title>Assisted Edit - Devello Inc</title>
        <meta name="description" content="AI-powered image editing with intelligent reference image suggestions." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <AssistedEditStudio 
        onShowAuthModal={() => {}}
        onShowPaymentModal={() => {}}
        onDirectPayment={() => {}}
      />

    </>
  );
}
