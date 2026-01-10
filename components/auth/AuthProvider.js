import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import the shared Supabase client and enhanced session manager
import { getSupabase } from '../../lib/supabaseClient';
import { authSessionManager } from '../../lib/authSessionManager';
import { sessionManager } from '../../lib/sessionManager';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [supabase, setSupabase] = useState(null);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      console.error('Supabase client initialization failed. Check environment variables:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      });
      setLoading(false);
      return;
    }
    
    setSupabase(client);

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await client.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Dispatch custom event for immediate upload stats refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { event, userId: session?.user?.id }
          }));
        }
        
        // If we're returning from a redirect and have a session, ensure it's properly set
        if (event === 'SIGNED_IN' && session) {
          // Add a small delay to ensure session is fully established
          setTimeout(() => {
          }, 500);
        }
        
        // Handle session restoration after redirects
        if (event === 'INITIAL_SESSION' && session) {
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async ({ email, password, metadata = {}, redirectPath = null }) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    // Get the base URL for email confirmation redirect
    // ALWAYS use current origin - never default to develloinc.com
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || '');
    
    // Build redirect URL - default to auth callback, or use provided redirect path
    const emailRedirectTo = redirectPath 
      ? `${baseUrl}${redirectPath}`
      : `${baseUrl}/auth/callback`;
    
    console.log('[AUTH_PROVIDER] Signing up user', {
      email,
      emailRedirectTo,
      baseUrl,
      hasRedirectPath: !!redirectPath
    });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: emailRedirectTo
      }
    });
    
    if (error) {
      console.error('[AUTH_PROVIDER] Sign-up error:', {
        error: error.message,
        code: error.code,
        status: error.status
      });
    } else {
      console.log('[AUTH_PROVIDER] Sign-up successful', {
        userId: data.user?.id,
        email: data.user?.email,
        hasSession: !!data.session,
        emailConfirmed: !!data.user?.email_confirmed_at,
        emailSent: !data.session // If no session, email confirmation was sent
      });
    }
    
    return { data, error };
  };

  const signIn = async ({ email, password }) => {
    if (!supabase) {
      console.error('Sign-in failed: Supabase client not initialized');
      return { data: null, error: new Error('Supabase client not initialized') };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase sign-in error:', {
          error,
          error_code: error.error_code,
          code: error.code,
          msg: error.msg,
          message: error.message,
          status: error.status
        });
      }
      
      return { data, error };
    } catch (err) {
      console.error('Sign-in exception:', err);
      return { 
        data: null, 
        error: {
          message: err.message || 'An unexpected error occurred',
          code: err.code || 500,
          error_code: 'unexpected_failure'
        }
      };
    }
  };

  const signOut = async () => {
    try {
      // Use enhanced session manager for better sign out
      // This will work even if Supabase client is not initialized
      const result = await authSessionManager.signOut();
      
      // Force clear user state regardless of Supabase response
      setUser(null);
      setSession(null);
      
      return result;
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear user state even on error
      setUser(null);
      setSession(null);
      return { error };
    }
  };

  const resendConfirmationEmail = async (email) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    // Get the base URL for email confirmation redirect
    // ALWAYS use current origin - never default to develloinc.com
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || '');
    
    const emailRedirectTo = `${baseUrl}/auth/callback`;
    
    console.log('[AUTH_PROVIDER] Resending confirmation email', {
      email,
      emailRedirectTo
    });
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: emailRedirectTo
      }
    });
    
    if (error) {
      console.error('[AUTH_PROVIDER] Resend confirmation error:', {
        error: error.message,
        code: error.code
      });
    } else {
      console.log('[AUTH_PROVIDER] Confirmation email resent successfully');
    }
    
    return { data, error };
  };

  const resetPassword = async (email) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  };

  const updatePassword = async (password) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    return { data, error };
  };

  const signInWithGoogle = async (options = {}) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized') };
    
    try {
      // Use enhanced session manager for better Google OAuth experience
      // Pass through all options including redirectPath
      const result = await authSessionManager.signInWithGoogle(options);
      return result;
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { data: null, error };
    }
  };

  const signInWithGoogleWithAccountSelection = async () => {
    return signInWithGoogle({ forceAccountSelection: true });
  };

  const signInWithGoogleWithConsent = async () => {
    return signInWithGoogle({ forceConsent: true });
  };

  const getAuthHeaders = async () => {
    return await sessionManager.getAuthHeaders();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signInWithGoogleWithAccountSelection,
    signInWithGoogleWithConsent,
    resendConfirmationEmail,
    getAuthHeaders,
    supabase
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
