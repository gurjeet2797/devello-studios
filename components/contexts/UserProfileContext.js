import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { sessionManager } from '../../lib/sessionManager';

const UserProfileContext = createContext({});

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

export const UserProfileProvider = ({ children }) => {
  const { user, session } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploadStats, setUploadStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const fetchUserProfile = useCallback(async (forceRefresh = false) => {
    // Don't fetch if no user
    if (!user || !session?.access_token) {
      setUserProfile(null);
      setSubscription(null);
      setUploadStats(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Don't refetch if we have recent data (unless forced)
    const now = Date.now();
    if (!forceRefresh && userProfile && lastFetchTime && (now - lastFetchTime) < 30000) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('No authorization token available');
      }

      const response = await fetch('/api/user/profile', {
        headers
      });

      if (response.status === 401 || response.status === 403) {
        // Auth error - clear profile
        setUserProfile(null);
        setSubscription(null);
        setUploadStats(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        // Handle 404 specifically - API route might not exist or needs server restart
        if (response.status === 404) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            // This is a Next.js 404 page, not an API error
            console.warn('⚠️ User profile API endpoint returned 404 HTML page. The API route may not be registered. Try restarting the Next.js dev server.');
            setError('Profile API endpoint not found. Please restart the development server.');
          } else {
            console.warn('⚠️ User profile API endpoint not found (404).');
            setError('Profile API endpoint not available');
          }
          setLoading(false);
          return;
        }
        
        // For other errors, try to get JSON error message
        let errorMessage = `Failed to fetch user profile: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, try text (but limit length to avoid HTML)
          try {
            const errorText = await response.text();
            // Only use text if it's not HTML (404 pages return HTML)
            if (!errorText.includes('<!DOCTYPE html>') && !errorText.includes('<html') && errorText.length < 500) {
              errorMessage = errorText;
            }
          } catch {
            // Ignore text parsing errors
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Extract profile, subscription, and uploadStats from response
      setUserProfile({
        id: data.id,
        email: data.email,
        profile: data.profile,
        ...data
      });
      setSubscription(data.subscription || null);
      setUploadStats(data.uploadStats || null);
      setLastFetchTime(now);
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
      // Don't clear existing data on error - keep stale data
    } finally {
      setLoading(false);
    }
  }, [user, session, userProfile, lastFetchTime]);

  // Fetch profile when user signs in
  useEffect(() => {
    if (user && session?.access_token) {
      fetchUserProfile(false);
    } else {
      // Clear profile when user logs out
      setUserProfile(null);
      setSubscription(null);
      setUploadStats(null);
      setError(null);
      setLastFetchTime(null);
    }
  }, [user, session, fetchUserProfile]);

  // Refresh function for manual updates
  const refreshUserProfile = useCallback(() => {
    return fetchUserProfile(true);
  }, [fetchUserProfile]);

  const value = {
    userProfile,
    subscription,
    uploadStats,
    loading,
    error,
    refreshUserProfile,
    fetchUserProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

