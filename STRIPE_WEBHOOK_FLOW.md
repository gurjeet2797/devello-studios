# Stripe Webhook Payment Flow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    STRIPE PAYMENT FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. CUSTOMER CHECKOUT
   │
   ├─> User clicks "Buy" on product page
   ├─> Frontend creates PaymentIntent via API
   ├─> Stripe processes payment
   └─> Payment succeeds → Stripe sends webhook event

2. WEBHOOK RECEIVED
   │
   ├─> POST /api/webhooks/stripe
   ├─> Verify request method = POST
   └─> Log incoming headers

3. SIGNATURE VERIFICATION
   │
   ├─> Read raw body buffer
   ├─> Extract stripe-signature header
   ├─> Get STRIPE_SECRET_KEY & STRIPE_WEBHOOK_SECRET
   │
   ├─> ✅ SUCCESS: stripe.webhooks.constructEvent()
   │   └─> Continue to event dispatch
   │
   └─> ❌ FAIL: Invalid signature
       └─> Return 400 "Webhook signature verification failed"

4. EVENT DISPATCH (stripeWebhookRouter.js)
   │
   ├─> dispatchStripeEvent({ event, prisma, handlers })
   │
   ├─> Check: event.id && event.type exist?
   │   └─> ❌ No → Log warning, return
   │
   ├─> Find handler for event.type
   │   └─> ❌ No handler → Log "Unhandled event", return
   │
   ├─> IDEMPOTENCY CHECK #1: In-memory guard
   │   ├─> Check: processedEvents.has(event.id)?
   │   └─> ✅ Yes → Log "Skipping (memory)", return
   │
   ├─> IDEMPOTENCY CHECK #2: Database guard (if configured)
   │   ├─> For payment_intent.succeeded:
   │   │   └─> isPaymentIntentHandled(intentId, prisma)
   │   │       ├─> Check product_orders table
   │   │       └─> Check payments table
   │   │
   │   ├─> For checkout.session.completed:
   │   │   └─> isCheckoutSessionHandled(sessionId, intentId, prisma)
   │   │       └─> Check product_orders by session_id OR intent_id
   │   │
   │   └─> ✅ Already handled → Log "Skipping (db)", mark processed, return
   │
   └─> ✅ Not processed → Execute handler

5. EVENT HANDLERS (Based on event.type)

   ┌─────────────────────────────────────────────────────────────┐
   │ payment_intent.succeeded                                     │
   └─────────────────────────────────────────────────────────────┘
   │
   ├─> handleOneTimePaymentSucceeded(paymentIntent)
   │
   ├─> Extract metadata & normalize
   │   ├─> productId, userId, guestEmail, orderItems, etc.
   │   └─> normalizeMetadata() handles snake_case → camelCase
   │
   ├─> ROUTE BY METADATA:
   │   │
   │   ├─> Branch A: Custom Product Order
   │   │   └─> metadata.customProductRequestId exists?
   │   │       └─> handleCustomProductOrder()
   │   │           ├─> Find existing order by payment_intent_id
   │   │           ├─> Update or create product_order
   │   │           ├─> Link to custom_product_request
   │   │           └─> Create payment record
   │   │
   │   ├─> Branch B: Stock Product Order
   │   │   └─> metadata.productId OR metadata.guestEmail OR metadata.orderItemsRaw?
   │   │       └─> handleStockProductOrder()
   │   │           │
   │   │           ├─> Build order items from metadata
   │   │           │   ├─> Parse metadata.orderItemsRaw (JSON)
   │   │           │   └─> Fallback: single item from metadata
   │   │           │
   │   │           ├─> Resolve user (resolveOrderUser)
   │   │           │   ├─> If metadata.userId → find user
   │   │           │   ├─> If metadata.guestEmail:
   │   │           │   │   ├─> Try find by email
   │   │           │   │   └─> Not found? Create guest user
   │   │           │   │       └─> Create user + profile + subscription
   │   │           │   └─> ❌ No user/email → throw error
   │   │           │
   │   │           ├─> Prepare productOrderData
   │   │           │   ├─> user_id, product_id, order_type
   │   │           │   ├─> stripe_payment_intent_id, amount, currency
   │   │           │   ├─> status: 'processing', payment_status: 'succeeded'
   │   │           │   ├─> guest_email (if guest checkout)
   │   │           │   ├─> shipping_address (JSONB)
   │   │           │   ├─> order_items (JSONB)
   │   │           │   └─> Optional: preview_image_url, tracking_number, etc.
   │   │           │
   │   │           ├─> UPSERT ORDER (Idempotent)
   │   │           │   ├─> Check: order exists by payment_intent_id?
   │   │           │   ├─> Check: order exists by order_number?
   │   │           │   ├─> ✅ Exists → UPDATE
   │   │           │   └─> ❌ Not exists → CREATE with order_number
   │   │           │
   │   │           ├─> UPSERT PAYMENT RECORD
   │   │           │   ├─> Check: payment exists by payment_intent_id?
   │   │           │   ├─> ✅ Exists → UPDATE
   │   │           │   └─> ❌ Not exists → CREATE
   │   │           │
   │   │           └─> SEND EMAIL (if recipient email available)
   │   │               ├─> recipientEmail = guestEmail || userEmail || user.email
   │   │               ├─> sendOrderConfirmationEmail()
   │   │               └─> Include order details, tracking link
   │   │
   │   └─> Branch C: Credit Purchase (Fallback)
   │       └─> handleCreditPurchase()
   │           ├─> If guest → GuestPurchaseService.createGuestPurchase()
   │           └─> If user → UploadAllowanceService.addOneTimeCredits()
   │
   ┌─────────────────────────────────────────────────────────────┐
   │ checkout.session.completed                                   │
   └─────────────────────────────────────────────────────────────┘
   │
   ├─> handleCheckoutSessionCompleted(session)
   │
   ├─> Check: order already exists by session_id OR payment_intent_id?
   │   └─> ✅ Exists → Log warning, return (idempotency)
   │
   ├─> Retrieve payment_intent from Stripe API
   │
   ├─> Route by metadata:
   │   ├─> Custom product request → Create order + link to request
   │   └─> Stock product → Create order + fulfill
   │
   └─> Create payment record

   ┌─────────────────────────────────────────────────────────────┐
   │ Subscription Events (customer.subscription.*)                │
   └─────────────────────────────────────────────────────────────┘
   │
   ├─> Find user by stripe_customer_id
   ├─> Update subscription record
   └─> Invalidate subscription cache

6. DATABASE OPERATIONS
   │
   ├─> product_orders table
   │   ├─> INSERT/UPDATE with all fields (including new columns)
   │   ├─> Fields: preview_image_url, shipping_address, order_items, etc.
   │   └─> Indexes: stripe_payment_intent_id, order_number, guest_email
   │
   ├─> payments table
   │   ├─> INSERT/UPDATE linked to product_order
   │   └─> Fields: stripe_payment_intent_id, stripe_charge_id, status
   │
   └─> users table (for guest checkout)
       └─> CREATE if guest email doesn't exist

7. RESPONSE
   │
   ├─> ✅ SUCCESS: Return 200 { received: true }
   │
   └─> ❌ ERROR: Return 500 { error: 'Webhook handler failed' }
       └─> Stripe will retry (exponential backoff)

```

## Key Features

### Idempotency Protection
1. **In-memory guard**: Prevents duplicate processing in same runtime
2. **Database guard**: Checks if order/payment already exists before creating
3. **Upsert pattern**: Always check before create, update if exists

### Guest Checkout Flow
1. Guest provides email during checkout
2. Metadata includes `guestEmail` and `checkoutType: 'guest'`
3. Webhook creates lightweight user record if email doesn't exist
4. Order stores both `user_id` (FK) and `guest_email` (for notifications)
5. Email sent to guest email address

### Error Handling
- Signature verification failures → 400 (no retry)
- Handler errors → 500 (Stripe retries)
- Missing user/email → throws error (retry)
- Schema mismatches → P2022 error (fixed by migration)

### Metadata Normalization
- Handles both snake_case (`product_id`) and camelCase (`productId`)
- Parses JSON fields (`orderItemsRaw`, `shipping_address`)
- Falls back to single-item order if metadata incomplete

## Database Schema Alignment

**Required columns in product_orders:**
- `preview_image_url` (TEXT)
- `shipping_address` (JSONB)
- `order_items` (JSONB)
- `admin_notes`, `customer_notes` (TEXT)
- `tracking_number`, `carrier` (TEXT)
- `estimated_ship_date`, `shipped_at`, `delivered_at` (TIMESTAMPTZ)

**Migration:** `prisma/migrations/20251207_add_product_order_columns/migration.sql`

## Testing

1. **Smoke test**: `node scripts/test-stripe-webhook-smoke.js`
   - Validates orders, payments, schema columns
   - Checks for orphaned payments
   - Verifies guest order handling

2. **Replay event**: `.\scripts\stripe-replay.ps1 evt_xxx`
   - Resends Stripe event for testing
   - Useful for debugging failed webhooks
