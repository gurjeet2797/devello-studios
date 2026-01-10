import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../Layout';
import { getSupabase } from '../../lib/supabaseClient';

export default function OrderStatusModal({ isOpen, onClose, requestId, request }) {
  const { isDark } = useTheme();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = getSupabase();

  const handleSendUpdate = async (e) => {
    e.preventDefault();
    setError(null);
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
          action: 'send_update',
          message: message || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send update');
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setError(null);
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
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
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
              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <Send className={`w-5 h-5 ${isDark ? 'text-blue-300' : 'text-blue-700'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Actions
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
          <div className="space-y-4">
            {/* Send Update Form */}
            <form onSubmit={handleSendUpdate} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Send Update Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg ${
                    isDark
                      ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                      : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                  }`}
                  placeholder="Add a message to send with the update..."
                />
              </div>

              {error && (
                <div className={`p-3 rounded-lg text-sm ${
                  isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                }`}>
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Update'}
              </motion.button>
            </form>

            {/* Quick Actions */}
            {request?.productOrder && request.productOrder.payment_status === 'succeeded' && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <p className={`text-sm font-medium mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  Quick Actions
                </p>
                <motion.button
                  onClick={() => handleAction('mark_ready')}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full px-4 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Order Ready
                </motion.button>
                <motion.button
                  onClick={() => handleAction('cancel')}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="w-full px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

