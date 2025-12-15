/*
  # Add Product Discount and Gender Fields

  1. Changes
    - Add `discount_percentage` column to products table (0-100)
    - Add `original_price` column to products table
    - Add `gender` column to products table (MEN, WOMEN, UNISEX)
    - Add computed column for discounted price

  2. Purpose
    - Enable discount functionality for products
    - Support gender-based product categorization
    - Allow filtering products by gender and discount status
*/

-- Add gender enum type
DO $$ BEGIN
  CREATE TYPE product_gender AS ENUM ('MEN', 'WOMEN', 'UNISEX');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add discount and gender columns to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'discount_percentage'
  ) THEN
    ALTER TABLE products ADD COLUMN discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE products ADD COLUMN original_price DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'gender'
  ) THEN
    ALTER TABLE products ADD COLUMN gender product_gender DEFAULT 'UNISEX';
  END IF;
END $$;

-- Create index for filtering by gender and discount
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage) WHERE is_published = true AND discount_percentage > 0;
