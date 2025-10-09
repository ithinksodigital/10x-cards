-- Migration: Create Profiles Table
-- Purpose: Store additional user metadata beyond Supabase Auth
-- Affected: New table 'profiles'
-- Special Considerations: 
--   - References auth.users (managed by Supabase Auth)
--   - RLS enabled for security
--   - cards_count maintained by trigger

-- create profiles table to extend auth.users with application-specific data
create table profiles (
  -- primary key references supabase auth.users table
  -- cascading delete ensures profile is removed when user account is deleted
  id uuid primary key references auth.users(id) on delete cascade,
  
  -- total number of cards owned by this user across all sets
  -- maintained automatically via trigger when cards are added/removed
  cards_count integer not null default 0,
  
  -- flag indicating if user has administrative privileges
  -- used for access control to admin-only features
  is_admin boolean not null default false,
  
  -- timestamp when profile was created
  created_at timestamptz not null default now(),
  
  -- timestamp when profile was last updated
  -- maintained automatically via trigger
  updated_at timestamptz not null default now()
);

-- enable row level security to restrict access to profile data
alter table profiles enable row level security;

-- rls policy: allow authenticated users to select their own profile
create policy profiles_select_own on profiles
  for select
  to authenticated
  using (id = auth.uid());

-- rls policy: allow anonymous users to select profiles (read-only public access)
create policy profiles_select_anon on profiles
  for select
  to anon
  using (true);

-- rls policy: allow authenticated users to insert their own profile
create policy profiles_insert_own on profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- rls policy: allow authenticated users to update their own profile
create policy profiles_update_own on profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- rls policy: allow authenticated users to delete their own profile
create policy profiles_delete_own on profiles
  for delete
  to authenticated
  using (id = auth.uid());

-- create index on id (already created as primary key, this is implicit)
-- index used for fast lookups when joining with other tables

