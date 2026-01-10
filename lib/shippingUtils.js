// Shipping profile rules and estimation logic

export const ShippingProfileCode = {
  INTERIOR_WOOD_DOOR: 'INTERIOR_WOOD_DOOR',
  METAL_GLASS_DOOR: 'METAL_GLASS_DOOR',
  WINDOW_STANDARD: 'WINDOW_STANDARD',
  GLASS_PANEL_MIRROR: 'GLASS_PANEL_MIRROR',
};

export const DeliveryAccess = {
  RESIDENTIAL: 'RESIDENTIAL',
  COMMERCIAL_DOCK: 'COMMERCIAL_DOCK',
  COMMERCIAL_NO_DOCK: 'COMMERCIAL_NO_DOCK',
  CONSTRUCTION_SITE: 'CONSTRUCTION_SITE',
};

export const DeliveryType = {
  CURBSIDE: 'CURBSIDE',
  WHITE_GLOVE: 'WHITE_GLOVE',
};

// Shipping profile rules
export const SHIPPING_PROFILE_RULES = {
  [ShippingProfileCode.INTERIOR_WOOD_DOOR]: {
    cratingFee: 0,
    whiteGloveAllowed: true,
  },
  [ShippingProfileCode.METAL_GLASS_DOOR]: {
    cratingFee: 300, // Default midpoint of 250-450 range
    whiteGloveAllowed: true,
  },
  [ShippingProfileCode.WINDOW_STANDARD]: {
    cratingFee: 0,
    whiteGloveAllowed: true,
  },
  [ShippingProfileCode.GLASS_PANEL_MIRROR]: {
    cratingFee: 350, // Default midpoint of 300-600 range
    whiteGloveAllowed: true,
  },
};

// Default white glove fee
export const DEFAULT_WHITE_GLOVE_FEE = 495;

// Base estimates by ZIP zone (first digit)
const ZIP_ZONE_ESTIMATES = {
  '0': { low: 350, high: 650 },   // East / Northeast
  '1': { low: 350, high: 650 },   // East / Northeast
  '2': { low: 350, high: 650 },   // East / Northeast
  '3': { low: 700, high: 1200 },  // Southeast / Midwest
  '4': { low: 700, high: 1200 },  // Southeast / Midwest
  '5': { low: 700, high: 1200 },  // Southeast / Midwest
  '6': { low: 900, high: 1600 },  // Central / Mountain
  '7': { low: 900, high: 1600 },  // Central / Mountain
  '8': { low: 1200, high: 2200 }, // West
  '9': { low: 1200, high: 2200 }, // West
};

/**
 * Get ZIP zone from ZIP code (first digit)
 */
function getZipZone(zip) {
  if (!zip || zip.length < 1) return null;
  const firstDigit = zip[0];
  return firstDigit in ZIP_ZONE_ESTIMATES ? firstDigit : null;
}

/**
 * Calculate shipping estimate based on ZIP, delivery access, and options
 */
export function calculateShippingEstimate({
  zip,
  deliveryAccess,
  liftgate = false,
  appointment = false,
  shippingProfile,
  deliveryType = DeliveryType.CURBSIDE,
}) {
  const zipZone = getZipZone(zip);
  if (!zipZone) {
    return {
      estimateLow: null,
      estimateHigh: null,
      cratingFee: null,
      whiteGloveFee: null,
      error: 'Invalid ZIP code',
    };
  }

  // Get base estimate from zone
  const baseEstimate = ZIP_ZONE_ESTIMATES[zipZone];
  let estimateLow = baseEstimate.low;
  let estimateHigh = baseEstimate.high;

  // Apply adjustments
  if (deliveryAccess === DeliveryAccess.RESIDENTIAL) {
    estimateLow += 100;
    estimateHigh += 100;
  }

  if (liftgate) {
    estimateLow += 125;
    estimateHigh += 125;
  }

  if (appointment) {
    estimateLow += 75;
    estimateHigh += 75;
  }

  // Get profile rules
  const profileRules = shippingProfile
    ? SHIPPING_PROFILE_RULES[shippingProfile]
    : null;

  // Calculate crating fee
  const cratingFee = profileRules?.cratingFee || 0;

  // Calculate white glove fee
  const whiteGloveFee =
    deliveryType === DeliveryType.WHITE_GLOVE &&
    profileRules?.whiteGloveAllowed
      ? DEFAULT_WHITE_GLOVE_FEE
      : null;

  return {
    estimateLow,
    estimateHigh,
    cratingFee: cratingFee > 0 ? cratingFee : null,
    whiteGloveFee,
    error: null,
  };
}

/**
 * Check if white glove is allowed for a shipping profile
 */
export function isWhiteGloveAllowed(shippingProfile) {
  if (!shippingProfile) return false;
  const profileRules = SHIPPING_PROFILE_RULES[shippingProfile];
  return profileRules?.whiteGloveAllowed || false;
}

/**
 * Check if white glove is recommended for a shipping profile
 */
export function isWhiteGloveRecommended(shippingProfile) {
  return (
    shippingProfile === ShippingProfileCode.GLASS_PANEL_MIRROR ||
    shippingProfile === ShippingProfileCode.METAL_GLASS_DOOR
  );
}

