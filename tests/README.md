# Testing Guide - 10x Cards

Ten katalog zawiera wszystkie testy dla aplikacji 10x Cards, zgodnie z tech stack i wytycznymi testowania.

## Struktura katalogów

```
tests/
├── unit/                    # Testy jednostkowe
│   ├── components/          # Testy komponentów React
│   ├── lib/                 # Testy funkcji pomocniczych
│   ├── hooks/               # Testy custom hooks
│   └── services/            # Testy serwisów
├── integration/             # Testy integracyjne
│   ├── api/                 # Testy API endpoints
│   ├── auth/                # Testy autentykacji
│   └── generation/          # Testy generacji kart
├── e2e/                     # Testy end-to-end
│   ├── pages/               # Testy stron
│   ├── flows/               # Testy przepływów użytkownika
│   ├── global-setup.ts      # Globalne setup dla e2e
│   └── global-teardown.ts   # Globalne czyszczenie dla e2e
├── fixtures/                # Dane testowe
├── mocks/                   # Mocki API
├── utils/                   # Funkcje pomocnicze dla testów
└── setup.ts                 # Setup dla testów jednostkowych
```

## Narzędzia testowe

### Unit/Integration Tests

- **Vitest 2.x** - Framework testowy
- **React Testing Library 16.x** - Testowanie komponentów React
- **MSW 2.x** - Mock Service Worker dla API
- **@vitest/coverage-v8** - Coverage reporting
- **jsdom** - Środowisko DOM dla testów

### E2E Tests

- **Playwright 1.47.x** - Testy end-to-end
- **@axe-core/playwright 4.x** - Testy dostępności
- **Chrome, Firefox, Safari** - Przeglądarki testowe

## Uruchamianie testów

### Testy jednostkowe

```bash
# Wszystkie testy jednostkowe
npm run test

# Tryb watch (podczas rozwoju)
npm run test:watch

# UI mode (interaktywny interfejs)
npm run test:ui

# Coverage report
npm run test:coverage
```

### Testy e2e

```bash
# Wszystkie testy e2e
npm run test:e2e

# UI mode (interaktywny interfejs)
npm run test:e2e:ui

# Tryb headed (z widoczną przeglądarką)
npm run test:e2e:headed

# Konkretna przeglądarka
npx playwright test --project=chromium
```

### Wszystkie testy

```bash
npm run test:all
```

## Konfiguracja

### Vitest (vitest.config.ts)

- Środowisko: jsdom
- Coverage: ≥90% dla wszystkich metryk
- Setup: tests/setup.ts
- Wzorce: tests/unit/\*_/_.test.{js,ts,tsx}

### Playwright (playwright.config.ts)

- Przeglądarki: Chrome, Firefox, Safari
- Viewport: Desktop + Mobile
- Base URL: http://localhost:3000
- Timeout: 30s dla testów, 5s dla assertions

## Pisanie testów

### Testy jednostkowe

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Testy e2e

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to home page after login", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Sign In");
  await expect(page).toHaveURL("/auth/signin");
});
```

## Mockowanie

### MSW Handlers

```typescript
// tests/mocks/handlers.ts
export const handlers = [
  http.get("/api/sets", () => {
    return HttpResponse.json(mockSets);
  }),
];
```

### Vitest Mocks

```typescript
import { vi } from "vitest";

// Mock funkcji
const mockFn = vi.fn();

// Mock modułu
vi.mock("@/lib/api", () => ({
  fetchData: vi.fn(),
}));
```

## Coverage

Minimalne wymagania coverage:

- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%

## Dostępność (A11y)

Wszystkie testy e2e automatycznie sprawdzają dostępność używając axe-core:

```typescript
import { injectAxe, checkA11y } from "@axe-core/playwright";

test("should be accessible", async ({ page }) => {
  await page.goto("/");
  await injectAxe(page);
  await checkA11y(page);
});
```

## Best Practices

### Testy jednostkowe

1. **Arrange-Act-Assert** - Struktura testów
2. **Early returns** - Obsługa błędów na początku
3. **Guard clauses** - Sprawdzanie warunków wstępnych
4. **Mockowanie** - Używaj vi.fn() i vi.spyOn()
5. **Inline snapshots** - Dla złożonych assertions

### Testy e2e

1. **Page Object Model** - Dla złożonych stron
2. **Locators** - Zamiast selektorów CSS
3. **API testing** - Testuj backend osobno
4. **Visual comparison** - Screenshots dla regresji
5. **Parallel execution** - Szybsze uruchamianie

### Ogólne

1. **Descriptive names** - Czytelne nazwy testów
2. **Single responsibility** - Jeden test = jedna funkcjonalność
3. **Independent tests** - Testy nie zależą od siebie
4. **Fast feedback** - Szybkie uruchamianie
5. **Maintainable** - Łatwe w utrzymaniu

## Debugging

### Vitest

```bash
# Debug mode
npm run test -- --inspect-brk

# Verbose output
npm run test -- --reporter=verbose
```

### Playwright

```bash
# Debug mode
npx playwright test --debug

# Trace viewer
npx playwright show-trace test-results/trace.zip
```

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions:

- Lint + Typecheck
- Unit tests + Coverage
- E2E tests (Chrome only w CI)
- Build verification

## Troubleshooting

### Częste problemy

1. **Timeout errors** - Zwiększ timeout w konfiguracji
2. **Flaky tests** - Dodaj proper waits
3. **Coverage issues** - Sprawdź exclude patterns
4. **MSW not working** - Sprawdź setup w tests/setup.ts

### Logi

- Vitest: `npm run test -- --reporter=verbose`
- Playwright: `npx playwright test --reporter=list`
