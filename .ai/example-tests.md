# Przykładowe testy dla POST /api/generations

> **Uwaga:** Projekt nie ma jeszcze skonfigurowanego frameworka do testowania (np. Vitest).
> Poniżej znajdują się przykłady testów, które można użyć po dodaniu Vitest do projektu.

## Setup testów

### Instalacja zależności

```bash
npm install -D vitest @vitest/ui
npm install -D @testing-library/react @testing-library/jest-dom
```

### Konfiguracja Vitest

Dodaj do `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

## Przykładowe testy jednostkowe

### Test 1: Walidacja Zod Schema

```typescript
// src/pages/api/__tests__/generations.validation.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";

const StartGenerationSchema = z.object({
  source_text: z
    .string()
    .min(100, "Source text must be at least 100 characters")
    .max(15000, "Source text must not exceed 15,000 characters"),
  language: z
    .string()
    .regex(/^[a-z]{2}$/, "Language must be a valid ISO 639-1 code (e.g., pl, en, es)")
    .optional(),
  target_count: z
    .number()
    .int()
    .min(1, "Target count must be at least 1")
    .max(30, "Target count must not exceed 30")
    .optional()
    .default(30),
});

describe("StartGenerationSchema validation", () => {
  it("should accept valid minimal input", () => {
    const validInput = {
      source_text: "a".repeat(100),
    };

    const result = StartGenerationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.target_count).toBe(30); // default value
    }
  });

  it("should accept valid full input", () => {
    const validInput = {
      source_text: "a".repeat(500),
      language: "pl",
      target_count: 15,
    };

    const result = StartGenerationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject source_text shorter than 100 characters", () => {
    const invalidInput = {
      source_text: "too short",
    };

    const result = StartGenerationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("at least 100 characters");
    }
  });

  it("should reject source_text longer than 15000 characters", () => {
    const invalidInput = {
      source_text: "a".repeat(15001),
    };

    const result = StartGenerationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("not exceed 15,000 characters");
    }
  });

  it("should reject invalid language code", () => {
    const invalidInput = {
      source_text: "a".repeat(100),
      language: "polish", // should be 'pl'
    };

    const result = StartGenerationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("valid ISO 639-1 code");
    }
  });

  it("should reject target_count less than 1", () => {
    const invalidInput = {
      source_text: "a".repeat(100),
      target_count: 0,
    };

    const result = StartGenerationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject target_count greater than 30", () => {
    const invalidInput = {
      source_text: "a".repeat(100),
      target_count: 31,
    };

    const result = StartGenerationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
```

### Test 2: GenerationService - Hash calculation

```typescript
// src/lib/services/__tests__/generation.service.hash.test.ts
import { describe, it, expect } from "vitest";

// Mock calculateHash function (extract to testable utility)
async function calculateHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

describe("GenerationService - calculateHash", () => {
  it("should generate consistent SHA-256 hash for same input", async () => {
    const text = "Test input text";
    const hash1 = await calculateHash(text);
    const hash2 = await calculateHash(text);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });

  it("should generate different hashes for different inputs", async () => {
    const text1 = "First text";
    const text2 = "Second text";

    const hash1 = await calculateHash(text1);
    const hash2 = await calculateHash(text2);

    expect(hash1).not.toBe(hash2);
  });

  it("should generate valid hex string", async () => {
    const text = "Any text";
    const hash = await calculateHash(text);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle empty string", async () => {
    const hash = await calculateHash("");
    expect(hash).toHaveLength(64);
    // SHA-256 of empty string
    expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("should handle unicode characters", async () => {
    const text = "Zażółć gęślą jaźń 🎉";
    const hash = await calculateHash(text);

    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
```

### Test 3: GenerationService - Estimated duration

```typescript
// src/lib/services/__tests__/generation.service.duration.test.ts
import { describe, it, expect } from "vitest";

function calculateEstimatedDuration(targetCount: number): number {
  const baseOverheadMs = 2000;
  const ESTIMATED_MS_PER_CARD = 300;
  const perCardMs = ESTIMATED_MS_PER_CARD * targetCount;
  return baseOverheadMs + perCardMs;
}

describe("GenerationService - calculateEstimatedDuration", () => {
  it("should calculate duration for 1 card", () => {
    const duration = calculateEstimatedDuration(1);
    expect(duration).toBe(2000 + 300); // 2300ms
  });

  it("should calculate duration for default 30 cards", () => {
    const duration = calculateEstimatedDuration(30);
    expect(duration).toBe(2000 + 300 * 30); // 11000ms
  });

  it("should calculate duration for maximum 30 cards", () => {
    const duration = calculateEstimatedDuration(30);
    expect(duration).toBe(11000);
  });

  it("should include base overhead", () => {
    const duration = calculateEstimatedDuration(0);
    expect(duration).toBe(2000); // Just base overhead
  });

  it("should scale linearly with card count", () => {
    const duration10 = calculateEstimatedDuration(10);
    const duration20 = calculateEstimatedDuration(20);

    // Duration should scale linearly
    expect(duration20 - duration10).toBe(300 * 10);
  });
});
```

### Test 4: API Endpoint - Mock tests

```typescript
// src/pages/api/__tests__/generations.endpoint.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Note: This would require setting up proper mocking of Astro context and Supabase
// This is a simplified example showing the structure

describe("POST /api/generations endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when no auth token provided", async () => {
    // Mock implementation
    const mockContext = {
      locals: {
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("No user") }),
          },
        },
      },
      request: {
        json: vi.fn(),
      },
    };

    // Test would call POST handler and verify 401 response
    // expect(response.status).toBe(401);
  });

  it("should return 400 for invalid JSON", async () => {
    // Mock malformed JSON
    const mockContext = {
      locals: {
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: "test-user-id" } },
              error: null,
            }),
          },
        },
      },
      request: {
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      },
    };

    // Test would verify 400 response with appropriate error message
  });

  // More integration tests would go here...
});
```

## Uruchamianie testów

```bash
# Uruchom wszystkie testy
npm test

# Uruchom testy w trybie watch
npm test -- --watch

# Uruchom testy z UI
npm run test:ui

# Uruchom testy z coverage
npm run test:coverage
```

## Coverage goals

Zalecane pokrycie kodu testami:

- **Walidacja (Zod schemas):** 100%
- **Service logic (GenerationService):** >90%
- **API handlers:** >80%
- **Utilities:** 100%

## Następne kroki

1. ✅ Dodaj Vitest do projektu
2. ✅ Skonfiguruj mocking dla Supabase client
3. ✅ Napisz testy jednostkowe dla wszystkich metod serwisu
4. ✅ Napisz testy integracyjne dla endpointów
5. ✅ Dodaj CI/CD pipeline do uruchamiania testów
6. ✅ Monitoruj coverage i utrzymuj >80%

## Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Astro Testing Guide](https://docs.astro.build/en/guides/testing/)
