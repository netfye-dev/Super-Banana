/*
  # Fix RLS circular dependency by using JWT claims

  1. Changes
    - Drop all existing policies that use is_admin()
    - Drop existing is_admin() function that causes circular dependency
    - Create new is_admin() function that reads from JWT claims instead of user_profiles
    - Add trigger to sync is_admin flag to user's JWT metadata
    - Recreate all policies
    - Update existing user's metadata with current admin status

  2. Security
    - JWT metadata (raw_app_meta_data) cannot be modified by users
    - Only backend triggers can update this data
    - RLS policies can safely use is_admin() without circular calls
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON user_profiles;

DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins view all plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins manage plans" ON subscription_plans;

DROP POLICY IF EXISTS "Users view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins view all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins manage subscriptions" ON user_subscriptions;

DROP POLICY IF EXISTS "Admins view API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins manage API keys" ON api_keys;

DROP POLICY IF EXISTS "Users view own logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins view all logs" ON usage_logs;

-- Drop existing function
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Create new is_admin function that reads from JWT claims
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Read admin status from JWT app_metadata
  -- This avoids querying user_profiles and eliminates circular dependency
  RETURN COALESCE(
    (auth.jwt()->>'app_metadata')::jsonb->>'is_admin' = 'true',
    false
  );
END;
$$;

-- Function to sync admin status to user's JWT metadata
CREATE OR REPLACE FUNCTION sync_admin_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's app_metadata with admin status
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('is_admin', NEW.is_admin)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync admin changes to JWT
DROP TRIGGER IF EXISTS sync_admin_status_trigger ON user_profiles;
CREATE TRIGGER sync_admin_status_trigger
  AFTER INSERT OR UPDATE OF is_admin ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_to_jwt();

-- Sync existing users' admin status to their JWT metadata
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, is_admin FROM user_profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('is_admin', user_record.is_admin)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Recreate user_profiles policies
CREATE POLICY "Users view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- Recreate subscription_plans policies
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins view all plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Recreate user_subscriptions policies
CREATE POLICY "Users view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Recreate api_keys policies
CREATE POLICY "Admins view API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Recreate usage_logs policies
CREATE POLICY "Users view own logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (is_admin());
