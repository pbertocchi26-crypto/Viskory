/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes on Foreign Keys
    - Add index on `brand_reviews.user_id`
    - Add index on `follows.brand_id`
    - Add index on `product_likes.product_id`
    - Add index on `product_views.user_id`
    - Add index on `user_searches.product_id`

  2. Optimize RLS Policies
    - Wrap auth functions with SELECT to prevent re-evaluation per row
    - Improves query performance at scale
    - Policies updated:
      - `user_searches`: "Users can read own searches"
      - `user_searches`: "Authenticated users can insert own searches"
      - `product_clicks`: "Brands can view their product clicks"
      - `external_sales`: "Brands can view their sales"
      - `brand_webhook_tokens`: "Brands can view their webhook token"
      - `product_views`: "Brands can view their product views"

  3. Fix Function Security
    - Set immutable search_path on `create_webhook_token_for_brand` trigger function

  4. Notes
    - Unused indexes are expected for new databases (they'll be used once data grows)
    - Auth connection strategy should be changed to percentage in Supabase Console → Settings → Database
    - Leaked password protection should be enabled in Supabase Console → Authentication → Providers
*/

-- ============================================
-- 1. ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================

-- Index on brand_reviews.user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_reviews_user_id ON brand_reviews(user_id);

-- Index on follows.brand_id for faster brand follower queries
CREATE INDEX IF NOT EXISTS idx_follows_brand_id ON follows(brand_id);

-- Index on product_likes.product_id for faster product likes count
CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);

-- Index on product_views.user_id for user view history
CREATE INDEX IF NOT EXISTS idx_product_views_user_id ON product_views(user_id);

-- Index on user_searches.product_id for search analytics
CREATE INDEX IF NOT EXISTS idx_user_searches_product_id ON user_searches(product_id);

-- ============================================
-- 2. OPTIMIZE RLS POLICIES
-- ============================================

-- Drop and recreate user_searches policies with optimized auth calls
DROP POLICY IF EXISTS "Users can read own searches" ON user_searches;
CREATE POLICY "Users can read own searches"
  ON user_searches FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert own searches" ON user_searches;
CREATE POLICY "Authenticated users can insert own searches"
  ON user_searches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Drop and recreate product_clicks policy
DROP POLICY IF EXISTS "Brands can view their product clicks" ON product_clicks;
CREATE POLICY "Brands can view their product clicks"
  ON product_clicks FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (select auth.uid())
    )
  );

-- Drop and recreate external_sales policy
DROP POLICY IF EXISTS "Brands can view their sales" ON external_sales;
CREATE POLICY "Brands can view their sales"
  ON external_sales FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (select auth.uid())
    )
  );

-- Drop and recreate brand_webhook_tokens policy
DROP POLICY IF EXISTS "Brands can view their webhook token" ON brand_webhook_tokens;
CREATE POLICY "Brands can view their webhook token"
  ON brand_webhook_tokens FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (select auth.uid())
    )
  );

-- Drop and recreate product_views policy
DROP POLICY IF EXISTS "Brands can view their product views" ON product_views;
CREATE POLICY "Brands can view their product views"
  ON product_views FOR SELECT
  TO authenticated
  USING (
    brand_id IN (
      SELECT id FROM brands WHERE owner_user_id = (select auth.uid())
    )
  );

-- ============================================
-- 3. FIX FUNCTION SECURITY
-- ============================================

-- Recreate trigger function with IMMUTABLE search_path
CREATE OR REPLACE FUNCTION create_webhook_token_for_brand()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD IS NULL OR OLD.status != 'APPROVED') THEN
    INSERT INTO brand_webhook_tokens (brand_id)
    VALUES (NEW.id)
    ON CONFLICT (brand_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION create_webhook_token_for_brand IS 'Trigger function that creates webhook token when brand is approved. Uses secure search_path to prevent SQL injection.';
