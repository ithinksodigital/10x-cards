# Konfiguracja środowisk dla Feature Flags

## Zmienne środowiskowe

System feature flagów używa zmiennej `PUBLIC_ENV_NAME` do określenia środowiska.

### Wymagane zmienne

```bash
# .env.local (lokalne środowisko deweloperskie)
PUBLIC_ENV_NAME=local

# .env.integration (środowisko testowe/staging)
PUBLIC_ENV_NAME=integration

# .env.production (środowisko produkcyjne)
PUBLIC_ENV_NAME=prod
```

## Dlaczego PUBLIC_ENV_NAME?

W Astro zmienne środowiskowe używane po stronie klienta (w komponentach React z `client:load`) **muszą** mieć prefix `PUBLIC_`, aby były dostępne w przeglądarce.

### Bezpieczeństwo

- ✅ `PUBLIC_ENV_NAME` - dostępne w przeglądarce (bezpieczne)
- ❌ `ENV_NAME` - niedostępne w przeglądarce (błąd w produkcji)

## Przykłady konfiguracji

### Lokalne środowisko deweloperskie
```bash
# .env.local
PUBLIC_ENV_NAME=local
SUPABASE_URL=your_local_supabase_url
SUPABASE_KEY=your_local_supabase_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Środowisko testowe/staging
```bash
# .env.integration
PUBLIC_ENV_NAME=integration
SUPABASE_URL=your_staging_supabase_url
SUPABASE_KEY=your_staging_supabase_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Środowisko produkcyjne
```bash
# .env.production
PUBLIC_ENV_NAME=prod
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key
OPENROUTER_API_KEY=your_openrouter_key
```

## Konfiguracja flag dla środowisk

### Aktualna konfiguracja
```typescript
export const FEATURE_FLAGS_CONFIG: EnvironmentConfig = {
  local: {
    auth: true,
    collections: true,
  },
  integration: {
    auth: true,
    collections: true,
  },
  prod: {
    auth: true,
    collections: true,
  },
};
```

### Przykłady różnych konfiguracji

#### Środowisko deweloperskie (wszystko włączone)
```typescript
local: {
  auth: true,
  collections: true,
}
```

#### Środowisko testowe (tylko auth)
```typescript
integration: {
  auth: true,
  collections: false,
}
```

#### Środowisko produkcyjne (wszystko włączone)
```typescript
prod: {
  auth: true,
  collections: true,
}
```

## Weryfikacja konfiguracji

### W przeglądarce (DevTools)
```javascript
// Sprawdź czy zmienna jest dostępna
console.log(import.meta.env.PUBLIC_ENV_NAME);

// Sprawdź flagi
import { getFeatureFlags } from '/src/features/index.js';
console.log(getFeatureFlags());
```

### W kodzie
```typescript
import { isFeatureEnabled } from '@/features';

// Sprawdź konkretną flagę
if (isFeatureEnabled('auth')) {
  console.log('Auth is enabled');
}

// Sprawdź wszystkie flagi
import { getFeatureFlags } from '@/features';
const flags = getFeatureFlags();
console.log('Current flags:', flags);
```

## Troubleshooting

### Problem: Flagi nie działają w przeglądarce
**Rozwiązanie**: Upewnij się, że używasz `PUBLIC_ENV_NAME` zamiast `ENV_NAME`

### Problem: Flagi zwracają domyślne wartości
**Rozwiązanie**: Sprawdź czy `PUBLIC_ENV_NAME` jest ustawione na jedną z wartości: `local`, `integration`, `prod`

### Problem: Błąd "PUBLIC_ENV_NAME not set"
**Rozwiązanie**: Dodaj `PUBLIC_ENV_NAME=local` do pliku `.env.local`

## Bezpieczeństwo

- ✅ `PUBLIC_ENV_NAME` jest bezpieczne do ekspozycji w przeglądarce
- ✅ Nie zawiera wrażliwych danych
- ✅ Używane tylko do określenia środowiska
- ✅ Flagi są konfigurowane w kodzie, nie w zmiennych środowiskowych
