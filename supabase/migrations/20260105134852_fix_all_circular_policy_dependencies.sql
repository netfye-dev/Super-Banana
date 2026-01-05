/*
  # Fix All Circular Policy Dependencies
  
  1. Problem
    - All admin policies that check user_profiles.is_admin create circular dependencies
    - When checking if current user is admin, we query user_profiles from within user_profiles policies
    - This causes infinite recursion or failed queries
    
  2. Solution
    - Create a SECURITY DEFINER function that bypasses RLS to check admin status
    - This function can safely query user_profiles without triggering RLS
    - Replace all nested EXISTS queries with this function call
    
  3. Changes
    - Create is_admin() helper function with SECURITY DEFINER
    - Update all policies to use this function instead of nested queries
*/

-- Create a helper function to check if current user is admin
-- SECURITY DEFINER allows it to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop all policies that use nested queries
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins view all plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins manage API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins view all logs" ON usage_logs;

-- Recreate policies using the helper function

-- user_profiles policies
CREATE POLICY "Admins view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- subscription_plans policies
CREATE POLICY "Admins view all plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- user_subscriptions policies
CREATE POLICY "Admins view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins manage subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- api_keys policies
CREATE POLICY "Admins manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- usage_logs policies
CREATE POLICY "Admins view all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());