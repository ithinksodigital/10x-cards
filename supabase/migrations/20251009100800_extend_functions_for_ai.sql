-- Migration: Add Functions for AI Generation Analytics
-- Purpose: Create helper functions for tracking generation statistics
-- Affected: New database functions
-- Special Considerations: These functions maintain denormalized counters in generations table

-- function to update generation statistics when a card is accepted
-- called when user accepts a card from a generation session
create or replace function update_generation_on_card_accept()
returns trigger as $$
declare
  was_edited boolean;
begin
  -- only process if card has a generation_id
  if new.generation_id is not null then
    -- determine if card was edited
    was_edited := new.was_edited_after_generation;
    
    -- increment appropriate counters in generations table
    update generations
    set 
      accepted_count = accepted_count + 1,
      accepted_unedited_count = accepted_unedited_count + case when not was_edited then 1 else 0 end,
      accepted_edited_count = accepted_edited_count + case when was_edited then 1 else 0 end,
      updated_at = now()
    where id = new.generation_id;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- function to update generation statistics when a card edit status changes
-- tracks when users modify ai-generated cards after initial acceptance
create or replace function update_generation_on_card_edit()
returns trigger as $$
begin
  -- only process if card has a generation_id and edit status changed
  if new.generation_id is not null and 
     old.was_edited_after_generation != new.was_edited_after_generation then
    
    -- if card was just edited for the first time
    if new.was_edited_after_generation = true then
      update generations
      set 
        accepted_unedited_count = accepted_unedited_count - 1,
        accepted_edited_count = accepted_edited_count + 1,
        updated_at = now()
      where id = new.generation_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- function to decrement generation accepted count when a card is deleted
-- maintains accurate statistics when user removes previously accepted cards
create or replace function update_generation_on_card_delete()
returns trigger as $$
begin
  -- only process if card had a generation_id
  if old.generation_id is not null then
    update generations
    set 
      accepted_count = accepted_count - 1,
      accepted_unedited_count = accepted_unedited_count - case when not old.was_edited_after_generation then 1 else 0 end,
      accepted_edited_count = accepted_edited_count - case when old.was_edited_after_generation then 1 else 0 end,
      updated_at = now()
    where id = old.generation_id;
  end if;
  
  return old;
end;
$$ language plpgsql;

-- function to track when ai-generated content is edited
-- automatically sets was_edited_after_generation flag and preserves originals
create or replace function track_ai_card_edits()
returns trigger as $$
begin
  -- only process if card was ai-generated and front/back changed
  if new.generation_id is not null and 
     (old.front != new.front or old.back != new.back) then
    
    -- preserve original values if not already saved
    if new.original_front is null then
      new.original_front := old.front;
    end if;
    
    if new.original_back is null then
      new.original_back := old.back;
    end if;
    
    -- mark as edited
    new.was_edited_after_generation := true;
  end if;
  
  return new;
end;
$$ language plpgsql;

