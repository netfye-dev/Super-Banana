/*
  # Fix API Keys Access for All Users

  ## Overview
  This migration allows ALL authenticated users to read active API keys for image generation,
  while keeping INSERT/UPDATE/DELETE restricted to admins only.

  ## Changes
  1. Drop existing restrictive SELECT policy
  2. Create new SELECT policy that allows all authenticated users to read active API keys
  3. Keep INSERT/UPDATE/DELETE policies admin-only for security
  
  ## Security
  - All authenticated users can SELECT active API keys (needed for image generation)
  - Only admins can INSERT, UPDATE, DELETE API keys
  - Users can only see active keys, not inactive/test keys
  
  ## Rationale
  API keys need to be accessible to all users for the AI generation services to work.
  The keys are system-wide configuration, not user-specific data.
*/

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view API keys" ON api_keys;

-- Create new SELECT policy that allows all authenticated users to read ACTIVE api keys
CREATE POLICY "All users can view active API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Keep INSERT/UPDATE/DELETE policies admin-only (these are already in place)
-- No changes needed to:
-- - "Admins can insert API keys"
-- - "Admins can update API keys"  
-- - "Admins can delete API keys"
