"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Loader2, 
  Lock, 
  MapPin, 
  Check, 
  Phone,
  MessageCircle,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../Layout';
import { useCart } from './CartContext';
import { getSupabase } from '../../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
const DEVELLO_PHONE = '929-266-2966';

// Apple Logo SVG Component
const AppleLogo = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

export default function ProductCheckout({ clientSecret: propClientSecret }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const { cartItems, getCartTotal, clearCart } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [stripe, setStripe] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(propClientSecret);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardZip, setCardZip] = useState('');
  const [cardErrors, setCardErrors] = useState({});
  
  // Billing address
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
  });
  const [billingErrors, setBillingErrors] = useState({});
  
  // Contact info
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactError, setContactError] = useState(null);
  
  // Shipping address
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [shippingAddress, setShippingAddress] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
  });
  const [saveAsPrimary, setSaveAsPrimary] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});
  
  // Pay Later form
  const [payLaterMessage, setPayLaterMessage] = useState('');
  const [payLaterSubmitted, setPayLaterSubmitted] = useState(false);
  
  // Buy now product (single product checkout)
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  
  // Scroll detection for floating order summary
  const [showFloatingSummary, setShowFloatingSummary] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.access_token);
        if (session?.user?.email) {
          setContactEmail(session.user.email);
        }
      }
    };
    checkAuth();
  }, []);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        setStripe(stripeInstance);
      } catch (error) {
        console.error('Stripe init error:', error);
        setPaymentError('Failed to initialize payment system');
      }
    };

    initStripe();
  }, []);

  // Fetch saved addresses for auth users
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAddresses = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch('/api/users/addresses', {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
        });

        const data = await response.json();
        if (data.success && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const primary = data.addresses.find(addr => addr.is_primary);
          if (primary) {
            setSelectedAddressId(primary.id);
            setUseNewAddress(false);
            setShippingAddress({
              address_line1: primary.address_line1,
              address_line2: primary.address_line2 || '',
              city: primary.city,
              state: primary.state,
              zip_code: primary.zip_code,
              country: primary.country || 'US',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    fetchAddresses();
  }, [isAuthenticated]);

  // Load buy now product from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const guestProduct = sessionStorage.getItem('guest_checkout_product');
    if (guestProduct) {
      try {
        const product = JSON.parse(guestProduct);
        setBuyNowProduct(product);
      } catch (e) {
        console.error('Error parsing guest product:', e);
      }
    }
  }, []);

  // Get client secret from URL
  useEffect(() => {
    if (typeof window !== 'undefined' && !clientSecret) {
      const params = new URLSearchParams(window.location.search);
      const urlClientSecret = params.get('clientSecret');
      if (urlClientSecret) {
        setClientSecret(urlClientSecret);
      }
    }
  }, []);

  // Scroll detection for floating order summary
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Show floating summary after scrolling down 200px
      if (currentScrollY > 200) {
        setShowFloatingSummary(true);
      } else {
        setShowFloatingSummary(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const formatPrice = (cents) => `$${(cents / 100).toFixed(2)}`;

  const validateContact = () => {
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setContactError('Valid email is required');
      return false;
    }
    setContactError(null);
    return true;
  };

  // Check if products require NYC area shipping
  const requiresNYCShipping = () => {
    // Check cart items
    const cartHasRestrictedProducts = cartItems.some(item => {
      const category = item.product?.metadata?.category;
      if (typeof category === 'string') {
        return category === 'doors' || category === 'windows' || category === 'glass';
      }
      // Fallback: check product name/slug
      const productName = (item.productName || '').toLowerCase();
      const productSlug = (item.productSlug || '').toLowerCase();
      return productName.includes('door') || productName.includes('window') || productName.includes('glass') ||
             productSlug.includes('door') || productSlug.includes('window') || productSlug.includes('glass');
    });
    
    // Check buy now product
    if (buyNowProduct) {
      const productName = (buyNowProduct.productName || '').toLowerCase();
      const productSlug = (buyNowProduct.productSlug || '').toLowerCase();
      if (productName.includes('door') || productName.includes('window') || productName.includes('glass') ||
          productSlug.includes('door') || productSlug.includes('window') || productSlug.includes('glass')) {
        return true;
      }
    }
    
    return cartHasRestrictedProducts;
  };

  // Validate NYC and surrounding areas
  const isValidNYCArea = (city, state, zip) => {
    const cityLower = (city || '').toLowerCase().trim();
    const stateUpper = (state || '').toUpperCase().trim();
    const zipCode = zip ? zip.substring(0, 5) : '';
    
    // Five boroughs of NYC
    const nycBoroughs = ['manhattan', 'new york', 'brooklyn', 'queens', 'bronx', 'staten island'];
    if (stateUpper === 'NY' && nycBoroughs.some(borough => cityLower.includes(borough))) {
      return true;
    }
    
    // Long Island (Nassau and Suffolk counties)
    const longIslandCities = ['nassau', 'suffolk', 'hempstead', 'islip', 'oyster bay', 'huntington', 'babylon', 'smithtown', 'brookhaven', 'riverhead', 'southampton', 'east hampton'];
    if (stateUpper === 'NY' && longIslandCities.some(cityName => cityLower.includes(cityName))) {
      return true;
    }
    
    // Westchester County (Yonkers, White Plains, etc.)
    const westchesterCities = ['yonkers', 'white plains', 'new rochelle', 'mount vernon', 'peekskill', 'port chester', 'rye', 'scarsdale', 'tarrytown', 'dobbs ferry', 'hastings', 'irvington'];
    if (stateUpper === 'NY' && westchesterCities.some(cityName => cityLower.includes(cityName))) {
      return true;
    }
    
    // Jersey City, NJ
    if (stateUpper === 'NJ' && cityLower.includes('jersey city')) {
      return true;
    }
    
    // Check specific ZIP codes that start with 0 (as strings)
    const specificZips = ['07030']; // Jersey City
    if (specificZips.includes(zipCode)) {
      return true;
    }
    
    // ZIP code ranges for NYC area
    const nycZipRanges = [
      { start: 10001, end: 10299 }, // Manhattan
      { start: 10301, end: 10399 }, // Staten Island
      { start: 10401, end: 10499 }, // Bronx
      { start: 11001, end: 11199 }, // Queens (some)
      { start: 11201, end: 11299 }, // Brooklyn
      { start: 11301, end: 11699 }, // Queens
      { start: 7030, end: 7030 }, // Jersey City (07030) - parsed as number
      { start: 10501, end: 10899 }, // Westchester
      { start: 11501, end: 11999 }, // Long Island (Nassau/Suffolk)
    ];
    
    const zipNum = parseInt(zipCode);
    if (!isNaN(zipNum)) {
      for (const range of nycZipRanges) {
        if (zipNum >= range.start && zipNum <= range.end) {
          return true;
        }
      }
    }
    
    return false;
  };

  const validateShippingAddress = () => {
    const errors = {};
    if (!shippingAddress.address_line1) errors.address_line1 = 'Address is required';
    if (!shippingAddress.city) errors.city = 'City is required';
    if (!shippingAddress.state) errors.state = 'State is required';
    if (!shippingAddress.zip_code || !/^\d{5}(-\d{4})?$/.test(shippingAddress.zip_code)) {
      errors.zip_code = 'Valid ZIP code is required';
    }
    
    // Check NYC area shipping for doors, windows, and glass
    if (requiresNYCShipping() && Object.keys(errors).length === 0) {
      if (!isValidNYCArea(shippingAddress.city, shippingAddress.state, shippingAddress.zip_code)) {
        errors.shipping_area = 'We currently only ship doors, windows, and glass products to NYC and surrounding areas (five boroughs, Long Island, Westchester, Jersey City). Please contact us for shipping to other locations.';
      }
    }
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCardFields = () => {
    const errors = {};
    // Remove spaces and dashes from card number
    const cleanCardNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    if (!cleanCardNumber || cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      errors.cardNumber = 'Valid card number is required';
    }
    
    // Validate expiry (MM/YY or MM/YYYY)
    const expiryMatch = cardExpiry.match(/^(\d{2})\/(\d{2,4})$/);
    if (!expiryMatch) {
      errors.cardExpiry = 'Valid expiration date (MM/YY) is required';
    } else {
      const month = parseInt(expiryMatch[1]);
      const year = parseInt(expiryMatch[2]);
      const fullYear = year < 100 ? 2000 + year : year;
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      if (month < 1 || month > 12) {
        errors.cardExpiry = 'Invalid month';
      } else if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
        errors.cardExpiry = 'Card has expired';
      }
    }
    
    if (!cardCVC || cardCVC.length < 3 || cardCVC.length > 4) {
      errors.cardCVC = 'Valid CVC is required';
    }
    
    if (!cardZip || !/^\d{5}(-\d{4})?$/.test(cardZip)) {
      errors.cardZip = 'Valid ZIP code is required';
    }
    
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBillingAddress = () => {
    if (billingSameAsShipping) return true;
    
    const errors = {};
    if (!billingAddress.address_line1) errors.address_line1 = 'Address is required';
    if (!billingAddress.city) errors.city = 'City is required';
    if (!billingAddress.state) errors.state = 'State is required';
    if (!billingAddress.zip_code || !/^\d{5}(-\d{4})?$/.test(billingAddress.zip_code)) {
      errors.zip_code = 'Valid ZIP code is required';
    }
    
    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Pay Later submission
  const handlePayLater = async () => {
    if (!validateContact() || !validateShippingAddress()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase?.auth?.getSession() || {};

      const response = await fetch('/api/products/pay-later', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          productId: buyNowProduct?.productId || null,
          productName: buyNowProduct?.productName || 'Cart Order',
          productSlug: buyNowProduct?.productSlug,
          variantName: buyNowProduct?.variantName,
          quantity: buyNowProduct?.quantity || cartItems.reduce((sum, i) => sum + i.quantity, 0),
          dimensions: buyNowProduct?.height && buyNowProduct?.width 
            ? `${buyNowProduct.height}x${buyNowProduct.width}` 
            : null,
          message: payLaterMessage,
          email: contactEmail,
          phone: contactPhone,
          fullName: contactName,
          shippingAddress,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit');

      setPayLaterSubmitted(true);
    } catch (error) {
      console.error('Pay later error:', error);
      setPaymentError(error.message || 'Failed to submit request');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle card payment
  const handleCardPayment = async (e) => {
    e.preventDefault();
    
    if (!stripe) {
      setPaymentError('Payment system not ready');
      return;
    }
    if (!validateContact() || !validateShippingAddress() || !validateCardFields() || !validateBillingAddress()) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase?.auth?.getSession() || {};

      // Save address if user wants to
      if (saveAsPrimary && session?.access_token) {
        try {
          await fetch('/api/users/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              ...shippingAddress,
              is_primary: true,
            }),
          });
        } catch (e) {
          console.error('Error saving address:', e);
        }
      }

      let paymentClientSecret = clientSecret;

      // Create payment intent if we don't have one
      if (!paymentClientSecret) {
        if (!session?.access_token && cartItems.length === 0 && !buyNowProduct) {
          router.push('/storecatalogue');
          return;
        }

        const items = cartItems.length > 0
          ? cartItems.map(item => ({
              productId: item.productId,
              variantName: item.variantName,
              quantity: item.quantity,
              price: item.price,
            }))
          : buyNowProduct
            ? [{
                productId: buyNowProduct.productId,
                variantName: buyNowProduct.variantName,
                quantity: buyNowProduct.quantity,
                price: buyNowProduct.price,
              }]
            : [];

        const endpoint = session?.access_token
          ? '/api/products/checkout/cart'
          : '/api/products/checkout/guest';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
          },
          body: JSON.stringify({
            items,
            guestInfo: !session?.access_token ? {
              email: contactEmail,
              fullName: contactName,
              phone: contactPhone,
              address: shippingAddress.address_line1,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zip: shippingAddress.zip_code,
            } : undefined,
            contactEmail,
            shippingAddress,
          }),
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to create payment');
        paymentClientSecret = data.clientSecret;
      }

      // Parse expiry date
      const expiryMatch = cardExpiry.match(/^(\d{2})\/(\d{2,4})$/);
      const expiryMonth = expiryMatch ? parseInt(expiryMatch[1]) : null;
      const expiryYear = expiryMatch ? (parseInt(expiryMatch[2]) < 100 ? 2000 + parseInt(expiryMatch[2]) : parseInt(expiryMatch[2])) : null;

      // Determine billing address
      const billingAddr = billingSameAsShipping ? shippingAddress : billingAddress;

      // Create payment method with card details
      const { error: pmError, paymentMethod: pm } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: cardNumber.replace(/\s+/g, '').replace(/-/g, ''),
          exp_month: expiryMonth,
          exp_year: expiryYear,
          cvc: cardCVC,
        },
        billing_details: {
          name: contactName || contactEmail,
          email: contactEmail,
          phone: contactPhone || undefined,
          address: {
            line1: billingAddr.address_line1,
            line2: billingAddr.address_line2 || undefined,
            city: billingAddr.city,
            state: billingAddr.state,
            postal_code: billingAddr.zip_code,
            country: billingAddr.country,
          },
        },
      });

      if (pmError) throw pmError;
      if (!pm) throw new Error('Failed to create payment method');

      // Confirm payment with payment method
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(paymentClientSecret, {
        payment_method: pm.id,
      });

      if (confirmError) throw confirmError;

      // Success
      setIsComplete(true);
      clearCart();
      sessionStorage.removeItem('guest_checkout_product');

      // Track conversion
      if (typeof window !== 'undefined' && typeof gtag_report_conversion === 'function') {
        gtag_report_conversion();
      }

      setTimeout(() => {
        if (isAuthenticated) {
          router.push('/client-portal?view=product_orders');
        } else {
          router.push('/storecatalogue?success=true');
        }
      }, 2500);
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate totals
  const displayTotal = cartItems.length > 0
    ? Math.max(getCartTotal(), 100)
    : buyNowProduct
      ? Math.max(buyNowProduct.price * buyNowProduct.quantity, 100)
      : 100;

  // WhatsApp link
  const getWhatsAppLink = () => {
    const productInfo = buyNowProduct?.productName || 'my order';
    const text = encodeURIComponent(
      `Hi, I'd like to discuss payment options for ${productInfo}. My email is ${contactEmail}.`
    );
    return `https://wa.me/19292662966?text=${text}`;
  };

  // Success state
  if (isComplete) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center px-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className={`text-3xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Payment Successful!
          </h2>
          <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
            Your order has been processed. Redirecting...
          </p>
        </motion.div>
      </div>
    );
  }

  // Pay Later submitted
  if (payLaterSubmitted) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center px-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className={`text-3xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Request Submitted!
          </h2>
          <p className={`mb-6 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            We&apos;ll contact you within 1-2 business days to finalize your order.
          </p>
          <button
            onClick={() => router.push('/storecatalogue')}
            className={`px-6 py-3 rounded-full font-medium ${
              isDark
                ? 'bg-white/20 hover:bg-white/30 text-white'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} pt-20 pb-24 lg:pb-12`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 mb-6 text-sm ${
            isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className={`text-3xl font-light mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - Single Page */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <h2 className={`text-xl font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      contactError ? 'border-red-500' :
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  {contactError && <p className="text-red-500 text-sm mt-1">{contactError}</p>}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <h2 className={`text-xl font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>

              {/* Saved addresses for auth users */}
              {savedAddresses.length > 0 && (
                <div className="mb-4 space-y-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setUseNewAddress(false);
                        setShippingAddress({
                          address_line1: addr.address_line1,
                          address_line2: addr.address_line2 || '',
                          city: addr.city,
                          state: addr.state,
                          zip_code: addr.zip_code,
                          country: addr.country || 'US',
                        });
                      }}
                      className={`w-full p-3 rounded-xl text-left transition-all ${
                        selectedAddressId === addr.id && !useNewAddress
                          ? isDark ? 'bg-emerald-500/20 border-2 border-emerald-400/50' : 'bg-emerald-50 border-2 border-emerald-400'
                          : isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {addr.title || 'Saved Address'} {addr.is_primary && '(Primary)'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                        {addr.address_line1}, {addr.city}, {addr.state} {addr.zip_code}
                      </p>
                    </button>
                  ))}
                  <button
                    onClick={() => setUseNewAddress(true)}
                    className={`w-full p-3 rounded-xl text-left ${
                      useNewAddress
                        ? isDark ? 'bg-emerald-500/20 border-2 border-emerald-400/50' : 'bg-emerald-50 border-2 border-emerald-400'
                        : isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>+ Add new address</p>
                  </button>
                </div>
              )}

              {/* New address form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line1}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                      placeholder="123 Main St"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        addressErrors.address_line1 ? 'border-red-500' :
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {addressErrors.address_line1 && <p className="text-red-500 text-xs mt-1">{addressErrors.address_line1}</p>}
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Apt, Suite (optional)
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address_line2}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                      placeholder="Apt 4B"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        City *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          addressErrors.city ? 'border-red-500' :
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        State *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          addressErrors.state ? 'border-red-500' :
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zip_code}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })}
                      placeholder="12345"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        addressErrors.zip_code ? 'border-red-500' :
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {addressErrors.zip_code && <p className="text-red-500 text-xs mt-1">{addressErrors.zip_code}</p>}
                  </div>

                  {addressErrors.shipping_area && (
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                      <p className="text-red-500 text-sm">{addressErrors.shipping_area}</p>
                    </div>
                  )}

                  {isAuthenticated && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={saveAsPrimary}
                        onChange={(e) => setSaveAsPrimary(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        Save as primary address
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <h2 className={`text-xl font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Payment Method
              </h2>
              
              {/* Payment Method Selector - Glass Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'card'
                      ? isDark ? 'bg-emerald-500/20 border-2 border-emerald-400/50' : 'bg-emerald-50/80 border-2 border-emerald-400'
                      : isDark ? 'bg-white/10 border border-white/20 hover:bg-white/15' : 'bg-white/60 border border-gray-200/80 hover:bg-white/80'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: paymentMethod === 'card' 
                      ? isDark ? '0 4px 20px rgba(16, 185, 129, 0.2)' : '0 4px 20px rgba(16, 185, 129, 0.15)'
                      : 'none',
                  }}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-emerald-500' : isDark ? 'text-white/70' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Card</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'apple_pay'
                      ? isDark ? 'bg-emerald-500/20 border-2 border-emerald-400/50' : 'bg-emerald-50/80 border-2 border-emerald-400'
                      : isDark ? 'bg-white/10 border border-white/20 hover:bg-white/15' : 'bg-white/60 border border-gray-200/80 hover:bg-white/80'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: paymentMethod === 'apple_pay' 
                      ? isDark ? '0 4px 20px rgba(16, 185, 129, 0.2)' : '0 4px 20px rgba(16, 185, 129, 0.15)'
                      : 'none',
                  }}
                >
                  <AppleLogo className={`w-6 h-6 ${paymentMethod === 'apple_pay' ? 'text-emerald-500' : isDark ? 'text-white/70' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Apple Pay</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('pay_later')}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    paymentMethod === 'pay_later'
                      ? isDark ? 'bg-emerald-500/20 border-2 border-emerald-400/50' : 'bg-emerald-50/80 border-2 border-emerald-400'
                      : isDark ? 'bg-white/10 border border-white/20 hover:bg-white/15' : 'bg-white/60 border border-gray-200/80 hover:bg-white/80'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    boxShadow: paymentMethod === 'pay_later' 
                      ? isDark ? '0 4px 20px rgba(16, 185, 129, 0.2)' : '0 4px 20px rgba(16, 185, 129, 0.15)'
                      : 'none',
                  }}
                >
                  <Phone className={`w-6 h-6 ${paymentMethod === 'pay_later' ? 'text-emerald-500' : isDark ? 'text-white/70' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Pay Later</span>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <form onSubmit={handleCardPayment} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Card Number *
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => {
                        // Format card number with spaces
                        const value = e.target.value.replace(/\s+/g, '').replace(/-/g, '');
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setCardNumber(formatted);
                        if (cardErrors.cardNumber) setCardErrors({ ...cardErrors, cardNumber: null });
                      }}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        cardErrors.cardNumber ? 'border-red-500' :
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {cardErrors.cardNumber && <p className="text-red-500 text-xs mt-1">{cardErrors.cardNumber}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        Expiration (MM/YY) *
                      </label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) {
                            value = value.substring(0, 2) + '/' + value.substring(2, 4);
                          }
                          setCardExpiry(value);
                          if (cardErrors.cardExpiry) setCardErrors({ ...cardErrors, cardExpiry: null });
                        }}
                        placeholder="MM/YY"
                        maxLength={5}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          cardErrors.cardExpiry ? 'border-red-500' :
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      {cardErrors.cardExpiry && <p className="text-red-500 text-xs mt-1">{cardErrors.cardExpiry}</p>}
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        CVC *
                      </label>
                      <input
                        type="text"
                        value={cardCVC}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').substring(0, 4);
                          setCardCVC(value);
                          if (cardErrors.cardCVC) setCardErrors({ ...cardErrors, cardCVC: null });
                        }}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          cardErrors.cardCVC ? 'border-red-500' :
                          isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      {cardErrors.cardCVC && <p className="text-red-500 text-xs mt-1">{cardErrors.cardCVC}</p>}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={cardZip}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').substring(0, 5);
                        setCardZip(value);
                        if (cardErrors.cardZip) setCardErrors({ ...cardErrors, cardZip: null });
                      }}
                      placeholder="12345"
                      maxLength={5}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        cardErrors.cardZip ? 'border-red-500' :
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {cardErrors.cardZip && <p className="text-red-500 text-xs mt-1">{cardErrors.cardZip}</p>}
                  </div>

                  {/* Billing Address */}
                  <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={billingSameAsShipping}
                        onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Billing address same as shipping address
                      </span>
                    </label>

                    {!billingSameAsShipping && (
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            Street Address *
                          </label>
                          <input
                            type="text"
                            value={billingAddress.address_line1}
                            onChange={(e) => setBillingAddress({ ...billingAddress, address_line1: e.target.value })}
                            placeholder="123 Main St"
                            className={`w-full px-4 py-3 rounded-xl border ${
                              billingErrors.address_line1 ? 'border-red-500' :
                              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          {billingErrors.address_line1 && <p className="text-red-500 text-xs mt-1">{billingErrors.address_line1}</p>}
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            Apt, Suite (optional)
                          </label>
                          <input
                            type="text"
                            value={billingAddress.address_line2}
                            onChange={(e) => setBillingAddress({ ...billingAddress, address_line2: e.target.value })}
                            placeholder="Apt 4B"
                            className={`w-full px-4 py-3 rounded-xl border ${
                              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                              City *
                            </label>
                            <input
                              type="text"
                              value={billingAddress.city}
                              onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                              className={`w-full px-4 py-3 rounded-xl border ${
                                billingErrors.city ? 'border-red-500' :
                                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                              State *
                            </label>
                            <input
                              type="text"
                              value={billingAddress.state}
                              onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                              className={`w-full px-4 py-3 rounded-xl border ${
                                billingErrors.state ? 'border-red-500' :
                                isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            ZIP Code *
                          </label>
                          <input
                            type="text"
                            value={billingAddress.zip_code}
                            onChange={(e) => setBillingAddress({ ...billingAddress, zip_code: e.target.value })}
                            placeholder="12345"
                            className={`w-full px-4 py-3 rounded-xl border ${
                              billingErrors.zip_code ? 'border-red-500' :
                              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                          {billingErrors.zip_code && <p className="text-red-500 text-xs mt-1">{billingErrors.zip_code}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {paymentError && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                      <p className="text-red-500 text-sm">{paymentError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing || !stripe}
                    className={`about-devello-glass w-full py-3 rounded-full font-medium flex items-center justify-center gap-2 ${
                      isDark
                        ? 'text-emerald-300'
                        : 'text-emerald-700'
                    } ${(isProcessing || !stripe) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Pay {formatPrice(displayTotal)}
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Apple Pay */}
              {paymentMethod === 'apple_pay' && (
                <div className="space-y-4">
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Apple Pay is available in Safari on macOS, iOS, and iPadOS.
                  </p>
                  
                  <button
                    onClick={handleCardPayment}
                    disabled={isProcessing}
                    className="about-devello-glass w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 text-white"
                  >
                    <AppleLogo className="w-5 h-5" />
                    Pay with Apple Pay
                  </button>
                </div>
              )}

              {/* Pay Later */}
              {paymentMethod === 'pay_later' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-100'}`}>
                    <p className={`text-sm ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                      Want to discuss your order before paying? Submit a request and we&apos;ll contact you to finalize the transaction.
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Message (optional)
                    </label>
                    <textarea
                      value={payLaterMessage}
                      onChange={(e) => setPayLaterMessage(e.target.value)}
                      placeholder="Questions about the product, shipping, or anything else..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border resize-none ${
                        isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  {/* Phone number */}
                  <div className={`flex items-center justify-center gap-2 p-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-50'
                  }`}>
                    <Phone className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`} />
                    <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Call us: <a href={`tel:${DEVELLO_PHONE}`} className="underline font-medium">{DEVELLO_PHONE}</a>
                    </span>
                  </div>

                  {paymentError && (
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                      <p className="text-red-500 text-sm">{paymentError}</p>
                    </div>
                  )}

                  {/* Submit Request and WhatsApp buttons centered with divider */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={handlePayLater}
                      disabled={isProcessing}
                      className={`about-devello-glass px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 whitespace-nowrap ${
                        isDark
                          ? 'text-blue-300'
                          : 'text-blue-700'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
                      }}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <div className={`h-px w-8 ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
                      <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>or</span>
                      <div className={`h-px w-8 ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
                    </div>
                    
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`about-devello-glass px-6 py-3 rounded-full font-medium flex items-center justify-center gap-2 whitespace-nowrap ${
                        isDark
                          ? 'text-green-300'
                          : 'text-green-700'
                      }`}
                      style={{
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                        borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.25)',
                      }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp Us
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className={`p-6 rounded-2xl sticky top-24 transition-all ${
              isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            }`}
            style={{
              maxHeight: 'calc(100vh - 8rem)',
              overflowY: 'auto',
            }}
            >
              <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Summary
              </h3>

              <div className="space-y-3 mb-4">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={`${item.productId}-${item.variantName || 'default'}`} className="flex items-start gap-3">
                      {item.productImage && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="48px" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{item.variantName}</p>
                        )}
                        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Qty: {item.quantity}</p>
                      </div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))
                ) : buyNowProduct ? (
                  <div className="flex items-start gap-3">
                    {buyNowProduct.productImage && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={buyNowProduct.productImage} alt={buyNowProduct.productName} fill className="object-cover" sizes="48px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {buyNowProduct.productName}
                      </p>
                      {buyNowProduct.variantName && (
                        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{buyNowProduct.variantName}</p>
                      )}
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Qty: {buyNowProduct.quantity}</p>
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatPrice(buyNowProduct.price * buyNowProduct.quantity)}
                    </span>
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>No items</p>
                )}
              </div>

              <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                  <span className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatPrice(displayTotal)}
                  </span>
                </div>
              </div>

              {/* Secure checkout badge */}
              <div className={`mt-4 flex items-center justify-center gap-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                <Lock className="w-3 h-3" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Order Summary - Mobile Only */}
      {showFloatingSummary && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 ${
            isDark ? 'bg-black/95 border-t border-white/10' : 'bg-white/95 border-t border-gray-200'
          } backdrop-blur-lg shadow-2xl`}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className="px-4 py-2.5 flex items-center justify-between max-w-md mx-auto">
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Order Total</p>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatPrice(displayTotal)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <Lock className={`w-3 h-3 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              <span className={`text-[10px] ${isDark ? 'text-white/50' : 'text-gray-400'}`}>Secure</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
