import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '../components/auth/AuthProvider';
import { useTheme } from '../components/Layout';
import { usePartnerNotifications } from '../hooks/usePartnerNotifications';
import PartnerIntakeForm from '../components/partners/PartnerIntakeForm';
import { getSupabase } from '../lib/supabaseClient';
import { sessionManager } from '../lib/sessionManager';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  MessageSquare, 
  Send, 
  Folder, 
  X, 
  Circle, 
  Menu,
  Home,
  User,
  ArrowRight,
  Briefcase,
  Hammer,
  Wrench,
  Package,
  Code,
  Factory,
  Building2,
  Phone,
  Trash2,
  CheckCircle,
  File
} from 'lucide-react';
import MessageAttachments from '../components/MessageAttachments';
import ChatInput from '../components/chat/ChatInput';

const VIEWS = {
  DASHBOARD: 'dashboard',
  CLIENT_MESSAGES: 'client_messages',
  ACTIVE_PROJECTS: 'active_projects'
};

export default function PartnersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const [pageLoading, setPageLoading] = useState(true);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!authLoading) {
      if (!user) {
        router.push('/?signin=true');
        return;
      }
      
      // Fetch partner status from API
      const fetchPartnerStatus = async () => {
        try {
          const supabase = getSupabase();
          if (!supabase) {
            throw new Error('Supabase client not available');
          }

          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session?.access_token) {
            throw new Error('Not authenticated');
          }

          const response = await fetch('/api/partners/status', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch partner status');
          }

          const data = await response.json();
          setPartnerStatus(data);
        } catch (error) {
          console.error('Error fetching partner status:', error);
          setPartnerStatus({
            isPartner: false,
            status: 'not_applied',
            partnerData: null
          });
        } finally {
          setPageLoading(false);
        }
      };

      fetchPartnerStatus();
    }
  }, [user, authLoading, router]);

  // Track screen size for sidebar toggle
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (authLoading || pageLoading) {
      document.body.classList.add('loading-body');
    } else {
      document.body.classList.remove('loading-body');
    }
    return () => {
      document.body.classList.remove('loading-body');
    };
  }, [authLoading, pageLoading]);

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
        <div className="loading"></div>
      </div>
    );
  }

  const handleApplicationSuccess = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/partners/status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPartnerStatus(data);
      }
    } catch (error) {
      console.error('Error refreshing partner status:', error);
      setPartnerStatus({
        isPartner: false,
        status: 'pending',
        partnerData: null
      });
    }
  };

  // If not approved, show simple landing page with application option
  if (partnerStatus && partnerStatus.status !== 'approved') {
    return (
      <>
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className={`relative rounded-3xl overflow-hidden shadow-xl mx-auto ${
                isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
              }`} style={{ maxWidth: '400px', width: '100%' }}>
                <div className="aspect-[4/3] relative">
                  <Image
                    src="https://static.wixstatic.com/media/c6bfe7_e2ea312fa2de4d499f4706fbb8b2b921~mv2.png"
                    alt="Become a Partner"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h1 className={`text-3xl sm:text-4xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Become a Partner
              </h1>
              
              <p className={`text-base sm:text-lg leading-relaxed max-w-xl mx-auto ${
                isDark ? 'text-white/80' : 'text-gray-700'
              }`}>
                Devello is building a platform for innovative solutions. We're seeking partners who share our vision of enduring growth and meaningful impact.
              </p>

              {partnerStatus.status === 'not_applied' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ y: 0, scale: 0.95 }}
                  onClick={() => setShowApplicationModal(true)}
                  className="about-devello-glass px-8 py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300"
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  style={{ 
                    transformOrigin: "center center",
                    textShadow: isDark 
                      ? '0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)'
                      : '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)',
                    boxShadow: isDark
                      ? '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1), 0 4px 20px rgba(0, 0, 0, 0.3)'
                      : '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.2), 0 4px 20px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  Apply now
                </motion.button>
              )}

              {partnerStatus.status !== 'not_applied' && (
                <div className={`p-6 rounded-2xl ${
                  isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'
                }`}>
                  <h2 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Partner Access Required
                  </h2>
                  <p className={`mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {partnerStatus.status === 'pending' 
                      ? 'Your partner application is pending approval. We\'ll notify you once it\'s been reviewed.'
                      : 'Your partner application was not approved at this time. Please contact us for more information.'
                    }
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ y: 0, scale: 0.95 }}
                    onClick={() => router.push('/about#become-partner')}
                    className="about-devello-glass px-6 py-2 rounded-full text-sm font-medium transition-all duration-300"
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    style={{ transformOrigin: "center center" }}
                  >
                    Learn More
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        <PartnerIntakeForm
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={handleApplicationSuccess}
        />
      </>
    );
  }

  // Show portal for approved partners
  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      {/* Glass Sidebar */}
      <GlassSidebar
        isDark={isDark}
        currentView={currentView}
        setCurrentView={setCurrentView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        desktopSidebarVisible={desktopSidebarVisible}
        setDesktopSidebarVisible={setDesktopSidebarVisible}
        isLargeScreen={isLargeScreen}
        router={router}
        partnerData={partnerStatus?.partnerData}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {currentView === VIEWS.DASHBOARD && (
            <DashboardView
              isDark={isDark}
              partnerData={partnerStatus?.partnerData}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              setCurrentView={setCurrentView}
            />
          )}
          {currentView === VIEWS.CLIENT_MESSAGES && (
            <ClientMessagesView
              isDark={isDark}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              partnerStatus={partnerStatus}
              setCurrentView={setCurrentView}
            />
          )}
          {currentView === VIEWS.ACTIVE_PROJECTS && (
            <ActiveProjectsView
              isDark={isDark}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              setCurrentView={setCurrentView}
              partnerData={partnerStatus?.partnerData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Glass Sidebar Component
function GlassSidebar({ isDark, currentView, setCurrentView, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, router, partnerData }) {
  const serviceType = getPartnerServiceType(partnerData);
  const sidebarItems = [
    { id: VIEWS.CLIENT_MESSAGES, label: 'Client Messages', icon: MessageSquare },
    { 
      id: VIEWS.ACTIVE_PROJECTS, 
      label: serviceType === 'manufacturing' ? 'Active Orders' : 'Potential Clients', 
      icon: Folder 
    },
  ];

  return (
    <>
      {/* Mobile Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-40 overflow-y-auto"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'transparent'
            }}
            onClick={() => setSidebarOpen(false)}
          >
            {/* Menu Content */}
            <motion.div 
              className="pt-20 px-4 pb-4 space-y-3 flex flex-col items-end"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <motion.button
                onClick={() => setSidebarOpen(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="about-devello-glass px-4 py-3 rounded-full text-base font-medium transition-all duration-300 flex items-center gap-2 text-red-500 hover:text-red-600"
              >
                <X className="w-5 h-5" />
                <span>Close</span>
              </motion.button>

              {/* Menu Items */}
              {sidebarItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      delay: 0.1 + (index * 0.05),
                      duration: 0.3,
                      ease: "easeOut"
                    }}
                  >
                    <motion.button
                      onClick={() => {
                        setCurrentView(item.id);
                        setSidebarOpen(false);
                      }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className={`about-devello-glass w-auto text-left px-4 py-3 rounded-full text-base font-medium transition-all duration-300 flex items-center gap-3 ${
                        currentView === item.id
                          ? isDark ? 'bg-white/20' : 'bg-amber-200/60'
                          : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <AnimatePresence>
        {desktopSidebarVisible && (
          <>
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDesktopSidebarVisible(false)}
              className="hidden lg:block fixed inset-0 z-20"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              }}
            />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="hidden lg:block fixed top-24 z-30"
              style={{ right: 'calc((100% - 68rem) / 2 + 8.5rem)' }}
            >
              <div className="flex flex-col items-end space-y-2">
                {/* Close Button */}
                <motion.button
                  onClick={() => setDesktopSidebarVisible(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-end whitespace-nowrap text-red-500 hover:text-red-600"
                >
                  <X className="w-5 h-5 flex-shrink-0" />
                  <span>Close</span>
                </motion.button>

                {/* Menu Items */}
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setSidebarOpen(false);
                        setDesktopSidebarVisible(false);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className={`about-devello-glass w-auto text-right px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-end ${
                        currentView === item.id
                          ? isDark ? 'bg-white/20' : 'bg-amber-200/60'
                          : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Identify partner service type
function getPartnerServiceType(partnerData) {
  if (!partnerData?.serviceType) return 'software';
  
  const serviceType = partnerData.serviceType.toLowerCase();
  if (serviceType.includes('construction')) return 'construction';
  if (serviceType.includes('software') || serviceType.includes('software_dev')) return 'software';
  if (serviceType.includes('consulting')) return 'consulting';
  if (serviceType.includes('manufacturing')) return 'manufacturing';
  return 'software';
}

// Dashboard View with Service-Specific Content
function DashboardView({ isDark, partnerData, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, setCurrentView }) {
  const [userName, setUserName] = useState('Partner');
  const [stats, setStats] = useState({
    openRequests: 0,
    activeProjects: 0,
    newMessages: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [ordersProjectsLoading, setOrdersProjectsLoading] = useState(true);
  
  // Use unified partner notification hook
  const {
    emailNotificationsEnabled,
    loading: notificationLoading,
    toggleNotifications: handleNotificationToggle
  } = usePartnerNotifications();
  
  const serviceType = getPartnerServiceType(partnerData);
  const isManufacturing = serviceType === 'manufacturing';

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const firstName = data.profile?.first_name || '';
          if (firstName) {
            setUserName(firstName);
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          if (isMounted) setStatsLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (isMounted) setStatsLoading(false);
          return;
        }

        const response = await fetch('/api/partners/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          // Add cache control to prevent stale data
          cache: 'no-store'
        });

        if (response.ok && isMounted) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchOrdersProjects = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Fetch orders if manufacturing
        if (isManufacturing) {
          const ordersResponse = await fetch('/api/orders/list', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (ordersResponse.ok) {
            const data = await ordersResponse.json();
            setOrders(data.orders || []);
          }
        } else {
          // Fetch projects for other service types
          const projectsResponse = await fetch('/api/projects/list', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (projectsResponse.ok) {
            const data = await projectsResponse.json();
            setProjects(data.projects || []);
          }
        }
      } catch (error) {
        console.error('Error fetching orders/projects:', error);
      } finally {
        setOrdersProjectsLoading(false);
      }
    };

    fetchOrdersProjects();
  }, [isManufacturing]);

  // Notification preferences are now handled by usePartnerNotifications hook

  const getServiceTypeLabel = (type) => {
    const labels = {
      construction: 'Construction Services',
      software: 'Software Development',
      consulting: 'Business Consultation',
      manufacturing: 'Manufacturing'
    };
    return labels[type] || 'Partner';
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      construction: {
        bg: isDark ? 'bg-orange-600/40' : 'bg-orange-600/20',
        border: isDark ? 'border-orange-500/50' : 'border-orange-500/30',
        text: isDark ? 'text-orange-300' : 'text-orange-800',
        icon: isDark ? 'text-orange-400' : 'text-orange-600'
      },
      software: {
        bg: isDark ? 'bg-blue-600/40' : 'bg-blue-600/20',
        border: isDark ? 'border-blue-500/50' : 'border-blue-500/30',
        text: isDark ? 'text-blue-300' : 'text-blue-800',
        icon: isDark ? 'text-blue-400' : 'text-blue-600'
      },
      consulting: {
        bg: isDark ? 'bg-yellow-500/40' : 'bg-yellow-500/20',
        border: isDark ? 'border-yellow-400/50' : 'border-yellow-400/30',
        text: isDark ? 'text-yellow-300' : 'text-yellow-800',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600'
      },
      manufacturing: {
        bg: isDark ? 'bg-purple-600/40' : 'bg-purple-600/20',
        border: isDark ? 'border-purple-500/50' : 'border-purple-500/30',
        text: isDark ? 'text-purple-300' : 'text-purple-800',
        icon: isDark ? 'text-purple-400' : 'text-purple-600'
      }
    };
    return colors[type] || colors.software;
  };

  const serviceColors = getServiceTypeColor(serviceType);
  const ServiceIcon = serviceType === 'construction' ? Hammer : 
                      serviceType === 'software' ? Code :
                      serviceType === 'consulting' ? Briefcase :
                      serviceType === 'manufacturing' ? Factory : Code;

  return (
    <div className="pt-20 lg:pt-24 pb-8 px-4 lg:px-0">
      <div className="w-full max-w-2xl sm:max-w-4xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Sidebar Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              if (isLargeScreen) {
                setDesktopSidebarVisible(prev => !prev);
              } else {
                setSidebarOpen(true);
              }
            }}
            className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 whitespace-nowrap"
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
              color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)'
            }}
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">My options</span>
          </button>
        </div>
        
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {userName}!
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-lg border text-sm font-medium ${serviceColors.bg} ${serviceColors.border} ${serviceColors.text}`}>
              {getServiceTypeLabel(serviceType)}
            </span>
          </div>
        </motion.div>

        {/* Service-Specific Dashboard Content */}
        {serviceType === 'consulting' && (
          <ConsultingDashboard 
            isDark={isDark} 
            stats={stats} 
            statsLoading={statsLoading} 
            serviceColors={serviceColors} 
            setCurrentView={setCurrentView} 
            setSidebarOpen={setSidebarOpen} 
            setDesktopSidebarVisible={setDesktopSidebarVisible}
            emailNotificationsEnabled={emailNotificationsEnabled}
            notificationLoading={notificationLoading}
            handleNotificationToggle={handleNotificationToggle}
          />
        )}
        {serviceType === 'software' && (
          <SoftwareDashboard isDark={isDark} stats={stats} statsLoading={statsLoading} serviceColors={serviceColors} setCurrentView={setCurrentView} setSidebarOpen={setSidebarOpen} setDesktopSidebarVisible={setDesktopSidebarVisible} />
        )}
        {serviceType === 'manufacturing' && (
          <ManufacturingDashboard isDark={isDark} stats={stats} statsLoading={statsLoading} serviceColors={serviceColors} setCurrentView={setCurrentView} setSidebarOpen={setSidebarOpen} setDesktopSidebarVisible={setDesktopSidebarVisible} />
        )}
        {serviceType === 'construction' && (
          <ConstructionDashboard isDark={isDark} stats={stats} statsLoading={statsLoading} serviceColors={serviceColors} setCurrentView={setCurrentView} setSidebarOpen={setSidebarOpen} setDesktopSidebarVisible={setDesktopSidebarVisible} />
        )}
      </div>
    </div>
  );
}

// Service-Specific Dashboard Components
function ConsultingDashboard({ isDark, stats, statsLoading, serviceColors, setCurrentView, setSidebarOpen, setDesktopSidebarVisible, emailNotificationsEnabled, notificationLoading, handleNotificationToggle }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch('/api/partners/conversations/list', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const totalUnread = [...(data.requests || []), ...(data.messages || [])].reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    {
      title: 'View Client Messages',
      description: 'Respond to consultation requests',
      icon: MessageSquare,
      onClick: () => {
        setCurrentView(VIEWS.CLIENT_MESSAGES);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      },
      hasUnread: unreadCount > 0
    },
    {
      title: 'Potential Clients',
      description: 'Manage ongoing consultations',
      icon: Briefcase,
      onClick: () => {
        setCurrentView(VIEWS.ACTIVE_PROJECTS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    }
  ];

  return (
    <>
      {/* Email Notifications Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-2xl p-4 border-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/50'} mb-6`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Email Notifications
            </p>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Get notified when clients send you messages
            </p>
          </div>
          <button
            onClick={() => handleNotificationToggle(!emailNotificationsEnabled)}
            disabled={notificationLoading}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
              emailNotificationsEnabled
                ? isDark ? 'bg-blue-500' : 'bg-blue-600'
                : isDark ? 'bg-white/20' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`about-devello-glass rounded-3xl p-6 border-2 ${serviceColors.border} mb-6`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${serviceColors.bg}`}>
            <Briefcase className={`w-6 h-6 ${serviceColors.icon}`} />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Consultation Overview
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Manage your business consultation services
            </p>
          </div>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center relative" style={{ minHeight: '60px', width: '100%' }}>
            <div className="loading" style={{ position: 'relative', margin: '0', top: 'auto', left: 'auto', transform: 'scale(0.5)' }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Open Requests</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.openRequests}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>New Messages</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.newMessages || 0}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Active Projects</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeProjects}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const hasUnread = action.hasUnread;
          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={action.onClick}
              className={`about-devello-glass rounded-3xl p-6 border-2 text-left group hover:scale-[1.02] transition-all ${
                hasUnread 
                  ? isDark ? 'border-green-500/50' : 'border-green-500/40'
                  : `${serviceColors.border}`
              } ${hasUnread ? '' : serviceColors.bg}`}
              style={hasUnread ? {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)',
                boxShadow: isDark ? '0 0 0 1px rgba(34, 197, 94, 0.3)' : '0 0 0 1px rgba(34, 197, 94, 0.25)'
              } : {}}
            >
              <div className={`p-3 rounded-2xl w-fit mb-4 ${hasUnread ? (isDark ? 'bg-green-500/20' : 'bg-green-500/15') : serviceColors.bg}`}>
                <Icon className={`w-6 h-6 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${hasUnread ? (isDark ? 'text-green-300' : 'text-green-700') : serviceColors.text}`}>
                {action.title}
                {hasUnread && (
                  <span className={`ml-2 text-sm font-normal ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ({unreadCount} new)
                  </span>
                )}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {action.description}
              </p>
              <ArrowRight className={`w-5 h-5 mt-4 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon} group-hover:translate-x-1 transition-transform`} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

function SoftwareDashboard({ isDark, stats, statsLoading, serviceColors, setCurrentView, setSidebarOpen, setDesktopSidebarVisible }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch('/api/partners/conversations/list', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const totalUnread = [...(data.requests || []), ...(data.messages || [])].reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  const quickActions = [
    {
      title: 'View Client Messages',
      description: 'Respond to development requests',
      icon: MessageSquare,
      onClick: () => {
        setCurrentView(VIEWS.CLIENT_MESSAGES);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      },
      hasUnread: unreadCount > 0
    },
    {
      title: 'Potential Clients',
      description: 'Track software builds',
      icon: Code,
      onClick: () => {
        setCurrentView(VIEWS.ACTIVE_PROJECTS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`about-devello-glass rounded-3xl p-6 border-2 ${serviceColors.border} mb-6`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${serviceColors.bg}`}>
            <Code className={`w-6 h-6 ${serviceColors.icon}`} />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Development Overview
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Manage your software development projects
            </p>
          </div>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center relative" style={{ minHeight: '60px', width: '100%' }}>
            <div className="loading" style={{ position: 'relative', margin: '0', top: 'auto', left: 'auto', transform: 'scale(0.5)' }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Open Requests</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.openRequests}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>New Messages</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.newMessages || 0}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Active Projects</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeProjects}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const hasUnread = action.hasUnread;
          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={action.onClick}
              className={`about-devello-glass rounded-3xl p-6 border-2 text-left group hover:scale-[1.02] transition-all ${
                hasUnread 
                  ? isDark ? 'border-green-500/50' : 'border-green-500/40'
                  : `${serviceColors.border}`
              } ${hasUnread ? '' : serviceColors.bg}`}
              style={hasUnread ? {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)',
                boxShadow: isDark ? '0 0 0 1px rgba(34, 197, 94, 0.3)' : '0 0 0 1px rgba(34, 197, 94, 0.25)'
              } : {}}
            >
              <div className={`p-3 rounded-2xl w-fit mb-4 ${hasUnread ? (isDark ? 'bg-green-500/20' : 'bg-green-500/15') : serviceColors.bg}`}>
                <Icon className={`w-6 h-6 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${hasUnread ? (isDark ? 'text-green-300' : 'text-green-700') : serviceColors.text}`}>
                {action.title}
                {hasUnread && (
                  <span className={`ml-2 text-sm font-normal ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ({unreadCount} new)
                  </span>
                )}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {action.description}
              </p>
              <ArrowRight className={`w-5 h-5 mt-4 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon} group-hover:translate-x-1 transition-transform`} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

function ManufacturingDashboard({ isDark, stats, statsLoading, serviceColors, setCurrentView, setSidebarOpen, setDesktopSidebarVisible }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch('/api/partners/conversations/list', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const totalUnread = [...(data.requests || []), ...(data.messages || [])].reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  const quickActions = [
    {
      title: 'View Client Messages',
      description: 'Respond to manufacturing requests',
      icon: MessageSquare,
      onClick: () => {
        setCurrentView(VIEWS.CLIENT_MESSAGES);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      },
      hasUnread: unreadCount > 0
    },
    {
      title: 'Potential Clients',
      description: 'Track production orders',
      icon: Factory,
      onClick: () => {
        setCurrentView(VIEWS.ACTIVE_PROJECTS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`about-devello-glass rounded-3xl p-6 border-2 ${serviceColors.border} mb-6`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${serviceColors.bg}`}>
            <Factory className={`w-6 h-6 ${serviceColors.icon}`} />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Manufacturing Overview
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Manage your manufacturing operations
            </p>
          </div>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center relative" style={{ minHeight: '60px', width: '100%' }}>
            <div className="loading" style={{ position: 'relative', margin: '0', top: 'auto', left: 'auto', transform: 'scale(0.5)' }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Open Requests</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.openRequests}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>New Messages</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.newMessages || 0}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Active Projects</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeProjects}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const hasUnread = action.hasUnread;
          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={action.onClick}
              className={`about-devello-glass rounded-3xl p-6 border-2 text-left group hover:scale-[1.02] transition-all ${
                hasUnread 
                  ? isDark ? 'border-green-500/50' : 'border-green-500/40'
                  : `${serviceColors.border}`
              } ${hasUnread ? '' : serviceColors.bg}`}
              style={hasUnread ? {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)',
                boxShadow: isDark ? '0 0 0 1px rgba(34, 197, 94, 0.3)' : '0 0 0 1px rgba(34, 197, 94, 0.25)'
              } : {}}
            >
              <div className={`p-3 rounded-2xl w-fit mb-4 ${hasUnread ? (isDark ? 'bg-green-500/20' : 'bg-green-500/15') : serviceColors.bg}`}>
                <Icon className={`w-6 h-6 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${hasUnread ? (isDark ? 'text-green-300' : 'text-green-700') : serviceColors.text}`}>
                {action.title}
                {hasUnread && (
                  <span className={`ml-2 text-sm font-normal ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ({unreadCount} new)
                  </span>
                )}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {action.description}
              </p>
              <ArrowRight className={`w-5 h-5 mt-4 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon} group-hover:translate-x-1 transition-transform`} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

function ConstructionDashboard({ isDark, stats, statsLoading, serviceColors, setCurrentView, setSidebarOpen, setDesktopSidebarVisible }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch('/api/partners/conversations/list', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const totalUnread = [...(data.requests || []), ...(data.messages || [])].reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  const quickActions = [
    {
      title: 'View Client Messages',
      description: 'Respond to construction requests',
      icon: MessageSquare,
      onClick: () => {
        setCurrentView(VIEWS.CLIENT_MESSAGES);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      },
      hasUnread: unreadCount > 0
    },
    {
      title: 'Potential Clients',
      description: 'Track construction projects',
      icon: Hammer,
      onClick: () => {
        setCurrentView(VIEWS.ACTIVE_PROJECTS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    }
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`about-devello-glass rounded-3xl p-6 border-2 ${serviceColors.border} mb-6`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${serviceColors.bg}`}>
            <Hammer className={`w-6 h-6 ${serviceColors.icon}`} />
          </div>
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Partner Overview
            </h3>
            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Manage your projects
            </p>
          </div>
        </div>
        {statsLoading ? (
          <div className="flex items-center justify-center relative" style={{ minHeight: '60px', width: '100%' }}>
            <div className="loading" style={{ position: 'relative', margin: '0', top: 'auto', left: 'auto', transform: 'scale(0.5)' }}></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Open Requests</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.openRequests}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Active Projects</p>
              <p className={`mt-1 text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeProjects}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const hasUnread = action.hasUnread;
          return (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              onClick={action.onClick}
              className={`about-devello-glass rounded-3xl p-6 border-2 text-left group hover:scale-[1.02] transition-all ${
                hasUnread 
                  ? isDark ? 'border-green-500/50' : 'border-green-500/40'
                  : `${serviceColors.border}`
              } ${hasUnread ? '' : serviceColors.bg}`}
              style={hasUnread ? {
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)',
                boxShadow: isDark ? '0 0 0 1px rgba(34, 197, 94, 0.3)' : '0 0 0 1px rgba(34, 197, 94, 0.25)'
              } : {}}
            >
              <div className={`p-3 rounded-2xl w-fit mb-4 ${hasUnread ? (isDark ? 'bg-green-500/20' : 'bg-green-500/15') : serviceColors.bg}`}>
                <Icon className={`w-6 h-6 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${hasUnread ? (isDark ? 'text-green-300' : 'text-green-700') : serviceColors.text}`}>
                {action.title}
                {hasUnread && (
                  <span className={`ml-2 text-sm font-normal ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ({unreadCount} new)
                  </span>
                )}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {action.description}
              </p>
              <ArrowRight className={`w-5 h-5 mt-4 ${hasUnread ? (isDark ? 'text-green-400' : 'text-green-600') : serviceColors.icon} group-hover:translate-x-1 transition-transform`} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}

// Helper function to get service type label
function getServiceTypeLabel(serviceType) {
  if (!serviceType) return 'Service';
  const normalizedType = serviceType.toLowerCase();
  if (normalizedType.includes('construction')) return 'Construction';
  if (normalizedType.includes('software') || normalizedType.includes('software_dev')) return 'Software Development';
  if (normalizedType.includes('consulting')) return 'Business Consulting';
  if (normalizedType.includes('manufacturing')) return 'Manufacturing';
  return 'Service';
}

// Client Messages View
function ClientMessagesView({ isDark, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, partnerStatus, setCurrentView }) {
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeView, setActiveView] = useState('requests'); // 'requests' or 'messages'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState(null);
  const [sending, setSending] = useState(false);
  const [clientIsLive, setClientIsLive] = useState(false);
  const [clientIsTyping, setClientIsTyping] = useState(false);
  const [partnerIsLive, setPartnerIsLive] = useState(false);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [ordersProjectsLoading, setOrdersProjectsLoading] = useState(true);
  
  const serviceType = getPartnerServiceType(partnerStatus?.partnerData);
  const isManufacturing = serviceType === 'manufacturing';
  const presenceIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesPollIntervalRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const pollAbortControllerRef = useRef(null);
  const currentConversationIdRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const unreadRefreshIntervalRef = useRef(null);
  const markReadTimeoutRef = useRef(null);
  const conversationContainerRef = useRef(null);
  const containerWrapperRef = useRef(null);
  const messagesContainerWrapperRef = useRef(null);
  
  const partnerServiceType = partnerStatus?.partnerData?.serviceType || '';

  useEffect(() => {
    fetchConversations();
    
    // Set up periodic refresh of unread counts (every 30 seconds)
    unreadRefreshIntervalRef.current = setInterval(() => {
      fetchConversations();
    }, 30000);
    
    return () => {
      if (unreadRefreshIntervalRef.current) {
        clearInterval(unreadRefreshIntervalRef.current);
      }
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchOrdersProjects = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Fetch orders if manufacturing
        if (isManufacturing) {
          const ordersResponse = await fetch('/api/orders/list', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (ordersResponse.ok) {
            const data = await ordersResponse.json();
            setOrders(data.orders || []);
          }
        } else {
          // Fetch projects for other service types
          const projectsResponse = await fetch('/api/projects/list', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          if (projectsResponse.ok) {
            const data = await projectsResponse.json();
            setProjects(data.projects || []);
          }
        }
      } catch (error) {
        console.error('Error fetching orders/projects:', error);
      } finally {
        setOrdersProjectsLoading(false);
      }
    };

    fetchOrdersProjects();
  }, [isManufacturing]);

  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    setDeletingId(conversationId);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/conversations/${conversationId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        await fetchConversations();
        // If deleted conversation was selected, clear selection
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setActiveView('requests');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchConversations = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/partners/conversations/list', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Sort by lastMessageAt descending to ensure latest messages are at the top
        const sortByLatest = (convs) => {
          return (convs || []).sort((a, b) => {
            const dateA = new Date(a.lastMessageAt || a.createdAt);
            const dateB = new Date(b.lastMessageAt || b.createdAt);
            return dateB - dateA;
          });
        };
        const sortedRequests = sortByLatest(data.requests || []);
        const sortedMessages = sortByLatest(data.messages || []);
        setRequests(sortedRequests);
        setMessages(sortedMessages);
        
        // Update selected conversation's unread count if it's in the list
        if (selectedConversation) {
          const updatedConv = [...sortedRequests, ...sortedMessages].find(c => c.id === selectedConversation.id);
          if (updatedConv) {
            setSelectedConversation(prev => ({
              ...prev,
              unreadCount: updatedConv.unreadCount || 0
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async (conversationId, token) => {
    // Only mark if this is still the selected conversation
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    try {
      const response = await fetch(`/api/partners/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update unread count in selected conversation
        if (currentConversationIdRef.current === conversationId) {
          setSelectedConversation(prev => prev ? {
            ...prev,
            unreadCount: data.unreadCount || 0
          } : null);
        }
        
        // Refresh conversations list to update unread counts
        fetchConversations();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleApprovePhoneAccess = async (conversationId) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/conversations/${conversationId}/approve-phone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update selected conversation
        if (selectedConversation && selectedConversation.id === conversationId) {
          setSelectedConversation(prev => prev ? {
            ...prev,
            phone_sharing_approved: true
          } : null);
        }
        
        // Refresh conversations list
        fetchConversations();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve phone access');
      }
    } catch (error) {
      console.error('Error approving phone access:', error);
      alert('Failed to approve phone access. Please try again.');
    }
  };

  const handleApproveRequest = async (conversationId) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/conversations/${conversationId}/approve-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Refresh conversations list - this will move the request to messages
        fetchConversations();
        
        // Refresh the current conversation to show the approval message
        if (selectedConversation && selectedConversation.id === conversationId) {
          fetchConversation(conversationId);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const cleanupConversationResources = () => {
    // Clear intervals and timeouts
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    if (messagesPollIntervalRef.current) {
      clearTimeout(messagesPollIntervalRef.current);
      messagesPollIntervalRef.current = null;
    }
    // Abort pending fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (pollAbortControllerRef.current) {
      pollAbortControllerRef.current.abort();
      pollAbortControllerRef.current = null;
    }
    // Reset tracking refs
    currentConversationIdRef.current = null;
    lastMessageIdRef.current = null;
    // Reset presence states
    setClientIsLive(false);
    setClientIsTyping(false);
    setPartnerIsLive(false);
  };

  const fetchConversation = async (conversationId) => {
    // Prevent duplicate requests for the same conversation
    if (currentConversationIdRef.current === conversationId && !conversationLoading) {
      return;
    }

    // Clean up previous conversation resources
    cleanupConversationResources();

    // Set current conversation ID immediately
    currentConversationIdRef.current = conversationId;
    
    // Reset last message ID for new conversation
    lastMessageIdRef.current = null;

    // Set loading state
    setConversationLoading(true);
    setConversationError(null);

    // Find conversation in list and set it immediately for instant UI feedback
    const conversationFromList = [...requests, ...messages].find(c => c.id === conversationId);
    if (conversationFromList) {
      setSelectedConversation(conversationFromList);
      // Don't clear messages immediately - keep them until new ones load
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const supabase = getSupabase();
      if (!supabase) {
        currentConversationIdRef.current = null;
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        currentConversationIdRef.current = null;
        return;
      }

      const response = await fetch(`/api/partners/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal
      });

      // Check if request was aborted
      if (signal.aborted) return;

      // Verify conversation is still selected
      if (currentConversationIdRef.current !== conversationId) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Double-check conversation is still selected before updating
        if (currentConversationIdRef.current !== conversationId) {
          setConversationLoading(false);
          return;
        }

        // Update selected conversation with unread count
        setSelectedConversation({
          ...data.conversation,
          unreadCount: data.conversation.unreadCount || 0
        });
        const messages = data.conversation.messages || [];
        setConversationMessages(messages);
        setConversationLoading(false);
        setConversationError(null);
        
        // Track last message ID for incremental polling
        if (messages.length > 0) {
          lastMessageIdRef.current = messages[messages.length - 1].id;
        }

        // Mark messages as read when conversation is viewed (after a short delay to ensure UI is ready)
        if (data.conversation.unreadCount > 0) {
          if (markReadTimeoutRef.current) {
            clearTimeout(markReadTimeoutRef.current);
          }
          markReadTimeoutRef.current = setTimeout(() => {
            markMessagesAsRead(conversationId, session.access_token);
          }, 1000);
        }

        startPresenceTracking(conversationId, session.access_token);
      } else {
        setConversationLoading(false);
        setConversationError('Failed to load conversation');
        if (conversationFromList && currentConversationIdRef.current === conversationId) {
          // Keep the conversation visible but show error
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        setConversationLoading(false);
        return;
      }
      console.error('Error fetching conversation:', error);
      setConversationLoading(false);
      setConversationError('Error loading conversation');
      if (conversationFromList && currentConversationIdRef.current === conversationId) {
        // Keep the conversation visible but show error
      }
    }
  };

  const startPresenceTracking = (conversationId, token) => {
    // Verify conversation is still selected
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    updatePresence(conversationId, token, false);

    const updatePresenceInterval = () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      presenceIntervalRef.current = setInterval(() => {
        // Verify conversation is still selected before checking presence
        if (currentConversationIdRef.current === conversationId) {
          checkPresence(conversationId, token);
        } else {
          cleanupConversationResources();
        }
      }, 3000);
    };
    updatePresenceInterval();

    checkPresence(conversationId, token);
    startMessagePolling(conversationId, token);
  };

  const startMessagePolling = (conversationId, token) => {
    const pollMessages = async () => {
      // Verify conversation is still selected
      if (currentConversationIdRef.current !== conversationId) {
        cleanupConversationResources();
        return;
      }

      try {
        // Create new AbortController for polling request
        if (pollAbortControllerRef.current) {
          pollAbortControllerRef.current.abort();
        }
        pollAbortControllerRef.current = new AbortController();
        const signal = pollAbortControllerRef.current.signal;

        // Use incremental fetching if we have a last message ID
        const url = lastMessageIdRef.current
          ? `/api/partners/conversations/${conversationId}?after=${lastMessageIdRef.current}`
          : `/api/partners/conversations/${conversationId}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal
        });

        // Check if request was aborted
        if (signal.aborted) return;

        // Verify conversation is still selected
        if (currentConversationIdRef.current !== conversationId) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const newMessages = data.conversation.messages || [];
          
          // Verify conversation is still selected before updating
          if (currentConversationIdRef.current !== conversationId) {
            return;
          }

          setConversationMessages(prev => {
            // If we're doing incremental fetching (have lastMessageIdRef), merge new messages
            if (lastMessageIdRef.current) {
              if (newMessages.length > 0) {
                // Merge new messages with existing ones
                const existingIds = new Set(prev.map(m => m.id));
                const merged = [...prev];
                newMessages.forEach(msg => {
                  if (!existingIds.has(msg.id)) {
                    merged.push(msg);
                  }
                });
                if (merged.length > prev.length) {
                  lastMessageIdRef.current = merged[merged.length - 1].id;
                  return merged;
                }
              }
              // No new messages in incremental fetch - keep existing messages
              return prev;
            }
            // Full refresh if no last message ID (initial load)
            if (newMessages.length > 0) {
              lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
              return newMessages;
            }
            // No messages at all - return empty array only if prev is also empty
            return prev.length === 0 ? newMessages : prev;
          });
        }
      } catch (error) {
        // Ignore abort errors
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error polling messages:', error);
      }
    };

    pollMessages();

    const getPollInterval = () => {
      // Verify conversation is still selected
      if (currentConversationIdRef.current !== conversationId) {
        return null;
      }
      if (clientIsLive || partnerIsLive) {
        return (clientIsLive && partnerIsLive) ? 500 : 2000;
      }
      return null;
    };

    const scheduleNextPoll = () => {
      // Verify conversation is still selected
      if (currentConversationIdRef.current !== conversationId) {
        cleanupConversationResources();
        return;
      }

      if (messagesPollIntervalRef.current) {
        clearTimeout(messagesPollIntervalRef.current);
      }
      const interval = getPollInterval();
      if (interval !== null) {
        messagesPollIntervalRef.current = setTimeout(() => {
          // Verify conversation is still selected before polling
          if (currentConversationIdRef.current === conversationId) {
            pollMessages();
            scheduleNextPoll();
          } else {
            cleanupConversationResources();
          }
        }, interval);
      }
    };

    scheduleNextPoll();
  };

  const updatePresence = async (conversationId, token, typing) => {
    try {
      await fetch(`/api/conversations/${conversationId}/presence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isTyping: typing })
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  };

  const checkPresence = async (conversationId, token) => {
    // Verify conversation is still selected
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/presence`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Verify conversation is still selected after fetch
      if (currentConversationIdRef.current !== conversationId) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        // Final check before updating state
        if (currentConversationIdRef.current === conversationId) {
          setClientIsLive(data.clientActive);
          setPartnerIsLive(data.partnerActive);
          const clientUser = data.activeUsers?.find(u => {
            return u.userId !== selectedConversation?.partner?.user_id;
          });
          setClientIsTyping(clientUser?.isTyping || false);
        }
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError') {
        return;
      }
      console.error('Error checking presence:', error);
    }
  };

  useEffect(() => {
    return () => {
      cleanupConversationResources();
    };
  }, []);

  // Clean up when selected conversation changes
  useEffect(() => {
    if (!selectedConversation) {
      cleanupConversationResources();
    }
    // Reset textarea height when conversation changes
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      adjustTextareaHeight(textareaRef.current);
    }
  }, [selectedConversation]);

  // Center conversation in viewport when selected
  useEffect(() => {
    if (selectedConversation && conversationContainerRef.current) {
      // Wait for content to load and animations to complete before scrolling
      setTimeout(() => {
        conversationContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 500);
    }
  }, [selectedConversation, activeView, conversationLoading]);

  // Close conversation when clicking outside the container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!selectedConversation) return;
      
      // Check if click is on textarea or inside textarea's container
      const clickedElement = event.target;
      const isTextarea = clickedElement.tagName === 'TEXTAREA';
      const isInsideTextareaContainer = textareaRef.current && textareaRef.current.contains(clickedElement);
      
      // Check if click is inside any of the conversation containers
      const isInsideContainer = 
        containerWrapperRef.current?.contains(clickedElement) ||
        conversationContainerRef.current?.contains(clickedElement) ||
        messagesContainerWrapperRef.current?.contains(clickedElement);
      
      // Don't close if clicking on textarea or inside containers
      if (isTextarea || isInsideTextareaContainer || isInsideContainer) {
        return;
      }
      
      // Close conversation if clicking outside
      setSelectedConversation(null);
    };

    if (selectedConversation) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedConversation]);

  const [attachments, setAttachments] = useState([]);

  const handleFileUploaded = (attachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation) return;

    setSending(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/partners/conversations/${selectedConversation.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage,
          attachments: attachments.length > 0 ? attachments : null
        })
      });

      if (response.ok) {
        setNewMessage('');
        setAttachments([]);
        updatePresence(selectedConversation.id, session.access_token, false);
        await fetchConversation(selectedConversation.id);
        fetchConversations();
        if (activeView === 'requests') {
          setActiveView('messages');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (conversationMessages.length > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [conversationMessages]);

  // Auto-resize textarea
  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [newMessage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`about-devello-glass rounded-3xl p-8 text-center ${isDark ? 'bg-white/5' : 'bg-white/40'}`}>
          <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Loading conversations...</p>
        </div>
      </div>
    );
  }

  const unifiedMaxHeight = selectedConversation 
    ? 'calc(100vh - 4rem)' 
    : 'calc(100vh - 20rem)';

  return (
    <div className="pt-20 lg:pt-24 pb-8 px-4 lg:px-0">
      <div className="w-full max-w-2xl sm:max-w-4xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentView(VIEWS.DASHBOARD)}
            className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 whitespace-nowrap"
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
              borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
              color: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)'
            }}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Dashboard</span>
          </button>
          <button
            onClick={() => {
              if (isLargeScreen) {
                setDesktopSidebarVisible(prev => !prev);
              } else {
                setSidebarOpen(true);
              }
            }}
            className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 whitespace-nowrap"
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
              color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)'
            }}
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">My options</span>
          </button>
        </div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Client Messages
            </h1>
            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
              Manage conversations with your clients
            </p>
          </div>
        </div>

        {/* Two Column Layout for Requests and Potential Clients */}
        <motion.div 
          className={`grid gap-6 ${
            selectedConversation && activeView === 'messages' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 lg:grid-cols-2'
          }`}
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Requests Container */}
          <motion.div 
            ref={containerWrapperRef}
            animate={{
              opacity: selectedConversation && activeView === 'messages' ? 0.3 : 1,
              scale: selectedConversation && activeView === 'messages' ? 0.98 : 1
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={selectedConversation && activeView === 'messages' ? 'hidden lg:block' : ''}
          >
            <motion.div
              initial={false}
              className="flex flex-col min-h-0"
              animate={{
                height: 'auto'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                ref={conversationContainerRef}
                className="about-devello-glass rounded-3xl border-2 flex flex-col flex-1 min-h-0"
                initial={false}
                animate={{
                  maxHeight: 'calc(100vh - 20rem)'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
                }}
              >
                {/* Requests Header */}
                <div className="p-6 pb-4 flex-shrink-0 border-b border-white/10 flex items-center justify-between">
                  <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <MessageSquare className="h-4 w-4" />
                    Requests
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {requests.length}
                    </span>
                  </h3>
                </div>
                
                {/* Requests List or Expanded View */}
                <AnimatePresence mode="wait">
                  {selectedConversation && activeView === 'requests' && requests.some(r => r.id === selectedConversation.id) ? (
                    <motion.div
                      key="requests-conversation-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="flex-1 flex flex-col min-h-0 px-6 pb-6 relative z-10"
                      style={{ maxHeight: '100%' }}
                    >
                      {/* Conversation Header */}
                      <div className="mb-4 pb-4 border-b border-white/10 flex-shrink-0 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <button
                                onClick={() => setSelectedConversation(null)}
                                className="mr-2 hover:opacity-70 transition-opacity"
                              >
                                <X className={`w-4 h-4 ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`} />
                              </button>
                              <span className="truncate">
                                {(() => {
                                  const firstName = selectedConversation.user?.firstName;
                                  const lastName = selectedConversation.user?.lastName;
                                  if (firstName || lastName) {
                                    return [firstName, lastName].filter(Boolean).join(' ');
                                  }
                                  const email = selectedConversation.user?.email || '';
                                  if (email) {
                                    const namePart = email.split('@')[0];
                                    return namePart.charAt(0).toUpperCase() + namePart.slice(1).split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                                  }
                                  return 'Client';
                                })()}
                              </span>
                              {clientIsLive && (
                                <span className="flex items-center gap-1 text-xs font-normal flex-shrink-0">
                                  <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                                  <span className={isDark ? 'text-green-400' : 'text-green-600'}>Live</span>
                                </span>
                              )}
                              {clientIsTyping && (
                                <span className={`text-xs font-normal italic flex-shrink-0 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                  typing...
                                </span>
                              )}
                            </h3>
                            <p className={`text-sm mt-1 truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                              {selectedConversation.user?.email || 'Unknown Client'}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleApproveRequest(selectedConversation.id)}
                            className="about-devello-glass px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2"
                            style={{
                              backdropFilter: 'blur(20px)',
                              WebkitBackdropFilter: 'blur(20px)',
                              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                              borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
                              color: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)'
                            }}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve Request</span>
                          </motion.button>
                        </div>
                      </div>

                      {/* Messages Area */}
                      <div className="flex-1 flex flex-col min-h-0" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
                        {conversationError && (
                          <div className={`mb-4 p-3 rounded-xl border-2 flex-shrink-0 ${
                            isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                          }`}>
                            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                              {conversationError}
                            </p>
                          </div>
                        )}
                        {conversationLoading && conversationMessages.length === 0 && (
                          <div className="flex-1 flex items-center justify-center relative flex-shrink" style={{ minHeight: '200px' }}>
                            <div className="loading"></div>
                          </div>
                        )}
                        <div ref={messagesContainerRef} className="space-y-4 mb-4 overflow-y-auto" style={{ flex: '1 1 auto', minHeight: '200px', maxHeight: '100%', overflowY: 'auto' }}>
                          {conversationMessages.length === 0 && !conversationLoading && (
                            <div className="flex items-center justify-center py-8">
                              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                No messages yet. Start the conversation!
                              </p>
                            </div>
                          )}
                          <AnimatePresence mode="popLayout">
                            {conversationMessages.map((msg) => (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className={`flex ${msg.senderId === 'partner' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-xl p-3 ${
                                    msg.senderId === 'partner'
                                      ? isDark ? 'bg-blue-500/20 text-white' : 'bg-blue-100 text-gray-900'
                                      : isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                                  }`}
                                >
                                  <div className={`text-xs mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                    {msg.senderName}
                                  </div>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <MessageAttachments attachments={msg.attachments} isDark={isDark} />
                                  )}
                                  {msg.message && (
                                    <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                                  )}
                                  <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input - Fixed at bottom */}
                        <div className="pt-2" style={{ flexShrink: 0 }}>
                          <ChatInput
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            sending={sending}
                            isTyping={false}
                            setIsTyping={() => {}}
                            sendMessage={sendMessage}
                            textareaRef={textareaRef}
                            adjustTextareaHeight={adjustTextareaHeight}
                            isDark={isDark}
                            placeholder="Type your reply..."
                            selectedConversation={selectedConversation}
                            onPresenceUpdate={async (conversationId, typing) => {
                              const supabase = getSupabase();
                              if (supabase) {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (session?.access_token) {
                                  await updatePresence(conversationId, session.access_token, typing);
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="requests-list-view"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col px-6 pb-6"
                    >
                      {requests.length === 0 ? (
                        <div className="text-center py-8 flex-1 flex flex-col items-center justify-center min-h-0">
                          <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white opacity-30' : 'text-gray-400'}`} />
                          <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
                            No new requests. New client requests will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 overflow-x-hidden pt-4 px-2">
                          {requests.map((conv) => {
                          const isSelected = selectedConversation?.id === conv.id && activeView === 'requests';
                          
                          return (
                            <div key={conv.id} className="relative group">
                              <motion.button
                                onClick={() => {
                                  setActiveView('requests');
                                  fetchConversation(conv.id);
                                }}
                                disabled={conversationLoading && isSelected}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                                  isSelected
                                    ? 'border-2'
                                    : ''
                                } ${conversationLoading && isSelected ? 'opacity-75 cursor-wait' : ''}`}
                                style={isSelected ? {
                                  backdropFilter: 'blur(20px)',
                                  WebkitBackdropFilter: 'blur(20px)',
                                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                                  borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)'
                                } : (conv.unreadCount > 0 ? {
                                  backdropFilter: 'blur(20px)',
                                  WebkitBackdropFilter: 'blur(20px)',
                                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.2)',
                                  borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)',
                                  boxShadow: isDark ? '0 0 0 1px rgba(34, 197, 94, 0.3)' : '0 0 0 1px rgba(34, 197, 94, 0.25)'
                                } : {
                                  backdropFilter: 'blur(20px)',
                                  WebkitBackdropFilter: 'blur(20px)',
                                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.1)',
                                  borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.2)'
                                })}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className={`font-medium text-sm truncate ${
                                    isSelected 
                                      ? isDark ? 'text-green-200' : 'text-green-700'
                                      : isDark ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {(() => {
                                      const firstName = conv.user?.firstName;
                                      const lastName = conv.user?.lastName;
                                      if (firstName || lastName) {
                                        return [firstName, lastName].filter(Boolean).join(' ');
                                      }
                                      const email = conv.user?.email || '';
                                      if (email) {
                                        const namePart = email.split('@')[0];
                                        return namePart.charAt(0).toUpperCase() + namePart.slice(1).split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                                      }
                                      return 'Client';
                                    })()}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`text-xs flex-shrink-0 ${
                                      isSelected 
                                        ? isDark ? 'text-green-200 opacity-80' : 'text-green-700 opacity-80'
                                        : isDark ? 'text-white opacity-70' : 'text-gray-600'
                                    }`}>
                                      {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(e, conv.id);
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDelete(e, conv.id);
                                        }
                                      }}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer ${
                                        deletingId === conv.id ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'
                                      }`}
                                      style={{
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`
                                      }}
                                      onMouseEnter={(e) => {
                                        if (deletingId !== conv.id) {
                                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)';
                                      }}
                                    >
                                      <Trash2 className={`w-3.5 h-3.5 ${isDark ? 'text-red-300' : 'text-red-600'}`} />
                                    </div>
                                  </div>
                                </div>
                                <div className={`text-xs mb-2 truncate ${
                                  isSelected 
                                    ? isDark ? 'text-green-200 opacity-90' : 'text-green-700 opacity-90'
                                    : isDark ? 'text-white opacity-80' : 'text-gray-700'
                                }`}>
                                  {conv.lastMessage?.message ? (
                                    conv.lastMessage.message.length > 60 
                                      ? conv.lastMessage.message.substring(0, 60) + '...'
                                      : conv.lastMessage.message
                                  ) : (
                                    conv.user?.email || 'No preview'
                                  )}
                                </div>
                              </motion.button>
                            </div>
                          );
                        })}
                      </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Potential Clients Container */}
          <motion.div 
            ref={messagesContainerWrapperRef}
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={selectedConversation && activeView === 'messages' ? 'lg:col-span-2' : ''}
          >
            <motion.div
              layout
              className="flex flex-col min-h-0"
              animate={{
                height: 'auto'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                layout
                className="about-devello-glass rounded-3xl border-2 flex flex-col flex-1 min-h-0"
                animate={{
                  maxHeight: selectedConversation && activeView === 'messages' 
                    ? 'calc(100vh - 10rem)' 
                    : 'calc(100vh - 20rem)'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
                }}
              >
                {/* Potential Clients Header */}
                <div className="p-6 pb-4 flex-shrink-0 border-b border-white/10 flex items-center justify-between">
                  <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <MessageSquare className="h-4 w-4" />
                    Potential Clients
                    {messages.length > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {messages.length}
                      </span>
                    )}
                  </h3>
                </div>
            
                {/* Messages List or Expanded View */}
                <AnimatePresence mode="wait">
                  {selectedConversation && activeView === 'messages' ? (
                <motion.div
                  key="messages-conversation-view"
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    duration: 0.4
                  }}
                  className="flex-1 flex flex-col min-h-0 px-6 pb-6"
                  style={{ maxHeight: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Conversation Header */}
                  <div className="mb-4 pb-4 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <button
                            onClick={() => setSelectedConversation(null)}
                            className="mr-2 hover:opacity-70 transition-opacity"
                          >
                            <X className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-gray-600'}`} />
                          </button>
                          <span className="truncate">
                            {(() => {
                              const firstName = selectedConversation.user?.firstName;
                              const lastName = selectedConversation.user?.lastName;
                              if (firstName || lastName) {
                                return [firstName, lastName].filter(Boolean).join(' ');
                              }
                              const email = selectedConversation.user?.email || '';
                              if (email) {
                                const namePart = email.split('@')[0];
                                return namePart.charAt(0).toUpperCase() + namePart.slice(1).split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                              }
                              return 'Client';
                            })()}
                          </span>
                          {clientIsLive && (
                            <span className="flex items-center gap-1 text-xs font-normal flex-shrink-0">
                              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                              <span className={isDark ? 'text-green-400' : 'text-green-600'}>Live</span>
                            </span>
                          )}
                          {clientIsTyping && (
                            <span className={`text-xs font-normal italic flex-shrink-0 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                              typing...
                            </span>
                          )}
                        </h3>
                        <p className={`text-sm mt-1 truncate ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                          {selectedConversation.user?.email || 'Unknown Client'}
                        </p>
                      </div>
                      {!selectedConversation.phone_sharing_approved && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApprovePhoneAccess(selectedConversation.id)}
                          className="about-devello-glass px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-2"
                          style={{
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                            borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
                            color: isDark ? 'rgb(134, 239, 172)' : 'rgb(22, 163, 74)'
                          }}
                        >
                          <Phone className="w-3 h-3" />
                          <span>Approve Phone</span>
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 flex flex-col min-h-0" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
                    {conversationError && (
                      <div className={`mb-4 p-3 rounded-xl border-2 flex-shrink-0 ${
                        isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
                      }`}>
                        <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                          {conversationError}
                        </p>
                      </div>
                    )}
                    {conversationLoading && conversationMessages.length === 0 && (
                      <div className="flex-1 flex items-center justify-center relative flex-shrink" style={{ minHeight: '200px' }}>
                        <div className="loading"></div>
                      </div>
                    )}
                    <div ref={messagesContainerRef} className="space-y-4 mb-4 overflow-y-auto" style={{ flex: '1 1 auto', minHeight: '200px', maxHeight: '100%', overflowY: 'auto' }}>
                      {conversationMessages.length === 0 && !conversationLoading && (
                        <div className="flex items-center justify-center py-8">
                          <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                            No messages yet. Start the conversation!
                          </p>
                        </div>
                      )}
                      <AnimatePresence mode="popLayout">
                        {conversationMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={`flex ${msg.senderId === 'partner' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl p-3 ${
                                msg.senderId === 'partner'
                                  ? isDark ? 'bg-blue-500/20 text-white' : 'bg-blue-100 text-gray-900'
                                  : isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className={`text-xs mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                                {msg.senderName}
                              </div>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <MessageAttachments attachments={msg.attachments} isDark={isDark} />
                              )}
                              {msg.message && (
                                <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                              )}
                              <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                {new Date(msg.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input - Fixed at bottom */}
                    <div className="pt-2" style={{ flexShrink: 0 }}>
                      <ChatInput
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        sending={sending}
                        isTyping={false}
                        setIsTyping={() => {}}
                        sendMessage={sendMessage}
                        textareaRef={textareaRef}
                        adjustTextareaHeight={adjustTextareaHeight}
                        isDark={isDark}
                        placeholder="Type your reply..."
                        selectedConversation={selectedConversation}
                        onPresenceUpdate={async (conversationId, typing) => {
                          const supabase = getSupabase();
                          if (supabase) {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (session?.access_token) {
                              await updatePresence(conversationId, session.access_token, typing);
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="messages-list-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex-1 flex flex-col min-h-0 px-6 pb-6 ${selectedConversation && activeView === 'requests' ? 'relative z-0 opacity-50 pointer-events-none' : ''}`}
                >
                  {messages.length === 0 ? (
                    <div className="text-center py-8 flex-1 flex flex-col items-center justify-center min-h-0">
                      <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white opacity-30' : 'text-gray-400'}`} />
                      <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
                        No active conversations. Replied requests will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 flex-1 overflow-y-auto min-h-0 overflow-x-hidden pt-2 px-2 max-h-[600px]">
                      {messages.map((conv) => {
                        const isSelected = selectedConversation?.id === conv.id && activeView === 'messages';
                        
                        return (
                          <div key={conv.id} className="relative group">
                            <motion.button
                              onClick={() => {
                                setActiveView('messages');
                                fetchConversation(conv.id);
                              }}
                              disabled={conversationLoading && isSelected}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                                isSelected
                                  ? 'border-2'
                                  : isDark ? 'border-white/10 bg-transparent' : 'border-gray-200 bg-transparent'
                              } ${conversationLoading && isSelected ? 'opacity-75 cursor-wait' : ''}`}
                              style={isSelected ? {
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)'
                              } : (conv.unreadCount > 0 ? {
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'rgba(34, 197, 94, 0.2)',
                                borderColor: isDark ? 'rgba(34, 197, 94, 0.5)' : 'rgba(34, 197, 94, 0.4)',
                                boxShadow: isDark ? '0 0 0 1px rgba(34, 197, 94, 0.3)' : '0 0 0 1px rgba(34, 197, 94, 0.25)'
                              } : {})}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className={`font-medium text-sm truncate ${
                                  isSelected 
                                    ? isDark ? 'text-blue-200' : 'text-blue-700'
                                    : isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {(() => {
                                    const firstName = conv.user?.firstName;
                                    const lastName = conv.user?.lastName;
                                    if (firstName || lastName) {
                                      return [firstName, lastName].filter(Boolean).join(' ');
                                    }
                                    const email = conv.user?.email || '';
                                    if (email) {
                                      const namePart = email.split('@')[0];
                                      return namePart.charAt(0).toUpperCase() + namePart.slice(1).split(/[._-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                                    }
                                    return 'Client';
                                  })()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`text-xs flex-shrink-0 ${
                                    isSelected 
                                      ? isDark ? 'text-blue-200/80' : 'text-blue-700/80'
                                      : isDark ? 'text-white/70' : 'text-gray-600'
                                  } opacity-70`}>
                                    {new Date(conv.lastMessageAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                  <button
                                    onClick={(e) => handleDelete(e, conv.id)}
                                    disabled={deletingId === conv.id}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                      deletingId === conv.id ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                    style={{
                                      backdropFilter: 'blur(10px)',
                                      WebkitBackdropFilter: 'blur(10px)',
                                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)'}`
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)';
                                    }}
                                  >
                                    <Trash2 className={`w-3.5 h-3.5 ${isDark ? 'text-red-300' : 'text-red-600'}`} />
                                  </button>
                                </div>
                              </div>
                              <div className={`text-xs mb-2 truncate ${
                                isSelected 
                                  ? isDark ? 'text-blue-200/90' : 'text-blue-700/90'
                                  : isDark ? 'text-white/80' : 'text-gray-700'
                              } opacity-80`}>
                                {conv.lastMessage?.message ? (
                                  conv.lastMessage.message.length > 60 
                                    ? conv.lastMessage.message.substring(0, 60) + '...'
                                    : conv.lastMessage.message
                                ) : (
                                  conv.user?.email || 'No preview'
                                )}
                              </div>
                            </motion.button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
        </motion.div>
        </motion.div>

        {/* Orders/Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="about-devello-glass rounded-3xl p-6 border-2 mt-6"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
          }}
        >
          <h3 className={`text-base font-semibold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Folder className="h-4 w-4" />
            {isManufacturing ? 'Current Orders' : 'Current Projects'}
          </h3>
          {ordersProjectsLoading ? (
            <div className="text-center py-8 relative" style={{ minHeight: '200px' }}>
              <div className="loading"></div>
            </div>
          ) : (isManufacturing ? orders : projects).length === 0 ? (
            <div className="text-center py-8">
              <Folder className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-white opacity-30' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
                {isManufacturing 
                  ? 'Your active orders will appear here'
                  : 'Your active projects will appear here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(isManufacturing ? orders : projects).slice(0, 6).map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCurrentView(VIEWS.ACTIVE_PROJECTS);
                    setSidebarOpen(false);
                    setDesktopSidebarVisible(false);
                  }}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/40 border-white/30 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                      item.status === 'active' 
                        ? isDark ? 'bg-green-500/30 text-green-300' : 'bg-green-100 text-green-700'
                        : item.status === 'completed'
                        ? isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                        : isDark ? 'bg-gray-500/30 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className={`text-xs mb-2 line-clamp-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {item.description || 'No description'}
                  </p>
                  <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {item.user?.profile?.first_name || item.user?.email || 'Client'}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Active Projects View
function ActiveProjectsView({ isDark, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, setCurrentView, partnerData }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const serviceType = getPartnerServiceType(partnerData);
  const isManufacturing = serviceType === 'manufacturing';

  useEffect(() => {
    // Fetch projects - placeholder for now
    setTimeout(() => {
      setProjects([]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="pt-20 lg:pt-24 pb-8 px-4 lg:px-0">
      <div className="w-full max-w-2xl sm:max-w-4xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentView(VIEWS.DASHBOARD)}
            className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 whitespace-nowrap"
            style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
              borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
              color: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)'
            }}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Dashboard</span>
          </button>
          <button
            onClick={() => {
              if (isLargeScreen) {
                setDesktopSidebarVisible(prev => !prev);
              } else {
                setSidebarOpen(true);
              }
            }}
            className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 whitespace-nowrap"
            style={{
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
              color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)'
            }}
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap">My options</span>
          </button>
        </div>
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isManufacturing ? 'Active Orders' : 'Potential Clients'}
          </h1>
          <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            {isManufacturing ? 'Track and manage your active orders' : 'Track and manage your potential clients'}
          </p>
        </div>
        <div className={`about-devello-glass rounded-3xl p-8 text-center ${isDark ? 'bg-white/5' : 'bg-white/40'}`}>
          <Folder className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
          <p className={isDark ? 'text-white/60' : 'text-gray-600'}>
            {isManufacturing 
              ? 'No active orders yet. Upgrade conversations to orders to get started.'
              : 'No potential clients yet. Upgrade conversations to projects to get started.'}
          </p>
        </div>
      </div>
    </div>
  );
}
