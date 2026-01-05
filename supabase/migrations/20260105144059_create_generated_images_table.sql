/*
  # Create generated_images table for history

  1. New Tables
    - `generated_images`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `title` (text)
      - `prompt` (text)
      - `image_url` (text) - URL or base64 data
      - `image_type` (text) - thumbnail, product, reimagine
      - `metadata` (jsonb) - additional data like assets, settings
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on generated_images table
    - Users can view their own images
    - Users can insert their own images
    - Users can delete their own images
    - Admins can view all images
*/

CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt text NOT NULL,
  image_url text NOT NULL,
  image_type text NOT NULL CHECK (image_type IN ('thumbnail', 'product', 'reimagine')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_at ON generated_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_type ON generated_images(image_type);

-- RLS Policies
CREATE POLICY "Users view own images"
  ON generated_images FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own images"
  ON generated_images FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own images"
  ON generated_images FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all images"
  ON generated_images FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins delete any image"
  ON generated_images FOR DELETE
  TO authenticated
  USING (is_admin());
