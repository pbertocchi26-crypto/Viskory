/*
  # Fix Discount System and Remove Original Price Field

  ## Changes
  1. Remove `original_price` column from products table
  2. The original price will be calculated automatically: original_price = price / (1 - discount_percentage/100)
  3. When discount_percentage > 0, the current price is the discounted price
  4. Frontend will calculate and display the original price when needed

  ## Notes
  - This simplifies the discount system
  - Brands only need to set the discount percentage
  - The system automatically calculates what to show
*/

DO $$
BEGIN
  -- Remove original_price column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE products DROP COLUMN original_price;
  END IF;
END $$;
