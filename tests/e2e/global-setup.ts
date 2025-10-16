import { chromium } from "@playwright/test";
import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log("🚀 Starting global setup...");

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the application to be ready
    console.log(`📡 Checking if application is ready at ${baseURL}`);
    await page.goto(baseURL || "http://localhost:3000");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Optional: Perform any global setup tasks
    // For example, seed test data, authenticate, etc.

    console.log("✅ Global setup completed successfully");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
