import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SEOComponent from '../components/SEO';
import ProductCheckout from '../components/store/ProductCheckout';
import { useCart } from '../components/store/CartContext';
import { getSupabase } from '../lib/supabaseClient';

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems } = useCart();
  const [clientSecret, setClientSecret] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Get clientSecret from URL query if present
    if (router.query.clientSecret) {
      setClientSecret(router.query.clientSecret);
    }

    // Check if we have items to checkout
    const checkCartOrProduct = () => {
      // Check for guest checkout product in sessionStorage
      if (typeof window !== 'undefined') {
        const guestProduct = sessionStorage.getItem('guest_checkout_product');
        if (guestProduct) {
          setIsReady(true);
          return;
        }
      }

      // Check for cart items
      if (cartItems.length > 0) {
        setIsReady(true);
        return;
      }

      // Check for clientSecret (direct checkout)
      if (router.query.clientSecret) {
        setIsReady(true);
        return;
      }

      // No items to checkout - redirect to store
      // Add small delay to ensure cart is loaded
      setTimeout(() => {
        const guestProduct = typeof window !== 'undefined' 
          ? sessionStorage.getItem('guest_checkout_product') 
          : null;
        
        if (!guestProduct && cartItems.length === 0 && !router.query.clientSecret) {
          router.push('/');
        } else {
          setIsReady(true);
        }
      }, 500);
    };

    checkCartOrProduct();
  }, [router.query, cartItems, router]);

  // Don't render until ready
  if (!isReady) {
    return null;
  }

  return (
    <>
      <SEOComponent 
        title="Checkout - Devello"
        description="Complete your purchase securely"
        url="https://develloinc.com/checkout"
      />
      
      <ProductCheckout clientSecret={clientSecret} />
    </>
  );
}
