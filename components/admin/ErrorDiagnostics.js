import { useState } from 'react';
import { useTheme } from '../Layout';
import { AlertCircle, CheckCircle, X, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ERROR_DIAGNOSTICS = [
  {
    id: '401-unauthorized',
    error: '401 Unauthorized',
    description: 'GET /api/admin/orders/list? 401 (Unauthorized)',
    cause: 'Authentication token expired, missing, or invalid. Session may have timed out.',
    fix: 'Refresh the page or log out and log back in. The system will automatically attempt to refresh your session.',
    severity: 'error',
    common: true
  },
  {
    id: 'product-orders-not-loading',
    error: 'Product Orders Not Populating',
    description: 'Stock product orders not appearing in orders dashboard',
    cause: 'Authentication failure preventing API call, or database query issue with order_type column.',
    fix: 'Ensure you are logged in with an admin account. Verify database migration for order_type column has been applied. Check browser console for specific error messages.',
    severity: 'error',
    common: true
  },
  {
    id: 'stripe-http-warning',
    error: 'Stripe.js HTTP Warning',
    description: 'You may test your Stripe.js integration over HTTP. However, live Stripe.js integrations must use HTTPS.',
    cause: 'Development environment using HTTP instead of HTTPS. This is expected in local development.',
    fix: 'No action needed. This is a development-only warning. Production deployments automatically use HTTPS.',
    severity: 'warning',
    common: true
  },
  {
    id: 'react-devtools',
    error: 'React DevTools Message',
    description: 'Download the React DevTools for a better development experience',
    cause: 'Informational message from React development tools.',
    fix: 'No action needed. This is an informational message only. Install React DevTools browser extension if desired.',
    severity: 'info',
    common: true
  },
  {
    id: 'profile-401',
    error: '401 on /api/user/profile',
    description: 'GET http://localhost:3000/api/user/profile 401 (Unauthorized)',
    cause: 'User session expired or authentication token invalid.',
    fix: 'Refresh the page or log out and log back in. Check that you are using a valid admin account.',
    severity: 'error',
    common: false
  },
  {
    id: 'partners-status-401',
    error: '401 on /api/partners/status',
    description: 'GET http://localhost:3000/api/partners/status 401 (Unauthorized)',
    cause: 'Authentication token expired or missing when checking partner status.',
    fix: 'Refresh session or log in again. This error may occur if session expired while on the page.',
    severity: 'error',
    common: false
  },
  {
    id: 'monthly-2fa-disabled',
    error: 'Monthly 2FA Reset Disabled',
    description: '🚫 Monthly 2FA reset system completely disabled',
    cause: 'Monthly 2FA reset feature has been intentionally disabled in the system.',
    fix: 'No action needed. This is expected behavior - the monthly 2FA reset system is disabled.',
    severity: 'info',
    common: false
  },
  {
    id: 'vercel-analytics-debug',
    error: 'Vercel Analytics Debug Mode',
    description: '[Vercel Web Analytics] Debug mode is enabled by default in development',
    cause: 'Vercel Analytics is in debug mode during development. No analytics data is sent.',
    fix: 'No action needed. Debug mode is automatically disabled in production.',
    severity: 'info',
    common: false
  }
];

const SEVERITY_COLORS = {
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    icon: AlertCircle,
    iconColor: 'text-red-400'
  },
  warning: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-300',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400'
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-300',
    icon: Info,
    iconColor: 'text-blue-400'
  }
};

export default function ErrorDiagnostics({ showOnlyCommon = false, collapsed = false }) {
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [filter, setFilter] = useState('all'); // 'all', 'error', 'warning', 'info'

  const filteredErrors = ERROR_DIAGNOSTICS.filter(err => {
    if (showOnlyCommon && !err.common) return false;
    if (filter !== 'all' && err.severity !== filter) return false;
    return true;
  });

  const errorCount = ERROR_DIAGNOSTICS.filter(e => e.severity === 'error').length;
  const warningCount = ERROR_DIAGNOSTICS.filter(e => e.severity === 'warning').length;
  const infoCount = ERROR_DIAGNOSTICS.filter(e => e.severity === 'info').length;

  return (
    <div className={`rounded-xl border-2 ${
      isDark 
        ? 'bg-white/5 border-white/10' 
        : 'bg-white/40 border-white/30'
    }`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className={`w-5 h-5 ${
            isDark ? 'text-white/70' : 'text-gray-600'
          }`} />
          <h3 className={`text-lg font-semibold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Error Diagnostics & Troubleshooting
          </h3>
        </div>
        <div className="flex items-center gap-4">
          {/* Filter badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter('all');
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filter === 'all'
                  ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                  : isDark ? 'bg-white/5 text-white/50' : 'bg-white/20 text-gray-500'
              }`}
            >
              All ({ERROR_DIAGNOSTICS.length})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter('error');
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filter === 'error'
                  ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                  : isDark ? 'bg-white/5 text-white/50' : 'bg-white/20 text-gray-500'
              }`}
            >
              Errors ({errorCount})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter('warning');
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filter === 'warning'
                  ? isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                  : isDark ? 'bg-white/5 text-white/50' : 'bg-white/20 text-gray-500'
              }`}
            >
              Warnings ({warningCount})
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilter('info');
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                filter === 'info'
                  ? isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                  : isDark ? 'bg-white/5 text-white/50' : 'bg-white/20 text-gray-500'
              }`}
            >
              Info ({infoCount})
            </button>
          </div>
          <X 
            className={`w-5 h-5 transition-transform ${
              isDark ? 'text-white/50' : 'text-gray-400'
            } ${isCollapsed ? 'rotate-0' : 'rotate-45'}`}
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {filteredErrors.length === 0 ? (
                <div className={`text-center py-8 ${
                  isDark ? 'text-white/50' : 'text-gray-500'
                }`}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No errors match the current filter</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredErrors.map((error, index) => {
                    const severityStyle = SEVERITY_COLORS[error.severity];
                    const Icon = severityStyle.icon;
                    
                    return (
                      <motion.div
                        key={error.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-lg border-2 p-4 ${
                          isDark 
                            ? `${severityStyle.bg} ${severityStyle.border}` 
                            : `${severityStyle.bg.replace('/10', '/20')} ${severityStyle.border.replace('/30', '/40')}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${severityStyle.iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {error.error}
                              </h4>
                              {error.common && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  Common
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mb-2 ${
                              isDark ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {error.description}
                            </p>
                            <div className="space-y-2">
                              <div>
                                <span className={`text-xs font-medium ${
                                  isDark ? 'text-white/70' : 'text-gray-700'
                                }`}>
                                  Cause: 
                                </span>
                                <p className={`text-sm mt-0.5 ${
                                  isDark ? 'text-white/50' : 'text-gray-600'
                                }`}>
                                  {error.cause}
                                </p>
                              </div>
                              <div>
                                <span className={`text-xs font-medium ${
                                  isDark ? 'text-white/70' : 'text-gray-700'
                                }`}>
                                  Fix: 
                                </span>
                                <p className={`text-sm mt-0.5 ${
                                  isDark ? 'text-white/50' : 'text-gray-600'
                                }`}>
                                  {error.fix}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

