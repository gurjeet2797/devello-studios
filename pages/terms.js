import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';

export default function Terms() {
  const [isDark, setIsDark] = useState(true);

  return (
    <>
      <Head>
        <title>Terms of Service - Devello Inc</title>
        <meta name="description" content="Terms of Service for Devello Inc - Software development services and digital solutions." />
      </Head>

      <div className={`min-h-screen py-12 transition-colors duration-700 ${
        isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 pt-12"
          >
            <h1 className={`text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-800'
            }`}>
              Terms of Service
            </h1>
            <p className={`text-lg ${
              isDark ? 'text-white/70' : 'text-gray-600'
            }`}>
              Last updated: {new Date().toLocaleDateString()}
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
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using Devello Inc (&quot;the Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                Devello Studios provides AI-powered image editing and enhancement tools. Our services include but are not limited to:
              </p>
              <ul>
                <li>AI-powered image editing tools (lighting adjustments, general editing, AI-assisted editing)</li>
                <li>Software development services</li>
              </ul>
              <p>
                Services are provided on a subscription, pay-per-use, or project-based basis as specified in individual service agreements.
              </p>

              <h2>3. User Accounts</h2>
              <p>
                To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h2>4. Acceptable Use</h2>
              <p>
                You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>
              <ul>
                <li>Upload or process illegal, harmful, or inappropriate content</li>
                <li>Attempt to reverse engineer or compromise the Service</li>
                <li>Use the Service for commercial purposes without proper authorization</li>
                <li>Share your account credentials with others</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>

              <h2>5. Content and Intellectual Property</h2>
              <p>
                You retain ownership of any content you upload to the Service, including images, project specifications, and business information. By using the Service, you grant Devello Inc a limited, non-exclusive license to process your content solely for the purpose of providing the requested services. You are responsible for ensuring you have the right to upload and process any content you submit, including obtaining necessary permissions for images, designs, or proprietary information.
              </p>
              <p>
                For software development services, work product and deliverables are subject to the terms specified in individual service agreements or contracts.
              </p>

              <h2>6. AI-Generated Content and Service Results</h2>
              <p>
                Our AI-powered image editing tools use artificial intelligence to enhance and edit images. AI-generated results are for creative and marketing purposes only and should not be considered as professional photography or architectural documentation. Results may vary and are not guaranteed to meet specific requirements.
              </p>
              <p>
                For software development services, deliverables and outcomes are subject to the specifications and terms outlined in individual service agreements. We strive to meet agreed-upon specifications but cannot guarantee results beyond what is explicitly stated in service contracts.
              </p>

              <h2>7. Payment and Billing</h2>
              <p>
                Payment terms vary by service type:
              </p>
              <ul>
                <li><strong>Software Services:</strong> Subscription fees and one-time purchases are billed in advance. All fees are non-refundable unless otherwise specified.</li>
                <li><strong>Consulting Services:</strong> Fees are typically billed per session or project as specified in service agreements. Payment terms and refund policies are outlined in individual consultation contracts.</li>
              </ul>
              <p>
                We reserve the right to change pricing with 30 days&apos; notice to existing subscribers. For project-based services, pricing changes do not affect active contracts.
              </p>

              <h2>8. Privacy and Data</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information. By using the Service, you consent to the collection and use of information as described in our Privacy Policy.
              </p>

              <h2>9. Service Availability</h2>
              <p>
                We strive to maintain high service availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>

              <h2>10. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Devello Inc shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities.
              </p>

              <h2>11. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>

              <h2>12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>

              <h2>13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Devello Inc operates, without regard to conflict of law principles.
              </p>

              <h2>14. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <ul>
                <li>Email: info@develloinc.com</li>
                <li>Sales & Support: sales@develloinc.com</li>
              </ul>

              <div className={`mt-8 p-4 rounded-lg ${
                isDark 
                  ? 'bg-amber-500/10 border border-amber-500/20' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`text-sm ${
                  isDark ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  <strong>Note:</strong> These Terms of Service are effective as of the date of last update and apply to all users of Devello Inc. By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
