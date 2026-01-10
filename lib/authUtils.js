import { createSupabaseAuthClient } from './supabaseClient';
import { UserService } from './userService';

/**
 * Extracts and verifies Supabase JWT from Authorization header and returns both
 * the Supabase user and corresponding Prisma user. Sends the appropriate HTTP
 * response on failure and returns null so callers can early return.
 *
 * Caches result on the request object to avoid duplicate lookups per request.
 */
export async function getAuthenticatedUser(req, res) {
  if (req._authCache) {
    return req._authCache;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No authorization token provided' });
    return null;
  }

  const token = authHeader.substring(7);
  if (!token || token.length < 10) {
    res.status(401).json({ error: 'Invalid token format' });
    return null;
  }

  let supabase;
  try {
    supabase = createSupabaseAuthClient();
  } catch (err) {
    res.status(500).json({
      error: 'Supabase configuration error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return null;
    }

    const prismaUser = await UserService.getOrCreateUser(user.id, user.email);
    req._authCache = { supabaseUser: user, prismaUser };
    return req._authCache;
  } catch (err) {
    res.status(500).json({
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
    return null;
  }
}


