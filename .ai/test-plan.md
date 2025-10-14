### Plan testów dla projektu Flash Cards AI

#### 1. Wprowadzenie i cele testowania
- **Cel główny**: Zweryfikowanie jakości i niezawodności aplikacji Flash Cards AI (MVP) z naciskiem na krytyczne ścieżki użytkownika: generowanie fiszek (także anonimowo), zapis do zestawów, sesje SRS, oraz bezpieczeństwo danych użytkownika przez RLS.
- **Cele szczegółowe**:
  - Zapewnienie poprawności walidacji danych i obsługi błędów w API.
  - Weryfikacja ścieżek z opcjonalną autentykacją (anonimowy → zalogowany) i bramkowania stron przez `src/middleware/index.ts`.
  - Sprawdzenie zgodności z wymaganiami niefunkcjonalnymi (wydajność, odporność na błędy, UX komunikatów).
  - Potwierdzenie integralności danych i polityk RLS w Supabase.

#### 2. Zakres testów
- **Frontend (Astro 5 + React + TS)**:
  - Strony: `index.astro`, `generate.astro`, `dashboard.astro`, `auth/*`.
  - Komponenty: `src/components/auth/*`, `src/components/generation/*`, `src/components/ui/*`.
  - Hooki: `useGenerationApi`, `useSetsApi`, `useRetry`, `useDarkMode`.
- **Middleware**:
  - `src/middleware/index.ts` – publiczne vs chronione zasoby, wstrzykiwanie Supabase do `locals`.
- **API (`src/pages/api/*`)**:
  - Auth: `auth/login.ts`, `auth/logout.ts`, `auth/register.ts`.
  - Generacje: `generations.ts`, `generations/[id].ts`, retry endpoint (jeśli zaimplementowany).
  - Zestawy i karty: `sets.ts`, `sets/[id].ts`, `sets/[setId]/cards.ts`, `sets/[setId]/cards/batch.ts`.
  - Karty: `cards/[id].ts`.
  - SRS: `srs/sessions.ts`, `srs/sessions/[id]/summary.ts`, `srs/due.ts`, `srs/reviews.ts`.
- **Warstwa usług**:
  - `src/lib/services/*` – `generation.service.ts`, `openrouter.service.ts`, `set.service.ts`, `card.service.ts`, `srs.service.ts`.
- **Baza i RLS**:
  - Migracje w `supabase/migrations/*`, typy `src/db/database.types.ts`, klient `src/db/supabase.client.ts`.

Poza zakresem: wdrożenia produkcyjne, pełne testy dostępności i i18n (poza weryfikacją podstawowych tekstów i kontrastów).

#### 3. Typy testów do przeprowadzenia
- **Testy jednostkowe (FE/BE)**:
  - Usługi (`generation.service`, `openrouter.service`, `set.service`, `card.service`, `srs.service`).
  - Walidacje schematów (Zod) i mapowanie błędów (400/401/429/5xx).
  - Hooki (np. `useGenerationApi`, `useRetry`) – logika retry, mapowanie statusów.
- **Testy integracyjne (API + middleware + Supabase)**:
  - Endpoints `src/pages/api/*` z rzeczywistą walidacją, sesją Supabase (mockowana/stubowana w testach integracyjnych) i odpowiedziami usług.
  - Autoryzacja/middleware: dostęp do publicznych i chronionych tras.
- **Testy E2E (przeglądarka)**:
  - Kluczowe ścieżki użytkownika: generacja fiszek anonimowa i zalogowana, zapis do zestawów, sesje SRS, migracja po zalogowaniu.
- **Testy wydajnościowe**:
  - Start generacji (`POST /api/generations`) – czas odpowiedzi 202 i P95 dla przetwarzania (limitowane stubami OpenRouter).
  - Batch zapis kart, listowanie zestawów – wydajność i stabilność przy danych granicznych.
- **Testy bezpieczeństwa**:
  - RLS: izolacja danych między użytkownikami, próby nieautoryzowanego dostępu.
  - Nagłówki cookies (httpOnly, secure, sameSite), brak wycieków identyfikatorów w logach/UI.
- **Testy regresyjne i wizualne (opcjonalnie)**:
  - Krytyczne ekrany (`generate`, `dashboard`) pod kątem layoutu i responsywności.
- **Testy danych i limitów**:
  - Limity: 1k kart/użytkownik, 200 kart/zestaw; walidacje długości front/back (200/500).

#### 4. Scenariusze testowe dla kluczowych funkcjonalności
- **Autentykacja i middleware**
  - Dostęp anonimowy do `POST /api/generations` (powinien być dozwolony).
  - Próba wejścia na `/dashboard` bez sesji → redirect do `/auth/login`.
  - Logowanie/wylogowanie/rejestracja: poprawne i błędne dane, komunikaty dla użytkownika.
  - Ustawienie `locals.supabase` i `locals.user` w middleware dla zapytań SSR i API.
  - Migracja danych po zalogowaniu (jeśli komponent `MigrationModal`/flow dostępny): dane tymczasowe przenoszą się do profilu.
- **Generowanie fiszek**
  - `POST /api/generations`:
    - Poprawny request (różne języki, długości tekstu do 10–15k znaków).
    - Niepoprawny schema (braki, złe typy) → 400 z `details` per pole.
    - Brak `OPENROUTER_API_KEY` → kontrolowany błąd 5xx.
    - Odpowiedź 202 z `id`, `status`, `estimated_duration_ms`.
  - `GET /api/generations/:id`:
    - Statusy Processing/Completed/Failed, poprawne DTO.
    - Timeout i retry (frontowy `useProgressPolling`).
  - `POST /api/generations/:id/retry`:
    - Retry dostępny dla Failed, poprawne kody błędów dla stanów nieuprawnionych.
  - Front:
    - `GeneratePage`: wklejenie tekstu, walidacja, uruchomienie generacji, Progress Modal, odświeżanie wyników, obsługa błędów (401/429/5xx), toast.
    - `CardGrid`, `BulkActionsBar`, `undo`, edycja inline – operacje na propozycjach.
- **Zestawy i karty**
  - `GET /api/sets`, `POST /api/sets`:
    - Tworzenie nowego zestawu, duplikaty nazw, walidacja pola nazwy.
  - `POST /api/sets/:setId/cards/batch`:
    - Zapis zaakceptowanych kart, walidacje limitów (<=200 na zestaw), partial success (jeśli obsługiwane).
    - Próby zapisu bez autoryzacji → 401/403 (zgodnie z polityką).
  - `cards/[id].ts`:
    - Pobranie/aktualizacja/usuwanie istniejącej karty (w ramach RLS).
- **SRS**
  - `POST /api/srs/sessions` – start sesji, zawartość kolejki.
  - `GET /api/srs/due` – lista zaległych kart dla użytkownika.
  - `POST /api/srs/reviews` – zapis ocen (sprawdzenie metryk SRS, walidacji).
  - `GET /api/srs/sessions/[id]/summary` – podsumowanie po sesji.
- **RLS i bezpieczeństwo**
  - Użytkownik A nie widzi danych użytkownika B (zestawy, karty, sesje SRS).
  - Próby bez tokenu/sesji – brak dostępu do chronionych zasobów.
  - Cookies: `httpOnly`, `secure`, `sameSite=lax`; brak danych wrażliwych w `localStorage` po zalogowaniu.
- **UX i dostępność**
  - Responsywność kluczowych ekranów (mobile/desktop).
  - Kontrast, fokus, sterowanie klawiaturą (formularze logowania, generacji, zapisu).
  - Komunikaty błędów zgodne z przypadkami (401/429/400/5xx) – zrozumiałe i zlokalizowane.

#### 5. Środowisko testowe
- **Lokalne**:
  - Node 20 LTS, `pnpm`/`npm`.
  - Supabase lokalnie (Supabase CLI) lub zdalny projekt testowy; migracje z `supabase/migrations/*`.
  - Pliki `.env`/sekrety: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY` (w testach integracyjnych można stubować).
- **CI**:
  - Pipeline GitHub Actions: lint, typecheck, unit/integration, build, e2e (headless).
  - Baza testowa resetowana migracjami; dane seed (użytkownicy testowi, zestawy, karty).

#### 6. Narzędzia do testowania
- **Testy jednostkowe/integracyjne**: Vitest + ts-node/tsconfig-paths, React Testing Library dla hooków/komponentów.
- **E2E**: Playwright (zalecane dla Astro), alternatywnie Cypress.
- **Wydajność**: k6/Artillery do testów obciążeniowych API; Lighthouse dla kluczowych stron (FCP/LCP).
- **Bezpieczeństwo**: ZAP/Burp (skan aplikacji), testy RLS przez Supabase CLI + zapytania SQL/SDK.
- **Jakość**: ESLint, TypeScript (strict), Prettier, Husky (pre-commit) – zgodnie z istniejącą konfiguracją.
- **Mocki/stuby**: MSW do stubowania OpenRouter i Supabase w testach integracyjnych FE.

#### 7. Harmonogram testów
- Tydzień 1:
  - Przygotowanie środowiska testowego, seed danych, smoke tests.
  - Testy jednostkowe usług i walidacji schematów (Zod).
- Tydzień 2:
  - Testy integracyjne API (+middleware), scenariusze błędów i RLS (A/B użytkownik).
- Tydzień 3:
  - Testy E2E kluczowych ścieżek (anonimowa i zalogowana generacja, zapis do zestawów, SRS).
  - Testy wydajnościowe krytycznych endpointów (generacje, batch save).
- Tydzień 4:
  - Regresja, testy bezpieczeństwa, wizualne/regresja layoutu, stabilizacja i raport końcowy.

#### 8. Kryteria akceptacji testów
- **Funkcjonalne**:
  - 100% scenariuszy krytycznych E2E przechodzi (generacja, zapis, SRS, auth/middleware).
  - Testy integracyjne API ≥ 90% głównych przypadków (200/400/401/429/5xx).
  - Walidacje Zod zwracają 400 z `details` per pole.
- **Niefunkcjonalne**:
  - `POST /api/generations` zwraca 202 w ≤ 2s (stub), a pełna ścieżka generacji P95 ≤ 30s dla 10–15k znaków (w środowisku testowym z kontrolą czasu).
  - Batch zapis kart: ≤ 2s dla 30 kart (stub DB/IO), brak błędów przy limitach.
- **Bezpieczeństwo**:
  - RLS: brak możliwości odczytu/zmiany danych innego użytkownika.
  - Cookies i sesje skonfigurowane poprawnie; brak wrażliwych danych w UI/logach.

#### 9. Role i odpowiedzialności
- **QA Engineer**: plan, implementacja testów (unit/integration/E2E), raporty, monitorowanie regresji.
- **Backend Developer**: wsparcie kontraktów API, fixy RLS/migracji, observability.
- **Frontend Developer**: stabilność UI/UX, obsługa błędów, dostępność.
- **Tech Lead/PO**: priorytetyzacja i akceptacja kryteriów, decyzje risk-based.

#### 10. Procedury raportowania błędów
- **Kanał**: GitHub Issues z szablonem (opis, kroki, oczekiwany vs rzeczywisty wynik, zrzuty/logi).
- **Metadane**: wersja commit, środowisko (lokalne/CI), rodzaj testu (unit/integration/E2E/perf).
- **Priorytety (P1–P4)**:
  - P1: Blokery ścieżek krytycznych lub luki RLS.
  - P2: Błędy funkcjonalne wysokiego wpływu (np. złe limity zapisu).
  - P3: Usterki UI/UX, problemy edge-case.
  - P4: Drobne defekty kosmetyczne.
- **Cykl**: Zgłoszenie → triage (QA+Lead) → przypisanie → fix → PR z testem regresyjnym → weryfikacja QA → zamknięcie.

#### Załączniki (do przygotowania)
- Dane seed: 2 użytkowników testowych (A/B), po 2 zestawy, 50 kart, 1 sesja SRS.
- Zestaw danych do generacji (krótkie/średnie/długie teksty, różne języki).
- Konfiguracje MSW/k6 i skrypty uruchomieniowe (local/CI).


