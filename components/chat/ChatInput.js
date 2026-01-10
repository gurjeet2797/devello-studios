import React from 'react';
import { motion } from 'framer-motion';
import { Send, File } from 'lucide-react';
import UnifiedFileUpload from '../UnifiedFileUpload';

export default function ChatInput({
  newMessage,
  setNewMessage,
  attachments = [],
  setAttachments,
  sending,
  isTyping,
  setIsTyping,
  sendMessage,
  textareaRef,
  adjustTextareaHeight,
  isDark,
  placeholder = "Type your message...",
  onPresenceUpdate,
  selectedConversation
}) {
  const handleChange = async (e) => {
    setNewMessage(e.target.value);
    if (adjustTextareaHeight) {
      adjustTextareaHeight(e.target);
    }
    setIsTyping?.(e.target.value.length > 0);
    
    if (onPresenceUpdate && selectedConversation) {
      await onPresenceUpdate(selectedConversation.id, e.target.value.length > 0);
    }
  };

  const handleBlur = async () => {
    setIsTyping?.(false);
    if (onPresenceUpdate && selectedConversation) {
      await onPresenceUpdate(selectedConversation.id, false);
    }
  };

  const handleFocus = () => {
    if (newMessage.trim().length > 0) {
      setIsTyping?.(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUploaded = (attachment) => {
    if (setAttachments) {
      setAttachments(prev => [...prev, attachment]);
    }
  };

  const removeAttachment = (index) => {
    if (setAttachments) {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {/* Attachments Preview */}
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
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
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 items-end">
        <UnifiedFileUpload
          onFileUploaded={handleFileUploaded}
          isDark={isDark}
          disabled={sending}
        />
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          rows={1}
          className={`flex-1 rounded-xl border p-3 resize-none overflow-hidden ${
            isDark
              ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
              : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
          }`}
          style={{
            minHeight: '2.5rem',
            maxHeight: '200px',
            ...(isDark ? {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgb(255, 255, 255)'
            } : {})
          }}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
          disabled={(!newMessage.trim() && (!attachments || attachments.length === 0)) || sending}
          className="about-devello-glass px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          style={{
            minHeight: '2.5rem',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)',
            borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.3)',
            color: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)'
          }}
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}

