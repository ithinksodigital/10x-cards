/**
 * Typy dla systemu feature flagów
 */

export type Environment = "local" | "integration" | "prod";

export type FeatureFlag = "auth" | "collections";

export interface FeatureFlags {
  auth: boolean;
  collections: boolean;
}

export interface EnvironmentConfig {
  local: FeatureFlags;
  integration: FeatureFlags;
  prod: FeatureFlags;
}
