import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTheme } from '../../components/Layout';
import { getSupabase } from '../../lib/supabaseClient';

export default function OrderSuccess() {
  const router = useRouter();
  const { session_id } = router.query;
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session_id) return;

    const processOrder = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) {
          throw new Error('Supabase client not available');
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setError('Please log in to view your order');
          setLoading(false);
          return;
        }

        // Call purchase API to process the order
        const response = await fetch('/api/products/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId: session_id }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to process order');
        }

        setOrder(data.order);
        
        // Track conversion
        if (typeof window !== 'undefined' && typeof gtag_report_conversion === 'function') {
          gtag_report_conversion();
        }
      } catch (err) {
        console.error('Error processing order:', err);
        setError(err.message || 'Failed to process order');
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [session_id]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className={isDark ? 'text-white/70' : 'text-gray-600'}>Processing your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
        <div className="text-center max-w-md mx-auto px-6">
          <div className={`text-red-500 mb-4 text-6xl`}>✕</div>
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Order Processing Error
          </h1>
          <p className={`mb-6 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={() => router.push('/products')}
            className={`px-6 py-3 rounded-lg font-medium ${
              isDark
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-[var(--light-bg)]'}`}>
      <div className="container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto text-center"
        >
          <CheckCircle className="w-20 h-20 mx-auto mb-6 text-emerald-500" />
          <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Order Confirmed!
          </h1>
          <p className={`text-lg mb-8 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            Thank you for your purchase. Your order has been processed successfully.
          </p>

          {order && (
            <div className={`rounded-2xl p-6 mb-8 ${
              isDark ? 'bg-gray-900/50 border border-white/10' : 'bg-white/80 border border-gray-200'
            }`}>
              <div className="text-left space-y-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Order Number</p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {order.order_number}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Product</p>
                  <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {order.product?.name}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Amount</p>
                  <p className={`text-lg font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ${(order.amount / 100).toFixed(2)} {order.currency.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Status</p>
                  <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {order.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/products')}
              className={`px-6 py-3 rounded-lg font-medium ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border border-white/10'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              Continue Shopping
            </button>
            <button
              onClick={() => router.push('/profile')}
              className={`px-6 py-3 rounded-lg font-medium ${
                isDark
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              View Orders
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

