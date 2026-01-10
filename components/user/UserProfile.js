import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useTheme } from '../Layout';
import { getSupabase } from '../../lib/supabaseClient';
import { sessionManager } from '../../lib/sessionManager';

export default function UserProfile() {
  const { user, signOut, updatePassword } = useAuth();
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const fetchAttemptedRef = useRef(false);

  // Fetch user data when user signs in (only once per user session)
  useEffect(() => {
    // Reset state when user changes
    if (!user) {
      setUserData(null);
      setUserDataLoading(false);
      setAuthError(false);
      fetchAttemptedRef.current = false;
      return;
    }

    // Only fetch if we haven't attempted yet and don't have data
    if (user && !userData && !userDataLoading && !fetchAttemptedRef.current && !authError) {
      fetchAttemptedRef.current = true;
      setUserDataLoading(true);
      const fetchUserData = async () => {
        try {
          const headers = await sessionManager.getAuthHeaders();
          if (!headers.Authorization) {
            throw new Error('No authorization token available');
          }

          const response = await fetch('/api/user/profile', {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
            setAuthError(false);
          } else {
            const errorData = await response.json().catch(() => ({}));
            // If it's an auth error (401), mark it and don't retry
            if (response.status === 401 || errorData.code === 'AUTH_ERROR') {
              setAuthError(true);
              if (process.env.NODE_ENV !== 'production') {
                console.error('Auth error - stopping retries:', response.status);
              }
            } else {
              // For other errors, allow retry by resetting the ref
              fetchAttemptedRef.current = false;
              if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to fetch user data:', response.status);
              }
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Error fetching user data:', error);
          }
          // Don't mark as auth error for network errors, allow retry
          fetchAttemptedRef.current = false;
        } finally {
          setUserDataLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [user]); // Only depend on user to prevent infinite loops

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Sign out error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-2xl mx-auto p-6 rounded-2xl ${
        isDark 
          ? 'bg-white/5 backdrop-blur-sm border border-white/10' 
          : 'bg-white/40 backdrop-blur-sm border border-gray-200'
      }`}
    >
      <div className="text-center mb-8">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold ${
          isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'
        }`}>
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <h2 className={`text-2xl font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Profile
        </h2>
        <p className={`text-sm ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Manage your account settings
        </p>
      </div>

      <div className="space-y-6">
        {/* User Info */}
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-white/5' : 'bg-gray-50'
        }`}>
          <h3 className={`font-medium mb-3 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Account Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className={`text-sm ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Email:
              </span>
              <span className={`text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={`text-sm ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}>
                Member since:
              </span>
              <span className={`text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDate(user?.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        {userData?.subscription && (
          <div className={`p-4 rounded-lg ${
            isDark ? 'bg-white/5' : 'bg-gray-50'
          }`}>
            <h3 className={`font-medium mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Subscription Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={`text-sm sm:text-base ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Plan:
                </span>
                <span className={`text-sm sm:text-base font-medium capitalize ${
                  userData.subscription.status === 'active' 
                    ? isDark ? 'text-green-300' : 'text-green-600'
                    : isDark ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {userData.subscription.plan_type} {userData.subscription.status === 'active' ? '✓' : '⚠️'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm sm:text-base ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Status:
                </span>
                <span className={`text-sm sm:text-base font-medium capitalize ${
                  userData.subscription.status === 'active' 
                    ? isDark ? 'text-green-300' : 'text-green-600'
                    : isDark ? 'text-yellow-300' : 'text-yellow-600'
                }`}>
                  {userData.subscription.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm sm:text-base ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Upload Limit:
                </span>
                <span className={`text-sm sm:text-base font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {userData.subscription.upload_limit} images
                </span>
              </div>
              {userData.subscription.current_period_end && (
                <div className="flex justify-between">
                  <span className={`text-sm sm:text-base ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}>
                    Next billing:
                  </span>
                  <span className={`text-sm sm:text-base font-medium ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatDate(userData.subscription.current_period_end)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Password Update */}
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-white/5' : 'bg-gray-50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Password
            </h3>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? 'Cancel' : 'Change'}
            </Button>
          </div>

          {isEditing && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePasswordUpdate}
              className="space-y-3"
            >
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </motion.form>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
            {success}
          </div>
        )}

        {/* Sign Out */}
        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <Button
            onClick={handleSignOut}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
