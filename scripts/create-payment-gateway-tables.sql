-- Payment Gateway Tables Migration Script
-- Run this in Supabase SQL Editor

-- 1. Create Order table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL,
  partner_id UUID NOT NULL,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  order_type VARCHAR(20) NOT NULL DEFAULT 'partner_service',
  total_amount INTEGER,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  estimated_completion TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_orders_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_conversation_id ON orders(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- 2. Create Product table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  price INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  stripe_price_id TEXT,
  product_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- 3. Create ProductOrder table
CREATE TABLE IF NOT EXISTS product_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  order_number TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_product_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_orders_user_id ON product_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_product_id ON product_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_order_number ON product_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_product_orders_status ON product_orders(status);
CREATE INDEX IF NOT EXISTS idx_product_orders_payment_status ON product_orders(payment_status);

-- 4. Create PartnerPaymentTerms table
CREATE TABLE IF NOT EXISTS partner_payment_terms (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  partner_id UUID UNIQUE NOT NULL,
  default_payment_type VARCHAR(20) NOT NULL DEFAULT 'full_upfront',
  deposit_percentage INTEGER,
  net_days INTEGER,
  allow_custom_terms BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_partner_payment_terms_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

-- 5. Create PartnerBankAccount table
CREATE TABLE IF NOT EXISTS partner_bank_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  partner_id UUID UNIQUE NOT NULL,
  stripe_account_id TEXT UNIQUE,
  account_holder_name TEXT NOT NULL,
  account_holder_type VARCHAR(20) NOT NULL,
  routing_number VARCHAR(20) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  bank_name TEXT,
  account_type VARCHAR(20),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  stripe_account_status VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_partner_bank_accounts_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_partner_bank_accounts_stripe_account_id ON partner_bank_accounts(stripe_account_id);

-- 6. Create Invoice table
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id TEXT,
  partner_id UUID NOT NULL,
  user_id TEXT,
  invoice_number TEXT UNIQUE NOT NULL,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  tax_amount INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_terms JSONB,
  items JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoices_partner FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_partner_id ON invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- 7. Create Payment table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id TEXT,
  order_id TEXT,
  product_order_id TEXT,
  user_id TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(20),
  payment_type VARCHAR(20),
  scheduled_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_product_order FOREIGN KEY (product_order_id) REFERENCES product_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_product_order_id ON payments(product_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_scheduled_date ON payments(scheduled_date);

-- 8. Create PaymentDispute table
CREATE TABLE IF NOT EXISTS payment_disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payment_id TEXT,
  invoice_id TEXT,
  product_order_id TEXT,
  initiated_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_amount INTEGER,
  resolved_amount INTEGER,
  stripe_dispute_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT fk_payment_disputes_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_payment_disputes_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_payment_disputes_product_order FOREIGN KEY (product_order_id) REFERENCES product_orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_payment_id ON payment_disputes(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_invoice_id ON payment_disputes(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_product_order_id ON payment_disputes(product_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);

-- 9. Create RefundRequest table
CREATE TABLE IF NOT EXISTS refund_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payment_id TEXT,
  invoice_id TEXT,
  product_order_id TEXT,
  initiated_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_amount INTEGER NOT NULL,
  resolved_amount INTEGER,
  stripe_refund_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT fk_refund_requests_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
  CONSTRAINT fk_refund_requests_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  CONSTRAINT fk_refund_requests_product_order FOREIGN KEY (product_order_id) REFERENCES product_orders(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_payment_id ON refund_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_invoice_id ON refund_requests(invoice_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_product_order_id ON refund_requests(product_order_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = orders.user_id));

CREATE POLICY "Partners can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = orders.partner_id)));

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (status = 'active');

-- RLS Policies for product_orders
CREATE POLICY "Users can view their own product orders"
  ON product_orders FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = product_orders.user_id));

CREATE POLICY "Users can create their own product orders"
  ON product_orders FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = product_orders.user_id));

-- RLS Policies for partner_payment_terms
CREATE POLICY "Partners can view their own payment terms"
  ON partner_payment_terms FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = partner_payment_terms.partner_id)));

CREATE POLICY "Partners can update their own payment terms"
  ON partner_payment_terms FOR UPDATE
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = partner_payment_terms.partner_id)));

-- RLS Policies for partner_bank_accounts
CREATE POLICY "Partners can view their own bank accounts"
  ON partner_bank_accounts FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = partner_bank_accounts.partner_id)));

CREATE POLICY "Partners can insert their own bank accounts"
  ON partner_bank_accounts FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = partner_bank_accounts.partner_id)));

CREATE POLICY "Partners can update their own bank accounts"
  ON partner_bank_accounts FOR UPDATE
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = partner_bank_accounts.partner_id)));

-- RLS Policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = invoices.user_id));

CREATE POLICY "Partners can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id IN (SELECT user_id FROM partners WHERE id = invoices.partner_id)));

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = payments.user_id));

CREATE POLICY "Partners can view payments for their invoices/orders"
  ON payments FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT supabase_user_id FROM users WHERE id IN (
        SELECT user_id FROM partners WHERE id IN (
          SELECT partner_id FROM invoices WHERE id = payments.invoice_id
          UNION
          SELECT partner_id FROM orders WHERE id = payments.order_id
        )
      )
    )
  );

-- RLS Policies for payment_disputes
CREATE POLICY "Users can view disputes for their payments"
  ON payment_disputes FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = payment_disputes.initiated_by));

CREATE POLICY "Users can create disputes for their payments"
  ON payment_disputes FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = payment_disputes.initiated_by));

-- RLS Policies for refund_requests
CREATE POLICY "Users can view refund requests they initiated"
  ON refund_requests FOR SELECT
  USING (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = refund_requests.initiated_by));

CREATE POLICY "Users can create refund requests"
  ON refund_requests FOR INSERT
  WITH CHECK (auth.uid()::text IN (SELECT supabase_user_id FROM users WHERE id = refund_requests.initiated_by));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_orders_updated_at BEFORE UPDATE ON product_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_payment_terms_updated_at BEFORE UPDATE ON partner_payment_terms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_bank_accounts_updated_at BEFORE UPDATE ON partner_bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

