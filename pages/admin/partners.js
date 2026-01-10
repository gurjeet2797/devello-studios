import { useState, useEffect } from 'react';
import { useAuth } from '../../components/auth/AuthProvider';
import { motion } from 'framer-motion';
import AdminLayout from '../../components/admin/AdminLayout';
import { useTheme } from '../../components/Layout';
import { getSupabase } from '../../lib/supabaseClient';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';

export default function AdminPartners() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchPartners = async () => {
      if (!user) return;

      setLoadingPartners(true);
      try {
        const supabase = getSupabase();
        if (!supabase) {
          setLoadingPartners(false);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          setLoadingPartners(false);
          return;
        }

        const statusParam = activeTab === 'all' ? '' : activeTab;
        const response = await fetch(`/api/admin/partners/list${statusParam ? `?status=${statusParam}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (response.status === 401 || response.status === 403) {
          // Not authorized - expected for non-admin users
          setPartners([]);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setPartners(data.partners || []);
        }
      } catch (error) {
        // Only log unexpected errors
        if (!error.message?.includes('401') && !error.message?.includes('Unauthorized')) {
          console.error('Error fetching partners:', error);
        }
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchPartners();
  }, [user, activeTab]);

  const handleApprove = async (partnerId, action) => {
    setProcessing(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setProcessing(false);
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setProcessing(false);
        return;
      }

      const response = await fetch('/api/admin/partners/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          partner_id: partnerId,
          action: action
        })
      });

      if (response.status === 401 || response.status === 403) {
        alert('You are not authorized to perform this action.');
        setProcessing(false);
        return;
      }

      if (response.ok) {
        // Refresh partners list
        const statusParam = activeTab === 'all' ? '' : activeTab;
        const refreshResponse = await fetch(`/api/admin/partners/list${statusParam ? `?status=${statusParam}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setPartners(data.partners || []);
        }
        setSelectedPartner(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update partner status');
      }
    } catch (error) {
      console.error('Error updating partner status:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (partnerId, companyName) => {
    if (!confirm(`Are you sure you want to delete ${companyName}? This action cannot be undone and will remove all associated data including conversations and messages.`)) {
      return;
    }

    setProcessing(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        setProcessing(false);
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setProcessing(false);
        return;
      }

      const response = await fetch('/api/admin/partners/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          partner_id: partnerId
        })
      });

      if (response.status === 401 || response.status === 403) {
        alert('You are not authorized to perform this action.');
        setProcessing(false);
        return;
      }

      if (response.ok) {
        // Refresh partners list
        const statusParam = activeTab === 'all' ? '' : activeTab;
        const refreshResponse = await fetch(`/api/admin/partners/list${statusParam ? `?status=${statusParam}` : ''}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setPartners(data.partners || []);
        }
        setSelectedPartner(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete partner');
      }
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getServiceTypeLabel = (type) => {
    switch (type) {
      case 'construction':
        return 'Construction';
      case 'software_development':
        return 'Software Development';
      case 'consulting':
        return 'Consulting';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout currentPage="partners">
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold transition-colors duration-700 ${
          isDark ? 'text-white' : 'text-amber-900'
        }`}>Partners</h1>
        <p className={`mt-2 text-sm sm:text-base transition-colors duration-700 ${
          isDark ? 'text-gray-400' : 'text-amber-700'
        }`}>Manage partner applications and approved partners</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
        {[
          { id: 'pending', label: 'Pending Applications', icon: Clock },
          { id: 'approved', label: 'Approved Partners', icon: CheckCircle },
          { id: 'rejected', label: 'Rejected', icon: XCircle },
          { id: 'all', label: 'All Partners', icon: Users }
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === tab.id
                ? isDark
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-amber-200/60 text-amber-900 border border-amber-300/50'
                : isDark
                ? 'text-white/70 hover:text-white hover:bg-white/10 border border-transparent'
                : 'text-amber-800/70 hover:text-amber-900 hover:bg-amber-50/50 border border-transparent'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Partners List */}
      {loadingPartners ? (
        <div className={`rounded-lg sm:rounded-xl p-4 sm:p-6 animate-pulse transition-colors duration-700 ${
          isDark 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-amber-100/50 border border-amber-300/30'
        }`}>
          <div className={`h-4 rounded w-1/2 mb-4 ${
            isDark ? 'bg-gray-600' : 'bg-amber-300'
          }`}></div>
          <div className={`h-4 rounded w-3/4 ${
            isDark ? 'bg-gray-600' : 'bg-amber-300'
          }`}></div>
        </div>
      ) : partners.length === 0 ? (
        <div className={`rounded-lg sm:rounded-xl p-4 sm:p-6 text-center transition-colors duration-700 ${
          isDark 
            ? 'bg-white/10 border border-white/20' 
            : 'bg-amber-100/50 border border-amber-300/30'
        }`}>
          <p className={`transition-colors duration-700 ${
            isDark ? 'text-gray-400' : 'text-amber-700'
          }`}>
            No partners found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {partners.map((partner) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg sm:rounded-xl p-4 sm:p-6 transition-colors duration-700 ${
                isDark 
                  ? 'bg-white/10 border border-white/20' 
                  : 'bg-amber-100/50 border border-amber-300/30'
              }`}
              style={{ backdropFilter: 'blur(10px)' }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`text-lg font-semibold transition-colors duration-700 ${
                      isDark ? 'text-white' : 'text-amber-900'
                    }`}>
                      {partner.company_name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      partner.status === 'approved'
                        ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
                        : partner.status === 'rejected'
                        ? isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
                        : isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {partner.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      partner.service_type === 'construction'
                        ? isDark ? 'bg-orange-500/20 text-orange-300 border-orange-400/30' : 'bg-orange-100 text-orange-700 border-orange-300'
                        : partner.service_type === 'software_development'
                        ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' : 'bg-blue-100 text-blue-700 border-blue-300'
                        : isDark ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                    }`}>
                      {getServiceTypeLabel(partner.service_type)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm transition-colors duration-700 ${
                      isDark ? 'text-gray-400' : 'text-amber-700'
                    }`}>
                      <strong>Email:</strong> {partner.user_email}
                    </p>
                    {partner.phone && (
                      <p className={`text-sm transition-colors duration-700 ${
                        isDark ? 'text-gray-400' : 'text-amber-700'
                      }`}>
                        <strong>Phone:</strong> {partner.phone}
                      </p>
                    )}
                    {partner.experience_years && (
                      <p className={`text-sm transition-colors duration-700 ${
                        isDark ? 'text-gray-400' : 'text-amber-700'
                      }`}>
                        <strong>Experience:</strong> {partner.experience_years} years
                      </p>
                    )}
                    <p className={`text-sm transition-colors duration-700 ${
                      isDark ? 'text-gray-400' : 'text-amber-700'
                    }`}>
                      <strong>Applied:</strong> {formatDate(partner.created_at)}
                    </p>
                    {partner.approved_at && (
                      <p className={`text-sm transition-colors duration-700 ${
                        isDark ? 'text-gray-400' : 'text-amber-700'
                      }`}>
                        <strong>Approved:</strong> {formatDate(partner.approved_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {partner.status === 'pending' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApprove(partner.id, 'approve')}
                        disabled={processing}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                          isDark
                            ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                        } disabled:opacity-50`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleApprove(partner.id, 'reject')}
                        disabled={processing}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                          isDark
                            ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                        } disabled:opacity-50`}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(partner.id, partner.company_name)}
                    disabled={processing}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      isDark
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300'
                    } disabled:opacity-50`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPartner(selectedPartner?.id === partner.id ? null : partner)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-amber-100/50 text-amber-900 hover:bg-amber-200/60 border border-amber-300/30'
                    }`}
                  >
                    {selectedPartner?.id === partner.id ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide Details
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        View Details
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Partner Details */}
              {selectedPartner?.id === partner.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="space-y-3">
                    {partner.description && (
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 transition-colors duration-700 ${
                          isDark ? 'text-white' : 'text-amber-900'
                        }`}>Description</h4>
                        <p className={`text-sm transition-colors duration-700 whitespace-pre-wrap ${
                          isDark ? 'text-gray-400' : 'text-amber-700'
                        }`}>
                          {partner.description}
                        </p>
                      </div>
                    )}
                    {partner.portfolio_url && (
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 transition-colors duration-700 ${
                          isDark ? 'text-white' : 'text-amber-900'
                        }`}>Portfolio URL</h4>
                        <a
                          href={partner.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm transition-colors duration-700 hover:underline ${
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          }`}
                        >
                          {partner.portfolio_url}
                        </a>
                      </div>
                    )}
                    {partner.approved_by && (
                      <div>
                        <h4 className={`text-sm font-semibold mb-1 transition-colors duration-700 ${
                          isDark ? 'text-white' : 'text-amber-900'
                        }`}>Approved By</h4>
                        <p className={`text-sm transition-colors duration-700 ${
                          isDark ? 'text-gray-400' : 'text-amber-700'
                        }`}>
                          {partner.approved_by}
                        </p>
                      </div>
                    )}
                    {partner.application_data && Object.keys(partner.application_data).length > 0 && (
                      <div>
                        <h4 className={`text-sm font-semibold mb-2 transition-colors duration-700 ${
                          isDark ? 'text-white' : 'text-amber-900'
                        }`}>Application Metadata</h4>
                        <div className={`text-xs p-3 rounded-lg overflow-auto space-y-1 ${
                          isDark ? 'bg-gray-800/50 text-gray-300' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {Object.entries(partner.application_data).map(([key, value]) => (
                            <div key={key} className="flex flex-col sm:flex-row gap-2">
                              <span className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

