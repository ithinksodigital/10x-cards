import { test, expect } from '@playwright/test'

test.describe('Card Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should navigate to generation page', async ({ page }) => {
    // Click on generate button or link (Polish text)
    await page.click('text=Generuj fiszki')
    
    // Should navigate to generation page
    await page.waitForURL('/generate')
    
    // Wait for React components to load
    await page.waitForLoadState('networkidle')
    
    // Check if generation form is visible
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('button:has-text("Generuj")')).toBeVisible()
  })

  test('should show validation for empty text input', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    // Try to submit empty form
    await page.click('button:has-text("Generuj")')
    
    // Check for validation error (Polish text)
    await expect(page.locator('text=Tekst jest wymagany')).toBeVisible()
  })

  test('should show character count', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    const textarea = page.locator('textarea')
    const testText = 'This is a test text for card generation.'
    
    // Type text
    await textarea.fill(testText)
    
    // Check if character count is displayed (Polish text)
    await expect(page.locator('text=Znaki:')).toBeVisible()
    await expect(page.locator('text=Znaki:')).toContainText(testText.length.toString())
  })

  test('should handle text input limits', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    const textarea = page.locator('textarea')
    const longText = 'a'.repeat(10001) // Exceed 10k character limit
    
    // Try to input text exceeding limit
    await textarea.fill(longText)
    
    // Check for limit warning (Polish text)
    await expect(page.locator('text=Tekst przekracza maksymalną długość')).toBeVisible()
    
    // Submit button should be disabled
    const submitButton = page.locator('button:has-text("Generuj")')
    await expect(submitButton).toBeDisabled()
  })

  test('should generate cards successfully', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    const textarea = page.locator('textarea')
    const testText = 'React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community.'
    
    // Fill in text
    await textarea.fill(testText)
    
    // Submit form
    await page.click('button:has-text("Generuj")')
    
    // Wait for generation to complete (Polish text)
    await expect(page.locator('text=Generowanie fiszek...')).toBeVisible()
    
    // Wait for results
    await expect(page.locator('[data-testid="generated-cards"]')).toBeVisible({ timeout: 30000 })
    
    // Check if cards are displayed
    const cards = page.locator('[data-testid="card"]')
    await expect(cards).toHaveCount.greaterThan(0)
  })

  test('should allow editing generated cards', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    // Generate cards first
    const textarea = page.locator('textarea')
    await textarea.fill('Test text for card generation.')
    await page.click('button:has-text("Generuj")')
    
    // Wait for cards to be generated
    await expect(page.locator('[data-testid="generated-cards"]')).toBeVisible({ timeout: 30000 })
    
    // Click edit button on first card (Polish text)
    const firstCard = page.locator('[data-testid="card"]').first()
    await firstCard.locator('button:has-text("Edytuj")').click()
    
    // Check if edit form is visible
    await expect(firstCard.locator('input[data-testid="card-front"]')).toBeVisible()
    await expect(firstCard.locator('input[data-testid="card-back"]')).toBeVisible()
  })

  test('should allow saving cards to set', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    // Generate cards first
    const textarea = page.locator('textarea')
    await textarea.fill('Test text for card generation.')
    await page.click('button:has-text("Generuj")')
    
    // Wait for cards to be generated
    await expect(page.locator('[data-testid="generated-cards"]')).toBeVisible({ timeout: 30000 })
    
    // Click save button (Polish text)
    await page.click('button:has-text("Zapisz do zestawu")')
    
    // Check if set selection modal is visible
    await expect(page.locator('[data-testid="set-selection-modal"]')).toBeVisible()
    
    // Select a set or create new one (Polish text)
    await page.click('button:has-text("Utwórz nowy zestaw")')
    
    // Fill in set name (Polish text)
    await page.fill('input[placeholder="Nazwa zestawu"]', 'Test Set')
    await page.click('button:has-text("Utwórz i zapisz")')
    
    // Check for success message (Polish text)
    await expect(page.locator('text=Fiszki zostały zapisane pomyślnie')).toBeVisible()
  })

  test('should handle generation errors gracefully', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    // Mock network error
    await page.route('**/api/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Generation failed' })
      })
    })
    
    const textarea = page.locator('textarea')
    await textarea.fill('Test text for card generation.')
    await page.click('button:has-text("Generuj")')
    
    // Check for error message (Polish text)
    await expect(page.locator('text=Generowanie fiszek nie powiodło się')).toBeVisible()
    
    // Check if retry button is available (Polish text)
    await expect(page.locator('button:has-text("Spróbuj ponownie")')).toBeVisible()
  })
})
