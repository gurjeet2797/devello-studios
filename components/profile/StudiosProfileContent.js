import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from '../Layout';
import CentralizedUploadCounter from '../CentralizedUploadCounter';
import { PricingService } from '../../lib/pricingService';

/**
 * Studios Profile Content - Shows subscription, upload stats, and studios-related payments
 */
export default function StudiosProfileContent({
  userData,
  subscription,
  userUploadStats,
  onShowSubscriptionModal,
  onShowBillingModal
}) {
  const { isDark } = useTheme();

  // Generate subscription payment history
  const paymentHistory = userUploadStats?.purchases || [];
  
  const generateSubscriptionPayments = () => {
    const payments = [];
    
    if (subscription?.status === 'active' || subscription?.status === 'canceled') {
      const subscriptionPayment = PricingService.generateSubscriptionPayment(subscription);
      if (subscriptionPayment) {
        payments.push(subscriptionPayment);
      }
    }
    
    if (paymentHistory.length > 0) {
      payments.push(...paymentHistory);
    }
    
    return payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  
  const subscriptionPayments = generateSubscriptionPayments();
  const hasPayments = subscriptionPayments.length > 0;

  const formatCurrency = (amount, currency) => {
    if (typeof amount !== 'number') return '-';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: (currency || 'usd').toUpperCase()
      }).format(amount / 100);
    } catch (error) {
      return `$${(amount / 100).toFixed(2)}`;
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const formatPurchaseType = (type) => {
    if (!type) return 'One-time Purchase';
    if (type === 'subscription') return 'Subscription';
    if (type === 'single_upload') return 'Single Upload';
    return type.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

  const getStatusBadgeClass = (status) => {
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${baseClass} ${isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`;
      case 'pending':
        return `${baseClass} ${isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`;
      case 'refunded':
        return `${baseClass} ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`;
      case 'failed':
        return `${baseClass} ${isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`;
      default:
        return `${baseClass} ${isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700'}`;
    }
  };

  const formatUploadSummary = (purchase) => {
    const granted = purchase?.uploadsGranted ?? 0;
    const used = purchase?.uploadsUsed ?? 0;
    const remainingCredits = purchase?.remainingUploads ?? Math.max(0, granted - used);
    if (!granted) return 'No upload credits';
    return `${used}/${granted} used • ${remainingCredits} remaining`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Subscription Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="about-devello-glass rounded-2xl p-4 sm:p-6 border"
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
      >
        <h3 className={`text-lg sm:text-xl font-light mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Subscription Status
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`${isDark ? 'text-white/80' : 'text-gray-700'}`}>Plan</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {subscription?.plan_type === 'free' ? 'Free' : subscription?.plan_type?.charAt(0).toUpperCase() + subscription?.plan_type?.slice(1)}
            </span>
          </div>
          
          {/* Sessions Remaining Counter */}
          <div className="flex items-center justify-between">
            <span className={`${isDark ? 'text-white/80' : 'text-gray-700'}`}>Sessions Remaining</span>
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <CentralizedUploadCounter showText={false} />
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm sm:text-base ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Status</span>
            <span className={`px-2 py-1 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm ${
              subscription?.status === 'active'
                ? isDark 
                  ? 'bg-green-500/25 text-green-300 border border-green-400/40' 
                  : 'bg-green-100/80 text-green-800 border border-green-200/60'
                : subscription?.status === 'canceled'
                ? isDark 
                  ? 'bg-red-500/25 text-red-300 border border-red-400/40' 
                  : 'bg-red-100/80 text-red-800 border border-red-200/60'
                : isDark 
                  ? 'bg-gray-500/25 text-gray-300 border border-gray-400/40' 
                  : 'bg-gray-100/80 text-gray-800 border border-gray-200/60'
            }`}
            style={{
              backdropFilter: 'blur(4px) saturate(150%)',
              WebkitBackdropFilter: 'blur(4px) saturate(150%)',
            }}
            >
              {subscription?.status === 'active' ? 'Active' : 
               subscription?.status === 'canceled' ? 'Canceling' : 'Inactive'}
            </span>
          </div>

          {subscription?.current_period_end && (
            <div className="flex items-center justify-between">
              <span className={`${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                {subscription?.status === 'canceled' ? 'Access until' : 'Next billing'}
              </span>
              <span className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>
          )}

          {subscription?.status === 'canceled' && (
            <div className="mt-3 p-3 bg-red-50/80 dark:bg-red-500/15 border border-red-200/60 dark:border-red-500/30 rounded-2xl backdrop-blur-sm"
            style={{
              backdropFilter: 'blur(4px) saturate(150%)',
              WebkitBackdropFilter: 'blur(4px) saturate(150%)',
            }}
            >
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>Subscription Canceling:</strong> Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}. 
                You&apos;ll retain access to premium features until then.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-white/10">
            {subscription?.status === 'active' || subscription?.status === 'canceled' ? (
              <motion.button
                whileTap={{ y: 2, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={onShowBillingModal}
                className="about-devello-glass w-full px-4 py-2 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300"
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
              >
                Manage Billing
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ y: 2, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={onShowSubscriptionModal}
                className="about-devello-glass w-full px-4 py-2 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300"
                style={{
                  backdropFilter: 'blur(2px)',
                  WebkitBackdropFilter: 'blur(2px)',
                  backgroundColor: isDark 
                    ? 'rgba(37, 99, 235, 0.6)' 
                    : 'rgba(37, 99, 235, 0.8)',
                  borderColor: isDark 
                    ? 'rgba(59, 130, 246, 0.4)' 
                    : 'rgba(37, 99, 235, 0.3)',
                  borderWidth: '1px',
                  color: 'white'
                }}
              >
                Upgrade Plan
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Uploads */}
      {userUploadStats?.recentUploads && userUploadStats.recentUploads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="about-devello-glass rounded-2xl p-6 border"
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
        >
          <h3 className={`text-xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Recent Uploads
          </h3>
          
          <div className="space-y-3">
            {userUploadStats.recentUploads.slice(0, 5).map((upload) => (
              <div
                key={upload.id}
                className={`flex items-center justify-between p-3 rounded-2xl backdrop-blur-sm ${
                  isDark ? 'bg-white/10 border border-white/10' : 'bg-white/80 border border-gray-200/50'
                }`}
                style={{
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">📁</span>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {upload.file_name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      {upload.upload_type} • {new Date(upload.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  upload.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400'
                    : upload.status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
                }`}>
                  {upload.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Studios Payments & Credits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="about-devello-glass rounded-2xl p-6 border"
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
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Studios Payments & Credits
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Subscription payments, one-time purchases, and credit usage.
            </p>
          </div>
        </div>

        {hasPayments ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className={isDark ? 'bg-white/5' : 'bg-white'}>
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Date
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Type
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Amount
                  </th>
                  <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Upload Credits
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {subscriptionPayments.map((payment) => (
                  <tr key={payment.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                    <td className={`px-2 sm:px-4 py-3 text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      {formatDateTime(payment.createdAt)}
                    </td>
                    <td className={`px-2 sm:px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {payment.purchaseType === 'subscription' ? payment.description : formatPurchaseType(payment.purchaseType)}
                    </td>
                    <td className={`px-2 sm:px-4 py-3 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className={`hidden sm:table-cell px-2 sm:px-4 py-3 text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      {payment.purchaseType === 'subscription' ? 
                        `${PricingService.getUploadLimit(payment.planType)} uploads/month` : 
                        formatUploadSummary(payment)}
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className={getStatusBadgeClass(payment.status)}>
                        {formatStatus(payment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className={`mt-4 rounded-2xl border backdrop-blur-sm ${
              isDark
                ? 'border-white/20 bg-white/10 text-white/70'
                : 'border-gray-200/60 bg-white/70 text-gray-600'
            }`}
            style={{
              backdropFilter: 'blur(4px) saturate(150%)',
              WebkitBackdropFilter: 'blur(4px) saturate(150%)',
            }}
          >
            <div className="p-4 text-sm">
              <p>No studios transactions yet. Subscription and credit purchases will appear here.</p>
            </div>
          </div>
        )}

        <p className={`mt-4 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          Upload credits from successful payments are added instantly after Stripe confirms your transaction.
        </p>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="about-devello-glass rounded-2xl p-6 border"
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
      >
        <h3 className={`text-xl font-light mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/lighting">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">💡</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Lighting Tool
              </span>
            </motion.div>
          </Link>
          <Link href="/general-edit">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">✏️</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Image Editor
              </span>
            </motion.div>
          </Link>
          <Link href="/assisted-edit">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${
                isDark ? 'bg-white/10 hover:bg-white/15' : 'bg-white/80 hover:bg-white'
              }`}
            >
              <span className="text-2xl mb-2 block">🤖</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Assisted Edit
              </span>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

