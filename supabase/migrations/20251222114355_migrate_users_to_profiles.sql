/*
  # Migrate from public.users to public.profiles

  ## Changes Made
  
  1. Create profiles table
    - `id` (uuid, primary key) - matches auth.users.id
    - `name` (text)
    - `email` (text, unique)
    - `role` (text) - USER | BRAND | ADMIN
    - `avatar_url` (text, nullable)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)
    - `provider` (text) - email | google | apple | facebook
    - `provider_id` (text, nullable)
    - `email_verified` (boolean)
  
  2. Migrate data from users to profiles
    - Copy all existing user data
  
  3. Update foreign keys
    - brands.owner_id → profiles.id
    - follows.user_id → profiles.id
    - brand_reviews.user_id → profiles.id
    - user_searches.user_id → profiles.id
    - bug_reports.user_id → profiles.id
    - product_clicks.user_id → profiles.id
    - product_views.user_id → profiles.id
  
  4. Drop public.users table
  
  5. Security
    - Enable RLS on profiles
    - Users can read their own profile
    - Users can update their own profile
    - Admins can read all profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'BRAND', 'ADMIN')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  provider text DEFAULT 'email' CHECK (provider IN ('email', 'google', 'apple', 'facebook')),
  provider_id text,
  email_verified boolean DEFAULT false
);

-- Migrate data from users to profiles if users table exists and has data
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    INSERT INTO public.profiles (id, name, email, role, avatar_url, created_at, updated_at, provider, provider_id, email_verified)
    SELECT id, name, email, role, avatar_url, created_at, updated_at, provider, provider_id, email_verified
    FROM public.users
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Drop foreign key constraints that reference users
ALTER TABLE IF EXISTS public.brands DROP CONSTRAINT IF EXISTS brands_owner_user_id_fkey;
ALTER TABLE IF EXISTS public.follows DROP CONSTRAINT IF EXISTS follows_user_id_fkey;
ALTER TABLE IF EXISTS public.brand_reviews DROP CONSTRAINT IF EXISTS brand_reviews_user_id_fkey;
ALTER TABLE IF EXISTS public.user_searches DROP CONSTRAINT IF EXISTS user_searches_user_id_fkey;
ALTER TABLE IF EXISTS public.bug_reports DROP CONSTRAINT IF EXISTS bug_reports_user_id_fkey;
ALTER TABLE IF EXISTS public.product_clicks DROP CONSTRAINT IF EXISTS product_clicks_user_id_fkey;
ALTER TABLE IF EXISTS public.product_views DROP CONSTRAINT IF EXISTS product_views_user_id_fkey;

-- Drop users table
DROP TABLE IF EXISTS public.users CASCADE;

-- Re-add foreign key constraints pointing to profiles
ALTER TABLE public.brands 
  ADD CONSTRAINT brands_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.follows 
  ADD CONSTRAINT follows_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.brand_reviews 
  ADD CONSTRAINT brand_reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_searches 
  ADD CONSTRAINT user_searches_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.bug_reports 
  ADD CONSTRAINT bug_reports_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.product_clicks 
  ADD CONSTRAINT product_clicks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.product_views 
  ADD CONSTRAINT product_views_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
