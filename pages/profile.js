import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '../components/auth/AuthProvider';
import { useTheme } from '../components/Layout';
import SubscriptionModal from '../components/SubscriptionModal';
import BillingManagementModal from '../components/BillingManagementModal';
import ProfileToggle from '../components/profile/ProfileToggle';
import StudiosProfileContent from '../components/profile/StudiosProfileContent';
import MainProfileContent from '../components/profile/MainProfileContent';
import { sessionManager } from '../lib/sessionManager';
import { RefreshService } from '../lib/refreshService';
import { BarChart3 } from 'lucide-react';
import { isAdminEmail } from '../lib/adminAuth';

// Helper to detect domain type (same as auth callback)
function getDomainInfo() {
  if (typeof window === 'undefined') return { isStudios: false, isTech: false };
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  const isStudiosDomain = hostname.includes('devellostudios.com');
  const isTechDomain = hostname.includes('devellotech.com');
  const isLocalhostStudios = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3001';
  const isLocalhostTech = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '3002';
  
  return {
    isStudios: isStudiosDomain || isLocalhostStudios,
    isTech: isTechDomain || isLocalhostTech
  };
}

export default function Profile() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: ''
  });
  const [userDataLoading, setUserDataLoading] = useState(false);

  // Determine default tab based on domain or URL query
  const domainInfo = useMemo(() => getDomainInfo(), []);
  
  // Tab state - default based on domain, but can be overridden by URL param
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL query param first
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'studios' || tabParam === 'main') {
        return tabParam;
      }
    }
    // Default based on domain
    return domainInfo.isStudios ? 'studios' : 'main';
  });

  // Update tab from URL changes
  useEffect(() => {
    const { tab } = router.query;
    if (tab === 'studios' || tab === 'main') {
      setActiveTab(tab);
    }
  }, [router.query]);

  // Handle tab change and update URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    // Update URL without full page reload
    router.replace(`/profile?tab=${newTab}`, undefined, { shallow: true });
    // Store preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('devello_profile_tab', newTab);
    }
  };

  // Setup refresh service
  useEffect(() => {
    const refreshCallback = async () => {
      await fetchUserData();
    };
    
    RefreshService.registerRefreshCallback(refreshCallback);
    
    return () => {
      RefreshService.unregisterRefreshCallback(refreshCallback);
    };
  }, []);
  
  useEffect(() => {
    const checkUser = async () => {
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!user) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!user) {
          router.push('/');
          return;
        }
      }

      if (!userData && !userDataLoading) {
        setUserDataLoading(true);
        try {
          await fetchUserData();
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserDataLoading(false);
        }
      }
    };

    checkUser();
  }, [user]);

  // Handle Stripe redirect parameters
  useEffect(() => {
    const { success, canceled, portal, tab } = router.query;
    
    if (success === 'true') {
      const handleSuccess = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (userData) {
          fetchUserData();
        }
        await RefreshService.handleBillingAction('subscription_success', true);
      };
      
      handleSuccess();
      // Clean up URL but preserve tab
      router.replace(`/profile${tab ? `?tab=${tab}` : ''}`, undefined, { shallow: true });
    } else if (canceled === 'true') {
      router.replace(`/profile${tab ? `?tab=${tab}` : ''}`, undefined, { shallow: true });
    } else if (portal === 'true') {
      const handlePortalReturn = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (userData) {
          fetchUserData();
        }
      };
      
      handlePortalReturn();
      router.replace(`/profile${tab ? `?tab=${tab}` : ''}`, undefined, { shallow: true });
    }
  }, [router.query, userData]);

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
        setProfileForm({
          first_name: data.profile?.first_name || '',
          last_name: data.profile?.last_name || ''
        });
      } else {
        console.error('Failed to fetch user data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setUserDataLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
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
        await fetchUserData();
        setEditingProfile(false);
      } else {
        console.error('Failed to update profile:', response.status);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePlanChange = async () => {
    await fetchUserData();
    await RefreshService.handleBillingAction('plan_change', true);
  };

  useEffect(() => {
    if (loading) {
      document.body.classList.add('loading-body');
    } else {
      document.body.classList.remove('loading-body');
    }
    return () => {
      document.body.classList.remove('loading-body');
    };
  }, [loading]);

  if (loading) {
    return (
      <>
        <Head>
          <title>Profile - Devello</title>
          <meta name="description" content="Manage your account and subscription" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={`min-h-screen flex items-center justify-center relative ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
          <div className="loading"></div>
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Head>
          <title>Profile - Devello</title>
          <meta name="description" content="Manage your account and subscription" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="text-center">
          <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>Unable to load profile data.</p>
        </div>
      </>
    );
  }

  const userUploadStats = userData.uploadStats;
  const subscription = userData.subscription;

  return (
    <>
      <Head>
        <title>Profile - {domainInfo.isStudios ? 'Devello Studios' : 'Devello'}</title>
        <meta name="description" content="Manage your account and subscription" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pt-16 sm:pt-24"
          >
            <h1 className={`text-3xl sm:text-4xl font-light mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {(() => {
                const hour = new Date().getHours();
                const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                const firstName = userData?.profile?.first_name || 'there';
                return `${timeGreeting}, ${firstName}!`;
              })()}
            </h1>
            <p className={`text-sm sm:text-lg mb-6 px-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              Manage your account and {activeTab === 'studios' ? 'studios subscription' : 'store orders'}
            </p>
            
            {/* Admin Dashboard Button */}
            {(isAdminEmail(userData?.email) || isAdminEmail(user?.email)) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ y: 2, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => router.push('/admin')}
                  className="inline-flex items-center px-6 py-3 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300 backdrop-blur-md border bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white hover:from-blue-700/90 hover:to-purple-700/90 shadow-lg hover:shadow-xl border-blue-500/30"
                  style={{
                    backdropFilter: 'blur(8px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(8px) saturate(150%)',
                  }}
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Admin Dashboard
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Profile Toggle */}
          <ProfileToggle activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Common Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="about-devello-glass rounded-[2rem] p-4 sm:p-6 border"
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
                onClick={() => setEditingProfile(!editingProfile)}
                className="about-devello-glass px-3 py-1 rounded-[2rem] sm:rounded-2xl text-sm font-medium transition-all duration-300"
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
                {editingProfile ? 'Cancel' : 'Edit'}
              </motion.button>
            </div>

            {editingProfile ? (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
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
                    className="about-devello-glass px-4 py-2 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300"
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
                    Save Changes
                  </motion.button>
                  <motion.button
                    whileTap={{ y: 2, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="about-devello-glass px-4 py-2 rounded-[2rem] sm:rounded-2xl font-medium transition-all duration-300"
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>First Name</span>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {userData.profile?.first_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Last Name</span>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {userData.profile?.last_name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Email</span>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{userData.email}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tab Content */}
          {activeTab === 'studios' ? (
            <StudiosProfileContent
              userData={userData}
              subscription={subscription}
              userUploadStats={userUploadStats}
              onShowSubscriptionModal={() => setShowSubscriptionModal(true)}
              onShowBillingModal={() => setShowBillingModal(true)}
            />
          ) : (
            <MainProfileContent userData={userData} />
          )}

          {/* Modals */}
          <SubscriptionModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            currentUploadCount={userUploadStats?.uploadCount || 0}
          />

          <BillingManagementModal
            isOpen={showBillingModal}
            onClose={() => setShowBillingModal(false)}
            currentPlan={subscription?.plan_type || 'free'}
            subscriptionStatus={subscription?.status}
            onPlanChange={handlePlanChange}
          />
        </div>
      </div>
    </>
  );
}
