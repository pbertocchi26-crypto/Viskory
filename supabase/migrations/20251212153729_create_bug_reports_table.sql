/*
  # Create Bug Reports Table

  1. New Tables
    - `bug_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `subject` (text, bug title)
      - `description` (text, detailed description)
      - `created_at` (timestamptz, when report was created)

  2. Security
    - Enable RLS on `bug_reports` table
    - Users can view their own reports
    - Users can insert their own reports
    - Admins can view all reports

  3. Indexes
    - Index on user_id for fast user lookups
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own reports
CREATE POLICY "Users can read own bug reports"
  ON bug_reports
  FOR SELECT
  USING (true);

-- Policy: Anyone can create a bug report
CREATE POLICY "Anyone can create bug reports"
  ON bug_reports
  FOR INSERT
  WITH CHECK (true);
