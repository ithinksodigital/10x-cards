/**
 * Główny moduł feature flagów
 *
 * Zapewnia funkcje do sprawdzania stanu flag w różnych środowiskach.
 * Flagi są ładowane raz przy starcie aplikacji i cache'owane.
 */

import type { Environment, FeatureFlag, FeatureFlags } from "./types";
import { FEATURE_FLAGS_CONFIG, DEFAULT_FEATURE_FLAGS } from "./config";
import { PUBLIC_ENV_NAME } from "astro:env/client";

/**
 * Cache dla flag - ładowane raz przy pierwszym użyciu
 */
let cachedFlags: FeatureFlags | null = null;

/**
 * Pobiera aktualne środowisko z zmiennej PUBLIC_ENV_NAME
 */
function getCurrentEnvironment(): Environment {
  // Use Astro 5 environment variables system
  const envName = PUBLIC_ENV_NAME;
  if (!envName) {
    // console.warn("PUBLIC_ENV_NAME not set, defaulting to \"local\"");
    return "local";
  }

  const validEnvironments: Environment[] = ["local", "integration", "prod"];
  if (!validEnvironments.includes(envName as Environment)) {
    // console.warn(`Invalid PUBLIC_ENV_NAME: ${envName}, defaulting to "local"`);
    return "local";
  }

  return envName as Environment;
}

/**
 * Ładuje flagi dla aktualnego środowiska
 */
function loadFeatureFlags(): FeatureFlags {
  const environment = getCurrentEnvironment();
  const environmentFlags = FEATURE_FLAGS_CONFIG[environment];
  // Merge z wartościami domyślnymi dla bezpieczeństwa
  const flags = {
    auth: environmentFlags.auth ?? DEFAULT_FEATURE_FLAGS.auth,
    collections: environmentFlags.collections ?? DEFAULT_FEATURE_FLAGS.collections,
  };

  // Cache tylko jeśli nie ma cache lub środowisko się nie zmieniło
  if (!cachedFlags) {
    cachedFlags = flags;
    // console.log(`Feature flags loaded for environment: ${environment}`, cachedFlags);
  }

  return flags;
}

/**
 * Sprawdza czy dana flaga jest włączona
 *
 * @param flag - nazwa flagi do sprawdzenia
 * @returns true jeśli flaga jest włączona, false w przeciwnym razie
 *
 * @example
 * ```typescript
 * // W komponencie React
 * if (isFeatureEnabled('auth')) {
 *   return <AuthComponent />;
 * }
 *
 * // W API endpoint
 * if (!isFeatureEnabled('collections')) {
 *   return new Response('Feature not available', { status: 404 });
 * }
 * ```
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const flags = loadFeatureFlags();
  return flags[flag] ?? DEFAULT_FEATURE_FLAGS[flag];
}

/**
 * Pobiera wszystkie flagi dla aktualnego środowiska
 *
 * @returns obiekt z wszystkimi flagami
 *
 * @example
 * ```typescript
 * const flags = getFeatureFlags();
 * if (flags.auth && flags.collections) {
 *   // obie flagi są włączone
 * }
 * ```
 */
export function getFeatureFlags(): FeatureFlags {
  return loadFeatureFlags();
}

/**
 * Resetuje cache flag (przydatne w testach)
 *
 * @internal
 */
export function resetFeatureFlagsCache(): void {
  cachedFlags = null;
}
