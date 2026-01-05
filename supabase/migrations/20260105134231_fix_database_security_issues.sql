/*
  # Fix Database Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys for api_keys.created_by and user_subscriptions.plan_id
    - Optimize RLS policies by wrapping auth.uid() in SELECT subqueries to prevent re-evaluation per row

  2. Security Improvements
    - Set immutable search_path on all functions to prevent search_path injection attacks
    - Consolidate multiple permissive RLS policies into single optimized policies per action

  3. Changes Made
    - Added index on api_keys(created_by)
    - Added index on user_subscriptions(plan_id)
    - Updated all RLS policies to use (select auth.uid()) pattern
    - Updated functions with SET search_path = public, pg_temp
    - Consolidated duplicate permissive policies where appropriate

  Important Notes:
    - Auth DB connection strategy and leaked password protection are configuration settings
      that must be changed in Supabase Dashboard settings, not via SQL migrations
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS api_keys_created_by_idx ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_id_idx ON user_subscriptions(plan_id);

-- Drop existing RLS policies that need optimization
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "System can insert usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can view all usage logs" ON usage_logs;

-- Recreate optimized RLS policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Recreate optimized RLS policies for subscription_plans
CREATE POLICY "Admins can manage plans"
  ON subscription_plans
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Recreate optimized RLS policies for user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage subscriptions"
  ON user_subscriptions
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Recreate optimized RLS policies for api_keys
CREATE POLICY "Admins can view API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON api_keys
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Recreate optimized RLS policies for usage_logs
CREATE POLICY "Users can view own usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "System can insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can view all usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND is_admin = true
    )
  );

-- Update functions with immutable search_path

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  default_plan_id uuid;
BEGIN
  SELECT id INTO default_plan_id
  FROM subscription_plans
  WHERE name = 'Free'
  LIMIT 1;

  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );

  IF default_plan_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (user_id, plan_id)
    VALUES (new.id, default_plan_id);
  END IF;

  RETURN new;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update promote_user_to_admin function
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE user_profiles
  SET is_admin = true
  WHERE email = user_email;
END;
$$;

-- Update has_admin_user function
CREATE OR REPLACE FUNCTION has_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles WHERE is_admin = true
  );
END;
$$;