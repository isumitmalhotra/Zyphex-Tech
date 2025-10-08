import { test, expect } from '@playwright/test'
import { loginAsProjectManager } from './helpers'

/**
 * E2E Tests - Payment and Invoice Flow
 */

test.describe('Invoice Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page)
  })

  test('create new invoice', async ({ page }) => {
    await page.goto('/project-manager/invoices')

    await page.click('button:has-text("Create Invoice")')

    // Select client
    await page.click('[data-testid="invoice-client-select"]')
    await page.click('[role="option"]:first-child')

    // Select project
    await page.click('[data-testid="invoice-project-select"]')
    await page.click('[role="option"]:first-child')

    // Add line items
    await page.click('button:has-text("Add Line Item")')

    await page.fill('input[name="items[0].description"]', 'Development Services')
    await page.fill('input[name="items[0].quantity"]', '40')
    await page.fill('input[name="items[0].rate"]', '125')

    // Automatically calculate amount
    await expect(page.locator('[data-testid="item-amount"]')).toHaveText('$5,000.00')

    // Set due date
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    await page.fill('input[name="dueDate"]', dueDate)

    // Add tax
    await page.fill('input[name="taxPercent"]', '10')

    // Should show totals
    await expect(page.locator('[data-testid="subtotal"]')).toHaveText('$5,000.00')
    await expect(page.locator('[data-testid="tax"]')).toHaveText('$500.00')
    await expect(page.locator('[data-testid="total"]')).toHaveText('$5,500.00')

    // Save as draft
    await page.click('button:has-text("Save as Draft")')

    await expect(page.locator('text=invoice created')).toBeVisible()
  })

  test('send invoice to client', async ({ page }) => {
    await page.goto('/project-manager/invoices')

    // Find draft invoice
    await page.click('[data-testid="status-filter"]')
    await page.click('text=Draft')

    // Click on invoice
    await page.click('[data-testid="invoice-card"]:first-child')

    // Send invoice
    await page.click('button:has-text("Send Invoice")')

    // Confirm dialog
    await expect(page.locator('text=send this invoice')).toBeVisible()
    await page.click('button:has-text("Confirm Send")')

    // Should update status
    await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('Sent')
    await expect(page.locator('text=invoice sent successfully')).toBeVisible()
  })

  test('mark invoice as paid', async ({ page }) => {
    await page.goto('/project-manager/invoices')

    // Filter sent invoices
    await page.click('[data-testid="status-filter"]')
    await page.click('text=Sent')

    await page.click('[data-testid="invoice-card"]:first-child')

    // Record payment
    await page.click('button:has-text("Record Payment")')

    await page.fill('input[name="amount"]', '5500')
    
    // Select payment method
    await page.click('[data-testid="payment-method-select"]')
    await page.click('text=Bank Transfer')

    await page.fill('input[name="transactionId"]', 'TXN123456')
    await page.fill('textarea[name="notes"]', 'Payment received via bank transfer')

    await page.click('button:has-text("Record Payment")')

    // Should update status
    await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('Paid')
    await expect(page.locator('text=payment recorded')).toBeVisible()
  })

  test('apply late fees to overdue invoice', async ({ page }) => {
    await page.goto('/project-manager/invoices')

    // Filter overdue invoices
    await page.click('[data-testid="status-filter"]')
    await page.click('text=Overdue')

    await page.click('[data-testid="invoice-card"]:first-child')

    // Apply late fee
    await page.click('button:has-text("Apply Late Fee")')

    await page.fill('input[name="lateFeeAmount"]', '50')
    await page.fill('textarea[name="reason"]', 'Payment overdue by 30 days')

    await page.click('button:has-text("Apply Fee")')

    // Should show updated total
    await expect(page.locator('text=late fee applied')).toBeVisible()
  })

  test('export invoice as PDF', async ({ page }) => {
    await page.goto('/project-manager/invoices')

    await page.click('[data-testid="invoice-card"]:first-child')

    // Start download
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Download PDF")')

    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('void invoice', async ({ page }) => {
    await page.goto('/project-manager/invoices')

    await page.click('[data-testid="invoice-card"]:first-child')

    // Void invoice
    await page.click('[data-testid="invoice-menu"]')
    await page.click('text=Void Invoice')

    // Confirm
    await page.fill('textarea[name="voidReason"]', 'Client cancelled project')
    await page.click('button:has-text("Confirm Void")')

    // Should update status
    await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('Cancelled')
  })
})

test.describe('Payment Processing', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Stripe in test environment
    await page.addInitScript(() => {
      (window as any).Stripe = () => ({
        confirmCardPayment: async () => ({
          paymentIntent: { id: 'pi_test123', status: 'succeeded' },
        }),
      })
    })
  })

  test('process credit card payment', async ({ page }) => {
    await loginAsProjectManager(page)
    await page.goto('/project-manager/invoices')

    await page.click('[data-testid="invoice-card"]:first-child')

    // Pay online
    await page.click('button:has-text("Pay Online")')

    // Fill card details (test mode)
    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')
    await page.fill('[data-testid="card-name"]', 'Test User')

    // Submit payment
    await page.click('button:has-text("Pay Now")')

    // Should show success
    await expect(page.locator('text=payment successful')).toBeVisible()
    await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('Paid')
  })

  test('handle payment failure gracefully', async ({ page }) => {
    // Mock failed payment
    await page.addInitScript(() => {
      (window as any).Stripe = () => ({
        confirmCardPayment: async () => ({
          error: { message: 'Your card was declined' },
        }),
      })
    })

    await loginAsProjectManager(page)
    await page.goto('/project-manager/invoices')

    await page.click('[data-testid="invoice-card"]:first-child')
    await page.click('button:has-text("Pay Online")')

    await page.fill('[data-testid="card-number"]', '4000000000000002') // Declined card
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')

    await page.click('button:has-text("Pay Now")')

    // Should show error
    await expect(page.locator('text=card was declined')).toBeVisible()
    await expect(page.locator('[data-testid="invoice-status"]')).not.toHaveText('Paid')
  })

  test('save payment method for future use', async ({ page }) => {
    await loginAsProjectManager(page)
    await page.goto('/project-manager/invoices')

    await page.click('[data-testid="invoice-card"]:first-child')
    await page.click('button:has-text("Pay Online")')

    // Check save card option
    await page.check('input[name="saveCard"]')

    await page.fill('[data-testid="card-number"]', '4242424242424242')
    await page.fill('[data-testid="card-expiry"]', '12/25')
    await page.fill('[data-testid="card-cvc"]', '123')

    await page.click('button:has-text("Pay Now")')

    // Should save card
    await expect(page.locator('text=payment method saved')).toBeVisible()

    // Go to settings to verify
    await page.goto('/settings/payment-methods')
    await expect(page.locator('text=•••• 4242')).toBeVisible()
  })
})

test.describe('Payment Reports', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page)
  })

  test('view payment history', async ({ page }) => {
    await page.goto('/project-manager/payments')

    // Should show payment list
    await expect(page.locator('[data-testid="payment-item"]')).not.toHaveCount(0)

    // Filter by date range
    await page.click('[data-testid="date-range-filter"]')
    await page.click('text=Last 30 Days')

    // Filter by payment method
    await page.click('[data-testid="payment-method-filter"]')
    await page.click('text=Credit Card')

    // Search by transaction ID
    await page.fill('input[placeholder*="Search"]', 'TXN')
    await page.waitForTimeout(500)

    // Should show filtered results
    await expect(page.locator('[data-testid="payment-item"]')).not.toHaveCount(0)
  })

  test('export payment report', async ({ page }) => {
    await page.goto('/project-manager/payments')

    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export Report")')

    // Select format
    await page.click('text=Excel')

    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('view payment analytics', async ({ page }) => {
    await page.goto('/project-manager/payments/analytics')

    // Should show charts
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="payment-method-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-revenue-chart"]')).toBeVisible()

    // Should show key metrics
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-amount"]')).toBeVisible()
    await expect(page.locator('[data-testid="overdue-amount"]')).toBeVisible()
  })
})
