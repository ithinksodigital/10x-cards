# Plan testów dla projektu Flash Cards AI (MVP)

## 1. Wprowadzenie i cele testowania

### 1.1 Cel główny
Zweryfikowanie jakości i niezawodności aplikacji Flash Cards AI (MVP) z naciskiem na krytyczne ścieżki użytkownika: generowanie fiszek (także anonimowo), zapis do zestawów, sesje SRS, oraz bezpieczeństwo danych użytkownika przez RLS.

### 1.2 Cele szczegółowe
- Zapewnienie poprawności walidacji danych i obsługi błędów w API.
- Weryfikacja ścieżek z opcjonalną autentykacją (anonimowy → zalogowany) i bramkowania stron przez `src/middleware/index.ts`.
- Sprawdzenie zgodności z wymaganiami niefunkcjonalnymi (wydajność, odporność na błędy, UX komunikatów).
- Potwierdzenie integralności danych i polityk RLS w Supabase.
- Wykorzystanie i rozszerzenie istniejącej infrastruktury testowej (bash scripts, example tests).

### 1.3 Status infrastruktury testowej
**Istniejące zasoby:**
- ✅ `.ai/test-api-endpoints.sh` – bash script do manualnych testów API
- ✅ `.ai/test-simple.js` – Node.js script dla podstawowych testów
- ✅ `.ai/example-tests.md` – przykładowe testy jednostkowe (wymaga implementacji)
- ✅ `src/lib/services/__tests__/openrouter.service.test.ts` – istniejący test jednostkowy
- ✅ `.ai/testing-guide.md` – dokumentacja testowania
- ✅ `.ai/testing-results.md` – wyniki testów manualnych (100% coverage dla auth/validation)

**Do zaimplementowania:**
- ❌ Vitest + konfiguracja
- ❌ Playwright dla testów E2E UI
- ❌ MSW dla mockowania OpenRouter API
- ❌ Seed scripts i fixtures
- ❌ CI/CD pipeline dla automatycznych testów

## 2. Zakres testów

### 2.1 W zakresie testów

#### Frontend (Astro 5 + React 19 + TS)
- **Strony**: `index.astro`, `generate.astro`, `dashboard.astro`, `auth/*`
- **Komponenty React**: 
  - Auth: `src/components/auth/*` (AuthProvider, AuthGuard, LoginForm, RegisterForm, MigrationModal)
  - Generation: `src/components/generation/*` (GeneratePage, CardGrid, BulkActionsBar, ProgressModal)
  - UI: `src/components/ui/*` (shadcn/ui components)
- **Hooki**: `useGenerationApi`, `useSetsApi`, `useRetry`, `useDarkMode`, `useProgressPolling`

#### Middleware
- `src/middleware/index.ts` – routing guards, publiczne vs chronione zasoby, wstrzykiwanie Supabase do `locals`

#### API Endpoints (`src/pages/api/*`)
- **Auth**: `auth/login.ts`, `auth/logout.ts`, `auth/register.ts`
- **Generacje**: `generations.ts`, `generations/[id].ts`
- **Zestawy**: `sets.ts`, `sets/[id].ts`
- **Karty**: `cards/[id].ts`, `sets/[setId]/cards.ts`, `sets/[setId]/cards/batch.ts`
- **SRS**: `srs/sessions.ts`, `srs/sessions/[id]/summary.ts`, `srs/due.ts`, `srs/reviews.ts`

#### Warstwa usług
- `generation.service.ts` – orchestracja generowania AI
- `openrouter.service.ts` – komunikacja z OpenRouter API (już ma testy w `__tests__/`)
- `set.service.ts`, `card.service.ts`, `srs.service.ts` – logika biznesowa
- Walidacje: `src/lib/schemas.ts` (Zod schemas)

#### Baza danych i RLS
- Migracje: `supabase/migrations/*` (20+ plików)
- Typy: `src/db/database.types.ts`
- Klient: `src/db/supabase.client.ts` (SSR + browser instances)
- Polityki RLS dla tabel: `profiles`, `sets`, `cards`, `generations`, `srs_*`

### 2.2 Poza zakresem MVP
- Wdrożenia produkcyjne (deployment testing)
- Pełne testy dostępności (ograniczamy się do podstawowych: fokus, kontrast, ARIA labels)
- Pełna internacjonalizacja UI (MVP wspiera tylko język treści, nie UI)
- Testy obciążeniowe (load testing z k6/Artillery – post-MVP)
- Testy wizualne regresyjne (visual regression – post-MVP)
- Import plików (PDF/DOCX – nie w MVP)
- Współdzielenie zestawów (nie w MVP)

## 3. Typy testów do przeprowadzenia

### 3.1 Testy jednostkowe (Unit Tests)
**Framework**: Vitest + React Testing Library

**Zakres**:
- **Usługi** (`src/lib/services/*`):
  - ✅ `openrouter.service.ts` – **rozszerzyć istniejące testy** (`__tests__/openrouter.service.test.ts`):
    - Chunking tekstu (10-15k znaków)
    - Deduplikacja w batchu (30 kart)
    - Exponential backoff i retry
    - Timeout handling
  - ❌ `generation.service.ts` – mockować `OpenRouterService`:
    - `startGeneration()` – walidacja, orchestracja
    - `getGenerationStatus()` – mapowanie statusów (Processing/Completed/Failed)
    - Obsługa błędów OpenRouter
  - ❌ `set.service.ts`, `card.service.ts`, `srs.service.ts` – logika biznesowa bez DB
  
- **Walidacje** (`src/lib/schemas.ts`):
  - Zod schemas: `StartGenerationSchema`, `CreateSetSchema`, `CreateCardSchema`, etc.
  - Edge cases: min/max length, required fields, format validation
  - Mapowanie błędów do `details` (zgodnie z `ErrorResponseDto`)

- **Hooki React** (`src/hooks/*`):
  - `useGenerationApi` – retry logic, error handling (401/429/5xx)
  - `useRetry` – exponential backoff, maxRetries
  - `useProgressPolling` – polling interval, timeout, state transitions

**Strategia mockowania**:
- Supabase client: `vi.mock('src/db/supabase.client.ts')`
- OpenRouter API: mockować przez `vi.spyOn(OpenRouterService.prototype, 'generateFlashcards')`
- Nie używać MSW w unit testach (za ciężkie)

**Coverage target**: ≥ 90% dla services i schemas, ≥ 80% dla hooków

### 3.2 Testy integracyjne (Integration Tests)
**Framework**: Vitest + MSW (dla OpenRouter) + Lokalna Supabase

**Zakres**:
- **API Endpoints** (`src/pages/api/*`) z pełnym stackiem (middleware + service + DB):
  - Auth: login/logout/register z prawdziwą sesją Supabase
  - Generations: POST z mockiem OpenRouter (MSW), GET status, retry
  - Sets/Cards: CRUD z walidacją RLS
  - SRS: sessions, reviews z algorytmem SM-2
  
- **Middleware** (`src/middleware/index.ts`):
  - Public paths (dostęp bez tokenu)
  - Protected paths (redirect do `/auth/login`)
  - Injection `locals.supabase` i `locals.user`

**Środowisko**:
- Lokalna Supabase (Supabase CLI `supabase start`)
- Reset DB przed każdym testem suite (`supabase db reset`)
- MSW handlers dla `https://openrouter.ai/api/*`

**Wykorzystanie istniejących narzędzi**:
- ✅ `.ai/test-simple.js` – przekonwertować na Vitest jako **smoke tests**
- ✅ `.ai/test-api-endpoints.sh` – zostawić jako **manual testing tool**

**Coverage target**: ≥ 90% głównych ścieżek (2xx/4xx), ≥ 70% edge cases

### 3.3 Testy E2E (End-to-End Tests)
**Framework**: Playwright

**Zakres** (tylko krytyczne ścieżki UI):
1. **Generacja anonimowa**:
   - Wklejenie tekstu → walidacja → start generacji → progress modal → wyświetlenie kart
   - Acceptance/rejection/undo flow
   - Obsługa błędów (timeout, 429, 5xx)

2. **Logowanie i migracja**:
   - Logowanie użytkownika
   - MigrationModal – transfer danych z localStorage do Supabase
   - Redirect do dashboard

3. **Zapis do zestawów**:
   - Wybór istniejącego zestawu / utworzenie nowego
   - Batch save accepted cards
   - Weryfikacja w dashboard

4. **SRS Session**:
   - Start sesji → przegląd kart → oceny (1-5) → podsumowanie
   - Weryfikacja metryki (new cards, review cards, accuracy)

**Nie testować przez E2E**:
- Podstawowych CRUD API (to integration tests)
- Wszystkich edge cases walidacji (to unit tests)
- Komponentów w izolacji (to nie jest component testing tool)

**Coverage target**: 100% krytycznych user journeys (4 scenariusze powyżej)

### 3.4 Testy wydajnościowe (Performance Tests)
**Framework**: Lighthouse CLI (w CI)

**Zakres**:
- **Lighthouse audits** dla kluczowych stron:
  - `/` (landing page)
  - `/generate` (główna ścieżka użytkownika)
  - `/dashboard` (authenticated)
  
- **Metryki**:
  - First Contentful Paint (FCP) < 1.8s
  - Largest Contentful Paint (LCP) < 2.5s
  - Time to Interactive (TTI) < 3.8s
  - Cumulative Layout Shift (CLS) < 0.1

**POZA ZAKRESEM MVP**:
- ❌ k6/Artillery dla load testing (odłożone do post-MVP przed public launch)
- ❌ Testy wydajności generowania AI (zależne od OpenRouter, kosztowne)

**Strategia**:
- API endpoints: mierzyć tylko operacje **bez** wywołań OpenRouter
- OpenRouter mock (MSW) dla stabilnych testów wydajnościowych

### 3.5 Testy bezpieczeństwa (Security Tests)
**Zakres**:

1. **RLS (Row Level Security)**:
   - Setup: 2 użytkowników (A, B) w lokalnej Supabase
   - Scenariusze:
     - User A nie widzi zestawów/kart User B
     - User A nie może modyfikować danych User B (403)
     - Próba dostępu bez tokenu → 401
   - Narzędzie: Vitest z direktnymi queries SQL przez Supabase client

2. **Cookies i sesje**:
   - Weryfikacja flag: `httpOnly`, `secure`, `sameSite=lax`
   - Brak wrażliwych danych w localStorage (po zalogowaniu)
   - Narzędzie: Playwright (inspect cookies w E2E testach)

3. **Walidacja i sanitizacja**:
   - Zod schema enforcement (wszystkie endpoints)
   - Brak SQL injection (przez Supabase parametryzowane queries)
   - XSS protection (React auto-escaping, CSP headers)

**POZA ZAKRESEM MVP**:
- ❌ ZAP/Burp Suite (pentesting – post-MVP)
- ❌ Dependency scanning (Snyk/Dependabot – konfiguracja w CI, ale nie w planie testów)

### 3.6 Testy dostępności (Accessibility Tests)
**Framework**: @axe-core/playwright

**Zakres podstawowy**:
- Automatyczne skanowanie kluczowych stron:
  - `/auth/login`, `/generate`, `/dashboard`
- Sprawdzenie:
  - Kontrast kolorów (WCAG AA)
  - ARIA labels (formularze, buttony, dialogi)
  - Fokus keyboard (Tab navigation)
  - Alt text dla obrazów (jeśli są)

**Strategia**:
- Integracja z Playwright E2E (jeden dodatek na końcu każdego testu)
- Automatyczne raporty w CI

**Coverage target**: WCAG 2.1 Level A (minimum), dążyć do AA dla krytycznych ścieżek

**POZA ZAKRESEM MVP**:
- Pełne testy manualne (screen readers)
- WCAG AAA
- Pełna dokumentacja a11y

### 3.7 Testy limitów i walidacji biznesowej
**Zakres**:
- Limit 200 kart/zestaw:
  - Seed: zestaw z 199 kartami
  - Test: 200. karta OK (201), 201. karta FAIL (422)
- Limit 1000 kart/użytkownik:
  - Seed: użytkownik z 999 kartami
  - Test: 1000. karta OK, 1001. FAIL (422)
- Limity długości (front 200, back 500 znaków)
- Daily limits (20 new cards, 100 reviews)

**Strategia seed data**:
- Direct DB inserts przez Supabase SQL (szybsze niż API)
- Script: `supabase/seed-limits.sql`

### 3.8 Definition of Done per typ testu
- **Unit test**: ✅ Test passed + coverage ≥90% + 0 linter errors
- **Integration test**: ✅ Test passed + DB cleanup + 0 side effects
- **E2E test**: ✅ User journey completed + screenshots on failure + video recording
- **Performance test**: ✅ Metrics within targets + trend comparison (±10% regression)
- **Security test**: ✅ RLS verified + 0 policy bypasses + cookie flags correct
- **Accessibility test**: ✅ 0 critical violations + ≤5 warnings (documented)

## 4. Szczegółowe scenariusze testowe

### 4.1 Autentykacja i middleware

#### TC-AUTH-001: Dostęp anonimowy do generacji
- **Warunek wstępny**: Brak tokenu JWT
- **Kroki**:
  1. POST `/api/generations` z poprawnym payload (bez `Authorization` header)
  2. Sprawdź response status
- **Oczekiwany wynik**: 202 Accepted (anonimowy dostęp dozwolony zgodnie z middleware line 12)
- **Typ**: Integration

#### TC-AUTH-002: Redirect z chronionej strony
- **Warunek wstępny**: Brak sesji w cookies
- **Kroki**:
  1. GET `/dashboard`
  2. Sprawdź response
- **Oczekiwany wynik**: 302 Redirect → `/auth/login`
- **Typ**: Integration / E2E

#### TC-AUTH-003: Logowanie poprawne
- **Warunek wstępny**: Użytkownik test@example.com istnieje w DB
- **Kroki**:
  1. POST `/api/auth/login` z `{email, password}`
  2. Sprawdź cookies w response
  3. GET `/dashboard`
- **Oczekiwany wynik**: 
  - Cookies ustawione (`httpOnly`, `secure`, `sameSite=lax`)
  - Dashboard dostępny (200)
- **Typ**: Integration + E2E

#### TC-AUTH-004: Logowanie błędne (niepoprawne hasło)
- **Warunek wstępny**: Użytkownik istnieje
- **Kroki**:
  1. POST `/api/auth/login` z błędnym password
- **Oczekiwany wynik**: 401 Unauthorized + message "Invalid credentials"
- **Typ**: Integration

#### TC-AUTH-005: Migracja danych po zalogowaniu
- **Warunek wstępny**: 
  - localStorage zawiera dane generacji anonimowej (proposals, selectedIds)
  - Użytkownik się loguje
- **Kroki**:
  1. Symuluj anonimową generację (localStorage)
  2. Zaloguj użytkownika
  3. Sprawdź wywołanie MigrationModal
  4. Akceptuj migrację
  5. Sprawdź DB (cards/sets)
- **Oczekiwany wynik**: Dane przeniesione do Supabase, localStorage wyczyszczony
- **Typ**: E2E

#### TC-AUTH-006: Middleware injection
- **Warunek wstępny**: Middleware aktywne
- **Kroki**:
  1. Request do dowolnego endpoint z tokenem
  2. W handlerze API sprawdź `context.locals.supabase` i `context.locals.user`
- **Oczekiwany wynik**: `locals.supabase` !== null, `locals.user.id` = user ID z tokenu
- **Typ**: Integration (unit test middleware)

### 4.2 Generowanie fiszek

#### TC-GEN-001: Poprawne generowanie (PL)
- **Warunek wstępny**: Mock OpenRouter zwraca 30 kart
- **Payload**:
  ```json
  {
    "source_text": "Lorem ipsum... (500 znaków)",
    "language": "pl",
    "target_count": 30
  }
  ```
- **Kroki**:
  1. POST `/api/generations`
  2. Sprawdź response
  3. Poll GET `/api/generations/:id` aż `status = "completed"`
- **Oczekiwany wynik**: 
  - 202 z `id`, `status: "pending"`, `estimated_duration_ms`
  - Po polling: `status: "completed"`, 30 kart w `proposals`
- **Typ**: Integration (z MSW mock)

#### TC-GEN-002: Walidacja – tekst za krótki
- **Payload**: `source_text` = 50 znaków (< 100 min)
- **Oczekiwany wynik**: 400 z `details.source_text` = "must be at least 100 characters"
- **Typ**: Unit (Zod schema) + Integration (API)

#### TC-GEN-003: Walidacja – tekst za długi
- **Payload**: `source_text` = 20000 znaków (> 15000 max)
- **Oczekiwany wynik**: 400 z `details.source_text` = "must not exceed 15,000 characters"
- **Typ**: Unit + Integration

#### TC-GEN-004: Walidacja – niepoprawny język
- **Payload**: `language` = "xyz" (nie ISO 639-1)
- **Oczekiwany wynik**: 400 z `details.language` = "must be a valid ISO 639-1 code"
- **Typ**: Unit + Integration

#### TC-GEN-005: Brak klucza OpenRouter
- **Warunek wstępny**: `OPENROUTER_API_KEY` nie ustawiony w env
- **Oczekiwany wynik**: 500 Internal Server Error (kontrolowany błąd, logowany)
- **Typ**: Integration (manual test, nie w CI)

#### TC-GEN-006: Timeout OpenRouter
- **Warunek wstępny**: MSW mock opóźnia odpowiedź o 65s (> timeout)
- **Oczekiwany wynik**: 
  - Status generacji → `"failed"`
  - Error message użytkownika: "Generation timed out. Please try again."
- **Typ**: Integration

#### TC-GEN-007: Retry failed generation
- **Warunek wstępny**: Generacja w statusie `"failed"`
- **Kroki**:
  1. POST `/api/generations/:id/retry`
  2. Poll status
- **Oczekiwany wynik**: Nowa próba, status `"pending"` → `"completed"`
- **Typ**: Integration + E2E

#### TC-GEN-008: Frontend – Progress Modal
- **Kroki** (E2E):
  1. Wklej tekst w `PasteTextarea`
  2. Click "Generate"
  3. Sprawdź pojawienie się `ProgressModal`
  4. Zaczekaj na completion
  5. Sprawdź wyświetlenie kart w `CardGrid`
- **Oczekiwany wynik**: Modal pokazuje progress, zamyka się po completion, karty widoczne
- **Typ**: E2E

#### TC-GEN-009: Frontend – Accept/Reject/Undo
- **Warunek wstępny**: 30 kart wygenerowanych
- **Kroki**:
  1. Accept 10 kart
  2. Reject 5 kart
  3. Click Undo
  4. Sprawdź stan
- **Oczekiwany wynik**: 
  - Po accept: `selectedIds.length = 10`
  - Po reject: `rejectedIds.length = 5`
  - Po undo: ostatnia akcja cofnięta
- **Typ**: E2E (lub React component test)

### 4.3 Zestawy i karty

#### TC-SET-001: Utworzenie zestawu
- **Payload**: `{name: "Spanish 101", language: "es"}`
- **Oczekiwany wynik**: 201 Created z `id`, `name`, `language`, `card_count: 0`
- **Typ**: Integration

#### TC-SET-002: Duplikat nazwy zestawu
- **Warunek wstępny**: Zestaw "Spanish 101" istnieje dla usera
- **Payload**: `{name: "Spanish 101", language: "es"}`
- **Oczekiwany wynik**: 409 Conflict (lub 400 z message)
- **Typ**: Integration

#### TC-SET-003: Batch save kart
- **Warunek wstępny**: Zestaw z 0 kartami, 10 zaakceptowanych proposals
- **Payload**: 
  ```json
  {
    "cards": [
      {"front": "Hello", "back": "Hola", "source_generation_id": "uuid"},
      ...
    ]
  }
  ```
- **Oczekiwany wynik**: 
  - 201 Created z `created_count: 10`, `skipped_count: 0`
  - DB: 10 kart w zestawie
- **Typ**: Integration

#### TC-SET-004: Limit 200 kart/zestaw
- **Warunek wstępny**: Zestaw z 199 kartami
- **Payload**: Batch 2 karty
- **Oczekiwany wynik**: 
  - 1. karta OK, 2. karta FAIL
  - 422 Unprocessable Entity: "Set limit of 200 cards exceeded"
- **Typ**: Integration (wymaga seed script)

#### TC-CARD-001: Aktualizacja karty
- **Warunek wstępny**: Karta należy do usera
- **Payload**: PATCH `/api/cards/:id` z `{front: "Updated"}`
- **Oczekiwany wynik**: 200 OK, karta zaktualizowana, `version++`
- **Typ**: Integration

#### TC-CARD-002: Usunięcie karty innego użytkownika (RLS)
- **Warunek wstępny**: Karta należy do User B
- **Kroki**: User A próbuje DELETE `/api/cards/:id`
- **Oczekiwany wynik**: 403 Forbidden lub 404 Not Found (RLS policy)
- **Typ**: Integration (security)

### 4.4 SRS (Spaced Repetition System)

#### TC-SRS-001: Start sesji
- **Warunek wstępny**: 10 kart due (5 new, 5 review)
- **Kroki**: POST `/api/srs/sessions`
- **Oczekiwany wynik**: 
  - 201 z `session_id`, `queue: [{card_id, type: "new"|"review"}]`
  - Queue posortowana (new cards first)
- **Typ**: Integration

#### TC-SRS-002: Submit review (rating 4)
- **Warunek wstępny**: Sesja aktywna, karta new
- **Payload**: `{card_id, rating: 4, response_time_ms: 5000}`
- **Oczekiwany wynik**: 
  - 200 OK
  - Karta: `interval = 1` (SM-2 algorithm)
  - `due_date = now + 1 day`
- **Typ**: Integration (sprawdź algorytm)

#### TC-SRS-003: Daily limit new cards
- **Warunek wstępny**: 20 new cards zrecenzowanych dzisiaj
- **Kroki**: Review 21. new card
- **Oczekiwany wynik**: 422 "Daily limit of 20 new cards exceeded"
- **Typ**: Integration

#### TC-SRS-004: Session summary
- **Warunek wstępny**: Sesja zakończona (5 kart zrecenzowanych)
- **Kroki**: GET `/api/srs/sessions/:id/summary`
- **Oczekiwany wynik**: 
  ```json
  {
    "total_cards": 5,
    "new_cards": 2,
    "review_cards": 3,
    "average_response_time_ms": 4500,
    "accuracy": 0.8
  }
  ```
- **Typ**: Integration

### 4.5 RLS i bezpieczeństwo

#### TC-SEC-001: Izolacja zestawów (RLS)
- **Setup**: User A ma zestaw "Set A", User B ma "Set B"
- **Kroki**:
  1. User A: GET `/api/sets`
  2. Sprawdź response
- **Oczekiwany wynik**: Tylko "Set A" w response (nie widzi "Set B")
- **Typ**: Integration

#### TC-SEC-002: Próba dostępu do karty innego usera
- **Setup**: Karta należy do User B
- **Kroki**: User A: GET `/api/cards/:id`
- **Oczekiwany wynik**: 404 Not Found (RLS policy ukrywa)
- **Typ**: Integration (security)

#### TC-SEC-003: Cookies flags
- **Kroki**:
  1. Zaloguj użytkownika
  2. Inspect cookies w browser/Playwright
- **Oczekiwany wynik**: 
  - `sb-access-token`: `HttpOnly=true`, `Secure=true`, `SameSite=Lax`
  - `sb-refresh-token`: `HttpOnly=true`, `Secure=true`, `SameSite=Lax`
- **Typ**: E2E

#### TC-SEC-004: localStorage po zalogowaniu
- **Kroki**:
  1. Zaloguj użytkownika
  2. Sprawdź localStorage
- **Oczekiwany wynik**: Brak wrażliwych danych (tokeny tylko w httpOnly cookies)
- **Typ**: E2E

### 4.6 UX i dostępność

#### TC-A11Y-001: Keyboard navigation
- **Kroki**:
  1. Otwórz `/auth/login`
  2. Nawiguj tylko Tab/Enter
  3. Wypełnij formularz
  4. Submit
- **Oczekiwany wynik**: Pełna funkcjonalność bez myszy
- **Typ**: E2E (manual lub automated Playwright)

#### TC-A11Y-002: Axe scan
- **Kroki**: Uruchom @axe-core/playwright na `/generate`
- **Oczekiwany wynik**: 0 critical violations, ≤5 warnings
- **Typ**: E2E (automated)

#### TC-UX-001: Komunikaty błędów
- **Scenariusze**: 401, 429, 400, 5xx z różnych endpointów
- **Oczekiwany wynik**: Toast z czytelnym message (PL/EN/ES zgodnie z językiem)
- **Typ**: E2E

#### TC-UX-002: Responsywność
- **Kroki**: Playwright z viewports: mobile (375px), tablet (768px), desktop (1920px)
- **Oczekiwany wynik**: Layout poprawny, brak overflow, przyciski klikalne
- **Typ**: E2E (visual test opcjonalnie)

## 5. Środowisko testowe

### 5.1 Lokalne (Development)

**Wymagania**:
- Node 20 LTS
- pnpm (lub npm)
- Supabase CLI (`brew install supabase/tap/supabase`)

**Setup**:
```bash
# 1. Instalacja zależności testowych
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test @axe-core/playwright
pnpm add -D msw

# 2. Start lokalnej Supabase
supabase start

# 3. Załaduj migracje
supabase db reset

# 4. Uruchom seed scripts
psql $DB_URL -f supabase/seed-test-users.sql
psql $DB_URL -f supabase/seed-limits.sql

# 5. Uruchom testy
pnpm test              # Unit + Integration (Vitest)
pnpm test:e2e          # E2E (Playwright)
```

**Zmienne środowiskowe** (`.env.test`):
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1... # anon key z supabase start
OPENROUTER_API_KEY=mock           # nie używane w testach (MSW)
```

**Lokalna Supabase**:
- API: `http://localhost:54321`
- Studio: `http://localhost:54323`
- Reset DB: `supabase db reset` (przed każdym test suite)

### 5.2 CI/CD (GitHub Actions)

**Pipeline**:
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  lint:
    - run: pnpm lint
    - run: pnpm typecheck
  
  unit-integration:
    services:
      postgres:
        image: supabase/postgres:latest
    steps:
      - run: supabase db reset --linked
      - run: pnpm test --coverage
      - upload: coverage report
  
  e2e:
    steps:
      - run: supabase start
      - run: pnpm build
      - run: pnpm test:e2e --reporter=html
      - upload: test-results/, playwright-report/
  
  performance:
    steps:
      - run: pnpm build
      - run: pnpm preview &
      - run: lighthouse http://localhost:4321 --preset=desktop
```

**Baza testowa**:
- Reset przed każdym job (`supabase db reset`)
- Seed data: 2 użytkowników (test-a@example.com, test-b@example.com)
- Automatyczne cleanup po testach

**Artifacts**:
- Coverage reports (Codecov/Coveralls)
- E2E screenshots/videos (tylko failures)
- Lighthouse reports (performance trending)

## 6. Narzędzia do testowania

### 6.1 Framework i biblioteki

| Kategoria | Narzędzie | Wersja | Zastosowanie |
|-----------|-----------|--------|--------------|
| **Unit/Integration** | Vitest | ^2.x | Framework testowy (replacement dla Jest) |
| | @testing-library/react | ^16.x | Testowanie komponentów React |
| | @testing-library/jest-dom | ^6.x | Custom matchers dla DOM |
| **E2E** | Playwright | ^1.47.x | Testy przeglądarki (Chrome, Firefox, Safari) |
| | @axe-core/playwright | ^4.x | Testy dostępności (a11y) |
| **Mocking** | MSW | ^2.x | Mock Service Worker dla API calls |
| | Vitest mocks | built-in | vi.mock(), vi.spyOn() dla unit tests |
| **Performance** | Lighthouse CLI | ^12.x | Core Web Vitals, accessibility audit |
| **Coverage** | Vitest coverage | built-in | @vitest/coverage-v8 |
| **Linting** | ESLint | 9.23.0 | ✅ Już w projekcie |
| | TypeScript | 5.x | ✅ Już w projekcie (strict mode) |
| **Pre-commit** | Husky | 9.1.7 | ✅ Już w projekcie |
| | lint-staged | 15.5.0 | ✅ Już w projekcie |

### 6.2 Konfiguracja narzędzi

#### Vitest (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### Playwright (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm preview',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### MSW Handlers (`src/test/mocks/handlers.ts`)
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock OpenRouter API
  http.post('https://openrouter.ai/api/v1/chat/completions', async ({ request }) => {
    // Return mock flashcards
    return HttpResponse.json({
      choices: [{
        message: {
          content: JSON.stringify({
            flashcards: Array.from({ length: 30 }, (_, i) => ({
              front: `Front ${i + 1}`,
              back: `Back ${i + 1}`,
            }))
          })
        }
      }]
    });
  }),
];
```

### 6.3 Wykorzystanie istniejących narzędzi

**✅ Zachowane (już w projekcie)**:
- ESLint 9.23.0 z konfiguracją Astro + React
- TypeScript 5.x strict mode
- Prettier + plugin-astro
- Husky + lint-staged (pre-commit hooks)

**✅ Migracja/rozszerzenie**:
- `.ai/test-simple.js` → `src/test/smoke/api-basic.test.ts` (Vitest)
- `.ai/test-api-endpoints.sh` → zostawić jako manual testing tool
- `src/lib/services/__tests__/openrouter.service.test.ts` → rozszerzyć coverage

### 6.4 Narzędzia POZA zakresem MVP

❌ **Nie używamy**:
- k6/Artillery (load testing) – post-MVP
- ZAP/Burp Suite (pentesting) – post-MVP
- Percy/Chromatic (visual regression) – post-MVP
- Cypress (wybieramy Playwright jako standardowy dla Astro)
- Jest (zastąpiony przez Vitest – szybszy, lepszy TS support)

## 7. Harmonogram testów

### Tydzień 0: Setup infrastruktury (3-5 dni)
**Cel**: Przygotowanie środowiska testowego i narzędzi

**Zadania**:
- [ ] Instalacja zależności (Vitest, Playwright, MSW, @axe-core)
- [ ] Konfiguracja Vitest (`vitest.config.ts`, setup files)
- [ ] Konfiguracja Playwright (`playwright.config.ts`, e2e folder structure)
- [ ] Setup MSW handlers dla OpenRouter
- [ ] Konfiguracja lokalnej Supabase (`supabase start`, env variables)
- [ ] Seed scripts:
  - `supabase/seed-test-users.sql` (2 użytkowników A/B)
  - `supabase/seed-limits.sql` (zestawy z 199 kartami, user z 999 kartami)
  - `supabase/seed-fixtures.sql` (podstawowe dane testowe)
- [ ] Audyt istniejących testów (`openrouter.service.test.ts`)
- [ ] Migracja `.ai/test-simple.js` → `src/test/smoke/api-basic.test.ts`
- [ ] Dokumentacja: `README-TESTING.md`

**Deliverables**:
- ✅ `pnpm test` działa (nawet jeśli 0 testów)
- ✅ `pnpm test:e2e` działa
- ✅ Lokalna Supabase z seed data
- ✅ CI/CD pipeline szkielet (GitHub Actions)

---

### Tydzień 1: Testy jednostkowe (5 dni)
**Cel**: Coverage ≥90% dla services i schemas

**Zadania**:
- [ ] **Walidacje (Zod schemas)** – `src/lib/schemas.ts`:
  - TC-GEN-002, TC-GEN-003, TC-GEN-004 (generation validation)
  - Set/Card schemas validation
  - SRS schemas validation
- [ ] **Services**:
  - `generation.service.ts` – unit tests z mockowanym OpenRouterService
  - `set.service.ts`, `card.service.ts` – logika biznesowa
  - `srs.service.ts` – algorytm SM-2
  - **Rozszerzenie** `openrouter.service.test.ts`:
    - Chunking (10-15k chars)
    - Deduplikacja (30 kart batch)
    - Exponential backoff
    - Timeout handling
- [ ] **Hooki React**:
  - `useGenerationApi` – retry, error mapping
  - `useRetry` – exponential backoff logic
  - `useProgressPolling` – interval, timeout, state transitions

**Coverage target**: ≥90% services, ≥90% schemas, ≥80% hooks

**Deliverables**:
- ✅ 40-50 unit testów passed
- ✅ Coverage report: services 90%+, schemas 95%+

---

### Tydzień 2: Testy integracyjne API (5 dni)
**Cel**: Coverage ≥90% endpointów API + middleware + RLS

**Zadania**:
- [ ] **Middleware** (`src/middleware/index.ts`):
  - TC-AUTH-001 (anonimowy dostęp do generations)
  - TC-AUTH-002 (redirect /dashboard)
  - TC-AUTH-006 (locals injection)
- [ ] **Auth endpoints**:
  - TC-AUTH-003, TC-AUTH-004 (login success/fail)
  - Logout, register flows
- [ ] **Generations**:
  - TC-GEN-001 (poprawne generowanie z MSW mock)
  - TC-GEN-002, TC-GEN-003, TC-GEN-004 (walidacje)
  - TC-GEN-006 (timeout), TC-GEN-007 (retry)
- [ ] **Sets/Cards**:
  - TC-SET-001, TC-SET-002 (CRUD, duplikaty)
  - TC-SET-003 (batch save)
  - TC-SET-004 (limit 200 kart/zestaw) – **wymaga seed script**
  - TC-CARD-001, TC-CARD-002 (update, RLS)
- [ ] **SRS**:
  - TC-SRS-001, TC-SRS-002 (sessions, reviews, SM-2)
  - TC-SRS-003 (daily limits)
  - TC-SRS-004 (summary)
- [ ] **RLS/Security**:
  - TC-SEC-001, TC-SEC-002 (izolacja user A/B)

**Environment**: Lokalna Supabase z `supabase db reset` przed każdym suite

**Coverage target**: ≥90% głównych ścieżek (2xx/4xx), ≥70% edge cases

**Deliverables**:
- ✅ 60-80 integration testów passed
- ✅ RLS verified (user A nie widzi danych user B)
- ✅ Wszystkie kody błędów (400/401/403/422/5xx) przetestowane

---

### Tydzień 3: Testy E2E (5 dni)
**Cel**: 100% krytycznych user journeys

**Zadania**:
- [ ] **Generacja anonimowa** (TC-GEN-008, TC-GEN-009):
  - Paste text → walidacja → generate → progress modal → cards display
  - Accept/Reject/Undo flow
  - Error handling (timeout, 429, 5xx)
- [ ] **Logowanie i migracja** (TC-AUTH-005):
  - Login flow
  - MigrationModal – localStorage → Supabase transfer
  - Dashboard redirect
- [ ] **Zapis do zestawów**:
  - Select existing set / create new
  - Batch save accepted cards
  - Verify in dashboard
- [ ] **SRS Session**:
  - Start session → review cards → ratings → summary
  - Verify metrics (new cards, accuracy, response time)
- [ ] **Dostępność** (TC-A11Y-001, TC-A11Y-002):
  - Keyboard navigation (`/auth/login`, `/generate`)
  - @axe-core scan (0 critical violations)
- [ ] **UX** (TC-UX-001, TC-UX-002):
  - Error toasts (401/429/400/5xx)
  - Responsywność (mobile/tablet/desktop)

**Environment**: Playwright z lokalną Supabase + build production

**Deliverables**:
- ✅ 20-30 E2E testów passed (4 main journeys + a11y + UX)
- ✅ Screenshots/videos dla failures
- ✅ Test reports (HTML, CI artifacts)

---

### Tydzień 4: Testy bezpieczeństwa i wydajności (5 dni)
**Cel**: Weryfikacja RLS + Lighthouse audits

**Zadania**:
- [ ] **Dogłębne testy RLS**:
  - User A/B isolation dla wszystkich tabel (sets, cards, generations, srs_*)
  - Próby SQL injection (parametryzowane queries Supabase)
  - Direct DB queries (bypass API) – RLS musi blokować
- [ ] **Cookies i sesje** (TC-SEC-003, TC-SEC-004):
  - Flags: httpOnly, secure, sameSite
  - localStorage cleanup po login
- [ ] **Lighthouse audits**:
  - `/` (landing), `/generate`, `/dashboard`
  - Metryki: FCP < 1.8s, LCP < 2.5s, CLS < 0.1
  - Accessibility score ≥90
- [ ] **Regression testów**:
  - Uruchomienie pełnego test suite (unit + integration + E2E)
  - Weryfikacja coverage thresholds
- [ ] **Fixy P1/P2**:
  - Naprawa krytycznych błędów znalezionych w tygodniach 1-3

**Deliverables**:
- ✅ RLS verified: 0 policy bypasses
- ✅ Lighthouse reports: wszystkie strony ≥90 score
- ✅ Security audit report
- ✅ Regression: wszystkie testy green

---

### Tydzień 5: Stabilizacja i dokumentacja (3-5 dni)
**Cel**: Finalizacja, dokumentacja, raport końcowy

**Zadania**:
- [ ] **Fixy P3/P4**:
  - Usterki UI/UX, edge cases
  - Warnings a11y (≤5 dozwolonych)
- [ ] **CI/CD finalizacja**:
  - GitHub Actions workflow kompletny
  - Coverage upload (Codecov)
  - E2E artifacts (screenshots/videos)
  - Lighthouse reporting
- [ ] **Dokumentacja**:
  - Aktualizacja `README-TESTING.md`
  - Instrukcje uruchomienia testów (lokalne + CI)
  - Known issues i workarounds
- [ ] **Raport końcowy**:
  - Test execution summary (passed/failed/skipped)
  - Coverage metrics (unit/integration/E2E)
  - Performance benchmarks (Lighthouse)
  - Security findings
  - Recommendations dla post-MVP
- [ ] **Akceptacja**:
  - Review z Tech Lead/PO
  - Sign-off na kryteria akceptacji (sekcja 8)

**Deliverables**:
- ✅ Raport testów końcowy (PDF/Markdown)
- ✅ Dokumentacja zaktualizowana
- ✅ CI/CD pipeline production-ready
- ✅ Akceptacja PO/Tech Lead

---

### Podsumowanie timeline
- **Tydzień 0**: Setup (3-5 dni)
- **Tydzień 1**: Unit tests (5 dni)
- **Tydzień 2**: Integration tests (5 dni)
- **Tydzień 3**: E2E tests (5 dni)
- **Tydzień 4**: Security + Performance (5 dni)
- **Tydzień 5**: Stabilizacja + Dokumentacja (3-5 dni)

**Całkowity czas**: 5-6 tygodni (25-30 dni roboczych)

**Buffor**: +1 tydzień na nieprzewidziane (fixy, re-testy, dependencies issues)

**Realistyczny termin MVP**: 6-7 tygodni od rozpoczęcia testów

## 8. Kryteria akceptacji testów

### 8.1 Funkcjonalne

#### Must-have (blokujące release)
- ✅ **100% krytycznych E2E user journeys** przechodzi:
  - Generacja anonimowa (paste → generate → cards display)
  - Logowanie + migracja danych
  - Zapis do zestawów (batch save)
  - SRS session (start → reviews → summary)
- ✅ **Testy integracyjne API ≥90%** głównych ścieżek:
  - Auth: login/logout/register (2xx/4xx)
  - Generations: start/status/retry (202/400/5xx)
  - Sets/Cards: CRUD + batch (2xx/4xx/422)
  - SRS: sessions/reviews/summary (2xx/4xx)
- ✅ **Walidacje Zod** zwracają 400 z `details` per pole (wszystkie schemas)
- ✅ **RLS enforcement**: user A nie widzi/nie modyfikuje danych user B (0 policy bypasses)
- ✅ **Limity biznesowe** działają:
  - 200 kart/zestaw → 422 po przekroczeniu
  - 1000 kart/użytkownik → 422
  - Daily limits (20 new, 100 reviews) → 422

#### Should-have (nie blokujące, ale ważne)
- ✅ **Coverage**: unit tests ≥90% (services/schemas), integration ≥85% (endpoints)
- ✅ **Error handling**: wszystkie kody błędów (400/401/403/422/429/5xx) mają testy
- ✅ **Edge cases**: ≥70% coverage (granice walidacji, timeouts, duplikaty)

### 8.2 Niefunkcjonalne

#### Performance
- ✅ **Lighthouse scores** ≥90 dla kluczowych stron (`/`, `/generate`, `/dashboard`):
  - First Contentful Paint (FCP) < 1.8s
  - Largest Contentful Paint (LCP) < 2.5s
  - Cumulative Layout Shift (CLS) < 0.1
  - Time to Interactive (TTI) < 3.8s
- ✅ **API response times** (z mock OpenRouter):
  - `POST /api/generations` → 202 w ≤ 2s
  - `POST /api/sets/:id/cards/batch` (30 kart) → 201 w ≤ 2s
  - GET endpoints → ≤ 500ms (p95)

**POZA ZAKRESEM MVP** (nie testujemy):
- Pełna ścieżka generacji AI (P95 ≤30s) – zależna od OpenRouter, nie możemy kontrolować w testach
- Load testing (1000+ concurrent users)

#### Security
- ✅ **RLS policies**: 100% tabel z user_id mają polityki, 0 bypasses
- ✅ **Cookies flags**: `httpOnly=true`, `secure=true`, `sameSite=lax` (wszystkie auth cookies)
- ✅ **localStorage**: brak tokenów/wrażliwych danych po zalogowaniu
- ✅ **SQL injection**: parametryzowane queries Supabase (0 vulnerabilities)
- ✅ **XSS**: React auto-escaping + CSP headers (0 critical findings)

#### Accessibility
- ✅ **WCAG 2.1 Level A** (minimum) dla krytycznych stron
- ✅ **Axe-core audits**: 0 critical violations, ≤5 warnings (documented)
- ✅ **Keyboard navigation**: pełna funkcjonalność bez myszy (login, generate, dashboard)
- ✅ **Kontrast**: WCAG AA (4.5:1 dla tekstu normalnego)

### 8.3 CI/CD

#### Pipeline requirements
- ✅ **Automatyczne testy** w PR (unit + integration + E2E)
- ✅ **Blocking conditions**:
  - Linter errors → block merge
  - TypeScript errors → block merge
  - Unit tests failure → block merge
  - Integration tests failure → block merge
  - E2E critical paths failure → block merge
- ✅ **Non-blocking** (warnings):
  - E2E non-critical paths (retry 2x przed fail)
  - Lighthouse score 85-90 (warning, 90+ required)
  - Coverage drop >5% (warning, review)

#### Artifacts
- ✅ **Coverage reports** uploaded (Codecov/Coveralls)
- ✅ **E2E screenshots/videos** (tylko failures, max 7 days retention)
- ✅ **Lighthouse reports** (trending, porównanie z poprzednimi runs)
- ✅ **Test execution summary** (passed/failed/skipped counts)

### 8.4 Documentation

#### Must-have
- ✅ **README-TESTING.md**:
  - Setup instructions (lokalne + CI)
  - Komendy: `pnpm test`, `pnpm test:e2e`, `pnpm test:coverage`
  - Troubleshooting (common issues)
- ✅ **Seed scripts** z komentarzami (`supabase/seed-*.sql`)
- ✅ **Test case IDs** w komentarzach (TC-AUTH-001, TC-GEN-001, etc.)

#### Nice-to-have
- ✅ **Test execution report** (final): metrics, findings, recommendations
- ✅ **Known issues** dokumentowane (GitHub Issues z tag `known-issue`)

### 8.5 Sign-off checklist

Przed akceptacją MVP jako "ready for beta":
- [ ] Wszystkie kryteria "Must-have" spełnione (sekcje 8.1-8.4)
- [ ] Regression test suite passed (pełny run: unit + integration + E2E)
- [ ] CI/CD pipeline production-ready (wszystkie jobs green)
- [ ] Security audit passed (RLS + cookies + a11y)
- [ ] Performance baseline ustanowiony (Lighthouse trending)
- [ ] Dokumentacja zaktualizowana i zweryfikowana
- [ ] P1/P2 bugs fixed (0 critical/high issues open)
- [ ] Tech Lead/PO sign-off

**Odpowiedzialny za sign-off**: Tech Lead + QA Lead + PO

## 9. Role i odpowiedzialności

### 9.1 Zespół testowy

#### QA Engineer (Lead)
**Odpowiedzialności**:
- ✅ Opracowanie i utrzymanie planu testów
- ✅ Setup infrastruktury (Vitest, Playwright, MSW, CI/CD)
- ✅ Implementacja testów:
  - Unit tests (schemas, utilities)
  - Integration tests (API endpoints)
  - E2E tests (krytyczne user journeys)
  - Security tests (RLS, cookies)
- ✅ Raportowanie:
  - Coverage reports (weekly)
  - Bug reports (GitHub Issues)
  - Test execution summary (daily w CI)
  - Final report (tydzień 5)
- ✅ Monitorowanie regresji (CI/CD alerts)
- ✅ Code review testów (peer review z developerami)

**Deliverables**:
- Test suites (unit/integration/E2E)
- Seed scripts
- CI/CD configuration
- Test reports i dokumentacja

#### Backend Developer
**Odpowiedzialności**:
- ✅ Wsparcie kontraktów API (dokumentacja endpointów, DTOs)
- ✅ Fixy bugs znalezionych w testach:
  - RLS policies
  - Walidacje Zod
  - Logika biznesowa (services)
- ✅ Implementacja testów jednostkowych dla własnych features
- ✅ Code review testów integracyjnych (API)
- ✅ Setup lokalnej Supabase (onboarding QA)
- ✅ Observability: logi błędów, monitoring (opcjonalnie)

**Deliverables**:
- Fixed bugs (P1/P2)
- Unit tests dla nowych features
- Migracje DB (jeśli potrzebne dla testów)

#### Frontend Developer
**Odpowiedzialności**:
- ✅ Stabilność UI/UX:
  - Error handling (toasts, modals)
  - Loading states (ProgressModal)
  - Form validation (inline errors)
- ✅ Fixy bugs UX/a11y znalezionych w testach E2E
- ✅ Implementacja testów hooków React (`useGenerationApi`, `useRetry`)
- ✅ Code review testów E2E (Playwright)
- ✅ Dostępność:
  - ARIA labels
  - Keyboard navigation
  - Focus management

**Deliverables**:
- Fixed bugs (UX/a11y)
- Unit tests dla hooków
- Improved error messages

#### Tech Lead
**Odpowiedzialności**:
- ✅ Priorytetyzacja testów (risk-based)
- ✅ Akceptacja kryteriów (sekcja 8)
- ✅ Decyzje architektoniczne:
  - Vitest vs Jest
  - Playwright vs Cypress
  - Lokalna Supabase vs remote test DB
- ✅ Review planu testów (approval)
- ✅ Unblocking zespołu (technical issues)
- ✅ Sign-off końcowy (sekcja 8.5)

#### Product Owner (PO)
**Odpowiedzialności**:
- ✅ Akceptacja user journeys E2E (zgodność z PRD)
- ✅ Priorytetyzacja bugów (P1-P4)
- ✅ Akceptacja trade-offs (MVP scope)
- ✅ Sign-off końcowy (business perspective)

### 9.2 Macierz RACI

| Zadanie | QA | Backend | Frontend | Tech Lead | PO |
|---------|-----|---------|----------|-----------|-----|
| Plan testów | **R** | C | C | **A** | I |
| Setup infrastruktury | **R/A** | C | C | I | - |
| Unit tests (services) | C | **R/A** | - | I | - |
| Unit tests (hooks) | C | - | **R/A** | I | - |
| Integration tests | **R/A** | C | C | I | - |
| E2E tests | **R/A** | I | C | I | C |
| Security tests (RLS) | **R** | **A** | - | C | I |
| A11y tests | **R** | - | **A** | I | C |
| Bug fixing | I | **R/A** | **R/A** | C | I |
| Sign-off | C | I | I | **A** | **A** |

**Legenda**:
- **R** (Responsible): wykonuje zadanie
- **A** (Accountable): odpowiedzialny za wynik
- **C** (Consulted): konsultowany
- **I** (Informed): informowany

## 10. Procedury raportowania błędów

### 10.1 Kanał raportowania
**GitHub Issues** z szablonem `.github/ISSUE_TEMPLATE/bug_report.md`

### 10.2 Szablon bug report

```markdown
## 🐛 Bug Report

### Typ błędu
- [ ] Funkcjonalny (logika)
- [ ] UI/UX
- [ ] Security (RLS, auth)
- [ ] Performance
- [ ] Accessibility

### Priorytet
- [ ] P1 - Critical (blocker release)
- [ ] P2 - High (major impact)
- [ ] P3 - Medium (minor impact)
- [ ] P4 - Low (cosmetic)

### Środowisko
- Branch/Commit: `main@abc1234`
- Environment: `local` / `CI` / `staging`
- Browser (E2E): Chrome 120 / Firefox 121 / Safari 17
- Test type: `unit` / `integration` / `e2e`

### Związane TC (Test Case)
TC-AUTH-001, TC-GEN-003 (jeśli dotyczy)

### Opis
Krótki opis błędu (1-2 zdania).

### Kroki reprodukcji
1. Zaloguj się jako user A
2. POST /api/sets z payload {...}
3. Sprawdź response

### Oczekiwany wynik
201 Created z `{id, name, ...}`

### Rzeczywisty wynik
400 Bad Request z `{error: "ValidationError", ...}`

### Logi/Screenshots
```
[Log output lub screenshot]
```

### Dodatkowy kontekst
- Czy błąd występuje losowo czy zawsze?
- Czy jest regresja (działało wcześniej)?
- Czy dotyczy tylko konkretnego środowiska?
```

### 10.3 Priorytety bugów

#### P1 - Critical (SLA: fix w 24h)
**Definicja**:
- Blokuje krytyczną ścieżkę użytkownika (nie można wygenerować kart, zalogować się)
- Luka bezpieczeństwa (RLS bypass, XSS, SQL injection)
- Data loss (utrata danych użytkownika)
- App crash (nie odpowiada, błąd 500 na każdym requestcie)

**Przykłady**:
- User A widzi zestawy User B (RLS bypass)
- POST /api/generations zwraca 500 dla każdego requestu
- Logowanie niemożliwe (auth broken)

**Workflow**:
1. Zgłoszenie → natychmiastowe powiadomienie Tech Lead
2. Assignee: developer (backend/frontend)
3. Fix w 24h (lub workaround + task fix)
4. PR + regression test
5. QA verification w CI + manual test
6. Deploy hotfix (jeśli production)

#### P2 - High (SLA: fix w 3 dni)
**Definicja**:
- Błąd funkcjonalny wysokiego wpływu (nie działa feature)
- Złe limity (200 kart/zestaw nie działa)
- Error handling niepoprawny (błędny komunikat, brak recovery)
- A11y critical (keyboard navigation broken)

**Przykłady**:
- Batch save kart zawsze zwraca 422 (nawet dla 10 kart)
- Progress Modal nie zamyka się po completion
- Undo nie działa

**Workflow**:
1. Zgłoszenie → triage (QA + Tech Lead) w 24h
2. Assignee: developer
3. Fix w 3 dni robocze
4. PR + regression test
5. QA verification
6. Merge do main

#### P3 - Medium (SLA: fix w tygodniu lub next sprint)
**Definicja**:
- Usterki UI/UX (minor)
- Edge cases (rzadkie scenariusze)
- Performance minor (page load 3-4s zamiast <2s)
- A11y warnings (nie critical)

**Przykłady**:
- Toast error message niejasny (400 vs 422)
- Responsywność: button overflow na mobile 360px
- Kontrast nieznacznie poniżej WCAG AA (3.8:1 zamiast 4.5:1)

**Workflow**:
1. Zgłoszenie → triage w 3 dni
2. Backlog lub current sprint (decyzja PO)
3. Fix w ramach sprintu lub next
4. PR (test opcjonalny jeśli trivial)
5. QA verification

#### P4 - Low (SLA: backlog, fix gdy czas pozwala)
**Definicja**:
- Defekty kosmetyczne (typo, alignment)
- Nice-to-have improvements
- Dokumentacja (typos, outdated info)

**Przykłady**:
- Typo w error message: "Genration" → "Generation"
- Padding button 8px zamiast 10px (design mismatch minor)

**Workflow**:
1. Zgłoszenie → backlog
2. Fix w ramach innych tasks (jeśli convenient)
3. PR (bez dedykowanego testu)

### 10.4 Cykl życia buga

```
┌─────────────┐
│   OPEN      │ ← Zgłoszenie (GitHub Issue)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  TRIAGE     │ ← QA + Tech Lead: priorytet (P1-P4), assignee
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ IN PROGRESS │ ← Developer: fix + PR + regression test
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  IN REVIEW  │ ← Code review (peer + QA)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ VERIFICATION│ ← QA: manual test + CI validation
└──────┬──────┘
       │
       ├─ PASS ──▶ CLOSED ✅
       │
       └─ FAIL ──▶ IN PROGRESS (re-open)
```

### 10.5 Metryki i KPIs

**Tracked metrics** (weekly report):
- Bugs opened/closed (per priority)
- Mean time to fix (MTTF): P1 < 1d, P2 < 3d
- Regression rate: % bugów które wracają
- Test pass rate: % testów green w CI
- Coverage trend: unit/integration/E2E

**Alerts** (CI/CD):
- P1 bug opened → Slack notification
- Test pass rate < 95% → warning
- Coverage drop > 5% → block PR

## 11. Załączniki

### 11.1 Seed scripts (do implementacji)

#### `supabase/seed-test-users.sql`
```sql
-- 2 użytkowników testowych (A i B)
-- Hasło: TestPass123!
INSERT INTO auth.users (id, email, encrypted_password, ...)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test-a@example.com', ...),
  ('00000000-0000-0000-0000-000000000002', 'test-b@example.com', ...);

INSERT INTO profiles (id, email, display_name)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'test-a@example.com', 'Test User A'),
  ('00000000-0000-0000-0000-000000000002', 'test-b@example.com', 'Test User B');
```

#### `supabase/seed-limits.sql`
```sql
-- Zestaw z 199 kartami (test limit 200)
INSERT INTO sets (id, user_id, name, language)
VALUES ('set-199-cards', 'test-a-id', 'Limit Test Set', 'en');

INSERT INTO cards (set_id, front, back, user_id)
SELECT 'set-199-cards', 'Front ' || i, 'Back ' || i, 'test-a-id'
FROM generate_series(1, 199) i;

-- User z 999 kartami (test limit 1000)
-- (similar pattern, distributed across multiple sets)
```

#### `supabase/seed-fixtures.sql`
```sql
-- Podstawowe dane testowe: 2 zestawy, 20 kart per user
-- (kompletny przykład do basic tests)
```

### 11.2 Dane do generacji (fixtures)

Przygotować pliki tekstowe:
- `fixtures/generation-short.txt` (500 znaków, PL)
- `fixtures/generation-medium.txt` (5000 znaków, EN)
- `fixtures/generation-long.txt` (14000 znaków, ES)
- `fixtures/generation-invalid-short.txt` (50 znaków, <100 min)
- `fixtures/generation-invalid-long.txt` (20000 znaków, >15000 max)

### 11.3 Checklist Tydzień 0 (rozszerzony)

**Setup lokalny**:
- [ ] Node 20 LTS zainstalowany
- [ ] pnpm/npm działa
- [ ] Supabase CLI zainstalowany (`supabase --version`)
- [ ] `supabase start` działa (lokalny stack)
- [ ] Migracje załadowane (`supabase db reset`)
- [ ] Seed scripts działają (test users, limits, fixtures)

**Instalacja dependencies**:
- [ ] `pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom`
- [ ] `pnpm add -D @playwright/test @axe-core/playwright`
- [ ] `pnpm add -D msw`
- [ ] `pnpm add -D @vitest/coverage-v8`

**Konfiguracja**:
- [ ] `vitest.config.ts` utworzony i działa
- [ ] `playwright.config.ts` utworzony i działa
- [ ] `src/test/setup.ts` (Vitest setup file)
- [ ] `src/test/mocks/handlers.ts` (MSW handlers)
- [ ] `.env.test` z credentials (local Supabase)

**Weryfikacja**:
- [ ] `pnpm test` uruchamia się (0 testów OK)
- [ ] `pnpm test:e2e` uruchamia się
- [ ] `pnpm test:coverage` generuje raport

**CI/CD**:
- [ ] `.github/workflows/test.yml` utworzony
- [ ] Pipeline działa na PR (lint + typecheck minimum)

---

**Koniec planu testów**

**Autorzy**: QA Team  
**Wersja**: 1.0 (poprawiona)  
**Data**: 2025-01-14  
**Status**: Draft → Review → Approved


