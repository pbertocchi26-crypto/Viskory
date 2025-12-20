/*
  # Fix Security and Performance Issues

  1. Index Improvements
    - Add missing index on order_items.product_id foreign key for better query performance
  
  2. RLS Policy Optimization
    - Update all policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth.uid() for each row, improving performance at scale
    - Fix overlapping SELECT policies on products table
  
  3. Function Optimization
    - Set immutable search_path on update_followers_count function for security
*/

-- Add missing index on order_items.product_id
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Drop existing policies to recreate them with optimized auth calls
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Brand owners can update their brands" ON brands;
DROP POLICY IF EXISTS "Brand owners can insert their brands" ON brands;
DROP POLICY IF EXISTS "Anyone can view published products" ON products;
DROP POLICY IF EXISTS "Brand owners can manage their products" ON products;
DROP POLICY IF EXISTS "Users can view their follows" ON follows;
DROP POLICY IF EXISTS "Users can follow brands" ON follows;
DROP POLICY IF EXISTS "Users can unfollow brands" ON follows;
DROP POLICY IF EXISTS "Users can view their orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

-- Recreate users policies with optimized auth calls
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Recreate brands policies with optimized auth calls
CREATE POLICY "Brand owners can update their brands"
  ON brands FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Brand owners can insert their brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

-- Fix products policies - combine into single policy per action to avoid overlaps
CREATE POLICY "Products select policy"
  ON products FOR SELECT
  USING (
    is_published = true
    OR EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
      AND brands.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Brand owners can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
      AND brands.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Brand owners can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
      AND brands.owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
      AND brands.owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Brand owners can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = products.brand_id
      AND brands.owner_id = (select auth.uid())
    )
  );

-- Recreate follows policies with optimized auth calls
CREATE POLICY "Users can view their follows"
  ON follows FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can follow brands"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can unfollow brands"
  ON follows FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Recreate orders policies with optimized auth calls
CREATE POLICY "Users can view their orders"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Recreate order_items policies with optimized auth calls
CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
    )
  );

-- Fix function search path for security
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS update_followers_count_trigger ON follows;
DROP FUNCTION IF EXISTS update_followers_count();

CREATE OR REPLACE FUNCTION update_followers_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE brands SET followers_count = followers_count + 1 WHERE id = NEW.brand_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE brands SET followers_count = followers_count - 1 WHERE id = OLD.brand_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_followers_count_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_followers_count();