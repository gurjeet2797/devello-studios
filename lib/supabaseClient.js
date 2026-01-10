import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (for browser)
export const createSupabaseClient = () => {
  // For client-side, use NEXT_PUBLIC variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase configuration for client-side:', {
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseKey ? 'Set' : 'Missing'
    });
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

// Server-side Supabase client for user token verification (uses anon key)
// This is the correct way to verify user JWT tokens - anon key client can verify tokens
export const createSupabaseAuthClient = (accessToken = null) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Validate environment variables
  if (!supabaseUrl) {
    const error = new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
    console.error('❌ [SUPABASE_CLIENT] Missing Supabase URL:', {
      hasUrl: false,
      hasKey: !!supabaseKey,
      keyLength: supabaseKey?.length || 0,
      nodeEnv: process.env.NODE_ENV
    });
    throw error;
  }
  
  if (!supabaseKey) {
    const error = new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
    console.error('❌ [SUPABASE_CLIENT] Missing Supabase anon key:', {
      hasUrl: true,
      url: supabaseUrl,
      hasKey: false,
      nodeEnv: process.env.NODE_ENV
    });
    throw error;
  }
  
  // Validate URL format
  if (!supabaseUrl.includes('supabase.co')) {
    console.warn('⚠️ [SUPABASE_CLIENT] Supabase URL does not appear to be valid:', {
      url: supabaseUrl,
      expectedFormat: 'https://[project-id].supabase.co'
    });
  }
  
  // Validate key length (anon keys are typically 200+ characters)
  if (supabaseKey.length < 100) {
    console.warn('⚠️ [SUPABASE_CLIENT] Supabase anon key appears to be too short:', {
      keyLength: supabaseKey.length,
      expectedLength: '200+ characters'
    });
  }
  
  const options = {
    auth: {
      persistSession: false, // Disable session persistence for server-side
      autoRefreshToken: false // Disable auto-refresh for server-side
    }
  };
  
  // If token is provided, set it in global headers
  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  }
  
  let client;
  try {
    client = createClient(supabaseUrl, supabaseKey, options);
    
    // Verify client was created successfully
    if (!client) {
      throw new Error('Failed to create Supabase client - client is null');
    }
    
    // Verify client has auth property
    if (!client.auth) {
      throw new Error('Created Supabase client does not have auth property');
    }
    
    console.log('✅ [SUPABASE_CLIENT] Auth client created successfully:', {
      hasUrl: true,
      hasKey: true,
      urlLength: supabaseUrl.length,
      keyLength: supabaseKey.length,
      hasAccessToken: !!accessToken
    });
    
    return client;
  } catch (error) {
    console.error('❌ [SUPABASE_CLIENT] Error creating Supabase auth client:', {
      error: error.message,
      stack: error.stack,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl,
      keyLength: supabaseKey?.length || 0
    });
    throw error;
  }
};

// Server-side Supabase client (for admin operations and bypassing RLS)
// Use this ONLY for admin operations that need to bypass Row Level Security
export const createSupabaseServerClient = () => {
  // For server-side admin operations, we need the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 [SUPABASE_CLIENT] Creating server client (admin):', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl,
      keyLength: supabaseKey?.length || 0,
      nodeEnv: process.env.NODE_ENV
    });
  }
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration for server-side:', {
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseKey ? 'Set' : 'Missing',
      envVars: {
        hasNextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    throw new Error('Missing Supabase configuration for server-side (admin operations)');
  }
  
  const client = createClient(supabaseUrl, supabaseKey);
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ [SUPABASE_CLIENT] Server client created successfully (admin)');
  }
  return client;
};

// Singleton client instance to prevent multiple GoTrueClient instances
// Use a global window property to ensure true singleton across all domains
let supabaseInstance = null;

// Global key to store instance on window for cross-domain access
const SUPABASE_INSTANCE_KEY = '__devello_supabase_instance__';

export const getSupabase = () => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Check global window property first (for cross-domain singleton)
  if (typeof window !== 'undefined' && window[SUPABASE_INSTANCE_KEY]) {
    return window[SUPABASE_INSTANCE_KEY];
  }
  
  // Check module-level singleton
  if (supabaseInstance) {
    // Also store on window for cross-domain access
    if (typeof window !== 'undefined') {
      window[SUPABASE_INSTANCE_KEY] = supabaseInstance;
    }
    return supabaseInstance;
  }
  
  // For client-side, use NEXT_PUBLIC variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    const errorMsg = 'Missing Supabase environment variables for client-side. ' +
      'In production, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel.';
    console.error(errorMsg, {
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseKey ? 'Set' : 'Missing',
      nodeEnv: process.env.NODE_ENV,
      // In browser, we can't access process.env directly, but Next.js should inject NEXT_PUBLIC_ vars
      // This helps diagnose if the build process didn't include the vars
      hasWindow: typeof window !== 'undefined'
    });
    return null;
  }
  
  // Create single instance with proper localStorage handling
  // Use a shared storage key across all domains for cross-domain session sharing
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        // Use a shared storage key across all domains for cross-domain session sharing
        key: `supabase-auth-token-devello`,
        // Custom storage implementation to handle localStorage errors
        getItem: (key) => {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              return window.localStorage.getItem(key);
            }
            return null;
          } catch (error) {
            console.warn('localStorage.getItem failed:', error.message);
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem(key, value);
            }
          } catch (error) {
            console.warn('localStorage.setItem failed:', error.message);
          }
        },
        removeItem: (key) => {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.removeItem(key);
            }
          } catch (error) {
            console.warn('localStorage.removeItem failed:', error.message);
          }
        }
      }
    }
  });
  
  // Store on window for cross-domain singleton access
  if (typeof window !== 'undefined') {
    window[SUPABASE_INSTANCE_KEY] = supabaseInstance;
  }
  
  return supabaseInstance;
};

// Default export for backward compatibility
export default getSupabase;
