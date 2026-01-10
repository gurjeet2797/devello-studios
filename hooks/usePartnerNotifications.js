import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { sessionManager } from '../lib/sessionManager';

/**
 * Hook for managing partner email notification preferences
 * Provides unified state and toggle function, with caching to avoid duplicate fetches
 */
export function usePartnerNotifications() {
  const { user, session } = useAuth();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const fetchAttemptedRef = useRef(false);

  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    // Don't fetch if no user
    if (!user || !session?.access_token) {
      setEmailNotificationsEnabled(false);
      setLoading(false);
      setError(null);
      fetchAttemptedRef.current = false;
      return;
    }

    // Don't refetch if we have recent data (unless forced)
    const now = Date.now();
    if (!forceRefresh && lastFetchTime && (now - lastFetchTime) < 30000) {
      return;
    }

    // Prevent duplicate simultaneous fetches
    if (fetchAttemptedRef.current && !forceRefresh) {
      return;
    }

    fetchAttemptedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('No authorization token available');
      }

      const response = await fetch('/api/partners/notifications', {
        headers
      });

      if (response.status === 401 || response.status === 403) {
        setEmailNotificationsEnabled(false);
        setError(null);
        setLoading(false);
        fetchAttemptedRef.current = false;
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch partner notifications: ${response.status}`);
      }

      const data = await response.json();
      setEmailNotificationsEnabled(data.emailNotificationsEnabled || false);
      setLastFetchTime(now);
      setError(null);
    } catch (err) {
      console.error('Error fetching partner notification preferences:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      fetchAttemptedRef.current = false;
    }
  }, [user, session, lastFetchTime]);

  // Fetch on mount when user is available
  useEffect(() => {
    if (user && session?.access_token) {
      fetchNotifications(false);
    } else {
      // Clear state when user logs out
      setEmailNotificationsEnabled(false);
      setError(null);
      setLastFetchTime(null);
      fetchAttemptedRef.current = false;
    }
  }, [user, session, fetchNotifications]);

  const toggleNotifications = useCallback(async (enabled) => {
    if (!user || !session?.access_token) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('No authorization token available');
      }

      const response = await fetch('/api/partners/notifications', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailNotificationsEnabled: enabled })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update partner notifications: ${response.status}`);
      }

      const data = await response.json();
      setEmailNotificationsEnabled(data.emailNotificationsEnabled || false);
      setLastFetchTime(Date.now());
      setError(null);
      
      return { success: true, data };
    } catch (err) {
      console.error('Error toggling partner notifications:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  return {
    emailNotificationsEnabled,
    loading,
    error,
    toggleNotifications,
    refreshNotifications: () => fetchNotifications(true)
  };
}

