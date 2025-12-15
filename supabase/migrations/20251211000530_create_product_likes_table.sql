/*
  # Create Product Likes Table

  1. New Tables
    - `product_likes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `product_id` (uuid, foreign key to products)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `product_likes` table
    - Add policy for authenticated users to like products
    - Add policy for users to view all likes
    - Add policy for users to unlike their own likes
  
  3. Purpose
    - Allow users to like/favorite products
    - Track product popularity
    - Enable users to build wishlist/favorites
*/

-- Create product_likes table
CREATE TABLE IF NOT EXISTS product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_product_likes_user_id ON product_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_product_id ON product_likes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_likes_created_at ON product_likes(created_at DESC);

-- Add like_count column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'like_count'
  ) THEN
    ALTER TABLE products ADD COLUMN like_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for like_count
CREATE INDEX IF NOT EXISTS idx_products_like_count ON products(like_count DESC) WHERE is_published = true;

-- Function to update like count
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
$$ LANGUAGE plpgsql;

-- Create trigger for like count
DROP TRIGGER IF EXISTS update_product_like_count_trigger ON product_likes;
CREATE TRIGGER update_product_like_count_trigger
  AFTER INSERT OR DELETE ON product_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_like_count();

-- Enable RLS
ALTER TABLE product_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view likes
CREATE POLICY "Anyone can view likes"
  ON product_likes FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can like products
CREATE POLICY "Users can like products"
  ON product_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can unlike their own likes
CREATE POLICY "Users can unlike their likes"
  ON product_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
