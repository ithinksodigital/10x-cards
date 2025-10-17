/**
 * Testy integracyjne dla systemu feature flagów
 */

import { describe, it, expect, beforeEach } from "vitest";
import { isFeatureEnabled, getFeatureFlags, resetFeatureFlagsCache } from "../feature-flags";

describe("Feature Flags Integration", () => {
  beforeEach(() => {
    resetFeatureFlagsCache();
  });

  describe("Environment-specific behavior", () => {
    it("should work with different environment configurations", () => {
      // Test that the system works regardless of environment
      const flags = getFeatureFlags();
      
      // Should always return an object with expected properties
      expect(flags).toHaveProperty("auth");
      expect(flags).toHaveProperty("collections");
      expect(typeof flags.auth).toBe("boolean");
      expect(typeof flags.collections).toBe("boolean");
    });

    it("should handle individual flag checks", () => {
      // Test individual flag checks
      const authEnabled = isFeatureEnabled("auth");
      const collectionsEnabled = isFeatureEnabled("collections");
      
      expect(typeof authEnabled).toBe("boolean");
      expect(typeof collectionsEnabled).toBe("boolean");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid flag names gracefully", () => {
      // This should not throw an error
      expect(() => {
        // @ts-expect-error - testing invalid flag name
        isFeatureEnabled("invalid-flag");
      }).not.toThrow();
    });

    it("should return consistent results", () => {
      // Multiple calls should return the same result
      const firstCall = isFeatureEnabled("auth");
      const secondCall = isFeatureEnabled("auth");
      
      expect(firstCall).toBe(secondCall);
    });
  });

  describe("Performance", () => {
    it("should cache results efficiently", () => {
      // First call should load and cache
      const start = performance.now();
      const flags1 = getFeatureFlags();
      const firstCallTime = performance.now() - start;
      
      // Second call should be faster (cached)
      const start2 = performance.now();
      const flags2 = getFeatureFlags();
      const secondCallTime = performance.now() - start2;
      
      // Results should be identical
      expect(flags1).toEqual(flags2);
      
      // Second call should be faster (though this might not always be true in test environment)
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime);
    });
  });
});
