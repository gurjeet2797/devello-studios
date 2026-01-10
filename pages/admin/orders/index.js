import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import AdminLayout from '../../../components/admin/AdminLayout';
import { useTheme } from '../../../components/Layout';
import { getSupabase } from '../../../lib/supabaseClient';
import { 
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  Filter,
  Search,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  XCircle,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

// Format currency helper
const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function OrderManagementDashboard() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  // Removed unused state variables - cancelled orders are automatically filtered out
  const supabase = getSupabase();

  useEffect(() => {
    fetchRequests();
  }, []);

  /**
   * Extract the actual status from an order object
   * Handles both custom orders and stock product orders
   */
  const extractOrderStatus = (order) => {
    // For stock product orders, status is directly on the order
    if (order.order_type === 'stock_product') {
      return order.status || 'pending';
    }
    
    // For custom orders, check multiple possible locations
    // Custom orders might have status on the request itself
    if (order.status) {
      return order.status;
    }
    
    // Or nested in productOrder relation
    if (order.productOrder?.status) {
      return order.productOrder.status;
    }
    
    // Default fallback
    return 'pending';
  };

  /**
   * Get a valid session token, refreshing if necessary
   * @returns {Promise<{token: string, error?: string}>}
   */
  const getValidToken = async () => {
    try {
      // Get current session
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If we have a session, check if token is about to expire (within 5 minutes)
      if (session?.access_token && session.expires_at) {
        const expiresAt = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        const fiveMinutes = 5 * 60 * 1000;
        
        // Proactively refresh if token expires within 5 minutes
        if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
          console.log('[ADMIN] Token expiring soon, proactively refreshing...', {
            expiresIn: `${Math.round(timeUntilExpiry / 1000)}s`
          });
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[ADMIN] Proactive refresh failed:', refreshError);
            // Continue with current session if refresh fails
          } else if (refreshedSession?.access_token) {
            session = refreshedSession;
            console.log('[ADMIN] Token refreshed successfully');
          }
        }
      }
      
      // If no session or session error, try to refresh
      if (!session || sessionError) {
        console.log('[ADMIN] No session or session error, attempting refresh...', {
          hasSession: !!session,
          error: sessionError?.message
        });
        
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          console.error('[ADMIN] Failed to refresh session:', {
            error: refreshError?.message,
            code: refreshError?.code,
            hasRefreshedSession: !!refreshedSession
          });
          return { 
            token: null, 
            error: refreshError?.message || 'Session expired. Please log in again.' 
          };
        }
        
        session = refreshedSession;
      }

      const token = session?.access_token;
      
      if (!token) {
        console.error('[ADMIN] No access token in session:', {
          hasSession: !!session,
          hasAccessToken: !!session?.access_token,
          expiresAt: session?.expires_at
        });
        return { 
          token: null, 
          error: 'No authentication token available. Please log in again.' 
        };
      }
      
      // Validate token format (basic check)
      if (token.length < 10) {
        console.error('[ADMIN] Token appears to be invalid (too short):', {
          tokenLength: token.length
        });
        return { 
          token: null, 
          error: 'Invalid authentication token format.' 
        };
      }
      
      return { token };
    } catch (error) {
      console.error('[ADMIN] Error getting valid token:', error);
      return { 
        token: null, 
        error: `Authentication error: ${error.message}` 
      };
    }
  };

  const fetchRequests = async (retry = false) => {
    try {
      setError(null);
      
      // Get a valid token (with proactive refresh if needed)
      const { token, error: tokenError } = await getValidToken();
      
      if (tokenError || !token) {
        setError(tokenError || 'Authentication failed. Please log in again.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();

      console.log('[ADMIN] Fetching store orders...', {
        hasToken: !!token,
        tokenLength: token.length
      });

      const response = await fetch(`/api/admin/orders/list?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token might be expired, try refreshing once
        if (!retry && retryCount < 1) {
          console.log('[ADMIN] Got 401, refreshing session and retrying...');
          
          const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[ADMIN] Refresh failed after 401:', refreshError);
            const errorData = await response.json().catch(() => ({ error: 'Unauthorized' }));
            setError(`Authentication failed: ${errorData.error || refreshError.message || 'Please log in again.'}`);
            setLoading(false);
            return;
          }
          
          if (newSession?.access_token) {
            console.log('[ADMIN] Session refreshed, retrying request...');
            setRetryCount(prev => prev + 1);
            return fetchRequests(true);
          }
        }
        
        // Get detailed error from response
        let errorMessage = 'Authentication failed. Please log in again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          console.error('[ADMIN] 401 error details:', errorData);
        } catch (parseError) {
          console.error('[ADMIN] Failed to parse 401 error response:', parseError);
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to load orders';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('[ADMIN] API error:', {
            status: response.status,
            error: errorData
          });
        } catch (parseError) {
          console.error('[ADMIN] Failed to parse error response:', parseError);
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Combine custom product requests and stock product orders
      // Ensure each order has proper structure and status
      const allOrders = [
        ...(data.requests || []).map(req => {
          // Ensure custom orders have order_type
          const order = { ...req, order_type: 'custom_order' };
          // Validate status exists
          if (!order.status && !order.productOrder?.status) {
            console.warn('[ADMIN] Custom order missing status:', order.id);
            order.status = 'pending';
          }
          return order;
        }),
        ...(data.productOrders || []).map(order => {
          // Ensure stock orders have order_type and status
          const stockOrder = { ...order, order_type: 'stock_product' };
          // Validate status exists
          if (!stockOrder.status) {
            console.warn('[ADMIN] Stock order missing status:', stockOrder.id);
            stockOrder.status = 'pending';
          }
          return stockOrder;
        })
      ].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.purchased_at || 0);
        const dateB = new Date(b.created_at || b.createdAt || b.purchased_at || 0);
        return dateB - dateA; // Newest first
      });
      
      // Log status distribution for debugging (using a local helper)
      const getStatusForLogging = (order) => {
        if (order.order_type === 'stock_product') {
          return order.status || 'pending';
        }
        return order.status || order.productOrder?.status || 'pending';
      };
      
      const statusCounts = {};
      allOrders.forEach(order => {
        const status = getStatusForLogging(order);
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      console.log('[ADMIN] Successfully fetched orders:', {
        total: allOrders.length,
        custom: data.requests?.length || 0,
        stock: data.productOrders?.length || 0,
        statusDistribution: statusCounts
      });
      
      // Batch state updates
      setRequests(allOrders);
      setError(null);
      setRetryCount(0); // Reset retry count on success
      // React 18+ batches these automatically, but keeping them together for clarity
    } catch (error) {
      console.error('[ADMIN] Error fetching requests:', {
        error: error.message,
        stack: error.stack
      });
      setError(`Network error: ${error.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setLoading(true);
    fetchRequests();
  };

  // Removed handleRemoveAllCancelled - cancelled orders are automatically filtered from the pipeline view

  const getStatusColor = (status) => {
    const colors = {
      // Custom product request statuses
      received: isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/30' : 'text-blue-700 bg-blue-100 border-blue-300',
      quoted: isDark ? 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' : 'text-yellow-700 bg-yellow-100 border-yellow-300',
      approved: isDark ? 'text-green-300 bg-green-500/20 border-green-500/30' : 'text-green-700 bg-green-100 border-green-300',
      rejected: isDark ? 'text-red-300 bg-red-500/20 border-red-500/30' : 'text-red-700 bg-red-100 border-red-300',
      cancelled: isDark ? 'text-gray-300 bg-gray-500/20 border-gray-500/30' : 'text-gray-700 bg-gray-100 border-gray-300',
      // Stock product order statuses
      pending: isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/30' : 'text-blue-700 bg-blue-100 border-blue-300',
      awaiting_payment: isDark ? 'text-yellow-300 bg-yellow-500/20 border-yellow-500/30' : 'text-yellow-700 bg-yellow-100 border-yellow-300',
      paid: isDark ? 'text-green-300 bg-green-500/20 border-green-500/30' : 'text-green-700 bg-green-100 border-green-300',
      processing: isDark ? 'text-purple-300 bg-purple-500/20 border-purple-500/30' : 'text-purple-700 bg-purple-100 border-purple-300',
      shipped: isDark ? 'text-orange-300 bg-orange-500/20 border-orange-500/30' : 'text-orange-700 bg-orange-100 border-orange-300',
      delivered: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300',
      completed: isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-700 bg-emerald-100 border-emerald-300',
      failed_payment: isDark ? 'text-red-300 bg-red-500/20 border-red-500/30' : 'text-red-700 bg-red-100 border-red-300',
      in_process: isDark ? 'text-purple-300 bg-purple-500/20 border-purple-500/30' : 'text-purple-700 bg-purple-100 border-purple-300',
      ready_to_ship: isDark ? 'text-orange-300 bg-orange-500/20 border-orange-500/30' : 'text-orange-700 bg-orange-100 border-orange-300'
    };
    return colors[status] || colors.received;
  };

  const getStatusLabel = (status) => {
    const labels = {
      // Custom product request statuses
      received: 'Received',
      quoted: 'Quoted',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      // Stock product order statuses
      pending: 'Pending',
      awaiting_payment: 'Awaiting Payment',
      paid: 'Paid',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      completed: 'Completed',
      failed_payment: 'Payment Failed',
      in_process: 'In Process',
      ready_to_ship: 'Ready to Ship'
    };
    return labels[status] || status;
  };

  /**
   * Categorize order into pipeline stage based on status
   * This is the core logic that determines which column an order appears in
   */
  const getPipelineStage = (order) => {
    const rawStatus = extractOrderStatus(order);
    
    // Normalize to string and lowercase for comparison
    const status = String(rawStatus || 'pending').toLowerCase().trim();
    
    // Debug logging for delivered orders appearing in wrong place
    if (status === 'delivered' || status === 'completed') {
      console.log('[ORDER_MANAGEMENT] Processing completed order:', {
        orderId: order.id,
        orderType: order.order_type,
        rawStatus,
        normalizedStatus: status,
        hasStatus: !!order.status,
        hasProductOrderStatus: !!order.productOrder?.status
      });
    }
    
    // STAGE 1: NEW ORDERS - Orders awaiting initial action
    // These are orders that need to be reviewed, quoted, or paid
    const newOrderStatuses = [
      'pending',
      'awaiting_payment',
      'failed_payment',
      'received',
      'quoted'
    ];
    
    if (newOrderStatuses.includes(status)) {
      return 'new_orders';
    }
    
    // STAGE 2: UNDER FABRICATION - Orders being manufactured/processed
    // These are orders actively being worked on
    const fabricationStatuses = [
      'processing',
      'paid',
      'approved',
      'in_process'
    ];
    
    if (fabricationStatuses.includes(status)) {
      return 'under_fabrication';
    }
    
    // STAGE 3: READY TO SHIP - Orders ready for shipping or in transit
    const shippingStatuses = [
      'shipped',
      'ready_to_ship'
    ];
    
    if (shippingStatuses.includes(status)) {
      return 'ready_to_ship';
    }
    
    // STAGE 4: DELIVERED & FULFILLED - Completed orders
    // These should NEVER appear in new orders
    const completedStatuses = [
      'delivered',
      'completed'
    ];
    
    if (completedStatuses.includes(status)) {
      return 'delivered';
    }
    
    // CANCELLED/REJECTED - Filter these out
    if (status === 'cancelled' || status === 'rejected') {
      return null;
    }
    
    // Unknown status - log warning and default to new orders for visibility
    console.warn('[ORDER_MANAGEMENT] Unknown status, defaulting to new_orders:', {
      orderId: order.id,
      orderType: order.order_type,
      rawStatus,
      normalizedStatus: status,
      fullOrder: {
        id: order.id,
        status: order.status,
        productOrderStatus: order.productOrder?.status,
        orderType: order.order_type
      }
    });
    
    return 'new_orders';
  };

  const filteredRequests = requests.filter(request => {
    // Extract status using the same function we use for categorization
    const status = extractOrderStatus(request);
    const normalizedStatus = String(status).toLowerCase().trim();
    
    // Always hide cancelled and rejected orders from pipeline view
    if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
      return false;
    }
    
    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const id = String(request.id || '').toLowerCase();
    const name = request.name?.toLowerCase() || request.user?.profile?.first_name?.toLowerCase() || '';
    const email = request.email?.toLowerCase() || request.user?.email?.toLowerCase() || '';
    const projectType = request.project_type?.toLowerCase() || request.product?.name?.toLowerCase() || '';
    // Search in numeric amounts (both raw and formatted)
    const amountStr = request.amount ? String(request.amount).toLowerCase() : '';
    const quotedPriceStr = request.quoted_price ? String(request.quoted_price).toLowerCase() : '';
    const amountFormatted = request.amount ? formatCurrency(request.amount).toLowerCase().replace(/[^0-9.]/g, '') : '';
    const quotedPriceFormatted = request.quoted_price ? formatCurrency(request.quoted_price).toLowerCase().replace(/[^0-9.]/g, '') : '';
    return id.includes(query) || name.includes(query) || email.includes(query) || projectType.includes(query) || 
           amountStr.includes(query) || quotedPriceStr.includes(query) || 
           amountFormatted.includes(query) || quotedPriceFormatted.includes(query);
  });

  // Group orders by pipeline stage with validation
  const pipelineStages = {
    new_orders: [],
    under_fabrication: [],
    ready_to_ship: [],
    delivered: []
  };

  filteredRequests.forEach(order => {
    const status = extractOrderStatus(order);
    const stage = getPipelineStage(order);
    
    // Validate that completed orders don't end up in new_orders
    const normalizedStatus = String(status).toLowerCase().trim();
    const isCompleted = ['delivered', 'completed'].includes(normalizedStatus);
    
    if (isCompleted && stage === 'new_orders') {
      console.error('[ORDER_MANAGEMENT] CRITICAL: Completed order in new_orders!', {
        orderId: order.id,
        status,
        normalizedStatus,
        stage,
        orderType: order.order_type,
        fullOrder: {
          id: order.id,
          status: order.status,
          productOrderStatus: order.productOrder?.status
        }
      });
      // Force it to the correct stage
      pipelineStages.delivered.push(order);
      return;
    }
    
    // Only add to pipeline if stage is valid (not null/undefined)
    if (stage && pipelineStages[stage]) {
      pipelineStages[stage].push(order);
    } else if (!stage) {
      // Log if order was filtered out
      console.log('[ORDER_MANAGEMENT] Order filtered out (cancelled/rejected):', {
        orderId: order.id,
        status,
        orderType: order.order_type
      });
    }
  });

  // Sort each stage by date (newest first)
  Object.keys(pipelineStages).forEach(stage => {
    pipelineStages[stage].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || a.purchased_at || 0);
      const dateB = new Date(b.created_at || b.createdAt || b.purchased_at || 0);
      return dateB - dateA;
    });
  });

  const stageConfig = [
    { 
      id: 'new_orders', 
      label: 'New Orders', 
      icon: Clock,
      color: isDark ? 'border-blue-500/30 bg-blue-500/10' : 'border-blue-300 bg-blue-50'
    },
    { 
      id: 'under_fabrication', 
      label: 'Under Fabrication', 
      icon: Package,
      color: isDark ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-yellow-300 bg-yellow-50'
    },
    { 
      id: 'ready_to_ship', 
      label: 'Ready to Ship', 
      icon: ShoppingBag,
      color: isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-orange-300 bg-orange-50'
    },
    { 
      id: 'delivered', 
      label: 'Delivered & Fulfilled', 
      icon: CheckCircle,
      color: isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50'
    }
  ];

  return (
    <AdminLayout currentPage="orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Order Management
            </h1>
            <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
              Manage product orders, inventory, and fulfillment
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-white/40' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search orders by ID, name, email, or project type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-full text-sm ${
                  isDark
                    ? 'bg-white/5 text-white border border-white/10 placeholder-white/40'
                    : 'bg-white/40 text-gray-900 border border-white/30 placeholder-gray-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl p-4 border-2 ${
              isDark 
                ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">Error Loading Orders</p>
                <p className="text-sm opacity-90">{error}</p>
                <button
                  onClick={handleRetry}
                  className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isDark
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200'
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pipeline View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${
            isDark ? 'bg-white/5' : 'bg-white/40'
          }`}>
            <Package className={`w-12 h-12 mx-auto mb-3 ${
              isDark ? 'text-white/30' : 'text-gray-400'
            }`} />
            <p className={`text-sm ${isDark ? 'text-white opacity-70' : 'text-gray-600'}`}>
              {searchQuery ? 'No orders found matching your search' : 'No orders found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stageConfig.map((stage) => {
              const orders = pipelineStages[stage.id] || [];
              const Icon = stage.icon;
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border-2 p-6 min-h-[600px] ${stage.color}`}
                  style={{
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                >
                  {/* Stage Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-current/20">
                    <Icon className={`w-6 h-6 ${
                      isDark ? 'text-white/80' : 'text-gray-700'
                    }`} />
                    <h3 className={`text-xl font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stage.label}
                    </h3>
                    <span className={`ml-auto px-3 py-1.5 rounded-full text-sm font-medium ${
                      isDark ? 'bg-white/20 text-white' : 'bg-white/60 text-gray-700'
                    }`}>
                      {orders.length}
                    </span>
                  </div>

                  {/* Orders in this stage */}
                  <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto px-2">
                    {orders.length === 0 ? (
                      <div className={`text-center py-12 rounded-lg ${
                        isDark ? 'bg-white/5' : 'bg-white/20'
                      }`}>
                        <Package className={`w-10 h-10 mx-auto mb-3 ${
                          isDark ? 'text-white/20' : 'text-gray-400'
                        }`} />
                        <p className={`text-sm ${
                          isDark ? 'text-white/40' : 'text-gray-500'
                        }`}>
                          No orders
                        </p>
                      </div>
                    ) : (
                      orders.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="mb-1"
                        >
                          <Link 
                            href={request.order_type === 'stock_product' 
                              ? `/admin/orders/product-orders/${request.id}`
                              : `/admin/orders/${request.id}`}
                            className="block no-underline"
                            style={{ 
                              color: 'inherit', 
                              textDecoration: 'none',
                              outline: 'none',
                              backgroundColor: 'transparent'
                            }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.01, y: -2 }}
                              className={`rounded-lg p-4 cursor-pointer transition-all ${
                                isDark 
                                  ? 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10' 
                                  : 'bg-white/40 border border-gray-200 hover:border-gray-300 hover:bg-white/60'
                              }`}
                              style={{
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                transformOrigin: 'center'
                              }}
                            >
                              {/* Preview Image */}
                              {(request.preview_image || request.preview_image_url || request.product?.metadata?.image) && (
                                <div className="mb-3">
                                  <div className="w-full h-40 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                                    <img
                                      src={request.preview_image || request.preview_image_url || request.product?.metadata?.image}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      decoding="async"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <div className="hidden w-full h-full items-center justify-center">
                                      <ImageIcon className={`w-6 h-6 ${isDark ? 'text-white/20' : 'text-gray-400'}`} />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Order Info */}
                              <div>
                                <h4 className={`text-base font-semibold mb-2 truncate ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {request.order_type === 'stock_product' 
                                    ? (request.product?.name || 'Product Order')
                                    : (request.project_type || 'Custom Product')}
                                </h4>
                                <p className={`text-sm truncate mb-3 ${
                                  isDark ? 'text-white/70' : 'text-gray-600'
                                }`}>
                                  {request.order_type === 'stock_product'
                                    ? (request.user?.profile?.first_name && request.user?.profile?.last_name
                                        ? `${request.user.profile.first_name} ${request.user.profile.last_name}`
                                        : request.user?.email || 'User')
                                    : (request.name || request.user?.email || 'User')}
                                </p>
                                
                                <div className="flex items-center gap-2 mb-3">
                                  {request.order_type && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      request.order_type === 'custom_order'
                                        ? (isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700')
                                        : (isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-teal-100 text-teal-700')
                                    }`}>
                                      {request.order_type === 'custom_order' ? 'Custom' : 'Stock'}
                                    </span>
                                  )}
                                  {(() => {
                                    const orderStatus = extractOrderStatus(request);
                                    return (
                                      <span className={`px-2.5 py-1 rounded text-xs font-medium border ${getStatusColor(orderStatus)}`}>
                                        {getStatusLabel(orderStatus)}
                                      </span>
                                    );
                                  })()}
                                </div>

                                <div className="text-sm space-y-1.5">
                                  {request.order_type === 'stock_product' ? (
                                    <>
                                      {request.amount && (
                                        <div>
                                          <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Amount: </span>
                                          <span className={isDark ? 'text-white' : 'text-gray-900 font-medium'}>
                                            {formatCurrency(request.amount)}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      {request.quoted_price && (
                                        <div>
                                          <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Quoted: </span>
                                          <span className={isDark ? 'text-white' : 'text-gray-900 font-medium'}>
                                            {formatCurrency(request.quoted_price)}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  <div>
                                    <span className={isDark ? 'text-white/50' : 'text-gray-500'}>Created: </span>
                                    <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                      {formatDate(request.created_at || request.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </Link>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
