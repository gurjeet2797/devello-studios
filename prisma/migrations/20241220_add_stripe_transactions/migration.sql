-- CreateTable
CREATE TABLE "stripe_transactions" (
    "id" TEXT NOT NULL,
    "stripe_transaction_id" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT,
    "stripe_session_id" TEXT,
    "stripe_charge_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    
    -- Transaction details
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transaction_type" TEXT NOT NULL,
    "description" TEXT,
    
    -- User information
    "user_id" TEXT,
    "user_email" TEXT,
    "user_name" TEXT,
    
    -- Stripe metadata
    "stripe_metadata" JSONB,
    "stripe_created" TIMESTAMP(3),
    "stripe_updated" TIMESTAMP(3),
    
    -- Processing status
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "sync_status" TEXT NOT NULL DEFAULT 'pending',
    
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stripe_transactions_stripe_transaction_id_key" ON "stripe_transactions"("stripe_transaction_id");
CREATE INDEX "stripe_transactions_stripe_customer_id_idx" ON "stripe_transactions"("stripe_customer_id");
CREATE INDEX "stripe_transactions_user_id_idx" ON "stripe_transactions"("user_id");
CREATE INDEX "stripe_transactions_created_at_idx" ON "stripe_transactions"("created_at");
CREATE INDEX "stripe_transactions_status_idx" ON "stripe_transactions"("status");
CREATE INDEX "stripe_transactions_transaction_type_idx" ON "stripe_transactions"("transaction_type");

-- AddForeignKey
ALTER TABLE "stripe_transactions" ADD CONSTRAINT "stripe_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
