# Diagram architektury systemu autentykacji - Flash Cards AI v2

## Diagram Mermaid

```mermaid
graph TB
    %% Użytkownicy
    User[👤 Użytkownik]
    AnonymousUser[👤 Użytkownik Anonimowy]
    AuthenticatedUser[👤 Użytkownik Uwierzytelniony]

    %% Frontend - Strony Astro
    subgraph "Frontend - Astro Pages"
        IndexPage["📄 index.astro<br/>Strona główna"]
        GeneratePage["📄 generate.astro<br/>Generowanie fiszek"]
        LoginPage["📄 auth/login.astro<br/>Strona logowania"]
        DashboardPage["📄 dashboard.astro<br/>Dashboard (chroniony)"]
    end

    %% Frontend - Komponenty React
    subgraph "Frontend - React Components"
        AuthProvider["🔐 AuthProvider.tsx<br/>Context autentykacji"]
        LoginForm["📝 LoginForm.tsx<br/>Formularz logowania"]
        UserMenu["👤 UserMenu.tsx<br/>Menu użytkownika"]
        AuthGuard["🛡️ AuthGuard.tsx<br/>Ochrona komponentów"]
        MigrationModal["🔄 MigrationModal.tsx<br/>Migracja danych"]
        GenerationApp["⚡ GenerationApp.tsx<br/>Aplikacja generowania"]
        SaveToSetDialog["💾 SaveToSetDialog.tsx<br/>Zapis do zestawu"]
        ConversionPrompt["💡 ConversionPrompt.tsx<br/>Prompt konwersji"]
    end

    %% Middleware i Hooks
    subgraph "Middleware & Hooks"
        AuthMiddleware["🔧 middleware/index.ts<br/>Middleware autentykacji"]
        UseAuth["🎣 useAuth.ts<br/>Hook autentykacji"]
        UseGenerationApi["🎣 useGenerationApi.ts<br/>Hook API generowania"]
    end

    %% API Endpoints
    subgraph "API Endpoints"
        subgraph "Anonimowe API"
            AnonymousGenerate["🔓 POST /api/anonymous/generate<br/>Generowanie bez auth"]
            AnonymousReview["🔓 POST /api/anonymous/review<br/>Przegląd bez auth"]
        end

        subgraph "Uwierzytelnione API"
            AuthCallback["🔐 GET /api/auth/callback<br/>OAuth callback"]
            AuthLogout["🔐 POST /api/auth/logout<br/>Wylogowanie"]
            MigrateAPI["🔄 POST /api/migrate/anonymous-to-account<br/>Migracja danych"]
            SetsAPI["📚 /api/sets<br/>Zarządzanie zestawami"]
            CardsAPI["🃏 /api/cards<br/>Zarządzanie fiszkami"]
            SRSAPI["📖 /api/srs<br/>Sesje nauki"]
        end
    end

    %% Supabase Services
    subgraph "Supabase Services"
        SupabaseAuth["🔐 Supabase Auth<br/>Email/Password"]
        SupabaseDB["🗄️ Supabase Database<br/>PostgreSQL + RLS"]
        SupabaseClient["📡 Supabase Client<br/>SDK"]
    end

    %% Storage Layers
    subgraph "Storage"
        LocalStorage["💾 localStorage<br/>Dane anonimowe (24h)"]
        SessionStorage["💾 sessionStorage<br/>Dane sesji"]
        DatabaseTables["🗃️ Database Tables<br/>profiles, sets, cards, generations"]
    end

    %% Rate Limiting
    subgraph "Rate Limiting"
        AnonymousLimits["⏱️ Anonimowi<br/>3 generacje/godzinę"]
        AuthLimits["⏱️ Uwierzytelnieni<br/>50 generacji/godzinę"]
    end

    %% User Flows
    User --> IndexPage
    AnonymousUser --> GeneratePage
    AuthenticatedUser --> DashboardPage

    %% Anonymous Flow
    AnonymousUser --> GenerationApp
    GenerationApp --> AnonymousGenerate
    AnonymousGenerate --> LocalStorage
    AnonymousGenerate --> SessionStorage
    GenerationApp --> ConversionPrompt
    ConversionPrompt --> LoginForm
    LoginForm --> AuthProvider

    %% Authentication Flow
    AuthProvider --> UseAuth
    UseAuth --> SupabaseClient
    SupabaseClient --> SupabaseAuth
    SupabaseAuth --> AuthCallback
    AuthCallback --> MigrationModal
    MigrationModal --> MigrateAPI
    MigrateAPI --> DatabaseTables

    %% Authenticated Flow
    AuthenticatedUser --> AuthGuard
    AuthGuard --> GenerationApp
    GenerationApp --> SaveToSetDialog
    SaveToSetDialog --> SetsAPI
    SetsAPI --> DatabaseTables

    %% Middleware Flow
    IndexPage --> AuthMiddleware
    GeneratePage --> AuthMiddleware
    DashboardPage --> AuthMiddleware
    AuthMiddleware --> SupabaseClient

    %% API Security
    AnonymousGenerate --> AnonymousLimits
    SetsAPI --> AuthLimits
    CardsAPI --> AuthLimits
    SRSAPI --> AuthLimits

    %% Database Security
    DatabaseTables --> SupabaseDB
    SupabaseDB --> SupabaseAuth
    SupabaseAuth --> AuthLimits

    %% Styling
    classDef userClass fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef pageClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef componentClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef apiClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef storageClass fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef authClass fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef limitClass fill:#f1f8e9,stroke:#33691e,stroke-width:2px

    class User,AnonymousUser,AuthenticatedUser userClass
    class IndexPage,GeneratePage,LoginPage,DashboardPage pageClass
    class AuthProvider,LoginForm,UserMenu,AuthGuard,MigrationModal,GenerationApp,SaveToSetDialog,ConversionPrompt componentClass
    class AnonymousGenerate,AnonymousReview,AuthCallback,AuthLogout,MigrateAPI,SetsAPI,CardsAPI,SRSAPI apiClass
    class LocalStorage,SessionStorage,DatabaseTables storageClass
    class SupabaseAuth,SupabaseDB,SupabaseClient,AuthMiddleware,UseAuth authClass
    class AnonymousLimits,AuthLimits limitClass
```

## Opis architektury

### 1. Tryb Anonimowy

- **Użytkownik anonimowy** może korzystać z aplikacji bez logowania
- **Generowanie fiszek** odbywa się przez endpoint `/api/anonymous/generate`
- **Dane przechowywane** w localStorage (24h) i sessionStorage
- **Rate limiting**: 3 generacje na godzinę
- **Prompt konwersji** pojawia się po zaakceptowaniu fiszek

### 2. Tryb Uwierzytelniony

- **Logowanie** przez email/password (Supabase Auth)
- **Pełna funkcjonalność** z persystencją danych
- **Rate limiting**: 50 generacji na godzinę
- **RLS (Row Level Security)** zapewnia izolację danych

### 3. Migracja Danych

- **Wykrycie danych anonimowych** po zalogowaniu
- **Modal migracji** z opcją wyboru zestawu
- **Przeniesienie danych** z localStorage do Supabase
- **Czyszczenie** danych lokalnych po migracji

### 4. Bezpieczeństwo

- **Middleware autentykacji** sprawdza stan na serwerze
- **RLS policies** chronią dane na poziomie bazy
- **Rate limiting** zapobiega nadużyciom
- **JWT tokeny** Supabase zapewniają bezpieczną autentykację

### 5. Komponenty Kluczowe

- **AuthProvider**: Zarządza stanem autentykacji
- **AuthGuard**: Chroni komponenty wymagające logowania
- **MigrationModal**: Obsługuje przeniesienie danych
- **ConversionPrompt**: Zachęca do konwersji z trybu anonimowego

## Scenariusze użycia

### Scenariusz 1: Użytkownik anonimowy

1. Wchodzi na stronę bez logowania
2. Generuje fiszki (dane w localStorage)
3. Przegląda i selekcjonuje fiszki
4. Otrzymuje prompt "Zapisz do konta"
5. Loguje się i migruje dane

### Scenariusz 2: Użytkownik uwierzytelniony

1. Wchodzi na stronę zalogowany
2. Widzi dashboard z zestawami
3. Generuje fiszki (dane w Supabase)
4. Zapisuje do zestawu
5. Rozpoczyna sesję SRS

### Scenariusz 3: Migracja danych

1. System wykrywa dane w localStorage
2. Pojawia się modal migracji
3. Użytkownik wybiera zestaw docelowy
4. Dane są przenoszone do Supabase
5. localStorage jest czyszczony
