/**
 * Feature Flags System
 *
 * Uniwersalny moduł do zarządzania flagami funkcjonalności
 * w różnych środowiskach (local, integration, prod).
 *
 * Użycie:
 * - Frontend: import { isFeatureEnabled } from '@/features'
 * - Backend: import { isFeatureEnabled } from '@/features'
 */

export { isFeatureEnabled, getFeatureFlags } from "./feature-flags";
export type { FeatureFlag, Environment, FeatureFlags } from "./types";
