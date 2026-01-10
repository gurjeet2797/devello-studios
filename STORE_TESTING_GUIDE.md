# Store Testing Guide

## Pre-Testing Checklist

### ✅ Prerequisites
- [ ] All products synced to Stripe (check Stripe dashboard)
- [ ] `stripe_price_id` populated in database for products
- [ ] Environment variables configured (STRIPE_SECRET_KEY, DATABASE_URL, etc.)
- [ ] Email service configured (SMTP settings)
- [ ] Database migrations run (OrderUpdate table created)

### ✅ Verify Product Sync
```sql
-- Check products have stripe_price_id
SELECT id, name, stripe_price_id, price, status 
FROM products 
WHERE status = 'active' AND stripe_price_id IS NOT NULL;

-- Should return all active products with Stripe IDs
```

---

## 1. Product Catalog & Display Tests

### Test 1.1: Product Listing
- [ ] Navigate to store catalog page
- [ ] Verify all products display correctly
- [ ] Check product images load
- [ ] Verify prices display correctly
- [ ] Check product descriptions are visible
- [ ] Test product filtering/search (if applicable)

### Test 1.2: Product Details
- [ ] Click on a product
- [ ] Verify product details page loads
- [ ] Check all product information displays
- [ ] Verify "Add to Cart" or "Buy Now" buttons work
- [ ] Test product image zoom/gallery (if applicable)

### Test 1.3: Product Variants (if applicable)
- [ ] Test products with variants
- [ ] Verify variant selection works
- [ ] Check price updates for different variants
- [ ] Verify correct variant is added to cart

---

## 2. Shopping Cart Tests

### Test 2.1: Add to Cart
- [ ] Add single product to cart
- [ ] Add multiple products to cart
- [ ] Add same product multiple times (quantity)
- [ ] Verify cart count updates
- [ ] Check cart persists across page navigation

### Test 2.2: Cart Management
- [ ] View cart contents
- [ ] Update product quantities
- [ ] Remove products from cart
- [ ] Verify total price calculates correctly
- [ ] Test empty cart state

### Test 2.3: Cart Edge Cases
- [ ] Add product, then remove it from database (should handle gracefully)
- [ ] Add product with invalid stripe_price_id
- [ ] Test cart with very large quantities
- [ ] Test cart expiration/timeout

---

## 3. Checkout Flow Tests

### Test 3.1: Authenticated User Checkout
- [ ] Log in as user
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Verify user information pre-filled
- [ ] Enter shipping address
- [ ] Select payment method
- [ ] Complete payment with test card
- [ ] Verify order confirmation page
- [ ] Check order appears in client portal
- [ ] Verify order confirmation email received

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Test 3.2: Guest Checkout
- [ ] Add products to cart (not logged in)
- [ ] Proceed to checkout as guest
- [ ] Enter email address
- [ ] Enter shipping information
- [ ] Complete payment
- [ ] Verify order confirmation
- [ ] Check order tracking works with email
- [ ] Verify guest can access order via tracking link

### Test 3.3: Checkout Edge Cases
- [ ] Try checkout with empty cart (should prevent)
- [ ] Test with expired/invalid payment method
- [ ] Test with insufficient funds card
- [ ] Test checkout timeout/expiration
- [ ] Test multiple simultaneous checkouts
- [ ] Test checkout with product that was deleted
- [ ] Test checkout with product price changed mid-checkout

---

## 4. Payment Processing Tests

### Test 4.1: Successful Payments
- [ ] Test successful card payment
- [ ] Verify payment intent created in Stripe
- [ ] Check payment status updates in database
- [ ] Verify order status changes to "paid"
- [ ] Check Stripe webhook received (if applicable)

### Test 4.2: Failed Payments
- [ ] Test declined card payment
- [ ] Verify error message displays to user
- [ ] Check order not created on failure
- [ ] Verify cart still has items after failure
- [ ] Test payment retry flow

### Test 4.3: Payment Security
- [ ] Verify card details never stored in database
- [ ] Check payment data sent securely (HTTPS)
- [ ] Verify Stripe handles all sensitive data
- [ ] Test payment amount matches cart total exactly
- [ ] Verify currency is correct

---

## 5. Order Management Tests

### Test 5.1: Client Portal - View Orders
- [ ] Log in as user
- [ ] Navigate to client portal
- [ ] Verify all orders display
- [ ] Check order details are correct
- [ ] Verify order status displays correctly
- [ ] Test order filtering/sorting

### Test 5.2: Order Details Modal
- [ ] Click on an order
- [ ] Verify order details modal opens
- [ ] Check all order information displays
- [ ] Verify product information correct
- [ ] Check payment information displays
- [ ] Test order update history displays

### Test 5.3: Order Tracking (Guest)
- [ ] Use order tracking page
- [ ] Enter order number and email
- [ ] Verify order details display
- [ ] Test with invalid order number (should show error)
- [ ] Test with wrong email (should show error)
- [ ] Test with correct credentials (should show order)

---

## 6. Refund Request Flow Tests

### Test 6.1: Request Refund (Client)
- [ ] Log in as user with paid order
- [ ] Open order details modal
- [ ] Click "Request Refund" button
- [ ] Fill out refund request form
- [ ] Select refund reason
- [ ] Enter description (optional)
- [ ] Specify amount (optional, defaults to full)
- [ ] Submit refund request
- [ ] Verify refund request shows as "pending"
- [ ] Check refund request appears in order updates
- [ ] Verify admin receives email notification

### Test 6.2: Refund Request Edge Cases
- [ ] Try to request refund for unpaid order (should prevent)
- [ ] Try to request refund for already refunded order
- [ ] Test requesting refund larger than payment amount (should prevent)
- [ ] Test multiple refund requests for same order (should prevent)
- [ ] Test refund request with invalid order ID

### Test 6.3: Admin Refund Approval
- [ ] Log in as admin
- [ ] Navigate to order details
- [ ] View pending refund request
- [ ] Approve refund request
- [ ] Verify Stripe refund processed
- [ ] Check order status updates
- [ ] Verify client receives approval email
- [ ] Test refund rejection flow
- [ ] Verify client receives rejection email with notes

### Test 6.4: Refund Processing
- [ ] Verify refund amount matches request
- [ ] Check payment status updates to "refunded"
- [ ] Verify order status updates appropriately
- [ ] Test partial refunds
- [ ] Test full refunds
- [ ] Check Stripe dashboard shows refund

---

## 7. Order Messaging Tests

### Test 7.1: Client to Admin Messages
- [ ] Log in as user
- [ ] Open order details modal
- [ ] Navigate to messaging section
- [ ] Type message to admin
- [ ] Send message
- [ ] Verify message appears in order updates
- [ ] Check admin receives email notification
- [ ] Verify message timestamp displays

### Test 7.2: Admin to Client Messages
- [ ] Log in as admin
- [ ] Open order details
- [ ] Send update/message to client
- [ ] Verify message appears in order updates
- [ ] Check client receives email notification
- [ ] Verify message displays in client portal

### Test 7.3: Messaging Edge Cases
- [ ] Test sending empty message (should prevent)
- [ ] Test very long messages
- [ ] Test special characters in messages
- [ ] Test multiple rapid messages
- [ ] Verify messages persist after page refresh

---

## 8. Order Update History Tests

### Test 8.1: Update History Display
- [ ] View order with multiple updates
- [ ] Verify timeline displays correctly
- [ ] Check update types display (status, message, refund, shipping)
- [ ] Verify timestamps are correct
- [ ] Check update messages display properly
- [ ] Test chronological ordering

### Test 8.2: Update Creation
- [ ] Verify status changes create updates
- [ ] Check refund requests create updates
- [ ] Verify messages create updates
- [ ] Test shipping updates create entries
- [ ] Verify admin updates create entries

---

## 9. Email Notification Tests

### Test 9.1: Order Confirmation Email
- [ ] Complete a purchase
- [ ] Verify order confirmation email received
- [ ] Check email contains correct order details
- [ ] Verify links in email work (client portal, tracking)
- [ ] Test email formatting/design

### Test 9.2: Order Status Update Emails
- [ ] Admin updates order status
- [ ] Verify client receives status update email
- [ ] Check email contains correct information
- [ ] Verify links work correctly

### Test 9.3: Shipping Notification Emails
- [ ] Admin adds tracking information
- [ ] Send shipping notification
- [ ] Verify client receives shipping email
- [ ] Check tracking number displays correctly
- [ ] Verify tracking link works

### Test 9.4: Refund Notification Emails
- [ ] Request refund (client receives admin notification)
- [ ] Approve/reject refund (client receives status email)
- [ ] Verify all email links point to develloinc.com (not devello.studio)
- [ ] Check email content is accurate

### Test 9.5: Message Notification Emails
- [ ] Client sends message (admin receives notification)
- [ ] Admin sends message (client receives notification)
- [ ] Verify email contains message preview
- [ ] Check reply-to addresses work

---

## 10. Security Tests

### Test 10.1: Authentication & Authorization
- [ ] Test accessing client portal without login (should redirect)
- [ ] Try accessing other user's orders (should prevent)
- [ ] Test admin-only endpoints without admin access (should reject)
- [ ] Verify API endpoints require authentication
- [ ] Test token expiration handling

### Test 10.2: Input Validation
- [ ] Test SQL injection attempts in forms
- [ ] Test XSS attempts in user input
- [ ] Verify email validation
- [ ] Test invalid payment data handling
- [ ] Check amount validation (prevent negative, too large)

### Test 10.3: Payment Security
- [ ] Verify payment amounts match exactly (no rounding errors)
- [ ] Test payment with modified amounts (should reject)
- [ ] Verify webhook signature validation (if applicable)
- [ ] Check payment data never logged in plain text
- [ ] Test duplicate payment prevention

### Test 10.4: Data Access
- [ ] Verify users can only see their own orders
- [ ] Test guest order access with wrong email
- [ ] Check admin can see all orders
- [ ] Verify sensitive data (payment details) not exposed
- [ ] Test order number enumeration prevention

---

## 11. Edge Cases & Error Handling

### Test 11.1: Database Errors
- [ ] Test with database connection loss
- [ ] Verify graceful error handling
- [ ] Check user-friendly error messages
- [ ] Test transaction rollback on errors

### Test 11.2: Stripe API Errors
- [ ] Test with invalid Stripe key
- [ ] Simulate Stripe API timeout
- [ ] Test with Stripe rate limiting
- [ ] Verify error messages are user-friendly

### Test 11.3: Product Availability
- [ ] Test purchasing product that becomes inactive
- [ ] Test purchasing product that's deleted
- [ ] Verify price changes don't affect in-progress checkout
- [ ] Test product out of stock handling

### Test 11.4: Network Issues
- [ ] Test with slow network connection
- [ ] Test with intermittent connectivity
- [ ] Verify timeout handling
- [ ] Check retry mechanisms

### Test 11.5: Concurrent Operations
- [ ] Test multiple users purchasing same product
- [ ] Test simultaneous refund requests
- [ ] Verify race condition handling
- [ ] Test concurrent order updates

---

## 12. Performance Tests

### Test 12.1: Load Testing
- [ ] Test with large number of products
- [ ] Verify cart performance with many items
- [ ] Test order list loading with many orders
- [ ] Check database query performance

### Test 12.2: Response Times
- [ ] Verify page load times are acceptable
- [ ] Check API response times
- [ ] Test checkout flow speed
- [ ] Verify email sending doesn't block requests

---

## 13. Integration Tests

### Test 13.1: Stripe Integration
- [ ] Verify products sync correctly
- [ ] Test payment processing end-to-end
- [ ] Check webhook handling (if applicable)
- [ ] Verify refund processing works

### Test 13.2: Database Integration
- [ ] Test order creation in database
- [ ] Verify order updates persist
- [ ] Check refund requests stored correctly
- [ ] Test order update history storage

### Test 13.3: Email Integration
- [ ] Verify all emails send successfully
- [ ] Check email delivery rates
- [ ] Test email template rendering
- [ ] Verify email links work

---

## 14. Browser & Device Tests

### Test 14.1: Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Verify mobile browsers work

### Test 14.2: Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify all modals work on mobile
- [ ] Check forms are usable on small screens

---

## 15. Production Readiness Checklist

### Pre-Launch
- [ ] All critical tests passed
- [ ] Stripe keys switched to live mode
- [ ] Email service configured for production
- [ ] Database backups configured
- [ ] Error logging/monitoring set up
- [ ] SSL certificate installed
- [ ] Domain configured (develloinc.com)
- [ ] All email links point to correct domain

### Post-Launch Monitoring
- [ ] Monitor error logs
- [ ] Track payment success rates
- [ ] Monitor email delivery
- [ ] Check order processing times
- [ ] Review refund request patterns

---

## Quick Test Scenarios

### Happy Path (Full Flow)
1. Browse products → Add to cart → Checkout → Pay → Receive confirmation → View in portal → Request refund → Admin approves → Receive refund

### Guest Checkout Flow
1. Browse products → Add to cart → Guest checkout → Enter email → Pay → Track order with email

### Error Recovery
1. Payment fails → Retry payment → Success → Order created

### Admin Workflow
1. View order → Update status → Send message → Process refund → Verify emails sent

---

## Test Data Setup

### Test Products
- Create test products with various prices
- Set some products as inactive
- Create products with/without images

### Test Users
- Regular user account
- Admin account
- Guest user (email only)

### Test Orders
- Paid orders
- Pending orders
- Refunded orders
- Orders with messages
- Orders with updates

---

## Reporting Issues

When reporting issues, include:
- Test case number
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device info
- Screenshots (if applicable)
- Error messages
- Network logs (if applicable)

---

## Notes

- Always use test Stripe keys for testing
- Use test email addresses
- Don't use real payment cards in test mode
- Clear test data periodically
- Document any bugs found during testing
