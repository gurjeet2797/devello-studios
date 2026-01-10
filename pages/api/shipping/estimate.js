import { PrismaClient } from '@prisma/client';
import {
  calculateShippingEstimate,
  DeliveryAccess,
  DeliveryType,
  ShippingProfileCode,
} from '../../../lib/shippingUtils';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      zip,
      deliveryAccess,
      liftgate = false,
      appointment = false,
      deliveryType = DeliveryType.CURBSIDE,
      productId,
      orderId,
      email,
      notes,
    } = req.body;

    // Validation
    if (!zip || !/^\d{5}(-\d{4})?$/.test(zip.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Valid ZIP code is required (5 digits)' });
    }

    if (!deliveryAccess || !Object.values(DeliveryAccess).includes(deliveryAccess)) {
      return res.status(400).json({ error: 'Valid delivery access type is required' });
    }

    // Get product shipping profile if productId provided
    let shippingProfile = null;
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { shippingProfile: true },
      });
      shippingProfile = product?.shippingProfile;
    }

    // Validate white glove selection
    let finalDeliveryType = deliveryType;
    if (deliveryType === DeliveryType.WHITE_GLOVE) {
      // Check if white glove is allowed for this profile
      if (!shippingProfile) {
        // No profile means we can't determine if white glove is allowed
        // Default to curbside for safety
        finalDeliveryType = DeliveryType.CURBSIDE;
      } else {
        // Check if white glove is allowed (all our profiles allow it, but check anyway)
        const profileRules = {
          [ShippingProfileCode.INTERIOR_WOOD_DOOR]: { whiteGloveAllowed: true },
          [ShippingProfileCode.METAL_GLASS_DOOR]: { whiteGloveAllowed: true },
          [ShippingProfileCode.WINDOW_STANDARD]: { whiteGloveAllowed: true },
          [ShippingProfileCode.GLASS_PANEL_MIRROR]: { whiteGloveAllowed: true },
        };
        if (!profileRules[shippingProfile]?.whiteGloveAllowed) {
          finalDeliveryType = DeliveryType.CURBSIDE;
        }
      }
    }

    // Calculate estimate
    const estimate = calculateShippingEstimate({
      zip: zip.replace(/\s/g, ''),
      deliveryAccess,
      liftgate: Boolean(liftgate),
      appointment: Boolean(appointment),
      shippingProfile,
      deliveryType: finalDeliveryType,
    });

    if (estimate.error) {
      return res.status(400).json({ error: estimate.error });
    }

    // Store shipping request
    const shippingRequest = await prisma.shippingRequest.create({
      data: {
        zip: zip.replace(/\s/g, ''),
        deliveryAccess,
        liftgate: Boolean(liftgate),
        appointment: Boolean(appointment),
        deliveryType: finalDeliveryType,
        productId: productId || null,
        orderId: orderId || null,
        email: email || null,
        notes: notes || null,
        estimateLow: estimate.estimateLow,
        estimateHigh: estimate.estimateHigh,
        cratingFee: estimate.cratingFee,
        whiteGloveFee: estimate.whiteGloveFee,
        status: 'PENDING_REVIEW',
      },
    });

    return res.status(200).json({
      success: true,
      requestId: shippingRequest.id,
      estimateLow: estimate.estimateLow,
      estimateHigh: estimate.estimateHigh,
      cratingFee: estimate.cratingFee,
      whiteGloveFee: estimate.whiteGloveFee,
      deliveryType: finalDeliveryType,
    });
  } catch (error) {
    console.error('Shipping estimate error:', error);
    return res.status(500).json({
      error: 'Failed to calculate shipping estimate',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

