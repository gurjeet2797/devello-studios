import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, Send } from 'lucide-react';
import { useTheme } from '../Layout';
import { getSupabase } from '../../lib/supabaseClient';

export default function RefuseOrderModal({ isOpen, onClose, requestId, request }) {
  const { isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = getSupabase();

  const handleRefuse = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!message.trim()) {
      setError('Please provide a reason for refusing this order');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/admin/orders/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'refuse',
          message: message.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to refuse order');
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`about-devello-glass rounded-2xl p-6 border-2 relative z-10 w-full max-w-md ${
            isDark ? 'border-white/10' : 'border-white/30'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                <XCircle className={`w-5 h-5 ${isDark ? 'text-red-300' : 'text-red-700'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Refuse Order Request
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isDark ? 'text-white/70' : 'text-gray-600'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleRefuse} className="space-y-4">
            <div>
              <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Please provide a reason for refusing this order. The client will receive an email notification with your message.
              </p>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Reason for Refusal <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                className={`w-full px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                    : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                }`}
                placeholder="Explain why this order is being refused..."
              />
            </div>

            {error && (
              <div className={`p-3 rounded-lg text-sm ${
                isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
              }`}>
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <motion.button
                type="button"
                onClick={onClose}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || !message.trim()}
                whileHover={{ scale: loading || !message.trim() ? 1 : 1.02 }}
                whileTap={{ scale: loading || !message.trim() ? 1 : 0.98 }}
                className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {loading ? 'Refusing...' : 'Refuse Order'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

