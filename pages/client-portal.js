import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/auth/AuthProvider';
import { useTheme } from '../components/Layout';
import { getSupabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import CustomBuildsButton from '../components/CustomBuildsAd';
import PartnerMessageModal from '../components/PartnerMessageModal';
import { useConversations } from '../hooks/useConversations';
import { useEmailNotifications } from '../hooks/useEmailNotifications';
import ServiceConversationsView from '../components/ServiceConversationsView';
import { 
  MessageSquare, 
  Send, 
  Folder, 
  X, 
  Circle, 
  Menu,
  Package,
  Briefcase,
  Hammer,
  Home,
  User,
  Bell,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  FileText,
  Wrench,
  Code,
  Factory,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  File,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import MessageAttachments from '../components/MessageAttachments';
import UnifiedFileUpload from '../components/UnifiedFileUpload';
import OrderDetailsModal from '../components/OrderDetailsModal';
import ProductOrderDetailsModal from '../components/ProductOrderDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';

const VIEWS = {
  DASHBOARD: 'dashboard',
  CONVERSATIONS: 'conversations',
  PRODUCT_ORDERS: 'product_orders',
  CONSULTATIONS: 'consultations',
  BUILD_REQUESTS: 'build_requests',
  RENOVATIONS: 'renovations'
};

export default function ClientPortal() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { isDark } = useTheme();
  const [currentView, setCurrentView] = useState(VIEWS.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  // Use unified notification hook
  const {
    emailNotificationsEnabled,
    loading: notificationLoading,
    toggleNotifications: handleNotificationToggle
  } = useEmailNotifications();
  
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [hasActiveConsultations, setHasActiveConsultations] = useState(false);
  const [hasActiveBuildRequests, setHasActiveBuildRequests] = useState(false);
  
  // Use the conversations hook
  const {
    conversations,
    selectedConversation,
    messages,
    newMessage,
    loading,
    conversationLoading,
    sending,
    isTyping,
    clientIsLive,
    partnerIsLive,
    partnerIsTyping,
    streamingMessage,
    unreadCount,
    conversationError,
    attachments = [],
    setAttachments = () => {},
    messagesEndRef,
    messagesContainerRef,
    textareaRef,
    conversationContainerRef,
    containerWrapperRef,
    setNewMessage,
    setIsTyping,
    fetchConversations,
    fetchConversation,
    sendMessage,
    adjustTextareaHeight
  } = useConversations();

  // Set initial view from query parameter
  useEffect(() => {
    if (router.isReady && router.query.view) {
      const viewParam = router.query.view;
      // Map query param to VIEWS constant
      const viewMap = {
        'product_orders': VIEWS.PRODUCT_ORDERS,
        'conversations': VIEWS.CONVERSATIONS,
        'consultations': VIEWS.CONSULTATIONS,
        'build_requests': VIEWS.BUILD_REQUESTS,
        'renovations': VIEWS.RENOVATIONS,
        'dashboard': VIEWS.DASHBOARD
      };
      if (viewMap[viewParam]) {
        setCurrentView(viewMap[viewParam]);
      }
    }
  }, [router.isReady, router.query.view]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    if (user) {
      fetchConversations();
      
      // Set up periodic refresh of unread counts (every 30 seconds)
      const interval = setInterval(() => {
        fetchConversations();
      }, 30000);
      
      return () => {
        clearInterval(interval);
      };
    }
  }, [user, authLoading, fetchConversations]);

  // Track screen size for sidebar toggle
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Handle browser back button - when on any non-dashboard view, go back to dashboard
  useEffect(() => {
    const handlePopState = () => {
      if (currentView !== VIEWS.DASHBOARD) {
        setCurrentView(VIEWS.DASHBOARD);
        // Push new state to replace the popped state
        window.history.pushState({ view: VIEWS.DASHBOARD }, '', window.location.href);
      }
    };

    // Push state when entering any non-dashboard view
    if (currentView !== VIEWS.DASHBOARD) {
      window.history.pushState({ view: currentView }, '', window.location.href);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentView]);

  // Center conversation in viewport when selected
  useEffect(() => {
    if (selectedConversation && conversationContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = conversationContainerRef.current;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const containerHeight = containerRect.height;
            
            // Calculate the scroll position to center the container vertically
            const scrollY = window.scrollY + containerRect.top - (viewportHeight / 2) + (containerHeight / 2);
            
            window.scrollTo({
              top: Math.max(0, scrollY),
              behavior: 'smooth'
            });
          }
        }, 100);
      });
    }
  }, [selectedConversation, conversationLoading]);

  // Close conversation when clicking outside the container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectedConversation &&
        containerWrapperRef.current &&
        !containerWrapperRef.current.contains(event.target) &&
        !conversationContainerRef.current?.contains(event.target)
      ) {
        fetchConversation(null);
      }
    };

    if (selectedConversation) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedConversation, fetchConversation]);

  // Notification preferences are now handled by useEmailNotifications hook

  // Check for active projects
  const checkActiveProjects = useCallback(async () => {
    if (!user) {
      setHasActiveOrders(false);
      setHasActiveConsultations(false);
      setHasActiveBuildRequests(false);
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Check for active orders (status not in ['completed', 'cancelled', 'refunded'])
      const [productOrdersResponse] = await Promise.all([
        fetch('/api/products/orders/list', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      let hasActiveOrdersValue = false;
      if (productOrdersResponse.ok) {
        const productData = await productOrdersResponse.json();
        const orders = productData.orders || [];
        hasActiveOrdersValue = orders.some(order => {
          const status = order.status?.toLowerCase();
          return status && !['completed', 'cancelled', 'refunded'].includes(status);
        });
      }
      setHasActiveOrders(hasActiveOrdersValue);

      // Check for active consultations (conversations with serviceType 'consulting')
      const consultationsConvs = conversations.filter(conv => {
        const serviceType = conv.partner?.serviceType?.toLowerCase() || '';
        return serviceType.includes('consulting');
      });
      setHasActiveConsultations(consultationsConvs.length > 0);

      // Check for active build requests (conversations with serviceType 'software')
      const buildRequestsConvs = conversations.filter(conv => {
        const serviceType = conv.partner?.serviceType?.toLowerCase() || '';
        return serviceType.includes('software') || serviceType.includes('software_dev');
      });
      setHasActiveBuildRequests(buildRequestsConvs.length > 0);
    } catch (error) {
      console.error('[CLIENT_PORTAL] Error checking active projects:', error);
    }
  }, [user, conversations]);

  // Check active projects when user or conversations change
  useEffect(() => {
    if (user) {
      checkActiveProjects();
    }
  }, [user, checkActiveProjects]);

  // Handlers for QuickActionsSection
  const handleFileUpload = async (fileData) => {
    if (!selectedConversation) return;
    
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      const response = await fetch(`/api/conversations/${selectedConversation.id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileData)
      });
      
      if (response.ok) {
        await fetchConversations();
        fetchConversation(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleRequestPhoneAccess = async () => {
    if (!selectedConversation) return;
    
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      // Send a message requesting phone access
      const response = await fetch(`/api/conversations/${selectedConversation.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '📞 Requesting phone number access for direct communication.'
        })
      });
      
      if (response.ok) {
        await fetchConversations();
        fetchConversation(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error requesting phone access:', error);
    }
  };

  const handleRequestUpdate = async () => {
    if (!selectedConversation) return;
    
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      const response = await fetch(`/api/conversations/${selectedConversation.id}/request-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await fetchConversations();
        fetchConversation(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error requesting update:', error);
    }
  };

  const getServiceTypeColor = (serviceType) => {
    if (!serviceType) return 'blue';
    
    const normalizedType = serviceType.toLowerCase();
    if (normalizedType.includes('construction')) return 'orange';
    if (normalizedType.includes('software') || normalizedType.includes('software_dev')) return 'blue';
    if (normalizedType.includes('consulting')) return 'yellow';
    if (normalizedType.includes('manufacturing')) return 'green';
    return 'blue';
  };

  const getServiceColors = (color) => {
    const colors = {
      blue: {
        bg: isDark ? 'bg-blue-600/40' : 'bg-blue-600/20',
        border: isDark ? 'border-blue-500/50' : 'border-blue-500/30',
        text: isDark ? 'text-blue-300' : 'text-blue-800',
        icon: isDark ? 'text-blue-400' : 'text-blue-600'
      },
      orange: {
        bg: isDark ? 'bg-orange-600/40' : 'bg-orange-600/20',
        border: isDark ? 'border-orange-500/50' : 'border-orange-500/30',
        text: isDark ? 'text-orange-300' : 'text-orange-800',
        icon: isDark ? 'text-orange-400' : 'text-orange-600'
      },
      yellow: {
        bg: isDark ? 'bg-yellow-500/40' : 'bg-yellow-500/20',
        border: isDark ? 'border-yellow-400/50' : 'border-yellow-400/30',
        text: isDark ? 'text-yellow-300' : 'text-yellow-800',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600'
      },
      green: {
        bg: isDark ? 'bg-green-600/40' : 'bg-green-600/20',
        border: isDark ? 'border-green-500/50' : 'border-green-500/30',
        text: isDark ? 'text-green-300' : 'text-green-800',
        icon: isDark ? 'text-green-400' : 'text-green-600'
      },
      purple: {
        bg: isDark ? 'bg-purple-600/40' : 'bg-purple-600/20',
        border: isDark ? 'border-purple-500/50' : 'border-purple-500/30',
        text: isDark ? 'text-purple-300' : 'text-purple-800',
        icon: isDark ? 'text-purple-400' : 'text-purple-600'
      }
    };
    return colors[color] || colors.blue;
  };


  useEffect(() => {
    if (authLoading || loading) {
      document.body.classList.add('loading-body');
    } else {
      document.body.classList.remove('loading-body');
    }
    return () => {
      document.body.classList.remove('loading-body');
    };
  }, [authLoading, loading]);

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center relative ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
        <div className="loading"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
        unreadCount={unreadCount}
        router={router}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {currentView === VIEWS.DASHBOARD && (
            <DashboardView
              isDark={isDark}
              conversations={conversations}
              unreadCount={unreadCount}
              setCurrentView={setCurrentView}
              router={router}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              fetchConversation={fetchConversation}
              emailNotificationsEnabled={emailNotificationsEnabled}
              notificationLoading={notificationLoading}
              handleNotificationToggle={handleNotificationToggle}
              hasActiveOrders={hasActiveOrders}
              hasActiveConsultations={hasActiveConsultations}
              hasActiveBuildRequests={hasActiveBuildRequests}
            />
          )}
          {currentView === VIEWS.PRODUCT_ORDERS && (
            <ProductOrdersView 
              isDark={isDark}
              conversations={conversations}
              selectedConversation={selectedConversation}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              attachments={attachments}
              setAttachments={setAttachments}
              sending={sending}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              clientIsLive={clientIsLive}
              partnerIsLive={partnerIsLive}
              partnerIsTyping={partnerIsTyping}
              streamingMessage={streamingMessage}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              fetchConversation={fetchConversation}
              sendMessage={sendMessage}
              getServiceTypeColor={getServiceTypeColor}
              getServiceColors={getServiceColors}
              fetchConversations={fetchConversations}
              handleFileUpload={handleFileUpload}
              handleRequestPhoneAccess={handleRequestPhoneAccess}
              handleRequestUpdate={handleRequestUpdate}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              setCurrentView={setCurrentView}
              conversationLoading={conversationLoading}
              conversationError={conversationError}
              conversationContainerRef={conversationContainerRef}
              containerWrapperRef={containerWrapperRef}
              textareaRef={textareaRef}
              adjustTextareaHeight={adjustTextareaHeight}
            />
          )}
          {currentView === VIEWS.CONSULTATIONS && (
            <ConsultationsView 
              isDark={isDark}
              conversations={conversations}
              selectedConversation={selectedConversation}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              attachments={attachments}
              setAttachments={setAttachments}
              sending={sending}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              clientIsLive={clientIsLive}
              partnerIsLive={partnerIsLive}
              partnerIsTyping={partnerIsTyping}
              streamingMessage={streamingMessage}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              fetchConversation={fetchConversation}
              sendMessage={sendMessage}
              getServiceTypeColor={getServiceTypeColor}
              getServiceColors={getServiceColors}
              fetchConversations={fetchConversations}
              handleFileUpload={handleFileUpload}
              handleRequestPhoneAccess={handleRequestPhoneAccess}
              handleRequestUpdate={handleRequestUpdate}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              setCurrentView={setCurrentView}
              conversationLoading={conversationLoading}
              conversationError={conversationError}
              conversationContainerRef={conversationContainerRef}
              containerWrapperRef={containerWrapperRef}
              textareaRef={textareaRef}
              adjustTextareaHeight={adjustTextareaHeight}
            />
          )}
          {currentView === VIEWS.BUILD_REQUESTS && (
            <BuildRequestsView 
              isDark={isDark}
              conversations={conversations}
              selectedConversation={selectedConversation}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sending={sending}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              clientIsLive={clientIsLive}
              partnerIsLive={partnerIsLive}
              partnerIsTyping={partnerIsTyping}
              streamingMessage={streamingMessage}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              fetchConversation={fetchConversation}
              sendMessage={sendMessage}
              getServiceTypeColor={getServiceTypeColor}
              getServiceColors={getServiceColors}
              fetchConversations={fetchConversations}
              handleFileUpload={handleFileUpload}
              handleRequestPhoneAccess={handleRequestPhoneAccess}
              handleRequestUpdate={handleRequestUpdate}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              setCurrentView={setCurrentView}
              conversationLoading={conversationLoading}
              conversationError={conversationError}
              conversationContainerRef={conversationContainerRef}
              containerWrapperRef={containerWrapperRef}
            />
          )}
          {currentView === VIEWS.RENOVATIONS && (
            <RenovationsView 
              isDark={isDark}
              conversations={conversations}
              selectedConversation={selectedConversation}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              attachments={attachments}
              setAttachments={setAttachments}
              sending={sending}
              isTyping={isTyping}
              setIsTyping={setIsTyping}
              clientIsLive={clientIsLive}
              partnerIsLive={partnerIsLive}
              partnerIsTyping={partnerIsTyping}
              streamingMessage={streamingMessage}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              fetchConversation={fetchConversation}
              sendMessage={sendMessage}
              getServiceTypeColor={getServiceTypeColor}
              getServiceColors={getServiceColors}
              fetchConversations={fetchConversations}
              handleFileUpload={handleFileUpload}
              handleRequestPhoneAccess={handleRequestPhoneAccess}
              handleRequestUpdate={handleRequestUpdate}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              desktopSidebarVisible={desktopSidebarVisible}
              setDesktopSidebarVisible={setDesktopSidebarVisible}
              isLargeScreen={isLargeScreen}
              setCurrentView={setCurrentView}
              conversationLoading={conversationLoading}
              conversationError={conversationError}
              conversationContainerRef={conversationContainerRef}
              containerWrapperRef={containerWrapperRef}
              textareaRef={textareaRef}
              adjustTextareaHeight={adjustTextareaHeight}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Glass Sidebar Component
function GlassSidebar({ isDark, currentView, setCurrentView, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, unreadCount, router }) {
  const getSidebarItemColors = (color) => {
    const colors = {
      blue: {
        bg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
        border: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
        text: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)',
        icon: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)'
      },
      green: {
        bg: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
        border: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)',
        text: isDark ? 'rgb(134, 239, 172)' : 'rgb(22, 163, 74)',
        icon: isDark ? 'rgb(134, 239, 172)' : 'rgb(22, 163, 74)'
      },
      purple: {
        bg: isDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.15)',
        border: isDark ? 'rgba(147, 51, 234, 0.4)' : 'rgba(147, 51, 234, 0.3)',
        text: isDark ? 'rgb(196, 181, 253)' : 'rgb(126, 34, 206)',
        icon: isDark ? 'rgb(196, 181, 253)' : 'rgb(126, 34, 206)'
      },
      yellow: {
        bg: isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.15)',
        border: isDark ? 'rgba(234, 179, 8, 0.4)' : 'rgba(234, 179, 8, 0.3)',
        text: isDark ? 'rgb(253, 224, 71)' : 'rgb(202, 138, 4)',
        icon: isDark ? 'rgb(253, 224, 71)' : 'rgb(202, 138, 4)'
      },
      orange: {
        bg: isDark ? 'rgba(234, 88, 12, 0.2)' : 'rgba(234, 88, 12, 0.15)',
        border: isDark ? 'rgba(234, 88, 12, 0.4)' : 'rgba(234, 88, 12, 0.3)',
        text: isDark ? 'rgb(254, 215, 170)' : 'rgb(194, 65, 12)',
        icon: isDark ? 'rgb(254, 215, 170)' : 'rgb(194, 65, 12)'
      },
      white: {
        bg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
        border: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        text: isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)',
        icon: isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'
      }
    };
    return colors[color] || colors.blue;
  };

  const sidebarItems = [
    { id: VIEWS.PRODUCT_ORDERS, label: 'My Product Orders', icon: Package, color: 'green' },
    { id: VIEWS.BUILD_REQUESTS, label: 'My Build Requests', icon: Hammer, color: 'blue' },
    { id: VIEWS.CONSULTATIONS, label: 'My Consultations', icon: Briefcase, color: 'yellow' },
    { id: VIEWS.RENOVATIONS, label: 'My Renovations', icon: Wrench, color: 'orange' },
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
                className="about-devello-glass px-4 py-3 rounded-full text-base font-medium transition-all duration-300 flex items-center gap-2"
                style={{
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
                  color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)'
                }}
              >
                <X className="w-5 h-5" style={{ color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)' }} />
                <span>Close</span>
              </motion.button>

              {/* Menu Items */}
              {sidebarItems.map((item, index) => {
                const Icon = item.icon;
                const colors = getSidebarItemColors(item.color);
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
                      style={{
                        backgroundColor: currentView === item.id ? undefined : colors.bg,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: colors.icon }} />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
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
                  className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 justify-end whitespace-nowrap"
                  style={{
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)',
                    color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)'
                  }}
                >
                  <X className="w-5 h-5 flex-shrink-0" style={{ color: isDark ? 'rgb(254, 202, 202)' : 'rgb(185, 28, 28)' }} />
                  <span>Close</span>
                </motion.button>

                {/* Menu Items */}
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const colors = getSidebarItemColors(item.color);
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
                      style={{
                        backgroundColor: currentView === item.id ? undefined : colors.bg,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: colors.icon }} />
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
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

// Dashboard View with Bento Grid
function DashboardView({ isDark, conversations, unreadCount, setCurrentView, router, sidebarOpen, setSidebarOpen, desktopSidebarVisible, setDesktopSidebarVisible, isLargeScreen, fetchConversation, emailNotificationsEnabled, notificationLoading, handleNotificationToggle, hasActiveOrders, hasActiveConsultations, hasActiveBuildRequests }) {
  const allQuickActions = [
    {
      title: 'View Orders',
      description: 'Track your products',
      icon: Package,
      color: 'green', // Manufacturing
      showWhen: hasActiveOrders,
      onClick: () => {
        setCurrentView(VIEWS.PRODUCT_ORDERS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    },
    {
      title: 'My Consultations',
      description: 'Business advice',
      icon: Briefcase,
      color: 'yellow', // Consulting
      showWhen: hasActiveConsultations,
      onClick: () => {
        setCurrentView(VIEWS.CONSULTATIONS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    },
    {
      title: 'Build Requests',
      description: 'Software projects',
      icon: Hammer,
      color: 'blue', // Software
      showWhen: hasActiveBuildRequests,
      onClick: () => {
        setCurrentView(VIEWS.BUILD_REQUESTS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    },
    {
      title: 'My Renovations',
      description: 'Track renovations',
      icon: Wrench,
      color: 'orange', // Construction
      showWhen: false, // Always hide renovations from bento grid (it's shown in Active Conversations section)
      onClick: () => {
        setCurrentView(VIEWS.RENOVATIONS);
        setSidebarOpen(false);
        setDesktopSidebarVisible(false);
      }
    }
  ];

  // Filter quickActions to only show buttons when active projects exist
  const quickActions = allQuickActions.filter(action => action.showWhen);

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: isDark ? 'bg-blue-600/40' : 'bg-blue-600/20',
        border: isDark ? 'border-blue-500/50' : 'border-blue-500/30',
        text: isDark ? 'text-blue-300' : 'text-blue-800',
        icon: isDark ? 'text-blue-400' : 'text-blue-600'
      },
      green: {
        bg: isDark ? 'bg-green-600/40' : 'bg-green-600/20',
        border: isDark ? 'border-green-500/50' : 'border-green-500/30',
        text: isDark ? 'text-green-300' : 'text-green-800',
        icon: isDark ? 'text-green-400' : 'text-green-600'
      },
      purple: {
        bg: isDark ? 'bg-purple-600/40' : 'bg-purple-600/20',
        border: isDark ? 'border-purple-500/50' : 'border-purple-500/30',
        text: isDark ? 'text-purple-300' : 'text-purple-800',
        icon: isDark ? 'text-purple-400' : 'text-purple-600'
      },
      yellow: {
        bg: isDark ? 'bg-yellow-500/40' : 'bg-yellow-500/20',
        border: isDark ? 'border-yellow-400/50' : 'border-yellow-400/30',
        text: isDark ? 'text-yellow-300' : 'text-yellow-800',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600'
      },
      orange: {
        bg: isDark ? 'bg-orange-600/40' : 'bg-orange-600/20',
        border: isDark ? 'border-orange-500/50' : 'border-orange-500/30',
        text: isDark ? 'text-orange-300' : 'text-orange-800',
        icon: isDark ? 'text-orange-400' : 'text-orange-600'
      },
      white: {
        bg: isDark ? 'bg-white/10' : 'bg-white/20',
        border: isDark ? 'border-white/20' : 'border-white/30',
        text: isDark ? 'text-white' : 'text-gray-900',
        icon: isDark ? 'text-white' : 'text-gray-900'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="pt-20 lg:pt-24 pb-8 px-6 lg:px-0">
      <div className="w-full max-w-2xl sm:max-w-4xl mx-auto px-0 sm:px-6 lg:px-8">
      {/* Sidebar Button - Above Welcome */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            // On large screens, toggle desktop sidebar
            // On smaller screens, open mobile sidebar
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
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back!
            </h1>
            <p className={`text-lg ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
              Here's what's happening with your projects
            </p>
          </div>
        </div>

        {/* Email Notifications Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`rounded-2xl p-4 border-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/50'} mb-6`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-gray-600'}`} />
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Email Notifications
                </p>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                  Get notified when partners send you messages
                </p>
              </div>
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
      </motion.div>

      {/* Bento Grid */}
      {quickActions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const colors = getColorClasses(action.color);
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.onClick}
                className={`about-devello-glass rounded-3xl p-6 border-2 ${colors.border} ${colors.bg} text-left group hover:scale-[1.02] transition-all`}
              >
                <div className={`p-3 rounded-2xl w-fit mb-4 ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${colors.text}`}>
                  {action.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                  {action.description}
                </p>
                <ArrowRight className={`w-5 h-5 mt-4 ${colors.icon} group-hover:translate-x-1 transition-transform`} />
              </motion.button>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-8 border-2 mb-8 text-center ${
            isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white/50'
          }`}
        >
          <p className={`text-lg ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            No active projects at the moment. Your active orders, consultations, and build requests will appear here.
          </p>
        </motion.div>
      )}


      {/* New Messages Card */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <div className={`about-devello-glass rounded-3xl p-6 border-2 ${
            isDark ? 'border-blue-400/30 bg-blue-500/10' : 'border-blue-300/50 bg-blue-50/50'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Bell className={`w-6 h-6 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {unreadCount} New Message{unreadCount !== 1 ? 's' : ''}
                </h3>
                <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
                  You have unread messages from partners
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}

// Helper function to filter conversations by service type
function filterConversationsByServiceType(conversations, serviceType) {
  if (!conversations || !serviceType) return [];
  
  const normalizedServiceType = serviceType.toLowerCase();
  return conversations.filter(conv => {
    const convServiceType = conv.partner?.serviceType?.toLowerCase() || '';
    if (normalizedServiceType === 'manufacturing') {
      return convServiceType.includes('manufacturing');
    } else if (normalizedServiceType === 'consulting') {
      return convServiceType.includes('consulting');
    } else if (normalizedServiceType === 'software') {
      return convServiceType.includes('software') || convServiceType.includes('software_dev');
    } else if (normalizedServiceType === 'construction') {
      return convServiceType.includes('construction');
    }
    return false;
  });
}

// Helper function to get service tag text
function getServiceTagText(serviceType) {
  if (!serviceType) return 'Service';
  const normalizedType = serviceType.toLowerCase();
  if (normalizedType.includes('construction')) return 'Construction';
  if (normalizedType.includes('software') || normalizedType.includes('software_dev')) return 'Software Development';
  if (normalizedType.includes('consulting')) return 'Business Consulting';
  if (normalizedType.includes('manufacturing')) return 'Manufacturing';
  return 'Service';
}

// Partner Network Button Component
function PartnerNetworkButton({ isDark, serviceId, fetchConversations }) {
  const [showPartnerNetwork, setShowPartnerNetwork] = useState(false);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [isSpringing, setIsSpringing] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const buttonRef = useRef(null);
  
  const handleOpenPartnerNetwork = () => {
    // Trigger spring animation first
    setIsSpringing(true);
    
    // Scroll to center the button in viewport on click
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
      
      window.scrollTo({
        top: scrollY,
        behavior: 'smooth'
      });
      
      // Wait for scroll to complete (~300ms) and spring animation to finish, then expand
      setTimeout(() => {
        setExpandedServiceId(serviceId);
        setShowPartnerNetwork(true);
        setIsSpringing(false);
      }, 300);
    } else {
      // If no ref, expand immediately after spring animation
      setTimeout(() => {
        setExpandedServiceId(serviceId);
        setShowPartnerNetwork(true);
        setIsSpringing(false);
      }, 100);
    }
  };

  const handleClosePartnerNetwork = () => {
    setShowPartnerNetwork(false);
    setExpandedServiceId(null);
    // Show button again immediately for smooth transition
    setShowButton(true);
  };

  return (
    <>
      {/* Partner Network Button */}
      <AnimatePresence>
        {showButton && !showPartnerNetwork && (
          <motion.button
            ref={buttonRef}
            layoutId={`partner-network-button-${serviceId}`}
            onClick={handleOpenPartnerNetwork}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: isSpringing ? 0.95 : 1
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ 
              type: "spring",
              stiffness: isSpringing ? 800 : 300,
              damping: isSpringing ? 20 : 30,
              mass: 0.6
            }}
            layout
            layoutTransition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            className="about-devello-glass w-auto rounded-full px-4 py-3 text-left relative overflow-hidden group"
            style={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              backgroundColor: 'transparent',
              border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.4)'}`,
              borderRadius: '9999px',
              transformOrigin: "center center"
            }}
          >
            {/* Gradient Background */}
            <div
              className="absolute inset-0 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #ffffff 100%)',
                borderRadius: '9999px',
                opacity: 0.9,
                zIndex: -1
              }}
            />
            <div className="relative z-10 flex items-center gap-2">
              <Users className="w-4 h-4 flex-shrink-0 text-black" />
              <span className="text-sm font-medium text-black">
                Partner Network
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Partner Network Modal */}
      <AnimatePresence>
        {showPartnerNetwork && (
          <PartnerNetworkModal
            isDark={isDark}
            serviceId={serviceId}
            expandedServiceId={expandedServiceId}
            onClose={handleClosePartnerNetwork}
            fetchConversations={fetchConversations}
            buttonRef={buttonRef}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Partner Network Modal Component
function PartnerNetworkModal({ isDark, serviceId, expandedServiceId, onClose, fetchConversations, buttonRef }) {
  const [partners, setPartners] = useState({});
  const [loadingPartners, setLoadingPartners] = useState({});
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const serviceTypes = [
    { id: 'software', label: 'Software Development', color: 'blue', icon: Code },
    { id: 'construction', label: 'Construction', color: 'orange', icon: Hammer },
    { id: 'manufacturing', label: 'Manufacturing', color: 'green', icon: Factory },
    { id: 'consulting', label: 'Consulting', color: 'yellow', icon: Briefcase }
  ];

  const serviceTypeMap = {
    'software': 'software_development',
    'construction': 'construction',
    'consulting': 'consulting',
    'manufacturing': 'manufacturing'
  };

  const fetchPartners = async (serviceId) => {
    if (partners[serviceId]) return;
    
    setLoadingPartners(prev => ({ ...prev, [serviceId]: true }));
    try {
      const serviceType = serviceTypeMap[serviceId];
      const response = await fetch(`/api/partners/public?service_type=${serviceType}`);
      if (response.ok) {
        const data = await response.json();
        setPartners(prev => ({ ...prev, [serviceId]: data.partners || [] }));
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners(prev => ({ ...prev, [serviceId]: [] }));
    } finally {
      setLoadingPartners(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  useEffect(() => {
    if (expandedServiceId) {
      fetchPartners(expandedServiceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedServiceId]);

  // Scroll lock when modal is open
  useEffect(() => {
    if (expandedServiceId) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const scrollY = window.scrollY;
      
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.touchAction = "none";
      
      return () => {
        // Capture scroll position from the top offset before removing fixed positioning
        const currentTop = document.body.style.top;
        const scrollPosition = currentTop ? Math.abs(parseInt(currentTop)) : scrollY;
        
        // Remove fixed positioning first
        document.body.style.position = originalBodyPosition;
        document.body.style.top = "";
        
        // Immediately restore scroll position without animation to prevent jump
        window.scrollTo({
          top: scrollPosition,
          behavior: 'auto'
        });
        
        // Restore other styles after scroll is set
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.width = "";
        document.body.style.touchAction = "";
      };
    }
  }, [expandedServiceId]);

  const handleStartNewRequest = (serviceId) => {
    setSelectedServiceType(serviceId);
    setShowNewRequest(true);
  };

  const getServiceColor = (color) => {
    const colors = {
      blue: {
        bg: isDark ? 'bg-blue-600/40' : 'bg-blue-600/20',
        border: isDark ? 'border-blue-500/50' : 'border-blue-500/30',
        text: isDark ? 'text-blue-300' : 'text-blue-800',
        icon: isDark ? 'text-blue-400' : 'text-blue-600',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #ffffff 100%)'
      },
      orange: {
        bg: isDark ? 'bg-orange-600/40' : 'bg-orange-600/20',
        border: isDark ? 'border-orange-500/50' : 'border-orange-500/30',
        text: isDark ? 'text-orange-300' : 'text-orange-800',
        icon: isDark ? 'text-orange-400' : 'text-orange-600',
        gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #ffffff 100%)'
      },
      green: {
        bg: isDark ? 'bg-emerald-600/40' : 'bg-emerald-600/20',
        border: isDark ? 'border-emerald-500/50' : 'border-emerald-500/30',
        text: isDark ? 'text-emerald-300' : 'text-emerald-800',
        icon: isDark ? 'text-emerald-400' : 'text-emerald-600',
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #ffffff 100%)'
      },
      yellow: {
        bg: isDark ? 'bg-yellow-500/40' : 'bg-yellow-500/20',
        border: isDark ? 'border-yellow-400/50' : 'border-yellow-400/30',
        text: isDark ? 'text-yellow-300' : 'text-yellow-800',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600',
        gradient: 'linear-gradient(135deg, #eab308 0%, #fbbf24 50%, #ffffff 100%)'
      }
    };
    return colors[color] || colors.blue;
  };

  const service = serviceTypes.find(s => s.id === expandedServiceId);
  if (!service) return null;

  const serviceColors = getServiceColor(service.color);
  const Icon = service.icon;
  const servicePartners = partners[expandedServiceId] || [];
  const isLoading = loadingPartners[expandedServiceId];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        className="fixed inset-0 z-[9998]"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          touchAction: 'none'
        }}
      />

      {/* Centered Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        {/* Expanded Content */}
        <motion.div
          layoutId={`partner-network-button-${serviceId}`}
          layout
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ 
            opacity: 0, 
            scale: 0.8,
            transition: {
              duration: 0.4,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1]
            }
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
            layout: {
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="about-devello-glass relative w-full max-w-3xl max-h-[85vh] overflow-y-auto overflow-x-hidden pointer-events-auto rounded-[2rem] p-6 sm:p-8 flex flex-col"
          style={{
            transformOrigin: "center center",
            touchAction: 'pan-y',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'}`,
            borderRadius: '2rem'
          }}
        >
          {/* Close Button - positioned in top right of container */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`about-devello-glass absolute right-4 top-4 z-50 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full ${isDark ? 'text-white' : 'text-gray-700'}`}
            aria-label="Close"
            style={{ position: 'absolute', transformOrigin: 'center' }}
          >
            <X className="h-4 w-4 sm:h-4.5 sm:h-4.5 md:h-5 md:w-5" />
          </motion.button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-xl ${serviceColors.bg}`}>
              <Icon className={`w-6 h-6 ${serviceColors.icon}`} />
            </div>
            <div>
              <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {service.label}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                {servicePartners.length} partner{servicePartners.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>

          {/* Partners Grid */}
          <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-12 relative" style={{ minHeight: '200px' }}>
                  <div className="loading"></div>
                </div>
              ) : servicePartners.length === 0 ? (
                <div className="text-center py-12">
                  <Icon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white opacity-40' : 'text-gray-400'}`} />
                  <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                    No partners available for this service type.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servicePartners.map((partner) => (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="group relative p-5 rounded-2xl hover:scale-[1.02] transition-all flex flex-col h-full"
                      style={{
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        backgroundColor: isDark ? 'rgba(107, 114, 128, 0.3)' : 'rgba(107, 114, 128, 0.2)',
                        border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      }}
                    >
                      <div className="flex-1">
                        <h5 className="font-bold text-lg mb-2 text-white">
                          {partner.companyName}
                        </h5>
                        {partner.description && (
                          <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'} line-clamp-3`}>
                            {partner.description}
                          </p>
                        )}
                        {partner.experienceYears && (
                          <p className={`text-xs mb-4 ${isDark ? 'text-white opacity-50' : 'text-gray-500'}`}>
                            {partner.experienceYears} years of experience
                          </p>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async () => {
                          setSelectedPartner(partner);
                        }}
                        className="w-full mt-auto py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all text-white hover:opacity-90"
                        style={{
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          backgroundColor: 'rgba(249, 115, 22, 0.3)',
                          border: '2px solid rgba(249, 115, 22, 0.5)',
                        }}
                      >
                        <Send className="w-4 h-4" />
                        Send Message
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
        </motion.div>
      </div>

      {/* Partner Message Modal */}
      {selectedPartner && (
        <PartnerMessageModal
          partner={selectedPartner}
          isDark={isDark}
          onClose={() => {
            setSelectedPartner(null);
            setShowNewRequest(false);
            setSelectedServiceType(null);
          }}
          onMessageSent={() => {
            setSelectedPartner(null);
            setShowNewRequest(false);
            setSelectedServiceType(null);
            if (fetchConversations) {
              fetchConversations();
            }
            onClose();
          }}
        />
      )}
    </>
  );
}

// Partner Network Section with 4 Glass Buttons
function PartnerNetworkSection({ isDark, fetchConversations }) {
  const [expandedButton, setExpandedButton] = useState(null);
  const [partners, setPartners] = useState({});
  const [loadingPartners, setLoadingPartners] = useState({});
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState(null);

  const serviceTypes = [
    { id: 'software', label: 'Software Development', color: 'blue', icon: Code },
    { id: 'construction', label: 'Construction', color: 'orange', icon: Hammer },
    { id: 'manufacturing', label: 'Manufacturing', color: 'green', icon: Factory },
    { id: 'consulting', label: 'Consulting', color: 'yellow', icon: Briefcase }
  ];

  const serviceTypeMap = {
    'software': 'software_development',
    'construction': 'construction',
    'consulting': 'consulting',
    'manufacturing': 'manufacturing'
  };

  const fetchPartners = async (serviceId) => {
    if (partners[serviceId]) return; // Already fetched
    
    setLoadingPartners(prev => ({ ...prev, [serviceId]: true }));
    try {
      const serviceType = serviceTypeMap[serviceId];
      const response = await fetch(`/api/partners/public?service_type=${serviceType}`);
      if (response.ok) {
        const data = await response.json();
        setPartners(prev => ({ ...prev, [serviceId]: data.partners || [] }));
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      setPartners(prev => ({ ...prev, [serviceId]: [] }));
    } finally {
      setLoadingPartners(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleButtonExpand = (serviceId) => {
    if (expandedButton === serviceId) {
      setExpandedButton(null);
      setShowNewRequest(false);
    } else {
      setExpandedButton(serviceId);
      fetchPartners(serviceId);
    }
  };

  const handleStartNewRequest = (serviceId) => {
    setSelectedServiceType(serviceId);
    setShowNewRequest(true);
  };

  const getServiceColor = (color) => {
    const colors = {
      blue: {
        bg: isDark ? 'bg-blue-600/40' : 'bg-blue-600/20',
        border: isDark ? 'border-blue-500/50' : 'border-blue-500/30',
        text: isDark ? 'text-blue-300' : 'text-blue-800',
        icon: isDark ? 'text-blue-400' : 'text-blue-600',
        glassTint: isDark 
          ? 'color-mix(in srgb, rgba(56, 189, 248, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(56, 189, 248, 0.25) 40%, rgba(220, 220, 220, 0.2))'
      },
      orange: {
        bg: isDark ? 'bg-orange-600/40' : 'bg-orange-600/20',
        border: isDark ? 'border-orange-500/50' : 'border-orange-500/30',
        text: isDark ? 'text-orange-300' : 'text-orange-800',
        icon: isDark ? 'text-orange-400' : 'text-orange-600',
        glassTint: isDark 
          ? 'color-mix(in srgb, rgba(249, 115, 22, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(249, 115, 22, 0.25) 40%, rgba(220, 220, 220, 0.2))'
      },
      green: {
        bg: isDark ? 'bg-emerald-600/40' : 'bg-emerald-600/20',
        border: isDark ? 'border-emerald-500/50' : 'border-emerald-500/30',
        text: isDark ? 'text-emerald-300' : 'text-emerald-800',
        icon: isDark ? 'text-emerald-400' : 'text-emerald-600',
        glassTint: isDark 
          ? 'color-mix(in srgb, rgba(52, 211, 153, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(52, 211, 153, 0.25) 40%, rgba(220, 220, 220, 0.2))'
      },
      yellow: {
        bg: isDark ? 'bg-yellow-500/40' : 'bg-yellow-500/20',
        border: isDark ? 'border-yellow-400/50' : 'border-yellow-400/30',
        text: isDark ? 'text-yellow-300' : 'text-yellow-800',
        icon: isDark ? 'text-yellow-400' : 'text-yellow-600',
        glassTint: isDark 
          ? 'color-mix(in srgb, rgba(251, 191, 36, 0.3) 40%, rgba(220, 220, 220, 0.2))'
          : 'color-mix(in srgb, rgba(251, 191, 36, 0.25) 40%, rgba(220, 220, 220, 0.2))'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Partner Network
        </h2>
        <p className={`text-base ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
          Connect with our service partners
        </p>
      </div>

      {/* 4 Glass Buttons Grid */}
      <div className="flex flex-wrap gap-3 mb-8">
        {serviceTypes.map((service, index) => {
          const isExpanded = expandedButton === service.id;
          const serviceColors = getServiceColor(service.color);
          const Icon = service.icon;
          const servicePartners = partners[service.id] || [];
          const isLoading = loadingPartners[service.id];
          
          // Only buttons to the right of the expanded button slide left
          const expandedIndex = expandedButton !== null 
            ? serviceTypes.findIndex(s => s.id === expandedButton) 
            : -1;
          const shouldSlideLeft = expandedButton !== null && 
            !isExpanded && 
            index > expandedIndex;

          return (
            <motion.div 
              key={service.id} 
              className="relative"
              layout
              initial={false}
              animate={{
                x: shouldSlideLeft ? -200 : 0,
                opacity: expandedButton !== null && !isExpanded ? 0.3 : 1
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.3
              }}
            >
              {/* Glass Button */}
              <AnimatePresence mode="wait">
                {!isExpanded && (
                  <motion.button
                    key={`button-${service.id}`}
                    layoutId={`partner-button-${service.id}`}
                    onClick={() => handleButtonExpand(service.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="about-devello-glass w-auto rounded-full px-4 py-3 text-left relative overflow-hidden group"
                    style={{
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      backgroundColor: 'transparent',
                      border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.4)'}`,
                      borderRadius: '9999px'
                    }}
                  >
                    {/* Glass Tint Background */}
                    <div
                      className="absolute inset-0 transition-opacity"
                      style={{
                        backgroundColor: serviceColors.glassTint,
                        borderRadius: '9999px',
                        zIndex: -1
                      }}
                    />
                    <div className="relative z-10 flex items-center gap-2">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-white' : 'text-white'}`} />
                      <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-white'}`}>
                        {service.label}
                      </span>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Expanded View */}
              <AnimatePresence>
                {isExpanded && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => {
                        setExpandedButton(null);
                        setShowNewRequest(false);
                      }}
                      className="fixed inset-0 z-[9998]"
                      style={{
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.25)'
                      }}
                    />

                    {/* Expanded Content */}
                    <motion.div
                      layoutId={`partner-button-${service.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      onClick={(e) => e.stopPropagation()}
                      className="fixed inset-x-4 sm:inset-x-8 md:inset-x-16 lg:inset-x-32 top-20 bottom-8 z-[9999] overflow-y-auto"
                    >
                      <div
                        className="about-devello-glass relative rounded-[2rem] p-6 sm:p-8 h-full flex flex-col"
                        style={{
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                          border: `2px solid ${serviceColors.border}`,
                          borderRadius: '2rem'
                        }}
                      >
                        {/* Close Button - positioned in top right of container */}
                        <motion.button
                          onClick={() => {
                            setExpandedButton(null);
                            setShowNewRequest(false);
                          }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85, y: 2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className={`about-devello-glass absolute right-4 top-4 z-50 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full ${isDark ? 'text-white' : 'text-gray-700'}`}
                          aria-label="Close"
                          style={{ position: 'absolute', transformOrigin: 'center' }}
                        >
                          <X className="h-4 w-4 sm:h-4.5 sm:h-4.5 md:h-5 md:w-5" />
                        </motion.button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`p-3 rounded-xl ${serviceColors.bg}`}>
                            <Icon className={`w-6 h-6 ${serviceColors.icon}`} />
                          </div>
                          <div>
                            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {service.label}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                              {servicePartners.length} partner{servicePartners.length !== 1 ? 's' : ''} available
                            </p>
                          </div>
                        </div>

                        {/* Start New Request Button */}
                        {!showNewRequest && (
                          <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleStartNewRequest(service.id)}
                            className={`mb-6 w-full ${serviceColors.bg} ${serviceColors.border} border-2 rounded-2xl p-4 hover:scale-[1.02] transition-all`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <h4 className={`text-lg font-semibold ${serviceColors.text}`}>
                                  Start New Request
                                </h4>
                                <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
                                  Create a new conversation with a partner
                                </p>
                              </div>
                              <ArrowRight className={`w-5 h-5 ${serviceColors.icon}`} />
                            </div>
                          </motion.button>
                        )}

                        {/* New Request Form */}
                        {showNewRequest && selectedServiceType === service.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6"
                          >
                            <div className={`${serviceColors.bg} ${serviceColors.border} border-2 rounded-2xl p-6`}>
                              <h4 className={`text-lg font-semibold mb-4 ${serviceColors.text}`}>
                                Select a Partner
                              </h4>
                              {isLoading ? (
                                <div className="text-center py-8 relative" style={{ minHeight: '150px' }}>
                                  <div className="loading"></div>
                                </div>
                              ) : servicePartners.length === 0 ? (
                                <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                                  No partners available for this service type.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {servicePartners.map((partner) => (
                                    <motion.button
                                      key={partner.id}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={async () => {
                                        // Create new conversation with this partner
                                        try {
                                          const supabase = getSupabase();
                                          if (!supabase) return;

                                          const { data: { session } } = await supabase.auth.getSession();
                                          if (!session?.access_token) return;

                                          const response = await fetch('/api/partners/message', {
                                            method: 'POST',
                                            headers: {
                                              'Authorization': `Bearer ${session.access_token}`,
                                              'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                              partnerId: partner.id,
                                              subject: `New ${service.label} Request`,
                                              message: `I'm interested in your ${service.label} services.`,
                                              senderName: 'Client',
                                              senderEmail: session.user?.email || ''
                                            })
                                          });

                                          if (response.ok) {
                                            setExpandedButton(null);
                                            setShowNewRequest(false);
                                            // Refresh conversations
                                            if (fetchConversations) {
                                              fetchConversations();
                                            }
                                            // Small delay then reload to ensure UI updates
                                            setTimeout(() => {
                                              window.location.reload();
                                            }, 500);
                                          }
                                        } catch (error) {
                                          console.error('Error creating conversation:', error);
                                        }
                                      }}
                                      className={`text-left p-4 rounded-xl border-2 ${serviceColors.border} ${serviceColors.bg} transition-all hover:opacity-80`}
                                    >
                                      <h5 className={`font-semibold mb-1 ${serviceColors.text}`}>
                                        {partner.companyName}
                                      </h5>
                                      {partner.description && (
                                        <p className={`text-xs ${isDark ? 'text-white opacity-70' : 'text-gray-600'} line-clamp-2`}>
                                          {partner.description}
                                        </p>
                                      )}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Partners List */}
                        {!showNewRequest && (
                          <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                              <div className="text-center py-12 relative" style={{ minHeight: '200px' }}>
                                <div className="loading"></div>
                              </div>
                            ) : servicePartners.length === 0 ? (
                              <div className="text-center py-12">
                                <Icon className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white opacity-40' : 'text-gray-400'}`} />
                                <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                                  No partners available for this service type.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {servicePartners.map((partner) => (
                                  <div
                                    key={partner.id}
                                    className={`p-4 rounded-xl border ${isDark ? 'border-white bg-white opacity-5' : 'border-gray-200 bg-white opacity-50'}`}
                                  >
                                    <h5 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                      {partner.companyName}
                                    </h5>
                                    {partner.description && (
                                      <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                        {partner.description}
                                      </p>
                                    )}
                                    {partner.experienceYears && (
                                      <p className={`text-xs ${isDark ? 'text-white opacity-50' : 'text-gray-500'}`}>
                                        {partner.experienceYears} years of experience
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Service-Specific Conversations Component
function ServiceConversationsList({ 
  isDark, 
  conversations, 
  selectedConversation, 
  fetchConversation, 
  fetchConversations,
  getServiceTypeColor, 
  getServiceColors 
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const contentRef = useRef(null);
  const measureRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
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
        if (fetchConversations) {
          await fetchConversations();
        }
        // If deleted conversation was selected, clear selection
        if (selectedConversation?.id === conversationId) {
          fetchConversation(null);
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

  useEffect(() => {
    const measureHeight = () => {
      if (measureRef.current) {
        const height = measureRef.current.scrollHeight;
        if (height > 0) {
          setContentHeight(height);
        }
      }
    };
    
    // Measure immediately and after a short delay to ensure DOM is ready
    measureHeight();
    const timeoutId = setTimeout(measureHeight, 100);
    return () => clearTimeout(timeoutId);
  }, [conversations]);

  if (!conversations || conversations.length === 0) {
    return null;
  }

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  const headerColor = selectedConversation 
    ? (() => {
        const serviceColor = getServiceTypeColor(selectedConversation.partner?.serviceType);
        const colors = getServiceColors(serviceColor);
        return colors.text;
      })()
    : isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="w-full h-full flex flex-col">
      {conversations.length === 0 ? (
        <div className="text-center py-8 flex-1 flex flex-col items-center justify-center min-h-0">
          <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white opacity-30' : 'text-gray-400'}`} />
          <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
            No conversations yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto min-h-0 overflow-x-hidden max-h-[600px] pt-2 px-2">
          {conversations.map((conv) => {
            const isSelected = selectedConversation?.id === conv.id;
            const unreadCount = conv.unreadCount || 0;
            const hasUnread = unreadCount > 0;
            return (
              <div key={conv.id} className="relative group">
                <motion.button
                  onClick={() => fetchConversation(conv.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left rounded-xl border p-3 transition-all duration-200 ${
                    isSelected
                      ? 'border-2'
                      : ''
                  }`}
                  style={isSelected ? {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                    borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)'
                  } : (hasUnread ? {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                    borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.3)'
                  } : {
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.1)',
                    borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.25)'
                  })}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${
                        isSelected 
                          ? isDark ? 'text-green-200' : 'text-green-700'
                          : isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getServiceTagText(conv.partner?.serviceType)}
                      </div>
                      {hasUnread && !isSelected && (
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                          isDark ? 'bg-green-500 text-white' : 'bg-green-500 text-white'
                        }`}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-xs flex-shrink-0 ${
                        isSelected 
                          ? isDark ? 'text-green-200 opacity-80' : 'text-green-700 opacity-80'
                          : isDark ? 'text-white opacity-70' : 'text-gray-600'
                      }`}>
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
                      ? isDark ? 'text-green-200 opacity-90' : 'text-green-700 opacity-90'
                      : isDark ? 'text-white opacity-80' : 'text-gray-700'
                  }`}>
                    {conv.partner.companyName}
                  </div>
                </motion.button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Conversation Messages View Component
function ConversationMessagesView({
  isDark,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  sending,
  isTyping,
  setIsTyping,
  clientIsLive,
  partnerIsLive,
  partnerIsTyping,
  streamingMessage,
  messagesEndRef,
  messagesContainerRef,
  sendMessage,
  conversationLoading,
  conversationError,
  textareaRef,
  adjustTextareaHeight,
  onClose
}) {
  if (!selectedConversation) return null;

  const handleFileUploaded = (attachment) => {
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Conversation Header */}
      <div className={`mb-4 pb-4 border-b flex-shrink-0 pt-4 ${isDark ? 'border-white' : 'border-gray-200'}`} style={isDark ? { borderColor: 'rgba(255, 255, 255, 0.1)' } : {}}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {onClose && (
                <button
                  onClick={onClose}
                  className="mr-2 hover:opacity-70 transition-opacity flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="truncate">
                {getServiceTagText(selectedConversation.partner?.serviceType)}
              </span>
              {partnerIsLive && (
                <span className="flex items-center gap-1 text-xs font-normal flex-shrink-0">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                  <span className={isDark ? 'text-green-400' : 'text-green-600'}>Live</span>
                </span>
              )}
              {partnerIsTyping && (
                <span className={`text-xs font-normal italic flex-shrink-0 ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                  typing...
                </span>
              )}
            </h3>
            <p className={`text-sm mt-1 truncate ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
              {selectedConversation.partner.companyName}
            </p>
          </div>
          {clientIsLive && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs flex-shrink-0 ${
              isDark ? 'bg-green-500 opacity-20 text-green-400' : 'bg-green-100 text-green-700'
            }`}>
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              You're live
            </div>
          )}
        </div>
      </div>
        <div className="flex-1 flex flex-col">
          {conversationError && (
            <div className={`mb-4 p-3 rounded-xl border-2 ${
              isDark ? 'bg-red-500 opacity-10 border-red-500' : 'bg-red-50 border-red-200'
            }`} style={isDark ? { borderColor: 'rgba(239, 68, 68, 0.3)' } : {}}>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {conversationError}
              </p>
            </div>
          )}
          {conversationLoading && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center mb-4 relative" style={{ minHeight: '200px' }}>
              <div className="loading"></div>
            </div>
          )}
          <div ref={messagesContainerRef} className="flex-1 space-y-4 mb-4 overflow-y-auto min-h-0 max-h-[calc(100vh-20rem)]">
            {messages.length === 0 && !conversationLoading && (
              <div className="flex items-center justify-center py-8">
                <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => {
                const isStreaming = streamingMessage?.id === msg.id && msg.isStreaming;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`flex ${msg.senderId === 'client' ? 'justify-end' : 'justify-start'}`}
                  >
                  <div
                    className={`max-w-[80%] rounded-xl p-3 ${
                      msg.senderId === 'client'
                        ? isDark
                          ? 'bg-blue-500 opacity-20 text-white'
                          : 'bg-blue-100 text-gray-900'
                        : isDark
                        ? 'bg-white opacity-10 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className={`text-xs mb-1 ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                      {msg.senderName}
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments attachments={msg.attachments} isDark={isDark} />
                    )}
                    {msg.message && (
                      <div className="text-sm whitespace-pre-wrap">
                        {isStreaming && streamingMessage ? streamingMessage.message : msg.message}
                        {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
                      </div>
                    )}
                    {!isStreaming && (
                      <div className={`text-xs mt-1 ${isDark ? 'text-white opacity-40' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg overflow-hidden border-2 ${
                    isDark ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {attachment.fileType === 'image' ? (
                    <div className="relative">
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-20 h-20 object-cover"
                      />
                      <button
                        onClick={() => removeAttachment(index)}
                        className={`absolute top-1 right-1 p-1 rounded-full ${
                          isDark ? 'bg-black/50 text-white' : 'bg-white/90 text-gray-700'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2">
                      <File className={`w-4 h-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`} />
                      <span className={`text-xs truncate max-w-[100px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {attachment.fileName}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className={`p-1 rounded-full ${
                          isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-shrink-0 items-end">
            <UnifiedFileUpload
              onFileUploaded={handleFileUploaded}
              isDark={isDark}
              disabled={sending}
            />
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                adjustTextareaHeight(e.target);
                setIsTyping(e.target.value.length > 0);
              }}
              onBlur={() => setIsTyping(false)}
              onFocus={() => {
                if (newMessage.trim().length > 0) {
                  setIsTyping(true);
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className={`flex-1 rounded-xl border p-3 resize-none overflow-hidden ${
                isDark
                  ? 'text-white placeholder-white opacity-40'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              style={isDark ? {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgb(255, 255, 255)',
                minHeight: '2.5rem',
                maxHeight: '200px'
              } : {
                minHeight: '2.5rem',
                maxHeight: '200px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendMessage}
              disabled={(!newMessage.trim() && attachments.length === 0) || sending}
              className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 h-[2.5rem]"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
    </div>
  );
}

// Expanded Order View Component  
const ExpandedOrderView = ({ order, orderDetails, isDark, onFetchDetails }) => {
  const supabase = getSupabase();
  const [newMessage, setNewMessage] = React.useState('');
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [messageError, setMessageError] = React.useState(null);

  const handleSendClientMessage = React.useCallback(async () => {
    const trimmed = newMessage.trim();
    if (!trimmed) {
      setMessageError('Message is required');
      return;
    }
    setSendingMessage(true);
    setMessageError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error('Please sign in to send a message.');
      }
      const response = await fetch(`/api/products/orders/${order.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: trimmed })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to send message');
      }
      setNewMessage('');
      if (onFetchDetails) {
        await onFetchDetails();
      }
    } catch (err) {
      setMessageError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, onFetchDetails, order.id, supabase]);

  React.useEffect(() => {
    if (!orderDetails && onFetchDetails) {
      onFetchDetails();
    }
  }, [orderDetails, onFetchDetails]);

  // Only use orderUpdates from orderDetails (fetched per-order), never from the list order object
  // This ensures each order shows only its own updates, not cached/stale data from other orders
  const orderUpdates = orderDetails?.orderUpdates || [];
  const shippingAddress = orderDetails?.shipping_address || order.shipping_address;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onClick={(e) => e.stopPropagation()}
      className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}
    >
      <div className="space-y-4">
        {/* Order Updates / Communication */}
        {orderUpdates.length > 0 && (
          <div>
            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <MessageSquare className="w-4 h-4" />
              Order Updates & Communication
            </h4>
            <div className="space-y-3">
              {orderUpdates.map((update) => (
                <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    update.update_type === 'status' ? 'bg-blue-500' :
                    update.update_type === 'message' ? 'bg-green-500' :
                    update.update_type === 'shipping' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        update.update_type === 'status' ? (isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700') :
                        update.update_type === 'message' ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') :
                        update.update_type === 'shipping' ? (isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700') :
                        (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                      }`}>
                        {update.update_type}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        {new Date(update.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {update.message && (
                      <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                        {update.message}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                      {update.updated_by === 'admin' ? 'From Admin' : 'From You'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Message to Seller */}
        <div className={`p-4 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <MessageSquare className="w-4 h-4" />
            Send Message to Seller
          </h4>
          <p className={`text-xs mb-2 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            Ask a question or share an update about this order. Messages are shared with the admin.
          </p>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            placeholder="Type your message..."
            className={`w-full text-sm rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-black/30 border-white/10 text-white focus:ring-emerald-500/60'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-emerald-500/60'
            }`}
          />
          {messageError && (
            <p className="text-sm text-red-500 mt-2">{messageError}</p>
          )}
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSendClientMessage}
              disabled={sendingMessage}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                sendingMessage
                  ? 'opacity-70 cursor-not-allowed'
                  : ''
              } ${isDark ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
            >
              {sendingMessage ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
        
        {/* Shipping Address */}
        {shippingAddress && (
          <div>
            <h4 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <MapPin className="w-4 h-4" />
              Shipping Address
            </h4>
            <div className={`p-3 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              {(() => {
                let addr;
                if (typeof shippingAddress === 'string') {
                  try {
                    addr = JSON.parse(shippingAddress);
                  } catch {
                    return <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{shippingAddress}</p>;
                  }
                } else {
                  addr = shippingAddress;
                }
                
                if (!addr || (!addr.address_line1 && !addr.city)) {
                  return <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>No address provided</p>;
                }
                
                return (
                  <div className={`text-sm space-y-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {addr.title && (
                      <p className="font-medium">{addr.title}</p>
                    )}
                    <p>
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                    </p>
                    <p>
                      {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip_code || ''}
                    </p>
                    {addr.country && addr.country !== 'US' && (
                      <p>{addr.country}</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function ProductOrdersView({ 
  isDark, 
  conversations,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  sending,
  isTyping,
  setIsTyping,
  clientIsLive,
  partnerIsLive,
  partnerIsTyping,
  streamingMessage,
  messagesEndRef,
  messagesContainerRef,
  fetchConversation,
  sendMessage,
  getServiceTypeColor,
  getServiceColors,
  fetchConversations,
  handleFileUpload,
  handleRequestPhoneAccess,
  handleRequestUpdate,
  sidebarOpen, 
  setSidebarOpen, 
  desktopSidebarVisible, 
  setDesktopSidebarVisible, 
  isLargeScreen, 
  setCurrentView,
  conversationLoading,
  conversationError,
  conversationContainerRef,
  containerWrapperRef,
  textareaRef,
  adjustTextareaHeight
}) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = getSupabase();
  const [customBuildOrders, setCustomBuildOrders] = useState([]);
  const [stockProductOrders, setStockProductOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [removedOrderIds, setRemovedOrderIds] = useState(new Set());
  const [expandedOrderIds, setExpandedOrderIds] = useState(new Set());
  const [orderDetailsCache, setOrderDetailsCache] = useState({});

  // Clear order details cache when orders list changes to prevent stale data
  useEffect(() => {
    // Clear cache entries for orders that no longer exist in the current list
    const currentOrderIds = new Set([...stockProductOrders.map(o => o.id), ...customBuildOrders.map(o => o.id)]);
    setOrderDetailsCache(prev => {
      const filtered = {};
      Object.keys(prev).forEach(orderId => {
        if (currentOrderIds.has(orderId)) {
          filtered[orderId] = prev[orderId];
        }
      });
      return filtered;
    });
  }, [stockProductOrders, customBuildOrders]);

  useEffect(() => {
    if (user) {
      fetchAllOrders();
    }
  }, [user]);

  const fetchAllOrders = async () => {
    try {
      setLoadingOrders(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[CLIENT_PORTAL] Session error:', sessionError);
        setLoadingOrders(false);
        return;
      }
      
      const token = session?.access_token;
      
      if (!token) {
        console.error('[CLIENT_PORTAL] No access token available');
        setLoadingOrders(false);
        return;
      }

      console.log('[CLIENT_PORTAL] Fetching orders for user:', {
        userId: user?.id,
        email: user?.email,
        hasToken: !!token,
        tokenLength: token.length
      });

      // Fetch both custom build orders and stock product orders in parallel
      const [customBuildsResponse, productOrdersResponse] = await Promise.all([
        fetch('/api/orders/custom-builds/list', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/products/orders/list', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      console.log('[CLIENT_PORTAL] API responses:', {
        customBuildsStatus: customBuildsResponse.status,
        productOrdersStatus: productOrdersResponse.status
      });

      if (customBuildsResponse.ok) {
        const customData = await customBuildsResponse.json();
        const requests = customData.requests || [];
        console.log('[CLIENT_PORTAL] Fetched', requests.length, 'custom product requests');
        if (requests.length > 0) {
          console.log('[CLIENT_PORTAL] Sample custom request:', {
            id: requests[0].id,
            project_type: requests[0].project_type,
            status: requests[0].status,
            email: requests[0].email
          });
        }
        setCustomBuildOrders(requests);
      } else if (customBuildsResponse.status === 401) {
        console.warn('[CLIENT_PORTAL] Not authenticated - custom builds list requires login');
        // User needs to log in to see orders
        setCustomBuildOrders([]);
      } else {
        const errorData = await customBuildsResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[CLIENT_PORTAL] Error fetching custom builds:', {
          status: customBuildsResponse.status,
          error: errorData
        });
        setCustomBuildOrders([]);
      }

      if (productOrdersResponse.ok) {
        const productData = await productOrdersResponse.json();
        // Filter to only show stock products (not custom orders which are already shown above)
        // Handle case where order_type might not exist yet (backward compatibility)
        const stockOrders = (productData.orders || []).filter(order => {
          const orderType = order.order_type || (order.custom_product_request_id ? 'custom_order' : 'stock_product');
          return orderType === 'stock_product';
        });
        console.log('[CLIENT_PORTAL] Fetched', stockOrders.length, 'stock product orders');
        setStockProductOrders(stockOrders);
      } else if (productOrdersResponse.status === 401) {
        console.warn('[CLIENT_PORTAL] Not authenticated - product orders list requires login');
        // User needs to log in to see orders
        setStockProductOrders([]);
      } else {
        const errorData = await productOrdersResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[CLIENT_PORTAL] Error fetching product orders:', {
          status: productOrdersResponse.status,
          error: errorData
        });
        setStockProductOrders([]);
      }
    } catch (error) {
      console.error('[CLIENT_PORTAL] Error fetching orders:', {
        error: error.message,
        stack: error.stack
      });
      setCustomBuildOrders([]);
      setStockProductOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleApproveQuote = async (requestId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Custom builds API no longer available in Studios
      alert('Custom builds functionality is not available on this domain.');
      return;
      
      const response = await fetch(`/api/orders/custom-builds/${requestId}/approve-quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error creating payment link. Please try again.');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error creating payment link. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  // Check if order was refused
  const isOrderRefused = (order) => {
    if (!order.additional_info) return false;
    return order.additional_info.includes('[REFUSED:');
  };

  // Get refusal reason
  const getRefusalReason = (order) => {
    if (!order.additional_info) return null;
    const match = order.additional_info.match(/\[REFUSED: [^\]]+\]\nReason: ([^\n]+)/);
    return match ? match[1].trim() : null;
  };

  // Handle remove order
  const handleRemoveOrder = (orderId) => {
    setRemovedOrderIds(prev => new Set([...prev, orderId]));
    // Store in localStorage to persist across sessions
    const stored = JSON.parse(localStorage.getItem('removedOrders') || '[]');
    stored.push(orderId);
    localStorage.setItem('removedOrders', JSON.stringify(stored));
  };

  // Load removed orders from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('removedOrders') || '[]');
    setRemovedOrderIds(new Set(stored));
  }, []);

  // Handle answer back - open conversation
  const handleAnswerBack = async (order) => {
    // Find or create conversation for this order
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Find conversation with serviceType 'manufacturing' that matches this order
      const response = await fetch('/api/conversations/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const conversations = data.conversations || [];
        
        // Find conversation related to this order
        const relatedConv = conversations.find(conv => 
          conv.serviceType === 'manufacturing' && 
          conv.metadata?.customProductRequestId === order.id
        );

        if (relatedConv) {
          // Switch to conversations view and select this conversation
          setCurrentView(VIEWS.CONVERSATIONS);
          // The conversation should be selected automatically
        } else {
          // Create new conversation or navigate to create one
          setCurrentView(VIEWS.CONVERSATIONS);
        }
      }
    } catch (error) {
      console.error('Error finding conversation:', error);
      // Fallback: just switch to conversations view
      setCurrentView(VIEWS.CONVERSATIONS);
    }
  };


  return (
    <div className="pt-20 lg:pt-24 pb-8 px-6 lg:px-0">
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
      
      {/* Title Section with Service Button - Removed duplicate header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="flex-1 text-center lg:text-left">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Orders
            </h1>
            <p className={`text-lg ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
              Track and manage your orders
            </p>
          </div>
          <div className="flex-shrink-0 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <CustomBuildsButton isDark={isDark} formTitle="create product" color="green" />
          </div>
        </div>
      </div>

      {/* Custom Build Orders */}
      {loadingOrders ? (
        <div className="flex items-center justify-center py-8 mb-6">
          <div className="loading"></div>
        </div>
      ) : customBuildOrders.filter(order => !removedOrderIds.has(order.id)).length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Custom Orders
          </h2>
          {customBuildOrders.filter(order => !removedOrderIds.has(order.id)).map((order) => {
            const latestQuote = order.quotes && order.quotes.length > 0 ? order.quotes[0] : null;
            const hasPendingQuote = latestQuote && latestQuote.status === 'pending';
            const isApproved = order.status === 'approved' && order.productOrder;
            const isPaid = order.productOrder && order.productOrder.payment_status === 'succeeded';
            const isRefused = isOrderRefused(order);
            const refusalReason = getRefusalReason(order);
            const isCancelled = order.status === 'cancelled';
            
            return (
              <motion.div
                key={order.id}
                layoutId={`order-card-${order.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setShowOrderDetailsModal(true);
                }}
                className={`about-devello-glass rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  isDark ? 'border-white/10 hover:border-emerald-500/30' : 'border-white/30 hover:border-emerald-300'
                }`}
              >
                <div className="flex flex-row gap-3 sm:gap-4 items-start sm:items-center">
                  {order.preview_image && (
                    <div className="flex-shrink-0">
                      <img
                        src={order.preview_image}
                        alt="Preview"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                    <div className="flex-1">
                      <h3 className={`text-base sm:text-lg font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.project_type}
                      </h3>
                      <p className={`text-xs sm:text-sm mb-2.5 line-clamp-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {order.product_description || order.project_description || 'Custom order'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isRefused || isCancelled ? (isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700') :
                          order.status === 'received' ? (isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700') :
                          order.status === 'quoted' ? (isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
                          order.status === 'approved' ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') :
                          order.status === 'delivered' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700') :
                          (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {isRefused ? 'Refused' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {isRefused && refusalReason && (
                          <p className={`text-xs ${isDark ? 'text-red-300/80' : 'text-red-700'}`}>
                            {refusalReason}
                          </p>
                        )}
                        {latestQuote && (
                          <span className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            Quote: {formatCurrency(latestQuote.amount)}
                          </span>
                        )}
                      </div>
                      {order.productOrder && (
                        <div className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Order #{order.productOrder.order_number}
                          {isPaid && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                            }`}>
                              Payment Successful
                            </span>
                          )}
                          {order.productOrder.status === 'processing' && (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                            }`}>
                              Order Processing
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-start sm:items-center justify-center gap-2 pt-2 border-t border-white/10 sm:border-0 sm:pt-0">
                      {isRefused && (
                        <>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnswerBack(order);
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Answer Back
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to remove this order from your portal? This action cannot be undone.')) {
                                handleRemoveOrder(order.id);
                              }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors whitespace-nowrap"
                          >
                            Remove Order
                          </motion.button>
                        </>
                      )}
                      {!isRefused && hasPendingQuote && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveQuote(order.id);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors whitespace-nowrap"
                        >
                          Approve Quote & Pay
                        </motion.button>
                      )}
                      {!isRefused && isApproved && !isPaid && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveQuote(order.id);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
                        >
                          Complete Payment
                        </motion.button>
                      )}
                      {!isRefused && isPaid && order.productOrder && order.productOrder.status === 'processing' && (
                        <div className={`text-xs sm:text-sm text-left sm:text-center px-4 py-2.5 rounded-full ${
                          isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                        } font-medium whitespace-nowrap`}>
                          Order Processing
                        </div>
                      )}
                      {!isRefused && !order.productOrder && !latestQuote && order.status === 'received' && (
                        <div className={`text-xs sm:text-sm text-left sm:text-center ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Order submitted • Awaiting quote
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stock Product Orders */}
      {!loadingOrders && stockProductOrders.length > 0 && (() => {
        const deliveredOrders = stockProductOrders.filter((o) => o.status === 'delivered');
        const activeOrders = stockProductOrders.filter((o) => o.status !== 'delivered');
        const renderSection = (orders, title) => (
          <div className="mb-8 space-y-4">
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
            {orders.map((order) => {
              const isExpanded = expandedOrderIds.has(order.id);
              const isCompleted = order.status === 'completed' || order.status === 'delivered';
              const isPaid = order.payment_status === 'paid' || order.payment_status === 'succeeded';
              
              return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`about-devello-glass rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  isDark ? 'border-white/10 hover:border-emerald-500/30' : 'border-white/30 hover:border-emerald-300'
                }`}
                onClick={() => {
                  const newExpanded = new Set(expandedOrderIds);
                  if (isExpanded) {
                    newExpanded.delete(order.id);
                  } else {
                    newExpanded.add(order.id);
                  }
                  setExpandedOrderIds(newExpanded);
                }}
              >
                <div className="flex flex-row gap-3 sm:gap-4">
                  {(order.preview_image_url || order.product?.metadata?.image) && (
                    <div className="flex-shrink-0">
                      <img
                        src={order.preview_image_url || order.product?.metadata?.image}
                        alt="Product"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="flex-1">
                      <h3 className={`text-base sm:text-lg font-semibold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.product?.name || 'Product Order'}
                      </h3>
                      <p className={`text-xs sm:text-sm mb-2.5 line-clamp-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {order.product?.description || 'Stock product order'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isCompleted ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700') :
                          order.status === 'pending' ? (isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700') :
                          order.status === 'delivered' ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700') :
                          (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          isPaid ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') :
                          (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700')
                        }`}>
                          {isPaid ? 'Paid' : 'Payment Pending'}
                        </span>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {formatCurrency(order.amount)}
                        </span>
                      </div>
                      {order.order_number && (
                        <div className="text-xs sm:text-sm">
                          <span className={isDark ? 'text-white/60' : 'text-gray-600'}>
                            Order #{order.order_number}
                          </span>
                          {order.purchased_at && (
                            <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                              • Purchased {new Date(order.purchased_at).toLocaleDateString()}
                            </span>
                          )}
                          {order.shipped_at && (
                            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-purple-300/80' : 'text-purple-700'}`}>
                              <Package className="w-3 h-3" />
                              <span>Shipped {new Date(order.shipped_at).toLocaleDateString()}</span>
                            </div>
                          )}
                          {order.delivered_at && (
                            <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                              <CheckCircle className="w-3 h-3" />
                              <span>Delivered {new Date(order.delivered_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newExpanded = new Set(expandedOrderIds);
                        if (isExpanded) {
                          newExpanded.delete(order.id);
                        } else {
                          newExpanded.add(order.id);
                        }
                        setExpandedOrderIds(newExpanded);
                      }}
                      className={`mt-2 text-xs font-medium flex items-center gap-1 ${isDark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {isExpanded ? 'Show Less' : 'Show Details'}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ↓
                      </motion.div>
                    </button>
                  </div>
                </div>
                
                {/* Expanded View */}
                <AnimatePresence>
                  {isExpanded && (
                    <ExpandedOrderView 
                      key={`order-details-${order.id}`}
                      order={order} 
                      orderDetails={orderDetailsCache[order.id]} 
                      isDark={isDark}
                      onFetchDetails={async () => {
                        // Always fetch fresh details to ensure orderUpdates are current and scoped to this order
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const token = session?.access_token;
                          if (!token) return;
                          
                          const response = await fetch(`/api/products/orders/${order.id}/details`, {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            // Validate that the fetched order matches the current order ID
                            if (data.order && data.order.id === order.id) {
                              setOrderDetailsCache(prev => ({ ...prev, [order.id]: data.order }));
                            } else {
                              console.error('[CLIENT_PORTAL] Order ID mismatch:', {
                                expected: order.id,
                                received: data.order?.id
                              });
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching order details:', error);
                        }
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            );
            })}
          </div>
        );

        return (
          <>
            {activeOrders.length > 0 && renderSection(activeOrders, 'In Progress')}
            {deliveredOrders.length > 0 && renderSection(deliveredOrders, 'Delivered')}
          </>
        );
      })()}

      {/* Order Details Modal */}
      {showOrderDetailsModal && (
        <ProductOrderDetailsModal
          isOpen={showOrderDetailsModal}
          onClose={() => {
            setShowOrderDetailsModal(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
        />
      )}

      </div>
    </div>
  );
}

function ConsultationsView({ 
  isDark, 
  conversations,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  sending,
  isTyping,
  setIsTyping,
  clientIsLive,
  partnerIsLive,
  partnerIsTyping,
  streamingMessage,
  messagesEndRef,
  messagesContainerRef,
  fetchConversation,
  sendMessage,
  getServiceTypeColor,
  getServiceColors,
  fetchConversations,
  handleFileUpload,
  handleRequestPhoneAccess,
  handleRequestUpdate,
  sidebarOpen, 
  setSidebarOpen, 
  desktopSidebarVisible, 
  setDesktopSidebarVisible, 
  isLargeScreen, 
  setCurrentView,
  conversationLoading,
  conversationError,
  conversationContainerRef,
  containerWrapperRef,
  textareaRef,
  adjustTextareaHeight
}) {
  const router = useRouter();


  return (
    <div className="pt-20 lg:pt-24 pb-8 px-6 lg:px-0">
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
      
      {/* Title Section with Service Button */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="flex-1 text-center lg:text-left">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Consultations
            </h1>
            <p className={`text-lg ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
              View and manage your business consultations
            </p>
          </div>
          <div className="flex-shrink-0 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <CustomBuildsButton isDark={isDark} formTitle="create consultation" color="yellow" />
          </div>
        </div>
        
        {/* Partner Network Button - Centered on mobile, Left Aligned on desktop */}
        <div className="flex justify-center lg:justify-start pt-6 pb-6">
          <PartnerNetworkButton
            isDark={isDark}
            serviceId="consulting"
            fetchConversations={fetchConversations}
          />
        </div>
      </div>

      {/* Conversations Container */}
      <ServiceConversationsView
        isDark={isDark}
        conversations={conversations}
        selectedConversation={selectedConversation}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        sending={sending}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        clientIsLive={clientIsLive}
        partnerIsLive={partnerIsLive}
        partnerIsTyping={partnerIsTyping}
        streamingMessage={streamingMessage}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        fetchConversation={fetchConversation}
        sendMessage={sendMessage}
        getServiceTypeColor={getServiceTypeColor}
        getServiceColors={getServiceColors}
        conversationLoading={conversationLoading}
        conversationError={conversationError}
        conversationContainerRef={conversationContainerRef}
        containerWrapperRef={containerWrapperRef}
        textareaRef={textareaRef}
        adjustTextareaHeight={adjustTextareaHeight}
        serviceType="consulting"
        emptyStateIcon={Briefcase}
        emptyStateMessage="No consultations yet. Your consultations will appear here."
        isPartner={false}
        onFileUpload={handleFileUpload}
        onRequestPhoneAccess={handleRequestPhoneAccess}
        onRequestUpdate={handleRequestUpdate}
        partnerPhone={selectedConversation?.partner?.phone}
      />
      </div>
    </div>
  );
}

function BuildRequestsView({
  isDark, 
  conversations,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  sending,
  isTyping,
  setIsTyping,
  clientIsLive,
  partnerIsLive,
  partnerIsTyping,
  streamingMessage,
  messagesEndRef,
  messagesContainerRef,
  fetchConversation,
  sendMessage,
  getServiceTypeColor,
  getServiceColors,
  fetchConversations,
  handleFileUpload,
  handleRequestPhoneAccess,
  handleRequestUpdate,
  sidebarOpen, 
  setSidebarOpen, 
  desktopSidebarVisible, 
  setDesktopSidebarVisible, 
  isLargeScreen, 
  setCurrentView,
  conversationLoading,
  conversationError,
  conversationContainerRef,
  containerWrapperRef,
  textareaRef,
  adjustTextareaHeight
}) {
  const router = useRouter();


  return (
    <div className="pt-20 lg:pt-24 pb-8 px-6 lg:px-0">
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
      
      {/* Title Section with Service Button */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="flex-1 text-center lg:text-left">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Build Requests
            </h1>
            <p className={`text-lg ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
              Monitor your software build requests
            </p>
          </div>
          <div className="flex-shrink-0 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <CustomBuildsButton isDark={isDark} formTitle="create build" color="blue" />
          </div>
        </div>
        
        {/* Partner Network Button - Centered on mobile, Left Aligned on desktop */}
        <div className="flex justify-center lg:justify-start pt-6 pb-6">
          <PartnerNetworkButton
            isDark={isDark}
            serviceId="software"
            fetchConversations={fetchConversations}
          />
        </div>
      </div>

      {/* Conversations Container */}
      <ServiceConversationsView
        isDark={isDark}
        conversations={conversations}
        selectedConversation={selectedConversation}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        sending={sending}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        clientIsLive={clientIsLive}
        partnerIsLive={partnerIsLive}
        partnerIsTyping={partnerIsTyping}
        streamingMessage={streamingMessage}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        fetchConversation={fetchConversation}
        sendMessage={sendMessage}
        getServiceTypeColor={getServiceTypeColor}
        getServiceColors={getServiceColors}
        conversationLoading={conversationLoading}
        conversationError={conversationError}
        conversationContainerRef={conversationContainerRef}
        containerWrapperRef={containerWrapperRef}
        textareaRef={textareaRef}
        adjustTextareaHeight={adjustTextareaHeight}
        serviceType="software"
        emptyStateIcon={Code}
        emptyStateMessage="No build requests yet. Your build requests will appear here."
        isPartner={false}
        onFileUpload={handleFileUpload}
        onRequestPhoneAccess={handleRequestPhoneAccess}
        onRequestUpdate={handleRequestUpdate}
        partnerPhone={selectedConversation?.partner?.phone}
      />
      </div>
    </div>
  );
}

function RenovationsView({
  isDark, 
  conversations,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  sending,
  isTyping,
  setIsTyping,
  clientIsLive,
  partnerIsLive,
  partnerIsTyping,
  streamingMessage,
  messagesEndRef,
  messagesContainerRef,
  fetchConversation,
  sendMessage,
  getServiceTypeColor,
  getServiceColors,
  fetchConversations,
  handleFileUpload,
  handleRequestPhoneAccess,
  handleRequestUpdate,
  sidebarOpen, 
  setSidebarOpen, 
  desktopSidebarVisible, 
  setDesktopSidebarVisible, 
  isLargeScreen,
  setCurrentView,
  conversationLoading,
  conversationError,
  conversationContainerRef,
  containerWrapperRef,
  textareaRef,
  adjustTextareaHeight
}) {
  const router = useRouter();


  return (
    <div className="pt-20 lg:pt-24 pb-8 px-6 lg:px-0">
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
      
      {/* Title Section with Service Button */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="flex-1 text-center lg:text-left">
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              My Renovations
            </h1>
            <p className={`text-lg ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
              Track your renovation projects
            </p>
          </div>
          <div className="flex-shrink-0 flex justify-center lg:justify-end pt-4 lg:pt-0">
            <CustomBuildsButton isDark={isDark} formTitle="create renovation" color="orange" />
          </div>
        </div>
        
        {/* Partner Network Button - Centered on mobile, Left Aligned on desktop */}
        <div className="flex justify-center lg:justify-start pt-6 pb-6">
          <PartnerNetworkButton
            isDark={isDark}
            serviceId="construction"
            fetchConversations={fetchConversations}
          />
        </div>
      </div>

      {/* Conversations Container */}
      <ServiceConversationsView
        isDark={isDark}
        conversations={conversations}
        selectedConversation={selectedConversation}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        sending={sending}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        clientIsLive={clientIsLive}
        partnerIsLive={partnerIsLive}
        partnerIsTyping={partnerIsTyping}
        streamingMessage={streamingMessage}
        messagesEndRef={messagesEndRef}
        messagesContainerRef={messagesContainerRef}
        fetchConversation={fetchConversation}
        sendMessage={sendMessage}
        getServiceTypeColor={getServiceTypeColor}
        getServiceColors={getServiceColors}
        conversationLoading={conversationLoading}
        conversationError={conversationError}
        conversationContainerRef={conversationContainerRef}
        containerWrapperRef={containerWrapperRef}
        textareaRef={textareaRef}
        adjustTextareaHeight={adjustTextareaHeight}
        serviceType="construction"
        emptyStateIcon={Wrench}
        emptyStateMessage="No renovations yet. Your renovations will appear here."
        isPartner={false}
        onFileUpload={handleFileUpload}
        onRequestPhoneAccess={handleRequestPhoneAccess}
        onRequestUpdate={handleRequestUpdate}
        partnerPhone={selectedConversation?.partner?.phone}
      />
      </div>
    </div>
  );
}

