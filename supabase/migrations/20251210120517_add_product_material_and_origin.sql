/*
  # Add Product Material and Manufacturing Origin

  1. Changes
    - Add `material` text field for product material type (cotton, wool, etc.)
    - Add `made_in` text field for country of manufacture
  
  2. Purpose
    - Enable brands to specify product materials for transparency
    - Show manufacturing origin for ethical/sustainable fashion focus
    - Support filtering by material and origin in future features
*/

-- Add material and origin fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS material text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS made_in text;

-- Add indexes for potential filtering
CREATE INDEX IF NOT EXISTS idx_products_material ON products (material);
CREATE INDEX IF NOT EXISTS idx_products_made_in ON products (made_in);
