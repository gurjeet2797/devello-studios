import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../components/Layout';
import { useCart } from '../components/store/CartContext';
import { useModal } from '../components/ModalProvider';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import SEOComponent from '../components/SEO';
import { Loader2, Lock, X, CheckCircle, MessageCircle, Phone } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function GuestCheckoutForm({ cartItems, getCartTotal, cartReady, removeFromCart, clearCart }) {
  const router = useRouter();
  const { isDark } = useTheme();
  const stripe = useStripe();
  const elements = useElements();
  
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const { openAuthModal } = useModal();


  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Reset clientSecret when cartItems change
  useEffect(() => {
    setClientSecret(null);
    setPaymentError(null);
  }, [cartItems]);

  // Create payment intent when form is valid
  useEffect(() => {
    if (!cartReady) return;

    if (cartItems.length === 0) {
      router.push('/');
      return;
    }

    const createPaymentIntent = async () => {
      // Basic validation
      if (!formData.email || !formData.fullName || !formData.address || !formData.city || !formData.state || !formData.zip) {
        return;
      }

      try {
        // Ensure items are valid before requesting intent
        const hasInvalidItem = cartItems.some(
          (item) => !item.productId || !item.price || item.price <= 0 || !item.quantity
        );
        if (hasInvalidItem) {
          setPaymentError('Cart items are invalid. Please reload and try again.');
          return;
        }

        const response = await fetch('/api/products/checkout/guest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            guestInfo: formData,
            items: cartItems.map(item => ({
              productId: item.productId,
              variantName: item.variantName,
              quantity: item.quantity,
              price: item.price,
            })),
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setPaymentError(data.error || 'Failed to create payment');
          return;
        }

        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setPaymentError('Failed to initialize payment. Please try again.');
      }
    };

    // Debounce payment intent creation
    const timer = setTimeout(createPaymentIntent, 500);
    return () => clearTimeout(timer);
  }, [formData, cartItems, router, cartReady]);

  const checkEmailExists = async (email) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailExists(false);
      return false;
    }

    setCheckingEmail(true);
    try {
      const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setEmailExists(data.exists || false);
      return data.exists || false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateForm = async () => {
    const newErrors = {};
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    } else {
      // Check if email exists
      const exists = await checkEmailExists(formData.email);
      if (exists) {
        newErrors.email = 'account_exists';
      }
    }
    
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.address || formData.address.trim().length < 5) {
      newErrors.address = 'Valid address is required';
    }
    
    if (!formData.city || formData.city.trim().length < 2) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state || formData.state.trim().length < 2) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.zip || !/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      newErrors.zip = 'Valid ZIP code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) {
      if (errors.email === 'account_exists') {
        // Prompt user to sign in
        if (confirm('An account with this email already exists. Would you like to sign in instead?')) {
          // Store flag to open cart after sign-in
          sessionStorage.setItem('open_cart_after_signin', 'true');
          // Ensure cart is saved to localStorage (it should already be, but double-check)
          const cartData = localStorage.getItem('devello_cart');
          if (cartData) {
            sessionStorage.setItem('guest_checkout_cart_backup', cartData);
          }
          openAuthModal('signin', { email: formData.email, redirectPath: '/checkout' });
          return;
        }
      }
      return;
    }

    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not ready. Please wait a moment.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone || undefined,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.state,
              postal_code: formData.zip,
              country: 'US',
            },
          },
        },
      });

      if (confirmError) {
        setPaymentError(confirmError.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Clear cart and sessionStorage
        clearCart();
        sessionStorage.removeItem('guest_checkout_product');
        // Show success state
        setIsComplete(true);
        setIsProcessing(false);
        
        // Track conversion
        if (typeof window !== 'undefined' && typeof gtag_report_conversion === 'function') {
          gtag_report_conversion();
        }
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/storecatalogue?success=true&guest=true');
        }, 3000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className={`text-3xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Payment Successful!
        </h2>
        <p className={`mb-6 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          Your order has been processed successfully. You will receive a confirmation email shortly.
        </p>
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          Redirecting to store...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Guest Information */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Contact Information
        </h3>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            Email *
          </label>
          <div className="relative">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailExists(false);
                if (errors.email) {
                  setErrors({ ...errors, email: null });
                }
              }}
              onBlur={() => {
                if (formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                  checkEmailExists(formData.email);
                }
              }}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.email
                  ? 'border-red-500'
                  : emailExists
                  ? 'border-yellow-500'
                  : isDark
                  ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="your@email.com"
            />
            {checkingEmail && (
              <div className="absolute right-3 top-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {errors.email === 'account_exists' ? (
            <div className="mt-2 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
              <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                An account with this email already exists.{' '}
                <button
                  type="button"
                  onClick={() => {
                    // Store flag to open cart after sign-in
                    sessionStorage.setItem('open_cart_after_signin', 'true');
                    // Ensure cart is saved to localStorage
                    const cartData = localStorage.getItem('devello_cart');
                    if (cartData) {
                      sessionStorage.setItem('guest_checkout_cart_backup', cartData);
                    }
                    openAuthModal('signin', { email: formData.email });
                  }}
                  className="underline font-medium"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          ) : errors.email ? (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            Full Name *
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.fullName
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="John Doe"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            Phone (Optional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${
              isDark
                ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Shipping Address */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Shipping Address
        </h3>
        
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            Street Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.address
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="123 Main St"
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.city
                  ? 'border-red-500'
                  : isDark
                  ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="City"
            />
            {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
              State *
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.state
                  ? 'border-red-500'
                  : isDark
                  ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              placeholder="State"
            />
            {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
            ZIP Code *
          </label>
          <input
            type="text"
            value={formData.zip}
            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.zip
                ? 'border-red-500'
                : isDark
                ? 'bg-gray-800 border-white/20 text-white placeholder-white/50'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="12345"
          />
          {errors.zip && <p className="text-red-500 text-sm mt-1">{errors.zip}</p>}
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-4">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Lock className="w-5 h-5" />
          Payment Information
        </h3>
        
        <div className={`p-4 rounded-lg border ${
          isDark
            ? 'bg-white/5 border-white/20'
            : 'bg-gray-50 border-gray-300'
        }`}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: isDark ? '#ffffff' : '#000000',
                  '::placeholder': {
                    color: isDark ? '#ffffff80' : '#00000080',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {paymentError && (
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-red-900/30 border border-red-500/30' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={isDark ? 'text-red-300' : 'text-red-800'}>{paymentError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !clientSecret || !stripe}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
          isProcessing || !clientSecret || !stripe
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:scale-105 active:scale-95'
        } ${
          isDark
            ? 'bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/50'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Complete Purchase
          </>
        )}
      </button>
    </form>
  );
}

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { cartItems, getCartTotal, addToCart, removeFromCart, clearCart } = useCart();
  const { openAuthModal } = useModal();
  const [cartReady, setCartReady] = useState(false);

  // Handle product from sessionStorage - add to existing cart if items exist
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const guestProduct = sessionStorage.getItem('guest_checkout_product');

    if (guestProduct) {
      try {
        const product = JSON.parse(guestProduct);
        // Always add the product to cart (will update quantity if already exists)
        addToCart(
          {
            id: product.productId,
            name: product.productName,
            slug: product.productSlug,
            image_url: product.productImage,
            price: product.price,
            metadata: {},
          },
          product.variantName
            ? {
                name: product.variantName,
                material: product.variantMaterial,
                price: product.price,
              }
            : null,
          product.quantity
        );
        // Clear sessionStorage after adding
        sessionStorage.removeItem('guest_checkout_product');
      } catch (error) {
        console.error('Error adding guest product to cart:', error);
      }
    }
    setCartReady(true);
  }, [addToCart]);

  useEffect(() => {
    if (!cartReady) return;
    if (cartItems.length === 0) {
      if (typeof window !== 'undefined' && !sessionStorage.getItem('guest_checkout_product')) {
        router.push('/');
      }
    }
  }, [cartItems, router, cartReady]);


  const formatPrice = (cents) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <>
      <SEOComponent 
        title="Guest Checkout - Devello"
        description="Complete your purchase as a guest"
        url="https://develloinc.com/guest-checkout"
      />
      
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} pt-24 pb-12 px-4`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/storecatalogue')}
              className={`flex items-center gap-2 text-sm mb-4 ${
                isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <X className="w-4 h-4" />
              Back to Store
            </button>
            <h1 className={`text-3xl font-light mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Guest Checkout
            </h1>
            <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
              Complete your purchase without creating an account or{' '}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  openAuthModal('signup', { redirectPath: '/checkout' });
                }}
                className="text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                sign up for live updates
              </button>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Elements stripe={stripePromise}>
                <GuestCheckoutForm 
                  cartItems={cartItems} 
                  getCartTotal={getCartTotal}
                  cartReady={cartReady}
                  removeFromCart={removeFromCart}
                  clearCart={clearCart}
                />
              </Elements>
            </div>
            
            <div className="lg:col-span-1">
              <div className={`p-6 rounded-lg border sticky top-4 ${
                isDark ? 'bg-white/5 border-white/20' : 'bg-white border-gray-300'
              }`}>
                <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Order Summary
                </h2>
                <div className="space-y-4 mb-4">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.variantName || 'default'}`} className="flex items-start gap-3">
                      {item.productImage && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {item.variantName}
                          </p>
                        )}
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId, item.variantName)}
                          className={`p-1 rounded-full hover:bg-white/10 transition-colors ${
                            isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`pt-4 border-t ${isDark ? 'border-white/20' : 'border-gray-300'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Subtotal</span>
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatPrice(getCartTotal())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Total
                    </span>
                    <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Need Help Section with WhatsApp */}
              <div className={`mt-4 p-4 rounded-lg border ${
                isDark ? 'bg-white/5 border-white/20' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`font-medium mb-2 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Need Help?
                </h3>
                <p className={`text-xs mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  Questions about your order? Contact us directly.
                </p>
                <div className="space-y-2">
                  <a
                    href={`https://wa.me/19292662966?text=${encodeURIComponent('Hi, I need help with my order at Devello checkout.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isDark
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/50'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Us
                  </a>
                  <div className={`flex items-center justify-center gap-2 text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    <Phone className="w-3 h-3" />
                    <span>Call: <a href="tel:929-266-2966" className="underline">929-266-2966</a></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
