/*
  # Fix API Keys RLS Policy

  1. Changes
    - Drop existing conflicting policies on api_keys table
    - Create new is_admin_check function that queries user_profiles
    - Create separate policies for SELECT, INSERT, UPDATE, DELETE
    - Ensures admins can manage API keys properly

  2. Security
    - Only authenticated users with is_admin=true can access api_keys
    - Uses direct database check instead of JWT metadata
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins view API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins manage API keys" ON api_keys;

-- Create a new function that checks user_profiles directly
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create separate policies for each operation
CREATE POLICY "Admins can view API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can insert API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (is_admin_user());
