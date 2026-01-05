/*
  # Fix Circular Policy Dependencies

  1. Problem
    - The consolidated policies create circular dependencies
    - When checking if a user is admin, we query user_profiles from within a user_profiles policy
    - This causes the query to fail or loop infinitely

  2. Solution
    - Split policies back into separate user and admin policies
    - Use UNION of policies rather than OR within a single policy
    - This allows each policy to be evaluated independently
    
  3. Changes Made
    - Split user_profiles policies (one for users, one for admins)
    - Split user_subscriptions policies (one for users, one for admins)
    - Split usage_logs policies (one for users, one for admins)
    - Split subscription_plans policies (one for active plans, one for admins)
    - Keep api_keys admin-only policy as is
*/

-- Drop the problematic consolidated policies
DROP POLICY IF EXISTS "View profiles" ON user_profiles;
DROP POLICY IF EXISTS "Update profiles" ON user_profiles;
DROP POLICY IF EXISTS "View subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "View subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "View usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Insert usage logs" ON usage_logs;
DROP POLICY IF EXISTS "View and manage API keys" ON api_keys;

-- user_profiles: Split into user and admin policies
CREATE POLICY "Users view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin = true);

CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Admins insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Admins delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

-- subscription_plans: Split into public and admin policies
CREATE POLICY "Anyone views active plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins view all plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Admins manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

-- user_subscriptions: Split into user and admin policies
CREATE POLICY "Users view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Admins manage subscriptions"
  ON user_subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

-- usage_logs: Split into user and admin policies
CREATE POLICY "Users view own logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );

CREATE POLICY "Users insert own logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- api_keys: Keep admin-only policy
CREATE POLICY "Admins manage API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.is_admin = true
    )
  );