/**
 * Konfiguracja feature flagów dla różnych środowisk
 */

import type { EnvironmentConfig } from "./types";

/**
 * Konfiguracja flag dla wszystkich środowisk
 *
 * Struktura:
 * - local: środowisko deweloperskie
 * - integration: środowisko testowe/staging
 * - prod: środowisko produkcyjne
 */
export const FEATURE_FLAGS_CONFIG: EnvironmentConfig = {
  local: {
    auth: true,
    collections: true,
  },
  integration: {
    auth: true,
    collections: true,
  },
  prod: {
    auth: true,
    collections: true,
  },
} as const;

/**
 * Domyślne wartości flag (używane gdy flaga nie jest zdefiniowana)
 */
export const DEFAULT_FEATURE_FLAGS = {
  auth: false,
  collections: false,
} as const;
