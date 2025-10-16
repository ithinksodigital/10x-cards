# 🧪 Testing Setup - 10x Cards

Środowisko testowe zostało skonfigurowane zgodnie z tech stack i wytycznymi testowania.

## 📦 Instalacja

### 1. Zainstaluj zależności testowe

```bash
npm install
```

### 2. Zainstaluj przeglądarki Playwright

```bash
npx playwright install
```

### 3. Sprawdź konfigurację

```bash
# Sprawdź Vitest
npx vitest --version

# Sprawdź Playwright
npx playwright --version
```

## 🚀 Uruchamianie testów

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

## 📁 Struktura testów

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
│   └── flows/               # Testy przepływów użytkownika
├── fixtures/                # Dane testowe
├── mocks/                   # Mocki API
├── utils/                   # Funkcje pomocnicze
└── setup.ts                 # Setup dla testów
```

## ⚙️ Konfiguracja

### Vitest (vitest.config.ts)

- **Środowisko**: jsdom
- **Coverage**: ≥90% dla wszystkich metryk
- **Setup**: tests/setup.ts
- **Wzorce**: tests/unit/\*_/_.test.{js,ts,tsx}

### Playwright (playwright.config.ts)

- **Przeglądarki**: Chrome, Firefox, Safari
- **Viewport**: Desktop + Mobile
- **Base URL**: http://localhost:3000
- **Timeout**: 30s dla testów, 5s dla assertions

## 🛠️ Narzędzia

### Unit/Integration Tests

- **Vitest 2.x** - Framework testowy
- **React Testing Library 16.x** - Testowanie komponentów
- **MSW 2.x** - Mock Service Worker
- **@vitest/coverage-v8** - Coverage reporting
- **jsdom** - Środowisko DOM

### E2E Tests

- **Playwright 1.47.x** - Testy end-to-end
- **@axe-core/playwright 4.x** - Testy dostępności
- **Chrome, Firefox, Safari** - Przeglądarki testowe

## 📊 Coverage

Minimalne wymagania:

- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%
- **Statements**: 90%

## 🔧 Przykłady testów

### Test jednostkowy

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Test e2e

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to dashboard", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Sign In");
  await expect(page).toHaveURL("/auth/signin");
});
```

## 🐛 Debugging

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

## 🚦 CI/CD

Testy są automatycznie uruchamiane w GitHub Actions:

- Lint + Typecheck
- Unit tests + Coverage
- E2E tests (Chrome only w CI)
- Build verification

## 📚 Dokumentacja

Szczegółowa dokumentacja znajduje się w `tests/README.md`.

## ✅ Status

Wszystkie komponenty środowiska testowego zostały skonfigurowane:

- ✅ Vitest 2.x z React Testing Library 16.x
- ✅ Playwright 1.47.x z Chrome/Firefox/Safari
- ✅ MSW 2.x dla mockowania API
- ✅ @vitest/coverage-v8 z coverage ≥90%
- ✅ @axe-core/playwright 4.x dla testów dostępności
- ✅ Struktura katalogów testowych
- ✅ Pliki konfiguracyjne
- ✅ Przykładowe testy
- ✅ GitHub Actions workflow
- ✅ Dokumentacja

Środowisko jest gotowe do użycia! 🎉
