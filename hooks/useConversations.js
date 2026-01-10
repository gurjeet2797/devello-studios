import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { sessionManager } from '../lib/sessionManager';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clientIsLive, setClientIsLive] = useState(false);
  const [partnerIsLive, setPartnerIsLive] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationError, setConversationError] = useState(null);

  // Refs
  const presenceIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messagesPollIntervalRef = useRef(null);
  const currentConversationIdRef = useRef(null);
  const fetchAbortControllerRef = useRef(null);
  const pollAbortControllerRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const unreadRefreshIntervalRef = useRef(null);
  const markReadTimeoutRef = useRef(null);
  const textareaRef = useRef(null);
  const conversationContainerRef = useRef(null);
  const containerWrapperRef = useRef(null);
  const clientIsLiveRef = useRef(false);
  const partnerIsLiveRef = useRef(false);

  const cleanupConversationResources = () => {
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    if (messagesPollIntervalRef.current) {
      clearTimeout(messagesPollIntervalRef.current);
      messagesPollIntervalRef.current = null;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
      fetchAbortControllerRef.current = null;
    }
    if (pollAbortControllerRef.current) {
      pollAbortControllerRef.current.abort();
      pollAbortControllerRef.current = null;
    }
    currentConversationIdRef.current = null;
    lastMessageIdRef.current = null;
    setClientIsLive(false);
    setPartnerIsLive(false);
    clientIsLiveRef.current = false;
    partnerIsLiveRef.current = false;
    setPartnerIsTyping(false);
    setIsTyping(false);
    setStreamingMessage(null);
  };

  useEffect(() => {
    return () => {
      cleanupConversationResources();
      if (unreadRefreshIntervalRef.current) {
        clearInterval(unreadRefreshIntervalRef.current);
      }
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      cleanupConversationResources();
    }
  }, [selectedConversation]);

  const fetchConversations = useCallback(async () => {
    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) return;

      const response = await fetch('/api/conversations/list', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const sorted = (data.conversations || []).sort((a, b) => {
          const dateA = new Date(a.lastMessageAt || a.createdAt);
          const dateB = new Date(b.lastMessageAt || b.createdAt);
          return dateB - dateA;
        });
        const normalized = sorted.map(conv => ({
          ...conv,
          unreadCount: conv.unreadCount || 0
        }));
        setConversations(normalized);
        
        const totalUnread = normalized.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
        
        setSelectedConversation(prev => {
          if (!prev) return prev;
          const updatedConv = normalized.find(c => c.id === prev.id);
          if (updatedConv) {
            return {
              ...prev,
              unreadCount: updatedConv.unreadCount || 0
            };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markMessagesAsRead = async (conversationId, token) => {
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        
        if (currentConversationIdRef.current === conversationId) {
          setSelectedConversation(prev => prev ? {
            ...prev,
            unreadCount: data.unreadCount || 0
          } : null);
        }
        
        fetchConversations();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchConversation = async (conversationId) => {
    if (conversationId === null) {
      cleanupConversationResources();
      setSelectedConversation(null);
      setMessages([]);
      setNewMessage('');
      return;
    }

    if (currentConversationIdRef.current === conversationId && !conversationLoading) {
      return;
    }

    cleanupConversationResources();
    currentConversationIdRef.current = conversationId;
    lastMessageIdRef.current = null;

    setConversationLoading(true);
    setConversationError(null);

    const conversationFromList = conversations.find(c => c.id === conversationId);
    if (conversationFromList) {
      setSelectedConversation(conversationFromList);
    }

    fetchAbortControllerRef.current = new AbortController();
    const signal = fetchAbortControllerRef.current.signal;

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        currentConversationIdRef.current = null;
        setConversationLoading(false);
        return;
      }

      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          ...headers
        },
        signal
      });

      if (signal.aborted) return;

      if (currentConversationIdRef.current !== conversationId) {
        setConversationLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch conversation' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (currentConversationIdRef.current !== conversationId) {
        setConversationLoading(false);
        return;
      }

      const conversationMessages = data.conversation.messages || [];
      
      setSelectedConversation({
        ...data.conversation,
        unreadCount: data.conversation.unreadCount || 0
      });
      setMessages(conversationMessages);
      setConversationLoading(false);
      setConversationError(null);
      
      if (conversationMessages.length > 0) {
        lastMessageIdRef.current = conversationMessages[conversationMessages.length - 1].id;
      }

      // Extract token from headers for presence tracking
      const token = headers.Authorization?.replace('Bearer ', '') || null;
      
      if (data.conversation.unreadCount > 0 && token) {
        if (markReadTimeoutRef.current) {
          clearTimeout(markReadTimeoutRef.current);
        }
        markReadTimeoutRef.current = setTimeout(() => {
          markMessagesAsRead(conversationId, token);
        }, 1000);
      }

      if (token) {
        startPresenceTracking(conversationId, token);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setConversationLoading(false);
        return;
      }

      console.error('Error fetching conversation:', error);
      setConversationLoading(false);
      setConversationError(error.message || 'Failed to load conversation');
      
      if (conversationFromList && currentConversationIdRef.current === conversationId) {
        // Keep the conversation visible but show error
      } else if (currentConversationIdRef.current === conversationId) {
        setSelectedConversation(null);
        currentConversationIdRef.current = null;
      }
    }
  };

  const startPresenceTracking = (conversationId, token) => {
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
    }
    if (messagesPollIntervalRef.current) {
      clearTimeout(messagesPollIntervalRef.current);
    }

    updatePresence(conversationId, token, false);

    const updatePresenceInterval = () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      presenceIntervalRef.current = setInterval(() => {
        if (currentConversationIdRef.current !== conversationId) {
          clearInterval(presenceIntervalRef.current);
          presenceIntervalRef.current = null;
          return;
        }
        updatePresence(conversationId, token, isTyping);
        checkPresence(conversationId, token);
      }, 5000);
    };
    updatePresenceInterval();

    checkPresence(conversationId, token);
    startMessagePolling(conversationId, token);
  };

  const startMessagePolling = (conversationId, token) => {
    const pollMessages = async () => {
      if (currentConversationIdRef.current !== conversationId) {
        cleanupConversationResources();
        return;
      }

      try {
        if (pollAbortControllerRef.current) {
          pollAbortControllerRef.current.abort();
        }
        pollAbortControllerRef.current = new AbortController();
        const signal = pollAbortControllerRef.current.signal;

        const url = lastMessageIdRef.current
          ? `/api/conversations/${conversationId}?after=${lastMessageIdRef.current}`
          : `/api/conversations/${conversationId}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal
        });

        if (signal.aborted) return;

        if (currentConversationIdRef.current !== conversationId) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const newMessages = data.conversation.messages || [];
          
          if (currentConversationIdRef.current !== conversationId) {
            return;
          }

          setMessages(prev => {
            if (lastMessageIdRef.current) {
              if (newMessages.length > 0) {
                const existingIds = new Set(prev.map(m => m.id));
                const merged = [...prev];
                newMessages.forEach(msg => {
                  if (!existingIds.has(msg.id)) {
                    merged.push(msg);
                  }
                });
                merged.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                if (merged.length > prev.length) {
                  lastMessageIdRef.current = merged[merged.length - 1].id;
                  return merged;
                }
              }
              return prev;
            }
            if (newMessages.length > 0) {
              lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
              return newMessages;
            }
            return prev.length === 0 ? newMessages : prev;
          });
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Error polling messages:', error);
      }
    };

    pollMessages();

    const getPollInterval = () => {
      if (currentConversationIdRef.current !== conversationId) {
        return null;
      }
      const clientLive = clientIsLiveRef.current;
      const partnerLive = partnerIsLiveRef.current;
      if (clientLive || partnerLive) {
        return (clientLive && partnerLive) ? 500 : 2000;
      }
      return 5000;
    };

    const scheduleNextPoll = () => {
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
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}/presence`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        if (currentConversationIdRef.current !== conversationId) {
          return;
        }

        const data = await response.json();
        const wasBothActive = clientIsLiveRef.current && partnerIsLiveRef.current;
        setClientIsLive(data.clientActive);
        setPartnerIsLive(data.partnerActive);
        clientIsLiveRef.current = data.clientActive;
        partnerIsLiveRef.current = data.partnerActive;
        
        setSelectedConversation(prev => {
          if (prev && prev.id === conversationId) {
            const partnerUser = data.activeUsers?.find(u => {
              return u.userId === prev.partner?.user_id;
            });
            setPartnerIsTyping(partnerUser?.isTyping || false);
          }
          return prev;
        });
        
        const isBothActive = data.clientActive && data.partnerActive;
        if (wasBothActive !== isBothActive && currentConversationIdRef.current === conversationId) {
          startMessagePolling(conversationId, token);
        }
      }
    } catch (error) {
      console.error('Error checking presence:', error);
    }
  };

  const sendMessage = async (messageAttachments = null) => {
    const finalAttachments = messageAttachments || attachments;
    if ((!newMessage.trim() && (!finalAttachments || finalAttachments.length === 0)) || !selectedConversation) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setAttachments([]);
    setIsTyping(false);
    setSending(true);

    const supabase = getSupabase();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        updatePresence(selectedConversation.id, session.access_token, false);
      }
    }

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) return;

      const tempMessageId = `temp_${Date.now()}`;
      const tempMessage = {
        id: tempMessageId,
        message: '',
        senderName: 'You',
        senderId: 'client',
        createdAt: new Date(),
        isStreaming: true
      };
      
      setStreamingMessage(tempMessage);
      setMessages(prev => [...prev, tempMessage]);

      const response = await fetch(`/api/conversations/${selectedConversation.id}/message-stream`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          attachments: finalAttachments && finalAttachments.length > 0 ? finalAttachments : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'stream') {
                setStreamingMessage(prev => {
                  const updated = {
                    ...prev,
                    message: (prev?.message || '') + data.chunk
                  };
                  setMessages(prevMsgs => prevMsgs.map(msg => 
                    msg.id === tempMessageId || msg.id === data.messageId
                      ? { ...msg, message: updated.message }
                      : msg
                  ));
                  return updated;
                });
              } else if (data.type === 'message_created') {
                const realMessage = { ...data.message, isStreaming: true };
                setMessages(prev => prev.map(msg => 
                  msg.id === tempMessageId 
                    ? realMessage
                    : msg
                ));
                setStreamingMessage(realMessage);
              } else if (data.type === 'complete') {
                if (data.realMessageId && data.message) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === data.messageId || msg.id === tempMessageId
                      ? { ...data.message, isStreaming: false }
                      : msg
                  ));
                } else {
                  setMessages(prev => prev.map(msg => 
                    msg.id === data.messageId || msg.id === tempMessageId
                      ? { ...msg, isStreaming: false }
                      : msg
                  ));
                }
                setStreamingMessage(null);
                await fetchConversations();
                fetchConversation(selectedConversation.id);
                
                // Use functional state update to get current values
                setClientIsLive(current => {
                  setPartnerIsLive(partner => {
                    if (current && partner) {
                      setTimeout(() => {
                        fetchConversation(selectedConversation.id);
                      }, 300);
                    }
                    return partner;
                  });
                  return current;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      setStreamingMessage(null);
      setNewMessage(messageText);
      setAttachments(finalAttachments || []);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!selectedConversation) return;

    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      updatePresence(selectedConversation.id, session.access_token, isTyping);

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, selectedConversation, isTyping]);

  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

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

  useEffect(() => {
    if (!selectedConversation && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      adjustTextareaHeight(textareaRef.current);
    }
  }, [selectedConversation]);

  return {
    // State
    conversations,
    selectedConversation,
    messages,
    newMessage,
    attachments,
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
    
    // Refs
    messagesEndRef,
    messagesContainerRef,
    textareaRef,
    conversationContainerRef,
    containerWrapperRef,
    
    // Actions
    setNewMessage,
    setIsTyping,
    setAttachments,
    fetchConversations,
    fetchConversation,
    sendMessage,
    adjustTextareaHeight
  };
}

