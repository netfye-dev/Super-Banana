/*
  # Fix circular dependency in is_admin function

  1. Changes
    - Drop and recreate is_admin() function with SECURITY DEFINER to bypass RLS
    - Recreate all dependent policies
    - This fixes the infinite loop causing the loading screen to hang

  2. Security
    - Function is marked as SECURITY DEFINER to run with elevated privileges
    - This is safe because it only reads the is_admin flag for the current user
*/

-- Drop function with cascade to remove all dependent policies
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Recreate with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT is_admin FROM public.user_profiles WHERE id = auth.uid()),
    false
  );
END;
$$;

-- Recreate policies for user_profiles
CREATE POLICY "Admins view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());

-- Recreate policies for subscription_plans
CREATE POLICY "Admins view all plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Recreate policies for user_subscriptions
CREATE POLICY "Admins view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Recreate policies for api_keys
CREATE POLICY "Admins manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Recreate policies for usage_logs
CREATE POLICY "Admins view all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (is_admin());
