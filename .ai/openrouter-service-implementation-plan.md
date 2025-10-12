# OpenRouter Service Implementation Plan

## 1. Opis usługi

Usługa OpenRouter jest kluczowym komponentem systemu generacji fiszek AI, odpowiedzialnym za komunikację z API OpenRouter.ai w celu generowania strukturalnych propozycji fiszek z długich tekstów. Usługa implementuje zaawansowane mechanizmy obsługi błędów, retry logic, chunkowanie tekstu oraz walidację odpowiedzi zgodnie z wymaganiami MVP.

### Główne funkcjonalności:
- Generacja 30 fiszek z tekstu źródłowego (10-15k znaków)
- Wykrywanie i utrzymanie języka wejściowego (PL/EN/ES)
- Chunkowanie dużych tekstów z deduplikacją
- Strukturalne odpowiedzi JSON z walidacją schematu
- Exponential backoff i retry logic
- Śledzenie kosztów i tokenów
- Rate limiting i quota management

## 2. Opis konstruktora

```typescript
constructor(
  private supabase: SupabaseClient,
  private config: OpenRouterConfig
)
```

### Parametry konstruktora:
- `supabase`: Instancja klienta Supabase do dostępu do bazy danych
- `config`: Konfiguracja usługi zawierająca:
  - `apiKey`: Klucz API OpenRouter (z Edge Function secrets)
  - `baseUrl`: URL endpoint OpenRouter API
  - `defaultModel`: Domyślny model (gpt-4o)
  - `maxRetries`: Maksymalna liczba ponownych prób (3)
  - `timeoutMs`: Timeout połączenia (30000ms)
  - `chunkSize`: Rozmiar chunka tekstu (10000 znaków)
  - `maxTokens`: Maksymalna liczba tokenów w odpowiedzi (4000)

## 3. Publiczne metody i pola

### Metody główne:

#### `generateFlashcards(command: GenerateFlashcardsCommand): Promise<GenerationResult>`
Główna metoda generacji fiszek z tekstu źródłowego.

**Parametry:**
```typescript
interface GenerateFlashcardsCommand {
  sourceText: string;
  language?: string; // ISO 639-1: pl, en, es
  targetCount?: number; // 1-30, domyślnie 30
  userId: string;
  generationId: string;
}
```

**Zwraca:**
```typescript
interface GenerationResult {
  success: boolean;
  cards: FlashCardProposal[];
  metadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalCost: number;
    processingTimeMs: number;
    language: string;
  };
  error?: GenerationError;
}
```

#### `detectLanguage(text: string): Promise<string>`
Wykrywa język tekstu źródłowego używając OpenRouter API.

#### `validateResponse(response: any, schema: JSONSchema): ValidationResult`
Waliduje odpowiedź API względem zdefiniowanego schematu JSON.

#### `calculateCost(promptTokens: number, completionTokens: number, model: string): number`
Oblicza koszt generacji na podstawie tokenów i modelu.

### Pola publiczne:

#### `readonly config: OpenRouterConfig`
Konfiguracja usługi (tylko do odczytu).

#### `readonly stats: ServiceStats`
Statystyki usługi (liczba wywołań, koszty, błędy).

## 4. Prywatne metody i pola

### Metody pomocnicze:

#### `private async makeApiRequest(request: OpenRouterRequest): Promise<OpenRouterResponse>`
Wykonuje żądanie HTTP do API OpenRouter z retry logic.

#### `private buildSystemPrompt(language: string): string`
Konstruuje komunikat systemowy w zależności od języka.

#### `private buildUserPrompt(sourceText: string, targetCount: number, language: string): string`
Konstruuje komunikat użytkownika z tekstem źródłowym.

#### `private chunkText(text: string): string[]`
Dzieli długi tekst na chunki o określonym rozmiarze.

#### `private deduplicateChunks(chunks: string[]): string[]`
Usuwa duplikaty między chunkami tekstu.

#### `private parseResponse(response: any): FlashCardProposal[]`
Parsuje odpowiedź API na strukturę fiszek.

#### `private handleApiError(error: any): GenerationError`
Obsługuje błędy API i mapuje je na struktury błędów aplikacji.

#### `private calculateRetryDelay(attempt: number): number`
Oblicza opóźnienie dla retry z exponential backoff.

### Pola prywatne:

#### `private readonly httpClient: HttpClient`
Klient HTTP do komunikacji z API.

#### `private readonly rateLimiter: RateLimiter`
Mechanizm rate limiting.

#### `private readonly cache: Map<string, any>`
Cache dla odpowiedzi API (opcjonalny).

## 5. Obsługa błędów

### Scenariusze błędów:

1. **Błędy sieciowe:**
   - Connection timeout
   - DNS resolution failure
   - Network unreachable

2. **Błędy API:**
   - 401 Unauthorized (nieprawidłowy klucz API)
   - 429 Too Many Requests (rate limit)
   - 402 Payment Required (quota exceeded)
   - 500 Internal Server Error

3. **Błędy odpowiedzi:**
   - Invalid JSON format
   - Schema validation failure
   - Empty or malformed response
   - Missing required fields

4. **Błędy biznesowe:**
   - Text too long (>15k znaków)
   - Language detection failure
   - Generation timeout (>10s/1k słów)
   - Invalid target count

5. **Błędy infrastruktury:**
   - Supabase Edge Function timeout
   - Database connection failure
   - Memory exhaustion

### Strategie obsługi:

#### Retry Logic:
```typescript
private async retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !this.isRetryableError(error)) {
        throw error;
      }
      
      const delay = this.calculateRetryDelay(attempt);
      await this.sleep(delay);
    }
  }
}
```

#### Error Mapping:
```typescript
private mapToGenerationError(error: any): GenerationError {
  if (error.code === 429) {
    return new RateLimitError('API rate limit exceeded', { retryAfter: error.retryAfter });
  }
  if (error.code === 402) {
    return new QuotaExceededError('API quota exceeded', { quota: error.quota });
  }
  if (error.name === 'TimeoutError') {
    return new TimeoutError('Request timeout', { timeout: this.config.timeoutMs });
  }
  return new UnknownError('Unexpected error occurred', { originalError: error });
}
```

## 6. Kwestie bezpieczeństwa

### Ochrona kluczy API:
- Klucze API przechowywane jako Supabase Edge Function secrets
- Nigdy nie eksponowane w kodzie klienckim
- Rotacja kluczy przez Supabase dashboard

### Rate Limiting:
- Maksymalnie 10 generacji na godzinę na użytkownika
- Circuit breaker pattern dla API failures
- Exponential backoff z jitter

### Walidacja danych:
- Sanityzacja tekstu wejściowego
- Walidacja rozmiaru (100-15,000 znaków)
- Sprawdzanie formatu języka (ISO 639-1)

### Logowanie i monitoring:
- Logowanie wszystkich wywołań API
- Śledzenie kosztów i tokenów
- Alerty przy przekroczeniu limitów

## 7. Plan wdrożenia krok po kroku

### Krok 1: Konfiguracja środowiska
```bash
# 1. Dodaj klucz API do Supabase Edge Function secrets
supabase secrets set OPENROUTER_API_KEY=your_api_key_here

# 2. Zaktualizuj konfigurację Supabase
# W supabase/config.toml dodaj:
[edge_runtime.secrets]
openrouter_api_key = "env(OPENROUTER_API_KEY)"
```

### Krok 2: Utworzenie struktury usługi
```typescript
// src/lib/services/openrouter.service.ts
export class OpenRouterService {
  // Implementacja zgodnie z planem
}
```

### Krok 3: Definicja typów i interfejsów
```typescript
// src/types.ts - dodaj nowe typy:
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  maxRetries: number;
  timeoutMs: number;
  chunkSize: number;
  maxTokens: number;
}

export interface FlashCardProposal {
  front: string;
  back: string;
  confidence: number;
  excerpt: string;
  language: string;
}
```

### Krok 4: Implementacja promptów systemowych
```typescript
private buildSystemPrompt(language: string): string {
  const languageMap = {
    'pl': 'Jesteś ekspertem w tworzeniu fiszek edukacyjnych w języku polskim.',
    'en': 'You are an expert in creating educational flashcards in English.',
    'es': 'Eres un experto en crear tarjetas educativas en español.'
  };
  
  return `${languageMap[language] || languageMap['en']}

Zasady tworzenia fiszek:
- Front: pytanie lub hasło (max 200 znaków)
- Back: odpowiedź lub definicja (max 500 znaków)
- Jakość: precyzyjne, zwięzłe, edukacyjne
- Język: konsekwentnie ${language.toUpperCase()}

Format odpowiedzi: JSON z tablicą "cards" zawierającą obiekty z polami: front, back, confidence, excerpt.`;
}
```

### Krok 5: Implementacja response_format
```typescript
private getResponseFormat(): any {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'flashcard_batch',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string', maxLength: 200 },
                back: { type: 'string', maxLength: 500 },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                excerpt: { type: 'string', maxLength: 500 }
              },
              required: ['front', 'back', 'confidence', 'excerpt']
            },
            minItems: 1,
            maxItems: 30
          }
        },
        required: ['cards']
      }
    }
  };
}
```

### Krok 6: Integracja z GenerationService
```typescript
// src/lib/services/generation.service.ts
export class GenerationService {
  private openRouterService: OpenRouterService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.openRouterService = new OpenRouterService(supabase, {
      apiKey: Deno.env.get('OPENROUTER_API_KEY')!,
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModel: 'gpt-4o',
      maxRetries: 3,
      timeoutMs: 30000,
      chunkSize: 10000,
      maxTokens: 4000
    });
  }

  async processGeneration(generationId: string): Promise<void> {
    // Implementacja przetwarzania generacji
    const result = await this.openRouterService.generateFlashcards(command);
    // Aktualizacja statusu w bazie danych
  }
}
```

### Krok 7: Utworzenie Supabase Edge Function
```typescript
// supabase/functions/process-generation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { generationId } = await req.json();
  
  // Implementacja Edge Function
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const generationService = new GenerationService(supabase);
  await generationService.processGeneration(generationId);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Krok 8: Testy jednostkowe
```typescript
// src/lib/services/__tests__/openrouter.service.test.ts
describe('OpenRouterService', () => {
  it('should generate flashcards from source text', async () => {
    const service = new OpenRouterService(mockSupabase, mockConfig);
    const result = await service.generateFlashcards({
      sourceText: 'Test text',
      language: 'pl',
      targetCount: 5,
      userId: 'user-1',
      generationId: 'gen-1'
    });
    
    expect(result.success).toBe(true);
    expect(result.cards).toHaveLength(5);
  });
});
```

### Krok 9: Monitoring i alerty
```typescript
// Dodaj do usługi:
private async logGenerationMetrics(result: GenerationResult): Promise<void> {
  await this.supabase
    .from('generation_metrics')
    .insert({
      generation_id: result.generationId,
      model: result.metadata.model,
      prompt_tokens: result.metadata.promptTokens,
      completion_tokens: result.metadata.completionTokens,
      total_cost: result.metadata.totalCost,
      processing_time_ms: result.metadata.processingTimeMs,
      success: result.success
    });
}
```

### Krok 10: Dokumentacja i deployment
1. Utwórz dokumentację API w README.md
2. Skonfiguruj CI/CD pipeline w GitHub Actions
3. Wdróż Edge Functions do Supabase
4. Skonfiguruj monitoring i alerty
5. Przeprowadź testy integracyjne

### Weryfikacja wdrożenia:
- [ ] Klucz API skonfigurowany w Supabase secrets
- [ ] Edge Function wdrożona i działająca
- [ ] Testy jednostkowe przechodzą
- [ ] Rate limiting działa poprawnie
- [ ] Obsługa błędów funkcjonuje
- [ ] Monitoring i logowanie aktywne
- [ ] Dokumentacja kompletna

Ten plan zapewnia kompleksowe wdrożenie usługi OpenRouter zgodnie z wymaganiami MVP, z pełną obsługą błędów, bezpieczeństwem i skalowalnością.
