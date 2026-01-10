# Shipping Calculation Recommendations for Large Windows & Heavy Products

## Overview
For large windows and heavy products, you'll need a specialized freight/logistics solution. Standard shipping APIs (like EasyPost, Shippo) are designed for small packages and won't work well for oversized, heavy items.

## Recommended Solutions

### 1. **EasyPost Freight API** (Recommended for Integration)
- **Best for**: Automated rate calculation and label generation
- **Pros**: 
  - Multi-carrier support (FedEx Freight, UPS Freight, etc.)
  - Real-time rate quotes
  - API integration similar to standard shipping
  - Handles LTL (Less-Than-Truckload) freight
- **Cons**: 
  - Requires freight account setup with carriers
  - May need additional insurance for high-value items
- **Setup**: https://www.easypost.com/freight
- **Cost**: Pay-per-use pricing model

### 2. **TForce Freight Shipping API**
- **Best for**: Dedicated freight carrier integration
- **Pros**:
  - Specialized for freight shipping
  - Detailed shipping parameters (Bill of Lading, shipping instructions)
  - Good for large/heavy items
- **Cons**:
  - Single carrier (TForce)
  - May require direct account setup
- **Setup**: https://www.tforcefreight.com/downloads/Shipping-API-User-Manual-V1.pdf

### 3. **uShip API** (Marketplace Approach)
- **Best for**: Connecting with multiple freight carriers
- **Pros**:
  - Marketplace connects you with various carriers
  - Competitive pricing through bidding
  - Good for one-off shipments
- **Cons**:
  - Less predictable pricing
  - May require manual approval for quotes
- **Setup**: https://www.uship.com/api/

### 4. **Custom Freight Calculator** (Manual/Quote-Based)
- **Best for**: High-value, custom orders
- **Approach**:
  - Collect shipping address during checkout
  - Calculate estimated shipping based on:
    - Distance (origin to destination)
    - Weight and dimensions
    - Product type (fragile, oversized)
  - Show "Shipping calculated at checkout" or "Contact for quote"
  - For large orders, require manual quote approval
- **Implementation**:
  ```javascript
  // Example shipping calculation logic
  const calculateShipping = (products, destination) => {
    const totalWeight = products.reduce((sum, p) => sum + (p.weight * p.quantity), 0);
    const totalDimensions = calculateTotalDimensions(products);
    const distance = calculateDistance(origin, destination);
    
    // Base rate + weight rate + distance rate
    return baseRate + (totalWeight * weightRate) + (distance * distanceRate);
  };
  ```

## Implementation Strategy

### Phase 1: Manual Quotes (Quick Start)
1. **Collect shipping address** during checkout ✅ (Already implemented)
2. **Show "Shipping calculated separately"** message
3. **Admin calculates shipping** manually after order
4. **Contact customer** with shipping quote
5. **Update order** with shipping cost

### Phase 2: Automated Calculation (Recommended)
1. **Integrate EasyPost Freight API** or similar
2. **Calculate shipping** during checkout:
   - Collect product dimensions/weight from database
   - Calculate total shipment weight/dimensions
   - Get real-time quote from freight API
   - Display shipping cost before payment
3. **Store shipping cost** in order metadata
4. **Generate shipping labels** after payment confirmation

### Phase 3: Advanced Features
1. **Multiple shipping options** (Standard, Expedited, White Glove)
2. **Delivery date estimates**
3. **Tracking integration**
4. **Insurance options** for high-value items

## Product Data Requirements

To calculate shipping, you'll need for each product:
- **Weight** (lbs)
- **Dimensions** (Length × Width × Height in inches)
- **Fragility** (affects packaging/cost)
- **Special handling** requirements

### Database Schema Addition
```prisma
model Product {
  // ... existing fields
  weight_lbs        Float?
  length_inches     Float?
  width_inches      Float?
  height_inches     Float?
  requires_freight  Boolean @default(false)
  shipping_class    String? // e.g., "fragile", "oversized", "standard"
}
```

## API Integration Example (EasyPost Freight)

```javascript
// pages/api/shipping/calculate.js
import EasyPost from '@easypost/api';

const client = new EasyPost(process.env.EASYPOST_API_KEY);

export default async function handler(req, res) {
  const { products, destination } = req.body;
  
  // Calculate total weight and dimensions
  const shipment = {
    to_address: {
      street1: destination.address_line1,
      city: destination.city,
      state: destination.state,
      zip: destination.zip_code,
      country: destination.country,
    },
    from_address: {
      // Your warehouse address
      street1: process.env.WAREHOUSE_STREET,
      city: process.env.WAREHOUSE_CITY,
      state: process.env.WAREHOUSE_STATE,
      zip: process.env.WAREHOUSE_ZIP,
      country: 'US',
    },
    parcel: {
      length: totalLength,
      width: totalWidth,
      height: totalHeight,
      weight: totalWeight,
    },
    carrier_accounts: [process.env.FREIGHT_CARRIER_ACCOUNT_ID],
  };
  
  try {
    const rates = await client.Shipment.create(shipment);
    return res.json({ 
      success: true, 
      rates: rates.rates,
      cheapest: rates.lowestRate(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

## Cost Considerations

1. **Freight shipping is expensive** - expect $200-$2000+ for large windows
2. **Consider offering**:
   - Free shipping threshold (e.g., orders over $5000)
   - Customer pickup option (discount)
   - Multiple shipping tiers (Standard, Expedited, White Glove)
3. **Factor into pricing** - may need to adjust product prices to account for shipping

## Next Steps

1. ✅ **Shipping address collection** - DONE
2. **Add product dimensions/weight** to database
3. **Choose freight API** (recommend EasyPost Freight)
4. **Implement shipping calculator** endpoint
5. **Update checkout flow** to show shipping costs
6. **Test with real orders**

## Alternative: Hybrid Approach

For immediate launch:
- **Small items** (< 50 lbs): Use standard shipping (EasyPost, Shippo)
- **Large items** (> 50 lbs): Show "Freight shipping - quote required"
- **Contact customer** after order for freight quote
- **Update order** with shipping cost before fulfillment

This allows you to launch quickly while building out automated freight calculation.

