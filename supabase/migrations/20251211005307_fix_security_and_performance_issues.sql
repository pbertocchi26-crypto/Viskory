/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses critical security and performance issues identified in the database:
  
  ## 1. RLS Performance Optimization
  - Fix `product_likes` policies to use `(select auth.uid())` instead of `auth.uid()`
  - This prevents re-evaluation of auth function for each row, improving query performance
  
  ## 2. Unused Indexes Cleanup
  - Remove unused indexes to reduce storage overhead and improve write performance
  - Indexes removed:
    - `idx_follows_user`, `idx_follows_brand` on `follows` table
    - `idx_orders_user` on `orders` table
    - `idx_order_items_order`, `idx_order_items_product` on `order_items` table
    - `idx_brands_has_story` on `brands` table
    - `idx_products_material`, `idx_products_made_in` on `products` table
    - `idx_products_scheduled`, `idx_products_auto_publish` on `products` table
    - `idx_product_likes_user_id`, `idx_product_likes_product_id`, `idx_product_likes_created_at` on `product_likes` table
    - `idx_brand_reviews_user`, `idx_brand_reviews_rating`, `idx_brand_reviews_created` on `brand_reviews` table
  
  ## 3. Multiple Permissive Policies Resolution
  - Convert brand owner response policy to RESTRICTIVE to prevent conflicts
  - Ensures proper separation between user review updates and brand responses
  
  ## 4. Function Security
  - Add explicit search_path to all functions to prevent privilege escalation
  - Functions fixed:
    - `update_brand_reviews_updated_at`
    - `get_brand_average_rating`
    - `update_product_like_count`
*/

-- ============================================
-- 1. Fix RLS Performance on product_likes
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can like products" ON product_likes;
DROP POLICY IF EXISTS "Users can unlike their likes" ON product_likes;

-- Recreate with optimized auth check
CREATE POLICY "Users can like products"
  ON product_likes FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can unlike their likes"
  ON product_likes FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- 2. Remove Unused Indexes
-- ============================================

-- Follows table indexes
DROP INDEX IF EXISTS idx_follows_user;
DROP INDEX IF EXISTS idx_follows_brand;

-- Orders table indexes
DROP INDEX IF EXISTS idx_orders_user;

-- Order items table indexes
DROP INDEX IF EXISTS idx_order_items_order;
DROP INDEX IF EXISTS idx_order_items_product;

-- Brands table indexes
DROP INDEX IF EXISTS idx_brands_has_story;

-- Products table indexes
DROP INDEX IF EXISTS idx_products_material;
DROP INDEX IF EXISTS idx_products_made_in;
DROP INDEX IF EXISTS idx_products_scheduled;
DROP INDEX IF EXISTS idx_products_auto_publish;

-- Product likes table indexes
DROP INDEX IF EXISTS idx_product_likes_user_id;
DROP INDEX IF EXISTS idx_product_likes_product_id;
DROP INDEX IF EXISTS idx_product_likes_created_at;

-- Brand reviews table indexes
DROP INDEX IF EXISTS idx_brand_reviews_user;
DROP INDEX IF EXISTS idx_brand_reviews_rating;
DROP INDEX IF EXISTS idx_brand_reviews_created;

-- ============================================
-- 3. Fix Multiple Permissive Policies on brand_reviews
-- ============================================

-- Drop the brand owner response policy
DROP POLICY IF EXISTS "Brand owners can respond to reviews" ON brand_reviews;

-- Recreate as RESTRICTIVE policy to avoid conflicts
CREATE POLICY "Brand owners can respond to reviews"
  ON brand_reviews
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = brand_reviews.brand_id
      AND brands.owner_user_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- 4. Fix Function Security (Search Path)
-- ============================================

-- Fix update_brand_reviews_updated_at function
CREATE OR REPLACE FUNCTION update_brand_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix get_brand_average_rating function
CREATE OR REPLACE FUNCTION get_brand_average_rating(brand_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM brand_reviews
  WHERE brand_id = brand_uuid;
$$ LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Fix update_product_like_count function
CREATE OR REPLACE FUNCTION update_product_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET like_count = like_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;