import { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { motion } from 'framer-motion';
import AdminLayout from '../components/admin/AdminLayout';
import { useTheme } from '../components/Layout';
import { getSupabase } from '../lib/supabaseClient';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Upload, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('daily');
  const [analytics, setAnalytics] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const supabase = getSupabase();

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get the access token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available');
          setLoadingData(false);
          return;
        }
        
        const response = await fetch('/api/admin/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);


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

  const dashboardTabs = [
    { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: BarChart3 },
    { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
    { id: 'partners', label: 'Partners', href: '/admin/partners', icon: Users },
    { id: 'transactions', label: 'Transactions', href: '/admin/transactions', icon: DollarSign },
    { id: 'api-costs', label: 'API Costs', href: '/admin/api-costs', icon: TrendingUp },
  ];

  return (
    <AdminLayout currentPage="dashboard">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full min-w-0">
        {/* Left Side Dashboard Tabs */}
        <div className="flex lg:flex-col gap-2 w-full lg:w-52 flex-shrink-0 overflow-x-auto lg:overflow-visible pb-2 -mx-2 px-2 snap-x snap-mandatory">
          {dashboardTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === 'dashboard';
            return (
              <motion.a
                key={tab.id}
                href={tab.href}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`about-devello-glass logo-glass-blue px-4 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-3 min-w-[150px] sm:min-w-[180px] snap-start ${
                  isActive ? 'bg-white/20' : ''
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </motion.a>
            );
          })}
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 min-w-0 w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className={`text-2xl sm:text-3xl font-bold transition-colors duration-700 ${
              isDark ? 'text-white' : 'text-amber-900'
            }`}>Dashboard</h1>
            <p className={`mt-2 text-sm sm:text-base transition-colors duration-700 ${
              isDark ? 'text-gray-200' : 'text-amber-800'
            }`}>Overview of your platform statistics and performance.</p>
          </div>

      {/* Time Period Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
        {['Daily', 'Weekly', 'Monthly'].map((period) => (
          <motion.button
            key={period}
            onClick={() => setActiveTab(period.toLowerCase())}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-300 ${
              activeTab === period.toLowerCase()
                ? isDark
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-amber-200/60 text-amber-900 border border-amber-300/50'
                : isDark
                ? 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-50/50 border border-transparent'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            {period}
          </motion.button>
        ))}
      </div>

      {/* Stats Cards */}
      {loadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="about-devello-glass rounded-3xl p-4 sm:p-6 animate-pulse border">
              <div className={`h-3 sm:h-4 rounded w-1/2 mb-2 ${
                isDark ? 'bg-gray-600' : 'bg-amber-300'
              }`}></div>
              <div className={`h-6 sm:h-8 rounded w-1/3 mb-2 ${
                isDark ? 'bg-gray-600' : 'bg-amber-300'
              }`}></div>
              <div className={`h-2 sm:h-3 rounded w-1/4 ${
                isDark ? 'bg-gray-600' : 'bg-amber-300'
              }`}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="about-devello-glass rounded-3xl p-4 sm:p-6 border"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-200' : 'text-amber-800'
                }`}>New Users Today</p>
                <p className={`text-xl sm:text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{analytics?.stats?.newUsersToday || 0}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm text-green-600 ml-1 truncate">
                    +{analytics?.stats?.userGrowthPercent || 0}% from yesterday
                  </span>
                </div>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="about-devello-glass rounded-3xl p-4 sm:p-6 border"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-200' : 'text-amber-800'
                }`}>Total Users</p>
                <p className={`text-xl sm:text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{analytics?.stats?.totalUsers || 0}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm text-green-600 ml-1 truncate">
                    +2.5% from last week
                  </span>
                </div>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="about-devello-glass rounded-3xl p-4 sm:p-6 border"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-200' : 'text-amber-800'
                }`}>Transactions Today</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{formatCurrency(analytics?.revenue?.today || 0)}</p>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm text-green-600 ml-1 truncate">
                    +{analytics?.stats?.revenueGrowthPercent || 0}% from yesterday
                  </span>
                </div>
              </div>
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="about-devello-glass rounded-3xl p-4 sm:p-6 border"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-200' : 'text-amber-800'
                }`}>Free Users</p>
                <p className={`text-xl sm:text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{analytics?.stats?.nonUsers || 0}</p>
                <div className="flex items-center mt-1">
                  <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  <span className="text-xs sm:text-sm text-red-600 ml-1 truncate">
                    -4% from yesterday
                  </span>
                </div>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Transactions */}
        <div className="about-devello-glass rounded-3xl p-4 sm:p-6 border">
          <h3 className={`text-base sm:text-lg font-semibold mb-2 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-amber-900'
          }`}>Recent Transactions</h3>
          <p className={`text-xs sm:text-sm mb-4 sm:mb-6 transition-colors duration-700 ${
            isDark ? 'text-gray-200' : 'text-amber-800'
          }`}>Latest transactions on the platform</p>
          
          <div className="space-y-3 sm:space-y-4">
            {analytics?.recentTransactions?.slice(0, 5).map((transaction, index) => (
              <div key={transaction.id} className={`flex items-center justify-between py-2 sm:py-3 border-b last:border-b-0 transition-colors duration-700 ${
                isDark ? 'border-white/10' : 'border-amber-300/30'
              }`}>
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors duration-700 flex-shrink-0 ${
                    isDark ? 'bg-white/20' : 'bg-amber-200/60'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium transition-colors duration-700 ${
                      isDark ? 'text-white' : 'text-amber-900'
                    }`}>{transaction.user.initial}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-medium transition-colors duration-700 truncate ${
                      isDark ? 'text-white' : 'text-amber-900'
                    }`}>{transaction.user.name}</p>
                    <p className={`text-xs transition-colors duration-700 ${
                      isDark ? 'text-gray-200' : 'text-amber-800'
                    }`}>{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs sm:text-sm font-medium ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
      </div>
    </AdminLayout>
  );
}
