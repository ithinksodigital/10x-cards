-- Migration: Allow Anonymous Generations
-- Purpose: Enable anonymous users to generate flashcards without requiring authentication
-- Affected: generations table
-- Special Considerations:
--   - Remove foreign key constraint to profiles table
--   - Update RLS policies to handle anonymous users
--   - Allow anonymous user_id values

-- First, drop the foreign key constraint
alter table generations drop constraint if exists generations_user_id_fkey;

-- Update the user_id column to allow any string (including 'anonymous-user')
-- We'll keep it as text to allow both UUIDs and anonymous identifiers
alter table generations alter column user_id type text;

-- Update RLS policies to handle anonymous users

-- Drop existing policies
drop policy if exists generations_select_own on generations;
drop policy if exists generations_select_anon on generations;
drop policy if exists generations_insert_own on generations;
drop policy if exists generations_update_own on generations;
drop policy if exists generations_delete_own on generations;

-- Create new policies that handle both authenticated and anonymous users

-- Policy: Allow users to select their own generations (authenticated users)
create policy generations_select_authenticated on generations
  for select
  to authenticated
  using (user_id = auth.uid()::text);

-- Policy: Allow anonymous users to select generations by user_id
create policy generations_select_anonymous on generations
  for select
  to anon
  using (true);

-- Policy: Allow authenticated users to insert their own generations
create policy generations_insert_authenticated on generations
  for insert
  to authenticated
  with check (user_id = auth.uid()::text);

-- Policy: Allow anonymous users to insert generations with anonymous user_id
create policy generations_insert_anonymous on generations
  for insert
  to anon
  with check (user_id = 'anonymous-user');

-- Policy: Allow authenticated users to update their own generations
create policy generations_update_authenticated on generations
  for update
  to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Policy: Allow anonymous users to update their own generations
create policy generations_update_anonymous on generations
  for update
  to anon
  using (user_id = 'anonymous-user')
  with check (user_id = 'anonymous-user');

-- Policy: Allow authenticated users to delete their own generations
create policy generations_delete_authenticated on generations
  for delete
  to authenticated
  using (user_id = auth.uid()::text);

-- Policy: Allow anonymous users to delete their own generations
create policy generations_delete_anonymous on generations
  for delete
  to anon
  using (user_id = 'anonymous-user');

-- Update the index to work with text user_id
drop index if exists generations_user_id_created_at_idx;
create index generations_user_id_created_at_idx on generations(user_id, created_at desc);
