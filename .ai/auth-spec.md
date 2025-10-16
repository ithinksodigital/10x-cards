# Specyfikacja techniczna systemu autentykacji - Flash Cards AI v2

## 1. Przegląd architektury

### 1.1 Kontekst biznesowy

System autentykacji dla aplikacji Flash Cards AI v2 implementuje **opcjonalną autentykację** zgodnie z PRD v2, umożliwiając użytkownikom korzystanie z podstawowych funkcji (generowanie i przegląd fiszek) bez logowania, a następnie naturalną konwersję do pełnej funkcjonalności po zalogowaniu.

### 1.2 Kluczowe założenia architektoniczne

- **Opcjonalna autentykacja**: Użytkownicy mogą korzystać z aplikacji bez konta
- **Tryb anonimowy**: Pełna funkcjonalność generowania i przeglądu fiszek w localStorage/sessionStorage
- **Konwersja danych**: Migracja danych z sesji anonimowej do konta po zalogowaniu
- **Supabase Auth**: Logowanie przez email/password (bez potwierdzania emaila)
- **RLS (Row Level Security)**: Pełna izolacja danych użytkowników na poziomie bazy danych

### 1.3 Stack technologiczny

- **Frontend**: Astro 5 + React 18.3 + TypeScript 5 + Tailwind CSS 3.4 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- **Autentykacja**: Supabase Auth z email/password (bez potwierdzania emaila)
- **Storage**: localStorage/sessionStorage (anonimowy), Supabase (uwierzytelniony)

## 2. Architektura interfejsu użytkownika

### 2.1 Struktura komponentów i stron

#### 2.1.1 Strony Astro (Server-Side)

```
src/pages/
├── index.astro                    # Strona główna (tryb anonimowy/uwierzytelniony)
├── generate.astro                 # Generowanie fiszek (uniwersalna)
├── auth/
│   ├── login.astro               # Strona logowania
│   ├── callback.astro            # OAuth callback
│   └── logout.astro              # Wylogowanie
└── dashboard.astro               # Dashboard użytkownika (tylko uwierzytelniony)
```

#### 2.1.2 Komponenty React (Client-Side)

```
src/components/
├── auth/
│   ├── AuthProvider.tsx          # Context provider dla stanu autentykacji
│   ├── LoginForm.tsx             # Formularz logowania email/password
│   ├── RegisterForm.tsx          # Formularz rejestracji
│   ├── UserMenu.tsx              # Menu użytkownika (username, wylogowanie)
│   ├── AuthGuard.tsx             # Wrapper dla chronionych komponentów
│   └── MigrationModal.tsx        # Modal migracji danych anonimowych
├── generation/
│   ├── GenerationApp.tsx         # Główna aplikacja generowania (uniwersalna)
│   ├── SaveToSetDialog.tsx       # Dialog zapisu do zestawu (tylko uwierzytelniony)
│   └── ConversionPrompt.tsx      # Prompt konwersji anonimowej → uwierzytelnionej
└── ui/
    ├── ThemeToggle.tsx           # Przełącznik motywu (uniwersalny)
    └── [existing components]     # Istniejące komponenty shadcn/ui
```

### 2.2 Rozdzielenie odpowiedzialności

#### 2.2.1 Strony Astro (Server-Side Rendering)

**Odpowiedzialności:**

- Renderowanie podstawowej struktury HTML
- Sprawdzanie stanu autentykacji na serwerze
- Przekazywanie danych użytkownika do komponentów React
- Obsługa routingu i meta tagów
- Implementacja middleware dla autentykacji

**Kluczowe funkcje:**

```typescript
// Przykład: src/pages/index.astro
---
import { supabaseClient } from '../db/supabase.client.ts';

// Sprawdzenie stanu autentykacji na serwerze
const { data: { user }, error } = await supabaseClient.auth.getUser();
const isAuthenticated = !error && !!user;
---

<html>
  <head>
    <title>{isAuthenticated ? 'Dashboard' : 'Flash Cards AI'}</title>
  </head>
  <body>
    <Layout>
      <GenerationApp
        client:load
        initialUser={user}
        isAuthenticated={isAuthenticated}
      />
    </Layout>
  </body>
</html>
```

#### 2.2.2 Komponenty React (Client-Side Interactivity)

**Odpowiedzialności:**

- Zarządzanie stanem autentykacji w czasie rzeczywistym
- Obsługa interakcji użytkownika (logowanie, wylogowanie)
- Migracja danych z sesji anonimowej
- Walidacja formularzy i komunikatów błędów
- Integracja z Supabase Auth SDK

**Kluczowe funkcje:**

```typescript
// Przykład: src/components/auth/AuthProvider.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  migrateAnonymousData: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementacja zarządzania stanem autentykacji
  // Obsługa eventów auth state change
  // Migracja danych anonimowych
};
```

### 2.3 Przypadki walidacji i komunikaty błędów

#### 2.3.1 Walidacja formularzy

```typescript
// Schematy walidacji z użyciem Zod
const LoginFormSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

const RegisterFormSchema = z
  .object({
    email: z.string().email("Nieprawidłowy adres email"),
    password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

const MigrationFormSchema = z.object({
  targetSetId: z.string().uuid("Nieprawidłowy ID zestawu").optional(),
  newSetName: z.string().min(1, "Nazwa zestawu jest wymagana").max(100, "Nazwa zestawu zbyt długa"),
});
```

#### 2.3.2 Komunikaty błędów

```typescript
// Mapowanie błędów Supabase na komunikaty użytkownika
const ERROR_MESSAGES = {
  invalid_credentials: "Nieprawidłowy email lub hasło",
  email_already_registered: "Konto z tym emailem już istnieje",
  weak_password: "Hasło jest zbyt słabe. Użyj co najmniej 6 znaków",
  too_many_requests: "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę",
  network_error: "Błąd połączenia. Sprawdź połączenie internetowe",
  migration_failed: "Nie udało się przenieść danych. Spróbuj ponownie",
} as const;
```

#### 2.3.3 Stany ładowania i sukcesu

```typescript
// Stany komponentów autentykacji
type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User }
  | { status: "migrating"; user: User; anonymousData: AnonymousSessionData }
  | { status: "error"; error: string };
```

### 2.4 Obsługa najważniejszych scenariuszy

#### 2.4.1 Scenariusz 1: Użytkownik anonimowy generuje fiszki

1. **Wejście**: Użytkownik wchodzi na stronę bez logowania
2. **Generowanie**: Wkleja tekst i generuje fiszki (dane w sessionStorage)
3. **Przegląd**: Przegląda i selekcjonuje fiszki (stan w localStorage)
4. **Prompt konwersji**: Po zaakceptowaniu fiszek pojawia się CTA "Zapisz do konta"
5. **Logowanie**: Kliknięcie otwiera modal z formularzem email/password
6. **Migracja**: Po zalogowaniu system oferuje przeniesienie danych

#### 2.4.2 Scenariusz 2: Użytkownik uwierzytelniony korzysta z aplikacji

1. **Wejście**: Użytkownik wchodzi na stronę zalogowany
2. **Dashboard**: Widzi swoje zestawy i statystyki
3. **Generowanie**: Generuje fiszki (dane od razu w Supabase)
4. **Zapis**: Zapisuje fiszki do wybranego zestawu
5. **SRS**: Rozpoczyna sesję nauki

#### 2.4.3 Scenariusz 3: Migracja danych anonimowych

1. **Wykrycie**: System wykrywa dane w localStorage po zalogowaniu
2. **Modal**: Pojawia się modal z opcją migracji
3. **Wybór zestawu**: Użytkownik wybiera zestaw docelowy lub tworzy nowy
4. **Przeniesienie**: Dane są przenoszone do Supabase
5. **Czyszczenie**: localStorage jest czyszczony
6. **Kontynuacja**: Użytkownik może kontynuować pracę

## 3. Logika backendowa

### 3.1 Struktura endpointów API

#### 3.1.1 Endpointy anonimowe

```typescript
// src/pages/api/anonymous/
├── generate.ts                   # POST - generowanie fiszek bez autentykacji
├── review.ts                     # POST - przegląd i selekcja fiszek
└── validate.ts                   # GET - walidacja limitów anonimowych
```

**Przykład implementacji:**

```typescript
// src/pages/api/anonymous/generate.ts
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Rate limiting dla użytkowników anonimowych
    const rateLimitResult = await checkAnonymousRateLimit(context.request);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        }),
        { status: 429 }
      );
    }

    // Walidacja danych wejściowych
    const body = await context.request.json();
    const validatedData = AnonymousGenerateSchema.parse(body);

    // Generowanie fiszek (bez zapisu do bazy)
    const result = await generationService.generateCards(validatedData.text);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### 3.1.2 Endpointy uwierzytelnione

```typescript
// src/pages/api/
├── auth/
│   ├── callback.ts               # GET - OAuth callback handler
│   ├── logout.ts                 # POST - wylogowanie
│   └── profile.ts                # GET/PUT - profil użytkownika
├── migrate/
│   └── anonymous-to-account.ts   # POST - migracja danych anonimowych
├── sets/                         # Istniejące endpointy zestawów
├── cards/                        # Istniejące endpointy fiszek
└── srs/                          # Istniejące endpointy SRS
```

**Przykład implementacji migracji:**

```typescript
// src/pages/api/migrate/anonymous-to-account.ts
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Autentykacja użytkownika
    const userId = await getAuthenticatedUserId(context);

    // Pobranie danych anonimowych z request body
    const body = await context.request.json();
    const { anonymousData, targetSetId, newSetName } = MigrationRequestSchema.parse(body);

    // Walidacja limitów konta
    await validateAccountLimits(userId, anonymousData.cards.length);

    // Migracja danych
    const result = await migrationService.migrateAnonymousData({
      userId,
      anonymousData,
      targetSetId,
      newSetName,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 3.2 Modele danych

#### 3.2.1 Typy TypeScript

```typescript
// src/types/auth.ts
export interface AnonymousSessionData {
  sessionId: string;
  generatedCards: GeneratedCard[];
  reviewState: ReviewState;
  createdAt: string;
  expiresAt: string;
}

export interface GeneratedCard {
  id: string;
  front: string;
  back: string;
  language: string;
  isAccepted: boolean;
  isEdited: boolean;
  editedFront?: string;
  editedBack?: string;
}

export interface ReviewState {
  currentBatch: number;
  totalBatches: number;
  acceptedCards: string[];
  rejectedCards: string[];
  undoHistory: UndoAction[];
}

export interface MigrationRequest {
  anonymousData: AnonymousSessionData;
  targetSetId?: string;
  newSetName?: string;
}

export interface MigrationResult {
  migratedCards: number;
  createdSetId?: string;
  skippedCards: number;
  errors: string[];
}
```

#### 3.2.2 Schematy walidacji Zod

```typescript
// src/lib/schemas/auth.ts
export const AnonymousGenerateSchema = z.object({
  text: z
    .string()
    .min(100, "Tekst musi mieć co najmniej 100 znaków")
    .max(15000, "Tekst nie może przekraczać 15000 znaków"),
  language: z.enum(["pl", "en", "es"]).optional(),
});

export const MigrationRequestSchema = z
  .object({
    anonymousData: z.object({
      sessionId: z.string().uuid(),
      generatedCards: z.array(GeneratedCardSchema),
      reviewState: ReviewStateSchema,
      createdAt: z.string().datetime(),
      expiresAt: z.string().datetime(),
    }),
    targetSetId: z.string().uuid().optional(),
    newSetName: z.string().min(1).max(100).optional(),
  })
  .refine(
    (data) => data.targetSetId || data.newSetName,
    "Musisz wybrać zestaw docelowy lub podać nazwę nowego zestawu"
  );
```

### 3.3 Mechanizm walidacji danych wejściowych

#### 3.3.1 Walidacja na poziomie API

```typescript
// src/lib/validation/api-validator.ts
export class ApiValidator {
  static async validateRequest<T>(request: Request, schema: z.ZodSchema<T>): Promise<T> {
    try {
      const body = await request.json();
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError("Invalid request data", error.errors);
      }
      throw new ApiError("Invalid JSON", 400);
    }
  }

  static validateAuth(context: APIContext): Promise<string> {
    return getAuthenticatedUserId(context);
  }

  static async validateRateLimit(request: Request, userId?: string): Promise<RateLimitResult> {
    const isAnonymous = !userId;
    const rateLimit = isAnonymous ? ANONYMOUS_RATE_LIMIT : AUTHENTICATED_RATE_LIMIT;

    return await rateLimitService.checkLimit(request, rateLimit);
  }
}
```

#### 3.3.2 Walidacja na poziomie serwisu

```typescript
// src/lib/services/migration.service.ts
export class MigrationService {
  async migrateAnonymousData(request: MigrationRequest): Promise<MigrationResult> {
    // Walidacja danych anonimowych
    this.validateAnonymousData(request.anonymousData);

    // Walidacja limitów konta
    await this.validateAccountLimits(request.userId, request.anonymousData.generatedCards.length);

    // Walidacja zestawu docelowego
    if (request.targetSetId) {
      await this.validateTargetSet(request.targetSetId, request.userId);
    }

    // Wykonanie migracji
    return await this.performMigration(request);
  }

  private validateAnonymousData(data: AnonymousSessionData): void {
    if (new Date(data.expiresAt) < new Date()) {
      throw new ValidationError("Anonymous session has expired");
    }

    if (data.generatedCards.length === 0) {
      throw new ValidationError("No cards to migrate");
    }
  }
}
```

### 3.4 Obsługa wyjątków

#### 3.4.1 Hierarchia błędów

```typescript
// src/lib/errors/auth-errors.ts
export class AuthError extends ApiError {
  constructor(message: string, code: string, statusCode: number = 401) {
    super(message, statusCode);
    this.name = "AuthError";
    this.code = code;
  }
}

export class MigrationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 422);
    this.name = "MigrationError";
    this.details = details;
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super("Rate limit exceeded", 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
```

#### 3.4.2 Globalna obsługa błędów

```typescript
// src/lib/errors/error-handler.ts
export function handleApiError(error: unknown): Response {
  if (error instanceof AuthError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      }),
      {
        status: error.statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (error instanceof MigrationError) {
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Logowanie błędów serwera
  console.error("Unexpected error:", error);

  return new Response(
    JSON.stringify({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### 3.5 Aktualizacja renderowania server-side

#### 3.5.1 Middleware autentykacji

```typescript
// src/middleware/index.ts (rozszerzenie)
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // Inicjalizacja Supabase client
  context.locals.supabase = supabaseClient;

  // Sprawdzenie stanu autentykacji
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();
  context.locals.user = user;
  context.locals.isAuthenticated = !error && !!user;

  // Sprawdzenie czy strona wymaga autentykacji
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) => context.url.pathname.startsWith(route));

  if (isProtectedRoute && !context.locals.isAuthenticated) {
    return context.redirect("/auth/login");
  }

  return next();
});
```

#### 3.5.2 Layout z obsługą autentykacji

```typescript
// src/layouts/Layout.astro (rozszerzenie)
---
import { supabaseClient } from '../db/supabase.client.ts';

interface Props {
  title: string;
  description?: string;
  requireAuth?: boolean;
}

const { title, description, requireAuth = false } = Astro.props;

// Sprawdzenie autentykacji dla chronionych stron
if (requireAuth && !Astro.locals.isAuthenticated) {
  return Astro.redirect('/auth/login');
}

const user = Astro.locals.user;
const isAuthenticated = Astro.locals.isAuthenticated;
---

<!DOCTYPE html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Flash Cards AI</a>
        {isAuthenticated ? (
          <UserMenu client:load user={user} />
        ) : (
          <LoginForm client:load />
        )}
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer>
      <ThemeToggle client:load />
    </footer>
  </body>
</html>
```

## 4. System autentykacji

### 4.1 Konfiguracja Supabase Auth

#### 4.1.1 Konfiguracja Email/Password Auth

```typescript
// supabase/config.toml (aktualizacja)
[auth]
enabled = true
site_url = "https://your-domain.com"
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false  # Nie używamy anonymous sign-ins Supabase

# Wyłączenie potwierdzania emaila dla MVP
[auth.email]
enable_signup = true
double_confirm_changes = false
enable_confirmations = false  # Kluczowe: wyłączenie potwierdzania emaila

[auth.password]
min_length = 6
require_uppercase = false
require_lowercase = false
require_numbers = false
require_symbols = false

[auth.rate_limit]
email_sent = 2
sms_sent = 30
token_refresh = 150
sign_up_sign_in = 30
```

#### 4.1.2 Konfiguracja RLS (Row Level Security)

```sql
-- Włączenie RLS na wszystkich tabelach użytkownika
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Polityki RLS dla tabeli profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Polityki RLS dla tabeli sets
CREATE POLICY "Users can view own sets" ON sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sets" ON sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sets" ON sets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sets" ON sets
  FOR DELETE USING (auth.uid() = user_id);

-- Analogiczne polityki dla cards i generations...
```

### 4.2 Implementacja autentykacji w Astro

#### 4.2.1 Klient Supabase z obsługą SSR

```typescript
// src/db/supabase.client.ts (rozszerzenie)
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

// Klient dla SSR (server-side)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Nie persistujemy sesji na serwerze
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Klient dla CSR (client-side)
export const createSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // Persistujemy sesję w przeglądarce
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

export type SupabaseClient = typeof supabaseClient;
```

#### 4.2.2 Hook autentykacji React

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "../db/supabase.client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const supabase = createSupabaseClient();

  useEffect(() => {
    // Pobranie aktualnej sesji
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
    };

    getInitialSession();

    // Nasłuchiwanie zmian stanu autentykacji
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });

      // Obsługa migracji danych po zalogowaniu
      if (event === "SIGNED_IN" && session?.user) {
        await handlePostLoginMigration(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(`Login failed: ${error.message}`);
      }

      return data;
    },
    [supabase]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Nie wysyłamy emaila potwierdzającego
        },
      });

      if (error) {
        throw new Error(`Registration failed: ${error.message}`);
      }

      return data;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }, [supabase]);

  return {
    ...state,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}

// Funkcja obsługi migracji danych po zalogowaniu
async function handlePostLoginMigration(user: User) {
  const anonymousData = getAnonymousSessionData();

  if (anonymousData && anonymousData.generatedCards.length > 0) {
    // Wyświetlenie modala migracji
    window.dispatchEvent(
      new CustomEvent("show-migration-modal", {
        detail: { user, anonymousData },
      })
    );
  }
}
```

#### 4.2.3 Komponenty formularzy autentykacji

```typescript
// src/components/auth/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginFormSchema } from '../../lib/schemas/auth';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const { signInWithEmail, isLoading } = useAuth();
  const [error, setError] = useState<string>('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(LoginFormSchema)
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setError('');
      await signInWithEmail(data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd logowania');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="twoj@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Hasło
        </label>
        <input
          {...register('password')}
          type="password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Logowanie...' : 'Zaloguj się'}
      </button>
    </form>
  );
};
```

### 4.3 Zarządzanie sesjami i tokenami

#### 4.3.1 Odświeżanie tokenów

```typescript
// src/lib/auth/token-manager.ts
export class TokenManager {
  private static instance: TokenManager;
  private refreshTimer: NodeJS.Timeout | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  startTokenRefresh(supabase: SupabaseClient) {
    // Sprawdzenie tokenu co 50 minut (token ważny 60 minut)
    this.refreshTimer = setInterval(
      async () => {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Token refresh error:", error);
          this.stopTokenRefresh();
          return;
        }

        if (session) {
          // Token jest automatycznie odświeżany przez Supabase
          console.log("Token refreshed successfully");
        } else {
          // Brak sesji - użytkownik został wylogowany
          this.stopTokenRefresh();
        }
      },
      50 * 60 * 1000
    ); // 50 minut
  }

  stopTokenRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}
```

#### 4.3.2 Obsługa wygaśnięcia sesji

```typescript
// src/lib/auth/session-handler.ts
export class SessionHandler {
  static async handleSessionExpiry(supabase: SupabaseClient) {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      // Sesja wygasła lub błąd
      this.clearLocalData();
      this.redirectToLogin();
      return false;
    }

    // Sprawdzenie czy token jest bliski wygaśnięcia
    const expiresAt = new Date(session.expires_at!);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry < 5 * 60 * 1000) {
      // 5 minut
      // Token wygaśnie wkrótce - próba odświeżenia
      const { error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("Session refresh failed:", refreshError);
        this.clearLocalData();
        this.redirectToLogin();
        return false;
      }
    }

    return true;
  }

  private static clearLocalData() {
    // Czyszczenie danych lokalnych
    localStorage.removeItem("anonymous_session");
    sessionStorage.clear();
  }

  private static redirectToLogin() {
    const currentPath = window.location.pathname;
    const loginUrl = `/auth/login?redirect_to=${encodeURIComponent(currentPath)}`;
    window.location.href = loginUrl;
  }
}
```

### 4.4 Bezpieczeństwo i zgodność

#### 4.4.1 Rate limiting

```typescript
// src/lib/rate-limiting/auth-rate-limiter.ts
export class AuthRateLimiter {
  private static readonly LIMITS = {
    anonymous: {
      generate: { requests: 3, window: 60 * 60 * 1000 }, // 3 generacje/godzinę
      review: { requests: 100, window: 60 * 60 * 1000 }, // 100 przeglądów/godzinę
    },
    authenticated: {
      generate: { requests: 50, window: 60 * 60 * 1000 }, // 50 generacji/godzinę
      review: { requests: 1000, window: 60 * 60 * 1000 }, // 1000 przeglądów/godzinę
    },
  };

  static async checkLimit(
    request: Request,
    userId?: string,
    action: "generate" | "review" = "generate"
  ): Promise<RateLimitResult> {
    const isAnonymous = !userId;
    const limits = isAnonymous ? this.LIMITS.anonymous : this.LIMITS.authenticated;
    const limit = limits[action];

    // Implementacja rate limiting (Redis lub in-memory cache)
    const key = isAnonymous
      ? `rate_limit:anonymous:${action}:${getClientIP(request)}`
      : `rate_limit:user:${action}:${userId}`;

    const currentCount = await this.getCurrentCount(key, limit.window);

    if (currentCount >= limit.requests) {
      const retryAfter = await this.getRetryAfter(key, limit.window);
      return {
        allowed: false,
        retryAfter,
        limit: limit.requests,
        remaining: 0,
      };
    }

    await this.incrementCount(key, limit.window);

    return {
      allowed: true,
      retryAfter: 0,
      limit: limit.requests,
      remaining: limit.requests - currentCount - 1,
    };
  }
}
```

#### 4.4.2 CORS i CSP

```typescript
// astro.config.mjs (aktualizacja)
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: node({
    mode: "standalone",
  }),
  // Konfiguracja CORS
  server: {
    port: 3000,
    headers: {
      "Access-Control-Allow-Origin":
        process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  },
  // Content Security Policy
  security: {
    headers: {
      "Content-Security-Policy": `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        connect-src 'self' https://*.supabase.co;
        frame-src 'self';
      `
        .replace(/\s+/g, " ")
        .trim(),
    },
  },
});
```

## 5. Kluczowe wnioski i rekomendacje

### 5.1 Architektura

- **Opcjonalna autentykacja** umożliwia natychmiastowe doświadczenie wartości produktu
- **Email/password auth** upraszcza proces rejestracji bez potwierdzania emaila
- **Migracja danych** zapewnia płynne przejście z trybu anonimowego do uwierzytelnionego
- **RLS** gwarantuje pełną izolację danych użytkowników na poziomie bazy danych
- **Rate limiting** zapobiega nadużyciom i kontroluje koszty

### 5.2 Bezpieczeństwo

- **JWT tokeny** Supabase zapewniają bezpieczną autentykację
- **CORS i CSP** chronią przed atakami XSS i CSRF
- **Walidacja danych** na wszystkich poziomach (frontend, API, baza danych)
- **Logowanie** wszystkich operacji autentykacji dla audytu

### 5.3 Wydajność

- **SSR** dla szybkiego pierwszego renderowania
- **CSR** dla interaktywności i real-time updates
- **Caching** sesji i tokenów w przeglądarce
- **Lazy loading** komponentów autentykacji

### 5.4 UX/UI

- **Seamless transition** między trybami anonimowym i uwierzytelnionym
- **Clear feedback** dla wszystkich stanów (loading, error, success)
- **Progressive enhancement** - aplikacja działa bez JavaScript
- **Mobile-first** design z obsługą touch gestures

### 5.5 Monitorowanie

- **Analityka konwersji** z trybu anonimowego do uwierzytelnionego
- **Tracking** błędów autentykacji i migracji
- **Performance metrics** dla wszystkich operacji auth
- **User journey** analiza dla optymalizacji UX

Ta specyfikacja zapewnia solidną podstawę dla implementacji systemu autentykacji, który spełnia wszystkie wymagania PRD v2 przy zachowaniu wysokiego poziomu bezpieczeństwa i użyteczności.
