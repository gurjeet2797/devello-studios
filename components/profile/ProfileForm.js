import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../Layout';
import { sessionManager } from '../../lib/sessionManager';

export default function ProfileForm({ profile, onSave, loading = false }) {
  const { isDark } = useTheme();
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        throw new Error('No authorization token available');
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        await onSave();
        setEditing(false);
      } else {
        console.error('Failed to update profile:', response.status);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className={`about-devello-glass rounded-[2rem] p-4 sm:p-6 border flex flex-col`}
      style={{
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        backgroundColor: isDark 
          ? 'rgba(255, 255, 255, 0.15)' 
          : 'rgba(255, 255, 255, 0.7)',
        borderColor: isDark 
          ? 'rgba(255, 255, 255, 0.25)' 
          : 'rgba(0, 0, 0, 0.1)',
        borderWidth: '1px'
      }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Profile Information
        </h2>
        <motion.button
          whileTap={{ y: 2, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => {
            setEditing(!editing);
            if (editing) {
              setProfileForm({
                first_name: profile?.first_name || '',
                last_name: profile?.last_name || ''
              });
            }
          }}
          className={`about-devello-glass px-3 py-1 rounded-[2rem] sm:rounded-2xl text-sm font-medium transition-all duration-300`}
          style={{
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(255, 255, 255, 0.7)',
            borderColor: isDark 
              ? 'rgba(255, 255, 255, 0.25)' 
              : 'rgba(0, 0, 0, 0.1)',
            borderWidth: '1px'
          }}
        >
          {editing ? 'Cancel' : 'Edit'}
        </motion.button>
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                First Name
              </label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                    : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
                style={{
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                }}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                Last Name
              </label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                className={`w-full px-3 py-2 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                    : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                }`}
                style={{
                  backdropFilter: 'blur(4px) saturate(150%)',
                  WebkitBackdropFilter: 'blur(4px) saturate(150%)',
                }}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <motion.button
              whileTap={{ y: 2, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              type="submit"
              disabled={loading}
              className={`about-devello-glass px-4 py-2 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300`}
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: isDark 
                  ? 'rgba(37, 99, 235, 0.6)' 
                  : 'rgba(37, 99, 235, 0.8)',
                borderColor: isDark 
                  ? 'rgba(59, 130, 246, 0.4)' 
                  : 'rgba(37, 99, 235, 0.3)',
                borderWidth: '1px',
                color: 'white'
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </motion.button>
            <motion.button
              whileTap={{ y: 2, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              type="button"
              onClick={() => {
                setEditing(false);
                setProfileForm({
                  first_name: profile?.first_name || '',
                  last_name: profile?.last_name || ''
                });
              }}
              className={`about-devello-glass px-4 py-2 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300`}
              style={{
                backdropFilter: 'blur(2px)',
                WebkitBackdropFilter: 'blur(2px)',
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark 
                  ? 'rgba(255, 255, 255, 0.25)' 
                  : 'rgba(0, 0, 0, 0.1)',
                borderWidth: '1px'
              }}
            >
              Cancel
            </motion.button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 flex-grow flex flex-col justify-between">
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>First Name</span>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {profile?.first_name || 'Not set'}
                </p>
              </div>
              <div>
                <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Last Name</span>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {profile?.last_name || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

