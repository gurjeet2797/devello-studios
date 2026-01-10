-- Add missing foreign key indexes for better performance
-- These were flagged by Supabase AI as unindexed FKs

-- Index for one_time_purchases.user_id
CREATE INDEX IF NOT EXISTS idx_one_time_purchases_user_id 
ON public.one_time_purchases(user_id);

-- Index for uploads.user_id  
CREATE INDEX IF NOT EXISTS idx_uploads_user_id 
ON public.uploads(user_id);

-- Additional indexes for stripe_transactions (if not already present)
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_user_id 
ON public.stripe_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_transactions_stripe_customer_id 
ON public.stripe_transactions(stripe_customer_id);
