/*
  # Add Sales Tracking and User Searches

  1. Changes to `products` table
    - Add `sales_count` field to track the number of sales
    - Add `average_rating` field for future use

  2. New Tables
    - `user_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users, nullable for guest users)
      - `search_term` (text)
      - `category` (text, nullable)
      - `size` (text, nullable)
      - `color` (text, nullable)
      - `created_at` (timestamptz)
      - Used to track user searches for personalized recommendations

  3. Security
    - Enable RLS on `user_searches` table
    - Add policy for users to read their own searches
    - Add policy for authenticated users to insert their own searches
    - Add policy for anonymous users to insert searches

  4. Important Notes
    - User searches are tracked for both authenticated and anonymous users
    - Anonymous users can see searches from their session (if stored client-side)
    - Sales count will be updated when orders are created
*/

-- Add sales tracking to products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sales_count'
  ) THEN
    ALTER TABLE products ADD COLUMN sales_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'average_rating'
  ) THEN
    ALTER TABLE products ADD COLUMN average_rating numeric(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Create user_searches table
CREATE TABLE IF NOT EXISTS user_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  search_term text,
  category text,
  size text,
  color text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_searches_user_id ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON user_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);

-- Enable RLS
ALTER TABLE user_searches ENABLE ROW LEVEL SECURITY;

-- Policies for user_searches
CREATE POLICY "Users can read own searches"
  ON user_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own searches"
  ON user_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can insert searches"
  ON user_searches FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);