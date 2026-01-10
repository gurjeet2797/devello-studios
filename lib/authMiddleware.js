import { createSupabaseAuthClient } from './supabaseClient';

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

/**
 * Verify user authentication from request
 * @param {Object} req - Request object
 * @returns {Object} { isAuthenticated: boolean, user?: Object, error?: string }
 */
export async function verifyAuth(req) {
  try {
    // Get and validate authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return { isAuthenticated: false, error: 'No authorization token provided' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { isAuthenticated: false, error: 'Invalid authorization header format. Expected "Bearer <token>"' };
    }

    // Extract and validate token
    const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix
    
    const tokenValidation = validateTokenFormat(token);
    if (!tokenValidation.isValid) {
      return { isAuthenticated: false, error: `Invalid token format: ${tokenValidation.reason}` };
    }

    // Create Supabase client for user token verification
    let supabase;
    try {
      supabase = createSupabaseAuthClient();
      if (!supabase) {
        return { isAuthenticated: false, error: 'Failed to initialize authentication service' };
      }
    } catch (clientError) {
      return { isAuthenticated: false, error: 'Failed to initialize authentication service' };
    }
    
    // Verify the token with Supabase
    let user, authError;
    try {
      const authResult = await supabase.auth.getUser(token);
      user = authResult.data?.user;
      authError = authResult.error;
    } catch (getUserError) {
      return { isAuthenticated: false, error: 'Authentication service error' };
    }
    
    if (authError) {
      // Provide more specific error messages
      let errorMessage = 'Invalid authentication token';
      if (authError.message?.includes('expired') || authError.message?.includes('JWT')) {
        errorMessage = 'Authentication token expired. Please refresh your session.';
      } else if (authError.message?.includes('invalid')) {
        errorMessage = 'Invalid authentication token format.';
      }
      
      return { isAuthenticated: false, error: errorMessage };
    }

    if (!user) {
      return { isAuthenticated: false, error: 'User not found' };
    }

    return { isAuthenticated: true, user };
  } catch (error) {
    return { isAuthenticated: false, error: 'Internal server error during authentication' };
  }
}

/**
 * Middleware wrapper to require authentication for API endpoints
 * Similar to requireAdmin but for regular authenticated users
 * @param {Function} handler - API route handler function
 * @returns {Function} Wrapped handler that requires authentication
 */
export function requireAuth(handler) {
  return async (req, res) => {
    const { isAuthenticated, error, user } = await verifyAuth(req);
    
    if (!isAuthenticated) {
      return res.status(401).json({ 
        error: error || 'Authentication required',
        code: 'AUTH_ERROR'
      });
    }

    // Add user to request object for use in handler
    req.user = user;
    
    return handler(req, res);
  };
}

