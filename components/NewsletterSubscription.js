import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './Layout';

export default function NewsletterSubscription({ className = "" }) {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Successfully subscribed to our newsletter!');
        setIsSuccess(true);
        setEmail('');
      } else {
        setMessage(data.error || 'Failed to subscribe. Please try again.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setMessage('Failed to subscribe. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="text-center mb-4">
        <h3 className={`text-lg font-semibold mb-2 ${
          isDark ? 'text-white' : 'text-gray-800'
        }`}>
          Stay Updated
        </h3>
        <p className={`text-sm ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Get the latest updates on new features and AI tools
        </p>
        <p className={`text-sm ${
          isDark ? 'text-white/70' : 'text-gray-600'
        }`}>
          Reach out to us at <a href="mailto:sales@develloinc.com" className={isDark ? 'text-white underline' : 'text-amber-600 underline'}>sales@develloinc.com</a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-300 ${
              isDark
                ? 'bg-white/5 border-white/20 text-white placeholder-white/50 focus:border-white/40'
                : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500 focus:border-amber-400'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
            disabled={isLoading}
            required
          />
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              isDark
                ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                : 'bg-amber-500 text-white hover:bg-amber-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Subscribing...
              </div>
            ) : (
              'Subscribe'
            )}
          </motion.button>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm text-center p-2 rounded-lg ${
              isSuccess
                ? isDark
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-green-100 text-green-700 border border-green-300'
                : isDark
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}
          >
            {message}
          </motion.div>
        )}
      </form>
    </div>
  );
}
