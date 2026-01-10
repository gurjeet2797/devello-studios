# Apple Pay Setup Guide for Browser-Based App

This guide will help you set up Apple Pay support for your browser-based Devello Inc application.

## Overview

Apple Pay is now enabled for all payment flows in your application:
- ✅ Subscription payments (Basic & Pro plans)
- ✅ One-time upload purchases
- ✅ Google Pay is also enabled for broader mobile support

## What's Already Configured

### 1. Stripe Integration
- ✅ Apple Pay and Google Pay added to all checkout sessions
- ✅ Payment method types: `['card', 'apple_pay', 'google_pay']`
- ✅ Apple Pay explicitly enabled in payment options
- ✅ Google Pay explicitly enabled in payment options

### 2. Browser Support
Apple Pay works in Safari on:
- ✅ macOS (desktop and mobile)
- ✅ iOS (iPhone and iPad)
- ✅ iPadOS

Google Pay works in:
- ✅ Chrome (desktop and mobile)
- ✅ Edge (desktop and mobile)
- ✅ Samsung Internet (Android)

## What You Need to Do

### 1. Stripe Dashboard Configuration

#### Enable Apple Pay in Stripe:
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Payment methods**
3. Find **Apple Pay** and click **Enable**
4. Complete the Apple Pay setup process:
   - Upload your domain verification file
   - Verify your domain ownership
   - Complete Apple's verification process

#### Enable Google Pay in Stripe:
1. In the same **Payment methods** section
2. Find **Google Pay** and click **Enable**
3. Complete the Google Pay setup process

### 2. Domain Verification

#### For Apple Pay:
1. **Download the verification file** from Stripe Dashboard
2. **Upload to your domain root** (e.g., `https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association`)
3. **Verify the file is accessible** via HTTPS
4. **Complete verification** in Stripe Dashboard

#### For Google Pay:
1. **Add your domain** to Google Pay allowed domains
2. **Verify domain ownership** through Google Search Console or DNS
3. **Complete verification** in Stripe Dashboard

### 3. SSL Certificate Requirements

**Critical**: Apple Pay requires HTTPS for all domains:
- ✅ Your production domain must have a valid SSL certificate
- ✅ All subdomains must have valid SSL certificates
- ✅ No mixed content (HTTP resources on HTTPS pages)

### 4. Testing Apple Pay

#### Test in Safari:
1. **Open Safari** on macOS or iOS
2. **Navigate to your app** (must be HTTPS)
3. **Try to make a payment**
4. **Apple Pay button should appear** if:
   - You have Apple Pay set up on your device
   - Your domain is verified
   - You're using Safari

#### Test in Chrome (Google Pay):
1. **Open Chrome** on any device
2. **Navigate to your app**
3. **Try to make a payment**
4. **Google Pay button should appear** if:
   - You have Google Pay set up
   - Your domain is verified

### 5. Production Deployment

#### Before going live:
1. **Verify all domains** in Stripe Dashboard
2. **Test on real devices** (not just simulators)
3. **Test with real payment methods** (use Stripe test mode first)
4. **Ensure HTTPS is working** on all pages

#### Environment Variables:
Make sure these are set in your production environment:
```env
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_BASIC_PRICE_ID="price_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_SINGLE_UPLOAD_PRICE_ID="price_..."
```

## Troubleshooting

### Apple Pay Not Showing:
1. **Check domain verification** in Stripe Dashboard
2. **Verify HTTPS** is working correctly
3. **Test in Safari** (Apple Pay only works in Safari)
4. **Check Apple Pay setup** on your device
5. **Verify SSL certificate** is valid and not expired

### Google Pay Not Showing:
1. **Check domain verification** in Stripe Dashboard
2. **Test in Chrome** or Edge
3. **Check Google Pay setup** on your device
4. **Verify payment amount** (Google Pay has minimum amounts)

### Payment Fails:
1. **Check Stripe logs** in Dashboard
2. **Verify webhook endpoints** are working
3. **Test with different payment methods**
4. **Check browser console** for errors

## Browser Compatibility

### Apple Pay:
- ✅ Safari on macOS 10.12+
- ✅ Safari on iOS 10.1+
- ✅ Safari on iPadOS 13+
- ❌ Chrome, Firefox, Edge (not supported)

### Google Pay:
- ✅ Chrome 61+
- ✅ Edge 79+
- ✅ Samsung Internet 6.0+
- ✅ Firefox 55+ (limited support)
- ❌ Safari (not supported)

## Security Considerations

1. **Always use HTTPS** in production
2. **Validate payments** on your backend
3. **Use webhooks** to confirm payment status
4. **Never store payment details** on your servers
5. **Implement proper error handling**

## Support

If you encounter issues:
1. **Check Stripe Dashboard** for error logs
2. **Test in different browsers** and devices
3. **Verify domain setup** is correct
4. **Contact Stripe support** for payment method issues

## Next Steps

1. **Complete domain verification** in Stripe Dashboard
2. **Test on real devices** with real payment methods
3. **Deploy to production** with HTTPS
4. **Monitor payment success rates** in Stripe Dashboard

Your Apple Pay and Google Pay integration is now ready! Users will see the appropriate payment buttons based on their browser and device capabilities.
