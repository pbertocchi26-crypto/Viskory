/*
  # Transform Viskory into Showcase Platform
  
  1. Changes to Products Table
    - Add `external_url` field to store direct link to product on brand's website
    - This allows redirecting users to brand sites instead of internal checkout
  
  2. E-commerce Cleanup
    - Drop `orders` and `order_items` tables as Viskory is now a showcase platform
    - Remove internal sales tracking in favor of external sales sync
  
  3. Security
    - Maintain existing RLS policies on products table
    - Add NOT NULL constraint to external_url for new products (nullable for backward compatibility)
*/

-- Add external_url to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'external_url'
  ) THEN
    ALTER TABLE products ADD COLUMN external_url text;
    COMMENT ON COLUMN products.external_url IS 'Direct link to product page on brand website';
  END IF;
END $$;

-- Drop orders and order_items tables if they exist (e-commerce cleanup)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;