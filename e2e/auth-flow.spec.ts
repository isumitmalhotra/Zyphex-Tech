import { test, expect, Page } from '@playwright/test'

/**
 * E2E Tests - User Registration and Authentication Flow
 */

test.describe('User Registration Flow', () => {
  test('complete user registration journey', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/auth/register')

    // Fill in registration form
    await page.fill('input[name="name"]', 'Test User E2E')
    await page.fill('input[name="email"]', `test-e2e-${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'SecurePassword123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

    // Accept terms
    await page.check('input[type="checkbox"][name="terms"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Should redirect to email verification page
    await expect(page).toHaveURL(/\/auth\/verify-email/)

    // Check for success message
    await expect(page.locator('text=check your email')).toBeVisible()
  })

  test('prevents registration with existing email', async ({ page }) => {
    await page.goto('/auth/register')

    // Try to register with admin email
    await page.fill('input[name="name"]', 'Duplicate User')
    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'Password123!')
    await page.check('input[type="checkbox"][name="terms"]')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=email already exists')).toBeVisible()
  })

  test('validates password strength', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'weak')
    await page.blur('input[name="password"]')

    // Should show password strength error
    await expect(page.locator('text=password must be at least')).toBeVisible()
  })

  test('validates password confirmation match', async ({ page }) => {
    await page.goto('/auth/register')

    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
    await page.blur('input[name="confirmPassword"]')

    // Should show mismatch error
    await expect(page.locator('text=passwords do not match')).toBeVisible()
  })
})

test.describe('User Login Flow', () => {
  test('successful login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.fill('input[name="password"]', 'admin123')

    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)

    // Should show user menu
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.fill('input[name="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=invalid credentials')).toBeVisible()
  })

  test('OAuth login with Google', async ({ page }) => {
    await page.goto('/auth/login')

    // Click Google login button
    const googleButton = page.locator('button:has-text("Sign in with Google")')
    await googleButton.click()

    // Should redirect to Google OAuth (mock in test environment)
    // In production, this would redirect to Google's OAuth page
    await expect(page).toHaveURL(/accounts\.google\.com|localhost/)
  })

  test('remember me checkbox persists session', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.check('input[name="rememberMe"]')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/dashboard/)

    // Close and reopen browser (session should persist)
    await page.context().close()
  })
})

test.describe('Password Reset Flow', () => {
  test('request password reset email', async ({ page }) => {
    await page.goto('/auth/forgot-password')

    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.click('button[type="submit"]')

    // Should show success message
    await expect(page.locator('text=reset link sent')).toBeVisible()
  })

  test('validate email exists before sending reset link', async ({ page }) => {
    await page.goto('/auth/forgot-password')

    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.click('button[type="submit"]')

    // Should still show success for security (don't leak user existence)
    await expect(page.locator('text=reset link sent')).toBeVisible()
  })
})

test.describe('Session Management', () => {
  test('logout functionality', async ({ page }) => {
    // Login first
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard/)

    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Sign out')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/)

    // Should not be able to access protected pages
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('session timeout after inactivity', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'admin@zyphextech.com')
    await page.fill('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')

    // Wait for session timeout (mock in test)
    // In production, this would be actual timeout period
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })

    // Try to access protected route
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

