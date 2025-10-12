# Przewodnik testowania - POST /api/generations

## Przygotowanie środowiska testowego

### 1. Uruchom projekt lokalnie

```bash
cd /Users/rafalpawelec/Development/10xdevs/10x-cards
npm run dev
```

Projekt powinien być dostępny pod adresem: `http://localhost:4321`

### 2. Przygotuj dane testowe

> **⚠️ MVP Version:** Endpoint używa hardcoded user ID, więc **nie potrzebujesz tokena autoryzacji**.  
> User ID: `00000000-0000-0000-0000-000000000001`

#### ~~Uzyskaj Supabase JWT Token~~ (Niepotrzebne w MVP)

~~Opcja A - Przez Supabase Dashboard~~  
~~Opcja B - Przez API (sign up/sign in)~~

**MVP:** Autoryzacja jest wyłączona - możesz od razu testować endpoint bez tokena!

#### Przykładowe teksty do testowania

**Tekst minimalny (100 znaków):**
```
To jest przykładowy tekst do testowania minimalnej długości wymaganej dla generacji fiszek AI - dokładnie sto znaków.
```

**Tekst optymalny (500-1000 znaków):**
```
Fotosynteza to podstawowy proces biologiczny zachodzący w roślinach zielonych, glonach i niektórych bakteriach. Polega na przekształcaniu energii świetlnej w energię chemiczną zmagazynowaną w cząsteczce glukozy. Proces ten składa się z dwóch głównych faz: reakcji świetlnych i ciemnych. W reakcjach świetlnych, zachodzących w tylakoidach chloroplastów, energia słoneczna jest wychwytywana przez chlorofil i wykorzystywana do produkcji ATP oraz NADPH. Jednocześnie następuje fotoliza wody, podczas której powstaje tlen jako produkt uboczny. Reakcje ciemne, znane jako cykl Calvina, nie wymagają bezpośredniego światła i zachodzą w stromie chloroplastu. W ich trakcie dwutlenek węgla z atmosfery jest przyłączany do związków organicznych, a następnie, przy użyciu energii z ATP i NADPH, redukowany do glukozy.
```

**Tekst długi (>5000 znaków):**
Użyj artykułu naukowego, rozdziału książki lub obszernego tekstu edukacyjnego.

## Scenariusze testowe

### Test 1: Poprawne żądanie - Happy Path

**Cel:** Sprawdzenie, czy endpoint poprawnie przetwarza prawidłowe żądanie.

```bash
# MVP - Bez Authorization header
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Fotosynteza to podstawowy proces biologiczny zachodzący w roślinach zielonych, glonach i niektórych bakteriach. Polega na przekształcaniu energii świetlnej w energię chemiczną zmagazynowaną w cząsteczce glukozy.",
    "language": "pl",
    "target_count": 10
  }'
```

**Oczekiwany wynik:**
- Status: `202 Accepted`
- Response zawiera: `id`, `user_id`, `model`, `source_text_hash`, `source_text_length`, `created_at`, `status: "processing"`, `estimated_duration_ms`

### ~~Test 2: Brak autoryzacji~~ (Pominięty w MVP)

**MVP:** Test pominięty - autoryzacja jest wyłączona.  
**Przyszłość:** Zostanie włączony gdy dodamy JWT auth.

### Test 3: Tekst zbyt krótki

**Cel:** Walidacja minimalnej długości tekstu.

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Za krótki tekst",
    "target_count": 10
  }'
```

**Oczekiwany wynik:**
- Status: `400 Bad Request`
- Response zawiera: `"error": "ValidationError"`, `"details": {"source_text": "Source text must be at least 100 characters"}`

### Test 4: Tekst zbyt długi

**Cel:** Walidacja maksymalnej długości tekstu.

```bash
# Wygeneruj tekst >15000 znaków i użyj go w żądaniu
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "'$(python3 -c "print('a' * 15001)")'"
  }'
```

**Oczekiwany wynik:**
- Status: `400 Bad Request`
- Response: błąd walidacji dla `source_text`

### Test 5: Nieprawidłowy kod języka

**Cel:** Walidacja formatu kodu języka.

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Prawidłowy tekst o odpowiedniej długości, który spełnia wszystkie wymagania dotyczące minimalnej liczby znaków.",
    "language": "polish",
    "target_count": 10
  }'
```

**Oczekiwany wynik:**
- Status: `400 Bad Request`
- Response: błąd walidacji dla `language` - musi być kod ISO 639-1 (2 litery)

### Test 6: Target count poza zakresem

**Cel:** Walidacja zakresu `target_count`.

```bash
# Zbyt duża wartość
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Prawidłowy tekst o odpowiedniej długości, który spełnia wszystkie wymagania dotyczące minimalnej liczby znaków.",
    "target_count": 100
  }'
```

**Oczekiwany wynik:**
- Status: `400 Bad Request`
- Response: błąd walidacji dla `target_count`

### Test 7: Rate Limiting

**Cel:** Sprawdzenie ograniczenia 10 generacji na godzinę.

```bash
# Wykonaj 11 żądań w szybkiej sekwencji
for i in {1..11}; do
  echo "Request $i"
  curl -X POST http://localhost:4321/api/generations \
    -H "Content-Type: application/json" \
    -d '{
      "source_text": "Test text number '"$i"' - Prawidłowy tekst o odpowiedniej długości, który spełnia wszystkie wymagania dotyczące minimalnej liczby znaków.",
      "target_count": 5
    }'
  echo -e "\n---\n"
done
```

**Oczekiwany wynik:**
- Pierwsze 10 żądań: `202 Accepted`
- 11. żądanie: `429 Too Many Requests`
- Response: `{"error": "TooManyRequests", "message": "Rate limit exceeded: Maximum 10 generations per hour..."}`

### Test 8: Nieprawidłowy JSON

**Cel:** Sprawdzenie obsługi błędów parsowania.

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d 'not valid json'
```

**Oczekiwany wynik:**
- Status: `400 Bad Request`
- Response: `{"error": "BadRequest", "message": "Invalid JSON in request body"}`

### Test 9: Minimalna konfiguracja (tylko wymagane pola)

**Cel:** Sprawdzenie, czy opcjonalne parametry działają z wartościami domyślnymi.

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "Prawidłowy tekst o odpowiedniej długości, który spełnia wszystkie wymagania dotyczące minimalnej liczby znaków potrzebnych do rozpoczęcia generacji fiszek."
  }'
```

**Oczekiwany wynik:**
- Status: `202 Accepted`
- Response z `target_count` ustawionym na domyślną wartość 30

## Weryfikacja w bazie danych

Po wykonaniu testów, sprawdź rekordy w bazie danych:

```sql
-- Sprawdź utworzone generacje
SELECT 
  id,
  user_id,
  source_text_length,
  source_text_hash,
  model,
  created_at,
  generated_count
FROM generations
ORDER BY created_at DESC
LIMIT 10;

-- Sprawdź rate limiting dla konkretnego użytkownika
SELECT 
  user_id,
  COUNT(*) as total_generations,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour
FROM generations
WHERE user_id = 'YOUR_USER_ID'
GROUP BY user_id;

-- Sprawdź unikalne hashe (deduplikacja)
SELECT 
  source_text_hash,
  COUNT(*) as count
FROM generations
GROUP BY source_text_hash
HAVING COUNT(*) > 1;
```

## Checklist testowania

- [ ] Test 1: Happy path działa poprawnie (202)
- [ ] ~~Test 2: Brak autoryzacji zwraca 401~~ (Pominięte w MVP)
- [ ] Test 3: Tekst <100 znaków zwraca błąd walidacji
- [ ] Test 4: Tekst >15000 znaków zwraca błąd walidacji
- [ ] Test 5: Nieprawidłowy kod języka zwraca błąd
- [ ] Test 6: Target count poza zakresem zwraca błąd
- [ ] Test 7: Rate limiting działa (11. request = 429)
- [ ] Test 8: Nieprawidłowy JSON zwraca 400
- [ ] Test 9: Minimalna konfiguracja działa
- [ ] Rekordy poprawnie zapisują się w bazie danych
- [ ] SHA-256 hash jest poprawnie generowany
- [ ] `estimated_duration_ms` jest wyliczany
- [ ] Timestamps są w formacie ISO 8601
- [ ] Response zawiera wszystkie wymagane pola

## Narzędzia pomocnicze

### Postman Collection

Możesz zaimportować gotową kolekcję Postman (TODO: utworzyć plik JSON).

### VS Code REST Client

Utwórz plik `test.http`:

```http
### Test 1: Poprawne żądanie
POST http://localhost:4321/api/generations
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "source_text": "Prawidłowy tekst...",
  "language": "pl",
  "target_count": 10
}

### Test 2: Brak autoryzacji
POST http://localhost:4321/api/generations
Content-Type: application/json

{
  "source_text": "Prawidłowy tekst..."
}
```

## Troubleshooting

### Problem: 500 Internal Server Error

**Możliwe przyczyny:**
- Błąd połączenia z bazą danych Supabase
- Nieprawidłowe zmienne środowiskowe (`SUPABASE_URL`, `SUPABASE_KEY`)
- Błąd w logice serwisu

**Rozwiązanie:**
1. Sprawdź logi serwera w terminalu
2. Zweryfikuj zmienne środowiskowe w `.env`
3. Sprawdź połączenie z Supabase

### Problem: 401 Unauthorized mimo poprawnego tokena

**Możliwe przyczyny:**
- Token wygasł
- Token należy do innego projektu Supabase
- Nieprawidłowa konfiguracja Supabase client

**Rozwiązanie:**
1. Wygeneruj nowy token (sign in ponownie)
2. Sprawdź `SUPABASE_URL` i `SUPABASE_KEY`
3. Zweryfikuj middleware w `src/middleware/index.ts`

### Problem: Rate limiting nie działa

**Rozwiązanie:**
1. Sprawdź czy rekordy są zapisywane w bazie
2. Zweryfikuj query w `checkRateLimit()` w GenerationService
3. Upewnij się, że `user_id` jest poprawny

## Następne kroki

Po pomyślnym przejściu wszystkich testów:

1. ✅ Endpoint działa poprawnie
2. 🔄 Implementuj Edge Function do rzeczywistej generacji AI
3. 🔄 Implementuj endpoint GET `/api/generations/{id}` do sprawdzania statusu
4. 🔄 Dodaj obsługę webhook/notification po zakończeniu generacji
5. 🔄 Implementuj endpoint do akceptacji/odrzucenia wygenerowanych kart

