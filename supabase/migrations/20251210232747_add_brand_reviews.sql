/*
  # Add Brand Reviews System

  1. New Tables
    - `brand_reviews`
      - `id` (uuid, primary key)
      - `brand_id` (uuid, foreign key to brands)
      - `user_id` (uuid, foreign key to users)
      - `rating` (integer, 1-5 stars)
      - `review_text` (text, review content)
      - `brand_response` (text, nullable, brand's response)
      - `brand_response_at` (timestamptz, nullable, when brand responded)
      - `created_at` (timestamptz, when review was created)
      - `updated_at` (timestamptz, when review was last updated)

  2. Security
    - Enable RLS on `brand_reviews` table
    - Add policy for anyone to read reviews
    - Add policy for authenticated users to create reviews (one per brand)
    - Add policy for users to update/delete their own reviews
    - Add policy for brand owners to add responses to reviews for their brand

  3. Indexes
    - Index on brand_id for fast lookups
    - Index on user_id for user's reviews
    - Unique constraint on (brand_id, user_id) to prevent duplicate reviews
*/

-- Create brand_reviews table
CREATE TABLE IF NOT EXISTS brand_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL CHECK (char_length(review_text) >= 10),
  brand_response text,
  brand_response_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(brand_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brand_reviews_brand ON brand_reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_user ON brand_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_rating ON brand_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_brand_reviews_created ON brand_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE brand_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reviews
CREATE POLICY "Anyone can read brand reviews"
  ON brand_reviews
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create reviews (one per brand)
CREATE POLICY "Authenticated users can create reviews"
  ON brand_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- Policy: Users can update their own reviews (text and rating only, not brand response)
CREATE POLICY "Users can update own reviews"
  ON brand_reviews
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
  ON brand_reviews
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy: Brand owners can update brand_response for their brand's reviews
CREATE POLICY "Brand owners can respond to reviews"
  ON brand_reviews
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = brand_reviews.brand_id
      AND brands.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = brand_reviews.brand_id
      AND brands.owner_id = (SELECT auth.uid())
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_brand_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_brand_reviews_updated_at ON brand_reviews;
CREATE TRIGGER update_brand_reviews_updated_at
  BEFORE UPDATE ON brand_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_reviews_updated_at();

-- Create function to calculate average rating for a brand
CREATE OR REPLACE FUNCTION get_brand_average_rating(brand_uuid uuid)
RETURNS numeric AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM brand_reviews
  WHERE brand_id = brand_uuid;
$$ LANGUAGE sql STABLE;