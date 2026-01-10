import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useTheme } from './Layout';
import { useAuth } from './auth/AuthProvider';
import { useToolStateManager } from './contexts/ToolStateManager';

export default function CentralizedUploadCounter({ 
  className = "",
  compact = false 
}) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const toolStateManager = useToolStateManager();
  const [isClient, setIsClient] = useState(false);
  // Compute minimal stats early so hooks don't become conditional
  const earlyStats = toolStateManager?.getUploadStats?.() || null;
  const earlyRemaining = earlyStats?.remaining || 0;
  const earlyIsAtLimit = earlyRemaining <= 0;
  
  // Get upload stats from ToolStateManager with error handling
  const uploadStats = toolStateManager?.getUploadStats?.() || null;
  const loading = toolStateManager?.getUploadStatsLoading?.() || false;
  const error = toolStateManager?.getUploadStatsError?.() || null;
  
  // 🔍 DEBUG: Upload counter debugging - only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [UPLOAD_COUNTER_DEBUG] Component state:', {
        user: user ? { id: user.id, email: user.email } : null,
        uploadStats: uploadStats ? {
          uploadCount: uploadStats.uploadCount,
          uploadLimit: uploadStats.uploadLimit,
          remaining: uploadStats.remaining,
          planType: uploadStats.planType,
        subscriptionStatus: uploadStats.subscriptionStatus
      } : null,
      loading,
      error: error ? error.message : null,
      toolStateManager: !!toolStateManager
    });
    }
  }, [user, uploadStats, loading, error, toolStateManager]);
  
  
  // Handle SSR - ensure we're on client before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render until client-side to prevent hydration issues
  if (!isClient) {
    return null;
  }

  // Don't render if ToolStateManager is not available
  if (!toolStateManager) {
    return null;
  }

  // Don't show anything for signed-in users if we have no data yet (prevents guest UI flash)
  if (user && (!uploadStats || loading)) {
    return null;
  }
  
  // Use upload stats from ToolStateManager
  const uploadData = uploadStats ? {
    remaining: uploadStats.remaining || 0,
    limit: uploadStats.uploadLimit || 5,
    used: uploadStats.uploadCount || 0,
    oneTimeCredits: uploadStats.oneTimeCredits || 0,
    planType: uploadStats.planType || 'free'
  } : {
    remaining: 0,
    limit: 10,
    used: 0,
    oneTimeCredits: 0,
    planType: 'free'
  };
  
  const { remaining: remainingUploads, limit: actualUploadLimit, used, oneTimeCredits, planType } = uploadData;
  const isAdmin = planType === 'admin' || actualUploadLimit === Infinity || remainingUploads === Infinity;
  const isAtLimit = !isAdmin && remainingUploads <= 0;
  
  // Check if we're on the profile page
  const isProfilePage = router.pathname === '/profile';

  // Show error state only if we have no cached data
  if (error && !uploadStats) {
    return (
      <motion.div
        className={`w-full max-w-md mx-auto rounded-lg p-0 transition-all duration-300 ${
          isDark 
            ? 'bg-red-500/10 text-red-400' 
            : 'bg-red-50 text-red-700'
        } ${className}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm">Upload status unavailable</span>
        </div>
      </motion.div>
    );
  }


  return (
    <>
      <motion.div
        className={`w-full max-w-48 mx-auto rounded-lg p-0 transition-all duration-300 ${
          isDark
            ? 'text-white/70'
            : 'text-gray-600'
        } ${loading ? 'opacity-75' : ''} ${className}`}
      >
        <div className="flex items-center justify-center gap-2">
          {!isProfilePage && (
            <span className="text-sm font-medium whitespace-nowrap">
              {compact ? 'Sessions' : 'Sessions Remaining'}
            </span>
          )}
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isAtLimit ? (isDark ? 'text-red-400' : 'text-red-700') : ''}`}>
              {isAdmin ? (
                <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                  Unlimited
                </span>
              ) : (
                <>
                  {remainingUploads}/{actualUploadLimit}
                  {!isProfilePage && planType !== 'free' && planType !== 'guest' && (
                    <span className="text-xs text-blue-400 ml-1">
                      ({planType})
                    </span>
                  )}
                </>
              )}
            </span>
            {loading && (
              <div className="flex items-center">
                <div className={`animate-spin rounded-full h-3 w-3 border-b border-current ${
                  isDark ? 'border-white/60' : 'border-gray-600'
                }`}></div>
              </div>
            )}
          </div>
        </div>

      </motion.div>

    </>
  );
}
