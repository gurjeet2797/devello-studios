import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, DollarSign, CheckCircle, Package, Mail, MessageSquare, Send, RefreshCw } from 'lucide-react';
import { useTheme } from './Layout';
import { getSupabase } from '../lib/supabaseClient';
import RefundRequestModal from './RefundRequestModal';

export default function ProductOrderDetailsModal({ isOpen, onClose, orderId }) {
  const { isDark } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [requestingUpdate, setRequestingUpdate] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/products/orders/${orderId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load order details' }));
        throw new Error(errorData.error || 'Failed to load order details');
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/products/orders/${orderId}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || 'Failed to send message');
      }

      setMessage('');
      await fetchOrderDetails();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRequestUpdate = async () => {
    try {
      setRequestingUpdate(true);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/products/orders/${orderId}/request-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to request update' }));
        throw new Error(errorData.error || 'Failed to request update');
      }

      await fetchOrderDetails();
    } catch (err) {
      console.error('Error requesting update:', err);
      setError(err.message);
    } finally {
      setRequestingUpdate(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const payment = order?.payments?.[0];
  const canRequestRefund = payment?.status === 'succeeded' && 
    !order?.refundRequests?.some(r => r.status === 'pending' || r.status === 'approved');
  const pendingRefund = order?.refundRequests?.find(r => r.status === 'pending');

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20">
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
            className={`about-devello-glass rounded-3xl border-2 relative z-10 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 sm:p-6 border-b-2 flex-shrink-0 ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}>
              <div>
                <h2 className={`text-xl sm:text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Order Details
                </h2>
                <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {order?.order_number ? `Order #${order.order_number}` : 'Loading...'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchOrderDetails}
                  className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                    isDark ? 'text-white/70' : 'text-gray-600'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Loading order details...</p>
                </div>
              ) : error ? (
                <div className={`text-center py-12 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  <p>{error}</p>
                </div>
              ) : order ? (
                <div className="space-y-4">
                  {/* Order Info */}
                  <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Order Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Product</p>
                        <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{order.product?.name || 'Product'}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Amount</p>
                        <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.amount)}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'delivered' 
                            ? (isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                            : order.status === 'processing'
                            ? (isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')
                            : (isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Payment Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.payment_status === 'succeeded'
                            ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')
                            : (isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700')
                        }`}>
                          {order.payment_status === 'succeeded' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Refund Request Section */}
                  {payment && (
                    <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Refund Requests
                        </h3>
                        {canRequestRefund && (
                          <button
                            onClick={() => setShowRefundModal(true)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              isDark
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                : 'bg-emerald-500 text-white hover:bg-emerald-600'
                            }`}
                          >
                            Request Refund
                          </button>
                        )}
                      </div>
                      {pendingRefund ? (
                        <div className={`p-3 rounded-xl ${
                          isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          <p className="text-sm font-medium">Refund request pending</p>
                          <p className="text-xs mt-1">Reason: {pendingRefund.reason}</p>
                          {pendingRefund.description && (
                            <p className="text-xs mt-1">{pendingRefund.description}</p>
                          )}
                          <p className="text-xs mt-1">Amount: {formatCurrency(pendingRefund.requested_amount)}</p>
                        </div>
                      ) : order.refundRequests && order.refundRequests.length > 0 ? (
                        <div className="space-y-2">
                          {order.refundRequests.map((refund) => (
                            <div key={refund.id} className={`p-3 rounded-xl ${
                              refund.status === 'approved' || refund.status === 'processed'
                                ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-50 text-green-700')
                                : refund.status === 'rejected'
                                ? (isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-50 text-red-700')
                                : (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-50 text-gray-700')
                            }`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-medium">{refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}</p>
                                  <p className="text-xs mt-1">{refund.reason}</p>
                                </div>
                                <span className="text-xs">{formatCurrency(refund.requested_amount)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          No refund requests
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order Updates/History */}
                  {order.orderUpdates && order.orderUpdates.length > 0 && (
                    <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                    }`}>
                      <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Order Updates
                      </h3>
                      <div className="space-y-3">
                        {order.orderUpdates.map((update) => (
                          <div key={update.id} className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              update.update_type === 'status' 
                                ? (isDark ? 'bg-blue-400' : 'bg-blue-500')
                                : update.update_type === 'refund'
                                ? (isDark ? 'bg-orange-400' : 'bg-orange-500')
                                : (isDark ? 'bg-emerald-400' : 'bg-emerald-500')
                            }`} />
                            <div className="flex-1">
                              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {update.message || `${update.update_type} update`}
                              </p>
                              <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                {formatDate(update.created_at)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Update & Messaging Section */}
                  <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Communication
                    </h3>
                    <div className="space-y-3">
                      {/* Request Update Button */}
                      <button
                        onClick={handleRequestUpdate}
                        disabled={requestingUpdate}
                        className={`w-full px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                          requestingUpdate
                            ? (isDark ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                            : isDark
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {requestingUpdate ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            Request Update
                          </>
                        )}
                      </button>
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-300'}`}></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className={`px-2 ${isDark ? 'bg-white/5 text-white/50' : 'bg-white/40 text-gray-500'}`}>
                            Or send a message
                          </span>
                        </div>
                      </div>

                      {/* Send Message */}
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message to admin here..."
                        rows={3}
                        className={`w-full px-4 py-2 rounded-xl border-2 ${
                          isDark 
                            ? 'bg-white/5 border-white/10 text-white focus:border-emerald-500/50' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
                        } focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none`}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendingMessage}
                        className={`w-full px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                          sendingMessage || !message.trim()
                            ? (isDark ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                            : isDark
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {sendingMessage ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Refund Request Modal */}
      {showRefundModal && order && (
        <RefundRequestModal
          isOpen={showRefundModal}
          onClose={() => setShowRefundModal(false)}
          order={order}
          onSuccess={() => {
            fetchOrderDetails();
            setShowRefundModal(false);
          }}
        />
      )}
    </>
  );
}
