# API Endpoint Implementation Plan: POST /api/generations

## 1. Przegląd punktu końcowego

Punkt końcowy inicjuje asynchroniczną generację fiszek AI z podanego tekstu źródłowego.  
Zwraca od razu identyfikator sesji i metadata generacji (status “processing”), a dalsze przetwarzanie odbywa się w tle.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Ścieżka: `/api/generations`
- Autoryzacja: `Authorization: Bearer <token>` (Supabase JWT)
- Parametry:
  - Wymagane:
    - `source_text` (string): 100–15 000 znaków
  - Opcjonalne:
    - `language` (string): ISO kod języka (`pl`, `en`, `es`)
    - `target_count` (integer): 1–30, domyślnie 30
- Request Body (JSON):
  ```json
  {
    "source_text": "Long text content here...",
    "language": "es", // opcjonalnie
    "target_count": 30 // opcjonalnie
  }
  ```

## 3. Wykorzystywane typy

- StartGenerationCommand (z `src/types.ts`)
  ```ts
  interface StartGenerationCommand {
    source_text: string;
    language?: string;
    target_count?: number;
  }
  ```
- StartGenerationResponseDto
  ```ts
  type StartGenerationResponseDto = Pick<
    Tables<"generations">,
    "id" | "user_id" | "model" | "source_text_hash" | "source_text_length" | "created_at"
  > & { status: "processing"; estimated_duration_ms: number };
  ```
- ErrorResponseDto (wspólny typ błędów)

## 4. Szczegóły odpowiedzi

- 202 Accepted
- Body:
  ```json
  {
    "id": "uuid",
    "user_id": "uuid",
    "model": "gpt-4o",
    "source_text_hash": "sha256hash",
    "source_text_length": 12450,
    "created_at": "2025-01-01T00:00:00Z",
    "status": "processing",
    "estimated_duration_ms": 8500
  }
  ```
- Kody statusu:
  - 400 Bad Request – walidacja Zod
  - 401 Unauthorized – brak/nieprawidłowy token
  - 429 Too Many Requests – limit generacji na godzinę
  - 500 Internal Server Error – błąd serwera lub bazy danych

## 5. Przepływ danych

1. Handler Astro w `src/pages/api/generations.ts`:
   - Odczyt JWT z `context.locals.supabase.auth.getUser()`
   - Parsowanie i walidacja ciała requestu przez `zod`
2. `GenerationService.startGeneration(command, userId)`:
   - Oblicza `source_text_hash` (SHA-256) i długość
   - Tworzy rekord w tabeli `generations` ze statusem `"processing"`
   - Wywołuje Edge Function lub enqueue job, przekazując nowy `generation.id`
3. Zwrot HTTP 202 z `StartGenerationResponseDto`
4. Edge Function (lub worker):
   - Wykonuje rzeczywistą pracę AI, aktualizuje status rekordu, zapisuje wygenerowane karty
   - W razie błędu: rejestruje w `generation_error_logs`

## 6. Względy bezpieczeństwa

- Autoryzacja: każde wywołanie musi zawierać ważny JWT Supabase → 401
- RLS na tabeli `generations` wymusza `user_id = auth.uid()`
- Ograniczenie wielkości `source_text` zapobiega nadmiernym obciążeniom
- Rate limiting 10/godz. obsługiwany przez Edge Function → 429

## 7. Obsługa błędów

- 400: Zwróć `ErrorResponseDto` z `details` od Zod (np. długość tekstu, zakres `target_count`)
- 401: `ErrorResponseDto` { error: "Unauthorized", message: "Missing or invalid token" }
- 429: zwróć odpowiedź z kodem 429 i `ErrorResponseDto` z opisem limitu
- 500: loguj błąd w serwisie, rzucaj końcowo `ErrorResponseDto` { error: "InternalError" }

## 8. Rozważania dotyczące wydajności

- Chunkowanie: jeśli `source_text` > 10 000 znaków, serwis może automatycznie podzielić na ~5 000-znakowe fragmenty
- Deduplication w batchu: usuwanie duplikatów front text przed wywołaniem AI
- Użycie paginacji i cache’owanie odpowiedzi historii generacji (oddzielny endpoint)

## 9. Kroki implementacji

1. Utworzyć plik `src/pages/api/generations.ts` (handler POST).
2. Zdefiniować Zod-schema w handlerze i validate request body.
3. W `src/lib/services/` utworzyć `generation.service.ts` z metodą `startGeneration()`.
4. W `GenerationService`:
   - Hashowanie i obliczanie długości
   - Insert do `generations` przez `context.locals.supabase`
   - Wywołanie Edge Function / enqueue job
5. Obsłużyć wszystkie wyjątki i mapować na odpowiednie kody i DTO
6. Dodać testy jednostkowe dla walidacji i service logic
7. Aktualizować dokumentację API (`README.md` lub `docs/`)
8. Przeprowadzić code review i testy end-to-end (autoryzacja, walidacja, happy path, scenariusze błędów)
9. Zdeployować na środowisko testowe, zweryfikować logi i metryki generacji
