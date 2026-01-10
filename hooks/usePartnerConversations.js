import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionManager } from '../lib/sessionManager';

/**
 * Hook for managing partner conversations
 * Mirrors useConversations but uses /api/partners/* endpoints
 */
export function usePartnerConversations() {
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationError, setConversationError] = useState(null);
  const [clientIsLive, setClientIsLive] = useState(false);
  const [clientIsTyping, setClientIsTyping] = useState(false);
  const [partnerIsLive, setPartnerIsLive] = useState(false);

  // Refs
  const presenceIntervalRef = useRef(null);
  const messagesPollIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
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

  const sortByLatest = (convs) => {
    return (convs || []).sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || a.createdAt);
      const dateB = new Date(b.lastMessageAt || b.createdAt);
      return dateB - dateA;
    });
  };

  const fetchConversations = useCallback(async () => {
    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/partners/conversations/list', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
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
  }, [selectedConversation]);

  const markMessagesAsRead = useCallback(async (conversationId) => {
    if (currentConversationIdRef.current !== conversationId) {
      return;
    }

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) return;

      const token = headers.Authorization.replace('Bearer ', '');

      const response = await fetch(`/api/partners/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          ...headers,
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
  }, [fetchConversations]);

  const fetchConversation = useCallback(async (conversationId) => {
    if (currentConversationIdRef.current === conversationId && !conversationLoading) {
      return;
    }

    // Clean up previous conversation resources
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
    if (messagesPollIntervalRef.current) {
      clearTimeout(messagesPollIntervalRef.current);
      messagesPollIntervalRef.current = null;
    }

    currentConversationIdRef.current = conversationId;
    lastMessageIdRef.current = null;
    setConversationLoading(true);
    setConversationError(null);

    // Find conversation in list for instant UI feedback
    const conversationFromList = [...requests, ...messages].find(c => c.id === conversationId);
    if (conversationFromList) {
      setSelectedConversation(conversationFromList);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) {
        currentConversationIdRef.current = null;
        setConversationLoading(false);
        return;
      }

      const response = await fetch(`/api/partners/conversations/${conversationId}`, {
        headers,
        signal
      });

      if (signal.aborted) return;

      if (currentConversationIdRef.current !== conversationId) {
        setConversationLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
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
      setConversationMessages(conversationMessages);
      setConversationLoading(false);
      setConversationError(null);
      
      if (conversationMessages.length > 0) {
        lastMessageIdRef.current = conversationMessages[conversationMessages.length - 1].id;
      }

      // Mark as read after a delay
      if (data.conversation.unreadCount > 0) {
        if (markReadTimeoutRef.current) {
          clearTimeout(markReadTimeoutRef.current);
        }
        markReadTimeoutRef.current = setTimeout(() => {
          markMessagesAsRead(conversationId);
        }, 1000);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        setConversationLoading(false);
        return;
      }

      console.error('Error fetching conversation:', error);
      setConversationLoading(false);
      setConversationError(error.message || 'Failed to load conversation');
    }
  }, [requests, messages, markMessagesAsRead]);

  const sendMessage = useCallback(async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation) return;

    setSending(true);
    try {
      const headers = await sessionManager.getAuthHeaders();
      if (!headers.Authorization) return;

      const response = await fetch(`/api/partners/conversations/${selectedConversation.id}/message`, {
        method: 'POST',
        headers: {
          ...headers,
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
        await fetchConversation(selectedConversation.id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, [newMessage, attachments, selectedConversation, fetchConversation, fetchConversations]);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback((textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchConversations();
    
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      if (messagesPollIntervalRef.current) {
        clearTimeout(messagesPollIntervalRef.current);
      }
    };
  }, [fetchConversations]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationMessages.length > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [conversationMessages]);

  // Auto-resize textarea when message changes
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [newMessage, adjustTextareaHeight]);

  return {
    // State
    requests,
    messages,
    selectedConversation,
    conversationMessages,
    newMessage,
    attachments,
    loading,
    conversationLoading,
    sending,
    conversationError,
    clientIsLive,
    clientIsTyping,
    partnerIsLive,
    
    // Refs
    messagesEndRef,
    messagesContainerRef,
    textareaRef,
    conversationContainerRef,
    containerWrapperRef,
    messagesContainerWrapperRef,
    
    // Actions
    setNewMessage,
    setAttachments,
    setSelectedConversation,
    fetchConversations,
    fetchConversation,
    sendMessage,
    markMessagesAsRead,
    adjustTextareaHeight
  };
}

