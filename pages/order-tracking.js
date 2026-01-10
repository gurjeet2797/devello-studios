import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useTheme } from '../components/Layout';
import { useModal } from '../components/ModalProvider';
import { 
  Package, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock,
  MapPin,
  Calendar,
  Mail,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

export default function OrderTracking() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { openAuthModal } = useModal();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Pre-fill from query params
  useEffect(() => {
    if (router.isReady) {
      const { orderNumber: orderNumberParam, order_number, email: emailParam } = router.query;
      const orderNum = orderNumberParam || order_number;
      if (orderNum) setOrderNumber(String(orderNum));
      if (emailParam) setEmail(decodeURIComponent(String(emailParam)));
      
      // Auto-search if both are provided
      if (orderNum && emailParam) {
        // Use setTimeout to ensure state is set before searching
        setTimeout(() => {
          handleSearch();
        }, 100);
      }
    }
  }, [router.isReady, router.query]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    const orderNum = orderNumber.trim();
    const emailVal = email.trim();
    
    if (!orderNum || !emailVal) {
      setError('Please enter both order number and email');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/products/orders/track?order_number=${encodeURIComponent(orderNumber.trim())}&email=${encodeURIComponent(email.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to track order');
      }

      if (data.success && data.order) {
        setOrder(data.order);
        setError(null);
      } else {
        throw new Error('Order not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to track order. Please verify your order number and email.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'usd') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
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
      awaiting_payment: isDark ? 'text-orange-300 bg-orange-500/20 border-orange-500/30' : 'text-orange-700 bg-orange-100 border-orange-300',
      paid: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300',
      processing: isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/30' : 'text-blue-700 bg-blue-100 border-blue-300',
      shipped: isDark ? 'text-purple-300 bg-purple-500/20 border-purple-500/30' : 'text-purple-700 bg-purple-100 border-purple-300',
      delivered: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300',
      failed_payment: isDark ? 'text-red-300 bg-red-500/20 border-red-500/30' : 'text-red-700 bg-red-100 border-red-300',
      cancelled: isDark ? 'text-red-300 bg-red-500/20 border-red-500/30' : 'text-red-700 bg-red-100 border-red-300',
      completed: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300'
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      awaiting_payment: 'Awaiting Payment',
      paid: 'Paid',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      failed_payment: 'Payment Failed',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return CheckCircle;
      case 'awaiting_payment':
      case 'failed_payment':
        return AlertCircle;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const buildTimeline = () => {
    if (!order) return [];

    if (order.statusEvents?.length) {
      return order.statusEvents
        .map((event) => ({
          date: event.created_at,
          label: getStatusLabel(event.to_status) || event.to_status,
          icon: getStatusIcon(event.to_status),
          completed: true,
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    const timeline = [];
    
    if (order.created_at) {
      timeline.push({
        date: order.created_at,
        label: 'Order Placed',
        icon: Package,
        completed: true
      });
    }
    
    if (order.purchased_at) {
      timeline.push({
        date: order.purchased_at,
        label: 'Payment Confirmed',
        icon: CheckCircle,
        completed: true
      });
    }
    
    if (order.estimated_ship_date) {
      timeline.push({
        date: order.estimated_ship_date,
        label: 'Estimated Ship Date',
        icon: Calendar,
        completed: order.shipped_at ? true : false
      });
    }
    
    if (order.shipped_at) {
      timeline.push({
        date: order.shipped_at,
        label: 'Shipped',
        icon: Truck,
        completed: true
      });
    }
    
    if (order.delivered_at) {
      timeline.push({
        date: order.delivered_at,
        label: 'Delivered',
        icon: CheckCircle,
        completed: true
      });
    }
    
    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  return (
    <div className={`min-h-screen py-12 px-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Track Your Order
          </h1>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Enter your order number and email to track your order status
          </p>
        </div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`about-devello-glass rounded-2xl p-6 border-2 mb-6 ${
            isDark ? 'border-white/10' : 'border-white/30'
          }`}
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Order Number
                </label>
                <div className="relative">
                  <Package className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-white/40' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Order #"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                      isDark
                        ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                        : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDark ? 'text-white/40' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-lg ${
                      isDark
                        ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                        : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Track Order'}
            </motion.button>
          </form>
        </motion.div>

        {/* Error Message */}
        {error && searched && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-4 border-2 mb-6 ${
              isDark 
                ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          </motion.div>
        )}

        {/* Order Details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <div className={`about-devello-glass rounded-2xl p-6 border-2 ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Order #{order.order_number}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {order.product?.name || 'Product Order'}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Timeline */}
              {buildTimeline().length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Order Timeline
                  </h3>
                  <div className="space-y-3">
                    {buildTimeline().map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            item.completed
                              ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                              : isDark ? 'bg-white/5 text-white/40' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.label}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Tracking Information */}
            {order.tracking_number && (
              <div className={`about-devello-glass rounded-2xl p-6 border-2 ${
                isDark ? 'border-white/10' : 'border-white/30'
              }`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  <Truck className="w-5 h-5" />
                  Shipping Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Tracking Number:
                    </span>
                    <p className={`text-lg font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {order.tracking_number}
                    </p>
                  </div>
                  {order.carrier && (
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        Carrier:
                      </span>
                      <p className={`text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {order.carrier}
                      </p>
                    </div>
                  )}
                  {order.shipped_at && (
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        Shipped On:
                      </span>
                      <p className={`text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(order.shipped_at)}
                      </p>
                    </div>
                  )}
                  {order.estimated_ship_date && !order.delivered_at && (
                    <div>
                      <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        Estimated Delivery:
                      </span>
                      <p className={`text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(order.estimated_ship_date)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className={`about-devello-glass rounded-2xl p-6 border-2 ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}>
              <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Order Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Order Amount:
                  </span>
                  <p className={`text-lg font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(order.amount, order.currency)}
                  </p>
                </div>
                <div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Payment Status:
                  </span>
                  <p className={`text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </p>
                </div>
                <div>
                  <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Order Date:
                  </span>
                  <p className={`text-lg mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(order.created_at)}
                  </p>
                </div>
                {order.shipping_address && (
                  <div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Shipping Address:
                    </span>
                    <div className={`text-sm mt-1 space-y-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {(() => {
                        let addr;
                        if (typeof order.shipping_address === 'string') {
                          try {
                            addr = JSON.parse(order.shipping_address);
                          } catch {
                            return <p>{order.shipping_address}</p>;
                          }
                        } else {
                          addr = order.shipping_address;
                        }
                        
                        if (!addr || (!addr.address_line1 && !addr.address && !addr.city)) {
                          return <p>No address provided</p>;
                        }
                        
                        return (
                          <>
                            {addr.title && <p className="font-medium">{addr.title}</p>}
                            <p>
                              {addr.address_line1 || addr.address}
                              {addr.address_line2 && `, ${addr.address_line2}`}
                            </p>
                            <p>
                              {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip_code || addr.zip || ''}
                            </p>
                            {addr.country && addr.country !== 'US' && <p>{addr.country}</p>}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Updates / Communication */}
            {order.orderUpdates && order.orderUpdates.length > 0 && (
              <div className={`about-devello-glass rounded-2xl p-6 border-2 ${
                isDark ? 'border-white/10' : 'border-white/30'
              }`}>
                <h3 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <MessageSquare className="w-5 h-5" />
                  Order Updates & Communication
                </h3>
                <div className="space-y-3">
                  {order.orderUpdates.map((update) => (
                    <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg border border-white/10">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        update.update_type === 'status' ? 'bg-blue-500' :
                        update.update_type === 'message' ? 'bg-green-500' :
                        update.update_type === 'shipping' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
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
                          {update.updated_by === 'admin' ? 'From Admin' : 'From You'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Notes */}
            {order.customer_notes && (
              <div className={`about-devello-glass rounded-2xl p-6 border-2 ${
                isDark ? 'border-white/10' : 'border-white/30'
              }`}>
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Notes
                </h3>
                <p className={`${isDark ? 'text-white/90' : 'text-gray-700'}`}>
                  {order.customer_notes}
                </p>
              </div>
            )}

            {/* Sign Up Link */}
            <div className={`about-devello-glass rounded-2xl p-6 border-2 text-center ${
              isDark ? 'border-white/10' : 'border-white/30'
            }`}>
              <p className={`mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Want to manage all your orders in one place?
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  openAuthModal('signup', {
                    initialEmail: email,
                    redirectPath: '/client-portal?view=product_orders'
                  });
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 ${
                  isDark
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/40'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                }`}
              >
                Create Account
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
