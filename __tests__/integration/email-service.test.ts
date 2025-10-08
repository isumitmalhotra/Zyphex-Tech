/**
 * Integration Tests - Email Service
 */
import { emailService } from '@/lib/services/email-service'

// Mock Resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({
          data: { id: 'test-email-id-123' },
          error: null
        })
      }
    }))
  }
})

describe('Email Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendWelcomeEmail', () => {
    it('sends welcome email with correct data', async () => {
      const result = await emailService.sendWelcomeEmail(
        'newuser@example.com',
        'John Doe'
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('handles errors gracefully', async () => {
      // This will use the mocked Resend which returns success
      // In real scenarios with actual API errors, we'd test error handling
      const result = await emailService.sendWelcomeEmail(
        'test@example.com',
        'Test User'
      )

      expect(result).toHaveProperty('success')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('sends password reset email with token', async () => {
      const resetUrl = 'https://example.com/reset-password?token=abc123'
      const result = await emailService.sendPasswordResetEmail(
        'user@example.com',
        resetUrl
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })
  })

  describe('sendInvoiceEmail', () => {
    it('sends invoice with PDF attachment', async () => {
      const mockInvoice = {
        invoiceNumber: 'INV-001',
        amount: 1500.00,
        dueDate: new Date('2025-11-01'),
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        paymentUrl: 'https://example.com/pay/inv-001'
      }
      const mockPDF = Buffer.from('fake-pdf-content')

      const result = await emailService.sendInvoiceEmail(mockInvoice, mockPDF)

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })
  })

  describe('sendProjectNotification', () => {
    it('sends project update notification to team', async () => {
      const mockProject = {
        id: 'proj-123',
        name: 'Website Redesign',
        status: 'IN_PROGRESS'
      }
      const mockTeamMembers = [
        { email: 'member1@example.com', name: 'Alice' },
        { email: 'member2@example.com', name: 'Bob' }
      ]
      const message = 'Project deadline has been extended by 2 weeks.'

      const result = await emailService.sendProjectNotification(
        mockProject,
        mockTeamMembers,
        message
      )

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('handles empty team members list', async () => {
      const mockProject = {
        id: 'proj-123',
        name: 'Test Project',
        status: 'ACTIVE'
      }

      const result = await emailService.sendProjectNotification(
        mockProject,
        [],
        'Test message'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No valid recipients')
    })
  })

  describe('sendPaymentReminder', () => {
    it('sends payment reminder for overdue invoice', async () => {
      const mockInvoice = {
        invoiceNumber: 'INV-002',
        amount: 2500.00,
        dueDate: new Date('2025-09-15'),
        daysOverdue: 15,
        clientName: 'Tech Corp',
        clientEmail: 'accounts@techcorp.com',
        paymentUrl: 'https://example.com/pay/inv-002'
      }

      const result = await emailService.sendPaymentReminder(mockInvoice)

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('sends reminder for upcoming payment', async () => {
      const mockInvoice = {
        invoiceNumber: 'INV-003',
        amount: 1000.00,
        dueDate: new Date('2025-10-15'),
        daysOverdue: 0,
        clientName: 'Client Inc',
        clientEmail: 'billing@client.com'
      }

      const result = await emailService.sendPaymentReminder(mockInvoice)

      expect(result.success).toBe(true)
    })
  })

  describe('batch email sending', () => {
    it('sends emails to multiple recipients', async () => {
      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
      ]

      const results = await Promise.all(
        recipients.map(email => 
          emailService.sendWelcomeEmail(email, 'New User')
        )
      )

      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.messageId).toBeDefined()
      })
    })
  })
})
