# Authentication Components

Ten katalog zawiera komponenty React do obsługi autentykacji w aplikacji 10x Cards.

## Komponenty

### AuthProvider
Context provider zarządzający stanem autentykacji w całej aplikacji.

```tsx
import { AuthProvider, useAuth } from './auth';

// W komponencie
const { user, isAuthenticated, signInWithEmail, signOut } = useAuth();
```

### Formularze autentykacji

#### LoginForm
Formularz logowania z walidacją email/hasło.

#### RegisterForm
Formularz rejestracji z potwierdzeniem hasła.

#### ForgotPasswordForm
Formularz resetowania hasła.

#### ResetPasswordForm
Formularz ustawiania nowego hasła.

### AuthContainer
Kontener łączący wszystkie formularze autentykacji z możliwością przełączania między nimi.

### UserMenu
Menu użytkownika wyświetlane w headerze dla zalogowanych użytkowników.

### AuthGuard
Komponent chroniący treści wymagające autentykacji.

```tsx
import { AuthGuard } from './auth';

<AuthGuard requireAuth={true}>
  <ProtectedContent />
</AuthGuard>
```

### MigrationModal
Modal do migracji danych z sesji anonimowej do konta użytkownika.

## Strony Astro

### /auth/login
Strona logowania z formularzem email/hasło.

### /auth/register
Strona rejestracji nowego konta.

### /auth/forgot-password
Strona resetowania hasła.

### /auth/reset-password
Strona ustawiania nowego hasła (z tokenem z emaila).

### /auth/callback
Strona obsługująca OAuth callbacks.

### /auth/logout
Strona wylogowywania użytkownika.

### /dashboard
Dashboard dla zalogowanych użytkowników.

## Schematy walidacji

Wszystkie formularze używają schematów Zod zdefiniowanych w `src/lib/schemas.ts`:

- `LoginFormSchema`
- `RegisterFormSchema`
- `ForgotPasswordSchema`
- `ResetPasswordSchema`
- `MigrationRequestSchema`

## Integracja z Supabase

Komponenty są przygotowane do integracji z Supabase Auth, ale obecnie używają mock implementacji. Aby włączyć rzeczywistą autentykację:

1. Zaktualizuj `AuthProvider` z rzeczywistymi wywołaniami Supabase
2. Dodaj konfigurację Supabase w `src/db/supabase.client.ts`
3. Zaktualizuj middleware w `src/middleware/index.ts`

## Styling

Wszystkie komponenty używają:
- Tailwind CSS dla stylowania
- shadcn/ui komponenty (Button, Input, Card, Dialog, Alert)
- Lucide React ikony
- Spójną paletę kolorów z motywem aplikacji

## Dostępność

Komponenty są zbudowane z myślą o dostępności:
- Proper ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management
- Error announcements
