-- Migration: Create Custom Types
-- Purpose: Define custom enum types used across the schema
-- Affected: Database-wide types
-- Special Considerations: These types must be created before tables that reference them

-- create card_status enum for tracking card learning progress
-- 'new': card has never been reviewed
-- 'learning': card is currently being learned
-- 'review': card is in the review phase
-- 'relearning': card was forgotten and needs to be relearned
create type card_status as enum ('new', 'learning', 'review', 'relearning');

