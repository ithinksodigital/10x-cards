import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the home page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/10x Cards/)
    
    // Check if main content is visible
    await expect(page.locator('main')).toBeVisible()
  })

  test('should have proper navigation', async ({ page }) => {
    // Check if navigation elements are present (desktop only)
    const nav = page.locator('nav.hidden.md\\:flex')
    await expect(nav).toBeVisible()
    
    // Check for common navigation links
    const homeLink = page.locator('a[href="/"]')
    await expect(homeLink).toBeVisible()
    
    // Check for generate link (Polish text)
    const generateLink = page.locator('a[href="/generate"]')
    await expect(generateLink).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if content is still visible and properly laid out
    await expect(page.locator('main')).toBeVisible()
    
    // Check if navigation is hidden on mobile (as designed)
    const nav = page.locator('nav.hidden.md\\:flex')
    await expect(nav).not.toBeVisible()
    
    // Check if auth buttons are still visible on mobile
    const loginLink = page.locator('a[href="/auth/login"]')
    await expect(loginLink).toBeVisible()
  })

  test('should have proper accessibility', async ({ page }) => {
    // Check for accessibility violations
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper meta tags', async ({ page }) => {
    // Check for essential meta tags
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content')
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', 'width=device-width, initial-scale=1')
  })

  test('should load without console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    await page.reload()
    
    // Wait a bit for any async operations
    await page.waitForTimeout(1000)
    
    expect(consoleErrors).toHaveLength(0)
  })
})
