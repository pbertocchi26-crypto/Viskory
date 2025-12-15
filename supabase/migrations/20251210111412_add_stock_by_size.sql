/*
  # Add Stock by Size

  1. Changes
    - Replace `stock_quantity` integer field with `stock_by_size` jsonb field
    - `stock_by_size` will store stock per size as JSON: {"S": 10, "M": 20, "L": 15}
  
  2. Migration Strategy
    - Add new `stock_by_size` column
    - Migrate existing data: if stock_quantity > 0, distribute equally across all sizes
    - Drop old `stock_quantity` column
*/

-- Add new stock_by_size column
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_size jsonb DEFAULT '{}'::jsonb;

-- Migrate existing data: if product has stock_quantity and sizes, distribute stock
DO $$
DECLARE
  product_record RECORD;
  size_item text;
  size_count integer;
  stock_per_size integer;
  stock_obj jsonb;
BEGIN
  FOR product_record IN SELECT id, stock_quantity, sizes FROM products WHERE stock_quantity > 0
  LOOP
    -- Get the number of sizes
    size_count := jsonb_array_length(product_record.sizes);
    
    IF size_count > 0 THEN
      -- Calculate stock per size (integer division)
      stock_per_size := product_record.stock_quantity / size_count;
      
      -- Build the stock_by_size object
      stock_obj := '{}'::jsonb;
      FOR size_item IN SELECT jsonb_array_elements_text(product_record.sizes)
      LOOP
        stock_obj := jsonb_set(stock_obj, ARRAY[size_item], to_jsonb(stock_per_size));
      END LOOP;
      
      -- Update the product
      UPDATE products SET stock_by_size = stock_obj WHERE id = product_record.id;
    END IF;
  END LOOP;
END $$;

-- Drop the old stock_quantity column
ALTER TABLE products DROP COLUMN IF EXISTS stock_quantity;
