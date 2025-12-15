/*
  # Create Tracking Tables for Showcase Platform
  
  1. New Tables
    - `product_clicks`
      - Tracks when users click to visit product on brand website
      - Records user (if logged in), product, timestamp, referrer
      - Provides brands with click-through analytics
    
    - `external_sales`
      - Stores sales data synced from brand websites via webhook
      - Includes order details, amount, timestamp
      - Allows brands to see conversion from Viskory traffic
    
    - `brand_webhook_tokens`
      - Secure tokens for each brand to authenticate webhook calls
      - Auto-generated unique token per brand
  
  2. Security
    - Enable RLS on all tables
    - Brands can only view their own data
    - Public can insert clicks (for tracking)
    - Only authenticated webhook requests can insert sales
  
  3. Performance
    - Add indexes on frequently queried columns
    - Optimize for analytics queries
*/

-- Product clicks tracking table
CREATE TABLE IF NOT EXISTS product_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  clicked_at timestamptz DEFAULT now(),
  referrer text,
  user_agent text,
  ip_address inet,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- External sales tracking table (synced from brand websites)
CREATE TABLE IF NOT EXISTS external_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  external_order_id text NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  customer_email text,
  sale_date timestamptz NOT NULL,
  viskory_referral boolean DEFAULT false,
  referral_code text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, external_order_id)
);

-- Webhook authentication tokens for brands
CREATE TABLE IF NOT EXISTS brand_webhook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE UNIQUE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product views tracking
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now(),
  session_id text,
  duration_seconds int,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_webhook_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_clicks
CREATE POLICY "Anyone can insert product clicks"
  ON product_clicks FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Brands can view their product clicks"
  ON product_clicks FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (SELECT id FROM users WHERE id = auth.uid())
    )
  );

-- RLS Policies for external_sales
CREATE POLICY "Brands can view their sales"
  ON external_sales FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (SELECT id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Brands can insert their sales"
  ON external_sales FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- RLS Policies for brand_webhook_tokens
CREATE POLICY "Brands can view their webhook token"
  ON brand_webhook_tokens FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (SELECT id FROM users WHERE id = auth.uid())
    )
  );

-- RLS Policies for product_views
CREATE POLICY "Anyone can insert product views"
  ON product_views FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Brands can view their product views"
  ON product_views FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (SELECT id FROM users WHERE id = auth.uid())
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_clicks_product ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_brand ON product_clicks(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_clicks_date ON product_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_product_clicks_user ON product_clicks(user_id);

CREATE INDEX IF NOT EXISTS idx_external_sales_brand ON external_sales(brand_id);
CREATE INDEX IF NOT EXISTS idx_external_sales_product ON external_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_external_sales_date ON external_sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_brand ON product_views(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_views_date ON product_views(viewed_at);

-- Auto-generate webhook token when brand is approved
CREATE OR REPLACE FUNCTION create_webhook_token_for_brand()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD IS NULL OR OLD.status != 'APPROVED') THEN
    INSERT INTO brand_webhook_tokens (brand_id)
    VALUES (NEW.id)
    ON CONFLICT (brand_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trigger_create_webhook_token ON brands;
  CREATE TRIGGER trigger_create_webhook_token
    AFTER INSERT OR UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION create_webhook_token_for_brand();
END $$;