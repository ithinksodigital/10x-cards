import { test, expect } from '@playwright/test'

test.describe('Card Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForURL('/dashboard'),
      page.click('button[type="submit"]')
    ])
  })

  test('should navigate to generation page', async ({ page }) => {
    // Click on generate button or link (English text)
    await page.click('text=Generate New Cards')
    
    // Should navigate to generation page
    await page.waitForURL('/generate')
    
    // Wait for React components to load
    await page.waitForLoadState('networkidle')
    
    // Check if generation form is visible
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('button:has-text("Generate Flashcards")')).toBeVisible()
  })

  test('should show validation for empty text input', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    // Check that submit button is disabled for empty form
    const submitButton = page.locator('button:has-text("Generate Flashcards")')
    await expect(submitButton).toBeDisabled()
    
    // Type some text but not enough (less than 100 characters)
    await page.fill('textarea', 'Short text')
    
    // Check for validation message (English text)
    await expect(page.locator('text=Text must be at least 100 characters')).toBeVisible()
  })

  test('should show character count', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    const textarea = page.locator('textarea')
    const testText = 'This is a test text for card generation.'
    
    // Type text
    await textarea.fill(testText)
    
    // Check if character count is displayed (English text)
    await expect(page.locator('text=/\\d+ / 15,000/')).toBeVisible()
    await expect(page.locator('text=/\\d+ / 15,000/')).toContainText(testText.length.toString())
  })

  test('should handle text input limits', async ({ page }) => {
    await page.goto('/generate')
    await page.waitForLoadState('networkidle')
    
    const textarea = page.locator('textarea')
    const longText = 'a'.repeat(15001) // Exceed 15k character limit
    
    // Try to input text exceeding limit
    await textarea.fill(longText)
    
    // Check for limit warning (English text)
    await expect(page.locator('text=Text must not exceed 15000 characters')).toBeVisible()
    
    // Submit button should be disabled
    const submitButton = page.locator('button:has-text("Generate Flashcards")')
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
    await page.click('button:has-text("Generate Flashcards")')
    
    // Wait for generation to complete (English text)
    await expect(page.locator('text=Generating...')).toBeVisible()
    
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
    await textarea.fill('React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community. React allows developers to create reusable UI components and build complex applications with ease. The library uses a virtual DOM to optimize rendering performance and provides a declarative approach to building user interfaces.')
    await page.click('button:has-text("Generate Flashcards")')
    
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
    await textarea.fill('React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community. React allows developers to create reusable UI components and build complex applications with ease. The library uses a virtual DOM to optimize rendering performance and provides a declarative approach to building user interfaces.')
    await page.click('button:has-text("Generate Flashcards")')
    
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
    await textarea.fill('React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community. React allows developers to create reusable UI components and build complex applications with ease. The library uses a virtual DOM to optimize rendering performance and provides a declarative approach to building user interfaces.')
    await page.click('button:has-text("Generate Flashcards")')
    
    // Check for error message (English text)
    await expect(page.locator('text=Generation Failed')).toBeVisible()
    
    // Check if retry button is available (English text)
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible()
  })
})
