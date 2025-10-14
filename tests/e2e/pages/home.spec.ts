import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from '@axe-core/playwright'

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
    // Check if navigation elements are present
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check for common navigation links
    const homeLink = page.locator('a[href="/"]')
    await expect(homeLink).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if content is still visible and properly laid out
    await expect(page.locator('main')).toBeVisible()
    
    // Check if navigation is accessible on mobile
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('should have proper accessibility', async ({ page }) => {
    // Inject axe-core
    await injectAxe(page)
    
    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
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
