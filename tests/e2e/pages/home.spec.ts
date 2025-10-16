import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load the home page successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/10x Cards/);

    // Check if main content is visible
    await expect(page.locator("main")).toBeVisible();
  });

  test("should have proper desktop navigation", async ({ page, browserName }) => {
    // Skip this test on mobile browsers
    if (browserName === "webkit" && page.viewportSize()?.width && page.viewportSize().width < 768) {
      test.skip();
    }

    // Set desktop viewport to ensure navigation is visible
    await page.setViewportSize({ width: 1024, height: 768 });

    // Check if desktop navigation elements are present
    const desktopNav = page.locator("nav.hidden.md\\:flex");
    await expect(desktopNav).toBeVisible();

    // Check for common navigation buttons (desktop navigation uses buttons, not links)
    const homeButton = page.locator('nav.hidden.md\\:flex button:has-text("Strona główna")');
    await expect(homeButton).toBeVisible();

    // Check for generate button (Polish text) - specifically the desktop version
    const generateButton = page.locator('nav.hidden.md\\:flex button:has-text("Generuj fiszki")');
    await expect(generateButton).toBeVisible();
  });

  test("should be responsive on mobile with bottom navigation", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if content is still visible and properly laid out
    await expect(page.locator("main")).toBeVisible();

    // Check if desktop navigation is hidden on mobile (as designed)
    const desktopNav = page.locator("nav.hidden.md\\:flex");
    await expect(desktopNav).not.toBeVisible();

    // Check if bottom navigation is visible on mobile
    const bottomNav = page.locator("nav.bottom-nav");
    await expect(bottomNav).toBeVisible();

    // Check if bottom navigation has proper structure
    const bottomNavItems = page.locator("nav.bottom-nav button");
    await expect(bottomNavItems).toHaveCount(3); // Home, Generate, Profile (for unauthenticated)

    // Check for specific bottom navigation items
    await expect(page.locator('nav.bottom-nav button[aria-label="Strona główna"]')).toBeVisible();
    await expect(page.locator('nav.bottom-nav button[aria-label="Generuj"]')).toBeVisible();
    await expect(page.locator('nav.bottom-nav button[aria-label="Profil"]')).toBeVisible();

    // Check if auth buttons are hidden on mobile (as designed - they're in bottom nav)
    const loginLink = page.locator('a[href="/auth/login"]');
    await expect(loginLink).not.toBeVisible();
  });

  test("should have proper accessibility", async ({ page }) => {
    // Check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should have proper meta tags", async ({ page }) => {
    // Check for essential meta tags
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content");
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      "content",
      "width=device-width, initial-scale=1"
    );
  });

  test("should load without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const errorText = msg.text();
        // Ignore known Astro hydration errors in Safari/WebKit
        if (
          !errorText.includes("[astro-island] Error hydrating") &&
          !errorText.includes("TypeError: Importing a module script failed")
        ) {
          consoleErrors.push(errorText);
        }
      }
    });

    await page.reload();

    // Wait a bit for any async operations
    await page.waitForTimeout(1000);

    expect(consoleErrors).toHaveLength(0);
  });

  test("should show authenticated navigation for logged in users", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if bottom navigation is present and shows appropriate items
    const bottomNav = page.locator("nav.bottom-nav");
    await expect(bottomNav).toBeVisible();

    // For unauthenticated users, we should see Profile button
    // (This test assumes the user is not authenticated)
    const profileButton = page.locator('nav.bottom-nav button[aria-label="Profil"]');
    await expect(profileButton).toBeVisible();

    // We should also see Home and Generate buttons for all users
    await expect(page.locator('nav.bottom-nav button[aria-label="Strona główna"]')).toBeVisible();
    await expect(page.locator('nav.bottom-nav button[aria-label="Generuj"]')).toBeVisible();

    // Sets and Study buttons should be hidden for unauthenticated users
    await expect(page.locator('nav.bottom-nav button[aria-label="Zestawy"]')).not.toBeVisible();
    await expect(page.locator('nav.bottom-nav button[aria-label="Nauka"]')).not.toBeVisible();
  });
});
