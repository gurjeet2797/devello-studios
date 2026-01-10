import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useTheme } from '../Layout';
import { useRouter } from 'next/router';
import GoogleAuthButton from './GoogleAuthButton';
import { Pacifico } from "next/font/google";
import { updateStatusBar } from '../../lib/useStatusBar';

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

export const AuthModal = ({ isOpen, onClose, defaultMode = 'signup', redirectPath = null, fromApplyNow = false, initialEmail = '' }) => {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signUp, signIn, signInWithGoogle, user, resendConfirmationEmail } = useAuth();
  const [resendingEmail, setResendingEmail] = useState(false);
  const { isDark } = useTheme();
  const router = useRouter();

  // Check if email is a Gmail or Google Workspace email
  const isGoogleEmail = (email) => {
    if (!email || !email.includes('@')) return false;
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === 'gmail.com' || domain === 'googlemail.com';
  };

  const showGoogleSignInPrompt = mode === 'signin' && isGoogleEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        const { data, error } = await signUp({ 
          email, 
          password,
          metadata: {
            created_at: new Date().toISOString()
          }
        });
        
        if (error) {
          // Parse Supabase error - it can have different structures
          let errorMessage = error.message || error.msg || 'Sign up failed';
          
          // Handle specific Supabase error codes
          if (error.error_code === 'unexpected_failure' || error.code === 500) {
            errorMessage = 'Server error. Please check your connection and try again. If the problem persists, contact support.';
            console.error('Supabase sign-up error:', {
              error,
              error_code: error.error_code,
              code: error.code,
              msg: error.msg,
              message: error.message
            });
          }
          
          setError(errorMessage);
        } else {
          // Check if email confirmation is required
          if (data?.user && !data?.session) {
            // User created but no session - email confirmation required
            setSuccess('Account created! Please check your email (including spam folder) for the confirmation link.');
            setMode('signin');
            console.log('[AUTH_MODAL] Sign-up successful, email confirmation required', {
              userId: data.user?.id,
              email: data.user?.email,
              emailConfirmed: data.user?.email_confirmed_at
            });
          } else if (data?.session) {
            // User created and session exists - email confirmation might be disabled
            setSuccess('Account created successfully!');
            onClose();
            console.log('[AUTH_MODAL] Sign-up successful with immediate session', {
              userId: data.user?.id,
              email: data.user?.email
            });
          } else {
            setSuccess('Check your email to confirm your account!');
            setMode('signin');
          }
        }
      } else {
        const { error, data } = await signIn({ email, password });
        
        if (error) {
          // Parse Supabase error - it can have different structures
          let errorMessage = error.message || error.msg || 'Sign in failed';
          
          // Handle specific Supabase error codes
          if (error.error_code === 'unexpected_failure' || error.code === 500) {
            errorMessage = 'Server error. Please check your connection and try again. If the problem persists, contact support.';
            console.error('Supabase sign-in error:', {
              error,
              error_code: error.error_code,
              code: error.code,
              msg: error.msg,
              message: error.message
            });
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setError(errorMessage);
        } else if (data?.session) {
          // Check if expanded view is open before closing modal
          // We'll keep the expanded view open by not reloading/redirecting
          const isExpandedViewOpen = typeof window !== 'undefined' && 
            (new URLSearchParams(window.location.search).get('expanded') === 'true' ||
             document.querySelector('[data-expanded-view]') !== null);
          
          if (isExpandedViewOpen) {
            // Store flag to keep expanded view open
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('expanded_view_open', 'true');
            }
          }
          
          onClose();
          // Determine redirect path: prioritize redirectPath prop, then check sessionStorage
          const finalRedirectPath = redirectPath || 
            (typeof window !== 'undefined' ? sessionStorage.getItem('partners_redirect_path') : null);
          
          // If expanded view is open, don't redirect - just close modal and let auth state update handle it
          if (isExpandedViewOpen && !finalRedirectPath) {
            // Don't redirect - just let the auth state change trigger partner refetch
            // Clear any stored redirects
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('partners_redirect_path');
            }
          } else if (finalRedirectPath) {
            // Redirect to specified path
            router.push(finalRedirectPath);
            // Clear stored redirect
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('partners_redirect_path');
            }
          }
        }
      }
    } catch (err) {
      console.error('Auth exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResendingEmail(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await resendConfirmationEmail(email);
      
      if (error) {
        setError(error.message || 'Failed to resend confirmation email. Please try again.');
      } else {
        setSuccess('Confirmation email sent! Please check your inbox (including spam folder).');
      }
    } catch (err) {
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  const resetForm = () => {
    setEmail(initialEmail || '');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    // Preserve email (either pre-filled or user-entered)
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      // Check if expanded view is open
      const isExpandedViewOpen = typeof window !== 'undefined' && 
        (new URLSearchParams(window.location.search).get('expanded') === 'true' ||
         document.querySelector('[data-expanded-view]') !== null);
      
      // Store expanded view state for OAuth callback
      if (isExpandedViewOpen && typeof window !== 'undefined') {
        sessionStorage.setItem('expanded_view_open', 'true');
      }
      
      // Determine the redirect path: prioritize redirectPath prop, then check sessionStorage, then default
      const finalRedirectPath = redirectPath || 
        (typeof window !== 'undefined' ? sessionStorage.getItem('partners_redirect_path') : null) ||
        '/partners';
      
      // Store the redirect path explicitly for the callback
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('oauth_redirect_page', finalRedirectPath);
        if (fromApplyNow) {
          sessionStorage.setItem('apply_now_redirect', 'true');
        }
      }
      
      // Pass redirectPath to Google sign-in so it's stored for callback
      const { error } = await signInWithGoogle({ redirectPath: finalRedirectPath });
      if (error) {
        setError(error.message);
      }
      // Note: Google OAuth will redirect, so we don't need to handle success here
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      setGoogleLoading(false);
    }
    // Don't set loading to false here - OAuth redirect will happen
  };

  const handleGoogleSuccess = () => {
    setGoogleLoading(false);
    onClose();
    // Redirect to partners page if specified
    if (redirectPath) {
      setTimeout(() => {
        router.push(redirectPath);
      }, 300);
    }
  };

  // Reset to signup mode when modal opens (encourage sign ups)
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode || 'signup');
      setEmail(initialEmail || ''); // Pre-fill email if provided
      setPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, defaultMode, initialEmail]);

  // Disable page scroll and add blur class when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('auth-modal-open');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('auth-modal-open');
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('auth-modal-open');
    };
  }, [isOpen]);

  // Apply backdrop filter to status bar when modal is open
  useEffect(() => {
    if (isOpen) {
      // Update status bar using centralized utility first
      updateStatusBar(isDark, { isModalOpen: true });
      
      // Match status bar styling to modal backdrop - apply with delays to ensure it persists
      const applyStatusBarBlur = () => {
        const statusBarArea = document.querySelector('.status-bar-area');
        if (statusBarArea) {
          // Force apply backdrop filter
          statusBarArea.style.setProperty('backdrop-filter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('-webkit-backdrop-filter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('backdropFilter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('WebkitBackdropFilter', 'blur(20px)', 'important');
          statusBarArea.style.setProperty('webkitBackdropFilter', 'blur(20px)', 'important');
          statusBarArea.style.backgroundColor = 'transparent';
          statusBarArea.style.background = 'transparent';
          statusBarArea.style.zIndex = '9998';
          // Height is handled by CSS class - matches homepage behavior
          // CSS will use env(safe-area-inset-top) directly, no minimum
          statusBarArea.classList.add('auth-modal-status-bar');
          
          // Debug log
          if (process.env.NODE_ENV !== 'production') {
            console.log('Status bar blur applied:', {
              backdropFilter: statusBarArea.style.backdropFilter,
              zIndex: statusBarArea.style.zIndex,
              height: statusBarArea.offsetHeight,
              display: window.getComputedStyle(statusBarArea).display
            });
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Status bar area element not found');
          }
        }
      };
      
      // Apply immediately and with delays
      applyStatusBarBlur();
      setTimeout(applyStatusBarBlur, 10);
      setTimeout(applyStatusBarBlur, 50);
      setTimeout(applyStatusBarBlur, 100);
      
      // Use MutationObserver to ensure our styles persist
      const observer = new MutationObserver(() => {
        const statusBarArea = document.querySelector('.status-bar-area');
        if (statusBarArea && statusBarArea.classList.contains('auth-modal-status-bar')) {
          const currentBlur = statusBarArea.style.backdropFilter || 
                             statusBarArea.style.getPropertyValue('backdrop-filter');
          if (!currentBlur || !currentBlur.includes('blur')) {
            applyStatusBarBlur();
          }
        }
      });
      
      const statusBarArea = document.querySelector('.status-bar-area');
      if (statusBarArea) {
        observer.observe(statusBarArea, {
          attributes: true,
          attributeFilter: ['style', 'class']
        });
      }
      
      return () => {
        observer.disconnect();
        updateStatusBar(isDark, { isModalOpen: false });
        const statusBarArea = document.querySelector('.status-bar-area');
        if (statusBarArea) {
          statusBarArea.style.zIndex = '';
          statusBarArea.classList.remove('auth-modal-status-bar');
        }
      };
    } else {
      // Restore status bar to normal state
      updateStatusBar(isDark, { isModalOpen: false });
      
      // Reset status bar styling
      const statusBarArea = document.querySelector('.status-bar-area');
      if (statusBarArea) {
        statusBarArea.style.zIndex = '';
        statusBarArea.classList.remove('auth-modal-status-bar');
      }
    }
  }, [isOpen, isDark]);

  // Handle redirect after successful Google sign-in
  useEffect(() => {
    if (user && redirectPath && isOpen) {
      // User just signed in, close modal and redirect
      const timer = setTimeout(() => {
        onClose();
        router.push(redirectPath);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, redirectPath, isOpen, onClose, router]);

  const handleGoogleError = (error) => {
    setGoogleLoading(false);
    setError(error.message || 'Failed to sign in with Google. Please try again.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={onClose}
            style={{ pointerEvents: 'auto' }}
          />
          
          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center px-6 sm:px-0 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-md max-h-[95vh] overflow-y-auto rounded-[2rem] border mx-4 sm:mx-0 pointer-events-auto ${isDark ? 'text-white' : 'text-black'}`}
              style={{
                background: isDark 
                  ? 'rgba(220, 220, 220, 0.2)' 
                  : 'rgba(220, 220, 220, 0.2)',
                borderColor: isDark 
                  ? 'rgba(200, 200, 200, 0.3)' 
                  : 'rgba(200, 200, 200, 0.3)',
                backdropFilter: 'blur(4px) saturate(150%)',
                WebkitBackdropFilter: 'blur(4px) saturate(150%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-8">
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 p-2 rounded-[2rem] transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'}`}
              >
                ✕
              </button>

              <div className="text-center mb-6">
              <h2 className={`text-2xl mb-2 ${pacifico.className} ${isDark ? 'text-white' : 'text-black'}`}>
                {mode === 'signup' ? 'Create Account' : 'Sign in to Devello'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {mode === 'signup' 
                  ? 'Build with Devello' 
                  : (() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return 'Good Morning!';
                    if (hour < 18) return 'Good Afternoon!';
                    return 'Good Evening!';
                  })()
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="email" className={isDark ? 'text-white' : 'text-black'}>Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error when email changes
                  }}
                  required
                  placeholder="your@email.com"
                  className="rounded-[2rem]"
                />
              </div>

              {/* Google Sign-In Prompt for Gmail users */}
              {showGoogleSignInPrompt && (
                <div className={`p-4 border rounded-[2rem] text-sm ${
                  isDark 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300' 
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-1">Use Google Sign-In instead</p>
                      <p className="text-xs opacity-90">
                        Since you're using a Gmail account, we recommend signing in with Google for faster access.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="password" className={isDark ? 'text-white' : 'text-black'}>Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="rounded-[2rem]"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <Label htmlFor="confirmPassword" className={isDark ? 'text-white' : 'text-black'}>Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="rounded-[2rem]"
                  />
                </div>
              )}

              {error && (
                <div className={`p-3 border rounded-[2rem] text-sm ${
                  isDark 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-600'
                }`}>
                  {error}
                </div>
              )}

              {success && (
                <div className={`p-3 border rounded-[2rem] text-sm ${
                  isDark 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-green-500/10 border-green-500/20 text-green-600'
                }`}>
                  <div className="space-y-2">
                    <p>{success}</p>
                    {success.includes('check your email') && mode === 'signin' && (
                      <button
                        type="button"
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail}
                        className={`text-xs underline hover:no-underline transition-all ${
                          resendingEmail ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {resendingEmail ? 'Sending...' : "Didn't receive it? Resend confirmation email"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={`w-full py-3 font-medium rounded-[2rem] ${
                  isDark
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${isDark ? 'border-black' : 'border-white'}`} />
                    {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                  </div>
                ) : (
                  mode === 'signup' ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center justify-center mb-6">
              <div className={`flex-1 border-t ${isDark ? 'border-white/20' : 'border-black/20'}`} />
              <span className={`px-3 text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {mode === 'signup' 
                  ? 'or continue with email' 
                  : 'or'
                }
              </span>
              <div className={`flex-1 border-t ${isDark ? 'border-white/20' : 'border-black/20'}`} />
            </div>

            {/* Google Sign-In Button */}
            <div className={`mb-6 ${showGoogleSignInPrompt ? 'ring-2 ring-blue-500/50 rounded-[2rem] p-1' : ''}`}>
              <GoogleAuthButton
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                showAccountOptions={false}
                className="w-full"
              />
            </div>

            {/* Sign In Option for Existing Users */}
            {mode === 'signup' && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`w-full py-3 font-medium rounded-[2rem] border transition-colors ${
                    isDark
                      ? 'bg-transparent border-white/30 text-white hover:bg-white/10'
                      : 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Sign in to Devello
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
                  className={`ml-1 font-medium ${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
};
