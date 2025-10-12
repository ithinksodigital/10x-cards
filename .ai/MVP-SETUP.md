# MVP Setup Guide

## Problem: Hardcoded User ID dla MVP

Wszystkie endpointy używają hardcoded user ID dla MVP (bez autentykacji):
```
User ID: 00000000-0000-0000-0000-000000000001
```

## Rozwiązanie: Utworzenie MVP User Profile

### Opcja 1: SQL w Supabase Dashboard

1. Otwórz Supabase Dashboard
2. Przejdź do **SQL Editor**
3. Wykonaj poniższy SQL:

```sql
-- Create MVP test user profile
INSERT INTO profiles (id, cards_count, sets_count, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  0,
  0,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

### Opcja 2: Supabase CLI (Local)

Jeśli używasz lokalnego Supabase:

```bash
# Start Supabase locally
supabase start

# Run migration
supabase db execute --file /tmp/create_mvp_user.sql
```

### Opcja 3: Bezpośrednio przez API

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key!
)

await supabase
  .from('profiles')
  .insert({
    id: '00000000-0000-0000-0000-000000000001',
    cards_count: 0,
    sets_count: 0
  })
```

**UWAGA:** Potrzebujesz **service role key**, nie anon key!

---

## Weryfikacja

Po utworzeniu profilu, przetestuj endpoint:

```bash
# Test 1: Create set
curl -X POST http://localhost:3001/api/sets \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Set", "language": "pl"}'

# Test 2: Create card  
curl -X POST http://localhost:3001/api/sets/SET_ID/cards \
  -H "Content-Type: application/json" \
  -d '{"front": "Cześć", "back": "Hello"}'
```

---

## Dlaczego to jest potrzebne?

CardService sprawdza limity użytkownika przez:
1. Pobranie profilu z tabeli `profiles`
2. Sprawdzenie `cards_count` (max 1000)
3. Sprawdzenie `sets_count` jeśli dotyczy

Bez istniejącego profilu, te operacje się nie powiodą.

---

## Przejście do Produkcji

Przed wdrożeniem na produkcję:

1. **Usuń wszystkie hardcoded user ID:**
   - Zamień `getMvpUserId()` na `getAuthenticatedUserId()`
   - Usuń funkcję `getMvpUserId()` z `api-utils.ts`

2. **Włącz prawdziwą autentykację:**
   - Zaimplementuj Supabase Auth w frontendzie
   - Pobieraj JWT token po zalogowaniu
   - Przekazuj token w header `Authorization: Bearer TOKEN`

3. **Usuń MVP user z bazy:**
   ```sql
   DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
   ```

---

## Tymczasowe Rozwiązanie (Jeśli nie możesz dodać profilu)

Możesz zmodyfikować `CardService` żeby nie wymagał profilu:

```typescript
// W src/lib/services/card.service.ts
// Zamień:
const { data: profile, error: profileError } = await this.supabase
  .from('profiles')
  .select('cards_count')
  .eq('id', userId)
  .single();

if (profileError || !profile) {
  throw new Error('Failed to fetch user profile');
}

// Na (dla MVP):
const { data: profile } = await this.supabase
  .from('profiles')
  .select('cards_count')
  .eq('id', userId)
  .single();

// MVP: Jeśli profile nie istnieje, zakładamy 0 kart
const currentCardsCount = profile?.cards_count || 0;
```

**Ale to nie jest zalecane** - lepiej utworzyć profile.

---

## Status

- ✅ Wszystkie endpointy zaktualizowane do używania `getMvpUserId()`
- ✅ Endpointy Sets działają poprawnie
- ⚠️ Endpointy Cards wymagają profilu użytkownika
- ⏳ Trzeba utworzyć MVP user profile w bazie

---

## Następne Kroki

1. Utwórz MVP user profile w Supabase (jedna z 3 opcji powyżej)
2. Przetestuj wszystkie endpointy
3. Zweryfikuj limity działają (200/set, 1000/user)
4. Przed produkcją: Przełącz na prawdziwą autentykację

