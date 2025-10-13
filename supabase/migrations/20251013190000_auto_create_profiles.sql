-- Migration: Auto-create profiles for new users
-- Purpose: Automatically create a profile when a user signs up
-- Affected: profiles table, auth.users trigger
-- Special Considerations:
--   - Creates a trigger on auth.users to auto-create profiles
--   - Ensures all authenticated users have profiles

-- Create a function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, cards_count, is_admin)
  values (new.id, 0, false);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile when user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
