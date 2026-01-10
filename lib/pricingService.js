/**
 * Centralized Pricing Service
 * Handles all pricing logic and provides consistent pricing across the application
 */

// Environment-based pricing configuration
const PRICING_CONFIG = {
  BASIC: {
    name: 'Basic Plan',
    priceId: process.env.STRIPE_BASIC_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    monthlyPrice: 599, // $5.99 in cents
    uploadLimit: 30, // 5 free + 25 basic
    features: [
      '30 uploads per month (5 free + 25 basic)',
      'Standard processing',
      'Basic editing tools',
      'Email support'
    ]
  },
  PRO: {
    name: 'Pro Plan',
    priceId: process.env.STRIPE_PRO_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    monthlyPrice: 999, // $9.99 in cents (corrected from 1999)
    uploadLimit: 60, // 5 free + 55 pro
    features: [
      '60 uploads per month (5 free + 55 pro)',
      'Priority processing',
      'Advanced editing tools',
      'Email support',
      'Reference image search',
      'Batch processing'
    ]
  },
  FREE: {
    name: 'Free Plan',
    priceId: null,
    monthlyPrice: 0,
    uploadLimit: 5,
    features: [
      '5 uploads per month',
      'Basic processing',
      'Standard editing tools'
    ]
  }
};

export class PricingService {
  /**
   * Get pricing information for a specific plan
   */
  static getPlanPricing(planType) {
    const plan = PRICING_CONFIG[planType?.toUpperCase()] || PRICING_CONFIG.FREE;
    return {
      ...plan,
      displayPrice: this.formatPrice(plan.monthlyPrice),
      yearlyPrice: plan.monthlyPrice * 12,
      displayYearlyPrice: this.formatPrice(plan.monthlyPrice * 12)
    };
  }

  /**
   * Get all available plans with pricing
   */
  static getAllPlans() {
    return Object.keys(PRICING_CONFIG).map(planType => 
      this.getPlanPricing(planType)
    );
  }

  /**
   * Format price from cents to currency string
   */
  static formatPrice(priceInCents, currency = 'USD') {
    if (typeof priceInCents !== 'number') return '$0.00';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase()
      }).format(priceInCents / 100);
    } catch (error) {
      console.warn('Unable to format price:', { priceInCents, currency, error });
      return `$${(priceInCents / 100).toFixed(2)}`;
    }
  }

  /**
   * Get upgrade options for current plan
   */
  static getUpgradeOptions(currentPlan) {
    switch (currentPlan?.toLowerCase()) {
      case 'free':
        return {
          canUpgrade: true,
          upgradeTo: 'basic',
          upgradeText: 'Upgrade to Basic Plan',
          upgradeDescription: 'Get 20 additional uploads per month',
          price: this.getPlanPricing('BASIC')
        };
      case 'basic':
        return {
          canUpgrade: true,
          upgradeTo: 'pro',
          upgradeText: 'Upgrade to Pro Plan',
          upgradeDescription: 'Get 50 additional uploads per month and advanced features',
          price: this.getPlanPricing('PRO')
        };
      case 'pro':
        return {
          canUpgrade: false,
          upgradeText: 'You\'re on our highest plan',
          upgradeDescription: 'Request new features to be added',
          price: this.getPlanPricing('PRO')
        };
      case 'canceled':
        // Canceled users can still upgrade if their period hasn't ended
        return {
          canUpgrade: true,
          upgradeTo: 'pro',
          upgradeText: 'Upgrade to Pro Plan',
          upgradeDescription: 'Get 50 additional uploads per month and advanced features',
          price: this.getPlanPricing('PRO')
        };
      default:
        return {
          canUpgrade: true,
          upgradeTo: 'basic',
          upgradeText: 'Upgrade to Basic Plan',
          upgradeDescription: 'Get 20 additional uploads per month',
          price: this.getPlanPricing('BASIC')
        };
    }
  }

  /**
   * Get plan display name
   */
  static getPlanDisplayName(planType) {
    const plan = PRICING_CONFIG[planType?.toUpperCase()] || PRICING_CONFIG.FREE;
    return plan.name;
  }

  /**
   * Get upload limit for plan
   */
  static getUploadLimit(planType) {
    const plan = PRICING_CONFIG[planType?.toUpperCase()] || PRICING_CONFIG.FREE;
    return plan.uploadLimit;
  }

  /**
   * Get features for plan
   */
  static getPlanFeatures(planType) {
    const plan = PRICING_CONFIG[planType?.toUpperCase()] || PRICING_CONFIG.FREE;
    return plan.features;
  }

  /**
   * Generate subscription payment history entry
   */
  static generateSubscriptionPayment(subscription) {
    if (!subscription) return null;

    const planType = subscription.plan_type?.toUpperCase();
    const plan = PRICING_CONFIG[planType] || PRICING_CONFIG.FREE;
    
    if (plan.monthlyPrice === 0) return null; // Don't show free plan in payments

    return {
      id: `sub-${subscription.stripe_subscription_id || 'unknown'}`,
      createdAt: subscription.current_period_start || new Date(),
      purchaseType: 'subscription',
      amount: plan.monthlyPrice,
      currency: 'usd',
      status: 'completed',
      planType: subscription.plan_type,
      description: `${plan.name} Purchased`,
      uploadLimit: plan.uploadLimit
    };
  }

  /**
   * Validate pricing configuration
   */
  static validateConfiguration() {
    const issues = [];
    
    const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    
    if (!basicPriceId) {
      issues.push('STRIPE_BASIC_PRICE_ID environment variable is missing');
    }
    
    if (!proPriceId) {
      issues.push('STRIPE_PRO_PRICE_ID environment variable is missing');
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ [PRICING_SERVICE] Configuration issues:', issues);
    } else {
    }
    
    return issues.length === 0;
  }
}

// Validate configuration on module load
PricingService.validateConfiguration();

export default PricingService;
