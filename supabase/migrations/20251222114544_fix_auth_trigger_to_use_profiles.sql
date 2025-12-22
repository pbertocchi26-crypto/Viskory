/*
  # Fix Auth Trigger to Use Profiles

  ## Changes
  
  1. Update handle_new_user() function
    - Change INSERT target from public.users to public.profiles
    - Ensure sync between auth.users and public.profiles
  
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Uses immutable search_path for security
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new auth user (syncing to profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  user_name text;
  user_role text;
BEGIN
  -- Extract name from metadata, fallback to email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Extract role from metadata, default to USER
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'USER'
  );

  -- Insert into public.profiles (not public.users!)
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    avatar_url,
    provider,
    provider_id,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_name,
    NEW.email,
    user_role,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NEW.raw_app_meta_data->>'provider_id',
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates or updates public.profiles record when auth.users is inserted. Syncs auth.users → public.profiles.';
