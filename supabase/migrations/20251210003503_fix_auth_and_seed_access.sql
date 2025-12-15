/*
  # Fix Authentication and Seed Access Issues

  1. Allow anonymous/service role to insert users during seed
  2. Keep authenticated user policies for regular operations
  3. Add public read access for login verification
*/

-- Drop and recreate users policies with proper access levels
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Public can read users for brand profiles" ON users;

-- Allow service role and anon to insert users (for seeding and registration)
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Allow public to read user data for authentication purposes
CREATE POLICY "Public can read users for auth"
  ON users FOR SELECT
  TO anon
  USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Ensure brands can be inserted by brand users
DROP POLICY IF EXISTS "Brand owners can insert their brands" ON brands;

CREATE POLICY "Brand owners can insert their brands"
  ON brands FOR INSERT
  WITH CHECK (true);