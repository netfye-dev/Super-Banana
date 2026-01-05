/*
  # Fix Security and Performance Issues

  ## 1. Auth RLS Performance Optimization
    - Wrap auth.uid() calls in (select auth.uid()) to prevent re-evaluation per row
    - This significantly improves query performance at scale
    - Affects policies: Users view own profile, Users update own profile, Users view own subscription, Users view own logs, Users insert own logs

  ## 2. Function Security
    - Fix is_admin() function to use stable search_path
    - Prevents potential security issues from search_path manipulation

  ## 3. Index Optimization
    - Ensure foreign key indexes exist
    - Add helpful indexes for common query patterns
*/

-- Fix is_admin() function with stable search_path (CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT is_admin 
    FROM public.user_profiles 
    WHERE id = auth.uid()
  );
END;
$$;

-- Drop and recreate user_profiles policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users view own profile" ON user_profiles;
CREATE POLICY "Users view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate user_subscriptions policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users view own subscription" ON user_subscriptions;
CREATE POLICY "Users view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Drop and recreate usage_logs policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users view own logs" ON usage_logs;
CREATE POLICY "Users view own logs"
  ON usage_logs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users insert own logs" ON usage_logs;
CREATE POLICY "Users insert own logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "System can insert usage logs" ON usage_logs;
CREATE POLICY "System can insert usage logs"
  ON usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Ensure indexes exist for foreign keys and common queries
CREATE INDEX IF NOT EXISTS usage_logs_user_id_idx ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_plan_id_idx ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS api_keys_created_by_idx ON api_keys(created_by);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_customer_id_idx ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS usage_logs_action_type_idx ON usage_logs(action_type);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON user_subscriptions(status);