import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form when not authenticated', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth/login')
    
    // Wait for React components to load
    await page.waitForLoadState('networkidle')
    
    // Check if login form is visible (React component)
    await expect(page.locator('form')).toBeVisible()
    
    // Check for email input
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation errors (Polish text)
    await expect(page.locator('text=Email jest wymagany')).toBeVisible()
    await expect(page.locator('text=Hasło jest wymagane')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for email validation error (Polish text)
    await expect(page.locator('text=Wprowadź prawidłowy adres email')).toBeVisible()
  })

  test('should handle successful login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Fill in valid credentials
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Check if user is redirected to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle login error', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for error message (Polish text)
    await expect(page.locator('text=Nieprawidłowy email lub hasło')).toBeVisible()
  })

  test('should allow password reset', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    
    // Click forgot password link (Polish text)
    await page.click('text=Zapomniałeś hasła?')
    
    // Should switch to forgot password form (no navigation, just form switch)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    // First login (assuming we have a way to mock this)
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    
    // Find and click logout button (Polish text)
    const logoutButton = page.locator('button:has-text("Wyloguj się")')
    await expect(logoutButton).toBeVisible()
    await logoutButton.click()
    
    // Should redirect to home page
    await page.waitForURL('/')
    
    // Check if user is logged out (Polish text)
    await expect(page.locator('text=Zaloguj się')).toBeVisible()
  })
})
