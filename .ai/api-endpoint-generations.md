# API Endpoint: POST /api/generations

## Przegląd

Punkt końcowy do inicjowania asynchronicznej generacji fiszek AI z podanego tekstu źródłowego. Zwraca natychmiast identyfikator sesji i metadane generacji (status "processing"), a dalsze przetwarzanie odbywa się w tle.

> **⚠️ MVP Version:** Obecnie endpoint używa hardcoded user ID (`00000000-0000-0000-0000-000000000001`) dla celów testowania. Autoryzacja JWT zostanie dodana w późniejszej fazie projektu.

## Szczegóły żądania

### HTTP Method & Path

```
POST /api/generations
```

### Autoryzacja

**MVP:** Brak autoryzacji - używany jest hardcoded user ID.  
**Przyszłość:** Będzie wymagana autoryzacja przez Supabase JWT token.

### Request Headers

```
Content-Type: application/json
```

### Request Body (JSON)

#### Parametry wymagane:

- **`source_text`** (string): Tekst źródłowy do generacji fiszek
  - Min: 100 znaków
  - Max: 15,000 znaków

#### Parametry opcjonalne:

- **`language`** (string): Kod języka ISO 639-1 (np. `pl`, `en`, `es`)
  - Format: dwuliterowy kod
  - Domyślnie: wykrywany automatycznie przez AI
- **`target_count`** (number): Docelowa liczba fiszek do wygenerowania
  - Min: 1
  - Max: 30
  - Domyślnie: 30

#### Przykład request body:

```json
{
  "source_text": "Fotosynteza jest procesem, w którym rośliny przekształcają energię świetlną w energię chemiczną. Proces ten zachodzi w chloroplastach, które zawierają chlorofil - zielony barwnik odpowiedzialny za wychwytywanie światła. W fazie jasnej fotosyntezy, która odbywa się w tylakoidach, energia świetlna jest wykorzystywana do rozszczepienia cząsteczek wody i produkcji ATP oraz NADPH. W fazie ciemnej, znanej również jako cykl Calvina, ATP i NADPH są wykorzystywane do syntezy glukozy z dwutlenku węgla.",
  "language": "pl",
  "target_count": 15
}
```

## Odpowiedzi

### Sukces: 202 Accepted

Żądanie zostało zaakceptowane i przetwarzanie rozpoczęło się w tle.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "model": "gpt-4o",
  "source_text_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
  "source_text_length": 456,
  "created_at": "2025-10-09T12:34:56.789Z",
  "status": "processing",
  "estimated_duration_ms": 6500
}
```

#### Response Fields:

- **`id`**: Unikalny identyfikator generacji (UUID)
- **`user_id`**: ID użytkownika (UUID)
- **`model`**: Nazwa użytego modelu AI (np. "gpt-4o")
- **`source_text_hash`**: SHA-256 hash tekstu źródłowego (dla deduplikacji)
- **`source_text_length`**: Długość tekstu źródłowego w znakach
- **`created_at`**: Timestamp utworzenia (ISO 8601)
- **`status`**: Zawsze "processing" w odpowiedzi
- **`estimated_duration_ms`**: Szacowany czas przetwarzania w milisekundach

### Błąd: 400 Bad Request

Błąd walidacji danych wejściowych.

```json
{
  "error": "ValidationError",
  "message": "Request validation failed",
  "details": {
    "source_text": "Source text must be at least 100 characters",
    "target_count": "Target count must not exceed 30"
  },
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

**Możliwe błędy walidacji:**

- `source_text`: "Source text must be at least 100 characters"
- `source_text`: "Source text must not exceed 15,000 characters"
- `language`: "Language must be a valid ISO 639-1 code (e.g., pl, en, es)"
- `target_count`: "Target count must be at least 1"
- `target_count`: "Target count must not exceed 30"

### ~~Błąd: 401 Unauthorized~~ (Wyłączone w MVP)

**MVP:** Autoryzacja jest wyłączona - ten błąd nie występuje.  
**Przyszłość:** Zostanie włączona walidacja JWT token.

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token",
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

### Błąd: 429 Too Many Requests

Przekroczono limit generacji (10 na godzinę).

```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded: Maximum 10 generations per hour. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

### Błąd: 500 Internal Server Error

Błąd serwera lub bazy danych.

```json
{
  "error": "InternalError",
  "message": "An unexpected error occurred while processing your request",
  "timestamp": "2025-10-09T12:34:56.789Z"
}
```

## Przykłady użycia

### cURL

```bash
# MVP - Bez autoryzacji
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Długi tekst do nauki... (min 100 znaków)",
    "language": "pl",
    "target_count": 20
  }'
```

### JavaScript (fetch)

```javascript
// MVP Version - bez autoryzacji
async function startGeneration(sourceText, options = {}) {
  const { language, targetCount = 30 } = options;

  const response = await fetch("/api/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // MVP: Brak Authorization header
    },
    body: JSON.stringify({
      source_text: sourceText,
      language,
      target_count: targetCount,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Generation failed");
  }

  const result = await response.json();
  console.log(`Generation started: ${result.id}`);
  console.log(`Estimated time: ${result.estimated_duration_ms}ms`);

  return result;
}

// Użycie
try {
  const generation = await startGeneration("Fotosynteza jest procesem...", { language: "pl", targetCount: 15 });

  // Możesz teraz pollować status generacji przez GET /api/generations/{id}
  // lub poczekać na webhook/notification
} catch (error) {
  console.error("Failed to start generation:", error.message);
}
```

### TypeScript (z typami)

```typescript
import type { StartGenerationCommand, StartGenerationResponseDto } from "@/types";

// MVP Version - bez autoryzacji
async function startGeneration(command: StartGenerationCommand): Promise<StartGenerationResponseDto> {
  const response = await fetch("/api/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // MVP: Brak Authorization header
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

## Przepływ danych

1. **Klient** wysyła żądanie POST z tekstem źródłowym
2. **API Handler** (`src/pages/api/generations.ts`):
   - Weryfikuje JWT token przez Supabase Auth
   - Waliduje request body przez Zod schema
3. **GenerationService** (`src/lib/services/generation.service.ts`):
   - Oblicza SHA-256 hash tekstu źródłowego
   - Sprawdza rate limiting (10/godz.)
   - Tworzy rekord w tabeli `generations`
   - Enqueue job do Edge Function/worker
4. **API** zwraca HTTP 202 z metadanymi generacji
5. **Edge Function** (w tle):
   - Przetwarza tekst przez AI
   - Generuje fiszki
   - Aktualizuje status w bazie danych
   - W przypadku błędu - loguje do `generation_error_logs`

## Bezpieczeństwo

**MVP Version:**

- ⚠️ **Autoryzacja JWT wyłączona** - używany hardcoded user ID
- ⚠️ **RLS na tabeli `generations` może wymagać dostosowania** - obecnie brak auth context
- ✅ Walidacja rozmiaru tekstu zapobiega nadmiernym obciążeniom
- ✅ Rate limiting: maksymalnie 10 generacji na godzinę (per hardcoded user)
- ✅ SHA-256 hash dla deduplikacji i cachowania

**Przyszłość (Production):**

- ✅ Autoryzacja JWT będzie wymagana dla każdego żądania
- ✅ RLS wymusi `user_id = auth.uid()`
- ✅ Rate limiting per user

## Monitoring i debugging

### Logi serwera

Sprawdź logi dla błędów:

```bash
# Development
npm run dev

# Production - sprawdź logi Vercel/deployment platform
```

### Sprawdzenie statusu generacji w bazie danych

```sql
SELECT
  id,
  user_id,
  source_text_length,
  generated_count,
  created_at,
  updated_at
FROM generations
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

## Dalsze kroki

Po otrzymaniu odpowiedzi 202:

1. Przechowaj `generation.id` dla późniejszego sprawdzenia statusu
2. Opcjonalnie: Implementuj polling przez `GET /api/generations/{id}` (do zaimplementowania)
3. Opcjonalnie: Nasłuchuj na webhook/notification o zakończeniu
4. Po zakończeniu: Pobierz wygenerowane karty przez odpowiedni endpoint

## Znane ograniczenia

- Maksymalnie 10 generacji na godzinę na użytkownika
- Maksymalnie 15,000 znaków tekstu źródłowego
- Maksymalnie 30 fiszek na generację
- Brak możliwości anulowania generacji w trakcie (TODO)
- Edge Function obecnie jako placeholder (wymaga implementacji)
