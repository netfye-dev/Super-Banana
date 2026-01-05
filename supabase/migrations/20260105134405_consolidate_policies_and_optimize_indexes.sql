/*
  # Consolidate RLS Policies and Optimize Indexes

  1. Policy Consolidation
    - Consolidate multiple permissive SELECT policies into single policies with OR conditions
    - This improves clarity, maintainability, and reduces policy evaluation overhead
    - Each table will have one policy per action type that covers all access patterns

  2. Index Optimization
    - Keep foreign key indexes (api_keys_created_by_idx, user_subscriptions_plan_id_idx) as they're essential for join performance
    - Remove truly unused indexes that don't serve a clear purpose
    - Note: Some indexes may show as "unused" simply because the database is new/has low traffic

  3. Changes Made
    - Consolidated api_keys SELECT policies (admin view + admin manage)
    - Consolidated subscription_plans SELECT policies (admin + public)
    - Consolidated usage_logs SELECT policies (users + admins)
    - Consolidated user_profiles SELECT policies (users + admins)
    - Consolidated user_profiles UPDATE policies (users + admins)
    - Consolidated user_subscriptions SELECT policies (users + admins)

  Important Notes:
    - Auth DB connection strategy and leaked password protection must be configured in Supabase Dashboard
    - Foreign key indexes are retained for query performance
*/

-- Drop all existing policies that will be consolidated
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Admins can view API keys" ON api_keys;
DROP POLICY IF EXISTS "Admins can manage API keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Admins can view all usage logs" ON usage_logs;

-- Create consolidated policies for user_profiles
CREATE POLICY "View profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile OR admins can view all profiles
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

CREATE POLICY "Update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile OR admins can update all profiles
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (
    (select auth.uid()) = id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Create consolidated policy for subscription_plans
CREATE POLICY "View subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (
    -- Anyone can view active plans OR admins can view all plans
    is_active = true
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Keep the existing admin management policy for subscription_plans
CREATE POLICY "Manage subscription plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Create consolidated policy for user_subscriptions
CREATE POLICY "View subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own subscription OR admins can view all subscriptions
    (select auth.uid()) = user_id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Keep the existing admin management policy for user_subscriptions
CREATE POLICY "Manage subscriptions"
  ON user_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Create consolidated policy for api_keys
CREATE POLICY "View and manage API keys"
  ON api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Create consolidated policy for usage_logs
CREATE POLICY "View usage logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own logs OR admins can view all logs
    (select auth.uid()) = user_id
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = (select auth.uid()) AND up.is_admin = true
    )
  );

-- Keep the existing insert policy for usage_logs
CREATE POLICY "Insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Evaluate and remove truly unused indexes
-- Keep foreign key indexes as they're important for join performance
-- Remove other unused indexes that don't serve a clear immediate purpose

-- Drop unused non-foreign-key indexes
DROP INDEX IF EXISTS usage_logs_user_id_idx;
DROP INDEX IF EXISTS usage_logs_created_at_idx;
DROP INDEX IF EXISTS user_subscriptions_stripe_customer_id_idx;
DROP INDEX IF EXISTS user_subscriptions_user_id_idx;

-- Note: We keep api_keys_created_by_idx and user_subscriptions_plan_id_idx 
-- as they index foreign keys and will improve join performance