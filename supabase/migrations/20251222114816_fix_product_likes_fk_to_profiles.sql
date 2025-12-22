/*
  # Fix Product Likes Foreign Key to Profiles

  ## Changes
  
  1. Drop existing foreign key constraint from product_likes.user_id → auth.users.id
  2. Add new foreign key constraint from product_likes.user_id → public.profiles.id
  
  ## Rationale
  
  The product_likes table should reference public.profiles (the application user table)
  instead of auth.users (the authentication system table). This aligns with the
  architecture where profiles is the source of truth for user data.
*/

-- Drop existing foreign key constraint to auth.users
ALTER TABLE product_likes 
  DROP CONSTRAINT IF EXISTS product_likes_user_id_fkey;

-- Add new foreign key constraint to public.profiles
ALTER TABLE product_likes 
  ADD CONSTRAINT product_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
