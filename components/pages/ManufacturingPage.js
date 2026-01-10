import React from 'react';
import { motion } from 'framer-motion';
import ServicePageTemplate from './ServicePageTemplate';
import CustomBuildsButton from '../CustomBuildsAd';
import ProductShowcase from '../manufacturing/ProductShowcase';
import { useTheme } from '../Layout';

// Custom hook to safely use theme context
function useSafeTheme() {
  const themeContext = useTheme();
  return themeContext ? themeContext.isDark : true;
}

export default function ManufacturingPage({ canceled }) {
  const isDark = useSafeTheme();

  return (
    <ServicePageTemplate
      title="Store."
      subtitle="Browse our curated product collection tailored to your needs. We work with trusted local carpenters, glass & metal fabricators to offer highly custom products."
      features={[]}
      serviceType="store"
      colorScheme="blue"
      showForm={false}
      showPartners={false}
      showFeatures={false}
      belowTitleComponent={<CustomBuildsButton isDark={isDark} formTitle="create product" />}
      belowFormComponent={
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-4 md:px-6 lg:px-8">
          {canceled && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 p-4 rounded-lg ${
                isDark ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <p className={isDark ? 'text-yellow-300' : 'text-yellow-800'}>
                Payment was canceled. You can continue browsing our products below.
              </p>
            </motion.div>
          )}
          <ProductShowcase />
        </div>
      }
    />
  );
}

