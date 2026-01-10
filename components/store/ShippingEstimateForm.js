"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../Layout';
import {
  DeliveryAccess,
  DeliveryType,
  isWhiteGloveAllowed,
  isWhiteGloveRecommended,
} from '../../lib/shippingUtils';
import { Loader2, Check } from 'lucide-react';

export default function ShippingEstimateForm({
  productId,
  shippingProfile,
  orderId,
  email,
  onEstimateComplete,
  className = '',
}) {
  const { isDark } = useTheme();
  const [zip, setZip] = useState('');
  const [deliveryAccess, setDeliveryAccess] = useState(DeliveryAccess.RESIDENTIAL);
  const [liftgate, setLiftgate] = useState(false);
  const [appointment, setAppointment] = useState(false);
  const [whiteGlove, setWhiteGlove] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState(null);

  const whiteGloveAllowed = shippingProfile ? isWhiteGloveAllowed(shippingProfile) : false;
  const whiteGloveRecommended = shippingProfile ? isWhiteGloveRecommended(shippingProfile) : false;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Shipping is coming soon - prevent form submission
    setError('Shipping estimates are coming soon. Please contact sales@develloinc.com for shipping inquiries.');
    return;
  };

  const formatPrice = (cents) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className={className}>
      {/* Coming Soon Notice */}
      <div className={`mb-6 p-4 rounded-lg ${
        isDark
          ? 'bg-blue-500/10 border border-blue-500/20'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isDark 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}>
            Coming Soon
          </span>
        </div>
        <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          Shipping estimates are coming soon. We're finalizing our shipping infrastructure. Please contact <a href="mailto:sales@develloinc.com" className="underline">sales@develloinc.com</a> for shipping inquiries.
        </p>
      </div>

      {!estimate ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ZIP Code */}
          <div>
            <label
              htmlFor="zip"
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}
            >
              ZIP Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="zip"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              required
              pattern="\d{5}"
              maxLength={5}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/5 border-white/20 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="12345"
            />
          </div>

          {/* Delivery Access */}
          <div>
            <label
              htmlFor="deliveryAccess"
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}
            >
              Delivery Access <span className="text-red-500">*</span>
            </label>
            <select
              id="deliveryAccess"
              value={deliveryAccess}
              onChange={(e) => setDeliveryAccess(e.target.value)}
              required
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/5 border-white/20 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value={DeliveryAccess.RESIDENTIAL}>Residential</option>
              <option value={DeliveryAccess.COMMERCIAL_DOCK}>Commercial (with dock)</option>
              <option value={DeliveryAccess.COMMERCIAL_NO_DOCK}>Commercial (no dock)</option>
              <option value={DeliveryAccess.CONSTRUCTION_SITE}>Construction Site</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className={`flex items-center space-x-2 cursor-pointer ${
              isDark ? 'text-white' : 'text-gray-700'
            }`}>
              <input
                type="checkbox"
                checked={liftgate}
                onChange={(e) => setLiftgate(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Liftgate required</span>
            </label>

            <label className={`flex items-center space-x-2 cursor-pointer ${
              isDark ? 'text-white' : 'text-gray-700'
            }`}>
              <input
                type="checkbox"
                checked={appointment}
                onChange={(e) => setAppointment(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Appointment scheduling required</span>
            </label>

            {whiteGloveAllowed && (
              <label className={`flex items-center space-x-2 cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}>
                <input
                  type="checkbox"
                  checked={whiteGlove}
                  onChange={(e) => setWhiteGlove(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  White-glove delivery
                  {whiteGloveRecommended && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 rounded-full">
                      Recommended
                    </span>
                  )}
                </span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-white' : 'text-gray-700'
              }`}
            >
              Additional Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-white/5 border-white/20 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Special delivery instructions, access codes, etc."
            />
          </div>

          {error && (
            <div className={`p-3 rounded-lg ${
              isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !zip}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
              isSubmitting || !zip
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:opacity-90'
            } ${
              isDark
                ? 'bg-blue-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating...
              </span>
            ) : (
              'Get Shipping Estimate'
            )}
          </button>
        </form>
      ) : (
        <div className={`p-6 rounded-lg ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center mb-4">
            <Check className={`w-5 h-5 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`text-lg font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Shipping Estimate
            </h3>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                Estimated Freight ({estimate.deliveryType === DeliveryType.WHITE_GLOVE ? 'White-Glove' : 'Curbside'}):
              </span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatPrice(estimate.estimateLow)} - {formatPrice(estimate.estimateHigh)}
              </span>
            </div>

            {estimate.cratingFee && (
              <div className="flex justify-between">
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  Crating & Handling:
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatPrice(estimate.cratingFee)}
                </span>
              </div>
            )}

            {estimate.whiteGloveFee && (
              <div className="flex justify-between">
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  White-Glove Upgrade:
                </span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  +{formatPrice(estimate.whiteGloveFee)}
                </span>
              </div>
            )}
          </div>

          <div className={`mt-4 p-3 rounded-lg ${
            isDark
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-amber-50 border border-amber-200'
          }`}>
            <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
              <strong>Note:</strong> Shipping costs shown are estimates. Final freight charges are confirmed after order review and prior to shipment.
            </p>
          </div>

          <button
            onClick={() => {
              setEstimate(null);
              setError(null);
            }}
            className={`mt-4 w-full py-2 px-4 rounded-lg font-medium transition-all ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Get New Estimate
          </button>
        </div>
      )}
    </div>
  );
}

