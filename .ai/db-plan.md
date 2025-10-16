# Database Schema Plan

## 1. Tables

> **Note:** If you're using Supabase, you must explicitly indicate that the `auth.users` table is managed by Supabase Auth. Otherwise, the migration will create a separate `public.users` table without the built-in authentication, security, and functionality provided by Supabase Auth.

### profiles

This table stores additional user metadata. Supabase Auth manages `auth.users`, and the `id` column references `auth.users(id)`.

- **id**: `uuid` PRIMARY KEY REFERENCES `auth.users(id)` ON DELETE CASCADE

- **cards_count**: `integer` NOT NULL DEFAULT `0`
- **is_admin**: `boolean` NOT NULL DEFAULT `false`
- **created_at**: `timestamptz` NOT NULL DEFAULT `now()`
- **updated_at**: `timestamptz` NOT NULL DEFAULT `now()`

### sets

- **id**: `uuid` PRIMARY KEY
- **user_id**: `uuid` NOT NULL REFERENCES `profiles(id)` ON DELETE CASCADE
- **name**: `citext` NOT NULL
- **language**: `text` NOT NULL CHECK (`language` IN ('pl','en','es'))
- **cards_count**: `integer` NOT NULL DEFAULT `0`
- **created_at**: `timestamptz` NOT NULL DEFAULT `now()`
- **updated_at**: `timestamptz` NOT NULL DEFAULT `now()`
- UNIQUE (`user_id`, `name`)

### generations

This table tracks AI generation sessions for flashcards, providing analytics and auditing capabilities.

- **id**: `uuid` PRIMARY KEY
- **user_id**: `uuid` NOT NULL REFERENCES `profiles(id)` ON DELETE CASCADE
- **set_id**: `uuid` REFERENCES `sets(id)` ON DELETE SET NULL (optional - where generated cards were placed)
- **model**: `text` NOT NULL (e.g., 'gpt-4', 'gpt-4o', 'claude-3.5-sonnet')
- **source_text**: `text` NOT NULL (original text used for generation)
- **source_text_hash**: `text` NOT NULL (SHA-256 hash for deduplication)
- **source_text_length**: `integer` NOT NULL
- **generated_count**: `integer` NOT NULL DEFAULT `0` (total cards generated)
- **accepted_count**: `integer` NOT NULL DEFAULT `0` (cards accepted by user)
- **accepted_unedited_count**: `integer` NOT NULL DEFAULT `0` (accepted without edits)
- **accepted_edited_count**: `integer` NOT NULL DEFAULT `0` (accepted after editing)
- **rejected_count**: `integer` NOT NULL DEFAULT `0` (cards rejected by user)
- **generation_duration_ms**: `integer` (time taken to generate, in milliseconds)
- **prompt_tokens**: `integer` (tokens used in prompt)
- **completion_tokens**: `integer` (tokens in completion)
- **total_cost_usd**: `numeric(10,6)` (estimated cost in USD)
- **created_at**: `timestamptz` NOT NULL DEFAULT `now()`
- **updated_at**: `timestamptz` NOT NULL DEFAULT `now()`

### generation_error_logs

This table logs errors during AI generation for diagnostics and monitoring.

- **id**: `uuid` PRIMARY KEY
- **user_id**: `uuid` NOT NULL REFERENCES `profiles(id)` ON DELETE CASCADE
- **model**: `text` NOT NULL
- **source_text_hash**: `text` (hash of the source text that caused error)
- **source_text_length**: `integer`
- **error_code**: `text` NOT NULL (e.g., 'TIMEOUT', 'API_ERROR', 'RATE_LIMIT', 'INVALID_RESPONSE')
- **error_message**: `text` NOT NULL
- **error_details**: `jsonb` (additional structured error data)
- **retry_count**: `integer` NOT NULL DEFAULT `0`
- **created_at**: `timestamptz` NOT NULL DEFAULT `now()`

### cards

- **id**: `uuid` PRIMARY KEY
- **user_id**: `uuid` NOT NULL
- **set_id**: `uuid` NOT NULL
- FOREIGN KEY (`set_id`, `user_id`) REFERENCES `sets(id, user_id)` ON DELETE CASCADE
- **front**: `text` NOT NULL CHECK (`char_length(front) <= 200`)
- **back**: `text` NOT NULL CHECK (`char_length(back) <= 500`)
- **front_normalized**: `text` GENERATED ALWAYS AS (`lower(front)`) STORED
- **language**: `text` NOT NULL DEFAULT (NULL) <!-- inherit via trigger from sets.language -->
- **due_at**: `timestamptz`
- **interval_days**: `integer` NOT NULL DEFAULT `0`
- **ease_factor**: `real` NOT NULL DEFAULT `2.5`
- **repetitions**: `integer` NOT NULL DEFAULT `0`
- **status**: `card_status` NOT NULL DEFAULT `'new'`
- **generation_id**: `uuid` REFERENCES `generations(id)` ON DELETE SET NULL (nullable - manual cards have no generation)
- **source_text_excerpt**: `text` CHECK (`char_length(source_text_excerpt) <= 500`) (short excerpt for context)
- **ai_confidence_score**: `real` CHECK (`ai_confidence_score >= 0 AND ai_confidence_score <= 1`) (model's confidence, 0-1)
- **was_edited_after_generation**: `boolean` NOT NULL DEFAULT `false`
- **original_front**: `text` (original AI-generated front before user edit)
- **original_back**: `text` (original AI-generated back before user edit)
- **created_at**: `timestamptz` NOT NULL DEFAULT `now()`
- **updated_at**: `timestamptz` NOT NULL DEFAULT `now()`

## 2. Relationships

- **profiles** 1 — \* `sets` via `profiles.id = sets.user_id`
- **profiles** 1 — \* `generations` via `profiles.id = generations.user_id`
- **profiles** 1 — \* `generation_error_logs` via `profiles.id = generation_error_logs.user_id`
- **sets** 1 — \* `cards` via composite `sets(id, user_id) = cards(set_id, user_id)`
- **sets** 1 — \* `generations` via `sets.id = generations.set_id` (optional)
- **generations** 1 — \* `cards` via `generations.id = cards.generation_id` (optional)

## 3. Indexes

- **profiles**:
  - `btree (id)` (PK)

- **sets**:
  - `btree (user_id)`
  - `btree (user_id, name)` (for enforcing unique per user)
  - `btree (created_at)`

- **generations**:
  - `btree (user_id, created_at)` for user's generation history
  - `btree (source_text_hash)` for deduplication checks
  - `btree (model, created_at)` for model performance analysis
  - `btree (set_id)` for finding generations by target set

- **generation_error_logs**:
  - `btree (user_id, created_at)` for user error history
  - `btree (error_code, created_at)` for error pattern analysis
  - `btree (model, created_at)` for model reliability tracking

- **cards**:
  - `btree (set_id, created_at, id)` for keyset pagination
  - `btree (user_id)`
  - `btree (user_id, due_at)` for SRS queries
  - `btree (generation_id)` for finding cards from a generation
  - `gin (front gin_trgm_ops)` for trigram search
  - `gin (back gin_trgm_ops)`

## 4. PostgreSQL Policies (RLS)

Enable RLS on all tenant tables:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_update ON profiles
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY sets_select_update ON sets
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY generations_select_update ON generations
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY generation_error_logs_select_update ON generation_error_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY cards_select_update ON cards
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## 5. Additional Notes

- **Extensions**: require `pg_trgm`; consider `unaccent` for normalization. Also `citext` for case-insensitive `sets.name`.
- **Triggers**:
  - `set_updated_at()` on `profiles`, `sets`, `cards`, `generations` to maintain `updated_at`.
  - Counter triggers on `cards` to update `sets.cards_count` and `profiles.cards_count`.
  - Counter triggers to update `generations` statistics when cards are accepted/rejected/edited.
  - Validation trigger on `cards` to enforce 200 cards per set and 1000 cards per user.

## 6. AI Generation Analytics

The extended schema enables:

- **Cost Tracking**: Monitor AI usage costs per user, model, and time period via `total_cost_usd` and token counts.
- **Quality Metrics**: Track acceptance rates (`accepted_count / generated_count`) and edit rates to measure AI effectiveness.
- **Model Comparison**: A/B test different models by comparing acceptance rates, edit frequency, and generation speed.
- **Deduplication**: Use `source_text_hash` to detect repeated generation requests and potentially serve cached results.
- **Error Monitoring**: Track error patterns by code, model, and time to identify reliability issues.
- **User Analytics**: Understand which users generate most cards, their acceptance patterns, and preferred models.
- **Compliance**: Full audit trail of what AI generated, what users accepted, and any modifications made.
