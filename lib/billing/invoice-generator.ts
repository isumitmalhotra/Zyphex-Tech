import { PrismaClient } from "@prisma/client"

// Local BillingType fallback to avoid import timing issues
const _BillingTypeLocal = {
  HOURLY: 'HOURLY',
  FIXED_FEE: 'FIXED_FEE',
  RETAINER: 'RETAINER',
  SUBSCRIPTION: 'SUBSCRIPTION',
  MILESTONE_BASED: 'MILESTONE_BASED'
} as const

type BillingType = typeof _BillingTypeLocal[keyof typeof _BillingTypeLocal]

// Type interfaces for better type safety
interface ProjectData {
  id: string
  name: string
  clientId: string
  status: string
}

interface BillingContractData {
  id: string
  projectId: string
  clientId: string
  contractType: string
  hourlyRate?: number
  fixedAmount?: number
  retainerAmount?: number
  currency?: string
}

interface TimeEntryData {
  id: string
  userId: string
  projectId: string
  hours: number
  duration?: number
  billable: boolean
  rate: number
  amount: number
  date: Date
  description: string
  user?: {
    id: string
    name: string
    hourlyRate?: number
  }
}

interface ExpenseData {
  id: string
  projectId: string
  amount: number
  description: string
  category: string
  date: Date
}

const prisma = new PrismaClient()

export interface InvoiceLineItem {
  id?: string
  type: 'time_entry' | 'expense' | 'fixed_fee' | 'retainer' | 'custom'
  referenceId?: string
  description: string
  quantity: number
  rate: number
  amount: number
  date?: string
  metadata?: Record<string, string>
}

export interface GenerateInvoiceParams {
  project: ProjectData
  billingContract: BillingContractData
  billingType: BillingType
  timeEntries: TimeEntryData[]
  expenses: ExpenseData[]
  customLineItems: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
}

export interface GenerateRecurringInvoiceParams {
  contract: BillingContractData
  amount: number
  billingPeriod: string
}

export class InvoiceGenerator {
  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    
    // Find the last invoice for this month
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}${month}`
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    })

    let sequence = 1
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0')
      sequence = lastSequence + 1
    }

    return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`
  }

  /**
   * Generate invoice based on billing type
   */
  async generateInvoice(params: GenerateInvoiceParams) {
    const {
      project,
      billingContract,
      billingType,
      timeEntries,
      expenses,
      customLineItems
    } = params

    const invoiceNumber = await this.generateInvoiceNumber()
    const lineItems: InvoiceLineItem[] = []
    let subtotal = 0

    try {
      // Generate line items based on billing type
      switch (billingType) {
        case 'HOURLY':
          // Group time entries by user and rate
          const timeEntriesByUser = this.groupTimeEntriesByUser(timeEntries)
          
          for (const [userId, userEntries] of Object.entries(timeEntriesByUser)) {
            const user = userEntries[0]?.user
            const totalHours = userEntries.reduce((sum, entry) => sum + (entry.duration || entry.hours), 0)
            const rate = billingContract.hourlyRate || user?.hourlyRate || 0
            const amount = totalHours * rate

            lineItems.push({
              type: 'time_entry',
              description: `Development work - ${user?.name || 'Unknown'}`,
              quantity: totalHours,
              rate,
              amount,
              metadata: {
                userId,
                entries: userEntries.map(e => e.id).join(',')
              }
            })

            subtotal += amount
          }
          break

        case 'FIXED_FEE':
          lineItems.push({
            type: 'fixed_fee',
            description: `Fixed fee - ${project.name}`,
            quantity: 1,
            rate: billingContract.fixedAmount || 0,
            amount: billingContract.fixedAmount || 0
          })
          subtotal = billingContract.fixedAmount || 0
          break

        case 'RETAINER':
          lineItems.push({
            type: 'retainer',
            description: `Retainer - ${project.name}`,
            quantity: 1,
            rate: billingContract.retainerAmount || 0,
            amount: billingContract.retainerAmount || 0
          })
          subtotal = billingContract.retainerAmount || 0
          break

        case 'MILESTONE_BASED':
          // This would typically be triggered by milestone completion
          const milestoneAmount = billingContract.fixedAmount || 0
          lineItems.push({
            type: 'fixed_fee',
            description: `Milestone payment - ${project.name}`,
            quantity: 1,
            rate: milestoneAmount,
            amount: milestoneAmount
          })
          subtotal = milestoneAmount
          break

        default:
          throw new Error(`Unsupported billing type: ${billingType}`)
      }

      // Add billable expenses
      for (const expense of expenses) {
        lineItems.push({
          type: 'expense',
          referenceId: expense.id,
          description: `${expense.category} - ${expense.description}`,
          quantity: 1,
          rate: expense.amount,
          amount: expense.amount,
          date: expense.date.toISOString().split('T')[0]
        })
        subtotal += expense.amount
      }

      // Add custom line items
      for (const item of customLineItems) {
        lineItems.push({
          type: 'custom',
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })
        subtotal += item.amount
      }

      // Calculate tax (assuming 10% for now - this should be configurable)
      const taxRate = 0.10
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          clientId: project.clientId,
          projectId: project.id,
          invoiceNumber,
          amount: subtotal,
          total,
          status: 'DRAFT',
          dueDate: this.calculateDueDate(30), // 30 days default
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          lineItems: lineItems as any,
          terms: this.getDefaultTerms()
        },
        include: {
          client: true,
          project: true
        }
      })

      return invoice
    } catch (error) {
      throw error
    }
  }

  /**
   * Generate recurring invoice
   */
  async generateRecurringInvoice(params: GenerateRecurringInvoiceParams) {
    const { contract, amount, billingPeriod } = params

    const invoiceNumber = await this.generateInvoiceNumber()
    
    const lineItems: InvoiceLineItem[] = [{
      type: contract.contractType === 'RETAINER' ? 'retainer' : 'fixed_fee',
      description: `${contract.contractType === 'RETAINER' ? 'Retainer' : 'Subscription'} - ${billingPeriod}`,
      quantity: 1,
      rate: amount,
      amount
    }]

    const taxRate = 0.10
    const taxAmount = amount * taxRate
    const total = amount + taxAmount

    const invoice = await prisma.invoice.create({
      data: {
        clientId: contract.clientId,
        projectId: contract.projectId,
        invoiceNumber,
        amount,
        total,
        status: 'DRAFT',
        dueDate: this.calculateDueDate(30),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lineItems: lineItems as any,
        terms: this.getDefaultTerms()
      },
      include: {
        client: true,
        project: true
      }
    })

    return invoice
  }

  /**
   * Group time entries by user
   */
  private groupTimeEntriesByUser(timeEntries: TimeEntryData[]): Record<string, TimeEntryData[]> {
    return timeEntries.reduce((groups, entry) => {
      const userId = entry.userId
      if (!groups[userId]) {
        groups[userId] = []
      }
      groups[userId].push(entry)
      return groups
    }, {} as Record<string, TimeEntryData[]>)
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(daysFromNow: number): Date {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return date
  }

  /**
   * Get default payment terms
   */
  private getDefaultTerms(): string {
    return `Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge. Please remit payment to the address shown above.`
  }

  /**
   * Generate invoice PDF (placeholder)
   */
  async generateInvoicePDF(_invoiceId: string): Promise<Buffer> {
    // This would integrate with a PDF generation library like puppeteer or jsPDF
    // For now, return a placeholder
    return Buffer.from('Invoice PDF content would go here')
  }

  /**
   * Send invoice via email (placeholder)
   */
  async sendInvoiceEmail(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          project: true
        }
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Update invoice status to sent
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'SENT'
        }
      })

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Mark invoice as overdue
   */
  async markOverdueInvoices(): Promise<void> {
    const overdueDate = new Date()
    
    await prisma.invoice.updateMany({
      where: {
        status: 'SENT',
        dueDate: {
          lt: overdueDate
        }
      },
      data: {
        status: 'OVERDUE'
      }
    })
  }

  /**
   * Apply late fees to overdue invoices
   */
  async applyLateFees(lateFeePercentage: number = 1.5): Promise<void> {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'OVERDUE'
      }
    })

    for (const invoice of overdueInvoices) {
      const lateFee = invoice.total * (lateFeePercentage / 100)
      const newTotal = invoice.total + lateFee

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          total: newTotal
        }
      })
    }
  }
}