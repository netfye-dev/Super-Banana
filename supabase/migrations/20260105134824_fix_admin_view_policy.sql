/*
  # Fix Admin View Policy

  1. Problem
    - The "Admins view all profiles" policy checks if the profile row has is_admin = true
    - It should check if the CURRENT USER is an admin
    - Current policy: USING (is_admin = true)
    - This only shows profiles where is_admin = true, not all profiles to admins

  2. Solution
    - Fix the policy to check the current user's admin status
    - The nested query is safe because it only needs to check the user's own row
    - The "Users view own profile" policy allows users to see their own row
*/

-- Drop the broken admin view policy
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;

-- Create the correct admin view policy
CREATE POLICY "Admins view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- Check if the current user (not the row) is an admin
    (SELECT is_admin FROM user_profiles WHERE id = auth.uid()) = true
  );