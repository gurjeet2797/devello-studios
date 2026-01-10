import { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../components/Layout';
import { getSupabase } from '../../lib/supabaseClient';
import { 
  DollarSign, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function AdminTransactions() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const supabase = getSupabase();

  // Fetch transactions data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Get the access token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available');
          setLoadingData(false);
          return;
        }
        
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '50',
          search: searchTerm,
          sortBy,
          sortOrder,
          status: filterStatus,
          type: filterType
        });

        const response = await fetch(`/api/admin/transactions?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Transactions data received:', data.transactions[0]); // Debug log
          setTransactions(data.transactions);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchTransactions();
    }
  }, [user, currentPage, searchTerm, sortBy, sortOrder, filterStatus, filterType]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed':
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'succeeded':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'subscription':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'one_time':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <AdminLayout currentPage="transactions">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold transition-colors duration-700 ${
              isDark ? 'text-white' : 'text-amber-900'
            }`}>Transactions</h1>
            <p className={`mt-2 transition-colors duration-700 ${
              isDark ? 'text-gray-400' : 'text-amber-700'
            }`}>All Stripe payments and transactions</p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/sync-stripe-transactions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                    }
                  });
                  if (response.ok) {
                    const result = await response.json();
                    alert(`Sync completed! Synced: ${result.stats.synced}, Skipped: ${result.stats.skipped}, Errors: ${result.stats.errors}`);
                    // Refresh the page to show new data
                    window.location.reload();
                  } else {
                    alert('Sync failed. Check console for details.');
                  }
                } catch (error) {
                  console.error('Sync error:', error);
                  alert('Sync failed. Check console for details.');
                }
              }}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Sync Stripe
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                isDark 
                  ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <RefreshCw className="w-4 h-4 mr-2 inline" />
              Refresh
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="about-devello-glass rounded-3xl p-6 mb-6 border">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-700 ${
                isDark ? 'text-gray-400' : 'text-amber-600'
              }`} />
              <input
                type="text"
                placeholder="Search by user, email, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full transition-all duration-300 ${
                  isDark
                    ? 'bg-white/10 text-white border border-white/20 placeholder-gray-400'
                    : 'bg-amber-100/50 text-amber-900 border border-amber-300/30 placeholder-amber-600'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-amber-100/50 text-amber-900 border border-amber-300/30'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-amber-100/50 text-amber-900 border border-amber-300/30'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscriptions</option>
              <option value="one_time">One-time</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-amber-100/50 text-amber-900 border border-amber-300/30'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <option value="created_at">Date</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={`px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-amber-100/50 text-amber-900 border border-amber-300/30'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loadingData ? (
        <div className="about-devello-glass rounded-3xl p-8 border">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full ${
                  isDark ? 'bg-gray-600' : 'bg-amber-300'
                }`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 rounded w-1/4 ${
                    isDark ? 'bg-gray-600' : 'bg-amber-300'
                  }`}></div>
                  <div className={`h-3 rounded w-1/3 ${
                    isDark ? 'bg-gray-600' : 'bg-amber-300'
                  }`}></div>
                </div>
                <div className={`h-4 rounded w-20 ${
                  isDark ? 'bg-gray-600' : 'bg-amber-300'
                }`}></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="about-devello-glass rounded-3xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
              <thead className={`transition-colors duration-700 ${
                isDark ? 'bg-white/5' : 'bg-amber-50/50'
              }`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-gray-200 dark:divide-white/10 transition-colors duration-700 ${
                isDark ? 'bg-transparent' : 'bg-white/50'
              }`}>
                {transactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/5 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-700 ${
                          isDark ? 'bg-white/20' : 'bg-amber-200/60'
                        }`}>
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium transition-colors duration-700 ${
                            isDark ? 'text-white' : 'text-amber-900'
                          }`}>
                            {transaction.stripePaymentIntentId || transaction.stripeSessionId || 'N/A'}
                          </div>
                          <div className={`text-xs transition-colors duration-700 ${
                            isDark ? 'text-gray-400' : 'text-amber-700'
                          }`}>
                            ID: {transaction.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-700 ${
                          isDark ? 'bg-white/20' : 'bg-amber-200/60'
                        }`}>
                          <span className={`text-sm font-medium transition-colors duration-700 ${
                            isDark ? 'text-white' : 'text-amber-900'
                          }`}>
                            {transaction.user?.name ? transaction.user.name.charAt(0).toUpperCase() : transaction.user?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className={`text-sm font-medium transition-colors duration-700 ${
                            isDark ? 'text-white' : 'text-amber-900'
                          }`}>
                            {transaction.user?.name || 'Unknown User'}
                          </div>
                          <div className={`text-xs transition-colors duration-700 ${
                            isDark ? 'text-gray-400' : 'text-amber-700'
                          }`}>
                            {transaction.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.type === 'subscription' ? 'Subscription' : 'One-time'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium transition-colors duration-700 ${
                        isDark ? 'text-white' : 'text-amber-900'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </div>
                      <div className={`text-xs transition-colors duration-700 ${
                        isDark ? 'text-gray-400' : 'text-amber-700'
                      }`}>
                        {transaction.currency?.toUpperCase() || 'USD'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm transition-colors duration-700 ${
                        isDark ? 'text-white' : 'text-amber-900'
                      }`}>
                        {formatDate(transaction.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-4 py-3 flex items-center justify-between border-t transition-colors duration-700 ${
            isDark ? 'border-white/10' : 'border-amber-300/30'
          } sm:px-6`}>
            <div className={`text-sm transition-colors duration-700 ${
              isDark ? 'text-gray-400' : 'text-amber-700'
            }`}>
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-amber-100/50 text-amber-900 hover:bg-amber-200/60 border border-amber-300/30'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                    ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                    : 'bg-amber-100/50 text-amber-900 hover:bg-amber-200/60 border border-amber-300/30'
                }`}
                style={{ backdropFilter: 'blur(10px)' }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
