-- Migration: Create missing profiles for existing users
-- Purpose: Create profiles for any existing users who don't have them
-- Affected: profiles table
-- Special Considerations:
--   - Only creates profiles for users that don't already have them
--   - Safe to run multiple times

-- Create profiles for any existing users who don't have them
INSERT INTO public.profiles (id, cards_count, is_admin)
SELECT 
  au.id,
  0 as cards_count,
  false as is_admin
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
