import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, FileText } from 'lucide-react';
import QuickActionsSection from './QuickActionsSection';
import MessageAttachments from './MessageAttachments';
import ChatInput from './chat/ChatInput';

function getServiceTagText(serviceType) {
  if (!serviceType) return 'Service';
  const normalizedType = serviceType.toLowerCase();
  if (normalizedType.includes('construction')) return 'Construction';
  if (normalizedType.includes('software') || normalizedType.includes('software_dev')) return 'Software Development';
  if (normalizedType.includes('consulting')) return 'Business Consulting';
  if (normalizedType.includes('manufacturing')) return 'Manufacturing';
  return 'Service';
}

export default function ConversationMessagesView({
  isDark,
  selectedConversation,
  messages,
  newMessage,
  setNewMessage,
  attachments = [],
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
  onClose,
  isPartner = false,
  onFileUpload,
  onRequestPhoneAccess,
  onRequestUpdate,
  partnerPhone
}) {
  // Default no-op function if adjustTextareaHeight is not provided
  const handleAdjustTextareaHeight = adjustTextareaHeight || ((textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  });


  if (!selectedConversation) return null;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className={`mb-4 pb-4 border-b flex-shrink-0 pt-4 ${isDark ? 'border-white' : 'border-gray-200'}`} style={isDark ? { borderColor: 'rgba(255, 255, 255, 0.1)' } : {}}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {onClose && (
                <button
                  onClick={onClose}
                  className="mr-2 hover:opacity-70 transition-opacity flex-shrink-0"
                >
                  <X className={`w-4 h-4 ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`} />
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
              {selectedConversation.partner?.companyName || 'Unknown Company'}
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
      <QuickActionsSection
        isDark={isDark}
        conversation={selectedConversation}
        isPartner={isPartner}
        onFileUpload={onFileUpload}
        onRequestPhoneAccess={onRequestPhoneAccess}
        onRequestUpdate={onRequestUpdate}
        partnerPhone={partnerPhone}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
          <div className="flex-1 flex items-center justify-center mb-4">
            <div className="text-center">
              <div className={`inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2 ${
                isDark ? 'border-blue-400' : 'border-blue-600'
              }`} />
              <p className={`text-sm ${isDark ? 'text-white opacity-60' : 'text-gray-600'}`}>
                Loading messages...
              </p>
            </div>
          </div>
        )}
        <div ref={messagesContainerRef} className="flex-1 space-y-4 mb-4 overflow-y-auto min-h-0">
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
              // Ensure message content exists
              const messageContent = isStreaming && streamingMessage 
                ? (streamingMessage.message || '') 
                : (msg.message || '');
              
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
                          ? 'bg-blue-500/30 text-white'
                          : 'bg-blue-100 text-gray-900'
                        : isDark
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className={`text-xs mb-1 font-medium ${msg.senderId === 'client' ? (isDark ? 'text-blue-200' : 'text-blue-700') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
                      {msg.senderName || (msg.senderId === 'client' ? 'You' : 'Partner')}
                    </div>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <MessageAttachments attachments={msg.attachments} isDark={isDark} />
                    )}
                    {messageContent && (
                      <div className={`text-sm whitespace-pre-wrap ${msg.senderId === 'client' ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                        {messageContent}
                        {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
                      </div>
                    )}
                    {!messageContent && !msg.attachments && (
                      <div className={`text-sm italic opacity-60 ${msg.senderId === 'client' ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                        Empty message
                      </div>
                    )}
                    {!isStreaming && (
                      <div className={`text-xs mt-1 ${msg.senderId === 'client' ? (isDark ? 'text-blue-200/70' : 'text-blue-600/70') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="pt-4">
          <ChatInput
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            attachments={attachments}
            setAttachments={setAttachments}
            sending={sending}
            isTyping={isTyping}
            setIsTyping={setIsTyping}
            sendMessage={sendMessage}
            textareaRef={textareaRef}
            adjustTextareaHeight={handleAdjustTextareaHeight}
            isDark={isDark}
            placeholder="Type your message..."
          />
        </div>
      </div>
    </div>
  );
}

