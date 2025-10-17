# Deployment Guide - Cloudflare Pages

## Przegląd

Projekt został skonfigurowany do deploymentu na Cloudflare Pages z wykorzystaniem GitHub Actions. Konfiguracja obejmuje:

- **Astro 5** z adapterem Cloudflare
- **Server-side rendering** (wszystkie strony + API routes)
- **Automatyczny deployment** przy push na branch `master`
- **Testy jednostkowe** przed deploymentem

## Wymagane zmienne środowiskowe

### GitHub Secrets (dane poufne)

W ustawieniach repozytorium GitHub → **Secrets and variables** → **Actions** → **Secrets** dodaj:

```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### GitHub Environment Variables (dane niepoufne)

W ustawieniach repozytorium GitHub → **Secrets and variables** → **Actions** → **Variables** dodaj:

```
CLOUDFLARE_PROJECT_NAME=10x-cards
PUBLIC_ENV_NAME=prod
```

**Uwaga**: Environment Variables są dostępne przez `${{ vars.VARIABLE_NAME }}`, a Secrets przez `${{ secrets.SECRET_NAME }}`.

### Cloudflare Pages Environment Variables

W ustawieniach projektu Cloudflare Pages dodaj:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
PUBLIC_ENV_NAME=production
```

## Konfiguracja Cloudflare

### 1. Utwórz projekt Cloudflare Pages

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wybierz **Pages** z menu bocznego
3. Kliknij **Create a project**
4. Wybierz **Connect to Git**
5. Połącz z repozytorium GitHub

### 2. Skonfiguruj build settings

```
Build command: npm run build
Build output directory: dist
Root directory: /
```

### 3. Ustawienia środowiska

- **Node.js version**: 20
- **Environment variables**: Dodaj wszystkie wymagane zmienne

### 4. Konfiguracja domeny

Po utworzeniu projektu Cloudflare Pages:

1. Skopiuj URL projektu (np. `https://your-project-name.pages.dev`)
2. Zaktualizuj `site` w `astro.config.mjs`:
   ```javascript
   site: "https://your-project-name.pages.dev"
   ```
3. Zaktualizuj plik i wdróż ponownie

## Workflow GitHub Actions

Workflow `master.yml` wykonuje następujące kroki:

1. **Checkout** kodu
2. **Setup Node.js** (wersja 20)
3. **Install dependencies** (`npm ci`)
4. **Lint** kodu
5. **Unit tests**
6. **Build** aplikacji
7. **Deploy** na Cloudflare Pages

### Trigger

Workflow uruchamia się automatycznie przy:
- Push na branch `master`
- Manual trigger (`workflow_dispatch`)

## Struktura projektu

```
src/
├── pages/           # Astro pages (statyczne)
├── pages/api/       # API routes (dynamiczne)
├── components/      # React/Astro komponenty
├── layouts/         # Astro layouts
└── lib/            # Utilities i services
```

## API Routes

Projekt zawiera następujące API endpoints:

- `/api/auth/*` - Autentykacja
- `/api/sets/*` - Zarządzanie zestawami
- `/api/cards/*` - Zarządzanie kartami
- `/api/generations/*` - Generowanie treści AI
- `/api/srs/*` - Spaced Repetition System

## Troubleshooting

### Build failures

1. Sprawdź logi GitHub Actions
2. Zweryfikuj zmienne środowiskowe
3. Upewnij się, że wszystkie dependencies są zainstalowane

### Deployment issues

1. Sprawdź Cloudflare API token permissions
2. Zweryfikuj Account ID
3. Upewnij się, że projekt istnieje w Cloudflare Pages

### Environment variables

1. Sprawdź czy wszystkie secrets są ustawione w GitHub
2. Zweryfikuj environment variables w Cloudflare Pages
3. Upewnij się, że nazwy zmiennych są identyczne

## Monitoring

- **GitHub Actions**: Sprawdź status workflow w zakładce Actions
- **Cloudflare Pages**: Monitoruj deployment w Cloudflare Dashboard
- **Logs**: Dostępne w Cloudflare Pages Analytics

## Bezpieczeństwo

- Wszystkie klucze API są przechowywane jako secrets
- RLS (Row Level Security) w Supabase
- CORS ograniczony do domeny aplikacji
- Rate limiting na API endpoints
