import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSupabase } from '../lib/supabaseClient';
import { PricingService } from '../lib/pricingService';
import { RefreshService } from '../lib/refreshService';
import { useTheme } from './Layout';
import { useModalStatusBar } from '../lib/useStatusBar';

export default function BillingManagementModal({ 
  isOpen, 
  onClose, 
  currentPlan, 
  subscriptionStatus,
  onPlanChange 
}) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('manage');
  
  // Sync status bar with modal state
  useModalStatusBar(isDark, isOpen);
  
  // Debug logging
  const [isLoading, setIsLoading] = useState(false);
  const [featureRequest, setFeatureRequest] = useState('');
  const [isSubmittingFeature, setIsSubmittingFeature] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      // Get upgrade options using pricing service
      const upgradeOptions = PricingService.getUpgradeOptions(currentPlan);
      const targetPlan = upgradeOptions.upgradeTo;

      // Create checkout session for upgrade
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          planId: targetPlan,
          mode: 'subscription',
          successUrl: `${window.location.origin}/profile?success=true`,
          cancelUrl: `${window.location.origin}/profile?canceled=true`
        })
      });

      const { sessionId } = await response.json();
      if (sessionId) {
        // Redirect to Stripe checkout using the session ID
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
      }
    } catch (error) {
      console.error('Error creating upgrade session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      // Call cancel subscription API
      const response = await fetch('/api/subscriptions/cancel-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Trigger refresh service
        await RefreshService.handleBillingAction('cancel', true);
        
        // Refresh user data
        if (onPlanChange) {
          onPlanChange();
        }
        onClose();
      } else {
        console.error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setIsCanceling(false);
      setCancelConfirm(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      const response = await fetch('/api/subscriptions/reactivate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Trigger refresh service
        await RefreshService.handleBillingAction('reactivate', true);
        
        // Refresh user data
        if (onPlanChange) {
          onPlanChange();
        }
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to reactivate subscription:', errorData.error);
        alert(`Failed to reactivate subscription: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      alert('Error reactivating subscription. Please try again.');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleFeatureRequest = async (e) => {
    e.preventDefault();
    if (!featureRequest.trim()) return;

    setIsSubmittingFeature(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      // Send feature request email
      const response = await fetch('/api/contact/feature-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: featureRequest
        })
      });

      if (response.ok) {
        setFeatureRequest('');
        alert('Feature request submitted successfully!');
      } else {
        console.error('Failed to submit feature request');
      }
    } catch (error) {
      console.error('Error submitting feature request:', error);
    } finally {
      setIsSubmittingFeature(false);
    }
  };

  // Use pricing service for all plan-related logic
  const getPlanDisplayName = (plan) => {
    return PricingService.getPlanDisplayName(plan);
  };

  const upgradeOptions = PricingService.getUpgradeOptions(currentPlan);

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
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="about-devello-glass relative w-full max-w-2xl max-h-[100vh] overflow-y-auto rounded-[3rem] sm:rounded-[2.5rem]"
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.1)',
                borderWidth: '1px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
          {/* Header */}
          <div className={`p-4 px-6 border-b ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-semibold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Manage Subscription
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ y: 2, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={onClose}
                className={`p-2 rounded-full transition-all duration-300 ${
                  isDark 
                    ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            {/* Current Plan Display */}
            <div 
              className="about-devello-glass mt-4 p-4 rounded-[2.5rem] sm:rounded-2xl"
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(255, 255, 255, 0.5)',
                borderColor: isDark 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(0, 0, 0, 0.1)',
                borderWidth: '1px'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}>Current Plan</p>
                  <p className={`text-lg font-semibold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {getPlanDisplayName(currentPlan)}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                    subscriptionStatus === 'canceled' 
                      ? isDark 
                        ? 'bg-red-500/20 text-red-300 border border-red-400/30' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                      : isDark 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {subscriptionStatus === 'canceled' ? 'Canceling' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`border-b ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}>
            <nav className="flex">
              <motion.button
                whileTap={{ y: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setActiveTab('manage')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'manage'
                    ? isDark 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : isDark 
                      ? 'text-white/60 hover:text-white/80' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Subscription
              </motion.button>
              <motion.button
                whileTap={{ y: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => setActiveTab('features')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'features'
                    ? isDark 
                      ? 'text-blue-400 border-b-2 border-blue-400' 
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : isDark 
                      ? 'text-white/60 hover:text-white/80' 
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Features
              </motion.button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 px-6">
            {activeTab === 'manage' && (
              <div className="flex flex-wrap gap-4 justify-center items-stretch">
                {/* Upgrade Section */}
                {upgradeOptions.canUpgrade ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="about-devello-glass group relative p-4 rounded-[2.5rem] sm:rounded-[2rem] transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-1 min-w-[260px] max-w-[300px]"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: isDark 
                        ? 'rgba(59, 130, 246, 0.15)' 
                        : 'rgba(59, 130, 246, 0.2)',
                      borderColor: isDark 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : 'rgba(59, 130, 246, 0.3)',
                      borderWidth: '1px'
                    }}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                        <span className={`text-2xl font-bold ${
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        }`}>
                          {upgradeOptions.price?.displayPrice || '$0.00'}
                        </span>
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {upgradeOptions.upgradeText}
                      </h3>
                      <p className={`text-sm ${
                        isDark ? 'text-white/70' : 'text-gray-600'
                      }`}>
                        {upgradeOptions.upgradeDescription}
                      </p>
                    </div>
                  </motion.button>
                ) : (
                  <div 
                    className="about-devello-glass p-4 rounded-[2.5rem] sm:rounded-[2rem] flex-1 min-w-[260px] max-w-[300px]"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: isDark 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(255, 255, 255, 0.5)',
                      borderColor: isDark 
                        ? 'rgba(255, 255, 255, 0.15)' 
                        : 'rgba(0, 0, 0, 0.1)',
                      borderWidth: '1px'
                    }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getPlanDisplayName(currentPlan)}
                      </h3>
                      <p className={`text-sm ${
                        isDark ? 'text-white/70' : 'text-gray-600'
                      }`}>
                        {upgradeOptions.upgradeText}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reactivate Section - Only show for canceled subscriptions */}
                {subscriptionStatus === 'canceled' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={handleReactivateSubscription}
                    disabled={isReactivating}
                    className="about-devello-glass group relative p-4 rounded-[2.5rem] sm:rounded-[2rem] transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-1 min-w-[260px] max-w-[300px]"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: isDark 
                        ? 'rgba(34, 197, 94, 0.15)' 
                        : 'rgba(34, 197, 94, 0.2)',
                      borderColor: isDark 
                        ? 'rgba(34, 197, 94, 0.3)' 
                        : 'rgba(34, 197, 94, 0.3)',
                      borderWidth: '1px'
                    }}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-green-400' : 'text-green-600'
                        }`}>
                          Resume
                        </span>
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Reactivate Subscription
                      </h3>
                      <p className={`text-sm ${
                        isDark ? 'text-white/70' : 'text-gray-600'
                      }`}>
                        Continue your subscription and resume billing
                      </p>
                    </div>
                  </motion.button>
                )}

                {/* Cancel Section - Only show for active subscriptions */}
                {subscriptionStatus !== 'canceled' && (
                  <>
                    {!cancelConfirm ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ y: 2, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        onClick={() => setCancelConfirm(true)}
                        className="about-devello-glass group relative p-4 rounded-[2rem] transition-all duration-300 hover:shadow-lg flex-1 min-w-[260px] max-w-[300px]"
                        style={{
                          backdropFilter: 'blur(2px)',
                          WebkitBackdropFilter: 'blur(2px)',
                          backgroundColor: isDark 
                            ? 'rgba(239, 68, 68, 0.15)' 
                            : 'rgba(239, 68, 68, 0.2)',
                          borderColor: isDark 
                            ? 'rgba(239, 68, 68, 0.3)' 
                            : 'rgba(239, 68, 68, 0.3)',
                          borderWidth: '1px'
                        }}
                      >
                        <div className="text-left">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <span className={`text-sm font-medium ${
                              isDark ? 'text-red-400' : 'text-red-600'
                            }`}>
                              End
                            </span>
                          </div>
                          <h3 className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            Cancel Subscription
                          </h3>
                          <p className={`text-sm ${
                            isDark ? 'text-white/70' : 'text-gray-600'
                          }`}>
                            End your subscription and return to free plan
                          </p>
                        </div>
                      </motion.button>
                    ) : (
                  <div 
                    className="about-devello-glass p-4 rounded-[2rem] w-full"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: isDark 
                        ? 'rgba(239, 68, 68, 0.1)' 
                        : 'rgba(239, 68, 68, 0.15)',
                      borderColor: isDark 
                        ? 'rgba(239, 68, 68, 0.3)' 
                        : 'rgba(239, 68, 68, 0.3)',
                      borderWidth: '1px'
                    }}
                  >
                    <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        Confirm Cancellation
                      </h3>
                      <p className={`text-sm ${
                        isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <motion.button
                      whileTap={{ y: 2, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={handleCancelSubscription}
                      disabled={isCanceling}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-[2.5rem] sm:rounded-2xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCanceling ? 'Canceling...' : 'Yes, Cancel'}
                    </motion.button>
                    <motion.button
                      whileTap={{ y: 2, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      onClick={() => setCancelConfirm(false)}
                      className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-[2.5rem] sm:rounded-2xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Keep Subscription
                    </motion.button>
                  </div>
                </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div 
                    className="about-devello-glass w-16 h-16 rounded-[2.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4"
                    style={{
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      backgroundColor: isDark 
                        ? 'rgba(59, 130, 246, 0.2)' 
                        : 'rgba(59, 130, 246, 0.2)',
                      borderColor: isDark 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : 'rgba(59, 130, 246, 0.3)',
                      borderWidth: '1px'
                    }}
                  >
                    <svg className={`w-8 h-8 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Request New Features
                  </h3>
                  <p className={`${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    Share your ideas to help us improve Devello Inc
                  </p>
                </div>

                <form onSubmit={handleFeatureRequest} className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`}>
                      Feature Request
                    </label>
                    <textarea
                      value={featureRequest}
                      onChange={(e) => setFeatureRequest(e.target.value)}
                      placeholder="Describe the feature you'd like to see..."
                      rows={4}
                      className="about-devello-glass w-full px-3 py-2 rounded-[2.5rem] sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      style={{
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                        backgroundColor: isDark 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(255, 255, 255, 0.5)',
                        borderColor: isDark 
                          ? 'rgba(255, 255, 255, 0.2)' 
                          : 'rgba(0, 0, 0, 0.1)',
                        borderWidth: '1px',
                        color: isDark ? 'white' : 'rgb(17, 24, 39)'
                      }}
                      required
                    />
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ y: 2, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    type="submit"
                    disabled={isSubmittingFeature || !featureRequest.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-[2.5rem] sm:rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isSubmittingFeature ? 'Submitting...' : 'Submit Feature Request'}
                  </motion.button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      </>
      )}
    </AnimatePresence>
  );
}
