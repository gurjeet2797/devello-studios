import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { getSupabase } from '../lib/supabaseClient';
import { useTheme } from './Layout';
import { useModalStatusBar } from '../lib/useStatusBar';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const SUBSCRIPTION_PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: 'month',
    uploadLimit: '50',
    popular: true,
    features: [
      '50 image uploads per month',
      'Priority processing',
      'Advanced editing tools',
      'High-resolution exports',
      'Priority support'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$5.99',
    period: 'month',
    uploadLimit: '20',
    popular: false,
    features: [
      '20 image uploads per month',
      'Standard processing',
      'Basic editing tools',
      'Standard resolution exports',
      'Email support'
    ]
  }
];

export default function SubscriptionModal({ isOpen, onClose, currentUploadCount = 0, onPurchaseSuccess }) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  
  // Sync status bar with modal state
  useModalStatusBar(isDark, isOpen);

  const handleSubscribe = async (planId) => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          planId,
          successUrl: `${window.location.origin}/profile?success=true`,
          cancelUrl: `${window.location.origin}/profile?canceled=true`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe error:', error);
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to start subscription process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const response = await fetch('/api/subscriptions/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/profile?portal=true`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open customer portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998]"
            onClick={onClose}
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'transparent',
            }}
          />
          
          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`about-devello-glass relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] sm:rounded-[2.5rem] p-6 border ${isDark ? 'text-white' : 'text-gray-900'}`}
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : 'rgba(0, 0, 0, 0.1)',
                borderWidth: '1px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ y: 2, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>

            {/* Content */}
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8 pt-8">
                <h2 className={`text-3xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Upgrade Your Experience
                </h2>
                <p className={`text-lg pb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  You&apos;ve used {currentUploadCount}/5 free uploads. Choose a plan to continue creating amazing images.
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {SUBSCRIPTION_PLANS.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`about-devello-glass relative rounded-[2.5rem] sm:rounded-2xl p-6 border transition-all duration-300 cursor-pointer ${
                      selectedPlan === plan.id
                        ? (isDark ? 'border-white/30 bg-white/10' : 'border-gray-300 bg-white/80')
                        : (isDark ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8' : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white/70')
                    }`}
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: selectedPlan === plan.id
                        ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)')
                        : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'),
                      borderColor: selectedPlan === plan.id
                        ? (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)')
                        : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'),
                      borderWidth: '1px'
                    }}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Most Popular
                      </div>
                    )}

                    <div className="text-center">
                      <h3 className={`text-2xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                      <div className="mb-4">
                        <span className={`text-4xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {plan.price}
                        </span>
                        <span className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                          /{plan.period}
                        </span>
                      </div>
                      <div className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {plan.uploadLimit} uploads per month
                      </div>
                    </div>


                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ y: 2, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      disabled={loading}
                      className={`about-devello-glass w-full py-3 px-6 rounded-[2.5rem] sm:rounded-xl font-medium transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: selectedPlan === plan.id
                          ? (isDark ? 'rgba(37, 99, 235, 0.6)' : 'rgba(37, 99, 235, 0.8)')
                          : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.7)'),
                        borderColor: selectedPlan === plan.id
                          ? (isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.3)')
                          : (isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)'),
                        borderWidth: '1px',
                        color: selectedPlan === plan.id ? 'white' : (isDark ? 'white' : '#111827')
                      }}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {loading ? 'Processing...' : 'Choose Plan'}
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="text-center">
                <motion.button
                  whileTap={{ y: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={onClose}
                  className={`text-sm transition-colors ${isDark ? 'text-white/60 hover:text-white/80' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  Maybe later
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
