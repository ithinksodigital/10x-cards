# Troubleshooting Guide - POST /api/generations

## Błąd: 500 Internal Server Error

### Symptomy
```json
{
  "error": "InternalError",
  "message": "An unexpected error occurred while processing your request",
  "timestamp": "2025-10-09T21:18:30.298Z"
}
```

### Możliwe przyczyny i rozwiązania

#### 1. ❌ Brak konfiguracji Supabase (zmienne środowiskowe)

**Sprawdź:**
```bash
cat .env | grep SUPABASE
```

**Powinno zwrócić:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

**Rozwiązanie:**
1. Utwórz plik `.env` w root projektu
2. Dodaj zmienne:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```
3. Zrestartuj dev server: `npm run dev`

#### 2. ❌ RLS blokuje insert do bazy danych

**Błąd w logach:**
```
Database permission denied. Please check RLS policies for the generations table.
```

**Sprawdź RLS status:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('generations', 'cards', 'sets', 'profiles');
```

**Rozwiązanie A - Wyłącz RLS tymczasowo (TYLKO DEV!):**

Uruchom migrację MVP:
```bash
supabase db push --db-url "your-database-url"
```

Lub ręcznie w Supabase SQL Editor:
```sql
-- Wyłącz RLS na czas developmentu
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

**Rozwiązanie B - Utwórz policy dla MVP user:**
```sql
-- Najpierw włącz RLS jeśli wyłączony
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Dodaj policy dla hardcoded user
CREATE POLICY "mvp_user_all_access" ON generations
  FOR ALL
  USING (user_id = '00000000-0000-0000-0000-000000000001')
  WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');
```

#### 3. ❌ Hardcoded user nie istnieje w profiles

**Błąd w logach:**
```
User does not exist in profiles table. Please create the user first.
```

**Lub błąd foreign key constraint:**
```
ERROR: 23503: insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
DETAIL: Key (id)=(00000000-0000-0000-0000-000000000001) is not present in table "users".
```

**Problem:** Tabela `profiles` ma foreign key do `auth.users`, ale nasz MVP user nie istnieje w systemie auth.

**Rozwiązanie (MVP - usuń constraint):**
```sql
-- 1. Usuń foreign key constraint tymczasowo
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Utwórz MVP user
INSERT INTO profiles (id, cards_count, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Sprawdź czy user istnieje
SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
```

**UWAGA:** W production przywróć constraint:
```sql
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

#### 4. ❌ Błąd w middleware (brak supabase client)

**Sprawdź middleware:**
```bash
cat src/middleware/index.ts
```

**Powinno zawierać:**
```typescript
export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;
  return next();
});
```

#### 5. ❌ Brak połączenia z bazą danych

**Sprawdź:**
1. Czy Supabase projekt jest aktywny
2. Czy URL i Key są poprawne
3. Czy masz dostęp do internetu

**Test połączenia:**
```bash
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"
```

## Debugging - Szczegółowe logi

### Uruchom serwer z pełnymi logami:

```bash
DEBUG=* npm run dev
```

### Sprawdź logi w terminalu gdzie uruchomiony jest dev server

Szukaj błędów typu:
- `Failed to create generation record:`
- `Error checking rate limit:`
- Kody błędów PostgreSQL (np. `42501`, `23503`)

## Quick Fix - Pełny setup bazy danych

Uruchom ten SQL w Supabase SQL Editor:

```sql
-- 1. Usuń foreign key constraint z profiles (MVP only!)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Utwórz MVP user
INSERT INTO profiles (id, cards_count, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Wyłącz RLS (development only!)
ALTER TABLE generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs DISABLE ROW LEVEL SECURITY;

-- 4. Sprawdź czy wszystko działa
SELECT 
  tablename, 
  rowsecurity as rls_enabled 
FROM pg_tables 
WHERE schemaname = 'public';

SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Test po naprawie

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Lorem ipsum dolor sit amet... (min 100 znaków)",
    "language": "pl",
    "target_count": 10
  }'
```

**Oczekiwany wynik:** HTTP 202 z generation metadata

## Sprawdzenie w bazie danych

Po pomyślnym request, sprawdź:

```sql
SELECT 
  id,
  user_id,
  source_text_length,
  model,
  created_at
FROM generations
ORDER BY created_at DESC
LIMIT 1;
```

## Dalsze problemy?

Jeśli nadal masz błędy:

1. **Sprawdź pełne logi** w terminalu dev server
2. **Sprawdź logs w Supabase Dashboard** → Logs → API
3. **Prześlij błąd** z pełnymi logami do debugowania

## Kody błędów PostgreSQL

| Kod | Znaczenie | Rozwiązanie |
|-----|-----------|-------------|
| 42501 | Permission denied | Sprawdź RLS policies |
| 23503 | Foreign key violation | User nie istnieje w profiles |
| 23505 | Unique violation | Duplikat primary key |
| 42P01 | Table does not exist | Uruchom migracje |

## Checklist debugowania

- [ ] Zmienne środowiskowe są ustawione (.env)
- [ ] Dev server został zrestartowany po dodaniu .env
- [ ] Hardcoded user istnieje w profiles
- [ ] RLS jest wyłączony lub ma odpowiednie policies
- [ ] Tabela generations istnieje
- [ ] Supabase projekt jest aktywny
- [ ] Logi pokazują konkretny błąd

---

**Wskazówka:** Włącz szczegółowe logowanie w `generation.service.ts` - błędy są teraz logowane z pełnymi szczegółami!

