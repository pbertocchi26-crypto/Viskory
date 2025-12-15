/*
  # Add Scheduled Launch Fields

  1. Changes
    - Add `scheduled_for` timestamptz field for scheduling product launches
    - Add `published_at` timestamptz field to track when product went live
    - Backfill `published_at` for existing published products
  
  2. Purpose
    - Enable brands to schedule product launches for future dates/times
    - Track publication history
    - Support auto-publishing when scheduled time arrives
*/

-- Add new columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Backfill published_at for existing published products
UPDATE products 
SET published_at = COALESCE(updated_at, created_at)
WHERE is_published = true AND published_at IS NULL;

-- Create index for efficient scheduled product queries
CREATE INDEX IF NOT EXISTS idx_products_scheduled 
ON products (scheduled_for) 
WHERE scheduled_for IS NOT NULL AND is_published = false;

-- Create index for auto-publish queries
CREATE INDEX IF NOT EXISTS idx_products_auto_publish 
ON products (is_published, scheduled_for) 
WHERE is_published = false AND scheduled_for IS NOT NULL;
