-- Migration: Create Helper Functions
-- Purpose: Create reusable database functions for triggers and application logic
-- Affected: New database functions
-- Special Considerations: These functions are used by triggers defined in subsequent migrations

-- function to automatically update the updated_at timestamp
-- used by triggers on profiles, sets, and cards tables
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- function to inherit language from parent set to card
-- ensures cards automatically get the language from their set
create or replace function inherit_language_from_set()
returns trigger as $$
begin
  -- set the card's language to match its parent set's language
  select language into new.language
  from sets
  where id = new.set_id;
  
  return new;
end;
$$ language plpgsql;

-- function to enforce card limits per set and per user
-- prevents users from exceeding 200 cards per set or 1000 cards total
create or replace function enforce_card_limits()
returns trigger as $$
declare
  set_card_count integer;
  user_card_count integer;
begin
  -- check card count in the target set
  select cards_count into set_card_count
  from sets
  where id = new.set_id;
  
  -- enforce max 200 cards per set
  if set_card_count >= 200 then
    raise exception 'Cannot add more than 200 cards to a single set';
  end if;
  
  -- check total card count for the user
  select cards_count into user_card_count
  from profiles
  where id = new.user_id;
  
  -- enforce max 1000 cards per user
  if user_card_count >= 1000 then
    raise exception 'Cannot add more than 1000 cards per user';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- function to increment set card counter when a card is inserted
create or replace function increment_set_cards_count()
returns trigger as $$
begin
  update sets
  set cards_count = cards_count + 1
  where id = new.set_id;
  
  return new;
end;
$$ language plpgsql;

-- function to decrement set card counter when a card is deleted
create or replace function decrement_set_cards_count()
returns trigger as $$
begin
  update sets
  set cards_count = cards_count - 1
  where id = old.set_id;
  
  return old;
end;
$$ language plpgsql;

-- function to increment profile card counter when a card is inserted
create or replace function increment_profile_cards_count()
returns trigger as $$
begin
  update profiles
  set cards_count = cards_count + 1
  where id = new.user_id;
  
  return new;
end;
$$ language plpgsql;

-- function to decrement profile card counter when a card is deleted
create or replace function decrement_profile_cards_count()
returns trigger as $$
begin
  update profiles
  set cards_count = cards_count - 1
  where id = old.user_id;
  
  return old;
end;
$$ language plpgsql;

-- function to handle set_id changes (update counters accordingly)
create or replace function handle_card_set_change()
returns trigger as $$
begin
  -- only process if set_id actually changed
  if old.set_id != new.set_id then
    -- decrement old set's counter
    update sets
    set cards_count = cards_count - 1
    where id = old.set_id;
    
    -- increment new set's counter
    update sets
    set cards_count = cards_count + 1
    where id = new.set_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

