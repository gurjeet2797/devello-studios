import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDeviceFingerprint } from '../lib/uploadStats';

export default function CodeInputModal({ isOpen, onClose, isDark }) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    
    try {
      // Validate code locally first (faster UX)
      if (code.trim().toUpperCase() !== 'MORE') {
        setError('Invalid code');
        setCode('');
        setIsSubmitting(false);
        return;
      }

      // IMMEDIATELY reset localStorage (primary source of truth)
      // Reset upload count to 0, keep limit at 5 = fresh 5/5 sessions
      localStorage.setItem('devello_guest_uploads', '0');
      localStorage.setItem('devello_guest_limit', '5');

      // Try server sync in background (non-blocking)
      try {
        let sessionId = localStorage.getItem('devello_guest_session');
        if (!sessionId) {
          sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('devello_guest_session', sessionId);
        }

        const deviceFingerprint = await generateDeviceFingerprint();

        // Non-blocking server call
        fetch('/api/guest/add-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: code.trim(),
            sessionId,
            deviceFingerprint
          })
        }).catch(() => {
          // Silently ignore - localStorage already updated
        });
      } catch (serverError) {
        // Silently ignore server sync errors
      }
      
      setCode('');
      onClose();
      // Refresh page to update session count
      window.location.reload();
    } catch (error) {
      console.error('Error submitting code:', error);
      setError('Error submitting code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`about-devello-glass rounded-2xl p-6 max-w-md w-full mx-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: isDark 
              ? 'rgba(30, 30, 30, 0.9)' 
              : 'rgba(255, 255, 255, 0.9)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Enter Code
          </h2>
          <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter your code to reset sessions to 5
          </p>
          
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Enter code"
              className={`w-full px-4 py-3 rounded-xl mb-4 outline-none transition-all ${
                isDark
                  ? 'bg-white/10 text-white placeholder-white/50 border border-white/20'
                  : 'bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300'
              } ${error ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
              autoFocus
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mb-4"
              >
                {error}
              </motion.p>
            )}
            
            <div className="flex gap-3">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting || !code.trim()}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                  isSubmitting || !code.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
