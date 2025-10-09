-- Migration: Create Sets Table
-- Purpose: Store flashcard sets (collections) owned by users
-- Affected: New table 'sets'
-- Special Considerations:
--   - Uses citext for case-insensitive unique set names per user
--   - RLS enabled for multi-tenant security
--   - cards_count maintained by trigger

-- create sets table to organize flashcards into collections
create table sets (
  -- unique identifier for the set
  id uuid primary key default uuid_generate_v4(),
  
  -- owner of this set
  -- cascading delete ensures sets are removed when user profile is deleted
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- name of the set (case-insensitive)
  -- using citext allows case-insensitive uniqueness and comparisons
  name citext not null,
  
  -- language of cards in this set
  -- restricted to supported languages: polish, english, spanish
  language text not null check (language in ('pl', 'en', 'es')),
  
  -- total number of cards in this set
  -- maintained automatically via trigger when cards are added/removed
  cards_count integer not null default 0,
  
  -- timestamp when set was created
  created_at timestamptz not null default now(),
  
  -- timestamp when set was last updated
  -- maintained automatically via trigger
  updated_at timestamptz not null default now(),
  
  -- ensure each user can only have one set with a given name (case-insensitive)
  unique (user_id, name),
  
  -- composite unique constraint required for composite foreign key from cards table
  -- ensures (id, user_id) combination is unique for referential integrity
  unique (id, user_id)
);

-- create index on user_id for efficient filtering by owner
create index sets_user_id_idx on sets(user_id);

-- create index on (user_id, name) for unique constraint enforcement and lookups
-- this index is automatically created by the unique constraint above

-- create index on created_at for sorting sets by creation date
create index sets_created_at_idx on sets(created_at);

-- enable row level security to ensure users can only access their own sets
alter table sets enable row level security;

-- rls policy: allow authenticated users to select their own sets
create policy sets_select_own on sets
  for select
  to authenticated
  using (user_id = auth.uid());

-- rls policy: allow anonymous users to select sets (read-only public access)
create policy sets_select_anon on sets
  for select
  to anon
  using (true);

-- rls policy: allow authenticated users to insert their own sets
create policy sets_insert_own on sets
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- rls policy: allow authenticated users to update their own sets
create policy sets_update_own on sets
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- rls policy: allow authenticated users to delete their own sets
create policy sets_delete_own on sets
  for delete
  to authenticated
  using (user_id = auth.uid());

