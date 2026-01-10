import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, DollarSign, CheckCircle, Package, Mail, Phone, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { useTheme } from './Layout';
import { getSupabase } from '../lib/supabaseClient';

export default function OrderDetailsModal({ isOpen, onClose, orderId }) {
  const { isDark } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingUpdate, setRequestingUpdate] = useState(false);
  const supabase = getSupabase();

  // Disable scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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

      const response = await fetch(`/api/orders/custom-builds/${orderId}/details`, {
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
      setOrder(data.request);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${month} ${day}, ${year} at ${time}`;
  };

  if (!isOpen) return null;

  return (
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
          layoutId={`order-card-${orderId}`}
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1
          }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ 
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.8
          }}
          className={`about-devello-glass rounded-3xl border-2 relative z-10 w-full max-w-4xl max-h-[75vh] overflow-hidden flex flex-col ${
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
                {order?.project_type || 'Custom Order'}
              </p>
            </div>
            <div className="relative">
              {/* Glass backdrop circle */}
              <div 
                className={`absolute inset-0 rounded-full ${
                  isDark ? 'bg-white/10' : 'bg-white/30'
                }`}
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  width: '40px',
                  height: '40px',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 0
                }}
              />
              <button
                onClick={onClose}
                className={`relative z-10 p-2 rounded-full hover:bg-white/10 transition-colors ${
                  isDark ? 'text-white/70' : 'text-gray-600'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? null : error ? (
              <div className={`text-center py-12 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                <p>{error}</p>
              </div>
            ) : order ? (
              <div className="space-y-4">
                {/* Project Details and Timeline - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Project Details */}
                  <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Project Details
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Project Type</p>
                        <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{order.project_type}</p>
                      </div>
                      {order.project_description && (
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Description</p>
                          <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{order.project_description}</p>
                        </div>
                      )}
                      {order.material && (
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Material</p>
                          <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{order.material}</p>
                        </div>
                      )}
                      {(order.size || order.custom_size) && (
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Size</p>
                          <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{order.size || order.custom_size}</p>
                        </div>
                      )}
                      {order.additional_info && (
                        <div>
                          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Additional Information</p>
                          <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{order.additional_info}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Timeline */}
                  <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Order Timeline
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                        <div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Received</p>
                          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      {order.quoted_at && (
                        <div className="flex items-start gap-3">
                          <DollarSign className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                          <div>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quote Sent</p>
                            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                              {formatDate(order.quoted_at)}
                            </p>
                            {order.quoted_price && (
                              <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                {formatCurrency(order.quoted_price)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {order.productOrder && (
                        <>
                          <div className="flex items-start gap-3">
                            <CheckCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                            <div>
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Created</p>
                              <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                Order #{order.productOrder.order_number}
                              </p>
                              {order.productOrder.purchased_at && (
                                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                  {formatDate(order.productOrder.purchased_at)}
                                </p>
                              )}
                            </div>
                          </div>
                          {order.productOrder.delivered_at && (
                            <div className="flex items-start gap-3">
                              <Package className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                              <div>
                                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Delivered</p>
                                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                  {formatDate(order.productOrder.delivered_at)}
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Images and Quotes - 2x2 Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Images - Left Column */}
                  {(order.preview_image || order.uploaded_image || order.annotated_image || order.space_rendered_image) && (
                    <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                      isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                    }`}>
                      <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Images
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        {order.preview_image && (
                          <div>
                            <div className="rounded-xl overflow-hidden bg-white/5">
                              <img 
                                src={order.preview_image} 
                                alt="Preview" 
                                className="w-full h-48 sm:h-64 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          </div>
                        )}
                        {order.uploaded_image && (
                          <div>
                            <p className={`text-xs sm:text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Uploaded Image</p>
                            <div className="rounded-xl overflow-hidden bg-white/5">
                              <img 
                                src={order.uploaded_image} 
                                alt="Uploaded" 
                                className="w-full h-48 sm:h-64 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          </div>
                        )}
                        {order.annotated_image && (
                          <div>
                            <p className={`text-xs sm:text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Annotated Image</p>
                            <div className="rounded-xl overflow-hidden bg-white/5">
                              <img 
                                src={order.annotated_image} 
                                alt="Annotated" 
                                className="w-full h-48 sm:h-64 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          </div>
                        )}
                        {order.space_rendered_image && (
                          <div>
                            <p className={`text-xs sm:text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Space Rendered</p>
                            <div className="rounded-xl overflow-hidden bg-white/5">
                              <img 
                                src={order.space_rendered_image} 
                                alt="Space Rendered" 
                                className="w-full h-48 sm:h-64 object-contain"
                                loading="lazy"
                                decoding="async"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quotes & Updates - Right Column */}
                  <div className={`rounded-2xl p-4 sm:p-6 border-2 ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-white/30 bg-white/40'
                  }`}>
                    <h3 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Quotes & Updates
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {order.quotes && order.quotes.length > 0 ? (
                        order.quotes.map((quote, index) => {
                          const isPaid = order.productOrder && order.productOrder.payment_status === 'succeeded';
                          const isProcessing = order.productOrder && order.productOrder.status === 'processing';
                          
                          return (
                            <div key={quote.id} className={`p-3 sm:p-4 rounded-xl ${
                              isDark ? 'bg-white/5' : 'bg-white/40'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex-1">
                                  <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Quote #{index + 1}
                                  </p>
                                  <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(quote.amount)}
                                  </p>
                                  {quote.admin_notes && (
                                    <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                      {quote.admin_notes}
                                    </p>
                                  )}
                                  {isPaid && (
                                    <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-green-300' : 'text-green-600'}`}>
                                      ✓ Payment Successful
                                    </p>
                                  )}
                                  {isProcessing && (
                                    <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                                      Order Processing
                                    </p>
                                  )}
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                                    {formatDate(quote.created_at)}
                                  </p>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium mt-2 inline-block ${
                                    quote.status === 'pending' 
                                      ? (isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                                      : quote.status === 'approved'
                                      ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')
                                      : (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                                  }`}>
                                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-white/40'}`}>
                          <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            No quotes or updates yet
                          </p>
                          <motion.button
                            onClick={async () => {
                              if (requestingUpdate) return;
                              setRequestingUpdate(true);
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                const token = session?.access_token;

                                if (!token) {
                                  setError('Authentication required');
                                  return;
                                }

                                const response = await fetch(`/api/orders/custom-builds/${orderId}/request-update`, {
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

                                // Refresh order details
                                await fetchOrderDetails();
                                alert('Update request sent to admin');
                              } catch (err) {
                                console.error('Error requesting update:', err);
                                alert(err.message || 'Failed to request update');
                              } finally {
                                setRequestingUpdate(false);
                              }
                            }}
                            disabled={requestingUpdate}
                            whileHover={{ scale: requestingUpdate ? 1 : 1.02 }}
                            whileTap={{ scale: requestingUpdate ? 1 : 0.98 }}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                              requestingUpdate
                                ? (isDark ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                                : isDark 
                                ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30' 
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                            }`}
                          >
                            {requestingUpdate ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-4 h-4" />
                                Request Update
                              </>
                            )}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

