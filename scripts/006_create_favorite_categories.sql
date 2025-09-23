-- Create table for user favorite categories
CREATE TABLE IF NOT EXISTS user_favorite_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_code TEXT REFERENCES categories(code) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_code)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_favorite_categories_user_id ON user_favorite_categories(user_id);

-- Add RLS policies
ALTER TABLE user_favorite_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorite categories" ON user_favorite_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite categories" ON user_favorite_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite categories" ON user_favorite_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Add column to profiles to track if user has completed onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
