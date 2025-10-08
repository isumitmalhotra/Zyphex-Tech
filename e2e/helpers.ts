/**
 * E2E Test Helper Functions
 * 
 * Shared helper functions for Playwright E2E tests.
 * These are extracted to avoid importing from test files.
 */

import { Page } from '@playwright/test'

/**
 * Login as an admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'admin@zyphex.com')
  await page.fill('input[name="password"]', 'Admin123!')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Login as a project manager user
 */
export async function loginAsProjectManager(page: Page) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'pm@zyphex.com')
  await page.fill('input[name="password"]', 'PM123!')
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Login with custom credentials
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/dashboard')
}

/**
 * Logout the current user
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]')
  await page.click('[data-testid="logout-button"]')
  await page.waitForURL('/auth/login')
}

/**
 * Create a test project
 */
export async function createProject(page: Page, projectData: {
  name: string
  client: string
  startDate?: string
  endDate?: string
  budget?: number
}) {
  await page.goto('/projects')
  await page.click('[data-testid="create-project-button"]')
  
  await page.fill('input[name="name"]', projectData.name)
  await page.fill('input[name="client"]', projectData.client)
  
  if (projectData.startDate) {
    await page.fill('input[name="startDate"]', projectData.startDate)
  }
  
  if (projectData.endDate) {
    await page.fill('input[name="endDate"]', projectData.endDate)
  }
  
  if (projectData.budget) {
    await page.fill('input[name="budget"]', projectData.budget.toString())
  }
  
  await page.click('button[type="submit"]')
  await page.waitForSelector('.toast-success', { timeout: 5000 })
}

/**
 * Create a test invoice
 */
export async function createInvoice(page: Page, invoiceData: {
  client: string
  amount: number
  dueDate?: string
  description?: string
}) {
  await page.goto('/invoices')
  await page.click('[data-testid="create-invoice-button"]')
  
  await page.fill('input[name="client"]', invoiceData.client)
  await page.fill('input[name="amount"]', invoiceData.amount.toString())
  
  if (invoiceData.dueDate) {
    await page.fill('input[name="dueDate"]', invoiceData.dueDate)
  }
  
  if (invoiceData.description) {
    await page.fill('textarea[name="description"]', invoiceData.description)
  }
  
  await page.click('button[type="submit"]')
  await page.waitForSelector('.toast-success', { timeout: 5000 })
}

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Fill form field by label
 */
export async function fillByLabel(page: Page, label: string, value: string) {
  const input = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea`)
  await input.fill(value)
}

/**
 * Click button by text
 */
export async function clickButton(page: Page, text: string) {
  await page.click(`button:has-text("${text}")`)
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout: 3000 })
    return true
  } catch {
    return false
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ 
    path: `screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  })
}
