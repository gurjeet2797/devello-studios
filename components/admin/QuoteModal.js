import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import { useTheme } from '../Layout';
import { getSupabase } from '../../lib/supabaseClient';

export default function QuoteModal({ isOpen, onClose, requestId, request }) {
  const { isDark } = useTheme();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = getSupabase();

  // Get existing quote if available
  const existingQuote = request?.quotes && request.quotes.length > 0 
    ? request.quotes.find(q => q.status === 'pending') || request.quotes[0]
    : null;
  const isUpdate = !!existingQuote;

  // Populate form with existing quote data
  useEffect(() => {
    if (isOpen && existingQuote) {
      setAmount((existingQuote.amount / 100).toFixed(2));
      setNotes(existingQuote.admin_notes || '');
    } else if (isOpen && !existingQuote) {
      // Reset form for new quote
      setAmount('');
      setNotes('');
    }
  }, [isOpen, existingQuote]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      if (isNaN(amountInCents) || amountInCents <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`/api/admin/orders/${requestId}/quote`, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: 'usd',
          admin_notes: notes || undefined,
          quote_id: existingQuote?.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send quote');
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
              <div className={`p-2 rounded-lg ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-100'}`}>
                <DollarSign className={`w-5 h-5 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`} />
              </div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {isUpdate ? 'Update Quote' : 'Send Quote'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isDark ? 'text-white/70' : 'text-gray-600'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quote Amount (USD)
              </label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className={`w-full pl-8 pr-4 py-2 rounded-lg ${
                    isDark
                      ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                      : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                  }`}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Admin Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                    : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                }`}
                placeholder="Add any notes about this quote..."
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 px-4 py-2 rounded-full font-medium transition-colors ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 px-4 py-2 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (isUpdate ? 'Updating...' : 'Sending...') : (isUpdate ? 'Update Quote' : 'Send Quote')}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

