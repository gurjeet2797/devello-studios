import { createSupabaseAuthClient } from '../supabaseClient.js';

const createAuthError = (message, status = 401, code = 'AUTH_ERROR') => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

export const requireUserFromBearer = async (req) => {
  const authHeader = req?.headers?.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    throw createAuthError('Missing or invalid Authorization header');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw createAuthError('Authorization token is empty');
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    throw createAuthError('Invalid or expired authentication token');
  }

  if (!data?.user) {
    throw createAuthError('User not found');
  }

  return {
    userId: data.user.id,
    email: data.user.email,
    user: data.user
  };
};
