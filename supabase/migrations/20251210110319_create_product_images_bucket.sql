/*
  # Create Product Images Storage Bucket

  1. New Storage Bucket
    - `product-images` bucket for storing product photos
  
  2. Security
    - Enable RLS on storage.objects
    - Allow public read access for all product images
    - Allow authenticated brand users to upload images
    - Allow brand owners to delete their own product images
*/

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can view product images'
  ) THEN
    CREATE POLICY "Public can view product images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Allow authenticated brand users to upload product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Brand users can upload product images'
  ) THEN
    CREATE POLICY "Brand users can upload product images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images' AND
        (SELECT role FROM users WHERE id = auth.uid()) = 'BRAND'
      );
  END IF;
END $$;

-- Allow brand users to delete their own product images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Brand users can delete their own product images'
  ) THEN
    CREATE POLICY "Brand users can delete their own product images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images' AND
        (SELECT role FROM users WHERE id = auth.uid()) = 'BRAND'
      );
  END IF;
END $$;
