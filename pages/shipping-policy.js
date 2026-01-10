import React from 'react';
import { useTheme } from '../components/Layout';
import SEOComponent from '../components/SEO';
import { motion } from 'framer-motion';

export default function ShippingPolicy() {
  const { isDark } = useTheme();

  return (
    <>
      <SEOComponent
        title="Shipping & Delivery Policy - Devello"
        description="Shipping and delivery policy for Devello products. Information about freight delivery, crating, white-glove service, and damage claims."
        url="https://develloinc.com/shipping-policy"
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
              Shipping & Delivery Policy
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
                Where We Ship
              </h2>
              <ul>
                <li>United States (nationwide)</li>
                <li>Residential and commercial addresses</li>
                <li>Construction sites when accessible</li>
              </ul>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Shipping Method
              </h2>
              <p>
                Orders ship via insured LTL freight. Standard delivery is curbside delivery unless otherwise arranged.
              </p>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Shipping Costs & Finalization
              </h2>
              <p>
                Shipping costs depend on destination ZIP, product type/quantity, crating requirements, and delivery access (liftgate, appointment, residential vs commercial).
                Final shipping charges are confirmed after order review and prior to shipment.
              </p>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Crating & Handling
              </h2>
              <p>
                Certain items require professional crating for safe transit, including glass doors, glass panels, mirrors, and some oversized windows. Crating/handling fees may be listed separately.
              </p>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                White-Glove Delivery (Optional)
              </h2>
              <p>
                White-glove delivery may be available for select products. When selected, it typically includes scheduled delivery, inside placement, and uncrating. Availability and pricing depend on destination and site conditions.
              </p>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Delivery Timeframes
              </h2>
              <p>
                Transit time varies by destination and carrier schedules. Production/lead time (if applicable) is separate from transit time.
              </p>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Inspection & Damage Claims
              </h2>
              <p>
                All shipments are insured. Customers must inspect deliveries upon arrival.
              </p>
              <ul>
                <li>
                  If there is visible damage, it must be noted on the delivery receipt before signing.
                </li>
                <li>
                  Report concealed damage within 48 hours of delivery with photos of packaging, product, and labels.
                </li>
                <li>
                  Failure to document damage at delivery may impact claim eligibility.
                </li>
              </ul>

              <h2 className={isDark ? 'text-white' : 'text-gray-800'}>
                Questions
              </h2>
              <p>
                <a href="mailto:sales@develloinc.com" className={isDark ? 'text-blue-400' : 'text-blue-600'}>sales@develloinc.com</a>
              </p>

              <h2 className={`mt-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Product Disclaimer
              </h2>
              <p>
                Product images, specifications, measurements, finishes, and availability are provided for general reference and may vary by production batch or manufacturer updates. Customers are responsible for verifying dimensions, compatibility, local code requirements, and installation conditions prior to purchase. Devello is not responsible for errors arising from incorrect measurements, jobsite conditions, or installation. Shipping estimates are non-binding and final freight charges are confirmed after order review.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

