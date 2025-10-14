import { test, expect } from '@playwright/test'

test.describe('Card Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('should navigate to generation page', async ({ page }) => {
    // Click on generate button or link
    await page.click('text=Generate Cards')
    
    // Should navigate to generation page
    await page.waitForURL('/generate')
    
    // Check if generation form is visible
    await expect(page.locator('textarea')).toBeVisible()
    await expect(page.locator('button:has-text("Generate")')).toBeVisible()
  })

  test('should show validation for empty text input', async ({ page }) => {
    await page.goto('/generate')
    
    // Try to submit empty form
    await page.click('button:has-text("Generate")')
    
    // Check for validation error
    await expect(page.locator('text=Text is required')).toBeVisible()
  })

  test('should show character count', async ({ page }) => {
    await page.goto('/generate')
    
    const textarea = page.locator('textarea')
    const testText = 'This is a test text for card generation.'
    
    // Type text
    await textarea.fill(testText)
    
    // Check if character count is displayed
    await expect(page.locator('text=Characters:')).toBeVisible()
    await expect(page.locator('text=Characters:')).toContainText(testText.length.toString())
  })

  test('should handle text input limits', async ({ page }) => {
    await page.goto('/generate')
    
    const textarea = page.locator('textarea')
    const longText = 'a'.repeat(10001) // Exceed 10k character limit
    
    // Try to input text exceeding limit
    await textarea.fill(longText)
    
    // Check for limit warning
    await expect(page.locator('text=Text exceeds maximum length')).toBeVisible()
    
    // Submit button should be disabled
    const submitButton = page.locator('button:has-text("Generate")')
    await expect(submitButton).toBeDisabled()
  })

  test('should generate cards successfully', async ({ page }) => {
    await page.goto('/generate')
    
    const textarea = page.locator('textarea')
    const testText = 'React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community.'
    
    // Fill in text
    await textarea.fill(testText)
    
    // Submit form
    await page.click('button:has-text("Generate")')
    
    // Wait for generation to complete
    await expect(page.locator('text=Generating cards...')).toBeVisible()
    
    // Wait for results
    await expect(page.locator('[data-testid="generated-cards"]')).toBeVisible({ timeout: 30000 })
    
    // Check if cards are displayed
    const cards = page.locator('[data-testid="card"]')
    await expect(cards).toHaveCount.greaterThan(0)
  })

  test('should allow editing generated cards', async ({ page }) => {
    await page.goto('/generate')
    
    // Generate cards first
    const textarea = page.locator('textarea')
    await textarea.fill('Test text for card generation.')
    await page.click('button:has-text("Generate")')
    
    // Wait for cards to be generated
    await expect(page.locator('[data-testid="generated-cards"]')).toBeVisible({ timeout: 30000 })
    
    // Click edit button on first card
    const firstCard = page.locator('[data-testid="card"]').first()
    await firstCard.locator('button:has-text("Edit")').click()
    
    // Check if edit form is visible
    await expect(firstCard.locator('input[data-testid="card-front"]')).toBeVisible()
    await expect(firstCard.locator('input[data-testid="card-back"]')).toBeVisible()
  })

  test('should allow saving cards to set', async ({ page }) => {
    await page.goto('/generate')
    
    // Generate cards first
    const textarea = page.locator('textarea')
    await textarea.fill('Test text for card generation.')
    await page.click('button:has-text("Generate")')
    
    // Wait for cards to be generated
    await expect(page.locator('[data-testid="generated-cards"]')).toBeVisible({ timeout: 30000 })
    
    // Click save button
    await page.click('button:has-text("Save to Set")')
    
    // Check if set selection modal is visible
    await expect(page.locator('[data-testid="set-selection-modal"]')).toBeVisible()
    
    // Select a set or create new one
    await page.click('button:has-text("Create New Set")')
    
    // Fill in set name
    await page.fill('input[placeholder="Set name"]', 'Test Set')
    await page.click('button:has-text("Create and Save")')
    
    // Check for success message
    await expect(page.locator('text=Cards saved successfully')).toBeVisible()
  })

  test('should handle generation errors gracefully', async ({ page }) => {
    await page.goto('/generate')
    
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
    await page.click('button:has-text("Generate")')
    
    // Check for error message
    await expect(page.locator('text=Failed to generate cards')).toBeVisible()
    
    // Check if retry button is available
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible()
  })
})
