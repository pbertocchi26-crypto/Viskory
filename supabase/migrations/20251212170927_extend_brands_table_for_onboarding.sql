/*
  # Extend Brands Table for Multi-Step Onboarding

  1. New Fields Added to `brands` table
    - `country` - Country where the brand is legally registered
    - `city` - City location of the brand
    - `address` - Full address (optional)
    - `vat_number` - VAT number or tax ID
    - `phone` - Contact phone number
    - `founded_year` - Year the brand was founded
    - `business_sector` - Main business sector/category
    - `target_audience` - Array of target demographics (men, women, kids, unisex)
    - `price_range` - Average price range (budget, mid, premium, luxury)
    - `production_origin` - Where products are made (italy, europe, asia, other)
    - `brand_values` - Array of brand values (sustainability, craftsmanship, innovation, etc)
    - `onboarding_completed` - Boolean flag indicating if onboarding is complete
    - `onboarding_step` - Current step in onboarding process (1-6)
    - `facebook_url` - Facebook page URL
    - `pinterest_url` - Pinterest profile URL
    - `linkedin_url` - LinkedIn company page URL

  2. Security
    - Maintain existing RLS policies
    - All fields accessible to brand owner
    
  3. Notes
    - Existing brands will have onboarding_completed = true by default
    - New brands will go through the multi-step process
*/

-- Add new columns for extended brand information
DO $$
BEGIN
  -- Location information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'country'
  ) THEN
    ALTER TABLE brands ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'city'
  ) THEN
    ALTER TABLE brands ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'address'
  ) THEN
    ALTER TABLE brands ADD COLUMN address text;
  END IF;

  -- Business information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE brands ADD COLUMN vat_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'phone'
  ) THEN
    ALTER TABLE brands ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'founded_year'
  ) THEN
    ALTER TABLE brands ADD COLUMN founded_year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'business_sector'
  ) THEN
    ALTER TABLE brands ADD COLUMN business_sector text;
  END IF;

  -- Brand characteristics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'target_audience'
  ) THEN
    ALTER TABLE brands ADD COLUMN target_audience jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE brands ADD COLUMN price_range text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'production_origin'
  ) THEN
    ALTER TABLE brands ADD COLUMN production_origin text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'brand_values'
  ) THEN
    ALTER TABLE brands ADD COLUMN brand_values jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Onboarding tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE brands ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'onboarding_step'
  ) THEN
    ALTER TABLE brands ADD COLUMN onboarding_step integer DEFAULT 1;
  END IF;

  -- Additional social media
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN facebook_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'pinterest_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN pinterest_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brands' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE brands ADD COLUMN linkedin_url text;
  END IF;
END $$;

-- Mark existing brands as having completed onboarding
UPDATE brands SET onboarding_completed = true WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Add check constraint for price_range
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_price_range_check;
ALTER TABLE brands ADD CONSTRAINT brands_price_range_check 
  CHECK (price_range IS NULL OR price_range IN ('budget', 'mid', 'premium', 'luxury'));

-- Add check constraint for production_origin
ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_production_origin_check;
ALTER TABLE brands ADD CONSTRAINT brands_production_origin_check 
  CHECK (production_origin IS NULL OR production_origin IN ('italy', 'europe', 'asia', 'other'));

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_brands_country ON brands(country);
CREATE INDEX IF NOT EXISTS idx_brands_business_sector ON brands(business_sector);
CREATE INDEX IF NOT EXISTS idx_brands_onboarding ON brands(onboarding_completed);
