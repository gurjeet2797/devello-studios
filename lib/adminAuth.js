import { createSupabaseAuthClient } from './supabaseClient';

export const ADMIN_EMAILS = [
  'sales@develloinc.com',
  'sales@devello.us'
];

// Legacy export for backward compatibility
export const ADMIN_EMAIL = ADMIN_EMAILS[0];

export function isAdminEmail(email) {
  if (!email) return false;
  const emailLower = email.toLowerCase();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === emailLower);
}

/**
 * Verify environment variables are configured correctly
 * @returns {Object} { isValid: boolean, issues: string[] }
 */
function verifyEnvironmentVariables() {
  const issues = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is missing');
  } else if (!supabaseUrl.includes('supabase.co')) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL does not appear to be a valid Supabase URL');
  }

  if (!supabaseAnonKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
  } else if (supabaseAnonKey.length < 100) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be too short (should be ~200+ characters)');
  }

  return {
    isValid: issues.length === 0,
    issues,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0
  };
}

/**
 * Validate JWT token format (basic validation)
 * @param {string} token 
 * @returns {Object} { isValid: boolean, reason?: string }
 */
function validateTokenFormat(token) {
  if (!token) {
    return { isValid: false, reason: 'Token is empty' };
  }

  if (token.length < 10) {
    return { isValid: false, reason: 'Token is too short' };
  }

  // JWT tokens typically have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { isValid: false, reason: 'Token does not appear to be a valid JWT format' };
  }

  return { isValid: true };
}

export async function verifyAdminAccess(req) {
  const startTime = Date.now();
  
  try {
    // Step 1: Verify environment variables
    const envCheck = verifyEnvironmentVariables();
    if (!envCheck.isValid) {
      console.error('❌ [ADMIN_AUTH] Environment variables check failed:', {
        issues: envCheck.issues,
        hasUrl: envCheck.hasUrl,
        hasKey: envCheck.hasKey,
        urlLength: envCheck.urlLength,
        keyLength: envCheck.keyLength
      });
      return { 
        isAdmin: false, 
        error: 'Server configuration error. Please contact administrator.',
        details: envCheck.issues
      };
    }

    // Step 2: Get and validate authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.warn('⚠️ [ADMIN_AUTH] No authorization header provided');
      return { isAdmin: false, error: 'No authorization token provided' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.warn('⚠️ [ADMIN_AUTH] Authorization header does not start with "Bearer "');
      return { isAdmin: false, error: 'Invalid authorization header format. Expected "Bearer <token>"' };
    }

    // Step 3: Extract and validate token
    const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix
    
    const tokenValidation = validateTokenFormat(token);
    if (!tokenValidation.isValid) {
      console.warn('⚠️ [ADMIN_AUTH] Token format validation failed:', {
        reason: tokenValidation.reason,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      return { isAdmin: false, error: `Invalid token format: ${tokenValidation.reason}` };
    }

    // Step 4: Create Supabase client
    let supabase;
    try {
      supabase = createSupabaseAuthClient();
      if (!supabase) {
        console.error('❌ [ADMIN_AUTH] Failed to create Supabase client - client is null');
        return { isAdmin: false, error: 'Failed to initialize authentication service' };
      }
    } catch (clientError) {
      console.error('❌ [ADMIN_AUTH] Error creating Supabase client:', {
        error: clientError.message,
        stack: clientError.stack
      });
      return { isAdmin: false, error: 'Failed to initialize authentication service' };
    }
    
    // Step 5: Verify the token with Supabase
    let user, authError;
    try {
      const authResult = await supabase.auth.getUser(token);
      user = authResult.data?.user;
      authError = authResult.error;
    } catch (getUserError) {
      console.error('❌ [ADMIN_AUTH] Exception during getUser call:', {
        error: getUserError.message,
        stack: getUserError.stack
      });
      return { isAdmin: false, error: 'Authentication service error' };
    }
    
    if (authError) {
      console.error('❌ [ADMIN_AUTH] Supabase auth error:', {
        error: authError.message,
        code: authError.code,
        status: authError.status,
        hasUser: !!user,
        tokenPrefix: token.substring(0, 20) + '...'
      });
      
      // Provide more specific error messages
      let errorMessage = 'Invalid authentication token';
      if (authError.message?.includes('expired') || authError.message?.includes('JWT')) {
        errorMessage = 'Authentication token expired. Please refresh your session.';
      } else if (authError.message?.includes('invalid')) {
        errorMessage = 'Invalid authentication token format.';
      }
      
      return { isAdmin: false, error: errorMessage, details: authError.message };
    }

    if (!user) {
      console.error('❌ [ADMIN_AUTH] No user returned from Supabase (no error but no user)');
      return { isAdmin: false, error: 'User not found' };
    }

    // Step 6: Check if user is admin
    if (!isAdminEmail(user.email)) {
      console.warn('⚠️ [ADMIN_AUTH] Access denied - user is not admin:', {
        email: user.email,
        userId: user.id
      });
      return { isAdmin: false, error: 'Access denied. Admin privileges required.' };
    }

    const duration = Date.now() - startTime;
    console.log('✅ [ADMIN_AUTH] Admin access verified:', {
      userId: user.id,
      email: user.email,
      duration: `${duration}ms`
    });

    return { isAdmin: true, user };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [ADMIN_AUTH] Unexpected error during admin verification:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    return { isAdmin: false, error: 'Internal server error during authentication' };
  }
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const { isAdmin, error, user } = await verifyAdminAccess(req);
    
    if (!isAdmin) {
      return res.status(403).json({ error: error || 'Admin access required' });
    }

    // Add user to request object for use in handler
    req.adminUser = user;
    
    return handler(req, res);
  };
}
