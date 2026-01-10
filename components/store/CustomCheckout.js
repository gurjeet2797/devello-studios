"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, CreditCard, Lock, MapPin } from 'lucide-react';
import { useTheme } from '../Layout';
import { useCart } from './CartContext';
import { getSupabase } from '../../lib/supabaseClient';
import { loadStripe } from '@stripe/stripe-js';
import { MeshGradient } from "@paper-design/shaders-react";
import Image from 'next/image';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CustomCheckout({ isOpen, onClose, onSuccess, clientSecret: propClientSecret }) {
  const { isDark } = useTheme();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardElement, setCardElement] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(propClientSecret);
  const cardElementRef = React.useRef(null);
  
  // Shipping address state
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
  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactError, setContactError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Contact', 'Shipping', 'Payment'];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setContactError(null);
      setPaymentError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || paymentMethod !== 'card') {
      // Clean up if modal is closed or payment method changed
      if (cardElement) {
        cardElement.unmount();
        setCardElement(null);
      }
      return;
    }

    let mountedCardElement = null;
    let isMounted = true;
    
    const initializeStripe = async () => {
      try {
        const stripeInstance = await stripePromise;
        if (!isMounted) return;
        
        setStripe(stripeInstance);
        const elementsInstance = stripeInstance.elements({
          appearance: {
            theme: isDark ? 'night' : 'stripe',
            variables: {
              colorPrimary: '#10b981',
              colorBackground: isDark ? '#000000' : '#ffffff',
              colorText: isDark ? '#ffffff' : '#000000',
              colorDanger: '#ef4444',
              fontFamily: 'system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px',
            },
          },
        });
        setElements(elementsInstance);
        
        // Wait for DOM element to be available and current step to be 2
        const mountCard = () => {
          if (!isMounted || !cardElementRef.current || mountedCardElement) return;
          
          try {
            const card = elementsInstance.create('card');
            card.mount(cardElementRef.current);
            mountedCardElement = card;
            setCardElement(card);
            
            // Handle card element changes
            card.on('change', (event) => {
              if (event.error) {
                setPaymentError(event.error.message);
              } else {
                setPaymentError(null);
              }
            });
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('[CUSTOM_CHECKOUT] Error mounting card element:', error);
            }
            setPaymentError('Failed to initialize payment form. Please refresh the page.');
          }
        };
        
        // Try mounting immediately
        mountCard();
        
        // If not available, try again after a short delay
        if (!mountedCardElement) {
          const timeoutId = setTimeout(() => {
            if (isMounted) {
              mountCard();
            }
          }, 200);
          
          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[CUSTOM_CHECKOUT] Error initializing Stripe:', error);
        }
        setPaymentError('Failed to initialize payment system. Please refresh the page.');
      }
    };
    
    initializeStripe();
    
    return () => {
      isMounted = false;
      if (mountedCardElement) {
        try {
          mountedCardElement.unmount();
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[CUSTOM_CHECKOUT] Error unmounting card element:', error);
          }
        }
        mountedCardElement = null;
      }
      if (cardElement) {
        try {
          cardElement.unmount();
        } catch (error) {
          // Ignore unmount errors
        }
        setCardElement(null);
      }
    };
  }, [isOpen, paymentMethod, isDark, currentStep]);

  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Get client secret from URL if available (single product checkout)
  useEffect(() => {
    if (typeof window !== 'undefined' && !clientSecret) {
      const params = new URLSearchParams(window.location.search);
      const urlClientSecret = params.get('clientSecret');
      if (urlClientSecret) {
        setClientSecret(urlClientSecret);
      }
    }
  }, []);

  // Fetch product details for "Buy Now" purchases (when cart is empty but we have clientSecret)
  useEffect(() => {
    if (!isOpen || cartItems.length > 0) return;
    
    const fetchBuyNowProduct = async () => {
      if (!clientSecret) return;
      
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Extract payment intent ID from client secret (format: pi_xxx_secret_xxx)
        const paymentIntentId = clientSecret.split('_secret_')[0];
        if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) return;
        
        // Fetch payment intent to get product metadata
        const response = await fetch(`/api/products/payment-intent/${paymentIntentId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.product) {
            setBuyNowProduct({
              productId: data.product.id,
              productName: data.product.name,
              variantName: data.metadata?.variantName || null,
              quantity: parseInt(data.metadata?.quantity || '1'),
              price: parseInt(data.metadata?.variant_price || data.product.price),
              image_url: data.product.image_url,
            });
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching buy now product:', error);
        }
      }
    };

    fetchBuyNowProduct();
  }, [isOpen, clientSecret, cartItems.length]);

  // Fetch saved addresses when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchAddresses = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        if (session?.user?.email && !contactEmail) {
          setContactEmail(session.user.email);
        }

        const response = await fetch('/api/users/addresses', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        if (data.success && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const primaryAddress = data.addresses.find(addr => addr.is_primary);
          if (primaryAddress) {
            setSelectedAddressId(primaryAddress.id);
            setUseNewAddress(false);
            setShippingAddress({
              address_line1: primaryAddress.address_line1,
              address_line2: primaryAddress.address_line2 || '',
              city: primaryAddress.city,
              state: primaryAddress.state,
              zip_code: primaryAddress.zip_code,
              country: primaryAddress.country || 'US',
            });
          } else {
            setUseNewAddress(true);
          }
        } else {
          setUseNewAddress(true);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error fetching addresses:', error);
        }
        setUseNewAddress(true);
      }
    };

    fetchAddresses();
  }, [isOpen]);

  // Update shipping address when selected address changes
  useEffect(() => {
    if (selectedAddressId && !useNewAddress) {
      const address = savedAddresses.find(addr => addr.id === selectedAddressId);
      if (address) {
        setShippingAddress({
          address_line1: address.address_line1,
          address_line2: address.address_line2 || '',
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          country: address.country || 'US',
        });
      }
    }
  }, [selectedAddressId, useNewAddress, savedAddresses]);

  const validateShippingAddress = () => {
    const errors = {};
    if (!shippingAddress.address_line1) errors.address_line1 = 'Address is required';
    if (!shippingAddress.city) errors.city = 'City is required';
    if (!shippingAddress.state) errors.state = 'State is required';
    if (!shippingAddress.zip_code || !/^\d{5}(-\d{4})?$/.test(shippingAddress.zip_code)) {
      errors.zip_code = 'Valid ZIP code is required';
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateContact = () => {
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setContactError('Valid email is required');
      return false;
    }
    setContactError(null);
    return true;
  };

  const handleContinueContact = () => {
    if (validateContact()) {
      setCurrentStep(1);
    }
  };

  const handleContinueShipping = () => {
    if (validateShippingAddress()) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setPaymentError('Payment system not ready. Please wait a moment.');
      return;
    }
    
    if (paymentMethod === 'card' && !cardElement) {
      setPaymentError('Please wait for the payment form to load.');
      return;
    }

    if (!validateContact()) {
      setCurrentStep(0);
      return;
    }

    // Validate shipping address
    if (!validateShippingAddress()) {
      setCurrentStep(1);
      setPaymentError('Please fill in all required shipping address fields');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      // Save address if user wants to save it
      if (saveAsPrimary && session?.access_token) {
        try {
          await fetch('/api/users/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              address_line1: shippingAddress.address_line1,
              address_line2: shippingAddress.address_line2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zip_code: shippingAddress.zip_code,
              country: shippingAddress.country,
              is_primary: true,
            }),
          });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error saving address:', error);
          }
          // Continue with payment even if address save fails
        }
      }
      
      let paymentClientSecret = clientSecret;

      // If we have a clientSecret from URL/props, use it (assumes authenticated flow)
      // Otherwise, check authentication and create payment intent
      if (!paymentClientSecret) {
        // No clientSecret - need to create one, which requires authentication
        if (!session?.access_token) {
          // Redirect to guest checkout if cart has items, otherwise to auth
          if (cartItems.length > 0) {
            window.location.href = '/guest-checkout';
          } else {
            window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
          }
          return;
        }

        // Create payment intent for cart (authenticated user)
        if (cartItems.length > 0) {
          const response = await fetch('/api/products/checkout/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              items: cartItems.map(item => ({
                productId: item.productId,
                variantName: item.variantName,
                quantity: item.quantity,
                price: item.price,
              })),
            contactEmail,
              shippingAddress: {
                address_line1: shippingAddress.address_line1,
                address_line2: shippingAddress.address_line2,
                city: shippingAddress.city,
                state: shippingAddress.state,
                zip_code: shippingAddress.zip_code,
                country: shippingAddress.country,
              },
            }),
          });

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Failed to create payment');
          }

          paymentClientSecret = data.clientSecret;
        } else if (buyNowProduct && clientSecret) {
          // For "Buy Now" purchases, update the existing payment intent with shipping address
          // Extract payment intent ID from client secret
          const paymentIntentId = clientSecret.split('_secret_')[0];
          if (paymentIntentId && paymentIntentId.startsWith('pi_')) {
            try {
              const updateResponse = await fetch(`/api/products/payment-intent/${paymentIntentId}/update`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  shippingAddress: {
                    address_line1: shippingAddress.address_line1,
                    address_line2: shippingAddress.address_line2,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zip_code: shippingAddress.zip_code,
                    country: shippingAddress.country,
                  },
                }),
              });
              // Continue even if update fails - shipping address will be in metadata
            } catch (error) {
              if (process.env.NODE_ENV !== 'production') {
                console.error('Error updating payment intent with shipping address:', error);
              }
            }
          }
        }
      }

      if (!paymentClientSecret) {
        throw new Error('No payment method available');
      }

      // For "Buy Now" purchases, update payment intent metadata with shipping address before confirming
      if (buyNowProduct && paymentClientSecret) {
        const paymentIntentId = paymentClientSecret.split('_secret_')[0];
        if (paymentIntentId && paymentIntentId.startsWith('pi_')) {
          try {
            const supabase = getSupabase();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              await fetch(`/api/products/payment-intent/${paymentIntentId}/update`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  shippingAddress: {
                    address_line1: shippingAddress.address_line1,
                    address_line2: shippingAddress.address_line2,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    zip_code: shippingAddress.zip_code,
                    country: shippingAddress.country,
                  },
                }),
              });
            }
          } catch (error) {
            console.error('Error updating payment intent with shipping address:', error);
            // Continue with payment even if update fails
          }
        }
      }

      // Get card element if not already set
      let cardElementToUse = cardElement;
      if (!cardElementToUse && elements) {
        try {
          cardElementToUse = elements.getElement('card');
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[CUSTOM_CHECKOUT] Error getting card element:', error);
          }
        }
      }
      
      if (!cardElementToUse) {
        throw new Error('Card element not available. Please refresh and try again.');
      }
      
      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(paymentClientSecret, {
        payment_method: {
          card: cardElementToUse,
          billing_details: {
            address: {
              line1: shippingAddress.address_line1,
              line2: shippingAddress.address_line2 || undefined,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zip_code,
              country: shippingAddress.country,
            },
          },
        },
      });

      if (confirmError) {
        throw confirmError;
      }

      // Success
      setIsComplete(true);
      if (cartItems.length > 0) {
        clearCart();
      }
      
      // Track conversion
      if (typeof window !== 'undefined' && typeof gtag_report_conversion === 'function') {
        gtag_report_conversion();
      }
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Payment error:', error);
      }
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const displayTotal = cartItems.length > 0 
    ? Math.max(getCartTotal(), 100)
    : buyNowProduct 
      ? Math.max(buyNowProduct.price * buyNowProduct.quantity, 100)
      : 100;
  const getDisplayItemTotal = (item) => {
    const raw = item.price * item.quantity;
    return raw < 100 ? 100 : raw;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998]"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'transparent',
            }}
          />

          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center px-3 sm:px-6 py-6"
            onClick={onClose}
            style={{
              overflow: 'hidden',
              touchAction: 'none',
              paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.8
              }}
              onClick={(e) => e.stopPropagation()}
              className="about-devello-glass build-button-gradient relative flex flex-col w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-3xl max-h-[82vh] md:max-h-[90vh] transform-gpu will-change-transform backdrop-blur-md overflow-y-auto scrollbar-hide"
              style={{ 
                borderRadius: "2rem",
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark 
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: "2rem" }}>
                <MeshGradient
                  speed={1}
                  colors={isDark 
                    ? ["#000000", "#1a1a1a", "#2a2a2a", "#3a3a3a", "#c0c0c0"]
                    : ["#fef3c7", "#fef9e7", "#ffffff", "#ffffff", "#ffffff"]
                  }
                  distortion={0.8}
                  swirl={0.1}
                  grainMixer={0}
                  grainOverlay={0}
                  className="inset-0"
                  style={{ 
                    height: "100%", 
                    width: "100%",
                    opacity: isDark ? 0.5 : 0.4
                  }}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 sm:p-8 md:p-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-3xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Checkout
                  </h2>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full about-devello-glass flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-800'}`} />
                  </button>
                </div>
                {isComplete ? (
                  <div className="text-center py-12">
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
                      Your order has been processed.
                    </p>
                  </div>
                ) : (
                  <>

                    {/* Order Summary */}
                    <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/50'}`}>
                      <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Order Summary
                      </h3>
                      <div className="space-y-3 mb-4">
                        {cartItems.length > 0 ? (
                          cartItems.map((item) => (
                            <div key={`${item.productId}-${item.variantName || 'default'}`} className="flex items-start gap-3">
                              {item.productImage && (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {item.productName}
                                </p>
                                {item.variantName && (
                                  <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                    {item.variantName}
                                  </p>
                                )}
                                <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatPrice(getDisplayItemTotal(item))}
                              </span>
                            </div>
                          ))
                        ) : buyNowProduct ? (
                          <div className="flex items-start gap-3">
                            {buyNowProduct.image_url && (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={buyNowProduct.image_url}
                                  alt={buyNowProduct.productName}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {buyNowProduct.productName}
                              </p>
                              {buyNowProduct.variantName && (
                                <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                  {buyNowProduct.variantName}
                                </p>
                              )}
                              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                Qty: {buyNowProduct.quantity}
                              </p>
                            </div>
                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatPrice(buyNowProduct.price * buyNowProduct.quantity)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex justify-between pt-4 border-t border-white/10">
                        <span className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Total
                        </span>
                        <span className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(displayTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        {steps.map((label, index) => {
                          const isActive = currentStep === index;
                          const isCompleted = currentStep > index;
                          return (
                            <div key={label} className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                  isActive
                                    ? 'bg-emerald-500 text-white'
                                    : isCompleted
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : isDark
                                        ? 'bg-white/10 text-white/70'
                                        : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-800'}`}>{label}</span>
                              {index < steps.length - 1 && (
                                <div className={`w-8 h-[1px] ${isDark ? 'bg-white/20' : 'bg-gray-300'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Contact
                        </h3>
                        {currentStep > 0 && (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(0)}
                            className="text-xs underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <div className={`p-3 rounded-xl space-y-2 ${isDark ? 'bg-white/10' : 'bg-white/50'}`}>
                        <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                          Email *
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className={`w-full px-3 py-2 text-sm rounded-lg border ${
                            contactError
                              ? 'border-red-500'
                              : isDark
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="you@example.com"
                        />
                        {contactError && <p className="text-red-500 text-xs">{contactError}</p>}
                        {currentStep === 0 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleContinueContact}
                              className="w-full py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                            >
                              Continue to Shipping
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address Section */}
                    {currentStep >= 1 && (
                    <div className="mb-4 space-y-3">
                      <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <MapPin className="w-4 h-4" />
                        Ship to a new address
                      </h3>

                      {/* Saved Addresses Selection */}
                      {savedAddresses.length > 0 && (
                        <div className="mb-3">
                          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                            Use saved address
                          </label>
                          <div className="space-y-1.5">
                            {savedAddresses.map((address) => (
                              <button
                                key={address.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAddressId(address.id);
                                  setUseNewAddress(false);
                                }}
                                className={`w-full p-2 rounded-lg text-left transition-all ${
                                  selectedAddressId === address.id && !useNewAddress
                                    ? isDark
                                      ? 'bg-emerald-500/30 border-2 border-emerald-400/50'
                                      : 'bg-emerald-500/20 border-2 border-emerald-400/50'
                                    : isDark
                                      ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                                      : 'bg-white/50 border border-gray-300 hover:bg-white/70'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                      {address.title} {address.is_primary && '(Primary)'}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                      {address.address_line1}, {address.city}, {address.state} {address.zip_code}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setUseNewAddress(true)}
                              className={`w-full p-2 rounded-lg text-left transition-all ${
                                useNewAddress
                                  ? isDark
                                    ? 'bg-emerald-500/30 border-2 border-emerald-400/50'
                                    : 'bg-emerald-500/20 border-2 border-emerald-400/50'
                                  : isDark
                                    ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                                    : 'bg-white/50 border border-gray-300 hover:bg-white/70'
                              }`}
                            >
                              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>+ Add new address</p>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* New Address Form */}
                      {useNewAddress && (
                        <div className={`p-3 rounded-xl space-y-2.5 ${isDark ? 'bg-white/10' : 'bg-white/50'}`}>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                                Street Address *
                              </label>
                              <input
                                type="text"
                                value={shippingAddress.address_line1}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                  addressErrors.address_line1
                                    ? 'border-red-500'
                                    : isDark
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="123 Main St"
                              />
                              {addressErrors.address_line1 && <p className="text-red-500 text-xs mt-0.5">{addressErrors.address_line1}</p>}
                            </div>

                            <div>
                              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                                Address Line 2 (Optional)
                              </label>
                              <input
                                type="text"
                                value={shippingAddress.address_line2}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                  isDark
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="Apt, Suite, etc."
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                                City *
                              </label>
                              <input
                                type="text"
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                  addressErrors.city
                                    ? 'border-red-500'
                                    : isDark
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="City"
                              />
                              {addressErrors.city && <p className="text-red-500 text-xs mt-0.5">{addressErrors.city}</p>}
                            </div>

                            <div>
                              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                                State *
                              </label>
                              <input
                                type="text"
                                value={shippingAddress.state}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                  addressErrors.state
                                    ? 'border-red-500'
                                    : isDark
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="State"
                              />
                              {addressErrors.state && <p className="text-red-500 text-xs mt-0.5">{addressErrors.state}</p>}
                            </div>

                            <div>
                              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                                ZIP Code *
                              </label>
                              <input
                                type="text"
                                value={shippingAddress.zip_code}
                                onChange={(e) => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                                  addressErrors.zip_code
                                    ? 'border-red-500'
                                    : isDark
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                placeholder="12345"
                              />
                              {addressErrors.zip_code && <p className="text-red-500 text-xs mt-0.5">{addressErrors.zip_code}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="saveAsPrimary"
                              checked={saveAsPrimary}
                              onChange={(e) => setSaveAsPrimary(e.target.checked)}
                              className="w-3.5 h-3.5 rounded"
                            />
                            <label htmlFor="saveAsPrimary" className={`text-xs ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                              Save as Primary Address for future orders
                            </label>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3">
                        {currentStep > 0 && (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                            className="text-sm underline"
                          >
                            Back
                          </button>
                        )}
                        {currentStep === 1 && (
                          <button
                            type="button"
                            onClick={handleContinueShipping}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            Continue to Payment
                          </button>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Payment Form */}
                    {currentStep >= 2 && (
                    <form onSubmit={handlePayment} className="space-y-6">
                      <div>
                        <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Payment Method
                        </label>
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentMethod('card');
                              setPaymentError(null);
                            }}
                            className={`w-full p-4 rounded-xl text-left transition-all ${
                              paymentMethod === 'card'
                                ? isDark
                                  ? 'bg-emerald-500/30 border-2 border-emerald-400/50'
                                  : 'bg-emerald-500/20 border-2 border-emerald-400/50'
                                : isDark
                                  ? 'bg-white/10 border border-white/20 hover:bg-white/20'
                                  : 'bg-white/50 border border-gray-300 hover:bg-white/70'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5" />
                              <span className={isDark ? 'text-white' : 'text-gray-900'}>Card</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'card' && (
                        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white/50'}`}>
                          {elements ? (
                            <div ref={cardElementRef} id="card-element" style={{ minHeight: '40px' }} />
                          ) : (
                            <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                              Loading payment form...
                            </div>
                          )}
                        </div>
                      )}

                      {paymentError && (
                        <div className={`p-4 rounded-xl bg-red-500/20 border border-red-500/50`}>
                          <p className="text-red-400 text-sm">{paymentError}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isProcessing || !stripe || !elements || (paymentMethod === 'card' && !cardElement)}
                        className={`w-full py-4 rounded-full font-medium transition-all flex items-center justify-center gap-2 ${
                          isDark
                            ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/50'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
                        } ${isProcessing || !stripe || !elements || (paymentMethod === 'card' && !cardElement) ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-sm underline"
                        >
                          Back to Shipping
                        </button>
                      </div>
                    </form>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

