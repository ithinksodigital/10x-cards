import { test, expect } from "@playwright/test";

// Validate required environment variables
if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
  throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables are required for e2e tests");
}

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display login form when not authenticated", async ({ page }) => {
    // Navigate to auth page
    await page.goto("/auth/login");

    // Wait for React components to load
    await page.waitForLoadState("networkidle");

    // Check if login form is visible (React component)
    await expect(page.locator("form")).toBeVisible();

    // Check for email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Wait for validation errors to appear
    await page.waitForTimeout(2000);

    // Check for validation errors using correct text
    await expect(page.locator('p.text-destructive:has-text("Nieprawidłowy adres email")')).toBeVisible();
    await expect(page.locator('p.text-destructive:has-text("Hasło musi mieć co najmniej 6 znaków")')).toBeVisible();
  });

  test("should show validation error for invalid email", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Fill in invalid email and valid password
    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', "password123");

    // Submit form (should be blocked by HTML5 validation)
    await page.click('button[type="submit"]');

    // Wait a bit for any validation to trigger
    await page.waitForTimeout(1000);

    // Check if HTML5 validation is working (form should not be submitted)
    const emailInput = page.locator('input[type="email"]');
    const isFormValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());

    console.log(`Form validity: ${isFormValid}`);

    // HTML5 validation should prevent form submission for invalid email
    expect(isFormValid).toBe(false);

    // Verify we're still on the login page (form was not submitted)
    await expect(page).toHaveURL("/auth/login");
  });

  test("should handle successful login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Fill in valid credentials from environment variables
    await page.fill('input[type="email"]', process.env.E2E_USERNAME!);
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD!);

    // Submit form and wait for navigation
    await Promise.all([page.waitForURL("/dashboard"), page.click('button[type="submit"]')]);

    // Check if user is redirected to dashboard
    await expect(page).toHaveURL("/dashboard");
  });

  test("should handle login error", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Fill in invalid credentials
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Submit form and wait for response
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check for error message (Polish text) - use more flexible selector
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();

    // Check if error message contains expected text (English from Supabase)
    const errorText = await errorAlert.textContent();
    expect(errorText).toContain("Invalid login credentials");
  });

  test("should allow password reset", async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");

    // Click forgot password link (Polish text)
    await page.click("text=Zapomniałeś hasła?");

    // Should switch to forgot password form (no navigation, just form switch)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should handle logout", async ({ page }) => {
    // First login (assuming we have a way to mock this)
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
    await page.fill('input[type="email"]', process.env.E2E_USERNAME!);
    await page.fill('input[type="password"]', process.env.E2E_PASSWORD!);

    // Submit form and wait for navigation
    await Promise.all([page.waitForURL("/dashboard"), page.click('button[type="submit"]')]);

    // Wait for React components to load
    await page.waitForLoadState("networkidle");

    // Click on user button to open menu
    const userButton = page.locator(`button:has-text("${process.env.E2E_USERNAME}")`);
    await expect(userButton).toBeVisible();
    await userButton.click();

    // Wait for menu to open and find logout button
    const logoutButton = page.locator('button:has-text("Wyloguj się")');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });

    // Click logout and wait for redirect
    await Promise.all([page.waitForURL("/"), logoutButton.click()]);

    // Check if user is logged out (Polish text)
    await expect(page.locator("text=Zaloguj się")).toBeVisible();
  });
});
