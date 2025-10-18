# Feature Flags System

Uniwersalny system zarządzania flagami funkcjonalności dla aplikacji 10x-cards.

## Przegląd

System feature flagów pozwala na kontrolowanie dostępności funkcjonalności w różnych środowiskach bez konieczności ponownego wdrażania kodu. Flagi są ładowane raz przy starcie aplikacji i cache'owane dla wydajności.

## Środowiska

- **local** - środowisko deweloperskie
- **integration** - środowisko testowe/staging  
- **prod** - środowisko produkcyjne

## Dostępne flagi

- **auth** - funkcjonalności autoryzacji
- **collections** - funkcjonalności kolekcji

## Konfiguracja

Flagi są konfigurowane w pliku `config.ts`:

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
    auth: false,
    collections: true,
  },
};
```

## Użycie

### W komponentach React (.tsx)

```typescript
import { isFeatureEnabled } from '@/features';

function MyComponent() {
  if (!isFeatureEnabled('auth')) {
    return <div>Funkcjonalność autoryzacji jest niedostępna</div>;
  }

  return <AuthComponent />;
}
```

### W stronach Astro (.astro)

```astro
---
import { isFeatureEnabled } from '@/features';

const showAuth = isFeatureEnabled('auth');
---

{showAuth && (
  <div>
    <h1>Panel autoryzacji</h1>
    <!-- zawartość autoryzacji -->
  </div>
)}
```

### W API endpoints (.ts)

```typescript
import { isFeatureEnabled } from '@/features';

export async function GET() {
  if (!isFeatureEnabled('collections')) {
    return new Response('Funkcjonalność kolekcji jest niedostępna', { 
      status: 404 
    });
  }

  // logika API dla kolekcji
  return new Response(JSON.stringify(data));
}
```

### Pobieranie wszystkich flag

```typescript
import { getFeatureFlags } from '@/features';

const flags = getFeatureFlags();
console.log('Dostępne flagi:', flags);
// { auth: true, collections: false }
```

## Zmienne środowiskowe

System używa zmiennej `PUBLIC_ENV_NAME` do określenia środowiska:

```bash
# .env.local
PUBLIC_ENV_NAME=local

# .env.integration  
PUBLIC_ENV_NAME=integration

# .env.production
PUBLIC_ENV_NAME=prod
```

**Ważne**: W Astro zmienne środowiskowe używane po stronie klienta muszą mieć prefix `PUBLIC_`.

## Domyślne wartości

Jeśli flaga nie jest zdefiniowana dla danego środowiska, używana jest wartość domyślna `false`.

## Testowanie

W testach można zresetować cache flag:

```typescript
import { resetFeatureFlagsCache } from '@/features';

beforeEach(() => {
  resetFeatureFlagsCache();
});
```

## Dodawanie nowych flag

1. Dodaj nową flagę do typu `FeatureFlag` w `types.ts`
2. Dodaj flagę do interfejsu `FeatureFlags` w `types.ts`
3. Skonfiguruj flagę w `FEATURE_FLAGS_CONFIG` w `config.ts`
4. Dodaj wartość domyślną w `DEFAULT_FEATURE_FLAGS` w `config.ts`
