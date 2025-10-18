# Testing Environment Setup

## GitHub Actions Environment Variables

The e2e tests on GitHub Actions require the following environment variables to be configured in your repository settings:

### Required Secrets (Repository Settings > Secrets and variables > Actions > Secrets)
- `SUPABASE_URL` - Your test Supabase project URL
- `SUPABASE_KEY` - Your test Supabase anon key
- `OPENROUTER_API_KEY` - Your OpenRouter API key for AI generation
- `E2E_USERNAME` - Test user email for e2e authentication tests
- `E2E_PASSWORD` - Test user password for e2e authentication tests
- `E2E_USERNAME_ID` - Test user ID for e2e authentication tests

### Required Variables (Repository Settings > Secrets and variables > Actions > Variables)
- `PUBLIC_ENV_NAME` - Set to `integration` for test environment

## Local Testing Setup

For local e2e testing, create a `.env.test` file in the project root with:

```bash
# Test Environment Variables
PUBLIC_ENV_NAME=integration

# Supabase configuration for testing
SUPABASE_URL=your_test_supabase_url
SUPABASE_KEY=your_test_supabase_anon_key

# OpenRouter API key for AI generation testing
OPENROUTER_API_KEY=your_openrouter_api_key

# E2E Test credentials (optional - for authentication tests)
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123
E2E_USERNAME_ID=test-user-id
```

## Running Tests Locally

```bash
# Run e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in headed mode
npm run test:e2e:headed
```

## Environment Variable Migration

The codebase has been migrated to use Astro 5's new environment variable system:

- **Server-side secrets**: Use `getSecret()` from `astro:env/server`
- **Client-side public variables**: Use `PUBLIC_ENV_NAME` from `astro:env/client`
- **Legacy support**: `import.meta.env` is still supported for `MODE` and other Astro-specific variables

### Key Changes Made:
1. Updated GitHub Actions workflow to include all required environment variables
2. Migrated all API endpoints to use `getSecret()` instead of `import.meta.env`
3. Updated feature flags to use `PUBLIC_ENV_NAME` from `astro:env/client`
4. Fixed Supabase client configuration to use new environment system

## Troubleshooting

### E2E Tests Failing on GitHub Actions
1. Check that all required secrets are set in repository settings
2. Verify that `PUBLIC_ENV_NAME` variable is set to `integration`
3. Ensure test environment has proper Supabase configuration
4. Check that OpenRouter API key is valid and has sufficient credits

### Local Tests Failing
1. Create `.env.test` file with proper test credentials
2. Ensure test Supabase project is accessible
3. Verify OpenRouter API key is valid
4. Check that test user credentials are correct
