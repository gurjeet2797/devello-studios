import React from 'react';
import Head from 'next/head';
import GeneralEditStudio from './GeneralEditStudio';

export default function GeneralEditPage() {

  
  
  return (
    <>
      <Head>
        <title>General Edit - Devello Inc</title>
        <meta name="description" content="Apply custom edits and enhancements to your images with AI-powered tools." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <GeneralEditStudio 
        onShowAuthModal={() => {}}
        onShowPaymentModal={() => {}}
        onShowBillingModal={() => {}}
        onDirectPayment={() => {}}
      />

    </>
  );
}
