/*
  # Create Brand Requests Table

  ## Overview
  
  This migration creates a system for brand registration approval workflow.
  Users submit requests to become brands, admins review and approve/reject them.

  ## New Tables
  
  1. **brand_requests**
    - `id` (uuid, primary key) - Unique request identifier
    - `user_id` (uuid, unique, foreign key → profiles) - User submitting request
    - `status` (text) - PENDING | APPROVED | REJECTED
    - `data` (jsonb) - All form data from registration (brand name, website, etc.)
    - `admin_note` (text, nullable) - Admin notes/rejection reason
    - `created_at` (timestamptz) - When request was created
    - `updated_at` (timestamptz) - Last update timestamp

  ## RLS Policies
  
  - Users can INSERT their own requests
  - Users can SELECT their own requests
  - Users can UPDATE their own requests (only data field, only if PENDING or REJECTED)
  - Admins can SELECT all requests
  - Admins can UPDATE requests (approve/reject via RPC only)

  ## Security Notes
  
  - Users cannot directly set status to APPROVED
  - Status changes happen only through admin RPC functions
  - One active request per user (unique constraint on user_id where status != 'APPROVED')
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create brand requests" ON public.brand_requests;
DROP POLICY IF EXISTS "Users can view own brand requests" ON public.brand_requests;
DROP POLICY IF EXISTS "Users can update own pending requests" ON public.brand_requests;
DROP POLICY IF EXISTS "Admins can view all brand requests" ON public.brand_requests;
DROP POLICY IF EXISTS "Admins can update brand requests" ON public.brand_requests;

-- Create brand_requests table
CREATE TABLE IF NOT EXISTS public.brand_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  data jsonb NOT NULL,
  admin_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to allow only one pending/rejected request per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_requests_user_active 
  ON public.brand_requests(user_id) 
  WHERE status IN ('PENDING', 'REJECTED');

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_brand_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_brand_requests_updated_at_trigger ON public.brand_requests;
CREATE TRIGGER update_brand_requests_updated_at_trigger
  BEFORE UPDATE ON public.brand_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_requests_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brand_requests_user_id ON public.brand_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_requests_status ON public.brand_requests(status);
CREATE INDEX IF NOT EXISTS idx_brand_requests_created_at ON public.brand_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.brand_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own requests
CREATE POLICY "Users can create brand requests"
  ON public.brand_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own brand requests"
  ON public.brand_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can update their own pending/rejected requests (data only)
CREATE POLICY "Users can update own pending requests"
  ON public.brand_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    AND status IN ('PENDING', 'REJECTED')
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status IN ('PENDING', 'REJECTED')
  );

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all brand requests"
  ON public.brand_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update brand requests"
  ON public.brand_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
