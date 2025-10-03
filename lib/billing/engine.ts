import { PrismaClient } from "@prisma/client"

// Local enum fallbacks to avoid import timing issues
const _BillingTypeLocal = {
  HOURLY: 'HOURLY',
  FIXED_FEE: 'FIXED_FEE',
  RETAINER: 'RETAINER',
  SUBSCRIPTION: 'SUBSCRIPTION'
} as const

const _InvoiceStatusLocal = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  OVERDUE: 'OVERDUE'
} as const

const _PaymentStatusLocal = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
} as const

type BillingType = typeof _BillingTypeLocal[keyof typeof _BillingTypeLocal]
type _InvoiceStatus = typeof _InvoiceStatusLocal[keyof typeof _InvoiceStatusLocal]
type _PaymentStatus = typeof _PaymentStatusLocal[keyof typeof _PaymentStatusLocal]

// Stub interfaces for missing classes
interface PaymentProcessor {
  processPayment(details: PaymentDetails): Promise<PaymentResult>
}

interface InvoiceGenerator {
  generateInvoice(params: unknown): Promise<unknown>
}

// Stub classes for missing dependencies
class PaymentProcessorStub implements PaymentProcessor {
  async processPayment(details: PaymentDetails): Promise<PaymentResult> {
    // Stub implementation
    return {
      success: true,
      paymentId: `payment_${Date.now()}`,
      transactionId: `txn_${Date.now()}`,
      amount: details.amount,
      currency: details.currency
    }
  }
}

class InvoiceGeneratorStub implements InvoiceGenerator {
  async generateInvoice(_params: unknown): Promise<unknown> {
    // Stub implementation
    return { id: `invoice_${Date.now()}` }
  }
}

const prisma = new PrismaClient()

export interface BillingConfiguration {
  autoInvoice: boolean
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  paymentTermsDays: number
  lateFeePercentage: number
}

export interface PaymentDetails {
  amount: number
  currency: string
  paymentMethod: 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'CHECK'
  paymentReference?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  transactionId?: string
  amount: number
  currency: string
  error?: string
}

export interface ProfitabilityMetrics {
  projectId: string
  totalRevenue: number
  totalExpenses: number
  totalHours: number
  profit: number
  profitMargin: number
  hourlyRate: number
  billingEfficiency: number
}

export class BillingEngine {
  private paymentProcessor: PaymentProcessor
  private invoiceGenerator: InvoiceGenerator

  constructor() {
    this.paymentProcessor = new PaymentProcessorStub()
    this.invoiceGenerator = new InvoiceGeneratorStub()
  }

  /**
   * Generate invoice based on project billing configuration
   */
  async generateInvoice(
    projectId: string, 
    billingType: BillingType,
    options?: {
      includeExpenses?: boolean
      customLineItems?: Array<{
        description: string
        quantity: number
        rate: number
        amount: number
      }>
    }
  ) {
    try {
      // Get project and billing contract
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true
        }
      })

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`)
      }

      // Get time entries separately (billingContracts, timeEntries, expenses not available in include)
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          projectId,
          status: 'APPROVED'
          // Note: invoiceId field not available in current schema
        },
        include: {
          user: true
        }
      })

      // Stub billing contract data since billingContract model doesn't exist
      const billingContract = {
        id: `contract_${projectId}`,
        contractType: 'HOURLY',
        hourlyRate: 100 // Default rate
      }
      if (!billingContract) {
        throw new Error(`No active billing contract found for project ${projectId}`)
      }

      return await this.invoiceGenerator.generateInvoice({
        project,
        billingContract,
        billingType,
        timeEntries: timeEntries,
        expenses: options?.includeExpenses ? [] : [], // No expenses available
        customLineItems: options?.customLineItems || []
      })

    } catch (error) {
      console.error('Error generating invoice:', error)
      throw error
    }
  }

  /**
   * Process payment for an invoice
   */
  async processPayment(invoiceId: string, paymentDetails: PaymentDetails): Promise<PaymentResult> {
    try {
      // Get invoice
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true
          // Note: payments relation not available in current schema
        }
      })

      if (!invoice) {
        throw new Error(`Invoice with ID ${invoiceId} not found`)
      }

      if (invoice.status === 'PAID') {
        throw new Error(`Invoice ${invoice.invoiceNumber} is already paid`)
      }

      // Calculate remaining amount (stub implementation since payments not available)
      const totalPaid = 0 // invoice.payments not available
      const remainingAmount = invoice.total - totalPaid

      if (paymentDetails.amount > remainingAmount) {
        throw new Error(`Payment amount ${paymentDetails.amount} exceeds remaining balance ${remainingAmount}`)
      }

      // Process payment through payment processor
      const result = await this.paymentProcessor.processPayment(paymentDetails)

      if (result.success) {
        // Note: Payment model not available in current schema
        // Would normally record payment in database here

        // Update invoice status if fully paid
        const newTotalPaid = totalPaid + paymentDetails.amount
        if (newTotalPaid >= invoice.total) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: 'PAID',
              paidAt: new Date()
            }
          })
        }

        // Update time entries and expenses as billed
        if (newTotalPaid >= invoice.total) {
          await this.markItemsAsBilled(invoiceId)
        }
      }

      return result
    } catch (error) {
      console.error('Error processing payment:', error)
      return {
        success: false,
        amount: 0,
        currency: 'USD',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Calculate project profitability
   */
  async calculateProjectProfitability(projectId: string): Promise<ProfitabilityMetrics> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`)
      }

      // Get paid invoices separately (invoices relation not available)
      const invoices = await prisma.invoice.findMany({
        where: { 
          projectId,
          status: 'PAID' 
        }
      })

      // Get time entries separately
      const timeEntries = await prisma.timeEntry.findMany({
        where: { 
          projectId,
          status: 'APPROVED' 
        },
        include: { user: true }
      })

      // Calculate total revenue from paid invoices
      const totalRevenue = invoices.reduce((sum: number, invoice) => sum + invoice.total, 0)

      // Calculate total expenses (stub - expense model not available)
      const totalExpenses = 0

      // Calculate total hours
      const totalHours = timeEntries.reduce((sum: number, entry) => sum + (entry.hours || 0), 0)

      // Calculate profit
      const profit = totalRevenue - totalExpenses
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0

      // Calculate effective hourly rate
      const hourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0

      // Calculate billing efficiency (billable vs non-billable time)
      const billableHours = timeEntries
        .filter((entry) => entry.billable)
        .reduce((sum: number, entry) => sum + (entry.hours || 0), 0)
      
      const billingEfficiency = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

      return {
        projectId,
        totalRevenue,
        totalExpenses,
        totalHours,
        profit,
        profitMargin,
        hourlyRate,
        billingEfficiency
      }
    } catch (error) {
      console.error('Error calculating project profitability:', error)
      throw error
    }
  }

  /**
   * Generate recurring invoices for active contracts
   */
  async generateRecurringInvoices(): Promise<unknown[]> {
    try {
      // Note: billingContract model not available in current schema
      // This would normally query active billing contracts
      const activeContracts: unknown[] = [] // Stub implementation

      const invoices = []

      for (const contract of activeContracts) {
        // Check if invoice needs to be generated based on billing cycle
        const shouldGenerate = await this.shouldGenerateRecurringInvoice(contract)
        
        if (shouldGenerate) {
          const invoice = await this.generateRecurringInvoice(contract)
          invoices.push(invoice)
        }
      }

      return invoices
    } catch (error) {
      console.error('Error generating recurring invoices:', error)
      throw error
    }
  }

  /**
   * Mark time entries and expenses as billed
   */
  private async markItemsAsBilled(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { projectId: true, lineItems: true }
    })

    if (!invoice || !invoice.projectId) return

    // Extract time entry and expense IDs from line items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineItems = (invoice.lineItems as unknown) as any[]
    const timeEntryIds = lineItems
      .filter(item => item.type === 'time_entry')
      .map(item => item.referenceId)
    
    const expenseIds = lineItems
      .filter(item => item.type === 'expense')
      .map(item => item.referenceId)

    // Update time entries
    if (timeEntryIds.length > 0) {
      // Note: invoiceId field not available in TimeEntry schema
      // await prisma.timeEntry.updateMany({
      //   where: { id: { in: timeEntryIds } },
      //   data: { invoiceId }
      // })
    }

    // Update expenses  
    if (expenseIds.length > 0) {
      // Note: expense model not available in current schema
      // await prisma.expense.updateMany({
      //   where: { id: { in: expenseIds } },
      //   data: { invoiceId }
      // })
    }
  }

  /**
   * Check if recurring invoice should be generated
   */
  private async shouldGenerateRecurringInvoice(_contract: unknown): Promise<boolean> {
    // Stub implementation since billingContract model not available
    return false
  }

  /**
   * Generate recurring invoice for contract
   */
  private async generateRecurringInvoice(_contract: unknown): Promise<unknown> {
    // Stub implementation since generateRecurringInvoice method not available
    return { id: `recurring_invoice_${Date.now()}` }
  }

  /**
   * Get billing period description
   */
  private getBillingPeriod(cycle: string): string {
    const now = new Date()
    
    switch (cycle) {
      case 'WEEKLY':
        return `Week of ${now.toDateString()}`
      case 'MONTHLY':
        return `${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`
      case 'QUARTERLY':
        const quarter = Math.floor(now.getMonth() / 3) + 1
        return `Q${quarter} ${now.getFullYear()}`
      case 'YEARLY':
        return `${now.getFullYear()}`
      default:
        return 'Billing Period'
    }
  }
}