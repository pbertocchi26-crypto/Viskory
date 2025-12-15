/*
  # Add Price by Size

  1. Changes
    - Add `price_by_size` jsonb field to products table
    - `price_by_size` will store price per size as JSON: {"S": 49.99, "M": 54.99, "L": 59.99}
    - Keep existing `price` field for backward compatibility (can be used as min/base price)
  
  2. Migration Strategy
    - Add new `price_by_size` column
    - Migrate existing data: if product has price and sizes, copy price to all sizes
    - Product.price will remain as a reference/minimum price for listing pages
*/

-- Add new price_by_size column
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_by_size jsonb DEFAULT '{}'::jsonb;

-- Migrate existing data: copy existing price to all sizes
DO $$
DECLARE
  product_record RECORD;
  size_item text;
  price_obj jsonb;
BEGIN
  FOR product_record IN SELECT id, price, sizes FROM products WHERE price > 0
  LOOP
    -- Build the price_by_size object with the same price for all sizes
    price_obj := '{}'::jsonb;
    FOR size_item IN SELECT jsonb_array_elements_text(product_record.sizes)
    LOOP
      price_obj := jsonb_set(price_obj, ARRAY[size_item], to_jsonb(product_record.price));
    END LOOP;
    
    -- Update the product
    UPDATE products SET price_by_size = price_obj WHERE id = product_record.id;
  END LOOP;
END $$;
