# Database Plan - 10x Cards

> **Last Verified:** October 9, 2025
> **Status:** ✅ Up to date with migrations and database.types.ts

## Overview

The database schema is designed to support an AI-powered flashcard application with spaced repetition learning (SRS) using the SuperMemo 2 (SM2) algorithm. The schema tracks user profiles, flashcard sets, individual cards, AI generation sessions, and error logging.

## Schema Summary

### Custom Types

#### `card_status` (enum)

Tracks the learning progress of flashcards:

- `'new'` - Card has never been reviewed
- `'learning'` - Card is currently being learned
- `'review'` - Card is in the review phase
- `'relearning'` - Card was forgotten and needs to be relearned

## Tables

### 1. `profiles`

Extends Supabase Auth users with application-specific metadata.

**Columns:**

- `id` (uuid, PK) - References `auth.users(id)` CASCADE DELETE
- `cards_count` (integer, default: 0) - Total cards owned (maintained by trigger)
- `is_admin` (boolean, default: false) - Administrative privileges flag
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now()) - Maintained by trigger

**Relationships:**

- Referenced by: `sets`, `generations`, `generation_error_logs`

**Security:**

- RLS: Enabled (policies disabled for development)

---

### 2. `sets`

Flashcard collections owned by users.

**Columns:**

- `id` (uuid, PK, default: uuid_generate_v4())
- `user_id` (uuid, FK → profiles.id) CASCADE DELETE
- `name` (citext, not null) - Case-insensitive unique per user
- `language` (text, not null) - CHECK: 'pl' | 'en' | 'es'
- `cards_count` (integer, default: 0) - Maintained by trigger
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now()) - Maintained by trigger

**Constraints:**

- UNIQUE(user_id, name) - Case-insensitive
- UNIQUE(id, user_id) - For composite FK from cards

**Indexes:**

- `sets_user_id_idx` - Filter by owner
- `sets_created_at_idx` - Sort by creation date

**Security:**

- RLS: Enabled (policies disabled for development)

---

### 3. `generations`

Tracks AI flashcard generation sessions with detailed analytics.

**Columns:**

- `id` (uuid, PK, default: uuid_generate_v4())
- `user_id` (uuid, FK → profiles.id) CASCADE DELETE
- `set_id` (uuid, FK → sets.id, nullable) SET NULL on delete
- `model` (text, not null) - AI model identifier (e.g., 'gpt-4', 'claude-3.5-sonnet')
- `source_text` (text, not null) - Original text for generation
- `source_text_hash` (text, not null) - SHA-256 hash for deduplication
- `source_text_length` (integer, not null) - Character count
- `generated_count` (integer, default: 0) - Total cards generated
- `accepted_count` (integer, default: 0) - Cards accepted (edited + unedited)
- `accepted_unedited_count` (integer, default: 0) - Cards accepted without changes
- `accepted_edited_count` (integer, default: 0) - Cards accepted after edits
- `rejected_count` (integer, default: 0) - Cards rejected/discarded
- `generation_duration_ms` (integer, nullable) - Generation time
- `prompt_tokens` (integer, nullable) - Tokens in prompt
- `completion_tokens` (integer, nullable) - Tokens in completion
- `total_cost_usd` (numeric(10,6), nullable) - Estimated cost
- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now()) - Maintained by trigger

**Indexes:**

- `generations_user_id_created_at_idx` - User history queries
- `generations_source_text_hash_idx` - Deduplication checks
- `generations_model_created_at_idx` - Model performance analysis
- `generations_set_id_idx` - Find generations by set

**Security:**

- RLS: Enabled (policies disabled for development)

---

### 4. `generation_error_logs`

Tracks errors during AI generation for monitoring and analysis.

**Columns:**

- `id` (uuid, PK, default: uuid_generate_v4())
- `user_id` (uuid, FK → profiles.id) CASCADE DELETE
- `model` (text, not null) - AI model that encountered error
- `source_text_hash` (text, nullable) - Hash of problematic text
- `source_text_length` (integer, nullable) - Length of problematic text
- `error_code` (text, not null) - Categorized error (e.g., 'TIMEOUT', 'API_ERROR', 'RATE_LIMIT')
- `error_message` (text, not null) - Human-readable message
- `error_details` (jsonb, nullable) - Stack traces, API responses, etc.
- `retry_count` (integer, default: 0) - Number of retries before logging
- `created_at` (timestamptz, default: now())

**Indexes:**

- `generation_error_logs_user_id_created_at_idx` - User error history
- `generation_error_logs_error_code_created_at_idx` - Error pattern analysis
- `generation_error_logs_model_created_at_idx` - Model reliability tracking
- `generation_error_logs_error_details_idx` (GIN) - Query nested JSON data

**Security:**

- RLS: Enabled (policies disabled for development)

---

### 5. `cards`

Individual flashcards with SRS metadata and AI attribution.

**Columns:**

#### Core Fields

- `id` (uuid, PK, default: uuid_generate_v4())
- `user_id` (uuid, not null) - Denormalized for efficient RLS
- `set_id` (uuid, FK → sets.id) CASCADE DELETE via composite FK
- `front` (text, not null) - CHECK: char_length <= 200
- `back` (text, not null) - CHECK: char_length <= 500
- `front_normalized` (text, generated) - GENERATED AS lower(front) STORED
- `language` (text, nullable) - Inherited from set via trigger

#### Spaced Repetition (SM2 Algorithm)

- `due_at` (timestamptz, nullable) - Next review date
- `interval_days` (integer, default: 0) - Days until next review
- `ease_factor` (real, default: 2.5) - SM2 ease factor
- `repetitions` (integer, default: 0) - Successful repetition count
- `status` (card_status, default: 'new') - Learning status

#### AI Generation Tracking

- `generation_id` (uuid, FK → generations.id, nullable) SET NULL on delete
- `source_text_excerpt` (text, nullable) - CHECK: char_length <= 500
- `ai_confidence_score` (real, nullable) - CHECK: 0.0 to 1.0
- `was_edited_after_generation` (boolean, default: false)
- `original_front` (text, nullable) - Pre-edit AI output
- `original_back` (text, nullable) - Pre-edit AI output

#### Timestamps

- `created_at` (timestamptz, default: now())
- `updated_at` (timestamptz, default: now()) - Maintained by trigger

**Constraints:**

- FK (set_id, user_id) → sets(id, user_id) CASCADE DELETE

**Indexes:**

- `cards_set_id_created_at_id_idx` - Keyset pagination within sets
- `cards_user_id_idx` - Filter by owner
- `cards_user_id_due_at_idx` - SRS review queries
- `cards_front_trgm_idx` (GIN) - Fuzzy search on front
- `cards_back_trgm_idx` (GIN) - Fuzzy search on back
- `cards_generation_id_idx` - Find cards by generation
- `cards_ai_edited_idx` (partial) - Analytics on edited AI cards

**Security:**

- RLS: Enabled (policies disabled for development)

---

## Extensions Used

Based on migrations:

- `uuid-ossp` - UUID generation (uuid_generate_v4())
- `citext` - Case-insensitive text type
- `pg_trgm` - Trigram similarity for fuzzy search

## Functions & Triggers

According to migrations:

- `20251009100500_create_functions.sql` - Database functions
- `20251009100600_create_triggers.sql` - Auto-update triggers
- `20251009100800_extend_functions_for_ai.sql` - AI-related functions
- `20251009100900_extend_triggers_for_ai.sql` - AI-related triggers

_(Note: Actual function/trigger implementations not documented here - see migration files)_

## Security Model

### Row Level Security (RLS)

- **Status:** Enabled on all tables
- **Policies:** All policies dropped (migration 20251009101000)
- **Current State:** Development mode - no policy enforcement

**To re-enable security for production:**

1. Recreate RLS policies for each table
2. Policies should enforce user_id = auth.uid() for authenticated users
3. Consider read-only anonymous access policies

## Verification Status

✅ **database.types.ts matches migrations:**

- All tables present with correct columns
- All relationships properly mapped
- Enums correctly defined
- Types match database schema

✅ **Foreign key relationships verified:**

- profiles → auth.users
- sets → profiles
- generations → profiles, sets
- generation_error_logs → profiles
- cards → sets (composite FK), generations

✅ **Indexes verified:**

- All documented indexes exist in migrations
- Proper GIN indexes for JSONB and trigram search
- Composite indexes for efficient queries

## Migration History

1. `20251009100000_enable_extensions.sql` - Enable required extensions
2. `20251009100100_create_types.sql` - Create card_status enum
3. `20251009100200_create_profiles_table.sql` - Create profiles table
4. `20251009100300_create_sets_table.sql` - Create sets table
5. `20251009100350_create_generations_table.sql` - Create generations table
6. `20251009100360_create_generation_error_logs_table.sql` - Create error logging
7. `20251009100400_create_cards_table.sql` - Create cards table (base)
8. `20251009100500_create_functions.sql` - Create database functions
9. `20251009100600_create_triggers.sql` - Create triggers
10. `20251009100700_extend_cards_table_for_ai.sql` - Add AI tracking columns
11. `20251009100800_extend_functions_for_ai.sql` - Add AI functions
12. `20251009100900_extend_triggers_for_ai.sql` - Add AI triggers
13. `20251009101000_disable_all_rls_policies.sql` - Disable RLS policies

## Notes

- Character limits enforced at database level (front: 200, back: 500, excerpt: 500)
- All timestamps use `timestamptz` for timezone awareness
- Cascading deletes ensure data consistency
- Denormalized fields (cards_count, user_id in cards) maintained by triggers
- Hash-based deduplication for generation caching
- Comprehensive analytics tracking for AI generation quality
