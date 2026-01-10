import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './Layout';
import { getSupabase } from '../lib/supabaseClient';
import { MessageCircle, Mail, Phone, Clock, CheckCircle, Send, ArrowUpRight, Folder, X, RefreshCw, Circle } from 'lucide-react';

export default function PartnerDashboard({ partnerData: propPartnerData }) {
  const { isDark } = useTheme();
  const [userName, setUserName] = useState('Partner');

  // Use prop data if provided, otherwise use placeholder
  const partnerData = propPartnerData || {
    companyName: 'Your Company Name',
    serviceType: 'software_dev', // 'construction', 'software_dev', 'consulting'
    status: 'approved',
    appliedAt: new Date().toISOString(),
    approvedAt: new Date().toISOString()
  };

  // Fetch user profile to get name
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
          } else {
            setUserName('Partner');
          }
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  }, []);

  const getServiceTypeLabel = (type) => {
    const labels = {
      construction: 'Construction Services',
      software_dev: 'Software Development',
      software_development: 'Software Development', // Supabase value
      consulting: 'Business Consultation'
    };
    return labels[type] || type;
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      construction: isDark 
        ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' 
        : 'bg-orange-100/50 text-orange-700 border-orange-300/50',
      software_dev: isDark
        ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
        : 'bg-blue-100/50 text-blue-700 border-blue-300/50',
      software_development: isDark // Supabase value
        ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
        : 'bg-blue-100/50 text-blue-700 border-blue-300/50',
      consulting: isDark
        ? 'bg-yellow-400/20 text-yellow-200 border-yellow-300/30'
        : 'bg-yellow-100/50 text-yellow-600 border-yellow-300/50'
    };
    return colors[type] || colors.software_dev;
  };

  const [stats, setStats] = useState({
    openRequests: 0,
    activeProjects: 0,
    avgResponse: 'N/A'
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/partners/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notification preferences
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const response = await fetch('/api/partners/notifications', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setEmailNotificationsEnabled(data.emailNotificationsEnabled || false);
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      }
    };

    fetchNotificationPreferences();
  }, []);

  const handleNotificationToggle = async (enabled) => {
    try {
      console.log('[PARTNER_DASHBOARD] Toggling notifications', { enabled });
      setNotificationLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No session token available');
      }

      console.log('[PARTNER_DASHBOARD] Sending request to API');
      const response = await fetch('/api/partners/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ emailNotificationsEnabled: enabled })
      });

      console.log('[PARTNER_DASHBOARD] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[PARTNER_DASHBOARD] Success:', data);
        setEmailNotificationsEnabled(enabled);
      } else {
        const errorData = await response.json();
        console.error('[PARTNER_DASHBOARD] Failed to update notification preferences:', errorData);
        alert(`Failed to update notification preferences: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[PARTNER_DASHBOARD] Error updating notification preferences:', error);
      alert(`Error updating notification preferences: ${error.message}`);
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-20 sm:pt-12">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 md:p-8 ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'}`}
      >
        <div className="flex items-center justify-between pt-2 sm:pt-0">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome back, {userName}!
            </h1>
            <p className={`text-lg ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {partnerData.companyName}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className={`inline-block px-4 py-2 rounded-lg border text-sm font-medium ${getServiceTypeColor(partnerData.serviceType)}`}>
              {getServiceTypeLabel(partnerData.serviceType)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats - Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl p-4 ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Quick Stats
          </h2>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            title="Refresh stats"
          >
            <RefreshCw className={`w-4 h-4 ${isDark ? 'text-white/60' : 'text-gray-600'} ${statsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {statsLoading ? (
          <div className="flex items-center gap-2">
            <div className={`h-4 w-4 border-2 ${isDark ? 'border-white/20 border-t-white/60' : 'border-gray-200 border-t-gray-600'} rounded-full animate-spin`}></div>
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Open Requests</p>
              <p className={`mt-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.openRequests}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Active Projects</p>
              <p className={`mt-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.activeProjects}
              </p>
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Avg Response</p>
              <p className={`mt-1 text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.avgResponse}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Email Notifications - Matching Client Portal Style */}
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

      {/* Messages Section */}
      <PartnerMessages isDark={isDark} />

      {/* Projects Section */}
      <PartnerProjects isDark={isDark} />

      {/* Connect Google Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'}`}
      >
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Connect Google Calendar
        </h2>
        <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          Sync your Google Calendar to see your events and meetings.
        </p>
        <button
          onClick={() => {
            window.location.href = '/api/calendar/auth';
          }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            isDark
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
              : 'bg-amber-100/50 text-black hover:bg-amber-200/60 border border-amber-300/30'
          }`}
        >
          Connect Google Calendar
        </button>
      </motion.div>
    </div>
  );
}

function PartnerMessages({ isDark }) {
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'messages'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [clientIsLive, setClientIsLive] = useState(false);
  const [clientIsTyping, setClientIsTyping] = useState(false);
  const [partnerIsLive, setPartnerIsLive] = useState(false);
  const presenceIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesPollIntervalRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

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
        setRequests(data.requests || []);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversation = async (conversationId) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/partners/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedConversation(data.conversation);
        setConversationMessages(data.conversation.messages || []);
        
        // Start presence tracking
        startPresenceTracking(conversationId, session.access_token);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const startPresenceTracking = (conversationId, token) => {
    // Clear existing intervals
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
    }
    if (messagesPollIntervalRef.current) {
      clearTimeout(messagesPollIntervalRef.current);
    }

    // Update partner presence immediately
    updatePresence(conversationId, token, false);

    // Check presence - interval will be recreated when status changes
    const updatePresenceInterval = () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      presenceIntervalRef.current = setInterval(() => {
        checkPresence(conversationId, token);
      }, 3000);
    };
    updatePresenceInterval();

    // Check presence immediately
    checkPresence(conversationId, token);

    // Start message polling
    startMessagePolling(conversationId, token);
  };

  const startMessagePolling = (conversationId, token) => {
    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/partners/conversations/${conversationId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Only update if messages have changed
          const newMessages = data.conversation.messages || [];
          setConversationMessages(prev => {
            // Check if messages actually changed
            if (prev.length !== newMessages.length || 
                prev[prev.length - 1]?.id !== newMessages[newMessages.length - 1]?.id) {
              return newMessages;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Poll immediately
    pollMessages();

    // Poll every 500ms when both users are active for instant updates, 2s when one is active, stop when inactive
    const getPollInterval = () => {
      // Only poll if at least one user is active
      if (clientIsLive || partnerIsLive) {
        return (clientIsLive && partnerIsLive) ? 500 : 2000;
      }
      return null; // Stop polling when both are inactive
    };

    const scheduleNextPoll = () => {
      if (messagesPollIntervalRef.current) {
        clearTimeout(messagesPollIntervalRef.current);
      }
      const interval = getPollInterval();
      if (interval !== null) {
        messagesPollIntervalRef.current = setTimeout(() => {
          pollMessages();
          scheduleNextPoll();
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
    try {
      const response = await fetch(`/api/conversations/${conversationId}/presence`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const wasBothActive = clientIsLive && partnerIsLive;
        setClientIsLive(data.clientActive);
        setPartnerIsLive(data.partnerActive);
        // Check if client is typing - find any active user that's not the partner
        const clientUser = data.activeUsers?.find(u => {
          // Client is active if they're in the active users list and not the partner
          return u.userId !== selectedConversation?.partner?.user_id;
        });
        setClientIsTyping(clientUser?.isTyping || false);
        
        // Restart polling with new interval if active status changed
        const isBothActive = data.clientActive && data.partnerActive;
        if (wasBothActive !== isBothActive && selectedConversation) {
          startMessagePolling(conversationId, token);
        }
        
        // If both users just became active, immediately refresh messages
        if (!wasBothActive && isBothActive) {
          fetchConversation(conversationId);
        }
      }
    } catch (error) {
      console.error('Error checking presence:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      if (messagesPollIntervalRef.current) {
        clearTimeout(messagesPollIntervalRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

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
          message: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        // Clear typing status immediately after sending
        updatePresence(selectedConversation.id, session.access_token, false);
        // Immediately refresh messages after sending
        await fetchConversation(selectedConversation.id);
        fetchConversations(); // Refresh list - this will move it from requests to messages
        // If we're in requests tab and just replied, switch to messages tab
        if (activeTab === 'requests') {
          setActiveTab('messages');
        }
        
        // If both users are active, trigger immediate refresh for client
        if (clientIsLive && partnerIsLive) {
          // Small delay then refresh again to catch client's view
          setTimeout(() => {
            fetchConversation(selectedConversation.id);
          }, 300);
        }
        
        // Scroll to bottom after message is sent (only scroll the chat container)
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Auto-scroll when messages change (only scroll the chat container)
  useEffect(() => {
    if (conversationMessages.length > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [conversationMessages]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'}`}
      >
        <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Loading conversations...</p>
      </motion.div>
    );
  }

  const currentList = activeTab === 'requests' ? requests : messages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`rounded-2xl ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'}`}
    >
      <div className="grid lg:grid-cols-3 gap-0 lg:gap-4 p-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 mb-4 lg:mb-0">
          {/* Tabs */}
          <div className={`flex gap-2 mb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <button
              onClick={() => {
                setActiveTab('requests');
                setSelectedConversation(null);
                setConversationMessages([]);
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Requests
              {requests.length > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  activeTab === 'requests'
                    ? isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
                }`}>
                  {requests.length}
                </span>
              )}
              {activeTab === 'requests' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`} />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('messages');
                setSelectedConversation(null);
                setConversationMessages([]);
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors relative ${
                activeTab === 'messages'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDark
                  ? 'text-white/60 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Messages
              {messages.length > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                  activeTab === 'messages'
                    ? isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                    : isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
                }`}>
                  {messages.length}
                </span>
              )}
              {activeTab === 'messages' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`} />
              )}
            </button>
          </div>

          {currentList.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {activeTab === 'requests'
                  ? 'No new requests. New client messages will appear here.'
                  : 'No active conversations. Replied requests will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {currentList.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => fetchConversation(conv.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    selectedConversation?.id === conv.id
                      ? isDark
                        ? 'border-white/20 bg-white/10'
                        : 'border-gray-300 bg-gray-100'
                      : isDark
                      ? 'border-white/10 hover:bg-white/5'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {conv.user?.email || 'Unknown Client'}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {conv.subject}
                  </div>
                  {conv.lastMessage && (
                    <div className={`text-xs mt-1 truncate ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                      {conv.lastMessage.message}
                    </div>
                  )}
                  <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Messages View */}
        {selectedConversation ? (
          <div className="lg:col-span-2">
            <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-gray-900/30' : 'border-gray-200 bg-white/50'} flex flex-col h-[600px]`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-start justify-between`}>
                <div className="flex-1">
                  <h3 className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedConversation.user?.email || 'Unknown Client'}
                    {clientIsLive && (
                      <span className="flex items-center gap-1 text-xs font-normal">
                        <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                        <span className={isDark ? 'text-green-400' : 'text-green-600'}>Client is live</span>
                      </span>
                    )}
                    {clientIsTyping && (
                      <span className={`text-xs font-normal italic ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        typing...
                      </span>
                    )}
                  </h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {selectedConversation.subject}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // TODO: Implement upgrade to project functionality
                    alert('Upgrade to Project feature coming soon!');
                  }}
                  className={`ml-4 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Upgrade to Project
                </button>
              </div>
              
              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 space-y-4 mb-4 overflow-y-auto p-4">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === 'partner' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-3 ${
                        msg.senderId === 'partner'
                          ? isDark
                            ? 'bg-blue-500/20 text-white'
                            : 'bg-blue-100 text-gray-900'
                          : isDark
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className={`text-xs mb-1 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                        {msg.senderName}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <div className="flex gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      // Update typing status when typing
                      const supabase = getSupabase();
                      if (supabase && selectedConversation) {
                        supabase.auth.getSession().then(({ data: { session } }) => {
                          if (session?.access_token) {
                            updatePresence(selectedConversation.id, session.access_token, e.target.value.length > 0);
                          }
                        });
                      }
                    }}
                    onBlur={() => {
                      // Clear typing when user leaves the field
                      const supabase = getSupabase();
                      if (supabase && selectedConversation) {
                        supabase.auth.getSession().then(({ data: { session } }) => {
                          if (session?.access_token) {
                            updatePresence(selectedConversation.id, session.access_token, false);
                          }
                        });
                      }
                    }}
                    onFocus={() => {
                      // Set typing if there's text when user focuses back
                      const supabase = getSupabase();
                      if (supabase && selectedConversation && newMessage.trim().length > 0) {
                        supabase.auth.getSession().then(({ data: { session } }) => {
                          if (session?.access_token) {
                            updatePresence(selectedConversation.id, session.access_token, true);
                          }
                        });
                      }
                    }}
                    placeholder="Type your reply..."
                    rows={3}
                    className={`flex-1 rounded-xl border p-3 resize-none ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                      isDark
                        ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 hidden lg:block">
            <div className={`rounded-xl border ${isDark ? 'border-white/10 bg-gray-900/30' : 'border-gray-200 bg-white/50'} flex items-center justify-center h-[600px]`}>
              <div className="text-center p-8">
                <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                <p className={isDark ? 'text-white/60' : 'text-gray-600'}>
                  Select a conversation to view messages
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PartnerProjects({ isDark }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Mock project data
  const projects = [
    {
      id: '1',
      name: 'E-commerce Platform Redesign',
      client: 'TechCorp Inc.',
      status: 'active',
      progress: 65,
      budget: '$45,000',
      startDate: '2024-01-15',
      deadline: '2024-04-30',
      description: 'Complete redesign of the e-commerce platform with modern UI/UX and improved performance.'
    },
    {
      id: '2',
      name: 'Mobile App Development',
      client: 'StartupXYZ',
      status: 'active',
      progress: 40,
      budget: '$28,000',
      startDate: '2024-02-01',
      deadline: '2024-05-15',
      description: 'Native mobile app development for iOS and Android platforms with backend integration.'
    }
  ];

  const getStatusColor = (status) => {
    if (status === 'active') {
      return isDark
        ? 'bg-green-500/20 text-green-300 border-green-400/30'
        : 'bg-green-100 text-green-700 border-green-300';
    }
    return isDark
      ? 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      : 'bg-gray-100 text-gray-700 border-gray-300';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`rounded-2xl p-6 ${isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-amber-200/30'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <Folder className="w-5 h-5" />
            Projects
          </h2>
          <span className={`text-sm px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'}`}>
            {projects.length} Active
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Folder className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-white/30' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              No active projects. Upgrade conversations to projects to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`rounded-xl border p-4 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedProject(project);
                  setShowProjectModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {project.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {project.client}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Progress</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      {project.progress}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full transition-all ${
                        isDark ? 'bg-green-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-white/50' : 'text-gray-500'}>
                    Budget: <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{project.budget}</span>
                  </span>
                  <span className={isDark ? 'text-white/50' : 'text-gray-500'}>
                    Due: <span className={isDark ? 'text-white/70' : 'text-gray-700'}>
                      {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Project Dashboard Modal */}
      <ProjectDashboardModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        isDark={isDark}
      />
    </>
  );
}

function ProjectDashboardModal({ isOpen, onClose, project, isDark }) {
  if (!isOpen || !project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'rgba(0, 0, 0, 0.8)'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
            isDark ? 'border-white/10' : 'border-gray-200'
          }`}
          style={{
            background: isDark
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'} flex items-start justify-between`}>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {project.name}
              </h2>
              <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                {project.client}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Project Overview */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Project Overview
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {project.description}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Progress</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {project.progress}%
                </p>
                <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div
                    className={`h-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Budget</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {project.budget}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Start Date</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`text-xs mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Deadline</p>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Tasks Section (Mock) */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Tasks
              </h3>
              <div className="space-y-2">
                {[
                  { id: 1, task: 'Design mockups for homepage', status: 'completed' },
                  { id: 2, task: 'Implement user authentication', status: 'in-progress' },
                  { id: 3, task: 'Setup database schema', status: 'pending' }
                ].map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-700'}`}>
                      {task.task}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'completed'
                        ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                        : task.status === 'in-progress'
                        ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                        : isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Section (Mock) */}
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Team Members
              </h3>
              <div className="flex gap-3">
                {['John Doe', 'Jane Smith', 'Mike Johnson'].map((member, idx) => (
                  <div
                    key={idx}
                    className={`px-4 py-2 rounded-lg border ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {member}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                      {idx === 0 ? 'Project Manager' : idx === 1 ? 'Developer' : 'Designer'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

