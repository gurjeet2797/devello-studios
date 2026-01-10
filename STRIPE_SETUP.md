# Stripe Setup Guide

This guide will help you set up Stripe payments and subscription management for Devello Inc.

## 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Complete your account verification
3. Get your API keys from the Stripe Dashboard

## 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..." # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET="whsec_..." # Webhook secret (created in step 4)
STRIPE_BASIC_PRICE_ID="price_..." # Basic plan price ID (created in step 3)
STRIPE_PRO_PRICE_ID="price_..." # Pro plan price ID (created in step 3)
STRIPE_SINGLE_UPLOAD_PRICE_ID="price_..." # Single upload price ID (created in step 3)
```

## 3. Create Products and Prices

1. Go to your Stripe Dashboard → Products
2. Create three products:

### Basic Plan
- **Name**: Basic
- **Price**: $4.99/month
- **Billing**: Recurring
- **Interval**: Monthly
- Copy the Price ID and add it to `STRIPE_BASIC_PRICE_ID`

### Pro Plan
- **Name**: Pro
- **Price**: $9.99/month
- **Billing**: Recurring
- **Interval**: Monthly
- Copy the Price ID and add it to `STRIPE_PRO_PRICE_ID`

### Single Upload
- **Name**: Single Upload
- **Price**: $2.99
- **Billing**: One-time
- Copy the Price ID and add it to `STRIPE_SINGLE_UPLOAD_PRICE_ID`

## 4. Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://your-domain.com/api/webhooks/stripe`
4. Select the following events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET`

## 5. Database Setup

Run the database migration to create the required tables:

```bash
npx prisma migrate dev
```

## 6. Test the Integration

1. Start your development server: `npm run dev`
2. Sign in to your application
3. Try uploading images to test the upload counter
4. When you reach the limit, the subscription modal should appear
5. Test the subscription flow with Stripe test cards

## 7. Test Cards

Use these test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## 8. Production Deployment

1. Switch to Stripe live mode
2. Update environment variables with live keys
3. Update webhook endpoint URL to your production domain
4. Test the complete flow in production

## Features Implemented

- ✅ Upload counter (5 free uploads)
- ✅ Subscription modal with Pro ($19/month) and Enterprise ($49/month) plans
- ✅ Stripe checkout integration
- ✅ Webhook handling for subscription events
- ✅ User profile page with upload stats and subscription management
- ✅ Automatic upload limit enforcement
- ✅ Subscription status tracking

## API Endpoints

- `POST /api/upload/record` - Record an upload and check limits
- `GET /api/user/profile` - Get user profile and upload stats
- `PUT /api/user/profile` - Update user profile
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout session
- `POST /api/subscriptions/create-portal-session` - Create Stripe portal session
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

## Components

- `UploadCounter` - Displays upload usage and prompts for subscription
- `SubscriptionModal` - Subscription plan selection and payment
- Profile page - User data, upload stats, and subscription management
