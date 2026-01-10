import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabase } from '../../lib/supabaseClient';
import { authSessionManager } from '../../lib/authSessionManager';

// Helper to detect domain type
function getDomainInfo() {
  if (typeof window === 'undefined') return { isStudios: false, isTech: false, isStandalone: false };
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Production domains
  const isStudiosDomain = hostname.includes('devellostudios.com');
  const isTechDomain = hostname.includes('devellotech.com');
  
  // Localhost development (port-based)
  const isLocalhostStudios = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3001';
  const isLocalhostTech = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3002';
  
  const isStudios = isStudiosDomain || isLocalhostStudios;
  const isTech = isTechDomain || isLocalhostTech;
  const isStandalone = isStudios || isTech;
  
  return { isStudios, isTech, isStandalone, hostname, port };
}

// Helper to get default redirect for domain type
function getDefaultRedirect(domainInfo, storedRedirect, wasExpandedViewOpen) {
  // If there's a stored redirect (user was on a specific page), use it
  if (storedRedirect && storedRedirect !== '/') {
    return storedRedirect;
  }
  
  // For studios domain, default to profile with studios tab
  // This ensures studios users land on their studios-specific profile
  if (domainInfo.isStudios) {
    // If they were on a tool page, stay there
    if (storedRedirect && (storedRedirect.includes('/lighting') || 
        storedRedirect.includes('/general-edit') || 
        storedRedirect.includes('/assisted-edit'))) {
      return storedRedirect;
    }
    // Otherwise go to profile with studios tab
    return '/profile?tab=studios';
  }
  
  // For tech domain
  if (domainInfo.isTech) {
    return '/';
  }
  
  // For main domain with expanded view
  if (wasExpandedViewOpen) {
    return '/?expanded=true';
  }
  
  return '/';
}

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          console.error('Supabase client not available. Check environment variables:', {
            hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          });
          router.push('/?auth_error=client_unavailable');
          return;
        }
        
        setStatus('Processing authentication...');
        
        // Get domain info early for consistent handling
        const domainInfo = getDomainInfo();
        console.log('[AUTH_CALLBACK] Domain detection:', domainInfo);
        
        // Handle query parameters for auth code (authorization code flow)
        const { code, error: authError, error_description } = router.query;
        
        if (authError) {
          console.error('Auth error from query params:', {
            error: authError,
            description: error_description,
            fullQuery: router.query
          });
          router.push(`/?auth_error=${authError}${error_description ? `&desc=${encodeURIComponent(error_description)}` : ''}`);
          return;
        }
        
        if (code) {
          setStatus('Exchanging code for session...');
          
          try {
            // Exchange the authorization code for a session
            console.log('Exchanging code for session...', { codeLength: code?.length });
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Code exchange error:', {
                error,
                message: error.message,
                status: error.status,
                error_code: error.error_code,
                code: error.code,
                url: window.location.href
              });
              
              // Provide more specific error messages
              let errorParam = 'code_exchange_failed';
              if (error.message?.includes('expired') || error.message?.includes('invalid')) {
                errorParam = 'code_expired';
              } else if (error.status === 500 || error.code === 500) {
                errorParam = 'server_error';
              }
              
              router.push(`/?auth_error=${errorParam}&details=${encodeURIComponent(error.message || 'Unknown error')}`);
              return;
            }
            
            if (data.session) {
              setStatus('Authentication successful!');
              
              // Use enhanced session manager to handle the callback
              await authSessionManager.handleOAuthCallback();
              
              // Get stored redirect info
              const queryRedirect = router.query.redirect;
              const applyNowRedirect = typeof window !== 'undefined' 
                ? sessionStorage.getItem('partners_redirect_path') 
                : null;
              const storedRedirect = typeof window !== 'undefined' 
                ? sessionStorage.getItem('oauth_redirect_page') 
                : null;
              const wasExpandedViewOpen = typeof window !== 'undefined' 
                ? sessionStorage.getItem('expanded_view_open') === 'true'
                : false;
              const isApplyNow = typeof window !== 'undefined' 
                ? sessionStorage.getItem('apply_now_redirect') === 'true'
                : false;
              
              // Determine redirect path with domain awareness
              let redirectPath;
              if (queryRedirect) {
                redirectPath = queryRedirect;
              } else if (isApplyNow && applyNowRedirect) {
                redirectPath = applyNowRedirect;
              } else {
                // Use domain-aware default redirect
                redirectPath = getDefaultRedirect(domainInfo, storedRedirect, wasExpandedViewOpen);
              }
              
              console.log('[AUTH_CALLBACK] Redirect decision:', {
                domainInfo,
                queryRedirect,
                storedRedirect,
                isApplyNow,
                finalRedirect: redirectPath
              });
              
              // Clear stored redirects after use
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('oauth_redirect_page');
                sessionStorage.removeItem('oauth_original_origin');
                sessionStorage.removeItem('oauth_current_domain');
                sessionStorage.removeItem('partners_redirect_path');
                sessionStorage.removeItem('apply_now_redirect');
                sessionStorage.removeItem('expanded_view_open');
              }
              
              // For standalone domains (studios/tech), ALWAYS stay on current domain
              // This prevents any accidental cross-domain redirects
              if (domainInfo.isStandalone) {
                console.log('[AUTH_CALLBACK] Standalone domain - staying on:', window.location.origin, 'redirect:', redirectPath);
                router.replace(redirectPath);
                return;
              }
              
              // For main domain, handle expanded view specially
              if (wasExpandedViewOpen && redirectPath === '/?expanded=true') {
                window.location.replace(redirectPath);
              } else {
                router.replace(redirectPath);
              }
              return;
            } else {
              console.error('No session in response');
              router.push('/?auth_error=no_session');
              return;
            }
          } catch (exchangeError) {
            console.error('Code exchange failed:', exchangeError);
            router.push('/?auth_error=code_exchange_failed');
            return;
          }
        }
        
        // Fallback: try to get existing session
        setStatus('Checking existing session...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/?auth_error=callback_failed');
          return;
        }

        if (data.session) {
          setStatus('Session found!');
          
          // Get stored redirect info
          const queryRedirect = router.query.redirect;
          const applyNowRedirect = typeof window !== 'undefined' 
            ? sessionStorage.getItem('partners_redirect_path') 
            : null;
          const storedRedirect = typeof window !== 'undefined' 
            ? sessionStorage.getItem('oauth_redirect_page') 
            : null;
          const wasExpandedViewOpen = typeof window !== 'undefined' 
            ? sessionStorage.getItem('expanded_view_open') === 'true'
            : false;
          const isApplyNow = typeof window !== 'undefined' 
            ? sessionStorage.getItem('apply_now_redirect') === 'true'
            : false;
          
          // Determine redirect path with domain awareness
          let redirectPath;
          if (queryRedirect) {
            redirectPath = queryRedirect;
          } else if (isApplyNow && applyNowRedirect) {
            redirectPath = applyNowRedirect;
          } else {
            // Use domain-aware default redirect
            redirectPath = getDefaultRedirect(domainInfo, storedRedirect, wasExpandedViewOpen);
          }
          
          console.log('[AUTH_CALLBACK] Fallback redirect decision:', {
            domainInfo,
            queryRedirect,
            storedRedirect,
            isApplyNow,
            finalRedirect: redirectPath
          });
          
          // Clear stored redirects after use
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('oauth_redirect_page');
            sessionStorage.removeItem('oauth_original_origin');
            sessionStorage.removeItem('oauth_current_domain');
            sessionStorage.removeItem('partners_redirect_path');
            sessionStorage.removeItem('apply_now_redirect');
            sessionStorage.removeItem('expanded_view_open');
          }
          
          // For standalone domains (studios/tech), ALWAYS stay on current domain
          if (domainInfo.isStandalone) {
            console.log('[AUTH_CALLBACK] Standalone domain (fallback) - staying on:', window.location.origin, 'redirect:', redirectPath);
            router.replace(redirectPath);
            return;
          }
          
          // For main domain, handle expanded view specially
          if (wasExpandedViewOpen && redirectPath === '/?expanded=true') {
            window.location.replace(redirectPath);
          } else {
            router.replace(redirectPath);
          }
        } else {
          setStatus('No session found');
          router.push('/?auth_error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('Error occurred');
        router.push('/?auth_error=callback_failed');
      }
    };

    if (router.isReady) {
      handleAuthCallback();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
