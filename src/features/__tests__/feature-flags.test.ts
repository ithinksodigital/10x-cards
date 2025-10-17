/**
 * Testy jednostkowe dla systemu feature flagów
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isFeatureEnabled, getFeatureFlags, resetFeatureFlagsCache } from '../feature-flags';

describe('Feature Flags System', () => {
  beforeEach(() => {
    resetFeatureFlagsCache();
  });

  describe('basic functionality', () => {
    it('should return boolean values for feature flags', () => {
      const authEnabled = isFeatureEnabled('auth');
      const collectionsEnabled = isFeatureEnabled('collections');
      
      expect(typeof authEnabled).toBe('boolean');
      expect(typeof collectionsEnabled).toBe('boolean');
    });

    it('should return all flags as an object', () => {
      const flags = getFeatureFlags();
      
      expect(flags).toHaveProperty('auth');
      expect(flags).toHaveProperty('collections');
      expect(typeof flags.auth).toBe('boolean');
      expect(typeof flags.collections).toBe('boolean');
    });

    it('should reset cache when resetFeatureFlagsCache is called', () => {
      // First call to load cache
      const flags1 = getFeatureFlags();
      
      // Reset cache
      resetFeatureFlagsCache();
      
      // Second call should work without errors
      const flags2 = getFeatureFlags();
      
      expect(typeof flags1).toBe('object');
      expect(typeof flags2).toBe('object');
    });
  });

  describe('configuration', () => {
    it('should have valid configuration structure', () => {
      const flags = getFeatureFlags();
      
      // Check that all expected flags exist
      expect(flags).toHaveProperty('auth');
      expect(flags).toHaveProperty('collections');
      
      // Check that values are boolean
      expect(typeof flags.auth).toBe('boolean');
      expect(typeof flags.collections).toBe('boolean');
    });
  });
});
