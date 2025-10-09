-- Migration: Extend Cards Table for AI Generation Tracking
-- Purpose: Add columns to track AI-generated cards, edits, and source attribution
-- Affected: Existing table 'cards' (adding nullable columns)
-- Special Considerations:
--   - All new columns are nullable to support existing manual cards
--   - Foreign key to generations table with SET NULL on delete
--   - Preserves original AI output for audit trail

-- add generation_id to link cards to their generation session
-- nullable because manually created cards don't have a generation
-- set null on delete preserves card even if generation record is deleted
alter table cards 
  add column generation_id uuid references generations(id) on delete set null;

-- add excerpt of source text for user context
-- limited to 500 characters to avoid bloating the cards table
alter table cards 
  add column source_text_excerpt text check (char_length(source_text_excerpt) <= 500);

-- add ai confidence score (0.0 to 1.0)
-- helps users understand how confident the model was about this card
alter table cards 
  add column ai_confidence_score real check (ai_confidence_score >= 0 and ai_confidence_score <= 1);

-- flag indicating if user edited the card after ai generation
-- important for tracking acceptance quality and model improvement
alter table cards 
  add column was_edited_after_generation boolean not null default false;

-- preserve original ai-generated front text before user edits
-- enables a/b testing and model fine-tuning by comparing edits
alter table cards 
  add column original_front text;

-- preserve original ai-generated back text before user edits
-- enables quality analysis and understanding what users change
alter table cards 
  add column original_back text;

-- create index on generation_id for finding all cards from a generation session
-- supports: "show me all cards from this generation"
create index cards_generation_id_idx on cards(generation_id);

-- create partial index on cards that were ai-generated and edited
-- supports analytics: "what percentage of ai cards get edited?"
create index cards_ai_edited_idx on cards(generation_id, was_edited_after_generation) 
  where generation_id is not null and was_edited_after_generation = true;

-- add helpful comment to the table
comment on column cards.generation_id is 'Links to the AI generation session that created this card (null for manual cards)';
comment on column cards.source_text_excerpt is 'Short excerpt from the source text used to generate this card';
comment on column cards.ai_confidence_score is 'AI model confidence score (0-1), higher means more confident';
comment on column cards.was_edited_after_generation is 'True if user modified the card after AI generation';
comment on column cards.original_front is 'Original AI-generated front text before user edits';
comment on column cards.original_back is 'Original AI-generated back text before user edits';

