import { Page, expect } from '@playwright/test'

/**
 * Helper functions for common test operations
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForFunction(() => document.readyState === 'complete')
  }

  /**
   * Mock authentication state
   */
  async mockAuth(user: { email: string; name: string } = { email: 'test@example.com', name: 'Test User' }) {
    await this.page.addInitScript((user) => {
      // Mock localStorage with auth data
      localStorage.setItem('auth-token', 'mock-token')
      localStorage.setItem('user', JSON.stringify(user))
    }, user)
  }

  /**
   * Clear authentication state
   */
  async clearAuth() {
    await this.page.addInitScript(() => {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('user')
    })
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [selector, value] of Object.entries(formData)) {
      await this.page.fill(selector, value)
    }
  }

  /**
   * Wait for element to be visible and clickable
   */
  async waitAndClick(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout })
    await this.page.click(selector)
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(text: string, timeout = 10000) {
    await this.page.waitForSelector(`text=${text}`, { timeout })
  }

  /**
   * Take screenshot with timestamp
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    })
  }

  /**
   * Check for console errors
   */
  async checkConsoleErrors() {
    const errors: string[] = []
    
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    return errors
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string, response: any, status = 200) {
    await this.page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      })
    })
  }

  /**
   * Wait for API call to complete
   */
  async waitForApiCall(url: string, timeout = 10000) {
    await this.page.waitForResponse(response => 
      response.url().includes(url) && response.status() < 400,
      { timeout }
    )
  }

  /**
   * Generate random test data
   */
  generateTestData() {
    const timestamp = Date.now()
    return {
      email: `test-${timestamp}@example.com`,
      name: `Test User ${timestamp}`,
      text: `Test text content ${timestamp}`,
      set: `Test Set ${timestamp}`
    }
  }

  /**
   * Check accessibility with axe-core
   */
  async checkAccessibility() {
    const { injectAxe, checkA11y } = await import('@axe-core/playwright')
    await injectAxe(this.page)
    await checkA11y(this.page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  }
}

/**
 * Create test helper instance
 */
export function createTestHelper(page: Page) {
  return new TestHelpers(page)
}

/**
 * Common test data
 */
export const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  },
  sampleText: 'React is a JavaScript library for building user interfaces. It was created by Facebook and is now maintained by the community. React uses a virtual DOM to efficiently update the user interface.',
  sampleSet: {
    name: 'Test Set',
    description: 'A test set for flash cards'
  }
}
