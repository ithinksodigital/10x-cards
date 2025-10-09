-- Migration: Create Triggers
-- Purpose: Automatically maintain timestamps, counters, and data consistency
-- Affected: profiles, sets, cards tables
-- Special Considerations: 
--   - Triggers fire automatically on insert/update/delete operations
--   - Counter triggers maintain denormalized counts for performance

-- ============================================================
-- PROFILES TABLE TRIGGERS
-- ============================================================

-- trigger to automatically update updated_at on profile changes
create trigger profiles_set_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

-- ============================================================
-- SETS TABLE TRIGGERS
-- ============================================================

-- trigger to automatically update updated_at on set changes
create trigger sets_set_updated_at
  before update on sets
  for each row
  execute function set_updated_at();

-- ============================================================
-- CARDS TABLE TRIGGERS
-- ============================================================

-- trigger to automatically update updated_at on card changes
create trigger cards_set_updated_at
  before update on cards
  for each row
  execute function set_updated_at();

-- trigger to inherit language from parent set on card insert
-- fires before insert to set the language field from the parent set
create trigger cards_inherit_language_on_insert
  before insert on cards
  for each row
  execute function inherit_language_from_set();

-- trigger to update language when card is moved to a different set
-- fires before update to keep language in sync with parent set
create trigger cards_inherit_language_on_update
  before update on cards
  for each row
  when (old.set_id is distinct from new.set_id)
  execute function inherit_language_from_set();

-- trigger to enforce card limits before inserting new cards
-- prevents exceeding 200 cards per set or 1000 cards per user
create trigger cards_enforce_limits
  before insert on cards
  for each row
  execute function enforce_card_limits();

-- trigger to increment set counter when a card is inserted
-- maintains denormalized sets.cards_count for performance
create trigger cards_increment_set_count
  after insert on cards
  for each row
  execute function increment_set_cards_count();

-- trigger to decrement set counter when a card is deleted
-- maintains denormalized sets.cards_count for performance
create trigger cards_decrement_set_count
  after delete on cards
  for each row
  execute function decrement_set_cards_count();

-- trigger to increment profile counter when a card is inserted
-- maintains denormalized profiles.cards_count for performance
create trigger cards_increment_profile_count
  after insert on cards
  for each row
  execute function increment_profile_cards_count();

-- trigger to decrement profile counter when a card is deleted
-- maintains denormalized profiles.cards_count for performance
create trigger cards_decrement_profile_count
  after delete on cards
  for each row
  execute function decrement_profile_cards_count();

-- trigger to handle counter updates when a card is moved between sets
-- updates both old and new set counters appropriately
create trigger cards_handle_set_change
  after update on cards
  for each row
  when (old.set_id is distinct from new.set_id)
  execute function handle_card_set_change();

