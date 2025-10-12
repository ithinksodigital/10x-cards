# Architektura UI dla Flash Cards AI

## 1. Przegląd struktury UI

Aplikacja jest zorganizowana jako SPA‑like doświadczenie zbudowane na Astro + React. Główne warstwy to: uwierzytelnienie (`AuthProvider`), cache i dane (`DataProvider`), proces generacji (`GenerationProvider`) i sesje powtórkowe (`SRSProvider`). Flow onboardingowy koncentruje się na generowaniu fiszek (wklej → przegląd → zapis), a reszta aplikacji umożliwia zarządzanie zestawami, ręczne tworzenie/edycję fiszek oraz sesje SRS.

Kluczowe założenia:
- Responsywność: mobile-first z breakpoints Tailwind (sm, md, lg).
- Dostępność: semantic HTML, ARIA, keyboard support, focus management, kontrast kolorów.
- Bezpieczeństwo: chronione trasy, walidacja po stronie serwera, RLS w backendzie; klient używa Supabase Auth.
- UX: optymistyczne aktualizacje, localStorage recovery (TTL 24h), jasne stany błędów i progres.

## 2. Lista widoków

- **Login**
  - Ścieżka: `/login`
  - Główny cel: umożliwić logowanie przez Google i stworzyć sesję użytkownika.
  - Kluczowe informacje: przycisk "Sign in with Google", informacje o prywatności i CTA do rozpoczęcia.
  - Kluczowe komponenty: `AuthButton`, `AuthProvider` hook, `ErrorBanner`.
  - UX/Dostępność/Security: fokus na przycisku, aria-label, redirect po udanym loginie; ochrona przed CSRF przez Supabase SDK.

- **Generation Flow (Paste → Review → Save)**
  - Ścieżka: `/generate`
  - Główny cel: umożliwić wklejenie długiego tekstu, wygenerowanie 30 propozycji fiszek, przegląd i zapis do zestawu.
  - Kluczowe informacje: textarea z licznikiem znaków (10–15k), opcja detekcji języka/selector, status generacji (202 Accepted), progress bar, lista propozycji (30), batchy po 10, przyciski bulk, wybór/utworzenie zestawu docelowego.
  - Kluczowe komponenty: `GenerationStepper`, `PasteTextarea` (z validation), `ProgressModal` (polling GET `/api/generations/:id`), `CardGrid` / `FlashCard` (flippable), `BulkActionsBar`, `SaveToSetDialog`.
  - UX/Dostępność/Security: aria-live dla progresu, real‑time walidacja, keyboard navigation, ochrona przed double submit, rate‑limit modal (429), lokalne TTL recovery.

- **Sets List**
  - Ścieżka: `/sets`
  - Główny cel: przegląd wszystkich zestawów użytkownika, szybki dostęp do akcji (view, study, rename, delete).
  - Kluczowe informacje: nazwa zestawu, language badge, licznik kart, last studied, progress ring, search input, pagination (50), +New set.
  - Kluczowe komponenty: `SetsGrid`, `SetCard`, `SearchInput`, `Pagination`, `NewSetDialog`.
  - UX/Dostępność/Security: aria labels dla listy, keyboard access do kart, potwierdzenia przy usuwaniu (typed confirmation), RLS backend enforcement.

- **Set Detail (Tabs: Cards | Study | Settings)**
  - Ścieżka: `/sets/:id`
  - Główny cel: zarządzanie kartami w zestawie, uruchomienie sesji SRS dla zestawu, ustawienia zestawu.
  - Kluczowe informacje: lista kart (paginated 50), filtry statusów (new/learning/review/relearning), ilość kart, daily limits, przycisk Start Session.
  - Kluczowe komponenty: `Tabs`, `CardsTable` (desktop) / `CardsList` (mobile), `CardEditModal`, `DeleteConfirm`, `StartSessionButton`.
  - UX/Dostępność/Security: inline errors przy edycji, duplicate detection warning (409), wersjonowanie zmian (backend) informowane w UI.

- **Card Create / Edit (Modal/Dialog)**
  - Ścieżka: modal z `/sets/:id` lub standalone w `/sets/:id/cards/new`
  - Główny cel: ręczne dodawanie i edycja fiszek z walidacją i licznikami znaków.
  - Kluczowe informacje: front/back textarea z licznikiem (200/500), language (inherited), duplicate warning, Save/Cancel.
  - Kluczowe komponenty: `CardForm`, `CharacterCounter`, `DuplicateWarning`.
  - UX/Dostępność/Security: focus trap, aria-invalid dla błędów, walidacja po stronie klienta i serwera.

- **SRS Session (Study)**
  - Ścieżka: `/study` (parametry: `?setId=` opcjonalnie)
  - Główny cel: interaktywny tryb powtórek z pojedynczymi kartami, rating 1–5 i aktualizacją harmonogramu.
  - Kluczowe informacje: progress bar, current card (flippable), rating buttons (1–5), daily limits counters, pause/save state.
  - Kluczowe komponenty: `SRSModal` / `SRSFullscreen`, `RatingButtons`, `SessionSummary`, `PauseDialog`.
  - UX/Dostępność/Security: keyboard shortcuts (space flip, 1–5 rating), aria-live dla timerów/statusu, persistence in localStorage TTL 24h.

- **Generations History**
  - Ścieżka: `/generations`
  - Główny cel: lista sesji generacji (status, counts, accepted_count), możliwość retry failed generations.
  - Kluczowe informacje: id, status (processing/completed/failed), generated_count, accepted_count, timestamps, retry action.
  - Kluczowe komponenty: `GenerationsTable`, `GenerationRow`, `RetryButton`, `GenerationDetailsDialog`.
  - UX/Dostępność/Security: paginacja, error details collapsible, protected actions.

- **User Profile / Panel**
  - Ścieżka: `/profile`
  - Główny cel: informacje o koncie, export danych (GDPR), usuń konto, statystyki (acceptance rate).
  - Kluczowe informacje: email, avatar, created_at, total_cards, sets_count, generation metrics, export/delete actions.
  - Kluczowe komponenty: `ProfileCard`, `ExportDataButton`, `DeleteAccountDialog`.
  - UX/Dostępność/Security: confirmation flows, typed confirmation for delete, rate-limited export, session invalidation post-delete.

- **404 / Error / Empty states**
  - Ścieżka: global handling
  - Główny cel: informować o błędach i brakujących zasobach, oferować akcje naprawcze.
  - Kluczowe informacje: komunikat, CTA (wróć, generuj, utwórz nowy zestaw).
  - Kluczowe komponenty: `EmptyState`, `ErrorBanner`, `RetryButton`.
  - UX/Dostępność/Security: aria-live regiony dla błędów, opisowe komunikaty.

## 3. Mapa podróży użytkownika

Poniżej opis głównego flow onboardingowego (Paste → Generate → Review → Save → First Session):

1. Użytkownik nieautoryzowany trafia na `/login`. Po udanym logowaniu Supabase redirectuje do `/generate` (nowi użytkownicy) lub `/sets` (wracający).
2. Na `/generate` (Step 1) wkleja długi tekst do `PasteTextarea`. Licznik znaków waliduje długość; jeśli > limit, proponuje chunkowanie.
3. Użytkownik klika "Generate" → frontend wysyła POST `/api/generations` (202 Accepted) i pokazuje `ProgressModal`.
4. Frontend polluje GET `/api/generations/:id` co 2s (timeout frontendu 60s). `ProgressModal` aktualizuje % i wiadomość. W razie 429 pokazuje rate‑limit modal.
5. Po `completed` otrzymuje listę 30 unikatowych propozycji. System pokazuje je w `CardGrid` z batchami po 10 (nawigacja między batchami zachowuje stan).
6. Użytkownik przegląda karty: akceptuje/odrzuca (swipe lub buttons), edytuje inline (modal/flip), używa Undo (stack do 5 akcji sesji przeglądu).
7. Po zakończeniu przeglądu użytkownik przechodzi do kroku Save: wybiera istniejący zestaw lub tworzy nowy (`POST /api/sets`), UI waliduje limity (200/set, 1000/account) przed zapisaniem.
8. Save uruchamia `POST /api/sets/:setId/cards/batch` z wybranymi kartami. Backend zwraca wykaz stworzonych kart i szczegóły (created count, conflicts). UI pokazuje celebrację (modal) i CTA "Start session".
9. Jeśli użytkownik wybierze "Start session", frontend tworzy SRS session `POST /api/srs/sessions` i otwiera `SRSFullscreen`.
10. Sesja SRS: użytkownik ocenia karty (1–5), każda ocena wysyła `POST /api/srs/reviews`. Po zakończeniu UI pokazuje `SessionSummary`.

Dodatkowe ścieżki:
- Zarządzanie zestawami: `/sets` → `/sets/:id` → edycja/usunięcie karty.
- Historia generacji: `/generations` → podgląd szczegółów → retry (jeśli failed).
- Panel użytkownika: `/profile` → eksport/usunięcie konta.

## 4. Układ i struktura nawigacji

Globalny layout (`Layout.astro`) zawiera Topbar i (na mobile) Hamburger menu. Topbar (desktop) zawiera: Logo (lewa), Główne linki (Generuj, Moje zestawy, Sesje), wskaźnik daily limits (widget), Avatar dropdown (prawo).

- Topbar items:
  - Logo → `/` (smart redirect)
  - Generuj → `/generate`
  - Moje zestawy → `/sets`
  - Sesje → `/study`
  - Avatar dropdown → `/profile`, Logout

- Mobile:
  - Hamburger → Sheet z nawigacją i akcjami
  - Avatar → szybkie akcje

- Protected routes:
  - `PrivateRoute` (hook w `AuthProvider`) sprawdza session; jeśli brak, redirect do `/login`.

- Breadcrumbs i back-navigation na stronach typu `/sets/:id` i `/generate` dla lepszego kontekstu.

## 5. Kluczowe komponenty

- `AuthProvider` — zarządza sesją, udostępnia `user`, `session`, `signIn`, `signOut`.
- `DataProvider` — cache sets/cards, fetch/invalidate, SWR-like behavior.
- `GenerationProvider` — stan flow generacji: `generationId`, `proposals`, `selected`, `edits`, `currentStep`.
- `SRSProvider` — zarządza sesjami SRS, lokalnym postępem, pause/resume.
- `GenerationStepper` — krokowy UI dla `/generate`.
- `PasteTextarea` — textarea z licznikami, language selector i chunking suggestion.
- `ProgressModal` — polling status modal z progress bar i messages.
- `CardGrid` / `FlashCard` — flippable card z trybem `preview | edit | review`, accessibility for keyboard and screen readers.
- `BulkActionsBar` — select/deselect all, accept all/reject all, undo stack controls.
- `SaveToSetDialog` — wybór zestawu z search oraz inline create new set; enforces limits before submit.
- `CardsTable` / `CardsList` — paginated listing with filters and search.
- `SRSFullscreen` — full-screen modal for study with rating buttons and keyboard shortcuts.
- `GenerationRow` / `GenerationsTable` — history view.
- `ErrorBanner` / `EmptyState` — consistent error and empty states UI.


## Mapowanie wymagań PRD na elementy UI (wybrane przykłady)

- Generowanie 30 fiszek: `PasteTextarea` + `POST /api/generations` + `ProgressModal` + `CardGrid`.
- Batchy po 10: `CardGrid` z paginacją wewnątrz widoku Review.
- Undo ostatnich 5 akcji: `BulkActionsBar` implementuje stos akcji (max 5) przechowywany w `GenerationProvider`.
- Walidacja limitów (200/set, 1000/account): walidacja w `SaveToSetDialog` przed `POST /api/sets/:id/cards/batch`.
- Detection i zachowanie języka: language badge w `GenerationProvider` i `FlashCard`; server-side detection fallback.
- Retry i timeout: `ProgressModal` + retry logic (frontend triggers retry endpoint `/api/generations/:id/retry`).

## Przypadki brzegowe i stany błędów (wybrane)

- Timeout generacji: `ProgressModal` pokazuje komunikat, automatyczne retry (konfigurable), po max retry pokazuje opcję "Retry now" i zapisuje log w Generations History.
- Rate limit (429): blocking modal z countdown; disable form and show usage metrics.
- Duplikaty przy zapisie: backend zwraca 409/422; UI pokazuje partial success z listą konfliktów i actionable suggestions.
- Brak sieci podczas sesji: optimistic state persisted; user sees offline banner; reads auto-retry; mutations fail with rollback and user retry option.
- Session expiry (401): global interceptor shows modal "Session expired" and redirect to `/login` preserving local draft where possible.
- Undo stack overflow: limit 5, older actions dropped with visual hint.

## Zgodność z API

- Wszystkie główne działania UI mapują bezpośrednio na endpointy z planu API:
  - Generacja: `POST /api/generations` (+ `GET /api/generations/:id`, `POST /api/generations/:id/retry`)
  - Zarządzanie zestawami: `GET /api/sets`, `POST /api/sets`, `PATCH /api/sets/:id`, `DELETE /api/sets/:id`
  - Karty: `GET /api/sets/:setId/cards`, `POST /api/sets/:setId/cards`, `POST /api/sets/:setId/cards/batch`, `PATCH /api/cards/:id`, `DELETE /api/cards/:id`
  - SRS: `GET /api/srs/due`, `POST /api/srs/sessions`, `POST /api/srs/reviews`, session summary endpoint.
  - Generations history: `GET /api/generations`.

- UI wykonuje walidację przed wywołaniami API zgodnie z planem (np. długość tekstu, limity), a także obsługuje i prezentuje błędy API zgodnie ze standardowym formatem błędów z planu API.

## Mapowanie user stories do UI

(Poniżej przypisanie najważniejszych user stories do widoków/komponentów)
- US‑001 / US‑002: `Login` + `AuthProvider`
- US‑003 / US‑004 / US‑005 / US‑022: `Generation Flow` (PasteTextarea, ProgressModal, Polling, Retry)
- US‑006 / US‑007 / US‑008 / US‑009 / US‑010: `CardGrid` + `FlashCard` + `BulkActionsBar` + Undo stack + inline edit modal
- US‑011 / US‑012 / US‑013: `SaveToSetDialog` + `SetsList` + `NewSetDialog` + pagination
- US‑014 / US‑015 / US‑016 / US‑017: `Set Detail` + `CardsTable` + `CardForm` + versioning indicators
- US‑019 / US‑020 / US‑021: `SRSFullscreen` + `SRSProvider` + daily limits UI
- US‑023 / US‑024: Character counters + DuplicateWarning + server-side duplicate handling
- US‑025 / US‑026: `Profile` → export/delete account + logout
- US‑027 / US‑028: `EmptyState`, `ErrorBanner`, `SearchInput`

## Punkty bólu użytkownika i jak UI je rozwiązuje

- Długi czas generacji → feedback: progress modal, messages, polling, retry, and clear error states.
- Obawa przed duplikatami → duplicate detection warnings, preview of conflicts, option to skip duplicates.
- Utrata pracy przy odświeżeniu → localStorage persistence (TTL 24h) and optimistic updates.
- Przekroczenie limitów → proactive validation in Save step with clear user guidance and alternatives.
- Niepewność co do wyników AI → ability to edit inline, mark 'was_edited' and analytics visibility in generation history.
