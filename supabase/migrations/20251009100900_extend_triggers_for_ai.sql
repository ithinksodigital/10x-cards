-- Migration: Add Triggers for AI Generation Tracking
-- Purpose: Automatically maintain generation statistics and track card edits
-- Affected: cards table, generations table
-- Special Considerations:
--   - Triggers maintain denormalized counts for performance
--   - Track edit history for ai-generated cards
--   - Execute in correct order to maintain data consistency

-- trigger to update updated_at timestamp on generations table
create trigger generations_set_updated_at
  before update on generations
  for each row
  execute function set_updated_at();

-- trigger to update generation statistics when a card is accepted (inserted)
-- fires after insert to update the generation's accepted counters
create trigger cards_update_generation_on_accept
  after insert on cards
  for each row
  execute function update_generation_on_card_accept();

-- trigger to track edits to ai-generated cards
-- fires before update to preserve original content and set edit flag
create trigger cards_track_ai_edits
  before update on cards
  for each row
  when (new.generation_id is not null)
  execute function track_ai_card_edits();

-- trigger to update generation statistics when card edit status changes
-- fires after update to adjust generation counters for edited vs unedited
create trigger cards_update_generation_on_edit
  after update on cards
  for each row
  when (new.generation_id is not null and 
        old.was_edited_after_generation is distinct from new.was_edited_after_generation)
  execute function update_generation_on_card_edit();

-- trigger to update generation statistics when a card is deleted
-- fires after delete to decrement the generation's accepted counters
create trigger cards_update_generation_on_delete
  after delete on cards
  for each row
  when (old.generation_id is not null)
  execute function update_generation_on_card_delete();

