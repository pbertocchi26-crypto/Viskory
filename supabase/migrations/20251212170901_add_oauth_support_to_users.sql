/*
  # Add OAuth Support to Users Table

  1. Changes to `users` table
    - Add `provider` field to track authentication provider (email, google, apple, facebook)
    - Add `provider_id` field to store OAuth provider user ID
    - Add `email_verified` field to track email verification status
    - Add `phone` field for optional phone number
    - Add `last_sign_in_at` field to track last login timestamp
    - Make `password_hash` nullable since OAuth users don't need passwords

  2. Security
    - Maintain existing RLS policies
    - Ensure OAuth users can be properly identified
    
  3. Notes
    - Existing users with passwords will have provider = 'email'
    - OAuth users will have provider = 'google', 'apple', or 'facebook'
    - provider_id stores the unique ID from OAuth provider
*/

-- Add new columns for OAuth support
DO $$
BEGIN
  -- Add provider column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'provider'
  ) THEN
    ALTER TABLE users ADD COLUMN provider text DEFAULT 'email' CHECK (provider IN ('email', 'google', 'apple', 'facebook'));
  END IF;

  -- Add provider_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE users ADD COLUMN provider_id text;
  END IF;

  -- Add email_verified column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  -- Add phone column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  -- Add last_sign_in_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_sign_in_at timestamptz;
  END IF;
END $$;

-- Make password_hash nullable for OAuth users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Update existing users to have email_verified = true
UPDATE users SET email_verified = true WHERE provider = 'email' AND password_hash IS NOT NULL;

-- Create unique constraint on provider + provider_id combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider, provider_id) WHERE provider_id IS NOT NULL;

-- Add index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
