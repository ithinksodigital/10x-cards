-- MVP Setup: Hardcoded user and permissive RLS policies
-- WARNING: This is for development/testing only! Remove before production.

-- 1. Remove foreign key constraint from profiles (MVP only!)
--    This allows us to create a profile without auth.users entry
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Create hardcoded MVP user in profiles table
INSERT INTO profiles (id, cards_count, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Temporarily disable RLS for MVP testing (DEVELOPMENT ONLY!)
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should:
-- 1. Re-add foreign key constraint: 
--    ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
--    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- 2. Enable RLS back: ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
-- 3. Create proper policies that check auth.uid()
-- 4. Remove the hardcoded user from profiles

-- Example of proper RLS policies for future reference:
/*
-- Re-enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Create proper policies
CREATE POLICY "Users can insert their own generations" ON generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own generations" ON generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" ON generations
  FOR UPDATE
  USING (auth.uid() = user_id);
*/

