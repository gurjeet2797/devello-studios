import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useTheme } from '../../../components/Layout';
import { getSupabase } from '../../../lib/supabaseClient';
import QuoteModal from '../../../components/admin/QuoteModal';
import OrderStatusModal from '../../../components/admin/OrderStatusModal';
import RefuseOrderModal from '../../../components/admin/RefuseOrderModal';
import ConfirmDeleteModal from '../../../components/admin/ConfirmDeleteModal';
import { 
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Image as ImageIcon,
  MapPin,
  Trash2
} from 'lucide-react';

export default function OrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isDark } = useTheme();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('[ORDER_DETAIL] No access token available');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('[ORDER_DETAIL] Fetching order:', id);

      // Try orders endpoint first (for custom orders)
      let response = await fetch(`/api/admin/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[ORDER_DETAIL] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[ORDER_DETAIL] Received data:', {
          hasRequest: !!data.request,
          requestId: data.request?.id,
          projectType: data.request?.project_type
        });
        setRequest(data.request);
      } else if (response.status === 404) {
        // If not found, try product orders endpoint (for stock product orders)
        console.log('[ORDER_DETAIL] Not found in orders, trying product orders...');
        const productResponse = await fetch(`/api/admin/orders/product-orders/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (productResponse.ok) {
          const productData = await productResponse.json();
          // Redirect to product order detail page
          router.push(`/admin/orders/product-orders/${id}`);
          return;
        } else {
          const errorData = await productResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[ORDER_DETAIL] Product order API error:', {
            status: productResponse.status,
            error: errorData
          });
          setError(errorData.error || `Failed to load order (${productResponse.status})`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[ORDER_DETAIL] API error:', {
          status: response.status,
          error: errorData
        });
        setError(errorData.error || `Failed to load order (${response.status})`);
      }
    } catch (error) {
      console.error('[ORDER_DETAIL] Error fetching request:', {
        error: error.message,
        stack: error.stack
      });
      setError(`Network error: ${error.message}`);
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      received: isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/30' : 'text-blue-700 bg-blue-100 border-blue-300',
      quoted: isDark ? 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' : 'text-yellow-700 bg-yellow-100 border-yellow-300',
      approved: isDark ? 'text-green-300 bg-green-500/20 border-green-500/30' : 'text-green-700 bg-green-100 border-green-300',
      delivered: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300',
      rejected: isDark ? 'text-red-300 bg-red-500/20 border-red-500/30' : 'text-red-700 bg-red-100 border-red-300',
      cancelled: isDark ? 'text-gray-300 bg-gray-500/20 border-gray-500/30' : 'text-gray-700 bg-gray-100 border-gray-300'
    };
    return colors[status] || colors.received;
  };

  const getStatusLabel = (status) => {
    const labels = {
      received: 'Received',
      quoted: 'Quoted',
      approved: 'Approved',
      delivered: 'Delivered',
      rejected: 'Rejected',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <AdminLayout currentPage="orders">
        <div className="flex items-center justify-center py-12">
          <div className="loading"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !request) {
    return (
      <AdminLayout currentPage="orders">
        <div className="text-center py-12">
          <p className={`text-lg mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {error || 'Order not found'}
          </p>
          <button
            onClick={() => router.push('/admin/orders')}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-900'}`}
          >
            Back to Orders
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            onClick={() => router.push('/admin/orders')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`about-devello-glass p-2 rounded-full ${isDark ? 'text-white' : 'text-gray-900'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Order Details
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
              {request.project_type || 'Custom Product'}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
            {getStatusLabel(request.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Email</p>
                    <a href={`mailto:${request.email}`} className={`text-sm ${isDark ? 'text-white hover:text-emerald-300' : 'text-gray-900 hover:text-emerald-600'}`}>
                      {request.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Name</p>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{request.name}</p>
                  </div>
                </div>
                {request.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Phone</p>
                      <a href={`tel:${request.phone}`} className={`text-sm ${isDark ? 'text-white hover:text-emerald-300' : 'text-gray-900 hover:text-emerald-600'}`}>
                        {request.phone}
                      </a>
                    </div>
                  </div>
                )}
                {request.productOrder?.shipping_address && (
                  <div className="flex items-start gap-3 pt-3 border-t border-white/10">
                    <MapPin className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Shipping Address</p>
                      {(() => {
                        const shippingAddr = typeof request.productOrder.shipping_address === 'string' 
                          ? JSON.parse(request.productOrder.shipping_address)
                          : request.productOrder.shipping_address;
                        return (
                          <>
                            {shippingAddr.title && (
                              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {shippingAddr.title}
                              </p>
                            )}
                            <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {shippingAddr.address_line1}
                              {shippingAddr.address_line2 && `, ${shippingAddr.address_line2}`}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {shippingAddr.city}, {shippingAddr.state} {shippingAddr.zip_code}
                            </p>
                            {shippingAddr.country && (
                              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {shippingAddr.country}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Project Details */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Project Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className={`text-sm mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Project Type</p>
                  <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{request.project_type}</p>
                </div>
                {request.project_description && (
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Description</p>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{request.project_description}</p>
                  </div>
                )}
                {request.material && (
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Material</p>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{request.material}</p>
                  </div>
                )}
                {(request.size || request.custom_size) && (
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Size</p>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{request.size || request.custom_size}</p>
                  </div>
                )}
                {request.additional_info && (
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Additional Information</p>
                    <p className={`${isDark ? 'text-white' : 'text-gray-900'}`}>{request.additional_info}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            {(request.preview_image || request.uploaded_image || request.annotated_image) && (
              <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Images
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {request.preview_image && (
                    <div>
                      <p className={`text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>AI Preview</p>
                      <div className="rounded-lg overflow-hidden bg-white/5">
                        <img 
                          src={request.preview_image} 
                          alt="Preview" 
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  )}
                  {request.uploaded_image && (
                    <div>
                      <p className={`text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Uploaded Image</p>
                      <div className="rounded-lg overflow-hidden bg-white/5">
                        <img 
                          src={request.uploaded_image} 
                          alt="Uploaded" 
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  )}
                  {request.annotated_image && (
                    <div>
                      <p className={`text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Annotated Image</p>
                      <div className="rounded-lg overflow-hidden bg-white/5">
                        <img 
                          src={request.annotated_image} 
                          alt="Annotated" 
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  )}
                  {request.space_rendered_image && (
                    <div>
                      <p className={`text-sm mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Space Rendered</p>
                      <div className="rounded-lg overflow-hidden bg-white/5">
                        <img 
                          src={request.space_rendered_image} 
                          alt="Space Rendered" 
                          className="w-full h-48 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Section */}
            {(request.status === 'received' || request.status === 'quoted') && (
              <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Quote
                </h3>
                {request.quotes && request.quotes.length > 0 && request.quotes.some(q => q.status === 'pending') && (
                  <div className="mb-4 p-3 rounded-lg bg-white/5">
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Current Quote: {formatCurrency(request.quoted_price || request.quotes[0]?.amount)}
                    </p>
                  </div>
                )}
                <motion.button
                  onClick={() => setShowQuoteModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 rounded-full bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                >
                  {request.quotes && request.quotes.length > 0 && request.quotes.some(q => q.status === 'pending')
                    ? 'Update Quote'
                    : 'Send Quote'}
                </motion.button>
              </div>
            )}

            {/* Order Actions */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Actions
              </h3>
              <div className="space-y-2">
                <motion.button
                  onClick={() => setShowStatusModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Update
                </motion.button>
                {(request.status === 'received' || request.status === 'quoted') && (
                  <motion.button
                    onClick={() => setShowRefuseModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuse Order
                  </motion.button>
                )}
                {request.productOrder && request.productOrder.payment_status === 'succeeded' && (
                  <>
                    <motion.button
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const token = session?.access_token;
                          await fetch(`/api/admin/orders/${id}/status`, {
                            method: 'PATCH',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ action: 'mark_ready' })
                          });
                          fetchRequest();
                        } catch (error) {
                          console.error('Error marking order ready:', error);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-4 py-2 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Order is Ready
                    </motion.button>
                    <motion.button
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          const token = session?.access_token;
                          await fetch(`/api/admin/orders/${id}/status`, {
                            method: 'PATCH',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ action: 'cancel' })
                          });
                          fetchRequest();
                        } catch (error) {
                          console.error('Error cancelling order:', error);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-4 py-2 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Order
                    </motion.button>
                  </>
                )}
                <motion.button
                  onClick={() => setShowDeleteModal(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Order
                </motion.button>
              </div>
            </div>

            {/* Admin Updates */}
            {request.additional_info && (() => {
              // Parse admin updates from additional_info
              // Format: [ADMIN_UPDATE: timestamp]\nmessage
              const updatePattern = /\[ADMIN_UPDATE: ([^\]]+)\]\n([^\[]+?)(?=\n\n\[ADMIN_UPDATE:|$)/gs;
              const matches = [...request.additional_info.matchAll(updatePattern)];
              const updates = matches.map(match => {
                const timestamp = match[1];
                const message = match[2].trim();
                return { timestamp, message };
              }).reverse(); // Show newest first
              
              return updates.length > 0 ? (
                <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Admin Updates
                  </h3>
                  <div className="space-y-3">
                    {updates.map((update, index) => (
                      <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white/40'}`}>
                        <p className={`text-sm mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {update.message}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          {formatDate(update.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Order Timeline */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Received</p>
                    <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{formatDate(request.created_at)}</p>
                  </div>
                </div>
                {request.quoted_at && (
                  <div className="flex items-start gap-3">
                    <DollarSign className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Quote Sent</p>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{formatDate(request.quoted_at)}</p>
                      {request.quoted_price && (
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{formatCurrency(request.quoted_price)}</p>
                      )}
                    </div>
                  </div>
                )}
                {request.productOrder && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Order Created</p>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        Order #{request.productOrder.order_number}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQuoteModal && (
        <QuoteModal
          isOpen={showQuoteModal}
          onClose={() => {
            setShowQuoteModal(false);
            fetchRequest();
          }}
          requestId={id}
          request={request}
        />
      )}
      {showStatusModal && (
        <OrderStatusModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            fetchRequest();
          }}
          requestId={id}
          request={request}
        />
      )}
      {showRefuseModal && (
        <RefuseOrderModal
          isOpen={showRefuseModal}
          onClose={() => {
            setShowRefuseModal(false);
            fetchRequest();
          }}
          requestId={id}
          request={request}
        />
      )}
      {showDeleteModal && (
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleting(false);
          }}
          onConfirm={async () => {
            try {
              setDeleting(true);
              const { data: { session } } = await supabase.auth.getSession();
              const token = session?.access_token;

              if (!token) {
                setError('Authentication required');
                setDeleting(false);
                setShowDeleteModal(false);
                return;
              }

              const response = await fetch(`/api/admin/orders/${id}/delete`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                // Redirect to orders list after successful deletion
                router.push('/admin/orders');
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to delete order');
                setDeleting(false);
                setShowDeleteModal(false);
              }
            } catch (error) {
              console.error('Error deleting order:', error);
              setError(`Failed to delete order: ${error.message}`);
              setDeleting(false);
              setShowDeleteModal(false);
            }
          }}
          title="Delete Order"
          message="Are you sure you want to permanently delete this order? This action cannot be undone and the customer will be notified via email."
          loading={deleting}
        />
      )}
    </AdminLayout>
  );
}
