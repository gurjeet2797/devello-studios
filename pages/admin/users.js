import { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../components/Layout';
import { getSupabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  Upload,
  UserCheck,
  UserX
} from 'lucide-react';

export default function AdminUsers() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const supabase = getSupabase();


  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
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
          sortOrder
        });

        const response = await fetch(`/api/admin/users?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Users data received:', data.users[0]); // Debug log
          setUsers(data.users);
          setTotalPages(data.pagination.pages);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user, currentPage, searchTerm, sortBy, sortOrder]);


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
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (planType) => {
    switch (planType) {
      case 'pro': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout currentPage="users">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold transition-colors duration-700 ${
              isDark ? 'text-white' : 'text-amber-900'
            }`}>Users</h1>
            <p className={`mt-2 transition-colors duration-700 ${
              isDark ? 'text-gray-400' : 'text-amber-700'
            }`}>Manage and monitor user accounts</p>
          </div>
          <div className="flex items-center space-x-4">
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
              Export Users
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="about-devello-glass rounded-3xl p-6 mb-6 border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-700 ${
                isDark ? 'text-gray-400' : 'text-amber-600'
              }`} />
              <input
                type="text"
                placeholder="Search users by name or email..."
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
          <div className="flex gap-2">
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
              <option value="created_at">Created Date</option>
              <option value="email">Email</option>
              <option value="subscription.status">Subscription Status</option>
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
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center px-3 py-2 rounded-xl transition-all duration-300 ${
                isDark
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-amber-100/50 text-amber-900 border border-amber-300/30 hover:bg-amber-200/60'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </motion.button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loadingData ? (
        <div className="about-devello-glass rounded-3xl border overflow-hidden">
          <div className="animate-pulse">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="about-devello-glass rounded-3xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uploads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {user.email}
                          </div>
                          {user.company && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Globe className="w-4 h-4 mr-1" />
                              {user.company}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.subscription.status)}`}>
                          {user.subscription.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(user.subscription.planType)}`}>
                          {user.subscription.planType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.uploads.count} / {user.uploads.limit}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.uploads.lastUpload ? formatDate(user.uploads.lastUpload) : 'Never'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium transition-colors duration-700 ${
                        isDark ? 'text-white' : 'text-amber-900'
                      }`}>
                        {formatCurrency(
                          user.revenue?.totalRevenue || 
                          user.purchases?.totalAmount || 
                          (user.purchases?.total || 0) * 500 // Fallback estimate if no amount data
                        )}
                      </div>
                      <div className={`text-sm transition-colors duration-700 ${
                        isDark ? 'text-gray-400' : 'text-amber-700'
                      }`}>
                        {user.revenue?.subscriptionRevenue > 0 && (
                          <span className="text-green-600">Sub: {formatCurrency(user.revenue.subscriptionRevenue)}</span>
                        )}
                        {user.revenue?.oneTimePurchases > 0 && (
                          <span className="ml-2 text-blue-600">One-time: {formatCurrency(user.revenue.oneTimePurchases)}</span>
                        )}
                        {!user.revenue && user.purchases?.total > 0 && (
                          <span className="text-blue-600">{user.purchases.total} purchases</span>
                        )}
                      </div>
                      {user.purchases?.lastPurchase && (
                        <div className={`text-xs transition-colors duration-700 ${
                          isDark ? 'text-gray-500' : 'text-amber-600'
                        }`}>
                          Last: {formatDate(user.purchases.lastPurchase)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
