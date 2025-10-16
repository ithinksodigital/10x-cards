# Struktura komponentów - 10x Cards

## ASCII Tree Structure

```
src/components/
├── auth/                           # Authentication components
│   ├── AuthContainer.tsx          # Main auth container
│   ├── AuthGuard.tsx              # Route protection
│   ├── AuthProvider.tsx           # Auth context provider
│   ├── DashboardWrapper.tsx       # Dashboard layout wrapper
│   ├── ForgotPasswordForm.tsx     # Password recovery form
│   ├── index.ts                   # Auth module exports
│   ├── LoginForm.tsx              # User login form
│   ├── MigrationModal.tsx         # User migration modal
│   ├── README.md                  # Auth documentation
│   ├── RegisterForm.tsx           # User registration form
│   ├── ResetPasswordForm.tsx      # Password reset form
│   ├── StaticUserMenu.tsx         # Static user menu
│   └── UserMenu.tsx               # Dynamic user menu
│
├── generation/                     # Card generation components
│   ├── __tests__/                 # Test files (empty)
│   ├── AccessibilityProvider.tsx  # Accessibility context
│   ├── BulkActionsBar.tsx         # Bulk operations toolbar
│   ├── CardGrid.tsx               # Cards display grid
│   ├── ErrorBoundary.tsx          # Error handling boundary
│   ├── ErrorToast.tsx             # Error notifications
│   ├── FlashCard.tsx              # Individual flash card
│   ├── GeneratePage.tsx           # Main generation page
│   ├── GenerationApp.tsx          # Generation app container
│   ├── GenerationContext.tsx      # Generation state context
│   ├── GenerationStepper.tsx      # Step-by-step generation
│   ├── PasteTextarea.tsx          # Text input area
│   ├── ProgressModal.tsx          # Generation progress modal
│   ├── SaveToSetDialog.tsx        # Save cards dialog
│   └── StartGenerationButton.tsx  # Generation trigger button
│
├── ui/                            # Reusable UI components (Shadcn/ui)
│   ├── alert-dialog.tsx           # Alert dialog component
│   ├── alert.tsx                  # Alert component
│   ├── avatar.tsx                 # User avatar component
│   ├── badge.tsx                  # Badge component
│   ├── button.tsx                 # Button component
│   ├── card.tsx                   # Card component
│   ├── dialog.tsx                 # Dialog component
│   ├── input.tsx                  # Input component
│   ├── progress.tsx               # Progress bar component
│   ├── select.tsx                 # Select dropdown component
│   ├── separator.tsx              # Visual separator
│   ├── skeleton.tsx               # Loading skeleton
│   ├── tabs.tsx                   # Tabs component
│   ├── textarea.tsx               # Textarea component
│   └── ThemeToggle.tsx            # Dark/light theme toggle
│
└── Welcome.astro                  # Welcome page component
```

## Podsumowanie struktury

### 📁 auth/ - Komponenty autoryzacji (13 plików)

- **AuthContainer.tsx** - Główny kontener autoryzacji
- **AuthGuard.tsx** - Ochrona tras i dostęp
- **AuthProvider.tsx** - Kontekst autoryzacji
- **DashboardWrapper.tsx** - Opakowanie dashboardu
- **ForgotPasswordForm.tsx** - Formularz odzyskiwania hasła
- **LoginForm.tsx** - Formularz logowania
- **MigrationModal.tsx** - Modal migracji użytkownika
- **RegisterForm.tsx** - Formularz rejestracji
- **ResetPasswordForm.tsx** - Formularz resetowania hasła
- **StaticUserMenu.tsx** - Statyczne menu użytkownika
- **UserMenu.tsx** - Dynamiczne menu użytkownika
- **index.ts** - Eksporty modułu auth
- **README.md** - Dokumentacja autoryzacji

### 📁 generation/ - Komponenty generowania kart (14 plików)

- **GenerationApp.tsx** - Główna aplikacja generowania
- **GenerationContext.tsx** - Kontekst stanu generowania
- **GeneratePage.tsx** - Strona generowania
- **GenerationStepper.tsx** - Krok po kroku generowanie
- **CardGrid.tsx** - Siatka wyświetlania kart
- **FlashCard.tsx** - Pojedyncza fiszka
- **PasteTextarea.tsx** - Obszar wprowadzania tekstu
- **StartGenerationButton.tsx** - Przycisk rozpoczęcia generowania
- **SaveToSetDialog.tsx** - Dialog zapisywania do zestawu
- **ProgressModal.tsx** - Modal postępu generowania
- **BulkActionsBar.tsx** - Pasek akcji masowych
- **ErrorBoundary.tsx** - Granica obsługi błędów
- **ErrorToast.tsx** - Powiadomienia o błędach
- **AccessibilityProvider.tsx** - Kontekst dostępności

### 📁 ui/ - Komponenty UI (15 plików)

- **Shadcn/ui** - Biblioteka komponentów UI
- **ThemeToggle.tsx** - Przełącznik motywów
- Podstawowe komponenty: button, input, card, dialog, etc.

### 📄 Welcome.astro

- Komponent strony powitalnej

## Statystyki

- **Łącznie komponentów**: 43
- **Kategorie funkcjonalne**: 3 (auth, generation, ui)
- **Pliki testowe**: 1 folder (pusty)
- **Dokumentacja**: 1 plik README w auth/

## Architektura

Projekt wykorzystuje:

- **Astro 5** - Framework główny
- **React 19** - Komponenty dynamiczne
- **TypeScript 5** - Typowanie
- **Tailwind 4** - Stylowanie
- **Shadcn/ui** - Komponenty UI

Struktura jest zorganizowana według domen funkcjonalnych, co ułatwia utrzymanie i rozwój aplikacji.
