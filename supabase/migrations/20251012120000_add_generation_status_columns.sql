-- Migration: Add Status Tracking Columns to Generations Table
-- Purpose: Add missing columns for generation status tracking
-- Affected: generations table (adding nullable columns)

-- Add status column to track generation state
alter table generations 
  add column status text check (status in ('processing', 'completed', 'failed')) default 'processing';

-- Add progress column for tracking completion percentage
alter table generations 
  add column progress integer check (progress >= 0 and progress <= 100) default 0;

-- Add message column for status updates
alter table generations 
  add column message text;

-- Add completion timestamp
alter table generations 
  add column completed_at timestamptz;

-- Add failure timestamp
alter table generations 
  add column failed_at timestamptz;

-- Add error message for failed generations
alter table generations 
  add column error_message text;

-- Add error code for failed generations
alter table generations 
  add column error_code text;

-- Add estimated completion time
alter table generations 
  add column estimated_completion timestamptz;

-- Add cards column to store generated flashcards as JSON
alter table generations 
  add column cards jsonb;

-- Create index on status for filtering generations by state
create index generations_status_idx on generations(status);

-- Create index on (user_id, status) for user's active generations
create index generations_user_id_status_idx on generations(user_id, status);

-- Update existing generations to have 'completed' status (for MVP)
update generations 
set status = 'completed', 
    progress = 100,
    completed_at = updated_at
where status is null;
