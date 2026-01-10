import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { useTheme } from '../Layout';

export default function GoogleAuthButton({ 
  onSuccess, 
  onError, 
  showAccountOptions = false,
  className = '',
  children 
}) {
  const { signInWithGoogle, signInWithGoogleWithAccountSelection, signInWithGoogleWithConsent } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleGoogleSignIn = async (options = {}) => {
    setLoading(true);
    try {
      const { data, error } = await signInWithGoogle(options);
      
      if (error) {
        console.error('Google sign-in error:', error);
        onError?.(error);
      } else {
        onSuccess?.(data);
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelection = async () => {
    await handleGoogleSignIn({ forceAccountSelection: true });
  };

  const handleConsentFlow = async () => {
    await handleGoogleSignIn({ forceConsent: true });
  };

  const handleStandardSignIn = async () => {
    await handleGoogleSignIn();
  };

  if (showAccountOptions && showOptions) {
    return (
      <div className={`space-y-3 ${className}`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStandardSignIn}
          disabled={loading}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-[2rem] font-medium transition-all duration-300 ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAccountSelection}
          disabled={loading}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-[2rem] font-medium transition-all duration-300 ${
            isDark
              ? 'bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Choose Google Account
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConsentFlow}
          disabled={loading}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-[2rem] font-medium transition-all duration-300 ${
            isDark
              ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
          Re-authorize Google Account
        </motion.button>

        <button
          onClick={() => setShowOptions(false)}
          className={`w-full text-sm ${
            isDark ? 'text-white/60 hover:text-white/80' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Back to simple sign-in
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {showAccountOptions && !showOptions ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowOptions(true)}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-[2rem] font-medium transition-all duration-300 ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStandardSignIn}
          disabled={loading}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-[2rem] font-medium transition-all duration-300 ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {children || 'Continue with Google'}
            </>
          )}
        </motion.button>
      )}
    </div>
  );
}
