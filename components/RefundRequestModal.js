import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { useTheme } from './Layout';
import { getSupabase } from '../lib/supabaseClient';

export default function RefundRequestModal({ isOpen, onClose, order, onSuccess }) {
  const { isDark } = useTheme();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const supabase = getSupabase();

  const refundReasons = [
    'Defective product',
    'Wrong item received',
    'Item not as described',
    'Changed my mind',
    'Shipping delay',
    'Other'
  ];

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!reason) {
      setError('Please select a reason for the refund');
      return;
    }

    try {
      setSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        return;
      }

      const refundAmount = amount ? Math.round(parseFloat(amount) * 100) : null;

      const response = await fetch('/api/refunds/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productOrderId: order.id,
          reason,
          description: description.trim() || null,
          amount: refundAmount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to submit refund request' }));
        throw new Error(errorData.error || 'Failed to submit refund request');
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data.refundRequest);
      }

      onClose();
    } catch (err) {
      console.error('Error submitting refund request:', err);
      setError(err.message || 'Failed to submit refund request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const payment = order.payments?.[0];
  const maxRefund = payment?.amount || order.amount;
  const defaultAmount = maxRefund / 100;

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
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`about-devello-glass rounded-3xl border-2 relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col ${
            isDark ? 'border-white/10' : 'border-white/30'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 sm:p-6 border-b-2 flex-shrink-0 ${
            isDark ? 'border-white/10' : 'border-white/30'
          }`}>
            <div>
              <h2 className={`text-xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Request Refund
              </h2>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Order #{order.order_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                isDark ? 'text-white/70' : 'text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Order Info */}
            <div className={`rounded-2xl p-4 mb-4 border-2 ${
              isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
            }`}>
              <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Information
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Product:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{order.product?.name || 'Product'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Amount Paid:</span>
                  <span className={isDark ? 'text-white' : 'text-gray-900'}>{formatCurrency(maxRefund)}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Reason for Refund <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border-2 ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                  required
                >
                  <option value="">Select a reason</option>
                  {refundReasons.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-xl border-2 ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none`}
                  placeholder="Please provide any additional information about your refund request..."
                />
              </div>

              {/* Amount (Optional) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Refund Amount (Optional)
                </label>
                <div className="relative">
                  <DollarSign className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-white/50' : 'text-gray-400'
                  }`} />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    max={defaultAmount}
                    step="0.01"
                    className={`w-full pl-10 pr-4 py-2 rounded-xl border-2 ${
                      isDark 
                        ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    placeholder={`Default: ${formatCurrency(maxRefund)} (full refund)`}
                  />
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                  Leave empty for full refund. Maximum: {formatCurrency(maxRefund)}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className={`flex items-center gap-2 p-3 rounded-xl ${
                  isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-700'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                    isDark 
                      ? 'bg-white/10 text-white hover:bg-white/20' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                    submitting || !reason
                      ? (isDark ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                      : isDark
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
