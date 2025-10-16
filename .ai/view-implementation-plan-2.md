# REST API Implementation Plan: Sets, Cards, and SRS Endpoints

## Spis treści

1. [Sets Endpoints](#1-sets-endpoints)
2. [Cards Endpoints](#2-cards-endpoints)
3. [SRS Endpoints](#3-srs-endpoints)
4. [Shared Components](#4-shared-components)
5. [Security Considerations](#5-security-considerations)
6. [Implementation Order](#6-implementation-order)

---

# 1. Sets Endpoints

## 1.1 List Sets - GET /api/sets

### Przegląd

Zwraca paginowaną listę zestawów użytkownika z możliwością wyszukiwania i sortowania.

### Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/sets`
- **Headers:** `Authorization: Bearer <token>` (z Supabase Auth)
- **Query Parameters:**
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 50, max: 50)
  - `search` (string, optional) - wyszukiwanie w nazwie
  - `sort` (enum, optional: `created_at`, `updated_at`, `name`, default: `created_at`)
  - `order` (enum, optional: `asc`, `desc`, default: `desc`)

### Wykorzystywane typy

```typescript
// Request
interface ListSetsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "created_at" | "updated_at" | "name";
  order?: "asc" | "desc";
}

// Response
interface ListSetsResponseDto {
  data: SetDto[];
  pagination: PaginationDto;
}
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing/invalid token
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Walidacja query parameters (Zod schema)
2. Pobranie user_id z context.locals.supabase.auth.getUser()
3. Wywołanie SetService.listSets(userId, query)
4. Service wykonuje zapytanie do Supabase:
   - WHERE user_id = userId
   - ILIKE search na name (jeśli podane)
   - ORDER BY sort field, order direction
   - LIMIT i OFFSET dla paginacji
5. Obliczenie pagination metadata
6. Zwrócenie odpowiedzi

### Walidacja Zod

```typescript
const ListSetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(50),
  search: z.string().optional(),
  sort: z.enum(["created_at", "updated_at", "name"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
```

### Względy bezpieczeństwa

- JWT validation przez Supabase Auth
- RLS policy: `user_id = auth.uid()`
- Query parameters sanitized przez Zod
- Search input escape przez Supabase client

### Obsługa błędów

- Invalid query params → 400 z validation details
- Auth failure → 401 Unauthorized
- Database error → 500 z logged error

### Rozważania wydajności

- Index: `btree (user_id, created_at)`
- Index: `btree (user_id, name)`
- Limit maksymalny 50 items
- Cache response na 10 minut (opcjonalnie)

### Kroki implementacji

1. Stwórz `/src/pages/api/sets.ts`
2. Export GET function
3. Zdefiniuj ListSetsQuerySchema
4. Walidacja query params
5. Pobierz user_id z auth
6. Wywołaj SetService.listSets()
7. Return JSON response

---

## 1.2 Get Set - GET /api/sets/:id

### Przegląd

Zwraca szczegóły pojedynczego zestawu.

### Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/sets/:id`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `id` (uuid, required) - ID zestawu

### Wykorzystywane typy

```typescript
// Response
type GetSetResponseDto = SetDto;
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set not found or doesn't belong to user
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Walidacja UUID parametru
2. Pobranie user_id z auth
3. Wywołanie SetService.getSet(setId, userId)
4. Service wykonuje:
   - SELECT FROM sets WHERE id = setId
   - RLS automatycznie sprawdza user_id
5. Jeśli not found → throw 404
6. Zwrócenie SetDto

### Walidacja Zod

```typescript
const UuidSchema = z.string().uuid("Invalid UUID format");
```

### Względy bezpieczeństwa

- RLS policy zapewnia, że user może widzieć tylko swoje sety
- UUID validation przeciwko injection

### Obsługa błędów

- Invalid UUID → 400 Bad Request
- Set not found → 404 Not Found
- RLS denied → 404 Not Found (nie ujawniamy istnienia)

### Kroki implementacji

1. W `/src/pages/api/sets/[id].ts` export GET function
2. Walidacja params.id jako UUID
3. Pobierz user_id
4. Wywołaj SetService.getSet()
5. Handle 404 error
6. Return JSON response

---

## 1.3 Create Set - POST /api/sets

### Przegląd

Tworzy nowy zestaw flashcards.

### Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/sets`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**

```json
{
  "name": "Spanish Vocabulary",
  "language": "es"
}
```

### Wykorzystywane typy

```typescript
// Request (już zdefiniowane w types.ts)
type CreateSetCommand = Pick<TablesInsert<"sets">, "name" | "language">;

// Response
type CreateSetResponseDto = SetDto;
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `201 Created` - Success
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `409 Conflict` - Set name already exists for user
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Parse JSON body
2. Walidacja przez Zod schema
3. Pobranie user_id z auth
4. Wywołanie SetService.createSet(command, userId)
5. Service wykonuje:
   - Sprawdzenie unikalności nazwy (citext, unique constraint)
   - INSERT INTO sets (user_id, name, language)
   - Return created set
6. Handle duplicate → 409 Conflict
7. Zwrócenie SetDto z status 201

### Walidacja Zod

```typescript
const CreateSetSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must not exceed 100 characters"),
  language: z.enum(["pl", "en", "es"], {
    errorMap: () => ({ message: "Language must be one of: pl, en, es" }),
  }),
});
```

### Względy bezpieczeństwa

- Name sanitized przez Zod
- Language restricted to enum
- RLS policy auto-sets user_id
- Unique constraint na (user_id, name)

### Obsługa błędów

```typescript
// Validation errors
{
  "error": "Validation failed",
  "details": {
    "name": "Name is required and must be unique",
    "language": "Language must be one of: pl, en, es"
  },
  "timestamp": "2025-01-01T00:00:00Z"
}

// Conflict
{
  "error": "Conflict",
  "message": "Set with this name already exists",
  "code": "DUPLICATE_SET_NAME",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Kroki implementacji

1. W `/src/pages/api/sets.ts` export POST function
2. Parse request.json()
3. Validate z CreateSetSchema
4. Get user_id
5. Call SetService.createSet()
6. Catch duplicate error (code '23505') → 409
7. Return 201 Created

---

## 1.4 Update Set - PATCH /api/sets/:id

### Przegląd

Aktualizuje nazwę zestawu. Language jest niemutowalne.

### Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/sets/:id`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**

```json
{
  "name": "Spanish Vocabulary - Updated"
}
```

### Wykorzystywane typy

```typescript
// Request
type UpdateSetCommand = Pick<TablesUpdate<"sets">, "name">;

// Response
type UpdateSetResponseDto = SetDto;
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set not found
- `409 Conflict` - New name conflicts with existing set
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Walidacja UUID i body
2. Get user_id
3. SetService.updateSet(setId, command, userId)
4. Service wykonuje:
   - UPDATE sets SET name = ?, updated_at = now() WHERE id = ? AND user_id = ?
   - RLS weryfikuje ownership
5. Check rows affected → 0 means 404
6. Return updated SetDto

### Walidacja Zod

```typescript
const UpdateSetSchema = z.object({
  name: z.string().min(1).max(100),
});
```

### Względy bezpieczeństwa

- RLS zapewnia że user może aktualizować tylko swoje sety
- Language immutability enforced przez pominięcie w schema

### Obsługa błędów

- Set not found → 404
- Duplicate name → 409
- Invalid name → 400

### Kroki implementacji

1. W `/src/pages/api/sets/[id].ts` export PATCH function
2. Validate params.id i body
3. Call SetService.updateSet()
4. Handle errors
5. Return 200 OK

---

## 1.5 Delete Set - DELETE /api/sets/:id

### Przegląd

Usuwa zestaw i wszystkie jego karty (CASCADE).

### Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/sets/:id`
- **Headers:** `Authorization: Bearer <token>`

### Wykorzystywane typy

```typescript
// Response
interface DeleteSetResponseDto {
  message: string;
}
```

### Szczegóły odpowiedzi

```json
{
  "message": "Set and 45 cards successfully deleted"
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set not found
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate UUID
2. Get user_id
3. SetService.deleteSet(setId, userId)
4. Service wykonuje:
   - Count cards before delete
   - DELETE FROM sets WHERE id = ? AND user_id = ?
   - CASCADE delete cards (via FK)
   - Trigger updates profiles.cards_count
5. Return success message z licznikiem

### Względy bezpieczeństwa

- RLS enforcement
- CASCADE delete przez FK constraint
- Trigger auto-updates counters

### Obsługa błędów

- Set not found → 404
- DB error → 500

### Kroki implementacji

1. W `/src/pages/api/sets/[id].ts` export DELETE function
2. Validate params.id
3. Get cards_count before delete
4. Call SetService.deleteSet()
5. Return success message

---

# 2. Cards Endpoints

## 2.1 List Cards in Set - GET /api/sets/:setId/cards

### Przegląd

Zwraca paginowaną listę kart w zestawie z opcjami filtrowania.

### Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/sets/:setId/cards`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `setId` (uuid, required)
- **Query Parameters:**
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 50, max: 50)
  - `search` (string, optional) - search in front/back
  - `status` (enum, optional: `new`, `learning`, `review`, `relearning`)
  - `sort` (enum, optional: `created_at`, `due_at`, default: `created_at`)
  - `order` (enum, optional: `asc`, `desc`, default: `desc`)

### Wykorzystywane typy

```typescript
interface ListCardsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "new" | "learning" | "review" | "relearning";
  sort?: "created_at" | "due_at";
  order?: "asc" | "desc";
}

interface ListCardsResponseDto {
  data: CardDto[];
  pagination: PaginationDto;
}
```

### Szczegóły odpowiedzi

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
      "source_text_excerpt": "Common greetings...",
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

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set not found
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate setId UUID i query params
2. Get user_id
3. Verify set exists and belongs to user
4. CardService.listCards(setId, userId, query)
5. Service wykonuje:
   - SELECT FROM cards WHERE set_id = ? AND user_id = ?
   - Apply filters (status, search with ILIKE on front/back)
   - ORDER BY sort, order
   - LIMIT, OFFSET pagination
6. Calculate pagination metadata
7. Return response

### Walidacja Zod

```typescript
const ListCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(50),
  search: z.string().optional(),
  status: z.enum(["new", "learning", "review", "relearning"]).optional(),
  sort: z.enum(["created_at", "due_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
```

### Względy bezpieczeństwa

- RLS policy na cards
- Set ownership verification
- Search sanitized przez Supabase

### Rozważania wydajności

- Index: `btree (set_id, created_at, id)` for keyset pagination
- Index: `gin (front gin_trgm_ops)`, `gin (back gin_trgm_ops)` for search
- Cache 5 minut

### Kroki implementacji

1. Create `/src/pages/api/sets/[setId]/cards.ts`
2. Export GET function
3. Validate params and query
4. Verify set ownership
5. Call CardService.listCards()
6. Return response

---

## 2.2 Get Card - GET /api/cards/:id

### Przegląd

Zwraca szczegóły pojedynczej karty z pełnymi informacjami włącznie z original_front/back.

### Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/cards/:id`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `id` (uuid, required)

### Wykorzystywane typy

```typescript
type GetCardResponseDto = CardDetailDto;
```

### Szczegóły odpowiedzi

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
  "source_text_excerpt": "Common greetings...",
  "ai_confidence_score": 0.95,
  "was_edited_after_generation": false,
  "original_front": null,
  "original_back": null,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Card not found
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate UUID
2. Get user_id
3. CardService.getCard(cardId, userId)
4. RLS verifies ownership
5. Return CardDetailDto

### Kroki implementacji

1. Create `/src/pages/api/cards/[id].ts`
2. Export GET function
3. Validate params.id
4. Call CardService.getCard()
5. Handle 404
6. Return response

---

## 2.3 Create Card (Manual) - POST /api/sets/:setId/cards

### Przegląd

Ręczne tworzenie pojedynczej karty w zestawie.

### Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/sets/:setId/cards`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**

```json
{
  "front": "¿Cómo estás?",
  "back": "How are you?"
}
```

### Wykorzystywane typy

```typescript
type CreateCardCommand = Pick<TablesInsert<"cards">, "front" | "back">;
type CreateCardResponseDto = CardDto;
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `201 Created` - Success
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set not found
- `409 Conflict` - Duplicate card (same front_normalized)
- `422 Unprocessable Entity` - Limit exceeded
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate setId i body
2. Get user_id
3. Verify set exists and belongs to user
4. CardService.createCard(setId, command, userId)
5. Service wykonuje:
   - Check limits (200/set, 1000/user)
   - Check duplicate (front_normalized)
   - Get language from set
   - INSERT INTO cards
   - Trigger updates counters
6. Return CardDto

### Walidacja Zod

```typescript
const CreateCardSchema = z.object({
  front: z.string().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters"),
  back: z.string().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters"),
});
```

### Business Logic

```typescript
// CardService.createCard()
async createCard(setId: string, command: CreateCardCommand, userId: string): Promise<CardDto> {
  // 1. Get set and verify ownership
  const set = await this.getSetWithOwnership(setId, userId);

  // 2. Check set limit (200 cards/set)
  if (set.cards_count >= 200) {
    throw new LimitExceededError('Set has reached maximum of 200 cards');
  }

  // 3. Get user's total cards count
  const { data: profile } = await this.supabase
    .from('profiles')
    .select('cards_count')
    .eq('id', userId)
    .single();

  // 4. Check user limit (1000 cards/account)
  if (profile.cards_count >= 1000) {
    throw new LimitExceededError('User has reached maximum of 1000 cards');
  }

  // 5. Check for duplicate (front_normalized)
  const duplicate = await this.checkDuplicate(setId, command.front);
  if (duplicate) {
    throw new DuplicateCardError('Card with this front text already exists in set');
  }

  // 6. Insert card
  const { data: card, error } = await this.supabase
    .from('cards')
    .insert({
      set_id: setId,
      user_id: userId,
      front: command.front,
      back: command.back,
      // language inherited via trigger from set
      // defaults: status='new', ease_factor=2.5, interval_days=0, repetitions=0
    })
    .select()
    .single();

  if (error) throw error;

  // Triggers automatically update:
  // - sets.cards_count
  // - sets.updated_at
  // - profiles.cards_count

  return card;
}
```

### Obsługa błędów

```json
// Limit exceeded - Set
{
  "error": "Limit exceeded",
  "message": "Set has reached maximum of 200 cards",
  "code": "SET_LIMIT_EXCEEDED",
  "timestamp": "2025-01-01T00:00:00Z"
}

// Limit exceeded - User
{
  "error": "Limit exceeded",
  "message": "User has reached maximum of 1000 cards",
  "code": "USER_LIMIT_EXCEEDED",
  "timestamp": "2025-01-01T00:00:00Z"
}

// Duplicate card
{
  "error": "Conflict",
  "message": "Card with this front text already exists in set",
  "code": "DUPLICATE_CARD",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Kroki implementacji

1. W `/src/pages/api/sets/[setId]/cards.ts` export POST function
2. Validate setId i body
3. Verify set ownership
4. Call CardService.createCard()
5. Handle limits (422), duplicates (409)
6. Return 201 Created

---

## 2.4 Batch Create Cards - POST /api/sets/:setId/cards/batch

### Przegląd

Tworzy wiele kart naraz z AI generation. Aktualizuje statystyki generation.

### Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/sets/:setId/cards/batch`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
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

### Wykorzystywane typy

```typescript
// Request
interface BatchCreateCardsCommand {
  generation_id: string;
  cards: BatchCreateCardItemCommand[];
}

interface BatchCreateCardItemCommand {
  front: string;
  back: string;
  source_text_excerpt?: string;
  ai_confidence_score?: number;
  was_edited: boolean;
  original_front?: string | null;
  original_back?: string | null;
}

// Response
interface BatchCreateCardsResponseDto {
  created: number;
  cards: CardDto[];
  generation_updated: boolean;
}
```

### Szczegóły odpowiedzi

```json
{
  "created": 30,
  "cards": [
    /* array of CardDto */
  ],
  "generation_updated": true
}
```

**Status Codes:**

- `201 Created` - Success
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set or generation not found
- `422 Unprocessable Entity` - Limit exceeded
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate setId, body
2. Get user_id
3. Verify set i generation należą do user
4. CardService.batchCreateCards(setId, command, userId)
5. Service wykonuje w transakcji:
   - Check combined limits (set: 200, user: 1000)
   - Deduplicate within batch
   - Bulk INSERT cards
   - Update generation stats:
     - accepted_count += cards.length
     - accepted_edited_count += cards.filter(c => c.was_edited).length
     - accepted_unedited_count += cards.filter(c => !c.was_edited).length
     - rejected_count = generated_count - accepted_count
   - Update generation.set_id = setId
   - Triggers update counters
6. Return response

### Walidacja Zod

```typescript
const BatchCreateCardsSchema = z.object({
  generation_id: z.string().uuid("Invalid generation ID"),
  cards: z
    .array(
      z.object({
        front: z.string().min(1).max(200),
        back: z.string().min(1).max(500),
        source_text_excerpt: z.string().max(500).optional(),
        ai_confidence_score: z.number().min(0).max(1).optional(),
        was_edited: z.boolean(),
        original_front: z.string().max(200).nullable().optional(),
        original_back: z.string().max(500).nullable().optional(),
      })
    )
    .min(1)
    .max(30),
});
```

### Business Logic

```typescript
// CardService.batchCreateCards()
async batchCreateCards(
  setId: string,
  command: BatchCreateCardsCommand,
  userId: string
): Promise<BatchCreateCardsResponseDto> {
  // 1. Verify generation belongs to user
  const generation = await this.verifyGeneration(command.generation_id, userId);

  // 2. Get set and check limits
  const set = await this.getSetWithOwnership(setId, userId);
  const requestedCount = command.cards.length;
  const availableInSet = 200 - set.cards_count;

  if (requestedCount > availableInSet) {
    throw new LimitExceededError(
      `Cannot add ${requestedCount} cards. Set limit: 200, current: ${set.cards_count}, available: ${availableInSet}`,
      {
        requested: requestedCount,
        available_in_set: availableInSet,
      }
    );
  }

  // 3. Check user limit
  const profile = await this.getUserProfile(userId);
  const availableInAccount = 1000 - profile.cards_count;

  if (requestedCount > availableInAccount) {
    throw new LimitExceededError(
      `Cannot add ${requestedCount} cards. User limit: 1000, current: ${profile.cards_count}, available: ${availableInAccount}`,
      {
        requested: requestedCount,
        available_in_account: availableInAccount,
      }
    );
  }

  // 4. Deduplicate within batch (by front_normalized)
  const uniqueCards = this.deduplicateBatch(command.cards);

  // 5. Execute in transaction
  const { data: cards, error } = await this.supabase.rpc('batch_create_cards', {
    p_set_id: setId,
    p_user_id: userId,
    p_generation_id: command.generation_id,
    p_cards: uniqueCards.map(c => ({
      front: c.front,
      back: c.back,
      source_text_excerpt: c.source_text_excerpt,
      ai_confidence_score: c.ai_confidence_score,
      was_edited_after_generation: c.was_edited,
      original_front: c.original_front,
      original_back: c.original_back,
    })),
  });

  if (error) throw error;

  // 6. Update generation statistics
  const editedCount = command.cards.filter(c => c.was_edited).length;
  const uneditedCount = command.cards.length - editedCount;

  await this.supabase
    .from('generations')
    .update({
      set_id: setId,
      accepted_count: generation.accepted_count + command.cards.length,
      accepted_edited_count: generation.accepted_edited_count + editedCount,
      accepted_unedited_count: generation.accepted_unedited_count + uneditedCount,
      rejected_count: generation.generated_count - (generation.accepted_count + command.cards.length),
    })
    .eq('id', command.generation_id);

  return {
    created: cards.length,
    cards: cards,
    generation_updated: true,
  };
}
```

### Względy bezpieczeństwa

- Verify generation belongs to user
- Atomic transaction dla consistency
- Deduplication przeciwko spam

### Obsługa błędów

```json
// Limit exceeded with details
{
  "error": "Limit exceeded",
  "message": "Cannot add 30 cards. Set limit: 200, current: 180, available: 20",
  "details": {
    "requested": 30,
    "available_in_set": 20,
    "available_in_account": 50
  },
  "code": "BATCH_LIMIT_EXCEEDED",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Kroki implementacji

1. Create `/src/pages/api/sets/[setId]/cards/batch.ts`
2. Export POST function
3. Validate body
4. Verify ownership
5. Call CardService.batchCreateCards()
6. Handle limits
7. Return 201 Created

---

## 2.5 Update Card - PATCH /api/cards/:id

### Przegląd

Aktualizuje treść karty. Zapisuje oryginalne wartości dla wersjonowania.

### Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/cards/:id`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**

```json
{
  "front": "¿Cómo estás? (informal)",
  "back": "How are you? (casual greeting)"
}
```

### Wykorzystywane typy

```typescript
type UpdateCardCommand = Partial<Pick<TablesUpdate<"cards">, "front" | "back">>;
type UpdateCardResponseDto = Pick<
  Tables<"cards">,
  | "id"
  | "set_id"
  | "user_id"
  | "front"
  | "back"
  | "language"
  | "was_edited_after_generation"
  | "original_front"
  | "original_back"
  | "updated_at"
>;
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Card not found
- `409 Conflict` - Duplicate card with new front
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate cardId i body
2. Get user_id
3. CardService.updateCard(cardId, command, userId)
4. Service wykonuje:
   - Get current card
   - If first edit after generation:
     - Set original_front = current front
     - Set original_back = current back
     - Set was_edited_after_generation = true
   - Check duplicate if front changes
   - UPDATE card
   - Trigger updates updated_at
5. Return UpdateCardResponseDto

### Walidacja Zod

```typescript
const UpdateCardSchema = z
  .object({
    front: z.string().min(1).max(200).optional(),
    back: z.string().min(1).max(500).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });
```

### Business Logic

```typescript
// CardService.updateCard()
async updateCard(
  cardId: string,
  command: UpdateCardCommand,
  userId: string
): Promise<UpdateCardResponseDto> {
  // 1. Get current card with ownership check
  const currentCard = await this.getCard(cardId, userId);

  // 2. Prepare update data
  const updateData: any = {};

  // 3. If first edit from AI generation, save originals
  if (!currentCard.was_edited_after_generation && currentCard.generation_id) {
    updateData.original_front = currentCard.front;
    updateData.original_back = currentCard.back;
    updateData.was_edited_after_generation = true;
  }

  // 4. Apply changes
  if (command.front !== undefined) {
    // Check duplicate only if front changes
    if (command.front !== currentCard.front) {
      const duplicate = await this.checkDuplicate(currentCard.set_id, command.front, cardId);
      if (duplicate) {
        throw new DuplicateCardError('Card with this front text already exists in set');
      }
    }
    updateData.front = command.front;
  }

  if (command.back !== undefined) {
    updateData.back = command.back;
  }

  // 5. Update card
  const { data: updatedCard, error } = await this.supabase
    .from('cards')
    .update(updateData)
    .eq('id', cardId)
    .eq('user_id', userId) // RLS double-check
    .select('id, set_id, user_id, front, back, language, was_edited_after_generation, original_front, original_back, updated_at')
    .single();

  if (error) throw error;

  return updatedCard;
}
```

### Względy bezpieczeństwa

- RLS enforcement
- Duplicate check
- Original values preserved

### Obsługa błędów

- Card not found → 404
- Duplicate front → 409
- Validation error → 400

### Kroki implementacji

1. W `/src/pages/api/cards/[id].ts` export PATCH function
2. Validate params.id i body
3. Call CardService.updateCard()
4. Handle errors
5. Return 200 OK

---

## 2.6 Delete Card - DELETE /api/cards/:id

### Przegląd

Usuwa kartę i aktualizuje liczniki.

### Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/cards/:id`
- **Headers:** `Authorization: Bearer <token>`

### Wykorzystywane typy

```typescript
interface DeleteCardResponseDto {
  message: string;
}
```

### Szczegóły odpowiedzi

```json
{
  "message": "Card successfully deleted"
}
```

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Card not found
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate UUID
2. Get user_id
3. CardService.deleteCard(cardId, userId)
4. DELETE FROM cards WHERE id = ? AND user_id = ?
5. Triggers update counters
6. Return success message

### Kroki implementacji

1. W `/src/pages/api/cards/[id].ts` export DELETE function
2. Validate params.id
3. Call CardService.deleteCard()
4. Return 200 OK

---

# 3. SRS Endpoints

## 3.1 Get Due Cards - GET /api/srs/due

### Przegląd

Zwraca karty wymagające przeglądu dzisiaj z informacjami o limitach dziennych.

### Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/srs/due`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `set_id` (uuid, optional) - filter by specific set

### Wykorzystywane typy

```typescript
type DueCardDto = Pick<Tables<"cards">, "id" | "set_id" | "front" | "back" | "status" | "due_at">;

interface GetDueCardsResponseDto {
  new_cards_available: number;
  review_cards_available: number;
  daily_limits: {
    new_cards: number;
    reviews: number;
    new_cards_remaining: number;
    reviews_remaining: number;
  };
  cards: DueCardDto[];
}
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `200 OK` - Success
- `400 Bad Request` - Invalid set_id
- `401 Unauthorized` - Missing/invalid token
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate query params
2. Get user_id
3. SrsService.getDueCards(userId, setId?)
4. Service wykonuje:
   - Count new cards (status = 'new')
   - Count review cards (due_at <= NOW() AND status != 'new')
   - Get daily progress (from cache or ephemeral state)
   - Calculate remaining limits
   - Fetch due cards with limits applied
5. Return response

### Walidacja Zod

```typescript
const GetDueCardsQuerySchema = z.object({
  set_id: z.string().uuid().optional(),
});
```

### Business Logic

```typescript
// SrsService.getDueCards()
async getDueCards(userId: string, setId?: string): Promise<GetDueCardsResponseDto> {
  const baseQuery = this.supabase
    .from('cards')
    .select('id, set_id, front, back, status, due_at')
    .eq('user_id', userId);

  if (setId) {
    baseQuery.eq('set_id', setId);
  }

  // Count new cards
  const { count: newCount } = await baseQuery
    .eq('status', 'new')
    .select('*', { count: 'exact', head: true });

  // Count review cards (due today)
  const now = new Date().toISOString();
  const { count: reviewCount } = await baseQuery
    .neq('status', 'new')
    .lte('due_at', now)
    .select('*', { count: 'exact', head: true });

  // Get daily progress (from session state or database)
  const dailyProgress = await this.getDailyProgress(userId);

  const limits = {
    new_cards: 20,
    reviews: 100,
    new_cards_remaining: 20 - dailyProgress.new_cards_today,
    reviews_remaining: 100 - dailyProgress.reviews_today,
  };

  // Fetch cards with limits
  const { data: cards } = await baseQuery
    .or(`status.eq.new,and(status.neq.new,due_at.lte.${now})`)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })
    .limit(Math.max(limits.new_cards_remaining, limits.reviews_remaining));

  return {
    new_cards_available: newCount ?? 0,
    review_cards_available: reviewCount ?? 0,
    daily_limits: limits,
    cards: cards ?? [],
  };
}
```

### Rozważania wydajności

- Index: `btree (user_id, due_at)`
- Cache daily progress w pamięci lub Redis

### Kroki implementacji

1. Create `/src/pages/api/srs/due.ts`
2. Export GET function
3. Validate query params
4. Call SrsService.getDueCards()
5. Return response

---

## 3.2 Start SRS Session - POST /api/srs/sessions

### Przegląd

Tworzy nową sesję nauki SRS z limitem kart.

### Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/srs/sessions`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**

```json
{
  "set_id": "uuid",
  "new_cards_limit": 20,
  "review_cards_limit": 100
}
```

### Wykorzystywane typy

```typescript
interface StartSessionCommand {
  set_id: string;
  new_cards_limit: number;
  review_cards_limit: number;
}

interface StartSessionResponseDto {
  session_id: string;
  cards: { id: string; front: string; back: string; status: card_status }[];
  total_cards: number;
  new_cards: number;
  review_cards: number;
}
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `201 Created` - Success
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Set not found
- `422 Unprocessable Entity` - Daily limit reached
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate body
2. Get user_id
3. Verify set ownership
4. SrsService.startSession(command, userId)
5. Service wykonuje:
   - Check daily limits
   - Create ephemeral session (in-memory or cache)
   - Fetch cards (new + review due)
   - Shuffle/order cards
   - Store session state
6. Return response

### Walidacja Zod

```typescript
const StartSessionSchema = z.object({
  set_id: z.string().uuid(),
  new_cards_limit: z.number().int().min(0).max(20).default(20),
  review_cards_limit: z.number().int().min(0).max(100).default(100),
});
```

### Business Logic

```typescript
// SrsService.startSession()
async startSession(command: StartSessionCommand, userId: string): Promise<StartSessionResponseDto> {
  // 1. Verify set ownership
  await this.verifySetOwnership(command.set_id, userId);

  // 2. Get daily progress
  const dailyProgress = await this.getDailyProgress(userId);

  // 3. Check daily limits
  const newCardsRemaining = 20 - dailyProgress.new_cards_today;
  const reviewsRemaining = 100 - dailyProgress.reviews_today;

  if (newCardsRemaining <= 0) {
    throw new DailyLimitError('You have reached your daily limit for new cards', {
      new_cards_today: dailyProgress.new_cards_today,
      new_cards_limit: 20,
    });
  }

  // 4. Fetch cards
  const now = new Date().toISOString();

  // New cards
  const { data: newCards } = await this.supabase
    .from('cards')
    .select('id, front, back, status')
    .eq('set_id', command.set_id)
    .eq('user_id', userId)
    .eq('status', 'new')
    .order('created_at', { ascending: true })
    .limit(Math.min(command.new_cards_limit, newCardsRemaining));

  // Review cards
  const { data: reviewCards } = await this.supabase
    .from('cards')
    .select('id, front, back, status')
    .eq('set_id', command.set_id)
    .eq('user_id', userId)
    .neq('status', 'new')
    .lte('due_at', now)
    .order('due_at', { ascending: true })
    .limit(Math.min(command.review_cards_limit, reviewsRemaining));

  // 5. Combine and shuffle (optional)
  const allCards = [...(newCards ?? []), ...(reviewCards ?? [])];

  // 6. Create session
  const sessionId = crypto.randomUUID();
  await this.storeSessionState(sessionId, {
    user_id: userId,
    set_id: command.set_id,
    cards: allCards.map(c => c.id),
    started_at: new Date().toISOString(),
    new_cards: newCards?.length ?? 0,
    review_cards: reviewCards?.length ?? 0,
  });

  return {
    session_id: sessionId,
    cards: allCards,
    total_cards: allCards.length,
    new_cards: newCards?.length ?? 0,
    review_cards: reviewCards?.length ?? 0,
  };
}
```

### Względy bezpieczeństwa

- Verify set ownership
- Enforce daily limits
- Session state stored with user_id

### Obsługa błędów

```json
{
  "error": "Daily limit reached",
  "message": "You have reached your daily limit for new cards",
  "details": {
    "new_cards_today": 20,
    "new_cards_limit": 20
  },
  "code": "DAILY_LIMIT_REACHED",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Kroki implementacji

1. Create `/src/pages/api/srs/sessions.ts`
2. Export POST function
3. Validate body
4. Call SrsService.startSession()
5. Handle daily limit error (422)
6. Return 201 Created

---

## 3.3 Submit Card Review - POST /api/srs/reviews

### Przegląd

Rejestruje ocenę użytkownika dla karty. Implementuje algorytm SM-2.

### Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/srs/reviews`
- **Headers:**
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Request Body:**

```json
{
  "card_id": "uuid",
  "rating": 4,
  "session_id": "uuid"
}
```

### Wykorzystywane typy

```typescript
interface SubmitReviewCommand {
  card_id: string;
  rating: number; // 1-5
  session_id: string;
}

interface SubmitReviewResponseDto {
  card_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: card_status;
}
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `201 Created` - Success (review recorded)
- `400 Bad Request` - Invalid rating or parameters
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Card or session not found
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate body
2. Get user_id
3. Verify session belongs to user
4. SrsService.submitReview(command, userId)
5. Service wykonuje:
   - Get current card
   - Calculate new SRS values (SM-2)
   - UPDATE card with new values
   - Update session state
   - Update daily progress counter
6. Return response

### Walidacja Zod

```typescript
const SubmitReviewSchema = z.object({
  card_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  session_id: z.string().uuid(),
});
```

### Business Logic - SM-2 Algorithm

```typescript
// SrsService.submitReview()
async submitReview(command: SubmitReviewCommand, userId: string): Promise<SubmitReviewResponseDto> {
  // 1. Verify session
  const session = await this.getSessionState(command.session_id);
  if (session.user_id !== userId) {
    throw new UnauthorizedError('Session does not belong to user');
  }

  // 2. Get current card
  const card = await this.cardService.getCard(command.card_id, userId);

  // 3. Calculate new SRS values using SM-2
  const sm2Result = this.calculateSM2(
    card.interval_days,
    card.ease_factor,
    card.repetitions,
    card.status,
    command.rating
  );

  // 4. Update card
  const { data: updatedCard } = await this.supabase
    .from('cards')
    .update({
      interval_days: sm2Result.interval_days,
      ease_factor: sm2Result.ease_factor,
      repetitions: sm2Result.repetitions,
      status: sm2Result.status,
      due_at: sm2Result.due_at,
    })
    .eq('id', command.card_id)
    .eq('user_id', userId)
    .select('id, interval_days, ease_factor, repetitions, status, due_at')
    .single();

  // 5. Update session and daily progress
  await this.recordReview(command.session_id, command.card_id, command.rating);

  if (card.status === 'new') {
    await this.incrementDailyProgress(userId, 'new_cards');
  } else {
    await this.incrementDailyProgress(userId, 'reviews');
  }

  return {
    card_id: updatedCard.id,
    next_review_at: updatedCard.due_at,
    interval_days: updatedCard.interval_days,
    ease_factor: updatedCard.ease_factor,
    repetitions: updatedCard.repetitions,
    status: updatedCard.status,
  };
}

// SM-2 Algorithm Implementation
private calculateSM2(
  currentInterval: number,
  currentEaseFactor: number,
  currentRepetitions: number,
  currentStatus: string,
  rating: number
): {
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  status: string;
  due_at: string;
} {
  let interval = currentInterval;
  let easeFactor = currentEaseFactor;
  let repetitions = currentRepetitions;
  let status = currentStatus;

  // Rating < 3: Reset (failed)
  if (rating < 3) {
    interval = 0;
    repetitions = 0;
    status = currentStatus === 'new' ? 'learning' : 'relearning';
  } else {
    // Rating >= 3: Success
    repetitions += 1;

    if (repetitions === 1) {
      interval = 1; // 1 day
      status = 'learning';
    } else if (repetitions === 2) {
      interval = 6; // 6 days
      status = 'review';
    } else {
      interval = Math.round(interval * easeFactor);
      status = 'review';
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Minimum 1.3
  }

  // Calculate due_at
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + interval);
  const due_at = dueDate.toISOString();

  return {
    interval_days: interval,
    ease_factor: easeFactor,
    repetitions,
    status,
    due_at,
  };
}
```

### Względy bezpieczeństwa

- Session verification
- Card ownership via RLS
- Atomic update

### Obsługa błędów

```json
{
  "error": "Validation failed",
  "details": {
    "rating": "Rating must be between 1 and 5"
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

### Kroki implementacji

1. Create `/src/pages/api/srs/reviews.ts`
2. Export POST function
3. Validate body
4. Verify session
5. Call SrsService.submitReview()
6. Return 201 Created

---

## 3.4 Get Session Summary - GET /api/srs/sessions/:id/summary

### Przegląd

Zwraca statystyki dla sesji nauki (aktywnej lub zakończonej).

### Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/srs/sessions/:id/summary`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `id` (uuid, required) - session ID

### Wykorzystywane typy

```typescript
interface SessionSummaryDto {
  session_id: string;
  started_at: string;
  completed_at: string;
  total_cards: number;
  cards_reviewed: number;
  average_rating: number;
  ratings_distribution: Record<string, number>;
  time_spent_seconds: number;
}
```

### Szczegóły odpowiedzi

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

**Status Codes:**

- `200 OK` - Success
- `401 Unauthorized` - Missing/invalid token
- `404 Not Found` - Session not found
- `500 Internal Server Error` - Unexpected error

### Przepływ danych

1. Validate sessionId
2. Get user_id
3. SrsService.getSessionSummary(sessionId, userId)
4. Service fetch session state
5. Calculate statistics
6. Return response

### Business Logic

```typescript
// SrsService.getSessionSummary()
async getSessionSummary(sessionId: string, userId: string): Promise<SessionSummaryDto> {
  // 1. Get session state
  const session = await this.getSessionState(sessionId);

  if (session.user_id !== userId) {
    throw new UnauthorizedError('Session does not belong to user');
  }

  // 2. Calculate stats
  const reviews = session.reviews ?? [];
  const ratingsDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const completedAt = session.completed_at ?? new Date().toISOString();
  const timeSpentSeconds = Math.floor(
    (new Date(completedAt).getTime() - new Date(session.started_at).getTime()) / 1000
  );

  return {
    session_id: sessionId,
    started_at: session.started_at,
    completed_at: completedAt,
    total_cards: session.cards.length,
    cards_reviewed: reviews.length,
    average_rating: averageRating,
    ratings_distribution: ratingsDistribution,
    time_spent_seconds: timeSpentSeconds,
  };
}
```

### Kroki implementacji

1. Create `/src/pages/api/srs/sessions/[id]/summary.ts`
2. Export GET function
3. Validate params.id
4. Call SrsService.getSessionSummary()
5. Return response

---

# 4. Shared Components

## 4.1 Service Classes

### SetService

**Location:** `/src/lib/services/set.service.ts`

**Responsibilities:**

- CRUD operations for sets
- Name uniqueness validation
- Set ownership verification
- Counter management

**Key Methods:**

```typescript
class SetService {
  async listSets(userId: string, query: ListSetsQuery): Promise<{ data: SetDto[]; pagination: PaginationDto }>;
  async getSet(setId: string, userId: string): Promise<SetDto>;
  async createSet(command: CreateSetCommand, userId: string): Promise<SetDto>;
  async updateSet(setId: string, command: UpdateSetCommand, userId: string): Promise<SetDto>;
  async deleteSet(setId: string, userId: string): Promise<{ cardsCount: number }>;
}
```

### CardService

**Location:** `/src/lib/services/card.service.ts`

**Responsibilities:**

- CRUD operations for cards
- Duplicate detection (front_normalized)
- Limit enforcement (200/set, 1000/user)
- Batch operations
- Version history management

**Key Methods:**

```typescript
class CardService {
  async listCards(
    setId: string,
    userId: string,
    query: ListCardsQuery
  ): Promise<{ data: CardDto[]; pagination: PaginationDto }>;
  async getCard(cardId: string, userId: string): Promise<CardDetailDto>;
  async createCard(setId: string, command: CreateCardCommand, userId: string): Promise<CardDto>;
  async batchCreateCards(
    setId: string,
    command: BatchCreateCardsCommand,
    userId: string
  ): Promise<BatchCreateCardsResponseDto>;
  async updateCard(cardId: string, command: UpdateCardCommand, userId: string): Promise<UpdateCardResponseDto>;
  async deleteCard(cardId: string, userId: string): Promise<void>;

  // Helper methods
  private async checkDuplicate(setId: string, front: string, excludeCardId?: string): Promise<boolean>;
  private async checkLimits(setId: string, userId: string, requestedCount: number): Promise<void>;
}
```

### SrsService

**Location:** `/src/lib/services/srs.service.ts`

**Responsibilities:**

- SRS session management
- SM-2 algorithm implementation
- Daily limit tracking
- Card scheduling

**Key Methods:**

```typescript
class SrsService {
  async getDueCards(userId: string, setId?: string): Promise<GetDueCardsResponseDto>;
  async startSession(command: StartSessionCommand, userId: string): Promise<StartSessionResponseDto>;
  async submitReview(command: SubmitReviewCommand, userId: string): Promise<SubmitReviewResponseDto>;
  async getSessionSummary(sessionId: string, userId: string): Promise<SessionSummaryDto>;

  // SM-2 algorithm
  private calculateSM2(...): SM2Result;

  // Session state management
  private async storeSessionState(sessionId: string, state: SessionState): Promise<void>;
  private async getSessionState(sessionId: string): Promise<SessionState>;

  // Daily progress
  private async getDailyProgress(userId: string): Promise<DailyProgress>;
  private async incrementDailyProgress(userId: string, type: 'new_cards' | 'reviews'): Promise<void>;
}
```

## 4.2 Error Classes

**Location:** `/src/lib/errors.ts`

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }

  toJSON(): ErrorResponseDto {
    return {
      error: this.error,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, string>) {
    super(400, "ValidationError", message, "VALIDATION_FAILED", details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(401, "Unauthorized", message, "UNAUTHORIZED");
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, "NotFound", `${resource} not found`, "NOT_FOUND");
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, code: string = "CONFLICT") {
    super(409, "Conflict", message, code);
  }
}

export class LimitExceededError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, "LimitExceeded", message, "LIMIT_EXCEEDED", details);
  }
}

export class DailyLimitError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super(422, "DailyLimitReached", message, "DAILY_LIMIT_REACHED", details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, retryAfter?: number) {
    super(429, "RateLimitExceeded", message, "RATE_LIMIT_EXCEEDED", { retry_after: retryAfter });
  }
}
```

## 4.3 Utility Functions

**Location:** `/src/lib/api-utils.ts`

```typescript
import type { APIContext } from "astro";
import type { ErrorResponseDto } from "../types";
import { ApiError } from "./errors";

/**
 * Get authenticated user ID from Supabase session
 */
export async function getAuthenticatedUserId(context: APIContext): Promise<string> {
  const {
    data: { user },
    error,
  } = await context.locals.supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError("Authentication required");
  }

  return user.id;
}

/**
 * Parse and validate JSON request body
 */
export async function parseJsonBody<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const details: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      details[path || "body"] = issue.message;
    });

    throw new ValidationError("Request validation failed", details);
  }

  return result.data;
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(url: URL, schema: z.ZodSchema<T>): T {
  const params = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(params);

  if (!result.success) {
    const details: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      details[path] = issue.message;
    });

    throw new ValidationError("Query validation failed", details);
  }

  return result.data;
}

/**
 * Create success JSON response
 */
export function jsonResponse<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Create error JSON response
 */
export function errorResponse(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Unknown error
  const errorDto: ErrorResponseDto = {
    error: "InternalError",
    message: "An unexpected error occurred",
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(errorDto), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Wrap endpoint handler with error handling
 */
export function withErrorHandling(
  handler: (context: APIContext) => Promise<Response>
): (context: APIContext) => Promise<Response> {
  return async (context: APIContext) => {
    try {
      return await handler(context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
```

## 4.4 Zod Schemas

**Location:** `/src/lib/schemas.ts`

```typescript
import { z } from "zod";

// Common
export const UuidSchema = z.string().uuid("Invalid UUID format");

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(50),
});

// Sets
export const CreateSetSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  language: z.enum(["pl", "en", "es"], {
    errorMap: () => ({ message: "Language must be one of: pl, en, es" }),
  }),
});

export const UpdateSetSchema = z.object({
  name: z.string().min(1).max(100),
});

export const ListSetsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  sort: z.enum(["created_at", "updated_at", "name"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Cards
export const CreateCardSchema = z.object({
  front: z.string().min(1, "Front text required").max(200, "Front text too long"),
  back: z.string().min(1, "Back text required").max(500, "Back text too long"),
});

export const UpdateCardSchema = z
  .object({
    front: z.string().min(1).max(200).optional(),
    back: z.string().min(1).max(500).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field must be provided",
  });

export const BatchCreateCardItemSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source_text_excerpt: z.string().max(500).optional(),
  ai_confidence_score: z.number().min(0).max(1).optional(),
  was_edited: z.boolean(),
  original_front: z.string().max(200).nullable().optional(),
  original_back: z.string().max(500).nullable().optional(),
});

export const BatchCreateCardsSchema = z.object({
  generation_id: UuidSchema,
  cards: z.array(BatchCreateCardItemSchema).min(1).max(30),
});

export const ListCardsQuerySchema = PaginationQuerySchema.extend({
  search: z.string().optional(),
  status: z.enum(["new", "learning", "review", "relearning"]).optional(),
  sort: z.enum(["created_at", "due_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// SRS
export const GetDueCardsQuerySchema = z.object({
  set_id: UuidSchema.optional(),
});

export const StartSessionSchema = z.object({
  set_id: UuidSchema,
  new_cards_limit: z.number().int().min(0).max(20).default(20),
  review_cards_limit: z.number().int().min(0).max(100).default(100),
});

export const SubmitReviewSchema = z.object({
  card_id: UuidSchema,
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  session_id: UuidSchema,
});
```

---

# 5. Security Considerations

## 5.1 Authentication

- **JWT Tokens:** Supabase Auth provides JWT tokens
- **Extraction:** From `Authorization: Bearer <token>` header
- **Validation:** Automatic via `context.locals.supabase.auth.getUser()`
- **User ID:** Extracted from JWT claims

## 5.2 Authorization

- **RLS Policies:** All tables have `user_id = auth.uid()` policies
- **Double-Check:** Services verify ownership explicitly
- **No Data Leakage:** 404 for both "not found" and "unauthorized"

## 5.3 Input Validation

- **Zod Schemas:** All inputs validated
- **Type Safety:** TypeScript ensures type correctness
- **SQL Injection:** Prevented by Supabase parameterized queries
- **XSS:** Sanitization in frontend, not API concern

## 5.4 Rate Limiting

- **Generation:** 10 requests/hour (implemented)
- **Card Creation:** 100 requests/hour (todo)
- **General API:** 1000 requests/hour (todo)
- **Implementation:** Edge Functions or middleware

## 5.5 CORS

- **Policy:** Restrict to app domain
- **Headers:** Set in Astro config
- **Credentials:** Include for authenticated requests

## 5.6 Error Handling

- **No Stack Traces:** In production responses
- **Log Everything:** Server-side logging
- **Generic Messages:** For 500 errors
- **Specific Messages:** For 400/422 with validation details

---

# 6. Implementation Order

## Phase 1: Foundation (Day 1)

1. Create shared components:
   - Error classes (`/src/lib/errors.ts`)
   - API utilities (`/src/lib/api-utils.ts`)
   - Zod schemas (`/src/lib/schemas.ts`)

## Phase 2: Sets Endpoints (Day 1-2)

1. Create `SetService` (`/src/lib/services/set.service.ts`)
2. Implement endpoints:
   - POST `/api/sets` (create)
   - GET `/api/sets` (list)
   - GET `/api/sets/:id` (get)
   - PATCH `/api/sets/:id` (update)
   - DELETE `/api/sets/:id` (delete)
3. Test each endpoint

## Phase 3: Cards Endpoints (Day 2-3)

1. Create `CardService` (`/src/lib/services/card.service.ts`)
2. Implement endpoints:
   - POST `/api/sets/:setId/cards` (create manual)
   - GET `/api/sets/:setId/cards` (list)
   - GET `/api/cards/:id` (get)
   - PATCH `/api/cards/:id` (update)
   - DELETE `/api/cards/:id` (delete)
   - POST `/api/sets/:setId/cards/batch` (batch create)
3. Test limits, duplicates, versioning

## Phase 4: SRS Endpoints (Day 3-4)

1. Create `SrsService` (`/src/lib/services/srs.service.ts`)
2. Implement SM-2 algorithm
3. Implement session state management (in-memory or Redis)
4. Implement endpoints:
   - GET `/api/srs/due` (due cards)
   - POST `/api/srs/sessions` (start session)
   - POST `/api/srs/reviews` (submit review)
   - GET `/api/srs/sessions/:id/summary` (summary)
5. Test SM-2 calculations, daily limits

## Phase 5: Testing & Refinement (Day 4-5)

1. Integration tests for all endpoints
2. Load testing
3. Error scenarios
4. Rate limiting verification
5. RLS policy testing
6. Documentation updates

## Phase 6: Authentication (Day 5)

1. Remove hardcoded user IDs
2. Implement proper JWT extraction
3. Test with real Supabase Auth tokens
4. Add auth middleware

---

## Appendix: Example Endpoint Implementation

**File:** `/src/pages/api/sets/[id].ts`

```typescript
import type { APIContext } from "astro";
import { SetService } from "../../../lib/services/set.service";
import { UpdateSetSchema, UuidSchema } from "../../../lib/schemas";
import { getAuthenticatedUserId, parseJsonBody, jsonResponse, withErrorHandling } from "../../../lib/api-utils";
import { NotFoundError } from "../../../lib/errors";

export const prerender = false;

export const GET = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = UuidSchema.parse(context.params.id);

  // 2. Get authenticated user
  const userId = await getAuthenticatedUserId(context);

  // 3. Get set via service
  const setService = new SetService(context.locals.supabase);
  const set = await setService.getSet(setId, userId);

  // 4. Return response
  return jsonResponse(set);
});

export const PATCH = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = UuidSchema.parse(context.params.id);

  // 2. Get authenticated user
  const userId = await getAuthenticatedUserId(context);

  // 3. Parse and validate body
  const command = await parseJsonBody(context.request, UpdateSetSchema);

  // 4. Update via service
  const setService = new SetService(context.locals.supabase);
  const updatedSet = await setService.updateSet(setId, command, userId);

  // 5. Return response
  return jsonResponse(updatedSet);
});

export const DELETE = withErrorHandling(async (context: APIContext) => {
  // 1. Validate UUID parameter
  const setId = UuidSchema.parse(context.params.id);

  // 2. Get authenticated user
  const userId = await getAuthenticatedUserId(context);

  // 3. Delete via service
  const setService = new SetService(context.locals.supabase);
  const result = await setService.deleteSet(setId, userId);

  // 4. Return response
  return jsonResponse({
    message: `Set and ${result.cardsCount} cards successfully deleted`,
  });
});
```

---

**Koniec planu wdrożenia**

Ten plan zapewnia kompleksowe wytyczne dla zespołu programistów do implementacji endpointów REST API (Sets, Cards, SRS) zgodnie ze specyfikacją API, schematem bazy danych i zasadami implementacji.
