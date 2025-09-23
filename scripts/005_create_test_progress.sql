-- Create table for tracking test progress (pending tests)
CREATE TABLE IF NOT EXISTS public.test_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  category_code TEXT NOT NULL,
  current_question INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, test_id)
);

-- Enable RLS
ALTER TABLE public.test_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "test_progress_select_own" ON public.test_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "test_progress_insert_own" ON public.test_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "test_progress_update_own" ON public.test_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "test_progress_delete_own" ON public.test_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_test_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER test_progress_updated_at
  BEFORE UPDATE ON public.test_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_test_progress_updated_at();
