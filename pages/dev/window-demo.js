import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../../components/store/CartContext';
import SEOComponent from '../../components/SEO';

export default function WindowDemoPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [message, setMessage] = useState('Loading dummy window product...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const allowTestProducts = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ALLOW_TEST_PRODUCTS === 'true';

    if (!allowTestProducts) {
      setError('Test product is disabled in production.');
      setMessage(null);
      return;
    }

    const loadAndAdd = async () => {
      try {
        const response = await fetch('/api/products/dummy-window');
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Unable to fetch dummy product');
        }

        const { product } = await response.json();
        addToCart(product, null, 1);
        setMessage('Dummy window added to cart. Redirecting to checkout...');
        setTimeout(() => router.replace('/checkout'), 500);
      } catch (err) {
        console.error('[WINDOW_DEMO] Failed to load dummy product', err);
        setError(err.message || 'Failed to load dummy product');
        setMessage(null);
      }
    };

    loadAndAdd();
  }, [addToCart, router]);

  return (
    <>
      <SEOComponent
        title="Window Demo Checkout"
        description="Load the dummy window product into your cart for checkout flow testing."
        url="https://develloinc.com/dev/window-demo"
      />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6 space-y-3">
          <h1 className="text-xl font-semibold">Window Demo Checkout</h1>
          {message && <p className="text-sm text-gray-700">{message}</p>}
          {error && <p className="text-sm text-red-600">Error: {error}</p>}
          {!message && !error && (
            <p className="text-sm text-gray-600">Preparing demo checkout...</p>
          )}
        </div>
      </div>
    </>
  );
}

