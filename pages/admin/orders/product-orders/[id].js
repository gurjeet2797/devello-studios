import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import AdminLayout from '../../../../components/admin/AdminLayout';
import { useTheme } from '../../../../components/Layout';
import { getSupabase } from '../../../../lib/supabaseClient';
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
  Truck,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';

export default function ProductOrderDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isDark } = useTheme();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const supabase = getSupabase();

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id]);

  const fetchOrder = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('[PRODUCT_ORDER_DETAIL] No access token available');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('[PRODUCT_ORDER_DETAIL] Fetching order:', id);

      const response = await fetch(`/api/admin/orders/product-orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[PRODUCT_ORDER_DETAIL] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[PRODUCT_ORDER_DETAIL] Received data:', {
          hasOrder: !!data.order,
          orderId: data.order?.id,
          orderNumber: data.order?.order_number
        });
        setOrder(data.order);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[PRODUCT_ORDER_DETAIL] API error:', {
          status: response.status,
          error: errorData
        });
        setError(errorData.error || `Failed to load order (${response.status})`);
      }
    } catch (error) {
      console.error('[PRODUCT_ORDER_DETAIL] Error fetching order:', {
        error: error.message,
        stack: error.stack
      });
      setError(`Network error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !order) return;

    try {
      setSendingMessage(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`/api/admin/orders/product-orders/${id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (response.ok) {
        setMessage('');
        fetchOrder(); // Refresh order to get new messages
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusUpdate = async (status, statusLabel) => {
    if (!order) return;

    try {
      setUpdatingStatus(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        return;
      }

      const updateResponse = await fetch(`/api/admin/orders/product-orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, message: `Order status updated to: ${statusLabel}` }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      await fetchOrder();
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
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
      pending: isDark ? 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' : 'text-yellow-700 bg-yellow-100 border-yellow-300',
      processing: isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/30' : 'text-blue-700 bg-blue-100 border-blue-300',
      shipped: isDark ? 'text-purple-300 bg-purple-500/20 border-purple-500/30' : 'text-purple-700 bg-purple-100 border-purple-300',
      delivered: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300',
      completed: isDark ? 'text-green-300 bg-green-500/20 border-green-500/30' : 'text-green-700 bg-green-100 border-green-300',
      cancelled: isDark ? 'text-gray-300 bg-gray-500/20 border-gray-500/30' : 'text-gray-700 bg-gray-100 border-gray-300'
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      processing: 'Under Fabrication',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
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

  if (error || !order) {
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

  const orderItems = order.order_items ? (typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items) : [];
  const shippingAddress = order.shipping_address ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) : null;

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
              Order #{order.order_number}
            </h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
              {order.product?.name || 'Product Order'}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Top Section: Order Updates & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Updates & Communication - Top Left */}
          <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <MessageSquare className="w-5 h-5" />
              Order Updates & Communication
            </h2>
            {order.orderUpdates && order.orderUpdates.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {order.orderUpdates.map((update) => (
                  <div key={update.id} className="flex items-start gap-3 pb-4 border-b border-white/10 last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      update.update_type === 'status' ? 'bg-blue-500' :
                      update.update_type === 'message' ? 'bg-green-500' :
                      update.update_type === 'shipping' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          update.update_type === 'status' ? (isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700') :
                          update.update_type === 'message' ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') :
                          update.update_type === 'shipping' ? (isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700') :
                          (isDark ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-700')
                        }`}>
                          {update.update_type}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          {formatDate(update.created_at)}
                        </span>
                      </div>
                      {update.message && (
                        <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                          {update.message}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        Updated by: {update.updated_by === 'admin' ? 'Admin' : 'Customer'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>No updates yet</p>
            )}
          </div>

          {/* Quick Actions - Top Right */}
          <div className="space-y-6">
            {/* Quick Status Updates */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quick Status Updates
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => handleStatusUpdate('processing', 'Under Fabrication')}
                  disabled={updatingStatus || order.status === 'processing'}
                  whileHover={{ scale: updatingStatus ? 1 : 1.02 }}
                  whileTap={{ scale: updatingStatus ? 1 : 0.98 }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    updatingStatus || order.status === 'processing'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  } ${
                    isDark
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50 hover:bg-blue-500/40'
                      : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                  }`}
                >
                  {updatingStatus ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  Under Fabrication
                </motion.button>
                <motion.button
                  onClick={() => handleStatusUpdate('shipped', 'Shipped')}
                  disabled={updatingStatus || order.status === 'shipped'}
                  whileHover={{ scale: updatingStatus ? 1 : 1.02 }}
                  whileTap={{ scale: updatingStatus ? 1 : 0.98 }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    updatingStatus || order.status === 'shipped'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  } ${
                    isDark
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50 hover:bg-purple-500/40'
                      : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                  }`}
                >
                  {updatingStatus ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  Shipped
                </motion.button>
                <motion.button
                  onClick={() => handleStatusUpdate('delivered', 'Delivered')}
                  disabled={updatingStatus || order.status === 'delivered'}
                  whileHover={{ scale: updatingStatus ? 1 : 1.02 }}
                  whileTap={{ scale: updatingStatus ? 1 : 0.98 }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    updatingStatus || order.status === 'delivered'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  } ${
                    isDark
                      ? 'bg-green-500/30 text-green-300 border border-green-500/50 hover:bg-green-500/40'
                      : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                  }`}
                >
                  {updatingStatus ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Delivered
                </motion.button>
                <motion.button
                  onClick={() => handleStatusUpdate('delivered', 'Delivered')}
                  disabled={updatingStatus || order.status === 'delivered'}
                  whileHover={{ scale: updatingStatus ? 1 : 1.02 }}
                  whileTap={{ scale: updatingStatus ? 1 : 0.98 }}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    updatingStatus || order.status === 'delivered'
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  } ${
                    isDark
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                  }`}
                >
                  {updatingStatus ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Fulfilled
                </motion.button>
              </div>
            </div>

            {/* Send Message */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <Send className="w-5 h-5" />
                Send Message to Customer
              </h2>
              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder-white/40'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendingMessage}
                  className={`w-full px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    !message.trim() || sendingMessage
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  } ${
                    isDark
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                      : 'bg-emerald-500 text-white border border-emerald-600'
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
                    <a href={`mailto:${order.user?.email || order.guest_email}`} className={`text-sm ${isDark ? 'text-white hover:text-emerald-300' : 'text-gray-900 hover:text-emerald-600'}`}>
                      {order.user?.email || order.guest_email}
                    </a>
                  </div>
                </div>
                {order.user?.profile && (
                  <div className="flex items-center gap-3">
                    <Package className={`w-5 h-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Name</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.user.profile.first_name} {order.user.profile.last_name}
                      </p>
                    </div>
                  </div>
                )}
                {shippingAddress && (
                  <div className="flex items-start gap-3 pt-3 border-t border-white/10">
                    <MapPin className={`w-5 h-5 mt-0.5 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Shipping Address</p>
                      {shippingAddress.title && (
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {shippingAddress.title}
                        </p>
                      )}
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {shippingAddress.address_line1}
                        {shippingAddress.address_line2 && `, ${shippingAddress.address_line2}`}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}
                      </p>
                      {shippingAddress.country && (
                        <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {shippingAddress.country}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Items
              </h2>
              <div className="space-y-4">
                {orderItems.length > 0 ? (
                  orderItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-white/10 last:border-0">
                      {item.productImage && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.productImage}
                            alt={item.productName || 'Product'}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.productName || 'Product'}
                        </p>
                        {item.variantName && (
                          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            Variant: {item.variantName}
                          </p>
                        )}
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Quantity: {item.quantity || 1}
                        </p>
                        {(item.height || item.width) && (
                          <div className={`mt-2 px-3 py-1.5 rounded-lg inline-block ${isDark ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'}`}>
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Dimensions: {item.height ? `${item.height}"` : ''} {item.height && item.width ? '×' : ''} {item.width ? `${item.width}"` : ''} {item.height || item.width ? '(H × W)' : ''}
                            </p>
                          </div>
                        )}
                        <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency((item.price || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : order.product ? (
                  <div className="flex items-start gap-4">
                    {order.product.image_url && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={order.product.image_url}
                          alt={order.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.product.name}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {order.product.description}
                      </p>
                      {(order.height || order.width) && (
                        <div className={`mt-2 px-3 py-1.5 rounded-lg inline-block ${isDark ? 'bg-white/10 border border-white/20' : 'bg-gray-100 border border-gray-200'}`}>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Dimensions: {order.height ? `${order.height}"` : ''} {order.height && order.width ? '×' : ''} {order.width ? `${order.width}"` : ''} {order.height || order.width ? '(H × W)' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={isDark ? 'text-white/70' : 'text-gray-600'}>No items found</p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
              <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="space-y-2">
                  {shippingAddress.title && (
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {shippingAddress.title}
                    </p>
                  )}
                  <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                    {shippingAddress.address_line1}
                    {shippingAddress.address_line2 && `, ${shippingAddress.address_line2}`}
                  </p>
                  <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}
                  </p>
                  {shippingAddress.country && (
                    <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                      {shippingAddress.country}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Summary
              </h2>
              <div className="space-y-3">
                {(order.height || order.width) && (
                  <div className="pb-3 border-b border-white/10">
                    <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Dimensions</span>
                    <p className={`text-base font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {order.height ? `${order.height}"` : ''} {order.height && order.width ? '×' : ''} {order.width ? `${order.width}"` : ''} {order.height || order.width ? '(H × W)' : ''}
                    </p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Amount</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(order.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-white/70' : 'text-gray-600'}>Payment Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    order.payment_status === 'paid' || order.payment_status === 'succeeded'
                      ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')
                      : (isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                  }`}>
                    {order.payment_status === 'paid' || order.payment_status === 'succeeded' ? 'Paid' : order.payment_status}
                  </span>
                </div>
                {order.purchased_at && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-gray-500'}`} />
                    <div>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Purchased</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(order.purchased_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Info */}
            {order.tracking_number && (
              <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Truck className="w-5 h-5" />
                  Shipping
                </h2>
                <div className="space-y-2">
                  {order.tracking_number && (
                    <div>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Tracking Number</p>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.tracking_number}
                      </p>
                    </div>
                  )}
                  {order.carrier && (
                    <div>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Carrier</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.carrier}
                      </p>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div>
                      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Shipped</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(order.shipped_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Refund Requests */}
            {order.refundRequests && order.refundRequests.length > 0 && (
              <div className={`about-devello-glass rounded-xl p-6 border-2 ${isDark ? 'border-white/10' : 'border-white/30'}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Refund Requests
                </h2>
                <div className="space-y-3">
                  {order.refundRequests.map((refund) => (
                    <div key={refund.id} className="p-3 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          refund.status === 'approved' ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700') :
                          refund.status === 'rejected' ? (isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700') :
                          (isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700')
                        }`}>
                          {refund.status}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          {formatCurrency(refund.amount)}
                        </span>
                      </div>
                      {refund.reason && (
                        <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {refund.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
