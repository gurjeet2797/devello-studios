# Payment Gateway Testing Guide

## Prerequisites

1. ✅ Tables created in Supabase
2. ✅ Products seeded (run `seed-manufacturing-products.sql`)
3. ✅ Stripe API keys configured in `.env`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_CONNECT_CLIENT_ID` (for partner payouts)
   - `STRIPE_CONNECT_WEBHOOK_SECRET`

## Test 1: Verify Products Are Available

### Check Products API
```bash
# In browser console or Postman
GET http://localhost:3000/api/products/list?status=active
```

**Expected:** Should return 11 products (windows, doors, hardware, custom)

### Check Manufacturing Page
1. Navigate to `http://localhost:3000/manufacturing`
2. Scroll down to "Our Products" section
3. **Expected:** See product cards with prices and "Buy Now" buttons

---

## Test 2: Product Purchase Flow (Client Side)

### Step 1: View Products
1. Go to `/manufacturing`
2. Verify products display correctly

### Step 2: Initiate Purchase
1. Click "Buy Now" on any product (e.g., "Casement Window - $450")
2. **If not logged in:** Should redirect to login
3. **If logged in:** Should redirect to Stripe Checkout

### Step 3: Complete Payment
1. Use Stripe test card: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., 12/25)
3. CVC: Any 3 digits (e.g., 123)
4. Complete checkout

### Step 4: Verify Order Created
1. Should redirect to `/products/order-success`
2. Check database:
```sql
SELECT * FROM product_orders ORDER BY created_at DESC LIMIT 1;
SELECT * FROM payments WHERE product_order_id IS NOT NULL ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
- `product_orders.status` = 'completed'
- `product_orders.payment_status` = 'paid'
- `payments.status` = 'succeeded'

---

## Test 3: Partner Payment Terms Setup

### Step 1: Create Partner Account
1. Sign up as a new user
2. Apply to become a partner at `/partners` or `/about#become-partner`
3. Complete partner application form

### Step 2: Set Payment Terms
```bash
# API call (with partner auth token)
PUT http://localhost:3000/api/partners/payment-terms/update
Headers: Authorization: Bearer <token>
Body: {
  "defaultPaymentType": "deposit_delivery",
  "depositPercentage": 50,
  "netDays": null,
  "allowCustomTerms": true
}
```

**Expected:** Returns success with payment terms

### Step 3: Verify in Database
```sql
SELECT * FROM partner_payment_terms WHERE partner_id = '<partner_id>';
```

**Expected:** Record created with deposit_percentage = 50

---

## Test 4: Stripe Connect Account Setup

### Step 1: Create Connect Account
```bash
POST http://localhost:3000/api/partners/stripe-connect/create-account
Headers: Authorization: Bearer <partner_token>
Body: {
  "accountHolderName": "Test Partner",
  "accountHolderType": "business",
  "routingNumber": "110000000", // Test routing number
  "accountNumber": "000123456789", // Test account number
  "bankName": "Test Bank",
  "accountType": "checking"
}
```

**Expected:** Returns account ID and verification status

### Step 2: Get Onboarding Link
```bash
POST http://localhost:3000/api/partners/stripe-connect/onboard
Headers: Authorization: Bearer <partner_token>
```

**Expected:** Returns onboarding URL

### Step 3: Verify in Database
```sql
SELECT * FROM partner_bank_accounts WHERE partner_id = '<partner_id>';
```

**Expected:** Record with stripe_account_id

---

## Test 5: Invoice Creation (Partner)

### Step 1: Create Order (if not exists)
```bash
POST http://localhost:3000/api/orders/create
Headers: Authorization: Bearer <partner_token>
Body: {
  "conversationId": "<conversation_id>",
  "title": "Test Order",
  "description": "Test order description",
  "totalAmount": 1000,
  "estimatedCompletion": "2024-12-31"
}
```

### Step 2: Create Invoice from Order
```bash
POST http://localhost:3000/api/invoices/create-from-order
Headers: Authorization: Bearer <partner_token>
Body: {
  "orderId": "<order_id>"
}
```

**Expected:** Invoice created with invoice_number

### Step 3: Create Manual Invoice
```bash
POST http://localhost:3000/api/invoices/create
Headers: Authorization: Bearer <partner_token>
Body: {
  "userId": "<user_id>",
  "amount": 500,
  "items": [
    {
      "description": "Service Item 1",
      "amount": 500,
      "quantity": 1
    }
  ],
  "paymentTerms": {
    "type": "net_30"
  }
}
```

**Expected:** Invoice created

### Step 4: Send Invoice
```bash
POST http://localhost:3000/api/invoices/<invoice_id>/send
Headers: Authorization: Bearer <partner_token>
```

**Expected:** Invoice status updated to 'sent'

### Step 5: Verify in Database
```sql
SELECT * FROM invoices WHERE partner_id = '<partner_id>' ORDER BY created_at DESC LIMIT 1;
```

**Expected:** Invoice with status = 'sent'

---

## Test 6: Payment Processing

### Step 1: Process Payment for Invoice
```bash
POST http://localhost:3000/api/payments/create
Headers: Authorization: Bearer <user_token>
Body: {
  "invoiceId": "<invoice_id>",
  "amount": 500,
  "paymentMethodId": "<stripe_payment_method_id>",
  "paymentType": "full"
}
```

**Note:** You'll need to create a payment method first using Stripe.js

### Step 2: Verify Payment
```sql
SELECT * FROM payments WHERE invoice_id = '<invoice_id>';
SELECT * FROM invoices WHERE id = '<invoice_id>';
```

**Expected:**
- Payment status = 'succeeded'
- Invoice status = 'paid'

---

## Test 7: View Payments & Invoices

### List Payments
```bash
GET http://localhost:3000/api/payments/list
Headers: Authorization: Bearer <token>
Query params: ?status=succeeded&page=1&limit=20
```

**Expected:** Returns paginated list of payments

### List Invoices
```bash
GET http://localhost:3000/api/invoices/list
Headers: Authorization: Bearer <partner_token>
Query params: ?status=sent&page=1&limit=20
```

**Expected:** Returns paginated list of invoices

### List Product Orders
```bash
GET http://localhost:3000/api/products/orders/list
Headers: Authorization: Bearer <user_token>
Query params: ?status=completed
```

**Expected:** Returns user's product orders

---

## Test 8: Refund Processing

### Step 1: Create Refund Request
```bash
POST http://localhost:3000/api/refunds/create
Headers: Authorization: Bearer <user_token>
Body: {
  "paymentId": "<payment_id>",
  "reason": "Customer request",
  "description": "Product not as described",
  "amount": 500
}
```

**Expected:** Refund processed and Stripe refund created

### Step 2: Verify Refund
```sql
SELECT * FROM refund_requests WHERE payment_id = '<payment_id>';
SELECT * FROM payments WHERE id = '<payment_id>';
```

**Expected:**
- Refund request status = 'processed'
- Payment status = 'refunded'

---

## Test 9: Dispute Creation

### Step 1: Create Dispute
```bash
POST http://localhost:3000/api/disputes/create
Headers: Authorization: Bearer <user_token>
Body: {
  "paymentId": "<payment_id>",
  "reason": "Product not received",
  "description": "Order was never delivered"
}
```

### Step 2: Verify Dispute
```sql
SELECT * FROM payment_disputes WHERE payment_id = '<payment_id>';
```

**Expected:** Dispute record created with status = 'pending'

---

## Test 10: Webhook Testing

### Test Stripe Webhook (Checkout Session Completed)
1. Complete a product purchase
2. Check webhook logs in Stripe Dashboard
3. Verify webhook was received at `/api/webhooks/stripe`
4. Check database for order creation:
```sql
SELECT * FROM product_orders WHERE stripe_session_id = '<session_id>';
```

**Expected:** Order automatically created via webhook

### Test Stripe Connect Webhook
1. Complete partner onboarding
2. Check webhook logs for `account.updated`
3. Verify account status updated:
```sql
SELECT stripe_account_status FROM partner_bank_accounts WHERE stripe_account_id = '<account_id>';
```

---

## Quick Test Checklist

- [ ] Products display on manufacturing page
- [ ] Can initiate product purchase (redirects to Stripe)
- [ ] Product purchase completes successfully
- [ ] Order created in database after purchase
- [ ] Payment record created
- [ ] Partner can set payment terms
- [ ] Partner can create Stripe Connect account
- [ ] Partner can create invoice
- [ ] Partner can send invoice
- [ ] Payment can be processed for invoice
- [ ] Payments list API works
- [ ] Invoices list API works
- [ ] Product orders list API works
- [ ] Refund can be processed
- [ ] Dispute can be created
- [ ] Webhooks process correctly

---

## Common Issues & Solutions

### Issue: Products not showing
**Solution:** 
- Verify products seeded: `SELECT COUNT(*) FROM products;`
- Check API: `GET /api/products/list`
- Check browser console for errors

### Issue: Stripe checkout not redirecting
**Solution:**
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for Stripe errors
- Verify user is authenticated

### Issue: Payment fails
**Solution:**
- Check Stripe Dashboard for payment intent status
- Verify payment method is valid
- Check API logs for errors

### Issue: Webhook not firing
**Solution:**
- Verify webhook endpoint URL in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

---

## Stripe Test Cards

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Auth:** `4000 0025 0000 3155`
- **3D Secure:** `4000 0027 6000 3184`

## Next Steps After Testing

1. Add frontend components for payment dashboard
2. Add invoice management UI
3. Add dispute/refund management UI
4. Add bank account collection to partner signup form
5. Test scheduled payments (deposit + final payment)
6. Test net terms payments

