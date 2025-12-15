/*
  # Fix Brand Reviews RLS Policy

  The INSERT policy was checking (SELECT auth.uid()) = user_id, but 
  this needs to work with the JWT token properly. We're simplifying
  the policy to just check that the user is authenticated and passing
  a user_id that matches their auth.uid().

  This migration fixes the security policy to allow authenticated users
  to create reviews properly.
*/

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON brand_reviews;

-- Create new INSERT policy that properly allows authenticated users
CREATE POLICY "Authenticated users can create reviews"
  ON brand_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure SELECT policy allows anyone to read
DROP POLICY IF EXISTS "Anyone can read brand reviews" ON brand_reviews;
CREATE POLICY "Anyone can read brand reviews"
  ON brand_reviews
  FOR SELECT
  USING (true);
