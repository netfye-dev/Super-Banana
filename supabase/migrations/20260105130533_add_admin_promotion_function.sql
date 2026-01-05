/*
  # Admin User Management

  ## Overview
  This migration adds a helper function to promote users to admin status.

  ## Changes
  1. Function to promote user to admin by email
  2. Function to create first admin if none exists

  ## Usage
  After a user signs up with email admin@promofye.com (or any email),
  run: SELECT promote_user_to_admin('admin@promofye.com');
*/

-- Function to promote a user to admin by email
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET is_admin = true
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if any admin exists
CREATE OR REPLACE FUNCTION has_admin_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_profiles WHERE is_admin = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
