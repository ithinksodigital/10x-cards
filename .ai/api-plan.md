# REST API Plan

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Profile | `profiles` | User profile and metadata |
| Set | `sets` | Collection of flashcards owned by user |
| Card | `cards` | Individual flashcard with SRS data |
| Generation | `generations` | AI generation session metadata |
| SRS Session | N/A (ephemeral) | Active spaced repetition study session |

## 2. Endpoints

### 2.2 Sets

#### List Sets
- **Method:** `GET`
- **Path:** `/api/sets`
- **Description:** Returns paginated list of user's sets
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer, default: 1) - Page number
  - `limit` (integer, default: 50, max: 50) - Items per page
  - `search` (string, optional) - Search by set name
  - `sort` (string, optional: `created_at`, `updated_at`, `name`, default: `created_at`) - Sort field
  - `order` (string, optional: `asc`, `desc`, default: `desc`) - Sort order
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "name": "Spanish Vocabulary",
        "language": "es",
        "cards_count": 45,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 120,
      "total_pages": 3
    }
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `400 Bad Request` - Invalid query parameters

#### Get Set
- **Method:** `GET`
- **Path:** `/api/sets/:id`
- **Description:** Returns single set details
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Spanish Vocabulary",
    "language": "es",
    "cards_count": 45,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set not found or does not belong to user

#### Create Set
- **Method:** `POST`
- **Path:** `/api/sets`
- **Description:** Creates new flashcard set
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Spanish Vocabulary",
    "language": "es"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Spanish Vocabulary",
    "language": "es",
    "cards_count": 0,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
  ```
- **Success:** `201 Created`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `400 Bad Request` - Validation errors
    ```json
    {
      "error": "Validation failed",
      "details": {
        "name": "Name is required and must be unique",
        "language": "Language must be one of: pl, en, es"
      }
    }
    ```
  - `409 Conflict` - Set with this name already exists for user

#### Update Set
- **Method:** `PATCH`
- **Path:** `/api/sets/:id`
- **Description:** Updates set metadata (name only; language is immutable)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "name": "Spanish Vocabulary - Updated"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Spanish Vocabulary - Updated",
    "language": "es",
    "cards_count": 45,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set not found
  - `400 Bad Request` - Validation errors
  - `409 Conflict` - Set with new name already exists

#### Delete Set
- **Method:** `DELETE`
- **Path:** `/api/sets/:id`
- **Description:** Deletes set and all its cards (cascade)
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Set and 45 cards successfully deleted"
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set not found

---

### 2.3 Cards

#### List Cards in Set
- **Method:** `GET`
- **Path:** `/api/sets/:setId/cards`
- **Description:** Returns paginated list of cards in a set
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer, default: 1) - Page number
  - `limit` (integer, default: 50, max: 50) - Items per page
  - `search` (string, optional) - Search in front/back text
  - `status` (string, optional: `new`, `learning`, `review`, `relearning`) - Filter by SRS status
  - `sort` (string, optional: `created_at`, `due_at`, default: `created_at`) - Sort field
  - `order` (string, optional: `asc`, `desc`, default: `desc`) - Sort order
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "set_id": "uuid",
        "user_id": "uuid",
        "front": "¿Cómo estás?",
        "back": "How are you?",
        "language": "es",
        "due_at": "2025-01-05T00:00:00Z",
        "interval_days": 3,
        "ease_factor": 2.5,
        "repetitions": 2,
        "status": "review",
        "generation_id": "uuid",
        "source_text_excerpt": "Common greetings in Spanish...",
        "ai_confidence_score": 0.95,
        "was_edited_after_generation": false,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45,
      "total_pages": 1
    }
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set not found
  - `400 Bad Request` - Invalid query parameters

#### Get Card
- **Method:** `GET`
- **Path:** `/api/cards/:id`
- **Description:** Returns single card with full details
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "uuid",
    "set_id": "uuid",
    "user_id": "uuid",
    "front": "¿Cómo estás?",
    "back": "How are you?",
    "language": "es",
    "due_at": "2025-01-05T00:00:00Z",
    "interval_days": 3,
    "ease_factor": 2.5,
    "repetitions": 2,
    "status": "review",
    "generation_id": "uuid",
    "source_text_excerpt": "Common greetings in Spanish...",
    "ai_confidence_score": 0.95,
    "was_edited_after_generation": false,
    "original_front": null,
    "original_back": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Card not found

#### Create Card (Manual)
- **Method:** `POST`
- **Path:** `/api/sets/:setId/cards`
- **Description:** Manually creates a new card in set
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "front": "¿Cómo estás?",
    "back": "How are you?"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "set_id": "uuid",
    "user_id": "uuid",
    "front": "¿Cómo estás?",
    "back": "How are you?",
    "language": "es",
    "due_at": null,
    "interval_days": 0,
    "ease_factor": 2.5,
    "repetitions": 0,
    "status": "new",
    "generation_id": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
  ```
- **Success:** `201 Created`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set not found
  - `400 Bad Request` - Validation errors
    ```json
    {
      "error": "Validation failed",
      "details": {
        "front": "Front text required, max 200 characters",
        "back": "Back text required, max 500 characters"
      }
    }
    ```
  - `409 Conflict` - Duplicate card detected in set
  - `422 Unprocessable Entity` - Limit exceeded
    ```json
    {
      "error": "Limit exceeded",
      "message": "Set has reached maximum of 200 cards"
    }
    ```
    ```json
    {
      "error": "Limit exceeded",
      "message": "User has reached maximum of 1000 cards"
    }
    ```

#### Batch Create Cards (From AI Generation)
- **Method:** `POST`
- **Path:** `/api/sets/:setId/cards/batch`
- **Description:** Creates multiple cards at once from AI generation acceptance
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "generation_id": "uuid",
    "cards": [
      {
        "front": "¿Cómo estás?",
        "back": "How are you?",
        "source_text_excerpt": "Common greetings...",
        "ai_confidence_score": 0.95,
        "was_edited": false,
        "original_front": null,
        "original_back": null
      }
    ]
  }
  ```
- **Response:**
  ```json
  {
    "created": 30,
    "cards": [ /* array of created card objects */ ],
    "generation_updated": true
  }
  ```
- **Success:** `201 Created`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set or generation not found
  - `400 Bad Request` - Validation errors
  - `422 Unprocessable Entity` - Limit exceeded
    ```json
    {
      "error": "Limit exceeded",
      "message": "Cannot add 30 cards. Set limit: 200, current: 180, available: 20",
      "details": {
        "requested": 30,
        "available_in_set": 20,
        "available_in_account": 50
      }
    }
    ```

#### Update Card
- **Method:** `PATCH`
- **Path:** `/api/cards/:id`
- **Description:** Updates card content (creates version history)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "front": "¿Cómo estás? (informal)",
    "back": "How are you? (casual greeting)"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "set_id": "uuid",
    "user_id": "uuid",
    "front": "¿Cómo estás? (informal)",
    "back": "How are you? (casual greeting)",
    "language": "es",
    "was_edited_after_generation": true,
    "original_front": "¿Cómo estás?",
    "original_back": "How are you?",
    "updated_at": "2025-01-02T00:00:00Z"
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Card not found
  - `400 Bad Request` - Validation errors
  - `409 Conflict` - Duplicate card detected

#### Delete Card
- **Method:** `DELETE`
- **Path:** `/api/cards/:id`
- **Description:** Deletes card and updates counters
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Card successfully deleted"
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Card not found

---

### 2.4 AI Generation

#### Start Generation
- **Method:** `POST`
- **Path:** `/api/generations`
- **Description:** Initiates AI generation of flashcards from source text (async operation)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "source_text": "Long text content here...",
    "language": "es",
    "target_count": 30
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "status": "processing",
    "model": "gpt-4o",
    "source_text_hash": "sha256hash",
    "source_text_length": 12450,
    "estimated_duration_ms": 8500,
    "created_at": "2025-01-01T00:00:00Z"
  }
  ```
- **Success:** `202 Accepted`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `400 Bad Request` - Validation errors
    ```json
    {
      "error": "Validation failed",
      "details": {
        "source_text": "Text must be between 100 and 15000 characters",
        "language": "Language must be one of: pl, en, es"
      }
    }
    ```
  - `429 Too Many Requests` - Rate limit exceeded
    ```json
    {
      "error": "Rate limit exceeded",
      "message": "Maximum 10 generations per hour",
      "retry_after": 3600
    }
    ```

#### Get Generation Status
- **Method:** `GET`
- **Path:** `/api/generations/:id`
- **Description:** Polls generation status and retrieves results when complete
- **Headers:** `Authorization: Bearer <token>`
- **Response (Processing):**
  ```json
  {
    "id": "uuid",
    "status": "processing",
    "progress": 45,
    "message": "Generating cards from chunk 2 of 3..."
  }
  ```
- **Response (Completed):**
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "status": "completed",
    "model": "gpt-4o",
    "source_text": "Original text...",
    "source_text_hash": "sha256hash",
    "source_text_length": 12450,
    "generated_count": 30,
    "generation_duration_ms": 7850,
    "prompt_tokens": 3200,
    "completion_tokens": 1800,
    "total_cost_usd": 0.0245,
    "created_at": "2025-01-01T00:00:00Z",
    "completed_at": "2025-01-01T00:00:08Z",
    "cards": [
      {
        "front": "¿Cómo estás?",
        "back": "How are you?",
        "source_text_excerpt": "Common greetings in Spanish...",
        "ai_confidence_score": 0.95
      }
    ]
  }
  ```
- **Response (Failed):**
  ```json
  {
    "id": "uuid",
    "status": "failed",
    "error": {
      "code": "TIMEOUT",
      "message": "Generation timed out after 3 retries",
      "retry_count": 3
    }
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Generation not found

#### Retry Failed Generation
- **Method:** `POST`
- **Path:** `/api/generations/:id/retry`
- **Description:** Retries a failed generation
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "id": "uuid",
    "status": "processing",
    "message": "Generation retry initiated"
  }
  ```
- **Success:** `202 Accepted`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Generation not found
  - `409 Conflict` - Generation already completed or processing

#### List Generations
- **Method:** `GET`
- **Path:** `/api/generations`
- **Description:** Returns user's generation history
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (integer, default: 1)
  - `limit` (integer, default: 50, max: 50)
  - `status` (string, optional: `processing`, `completed`, `failed`)
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "status": "completed",
        "model": "gpt-4o",
        "source_text_length": 12450,
        "generated_count": 30,
        "accepted_count": 25,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "total_pages": 1
    }
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token

---

### 2.5 SRS Sessions

#### Get Due Cards
- **Method:** `GET`
- **Path:** `/api/srs/due`
- **Description:** Returns cards due for review today
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `set_id` (uuid, optional) - Filter by specific set
- **Response:**
  ```json
  {
    "new_cards_available": 15,
    "review_cards_available": 42,
    "daily_limits": {
      "new_cards": 20,
      "reviews": 100,
      "new_cards_remaining": 20,
      "reviews_remaining": 100
    },
    "cards": [
      {
        "id": "uuid",
        "set_id": "uuid",
        "front": "¿Cómo estás?",
        "back": "How are you?",
        "status": "review",
        "due_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token

#### Start SRS Session
- **Method:** `POST`
- **Path:** `/api/srs/sessions`
- **Description:** Creates new SRS study session
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "set_id": "uuid",
    "new_cards_limit": 20,
    "review_cards_limit": 100
  }
  ```
- **Response:**
  ```json
  {
    "session_id": "uuid",
    "cards": [
      {
        "id": "uuid",
        "front": "¿Cómo estás?",
        "back": "How are you?",
        "status": "new"
      }
    ],
    "total_cards": 30,
    "new_cards": 10,
    "review_cards": 20
  }
  ```
- **Success:** `201 Created`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Set not found
  - `422 Unprocessable Entity` - Daily limit reached
    ```json
    {
      "error": "Daily limit reached",
      "message": "You have reached your daily limit for new cards",
      "limits": {
        "new_cards_today": 20,
        "new_cards_limit": 20
      }
    }
    ```

#### Submit Card Review
- **Method:** `POST`
- **Path:** `/api/srs/reviews`
- **Description:** Records user rating for a card (1-5 scale, SM-2 algorithm)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
  ```json
  {
    "card_id": "uuid",
    "rating": 4,
    "session_id": "uuid"
  }
  ```
- **Response:**
  ```json
  {
    "card_id": "uuid",
    "next_review_at": "2025-01-08T00:00:00Z",
    "interval_days": 7,
    "ease_factor": 2.6,
    "repetitions": 3,
    "status": "review"
  }
  ```
- **Success:** `201 Created`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Card or session not found
  - `400 Bad Request` - Invalid rating
    ```json
    {
      "error": "Validation failed",
      "details": {
        "rating": "Rating must be between 1 and 5"
      }
    }
    ```

#### Get Session Summary
- **Method:** `GET`
- **Path:** `/api/srs/sessions/:id/summary`
- **Description:** Returns statistics for completed or ongoing session
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "session_id": "uuid",
    "started_at": "2025-01-01T10:00:00Z",
    "completed_at": "2025-01-01T10:15:00Z",
    "total_cards": 30,
    "cards_reviewed": 30,
    "average_rating": 3.8,
    "ratings_distribution": {
      "1": 1,
      "2": 2,
      "3": 8,
      "4": 12,
      "5": 7
    },
    "time_spent_seconds": 900
  }
  ```
- **Success:** `200 OK`
- **Errors:**
  - `401 Unauthorized` - Invalid or missing token
  - `404 Not Found` - Session not found

---

## 3. Authentication and Authorization

### Mechanism
The API uses **Supabase Auth** with JWT bearer tokens for authentication.

### Implementation Details

#### Client Authentication Flow
1. User clicks "Login with Google" in frontend
2. Frontend calls Supabase Auth SDK: `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. OAuth flow redirects to Google, user authorizes
4. User returns to app with session token
5. Frontend stores token in Supabase client (automatic)
6. All API requests include token in `Authorization: Bearer <token>` header

#### Server-Side Validation
1. Every API endpoint validates JWT token via Supabase Auth
2. Token contains `user_id` (mapped to `auth.uid()`)
3. Row Level Security (RLS) policies enforce user isolation at database level

#### RLS Policies
All user tables (`profiles`, `sets`, `cards`, `generations`, `generation_error_logs`) have RLS enabled with policies:

```sql
-- Example for sets table
CREATE POLICY sets_select_update ON sets
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

This ensures users can only access their own data, even if API logic has bugs.

#### Session Management
- Sessions persist across browser refreshes (stored in localStorage by Supabase)
- Token refresh handled automatically by Supabase client
- Logout invalidates session server-side
- Expired tokens return `401 Unauthorized` and trigger re-authentication

#### Edge Functions Security
- AI generation calls executed in Supabase Edge Functions
- API keys (OpenRouter) stored as Edge Function secrets
- Never exposed to client
- Rate limiting applied per user via Edge Function logic

---

## 4. Validation and Business Logic

### 4.1 Card Validation

#### Field Constraints
- `front`: Required, 1-200 characters
- `back`: Required, 1-500 characters
- `language`: Must be one of: `pl`, `en`, `es`
- `ai_confidence_score`: Optional, 0.0-1.0 range
- `source_text_excerpt`: Optional, max 500 characters

#### Business Rules
1. **Duplicate Detection**
   - Before creating/updating card, check for existing card with identical `front_normalized` in same set
   - `front_normalized` is auto-generated as `lower(front)` via database trigger
   - If potential duplicate found, return `409 Conflict` with suggestion

2. **Limit Enforcement**
   - **Set Limit:** Maximum 200 cards per set
   - **Account Limit:** Maximum 1000 cards per user account
   - Check both limits before allowing card creation
   - Return `422 Unprocessable Entity` with clear message if limit exceeded

3. **Language Inheritance**
   - New manual cards inherit `language` from parent set
   - AI-generated cards use detected language from source text
   - Language is immutable after card creation

### 4.2 Set Validation

#### Field Constraints
- `name`: Required, case-insensitive unique per user (via `citext` type)
- `language`: Required, must be `pl`, `en`, or `es`

#### Business Rules
1. **Name Uniqueness**
   - Set name must be unique per user (case-insensitive)
   - Return `409 Conflict` if duplicate name detected

2. **Language Immutability**
   - `language` cannot be changed after set creation
   - Ensures consistency with existing cards

### 4.3 Generation Validation

#### Field Constraints
- `source_text`: Required, 100-15,000 characters
- `language`: Optional (auto-detected if not provided), must be `pl`, `en`, or `es`
- `target_count`: Optional, default 30, range 1-30

#### Business Rules
1. **Text Chunking**
   - If source text > 10,000 characters, split into chunks of ~5,000 characters
   - Process each chunk separately
   - Combine results and deduplicate

2. **Deduplication Within Batch**
   - After generation, detect duplicate cards within the 30-card batch
   - Remove duplicates by comparing normalized front text
   - Ensure exactly 30 unique cards returned (regenerate if needed)

3. **Rate Limiting**
   - Maximum 10 generations per user per hour (enforced in Edge Function)
   - Return `429 Too Many Requests` if exceeded

4. **Timeout and Retry**
   - Initial timeout: 30 seconds per chunk
   - Automatic retry with exponential backoff (2x, 4x)
   - Maximum 3 retry attempts
   - If all retries fail, mark generation as `failed` and log to `generation_error_logs`

5. **Cost Tracking**
   - Record `prompt_tokens`, `completion_tokens` from AI provider
   - Calculate `total_cost_usd` based on model pricing
   - Store in `generations` table for analytics

### 4.4 SRS Session Logic

#### Daily Limits
- **New Cards:** 20 per day (global default)
- **Reviews:** 100 per day (global default)
- Limits reset at midnight UTC
- Track daily progress in ephemeral session state

#### SM-2 Algorithm Implementation
Card scheduling follows SuperMemo 2 (SM-2) algorithm:

1. **Initial State** (`status: 'new'`)
   - `interval_days: 0`
   - `ease_factor: 2.5`
   - `repetitions: 0`

2. **Rating Scale**
   - 1: Complete blackout
   - 2: Incorrect response
   - 3: Correct with difficulty
   - 4: Correct with hesitation
   - 5: Perfect response

3. **Interval Calculation**
   - Rating < 3: Reset to learning (`interval: 0`, `repetitions: 0`)
   - Rating ≥ 3: Increase interval
     - First repetition: 1 day
     - Second repetition: 6 days
     - Subsequent: `interval = previous_interval * ease_factor`

4. **Ease Factor Update**
   - `new_ease = old_ease + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))`
   - Minimum ease factor: 1.3

5. **Status Transitions**
   - `new` → `learning` (after first review)
   - `learning` → `review` (after 2 successful reviews)
   - `review` → `relearning` (if rating < 3)
   - `relearning` → `review` (after 2 successful reviews)

#### Session Card Selection
1. Fetch cards where `due_at <= NOW()` OR `status = 'new'`
2. Order by: `due_at ASC NULLS LAST, created_at ASC`
3. Limit by daily remaining allowance (new/review)
4. Return mixed set of new and due cards

### 4.5 Analytics and Tracking

#### Generation Analytics
Track in `generations` table:
- `accepted_count`: Cards saved from this generation
- `accepted_unedited_count`: Cards saved without edits
- `accepted_edited_count`: Cards saved after inline editing
- `rejected_count`: Cards not accepted (derived: `generated_count - accepted_count`)

Updated via API when user saves batch:
```json
POST /api/sets/:id/cards/batch
{
  "generation_id": "uuid",
  "cards": [...]
}
```

Backend increments counters based on `was_edited` flag in request.

#### Error Logging
Failed generations logged to `generation_error_logs`:
- `error_code`: TIMEOUT, API_ERROR, RATE_LIMIT, INVALID_RESPONSE
- `error_message`: Human-readable description
- `error_details`: JSON with stack trace, API response, etc.
- `retry_count`: Number of retry attempts

### 4.6 Data Export (GDPR)

#### Export Format
```json
{
  "profile": {
    "id": "uuid",
    "cards_count": 450,
    "created_at": "2025-01-01T00:00:00Z"
  },
  "sets": [
    {
      "id": "uuid",
      "name": "Spanish Vocabulary",
      "language": "es",
      "cards": [
        {
          "id": "uuid",
          "front": "¿Cómo estás?",
          "back": "How are you?",
          "created_at": "2025-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "generations": [
    {
      "id": "uuid",
      "model": "gpt-4o",
      "generated_count": 30,
      "accepted_count": 25,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "export_date": "2025-01-10T00:00:00Z",
  "export_version": "1.0"
}
```

---

## 5. Error Response Format

All error responses follow consistent structure:

```json
{
  "error": "Error category",
  "message": "Human-readable error message",
  "details": {
    "field1": "Specific validation error",
    "field2": "Another validation error"
  },
  "code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Standard HTTP Status Codes
- `200 OK` - Successful GET/PATCH/DELETE
- `201 Created` - Successful POST
- `202 Accepted` - Async operation initiated
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid auth token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Duplicate resource
- `422 Unprocessable Entity` - Business rule violation (limits)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Unexpected server error

---

## 6. Performance Considerations

### Pagination
- Default page size: 50 items
- Maximum page size: 50 items (enforced)
- Use keyset pagination for cards: `ORDER BY created_at, id` with cursor
- Response includes pagination metadata (total, pages, current page)

### Database Indexes
Optimized for common queries:

- **sets**: `(user_id, name)`, `(user_id, created_at)`
- **cards**: `(set_id, created_at, id)`, `(user_id, due_at)`, `GIN(front gin_trgm_ops)`, `GIN(back gin_trgm_ops)`
- **generations**: `(user_id, created_at)`, `(source_text_hash)`, `(model, created_at)`

### Caching Strategy
- Card lists: Cache for 5 minutes with user-specific keys
- Set metadata: Cache for 10 minutes
- Due cards: No caching (must be real-time)
- Generation status: Cache for 1 second (polling endpoint)

### Rate Limiting
- AI Generation: 10 requests/hour per user
- Card Creation: 100 requests/hour per user
- General API: 1000 requests/hour per user
- Enforced in Supabase Edge Functions

---

## 7. Versioning

API versioning handled via URL path prefix:

- Current: `/api/v1/...` (implicit v1, can omit)
- Future: `/api/v2/...`

Breaking changes require new version. Non-breaking changes (new fields, endpoints) added to current version.

