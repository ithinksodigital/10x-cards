# MVP Changes: Wyłączenie autoryzacji

## Podsumowanie zmian

Dla ułatwienia testowania i rozwoju MVP, autoryzacja JWT została tymczasowo wyłączona. Endpoint używa hardcoded user ID.

## Zmiany w kodzie

### 1. `src/pages/api/generations.ts`

**Przed:**
```typescript
// 1. Authentication check
const {
  data: { user },
  error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
  const errorResponse: ErrorResponseDto = {
    error: "Unauthorized",
    message: "Missing or invalid authentication token",
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Po:**
```typescript
// 1. MVP: Use hardcoded user ID for testing
// TODO: Replace with proper JWT authentication
const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";
const userId = HARDCODED_USER_ID;
```

**Zmiany:**
- ❌ Usunięto sprawdzanie `supabase.auth.getUser()`
- ❌ Usunięto zwracanie 401 Unauthorized
- ✅ Dodano hardcoded user ID
- ✅ Dodano TODO komentarze dla przyszłej implementacji

### 2. Wywołanie GenerationService

**Przed:**
```typescript
const result = await generationService.startGeneration(command, user.id);
```

**Po:**
```typescript
const result = await generationService.startGeneration(command, userId);
```

## Zmiany w dokumentacji

### 1. `.ai/api-endpoint-generations.md`

**Dodane:**
- ⚠️ MVP Version disclaimer na początku
- Sekcja "Autoryzacja" oznaczona jako MVP/Przyszłość
- Usunięto `Authorization` header z przykładów
- Oznaczono 401 Unauthorized jako wyłączony
- Zaktualizowano sekcję "Bezpieczeństwo"

### 2. `.ai/testing-guide.md`

**Dodane:**
- MVP disclaimer w sekcji "Przygotuj dane testowe"
- Przekreślono sekcję o JWT token
- Usunięto Test 2 (autoryzacja) - oznaczony jako pominięty
- Usunięto `Authorization` header ze wszystkich curl przykładów
- Zaktualizowano checklist

### 3. `README.md`

**Dodane:**
- MVP disclaimer w Quick Start
- Oznaczono autoryzację JWT jako wyłączoną w funkcjach
- Usunięto `Authorization` header z przykładu

### 4. `.ai/quick-test.sh` (NOWY)

**Utworzony:**
- Szybki skrypt testowy z 5 scenariuszami
- Nie wymaga żadnej autoryzacji
- Czytelny output z kolorami i statusami
- Instrukcje użycia

## Hardcoded User ID

```typescript
const HARDCODED_USER_ID = "00000000-0000-0000-0000-000000000001";
```

**Uwagi:**
- Ten UUID musi istnieć w tabeli `profiles` w bazie danych
- RLS policies mogą wymagać dostosowania
- Wszystkie generacje będą przypisane do tego użytkownika

## Testowanie

### Przed (z auth):
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source_text": "..."}'
```

### Teraz (MVP):
```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{"source_text": "..."}'
```

### Quick test script:
```bash
.ai/quick-test.sh
```

## RLS Considerations

Obecna implementacja może wymagać tymczasowego wyłączenia lub dostosowania RLS policies na tabeli `generations`.

### Opcja 1: Wyłącz RLS tymczasowo (tylko dev!)

```sql
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
```

### Opcja 2: Dodaj policy dla hardcoded user

```sql
-- Pozwól na insert dla hardcoded user ID
CREATE POLICY "allow_mvp_user_insert" ON generations
  FOR INSERT
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

-- Pozwól na select dla hardcoded user ID  
CREATE POLICY "allow_mvp_user_select" ON generations
  FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000001');
```

### Opcja 3: Upewnij się, że user istnieje

```sql
-- Sprawdź czy user istnieje
SELECT * FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Jeśli nie, utwórz profil (jeśli masz trigger/policy wymuszające to)
INSERT INTO profiles (id, cards_count, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 0, NOW())
ON CONFLICT (id) DO NOTHING;
```

## TODO przed production

- [ ] Przywrócić sprawdzanie JWT auth
- [ ] Usunąć hardcoded user ID
- [ ] Zaktualizować dokumentację (usunąć MVP disclaimers)
- [ ] Włączyć testy autoryzacji
- [ ] Sprawdzić RLS policies
- [ ] Zaktualizować quick-test.sh do pracy z auth

## Korzyści MVP approach

✅ **Szybsze testowanie** - bez potrzeby generowania tokenów  
✅ **Prostsze debugging** - mniej warstw do debugowania  
✅ **Focus na logice biznesowej** - skupienie na generacji, nie auth  
✅ **Łatwiejsze demo** - możesz pokazać endpoint bez setupu auth  

## Ryzyka

⚠️ **Bezpieczeństwo** - NIE deployować na production w tym stanie  
⚠️ **RLS** - Może wymagać tymczasowego wyłączenia/dostosowania  
⚠️ **Rate limiting** - Wszystkie żądania będą od jednego "użytkownika"  
⚠️ **Testowanie** - Nie testujemy przepływu autoryzacji  

## Kiedy przywrócić auth?

Sugerowany timing:
1. ✅ Po przetestowaniu podstawowej funkcjonalności endpoint
2. ✅ Po zaimplementowaniu Edge Function
3. ✅ Po zweryfikowaniu end-to-end flow
4. ⏰ **Przed** deployem na staging/production
5. ⏰ **Przed** otwarciem dostępu dla prawdziwych użytkowników

---

**Status:** ✅ MVP Changes Applied  
**Data:** 2025-10-09  
**Następny krok:** Testowanie lokalne endpoint


