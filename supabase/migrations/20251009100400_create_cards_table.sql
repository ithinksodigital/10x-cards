-- Migration: Create Cards Table
-- Purpose: Store individual flashcards with spaced repetition data
-- Affected: New table 'cards'
-- Special Considerations:
--   - Composite foreign key to sets for data integrity
--   - Generated column for normalized front text
--   - RLS enabled for multi-tenant security
--   - Character limits enforced via CHECK constraints

-- create cards table to store individual flashcards with srs metadata
create table cards (
  -- unique identifier for the card
  id uuid primary key default uuid_generate_v4(),
  
  -- owner of this card (denormalized for efficient rls checks)
  user_id uuid not null,
  
  -- set this card belongs to
  set_id uuid not null,
  
  -- front side of the card (question/prompt)
  -- limited to 200 characters for ui consistency
  front text not null check (char_length(front) <= 200),
  
  -- back side of the card (answer)
  -- limited to 500 characters for ui consistency
  back text not null check (char_length(back) <= 500),
  
  -- normalized version of front text for case-insensitive searching
  -- automatically generated and stored for performance
  front_normalized text generated always as (lower(front)) stored,
  
  -- language of this card (inherited from parent set via trigger)
  -- initially null, will be set by trigger on insert/update
  language text,
  
  -- timestamp when card is next due for review
  -- null for new cards that haven't been reviewed yet
  due_at timestamptz,
  
  -- number of days until next review (used in sm2 algorithm)
  -- starts at 0 for new cards
  interval_days integer not null default 0,
  
  -- ease factor for spaced repetition (used in sm2 algorithm)
  -- starts at 2.5 (sm2 default), adjusted based on review performance
  ease_factor real not null default 2.5,
  
  -- number of successful repetitions (used in sm2 algorithm)
  -- incremented on successful reviews, reset on failure
  repetitions integer not null default 0,
  
  -- current learning status of the card
  status card_status not null default 'new',
  
  -- timestamp when card was created
  created_at timestamptz not null default now(),
  
  -- timestamp when card was last updated
  -- maintained automatically via trigger
  updated_at timestamptz not null default now(),
  
  -- composite foreign key ensures card belongs to a set owned by the same user
  -- cascading delete ensures cards are removed when parent set is deleted
  foreign key (set_id, user_id) references sets(id, user_id) on delete cascade
);

-- create composite index for efficient keyset pagination within a set
-- supports queries like: "get next 50 cards from set X ordered by creation"
create index cards_set_id_created_at_id_idx on cards(set_id, created_at, id);

-- create index on user_id for efficient filtering by owner
create index cards_user_id_idx on cards(user_id);

-- create index on (user_id, due_at) for spaced repetition queries
-- supports queries like: "get all cards due for review for user X"
create index cards_user_id_due_at_idx on cards(user_id, due_at);

-- create gin index on front using trigram similarity for fuzzy search
-- enables fast similarity searches like "find cards with front similar to 'hello'"
create index cards_front_trgm_idx on cards using gin(front gin_trgm_ops);

-- create gin index on back using trigram similarity for fuzzy search
-- enables fast similarity searches on card answers
create index cards_back_trgm_idx on cards using gin(back gin_trgm_ops);

-- enable row level security to ensure users can only access their own cards
alter table cards enable row level security;

-- rls policy: allow authenticated users to select their own cards
create policy cards_select_own on cards
  for select
  to authenticated
  using (user_id = auth.uid());

-- rls policy: allow anonymous users to select cards (read-only public access)
create policy cards_select_anon on cards
  for select
  to anon
  using (true);

-- rls policy: allow authenticated users to insert their own cards
create policy cards_insert_own on cards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- rls policy: allow authenticated users to update their own cards
create policy cards_update_own on cards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- rls policy: allow authenticated users to delete their own cards
create policy cards_delete_own on cards
  for delete
  to authenticated
  using (user_id = auth.uid());

