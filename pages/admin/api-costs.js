import { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../components/Layout';
import { getSupabase } from '../../lib/supabaseClient';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

export default function AdminAPICosts() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('daily');
  const [apiCosts, setApiCosts] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const supabase = getSupabase();

  // Fetch API costs data
  useEffect(() => {
    const fetchApiCosts = async () => {
      try {
        // Get the access token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          console.error('No access token available');
          setLoadingData(false);
          return;
        }
        
        const response = await fetch('/api/admin/api-costs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiCosts(data);
        }
      } catch (error) {
        console.error('Error fetching API costs:', error);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchApiCosts();
    }
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mock data for demonstration
  const mockApiCosts = {
    totalCost: 1247.89,
    dailyCost: 45.67,
    monthlyCost: 1247.89,
    services: [
      {
        name: 'Google Gemini',
        cost: 234.56,
        usage: '2,456 requests',
        status: 'active',
        trend: 'up',
        change: '+12.5%'
      },
      {
        name: 'Replicate API',
        cost: 567.89,
        usage: '1,234 generations',
        status: 'active',
        trend: 'down',
        change: '-8.2%'
      },
      {
        name: 'Supabase',
        cost: 89.45,
        usage: '45.2 GB storage',
        status: 'active',
        trend: 'up',
        change: '+3.1%'
      },
      {
        name: 'Vercel',
        cost: 156.78,
        usage: '2,345 function calls',
        status: 'active',
        trend: 'up',
        change: '+15.3%'
      },
      {
        name: 'Stripe',
        cost: 199.21,
        usage: '89 transactions',
        status: 'active',
        trend: 'up',
        change: '+22.1%'
      }
    ],
    recentActivity: [
      {
        service: 'Google Gemini',
        action: 'API Request',
        cost: 0.12,
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        status: 'success'
      },
      {
        service: 'Replicate API',
        action: 'Image Generation',
        cost: 0.45,
        timestamp: new Date(Date.now() - 1000 * 60 * 12),
        status: 'success'
      },
      {
        service: 'Supabase',
        action: 'Database Query',
        cost: 0.01,
        timestamp: new Date(Date.now() - 1000 * 60 * 18),
        status: 'success'
      }
    ]
  };

  const data = apiCosts || mockApiCosts;

  return (
    <AdminLayout currentPage="api-costs">
      {/* API Costs Content */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold transition-colors duration-700 ${
          isDark ? 'text-white' : 'text-amber-900'
        }`}>API Costs</h1>
        <p className={`mt-2 transition-colors duration-700 ${
          isDark ? 'text-gray-400' : 'text-amber-700'
        }`}>Monitor and track your API usage and costs across all services.</p>
      </div>

      {/* Time Period Tabs */}
      <div className="flex space-x-1 mb-8">
        {['Daily', 'Weekly', 'Monthly'].map((period) => (
          <motion.button
            key={period}
            onClick={() => setActiveTab(period.toLowerCase())}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
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

      {/* Cost Overview Cards */}
      {loadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`rounded-xl p-6 animate-pulse transition-colors duration-700 ${
              isDark 
                ? 'bg-white/10 border border-white/20' 
                : 'bg-amber-100/50 border border-amber-300/30'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}>
              <div className={`h-4 rounded w-1/2 mb-2 ${
                isDark ? 'bg-gray-600' : 'bg-amber-300'
              }`}></div>
              <div className={`h-8 rounded w-1/3 mb-2 ${
                isDark ? 'bg-gray-600' : 'bg-amber-300'
              }`}></div>
              <div className={`h-3 rounded w-1/4 ${
                isDark ? 'bg-gray-600' : 'bg-amber-300'
              }`}></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-6 transition-colors duration-700 ${
              isDark 
                ? 'bg-white/10 border border-white/20' 
                : 'bg-amber-100/50 border border-amber-300/30'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-400' : 'text-amber-700'
                }`}>Total Monthly Cost</p>
                <p className={`text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{formatCurrency(data.totalCost)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">
                    +5.2% from last month
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-xl p-6 transition-colors duration-700 ${
              isDark 
                ? 'bg-white/10 border border-white/20' 
                : 'bg-amber-100/50 border border-amber-300/30'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-400' : 'text-amber-700'
                }`}>Daily Average</p>
                <p className={`text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{formatCurrency(data.dailyCost)}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 ml-1">
                    +2.1% from yesterday
                  </span>
                </div>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl p-6 transition-colors duration-700 ${
              isDark 
                ? 'bg-white/10 border border-white/20' 
                : 'bg-amber-100/50 border border-amber-300/30'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium transition-colors duration-700 ${
                  isDark ? 'text-gray-400' : 'text-amber-700'
                }`}>Active Services</p>
                <p className={`text-2xl font-bold transition-colors duration-700 ${
                  isDark ? 'text-white' : 'text-amber-900'
                }`}>{data.services.filter(s => s.status === 'active').length}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">
                    All services operational
                  </span>
                </div>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Services Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services List */}
        <div className={`rounded-xl p-6 transition-colors duration-700 ${
          isDark 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-amber-100/50 border border-amber-300/30'
        }`}
        style={{ backdropFilter: 'blur(10px)' }}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-amber-900'
          }`}>Service Breakdown</h3>
          
          <div className="space-y-4">
            {data.services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between py-3 px-4 rounded-lg transition-colors duration-700 ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-amber-50/50 border border-amber-200/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-700 ${
                      isDark ? 'text-white' : 'text-amber-900'
                    }`}>{service.name}</p>
                    <p className={`text-xs transition-colors duration-700 ${
                      isDark ? 'text-gray-400' : 'text-amber-700'
                    }`}>{service.usage}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium transition-colors duration-700 ${
                    isDark ? 'text-white' : 'text-amber-900'
                  }`}>{formatCurrency(service.cost)}</p>
                  <div className="flex items-center">
                    {service.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs ml-1 ${
                      service.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>{service.change}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={`rounded-xl p-6 transition-colors duration-700 ${
          isDark 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-amber-100/50 border border-amber-300/30'
        }`}
        style={{ backdropFilter: 'blur(10px)' }}>
          <h3 className={`text-lg font-semibold mb-4 transition-colors duration-700 ${
            isDark ? 'text-white' : 'text-amber-900'
          }`}>Recent Activity</h3>
          
          <div className="space-y-4">
            {data.recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between py-3 border-b last:border-b-0 transition-colors duration-700 ${
                  isDark ? 'border-white/10' : 'border-amber-300/30'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-700 ${
                    activity.status === 'success' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-700 ${
                      isDark ? 'text-white' : 'text-amber-900'
                    }`}>{activity.service}</p>
                    <p className={`text-xs transition-colors duration-700 ${
                      isDark ? 'text-gray-400' : 'text-amber-700'
                    }`}>{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium transition-colors duration-700 ${
                    isDark ? 'text-white' : 'text-amber-900'
                  }`}>{formatCurrency(activity.cost)}</p>
                  <p className={`text-xs transition-colors duration-700 ${
                    isDark ? 'text-gray-400' : 'text-amber-700'
                  }`}>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
