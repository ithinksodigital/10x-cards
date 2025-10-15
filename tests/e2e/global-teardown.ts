import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting global teardown...");

  try {
    // Optional: Clean up any global resources
    // For example, remove test data, close connections, etc.

    console.log("✅ Global teardown completed successfully");
  } catch (error) {
    console.error("❌ Global teardown failed:", error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;
