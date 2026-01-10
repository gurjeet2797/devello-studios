import React from 'react';
import { useTheme } from '../components/Layout';
import SEOComponent from '../components/SEO';
import { motion } from 'framer-motion';

export default function Shipping() {
  const { isDark } = useTheme();

  return (
    <>
      <SEOComponent
        title="Shipping - Devello"
        description="Nationwide freight shipping for architectural doors, windows, glass, and mirror products. White-glove delivery available."
        url="https://develloinc.com/shipping"
      />

      <div className={`min-h-screen py-12 transition-colors duration-700 ${
        isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Shipping
            </h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              isDark
                ? 'bg-amber-500/20 border border-amber-500/30'
                : 'bg-amber-100 border border-amber-200'
            }`}>
              <span className={`text-sm font-medium ${
                isDark ? 'text-amber-300' : 'text-amber-700'
              }`}>
                Coming Soon
              </span>
            </div>
          </motion.div>

          {/* Coming Soon Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`mb-8 p-6 rounded-xl ${
              isDark
                ? 'bg-blue-500/10 border border-blue-500/20'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <p className={`text-base leading-relaxed ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>
              <strong>Note:</strong> We're currently finalizing our shipping infrastructure, including insurance and vendor contracts. Shipping services will be available soon. In the meantime, please contact us at <a href="mailto:sales@develloinc.com" className="underline">sales@develloinc.com</a> for shipping inquiries.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`prose prose-lg max-w-none ${
              isDark
                ? 'prose-invert text-white/90'
                : 'text-gray-800'
            }`}
          >
            <div className={`p-8 rounded-2xl ${
              isDark
                ? 'bg-white/5 border border-white/10'
                : 'bg-white border border-gray-200'
            }`}
            style={{ backdropFilter: 'blur(10px)' }}
            >
              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Nationwide Freight Shipping
              </h2>
              <p>
                Devello ships architectural doors, windows, glass, and mirror products nationwide using insured freight delivery. Because these products are large, heavy, and/or fragile, they ship differently than standard parcel deliveries.
              </p>

              <h3 className={isDark ? 'text-white' : 'text-gray-800'}>
                Standard Delivery (Curbside)
              </h3>
              <p>
                Most orders ship via insured LTL freight with curbside delivery. This means the carrier delivers to the curb or driveway at the destination address. The customer is responsible for moving the item(s) inside.
              </p>

              <h3 className={isDark ? 'text-white' : 'text-gray-800'}>
                Residential & Commercial Delivery
              </h3>
              <p>
                We ship to both residential and commercial addresses. Delivery pricing can change depending on access requirements (liftgate, appointment scheduling, stairs/elevator constraints, jobsite access, etc.).
              </p>

              <h3 className={isDark ? 'text-white' : 'text-gray-800'}>
                Glass & Mirrors — White-Glove Delivery (Recommended)
              </h3>
              <p>
                For glass and mirror products, Devello offers an optional white-glove delivery upgrade. White-glove delivery includes scheduled delivery, inside placement, and professional uncrating. This option is strongly recommended for residential deliveries of fragile items.
              </p>

              <h3 className={isDark ? 'text-white' : 'text-gray-800'}>
                Shipping Estimates
              </h3>
              <p>
                Shipping costs vary by destination ZIP code, product type, quantity, and handling requirements. Estimates may be shown at checkout; final shipping is confirmed after order review.
              </p>

              <h3 className={isDark ? 'text-white' : 'text-gray-800'}>
                Questions
              </h3>
              <p>
                Contact: <a href="mailto:sales@develloinc.com" className={isDark ? 'text-blue-400' : 'text-blue-600'}>sales@develloinc.com</a>
              </p>

              {/* Callout Box */}
              <div className={`mt-8 p-4 rounded-lg ${
                isDark
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`text-sm ${
                  isDark ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  <strong>Note:</strong> Final shipping cost is confirmed after order review. You will receive a confirmation before shipment.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

