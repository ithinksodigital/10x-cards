import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form when not authenticated', async ({ page }) => {
    // Navigate to auth page
    await page.goto('/auth/signin')
    
    // Check if login form is visible
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
    await page.goto('/auth/signin')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should handle successful login', async ({ page }) => {
    await page.goto('/auth/signin')
    
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
    await page.goto('/auth/signin')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should allow password reset', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Click forgot password link
    await page.click('text=Forgot password?')
    
    // Should navigate to reset password page
    await page.waitForURL('/auth/reset-password')
    
    // Check if reset form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle logout', async ({ page }) => {
    // First login (assuming we have a way to mock this)
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout")')
    await expect(logoutButton).toBeVisible()
    await logoutButton.click()
    
    // Should redirect to home page
    await page.waitForURL('/')
    
    // Check if user is logged out
    await expect(page.locator('text=Sign In')).toBeVisible()
  })
})
