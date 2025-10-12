<!-- Plik wygenerowany automatycznie: plan implementacji widoku /generate -->
# Plan implementacji widoku Generate (Paste → Review → Save)

## 1. Przegląd
Widok `Generate` umożliwia wklejenie długiego tekstu (10–15k znaków), inicjację asynchronicznej generacji 30 propozycji fiszek przez backend (AI), interaktywne przeglądanie propozycji w batchach po 10, akceptację/odrzucenie (swipe / przyciski), inline edycję i zapis zaakceptowanych fiszek do istniejącego lub nowego zestawu. Widok musi dostarczać jasny feedback o postępie generacji (polling `GET /api/generations/:id`), obsługiwać timeouty/retry, walidować limity pól oraz przygotować request do batchowego zapisu `POST /api/sets/:setId/cards/batch`.

## 2. Routing widoku
- Ścieżka: `/generate`
- Ochrona: PrivateRoute — wymaga zalogowanego użytkownika (Supabase Auth)

## 3. Struktura komponentów
- `GeneratePage` (page) — wrapper layoutowy, orchestration
  - `GenerationStepper` — krokowy UI (Paste → Review → Save)
  - `PasteTextarea` — textarea z licznikiem i opcją chunkowania
  - `StartGenerationButton` — uruchamia POST `/api/generations`
  - `ProgressModal` — polling statusu generacji, progress bar, retry
  - `CardGrid` — siatka propozycji (30) z wewnętrzną paginacją batchów po 10
    - `FlashCard` — pojedyncza karta, flippable (front/back), inline edit mode
  - `BulkActionsBar` — accept all / reject all / undo (max 5) / select batch
  - `SaveToSetDialog` — wybór lub utworzenie setu, walidacja limitów, wywołanie batch create
  - `GenerationHistoryLink` — do `/generations`

## 4. Szczegóły komponentów
### GeneratePage
- Opis: Strona najwyższego poziomu — integruje providery (GenerationProvider), zawiera `GenerationStepper` i zarządza przepływem kroków.
- Główne elementy: `GenerationStepper`, `PasteTextarea`, `CardGrid`, `ProgressModal`, `SaveToSetDialog`.
- Obsługiwane zdarzenia: onStartGeneration(command), onGenerationUpdate(dto), onAccept(cardId), onReject(cardId), onBulkAccept(), onBulkReject(), onSaveToSet(setId, selectedCards)
- Walidacja: zapewnia, że użytkownik jest zalogowany; blokuje double-submit; walidacja rozmiaru tekstu (100–15000 znaków) przed wysłaniem.
- Typy: `StartGenerationCommand`, `StartGenerationResponseDto`, `ProcessingGenerationDto`, `CompletedGenerationDto`
- Propsy: brak (page-level), używa hooków i contextu.

### PasteTextarea
- Opis: Kontrolowana textarea z licznikiem znaków i sugestią chunkowania; wykrywa język (opcjonalnie) i ustawia target_count.
- Elementy HTML: `<textarea>`, badge języka, counter, small hint pod textarea, chunk suggestion modal/link
- Zdarzenia: onChange(text), onValidate(valid:boolean, errors:Record)
- Walidacja: długość 100–15000; jeżeli >10000 pokazuje opcję split/chunk (informacyjnie) — frontend może wysłać pełny text; edge functions po stronie backendu wykonują chunking; ale frontend poinformuje użytkownika.
- Typy: `PasteFormViewModel { source_text: string; language?: 'pl'|'en'|'es'; target_count?: number }`
- Propsy: onSubmit(command)

### StartGenerationButton
- Opis: Inicjuje POST `/api/generations` i otwiera `ProgressModal` z pollingiem.
- Zdarzenia: onClick -> wywołanie API; obsługuje loading i błędy (429, 400)
- Walidacja: disable gdy textarea invalid lub request w toku; debounce/submission lock
- Typy: request: `StartGenerationCommand`, response: `StartGenerationResponseDto`
- Propsy: disabled:boolean, command: StartGenerationCommand

### ProgressModal
- Opis: Modal pokazujący postęp generacji; polluje `GET /api/generations/:id` co ~2s; obsługuje stany processing/completed/failed oraz retry.
- Elementy: progress bar (percentage), message text, spinner, retry button (visible on failed or timeout), cancel/close.
- Zdarzenia: onComplete(completedDto), onFailed(errorDto), onRetry(), onCancel()
- Walidacja: timeout frontendu (60s) z informacją; w przypadku 429 pokazuje rate-limit message i countdown.
- Typy: `ProcessingGenerationDto`, `CompletedGenerationDto`, error `ErrorResponseDto`
- Propsy: generationId, onComplete, onFailed

### CardGrid
- Opis: Rysuje 30 kart w formie paginacji batchów po 10; pozwala na swipe/keyboard oraz bulk actions.
- Elementy: grid/list, pager/tab bar for batches (1..3), each cell -> `FlashCard`.
- Zdarzenia: onAccept(cardIndex), onReject(cardIndex), onEdit(cardIndex, editedCard), onUndo(), onSelect(cardIndex, selected)
- Walidacja: after generation completed ensure deduplication (backend gwarantuje), front checks front/back length limits (200/500) when editing.
- Typy: `FlashCardProposal { id?: string; front: string; back: string; source_text_excerpt?: string; ai_confidence_score?: number; was_edited?: boolean }`
- Propsy: proposals: FlashCardProposal[], selectedIds:Set<string>, batchIndex:number, onAction callbacks

### FlashCard
- Opis: pojedynczy flippable card z widokiem preview i edycją inline; wspiera swipe (mobile) i buttons (desktop).
- Elementy: front side, back side, edit icon, save/cancel in edit mode, confidence badge, language badge.
- Zdarzenia: onFlip(), onEditStart(), onEditSave(edited), onEditCancel(), onAccept(), onReject()
- Walidacja: front max 200, back max 500 (live); show char counters and error hints
- Typy: uses `FlashCardProposal` + local `EditViewModel { front:string; back:string; valid:boolean; errors?:Record }`
- Propsy: proposal, index, disabled, onAccept, onReject, onEditSave

### BulkActionsBar
- Opis: kontrolki globalne do batch operations: Accept all / Reject all / Undo (max 5) / Select all in batch
- Elementy: buttons, undo counter, confirmation modal for bulk actions
- Zdarzenia: onAcceptAll(), onRejectAll(), onUndo(), onSelectAllInBatch()
- Walidacja: confirm modal for Accept all / Reject all
- Typy: none new; uses proposals state
- Propsy: batchIndex, canUndo, on* callbacks

### SaveToSetDialog
- Opis: modal do wyboru istniejącego zestawu lub utworzenia nowego; waliduje limity (200/set, 1000/account) i wysyła `POST /api/sets/:setId/cards/batch`.
- Elementy: search input, sets list (paginated), create new set form (name + language), submit button, summary of selected cards count
- Zdarzenia: onCreateSet(command), onSelectSet(setId), onSubmit(selectedCards)
- Walidacja: check target set available slots >= selectedCount; check account available slots >= selectedCount; char limits front/back; each card validated against BatchCreateCardItemSchema (front/back length)
- Typy: `BatchCreateCardsCommand`, `BatchCreateCardItemCommand` (see `src/types.ts`)
- Propsy: selectedCards: FlashCardProposal[], onSaveSuccess

## 5. Typy (DTO i ViewModel)
- StartGenerationCommand (z `src/types.ts`): { source_text: string; language?: string; target_count?: number }
- StartGenerationResponseDto (z `src/types.ts`)
- ProcessingGenerationDto / CompletedGenerationDto (z `src/types.ts`)
- FlashCardProposal (ViewModel):
  - id?: string | null
  - front: string
  - back: string
  - source_text_excerpt?: string
  - ai_confidence_score?: number
  - was_edited?: boolean
  - normalized_front?: string (frontend can compute for quick duplicate heuristics)
- GenerationViewModel:
  - generationId: string
  - status: 'processing'|'completed'|'failed'
  - proposals: FlashCardProposal[]
  - selected: Set<string>
  - edits: Record<string, { front:string; back:string }>
  - undoStack: Array<{ action:'accept'|'reject'|'edit', card:FlashCardProposal }>
- PasteFormViewModel: { source_text:string; language?: 'pl'|'en'|'es'; target_count:number }

## 6. Zarządzanie stanem i hooki
- GenerationProvider / useGeneration hook — centralny store dla flow generacji:
  - Przechowuje generationId, proposals, selectedIds, edits, currentBatch, undoStack
  - API: startGeneration(command), pollStatus(), accept(cardId), reject(cardId), toggleSelect(cardId), edit(cardId, data), acceptAllBatch(), rejectAllBatch(), undo()
  - Persistencja: localStorage TTL 24h (na wypadek odświeżenia) — serialized minimal state (generationId, proposals ids, selectedIds, undoStack)
- usePasteForm hook — walidacja tekstu, char count, chunk suggestion
- useProgressPolling(generationId, onUpdate, options) — polling GET `/api/generations/:id` co 2s z timeout 60s i exponential backoff dla retry
- useBatchSave hook — przygotowuje `BatchCreateCardsCommand`, waliduje limity przez wywołanie preflight (opcjonalne) lub lokalnymi obliczeniami; wykonuje POST `/api/sets/:setId/cards/batch` i obsługuje partial success / conflicts

## 7. Wywołania API i akcje frontendowe
- POST /api/generations — startGeneration (body: StartGenerationCommand) -> 202 + StartGenerationResponseDto
  - Frontend: show ProgressModal, start polling
- GET /api/generations/:id — polling status -> Processing or Completed DTO
  - Frontend: update proposals when completed
- POST /api/generations/:id/retry — retry failed generation (ProgressModal exposes this)
- GET /api/sets — lista setów do SaveToSetDialog
- POST /api/sets — create new set (SaveToSetDialog)
- POST /api/sets/:setId/cards/batch — batch create accepted cards
  - Body: BatchCreateCardsCommand (see `src/types.ts`)
  - Response: BatchCreateCardsResponseDto

## 8. Mapowanie user stories na implementację
- US-003/US-004: `PasteTextarea` + `StartGenerationButton` + `ProgressModal` (validation, chunk suggestion, polling, retry)
- US-005: `ProgressModal` → `CardGrid` (wyświetlenie 30 unikatowych propozycji), walidacja limitów długości
- US-006/US-007/US-008/US-009/US-010: `CardGrid`, `FlashCard`, `BulkActionsBar`, undoStack w `GenerationProvider`, inline edit modal w `FlashCard`
- US-011/US-012: `SaveToSetDialog` → GET /api/sets, POST /api/sets (create), POST batch create
- US-022: `ProgressModal` retries i wyświetlanie komunikatów po wyczerpaniu prób

## 9. Interakcje użytkownika i oczekiwane wyniki
- Wklejenie tekstu: live counter; jeśli invalid -> disable Generate
- Klik Generate: request -> ProgressModal; user sees progress; po completed modal zamyka się i ujawnia `CardGrid`
- Przegląd batchów: nawigacja pomiędzy batchami, stany accept/reject zachowywane
- Swipe (mobile): w prawo = accept, w lewo = reject; desktop buttons do tych akcji
- Undo: cofnij ostatnie 5 akcji (odwrócenie stanu per card)
- Inline edit: edycja front/back, live char counter, save zapisuje lokalnie (was_edited flag), update proposals state
- Save: otwórz `SaveToSetDialog`, wybierz set lub utwórz nowy; frontend waliduje limity przed wysłaniem; po sukcesie pokaż celebrację i CTA Start session

## 10. Warunki API i weryfikacja w komponencie
- StartGeneration: verify request body corresponds to `StartGenerationCommand` (frontend z Zod lub minimalna walidacja) — source_text length 100–15000, target_count 1–30
- Polling: handle responses `processing`/`completed`/`failed`. On `completed` expect `cards` array length <=30; frontend assumes uniqueness ale nadal może deduplikować po `normalized_front` przy wyświetlaniu
- Batch create: validate each card front (1..200) and back (1..500) before POST; check requestedCount <= available slots (200 - set.cards_count and 1000 - profile.cards_count) — if preflight not available, handle 422 from API and present details to user

## 11. Scenariusze błędów i obsługa
- 400 Bad Request (walidacja) — pokaż error banner z detailami (z `ErrorResponseDto.details`)
- 401 Unauthorized — redirect do `/login` z zachowaniem local draft
- 429 Rate limit — specjalny modal z countdown; disable form until retry
- 500 Internal Error — toast + retry option
- Generation timed out/failed — ProgressModal shows message, `Retry` uruchamia POST `/api/generations/:id/retry` lub pozwala na ponowny POST z tym samym tekstem
- Batch create conflicts (409) lub 422 limit exceeded — prezentacja partial success: tabelka created vs conflicts; umożliwić userowi resolve (skip/conflict edit)

## 12. Potencjalne wyzwania i rekomendacje
- Latency: długi czas generacji → UX: progress messages, optimistic UI, nie blokować całej strony
- Duplikaty: backend deduplikuje, frontend powinien wykonać heurystyczne porównanie (lowercase + trim) i oznaczyć podejrzane
- Undo: implementować bounded stack (max 5) w providerze, serializowany do session storage, nie do backendu
- Limit checks race conditions: rekomendowane polecenie preflight endpointu przed batch POST w celu atomowego sprawdzenia slotów (opcjonalne). Bez preflight: walidacja lokalna + obsługa 422 z czytelnym komunikatem
- Accessibility: keyboard support dla akcji accept/reject, aria-live region dla progresu

---

<!-- Koniec pliku -->


