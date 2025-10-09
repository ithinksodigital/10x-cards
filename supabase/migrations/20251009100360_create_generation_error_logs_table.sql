-- Migration: Create Generation Error Logs Table
-- Purpose: Track and monitor errors during AI flashcard generation
-- Affected: New table 'generation_error_logs'
-- Special Considerations:
--   - RLS enabled for security
--   - JSONB column for flexible error detail storage
--   - Indexed for error pattern analysis

-- create generation_error_logs table to track ai generation failures
create table generation_error_logs (
  -- unique identifier for the error log entry
  id uuid primary key default uuid_generate_v4(),
  
  -- user who experienced the error
  -- cascading delete ensures error logs are removed when user profile is deleted
  user_id uuid not null references profiles(id) on delete cascade,
  
  -- ai model that encountered the error
  model text not null,
  
  -- hash of source text that caused the error (if applicable)
  -- nullable because some errors occur before text is processed
  source_text_hash text,
  
  -- length of source text that caused error (if applicable)
  source_text_length integer,
  
  -- categorized error code for aggregation and filtering
  -- examples: 'TIMEOUT', 'API_ERROR', 'RATE_LIMIT', 'INVALID_RESPONSE', 'QUOTA_EXCEEDED'
  error_code text not null,
  
  -- human-readable error message
  error_message text not null,
  
  -- additional structured error information (stack traces, api responses, etc.)
  -- stored as jsonb for flexibility and queryability
  error_details jsonb,
  
  -- number of retry attempts made before logging this error
  retry_count integer not null default 0,
  
  -- timestamp when error occurred
  created_at timestamptz not null default now()
);

-- create index on (user_id, created_at) for user error history queries
-- supports: "show me all errors for this user, recent first"
create index generation_error_logs_user_id_created_at_idx on generation_error_logs(user_id, created_at desc);

-- create index on (error_code, created_at) for error pattern analysis
-- supports: "how many timeout errors occurred today?"
create index generation_error_logs_error_code_created_at_idx on generation_error_logs(error_code, created_at desc);

-- create index on (model, created_at) for model reliability tracking
-- supports: "which model has the most errors this week?"
create index generation_error_logs_model_created_at_idx on generation_error_logs(model, created_at desc);

-- create gin index on error_details for querying nested json data
-- supports: "find all errors with specific api error codes in details"
create index generation_error_logs_error_details_idx on generation_error_logs using gin(error_details);

-- enable row level security to ensure users can only access their own error logs
alter table generation_error_logs enable row level security;

-- rls policy: allow authenticated users to select their own error logs
create policy generation_error_logs_select_own on generation_error_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- rls policy: allow anonymous users to select error logs (read-only public access)
create policy generation_error_logs_select_anon on generation_error_logs
  for select
  to anon
  using (true);

-- rls policy: allow authenticated users to insert their own error logs
create policy generation_error_logs_insert_own on generation_error_logs
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- rls policy: allow authenticated users to update their own error logs
create policy generation_error_logs_update_own on generation_error_logs
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- rls policy: allow authenticated users to delete their own error logs
create policy generation_error_logs_delete_own on generation_error_logs
  for delete
  to authenticated
  using (user_id = auth.uid());

