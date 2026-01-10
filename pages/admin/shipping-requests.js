import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../../components/Layout';
import { getSupabase } from '../../lib/supabaseClient';
import { isAdminEmail } from '../../lib/adminAuth';
import SEOComponent from '../../components/SEO';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function ShippingRequests() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        router.push('/auth');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.push('/auth');
        return;
      }

      const admin = await isAdminEmail(session.user.email);
      if (!admin) {
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchRequests();
    };

    checkAuth();
  }, [router]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/admin/shipping-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching shipping requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents) => {
    if (!cents) return 'N/A';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAdmin || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black' : 'bg-gray-50'
      }`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-white' : 'text-gray-900'}`} />
      </div>
    );
  }

  return (
    <>
      <SEOComponent
        title="Shipping Requests - Admin - Devello"
        description="Admin view of shipping requests"
        url="https://develloinc.com/admin/shipping-requests"
      />

      <div className={`min-h-screen py-12 transition-colors duration-700 ${
        isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Shipping Requests
            </h1>
            <p className={`text-lg ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Review and manage shipping estimates
            </p>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl overflow-hidden ${
              isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'
            }`}
          >
            {requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  No shipping requests found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        ZIP
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        Access
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        Delivery Type
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        Estimate
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        Fees
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDark ? 'text-white/70' : 'text-gray-700'
                      }`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDark ? 'divide-white/10' : 'divide-gray-200'
                  }`}>
                    {requests.map((request) => (
                      <tr key={request.id} className={isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          {formatDate(request.createdAt)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          {request.zip}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          <div className="space-y-1">
                            <div>{request.deliveryAccess}</div>
                            {request.liftgate && (
                              <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                Liftgate
                              </div>
                            )}
                            {request.appointment && (
                              <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                                Appointment
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          {request.deliveryType}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          {request.estimateLow && request.estimateHigh ? (
                            <span>
                              {formatPrice(request.estimateLow)} - {formatPrice(request.estimateHigh)}
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          <div className="space-y-1">
                            {request.cratingFee && (
                              <div>Crating: {formatPrice(request.cratingFee)}</div>
                            )}
                            {request.whiteGloveFee && (
                              <div>White-Glove: {formatPrice(request.whiteGloveFee)}</div>
                            )}
                            {!request.cratingFee && !request.whiteGloveFee && 'None'}
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isDark ? 'text-white/90' : 'text-gray-900'
                        }`}>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            request.status === 'PENDING_REVIEW'
                              ? isDark
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-amber-100 text-amber-700'
                              : isDark
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

