import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';

export default function Privacy() {
  const [isDark, setIsDark] = useState(true);

  return (
    <>
      <Head>
        <title>Privacy Policy - Devello Inc</title>
        <meta name="description" content="Privacy Policy for Devello Inc - How we collect, use, and protect your information." />
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
              Privacy Policy
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
              <h2>1. Information We Collect</h2>
              <p>
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
              </p>
              
              <h3>Personal Information</h3>
              <ul>
                <li>Name and email address (when you create an account)</li>
                <li>Profile information and preferences</li>
                <li>Payment and billing information (processed securely by third-party providers)</li>
                <li>Project specifications and requirements (for software development services)</li>
                <li>Business information (for consulting and partnership services)</li>
                <li>Communication records (support requests, feedback, project communications)</li>
              </ul>

              <h3>Usage Information</h3>
              <ul>
                <li>Images you upload for processing</li>
                <li>Service usage patterns and preferences</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
              </ul>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our services (AI image editing and software development)</li>
                <li>Process your images using AI algorithms</li>
                <li>Process payments and manage subscriptions</li>
                <li>Coordinate and deliver software development projects</li>
                <li>Send you technical notices, support messages, and project updates</li>
                <li>Respond to your comments, questions, and service requests</li>
                <li>Monitor and analyze usage patterns to improve our services</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations and enforce our agreements</li>
              </ul>

              <h2>3. Image Processing and Storage</h2>
              <p>
                When you upload images to our AI editing services, we temporarily store and process them to provide AI-enhanced results. We do not use your images to train our AI models or share them with third parties without your explicit consent.
              </p>
              <ul>
                <li>Images are processed in real-time and deleted after processing</li>
                <li>We may temporarily cache images for performance optimization</li>
                <li>Project images and specifications for software development services are retained as necessary to fulfill service agreements</li>
                <li>You can request deletion of any stored images at any time, subject to our retention obligations for active projects</li>
                <li>We implement industry-standard security measures to protect your images and project data</li>
              </ul>

              <h2>4. Information Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:</p>
              <ul>
                <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating our service (e.g., payment processors, cloud storage providers)</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, user information may be transferred as part of the business assets</li>
              </ul>

              <h2>5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication systems</li>
                <li>Secure data centers with physical security measures</li>
              </ul>

              <h2>6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience and analyze service usage. You can control cookie settings through your browser preferences.
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for basic service functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>

              <h2>7. Third-Party Services</h2>
              <p>
                Our service integrates with third-party providers for specific functions:
              </p>
              <ul>
                <li><strong>Authentication:</strong> Google OAuth for secure login</li>
                <li><strong>Payments:</strong> Stripe for secure payment processing</li>
                <li><strong>Analytics:</strong> Anonymous usage analytics to improve our service</li>
              </ul>

              <h2>8. Data Retention</h2>
              <p>
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy:
              </p>
              <ul>
                <li>Account information: Until you delete your account</li>
                <li>Processed images: Deleted immediately after processing</li>
                <li>Usage data: Retained for analytics and service improvement</li>
                <li>Support communications: Retained for customer service purposes</li>
              </ul>

              <h2>9. Your Rights and Choices</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              </ul>

              <h2>10. Children&apos;s Privacy</h2>
              <p>
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
              </p>

              <h2>11. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
              </p>

              <h2>12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              </p>

              <h2>13. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul>
                <li>Email: info@develloinc.com</li>
                <li>Sales & Support: sales@develloinc.com</li>
              </ul>

              <div className={`mt-8 p-4 rounded-lg ${
                isDark 
                  ? 'bg-blue-500/10 border border-blue-500/20' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                <p className={`text-sm ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  <strong>Your Privacy Matters:</strong> We are committed to protecting your privacy and being transparent about our data practices. If you have any concerns or questions, please don&apos;t hesitate to contact us.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
