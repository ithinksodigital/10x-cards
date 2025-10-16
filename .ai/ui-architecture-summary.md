# UI Architecture Planning Summary - Flash Cards AI MVP

## Decisions

Na podstawie historii konwersacji użytkownik podjął następujące kluczowe decyzje dotyczące architektury UI:

1. **Struktura widoków**: Aplikacja będzie składać się z 6 głównych widoków: logowanie, dashboard (widok generowania fiszek), lista zestawów, lista fiszek z opcją edycji i usuwania, panel użytkownika, sesje powtórkowe (SRS).

2. **Entry point**: Po zalogowaniu użytkownik trafia bezpośrednio do widoku generowania fiszek z AI - jest to główny flow onboardingowy.

3. **Proces recenzji AI**: Użytkownik recenzuje propozycje fiszek wygenerowane przez AI (akceptuje, edytuje lub odrzuca) w jednym widoku.

4. **Zapisywanie fiszek**: Dostępne dwie opcje zapisu - "Zapisz wszystkie" (hurtowo) lub zapisanie tylko zatwierdzonych fiszek.

5. **Format odpowiedzi API**: AI zwraca listę propozycji fiszek, które użytkownik następnie recenzuje.

6. **Autoryzacja**: JWT zostanie wdrożone na późniejszym etapie (poza MVP); na początek tylko Supabase Auth z session management.

7. **Komponenty UI**: Wykorzystanie gotowych komponentów z Shadcn/ui.

8. **Zarządzanie stanem**: Początkowo React hooks i Context API; ewentualne dodanie Zustand w przyszłości.

9. **Obsługa błędów**: Błędy wyświetlane inline (nie jako osobne strony czy globalne alerty).

10. **Stylowanie**: Utility classes Tailwind z breakpointami (sm, md, lg).

11. **Nawigacja**: Navigation Menu z Shadcn/ui w formie topbara.

## Matched Recommendations

Najistotniejsze rekomendacje dopasowane do decyzji użytkownika:

1. **Unified multi-step flow dla generacji**: Widok generowania jako jeden unified view ze stepperem (Step 1: Paste, Step 2: Review, Step 3: Save to Set) zamiast osobnych podstron.

2. **Topbar nawigacja**: Logo | Generuj fiszki | Moje zestawy | Sesje powtórkowe | Daily progress indicator + User avatar menu (Panel użytkownika, Wyloguj).

3. **Format recenzji propozycji**: Cards grid/list z każdą kartą jako flippable component. Każda karta z checkbox (domyślnie zaznaczony), Edit button, Delete button. Bulk actions: "Select all" / "Deselect all".

4. **Dwa przyciski zapisu**: "Save selected (X)" (tylko zaznaczone) i "Save all (30)" (wszystkie karty) dla jasności intencji użytkownika.

5. **Context API struktura**: `<AuthProvider>` → `<DataProvider>` → `<GenerationProvider>` → `<SRSProvider>` z czystą separacją odpowiedzialności.

6. **Persistence flow generacji**: Custom hook `usePersistedState` z synchronizacją do localStorage (TTL 24h) dla odporności na zamknięcie przeglądarki.

7. **Flippable Card component**: Custom `<FlashCard>` built on Shadcn Card z CSS transforms, reusable z variants: 'preview' | 'edit' | 'review'.

8. **Inline error handling**: Błędy walidacji bezpośrednio pod polami, błędy API jako Alert w kontekście flow, rate limiting jako blocking modal.

9. **Smart routing**: Root URL przekierowuje do `/generate` jeśli brak zestawów, do `/sets` jeśli zestawy istnieją - adaptive entry point.

10. **Character counters**: Real-time counters "X/200", "Y/500" z color coding (default → warning → error) przy tworzeniu/edycji kart.

11. **SRS full-screen modal**: Dialog (Shadcn) z progress bar + counter (top), flippable card (center), rating buttons 1-5 (bottom), keyboard support.

12. **Optimistic updates**: Instant UI update → localStorage → API call → rollback on error. Użytkownik widzi immediate feedback.

13. **Responsive breakpoints**: sm (640px): 1 col, md (768px): 2 col cards + full topbar, lg (1024px): 3 col gdzie sensowne. Mobile hamburger menu < md.

14. **Progress during generation**: Progress modal z spinner, progress bar, dynamic message z API, polling co 2s, frontend timeout 60s.

15. **Lista zestawów jako cards grid**: Shadcn Cards z: name, language badge, cards count, last studied, progress indicator, actions menu.

16. **Protected routes**: `PrivateRoute` wrapper sprawdzający `supabase.auth.getSession()`, redirect do `/login` jeśli null.

17. **Explicit edit mode**: Click "Edit" → card flip na edit mode z textareas, Save/Cancel buttons. Nie inline editing by default - zapobiega przypadkowym zmianom.

18. **Celebration modal po zapisie**: Prominent modal "🎉 X cards added!" z CTA "Start learning now" / "Later" - momentum conversion opportunity.

19. **Empty states**: Illustrative z icon, heading, descriptive text, primary CTA button - wzór na best practices (Linear, Notion).

20. **Session persistence**: SRS sessions zapisywane do localStorage, możliwość pause i return. "Continue session" prompt przy powrocie w ciągu 24h.

## UI Architecture Planning Summary

### Główne wymagania architektury UI

#### Struktura aplikacji

Aplikacja MVP oparta na **Astro 5 + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui** z sześcioma głównymi widokami:

1. **Login** (`/login`) - Supabase OAuth z Google
2. **Generation Flow** (`/generate`) - Multi-step: Paste → Review → Save
3. **Sets List** (`/sets`) - Grid zestawów z actions
4. **Set Detail** (`/sets/:id`) - Tabs: Cards | Study | Settings
5. **SRS Session** (`/study`) - Full-screen review modal
6. **User Panel** (`/profile`) - Account, stats, history, actions

### Kluczowe widoki i przepływy

#### 1. Flow uwierzytelniania

- Dedykowana strona `/login` (nie modal) z "Sign in with Google" button
- Po sukcesie: smart routing → `/generate` (nowi) lub `/sets` (wracający użytkownicy)
- Session management przez Supabase Client, JWT implementation odłożone poza MVP
- Protected routes przez `PrivateRoute` wrapper z redirect logic

#### 2. Generation Flow (3-step unified view)

**Step 1: Paste Text**

- Textarea z character counter (10-15k limit)
- Optional language selector (default: auto-detect)
- Walidacja długości z propozycją chunkowania jeśli exceeded
- "Generate" button → API POST `/api/generations`

**Step 2: Review Proposals (kluczowy widok)**

- Cards grid (responsive: 1-3 cols zależnie od breakpoint)
- Każda karta: flippable `<FlashCard>` component (przód/tył)
- Controls per card: checkbox (default checked), Edit button, Delete button
- Bulk actions bar: "Select all" / "Deselect all" / "Delete selected"
- Edit mode: inline textareas z character counters (200/500), Save/Cancel
- Badge "Edited" dla zmodyfikowanych kart (tracking `was_edited`)
- Language badge i możliwość korekty języka batcha
- Back/Next navigation między stepami

**Step 3: Save to Set**

- Dropdown wyboru zestawu (z search) LUB inline form "Create new set"
- Validation preview: limity (200/set, 1000/account), duplikaty
- Dwa przyciski: "Save selected (X)" (primary) vs "Save all (30)" (secondary)
- API: POST `/api/sets/:setId/cards/batch`
- Po sukcesie: Celebration modal z CTA → "Start session" / "View set" / "Generate more"

**State management**:

- `GenerationProvider` (Context API) dla współdzielonego stanu między steps
- `usePersistedState` hook z localStorage sync (TTL 24h) dla recovery po refresh
- Tracking: selected cards, edits, current step, generation_id

**Progress handling**:

- Status 202 Accepted → polling GET `/api/generations/:id` co 2s
- Progress modal: spinner, progress bar (jeśli %), dynamic message z API
- Frontend timeout 60s z "Keep waiting" / "Cancel" options
- Exponential backoff retry dla network errors (GET only)

#### 3. Sets List View (`/sets`)

**Layout**:

- Cards grid (Shadcn Card components)
- Top bar: Search input + "+ New set" button
- Każda card: name (heading), language badge, cards count, "Last studied" timestamp, progress ring (new/review due), actions menu

**Actions menu**:

- Study (→ SRS session)
- View cards (→ Set detail)
- Rename (Dialog z form)
- Delete (Confirmation modal z typing set name dla bezpieczeństwa)

**Empty state**: Illustration + "No sets yet" + CTA "Generate cards"

**Responsywność**: Grid: 1 col (mobile), 2 cols (md), 3 cols (lg)

#### 4. Set Detail View (`/sets/:id`)

**Tabs structure**:

- **Cards tab**: Table (desktop) / Card list (mobile)
  - Kolumny: Front | Back | Status | Due date | Actions
  - Per-row actions: Edit (modal Dialog), Delete (confirmation)
  - Sorting: created_at, due_at
  - Filtering: status dropdown (new, learning, review, relearning)
  - Search: front/back text (debounced)
  - Pagination: 50 items (API limit)
- **Study tab**:
  - Summary: "X new, Y due today"
  - Daily limits indicators
  - "Start session" button → SRS flow dla tego zestawu
- **Settings tab**:
  - Rename set form
  - Language display (immutable)
  - Delete set (confirmation z consequences info)

**Edit card modal**: Dialog z form: front/back textareas, character counters, duplicate detection, Save/Cancel

#### 5. SRS Session View

**Entry point** (`/study`):

- Start screen z: Total summary (all sets), Daily limits progress bars
- Options: "Start mixed session" (all sets) OR lista zestawów z per-set "Study" buttons

**Review interface**:

- Full-screen Dialog (Shadcn) overlay
- Layout: Progress bar + counter (top) | Large flippable card (center) | Rating buttons 1-5 (bottom)
- Card flipping: Click/tap to flip, Space bar (desktop)
- Rating: Buttons z labels ("Again", "Hard", "Good", "Easy", "Perfect") + number keys 1-5
- Color coding: red → green gradient
- "X" button → Pause dialog: "Progress will be saved" → localStorage persistence (TTL 24h)

**Session logic**:

- API: POST `/api/srs/sessions` → otrzymanie kolejki kart
- Per-card: POST `/api/srs/reviews` z rating → otrzymanie next_review_at
- Optimistic local update counters (daily limits, progress)

**Session summary** (po zakończeniu):

- Full page / large modal: "Great work! 🎉"
- Stats: cards reviewed, avg rating, time spent
- Distribution chart: rating 1-5 jako bars
- CTA: "Study more" / "Back to sets"

#### 6. User Panel (`/profile`)

**Sections** (w Card components lub Tabs):

- **Account info**: Email, created date, Google avatar
- **Statistics**: Total cards, sets, study streak (future), acceptance rate
- **Generation history**: Table z past generations (status, count, acceptance metrics, timestamp)
- **Account actions**: Export data (GDPR), Delete account (confirmation flow)

**Top-right avatar menu** (globalna nawigacja):

- Click Avatar → DropdownMenu: Email display | Separator | "Panel użytkownika" | "Wyloguj"

### Strategia integracji z API

#### Context API Architecture

```
<AuthProvider>          // user, session, login/logout methods
  <DataProvider>        // cached sets, cards, refetch methods
    <GenerationProvider> // active generation flow state
      <SRSProvider>      // active SRS session state
        <App />
      </SRSProvider>
    </GenerationProvider>
  </DataProvider>
</AuthProvider>
```

**AuthProvider**:

- State: `user`, `session`, `loading`
- Methods: `signIn()`, `signOut()`, `getSession()`
- Effect: Subscribe do `supabase.auth.onAuthStateChange()`

**DataProvider**:

- State: Cached `sets[]`, `cards[]` per set
- Methods: `fetchSets()`, `fetchCards(setId)`, `invalidateCache(resource)`
- Pattern: Stale-while-revalidate
  - Sets list: cache 5 min
  - Cards list: cache 2 min
  - Due cards: no cache (real-time)

**GenerationProvider**:

- State: `currentStep`, `generationId`, `proposals[]`, `selectedCards`, `edits`, `sourceText`
- Persistence: `usePersistedState` → localStorage 'generation-flow' (24h TTL)
- Methods: `setStep()`, `toggleCard()`, `editCard()`, `saveToSet()`

**SRSProvider**:

- State: `sessionId`, `cards[]`, `currentIndex`, `dailyLimits`, `reviewedToday`
- Persistence: localStorage 'srs-session' (24h TTL)
- Methods: `startSession()`, `submitRating()`, `pauseSession()`, `resumeSession()`

#### Data Fetching Strategy

**Pattern**: Optimistic updates + cache invalidation

1. **Read operations**:
   - Check Context cache first
   - If stale/missing: API call → update cache
   - Retry logic: exponential backoff (1s, 2s, 4s) max 3× dla GET
   - Error handling: inline Alert w UI context

2. **Write operations**:
   - Optimistic: Update local state instantly
   - API call: POST/PATCH/DELETE
   - Success: Cache valid, show success toast
   - Error: Rollback local state, show error inline, offer manual retry
   - No retry dla mutations (risk: duplicate submissions)

3. **Polling** (generation status):
   - Interval: 2s
   - Timeout: 60s frontend-side
   - Exponential backoff on failures
   - Cancel on component unmount

#### API Error Handling (inline philosophy)

**Validation errors** (400):

- Display bezpośrednio pod polem formularza
- Character counters: color coding (default → warning → error)
- Real-time walidacja podczas typing
- Block submission gdy errors present

**API errors** (500, timeout):

- Context-aware Alert (Shadcn) w aktualnym flow
- Message z API + rekomendowana akcja
- "Try again" button dla manual retry
- Technical details w collapsible section

**Rate limiting** (429):

- Blocking Dialog modal (nie toast - hard limit)
- Message: "Rate limit reached. X/Y generations used. Try again in Z minutes."
- Countdown timer
- Disable form submission do reset

**Partial success**:

- Success toast z warning: "20 cards saved. 10 duplicates skipped."
- Expandable details z listą issues
- Log do generation metadata

**Network errors**:

- Inline Alert: "Connection lost. Please check your internet."
- Auto-retry dla reads (3×)
- Persist draft w localStorage jeśli możliwe

### Responsywność

#### Breakpoints strategy (Tailwind)

- **sm (640px)**: Stack to 1 col, compact cards, essential info only
- **md (768px)**: 2 col grids, full topbar navigation, expanded cards
- **lg (1024px)**: 3 col grids where appropriate, larger cards, keyboard hints visible

#### Topbar Navigation

**Desktop (≥ md)**:

- Horizontal NavigationMenu: Logo | Generuj fiszki | Moje zestawy | Sesje powtórkowe
- Right: Daily indicator + Avatar dropdown

**Mobile (< md)**:

- Hamburger (left) | Logo (center) | Avatar (right)
- Hamburger → Sheet (Shadcn) slide-in z full menu

#### Component adaptations

**FlashCard component**:

- Desktop: max-w-md, hover states, keyboard hints
- Mobile: full-width minus padding, larger tap targets, swipe gestures (future)

**SRS Review**:

- Desktop: card max-w-2xl, keyboard shortcuts visible, button labels full
- Mobile: card fills width, buttons icon+label, larger tap targets (min 44px)

**Tables → Cards on mobile**:

- Set detail Cards tab: Table (desktop) → Card list (mobile)
- Maintain same information, different presentation

### Dostępność

1. **Semantic HTML**: Proper heading hierarchy, landmark regions, form labels
2. **ARIA labels**: Explicit labels dla icon-only buttons, card content descriptions
3. **Keyboard navigation**:
   - Tab order logical
   - All actions keyboard-accessible
   - Shortcuts dla power users (documented w tooltips)
   - Escape closes modals
4. **Focus management**: Trap focus w modalach, return focus po zamknięciu
5. **Screen reader support**:
   - Live regions dla toast notifications
   - Status updates (progress, success, errors)
   - Card flips announced
6. **Color contrast**: WCAG AA minimum (sprawdzić Shadcn defaults)
7. **Motion preferences**: Respect `prefers-reduced-motion` dla animacji

### Bezpieczeństwo UI-side

1. **Protected Routes**:
   - `PrivateRoute` wrapper sprawdza session
   - Redirect do `/login` jeśli unauthorized
   - Token validation przez Supabase Client

2. **Token handling**:
   - Przechowywane przez Supabase Client (secure defaults)
   - NIGDY w localStorage jako plain text
   - HTTP-only cookies w produkcji (po JWT implementation)

3. **Session expiration**:
   - Detect 401 responses z API
   - Modal: "Session expired. Please log in again."
   - Post re-auth: best-effort restore state z localStorage

4. **Input sanitization**:
   - Zod schemas dla wszystkich form inputs
   - XSS protection przez React (default escaping)
   - Server-side validation zawsze (nie trust client)

5. **Rate limiting awareness**:
   - Display limits proactively (usage meters)
   - Block submission gdy known limit hit
   - Clear messaging o consequences

### Kluczowe komponenty Shadcn/ui

**Używane w projekcie**:

- **Layout**: NavigationMenu, Sheet (mobile menu), Tabs, Separator
- **Forms**: Input, Textarea, Checkbox, Select, Label, Button
- **Feedback**: Alert, Toast (via Sonner), Progress, Badge, Skeleton
- **Overlays**: Dialog, DropdownMenu, Tooltip, Popover
- **Display**: Card, Table, Avatar, ScrollArea
- **Custom**: FlashCard (based on Card z flip animation)

### Custom Components

1. **FlashCard**:
   - Props: `front`, `back`, `isFlipped`, `onFlip`, `variant`, `editable`
   - Variants: 'preview' | 'edit' | 'review'
   - Animation: CSS rotateY transform
   - Edit mode: Inline textareas z character counters

2. **GenerationStepper**:
   - Steps: Paste, Review, Save
   - Visual: horizontal (desktop), vertical (mobile)
   - States: completed, current, future

3. **DailyLimitsIndicator**:
   - Topbar widget
   - Shows: X new cards, Y reviews due
   - Progress rings dla daily limits
   - Tooltip with details

4. **CardGrid** / **CardList**:
   - Responsive grid/list dla cards
   - Props: `cards`, `onEdit`, `onDelete`, `onSelect`, `selectable`
   - Checkbox mode dla batch operations

## Unresolved Issues

Na podstawie konwersacji pozostają następujące obszary wymagające doprecyzowania lub dalszego rozwoju:

1. **Multi-tab synchronization**: Dla MVP brak sync między zakładkami. Przyjęto warning lub refresh-on-focus. Czy to akceptowalne, czy potrzebne advanced solution (Broadcast Channel API)?

2. **Swipe gestures na mobile**: Rekomendowane jako enhancement, ale nie określono czy MVP must-have czy post-MVP. Biblioteka: @use-gesture/react czy inna?

3. **Batch size dla review**: PRD mówi o batchach po 10 kart (3 batches z 30 total), ale w drugiej rundzie pytań zaproponowano grid/list wszystkich 30 na raz. Wyjaśnić preferred UX.

4. **Undo functionality**: PRD specyfikuje "undo ostatnich 5 akcji" w batch review, ale szczegóły implementacji UI (floating button, toast, stack visualization) nie są finalized.

5. **Duplicate detection UX**: Jak dokładnie prezentować potential duplicates użytkownikowi? Modal z side-by-side comparison? Inline warning w cards grid?

6. **Generation history pagination**: User Panel pokazuje generation history - czy jako infinite scroll, table z paginacją, czy limited "recent 10"?

7. **Language detection failures**: Co jeśli API nie wykryje języka lub wykryje błędnie? Czy user ma force override w Step 1, Step 2, czy obie?

8. **Cost display**: API zwraca `total_cost_usd` dla generacji. Czy pokazywać użytkownikowi? Gdzie? Jako cumulative "cost this month"?

9. **Wersjonowanie fiszek**: PRD wspomina version history, ale user story (#30) to opcjonalne. Czy implementować w MVP? Jeśli nie, jak obsłużyć edits (overwrite vs append-only)?

10. **Mobile app considerations**: PRD: web-only MVP, ale UX patterns (swipe, full-screen) sugerują mobile-first thinking. Czy projektować z myślą o future React Native port?

11. **Offline mode**: Decyzja: nie w MVP. Ale czy jakieś minimum (Service Worker dla cache assets, offline page)? Czy full online-only?

12. **Analytics instrumentation**: PRD określa event tracking (paste, generate, accept, reject, etc.). Gdzie w kodzie client-side? Custom hook `useAnalytics()`? Która biblioteka (PostHog, Umami)?

13. **Ilustracje dla empty states**: Czy custom illustrations, czy użycie biblioteki (np. unDraw, Storyset)? Brand consistency requirements?

14. **Accessibility audit**: Czy plan manual testing z screen reader (NVDA/JAWS), czy automated only (axe-core)? Kto odpowiada za a11y w zespole?

15. **First-session mandatory vs optional**: PRD mówi o propozycji pierwszej sesji po zapisie kart, ale nie określa czy to strong nudge czy true optional. UI design zależy od tego.

16. **Internationalization (i18n)**: Tech stack wspomina "zgodność języka treści" ale nie pełny UI i18n w MVP. Ale struktura kodu - czy przygotować na przyszłe i18n (extraction keys teraz) czy hard-coded strings OK?

17. **Error logging client-side**: Błędy API idą do `generation_error_logs` backend. Czy też client-side errors (React Error Boundary)? Jeśli tak, gdzie (Sentry, Supabase)?

18. **Performance monitoring**: Cel: P95 < 10s dla generacji. Czy user-facing performance feedback (np. "This is taking longer than usual...")? Real User Monitoring tool?
