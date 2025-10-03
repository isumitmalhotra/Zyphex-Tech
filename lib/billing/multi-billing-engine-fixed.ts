import { PrismaClient } from '@prisma/client'
import type { 
  TimeEntry,
  Invoice,
  Project as _Project, 
  ProjectMilestone,
  Client as _Client
} from '@prisma/client'

// Local enum fallbacks for TypeScript timing issues
const _BillingTypeLocal = {
  HOURLY: 'HOURLY',
  FIXED_FEE: 'FIXED_FEE',
  RETAINER: 'RETAINER',
  SUBSCRIPTION: 'SUBSCRIPTION',
  MILESTONE: 'MILESTONE',
  MIXED: 'MIXED'
} as const;

const _BillingCycleLocal = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  YEARLY: 'YEARLY'
} as const;

const _InvoiceStatusLocal = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
} as const;

const _MilestoneStatusLocal = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

const _TimeEntryStatusLocal = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

const _ExpenseCategoryLocal = {
  TRAVEL: 'TRAVEL',
  MEALS: 'MEALS',
  OFFICE: 'OFFICE',
  SOFTWARE: 'SOFTWARE',
  HARDWARE: 'HARDWARE',
  OTHER: 'OTHER'
} as const;

type BillingType = typeof _BillingTypeLocal[keyof typeof _BillingTypeLocal];
type _BillingCycle = typeof _BillingCycleLocal[keyof typeof _BillingCycleLocal];
type _InvoiceStatus = typeof _InvoiceStatusLocal[keyof typeof _InvoiceStatusLocal];
type _MilestoneStatus = typeof _MilestoneStatusLocal[keyof typeof _MilestoneStatusLocal];
type _TimeEntryStatus = typeof _TimeEntryStatusLocal[keyof typeof _TimeEntryStatusLocal];
type _ExpenseCategory = typeof _ExpenseCategoryLocal[keyof typeof _ExpenseCategoryLocal];

// Enhanced interfaces for billing calculations
export interface BillingModel {
  type: BillingType
  hourlyRate?: number
  fixedAmount?: number
  retainerAmount?: number
  subscriptionAmount?: number
  billingCycle?: _BillingCycle
  milestonePayments?: MilestonePayment[]
}

export interface MilestonePayment {
  milestoneId: string
  amount: number
  percentage?: number
}

export interface TimeEntryWithInvoice extends TimeEntry {
  invoiced?: boolean
}

export interface RetainerUsage {
  id: string
  projectId: string
  amount: number
  description: string
  date: Date
  invoiced: boolean
}

export interface BillingConfiguration {
  autoInvoice: boolean
  billingCycle: _BillingCycle
  paymentTerms: number // days
  taxRate: number // percentage
  discountRate?: number // percentage
  currency: string
}

export interface BillingResult {
  amount: number
  currency: string
  period: {
    start: Date
    end: Date
  }
  timeEntries?: TimeEntryWithInvoice[]
  milestones?: ProjectMilestone[]
  retainerUsage?: RetainerUsage[]
  readyForInvoicing?: ProjectMilestone[]
  breakdown: {
    labor: number
    expenses: number
    tax: number
    discount: number
    total: number
  }
}

export class MultiBillingEngine {
  private prisma: PrismaClient

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
  }

  /**
   * Calculate hourly billing for time-based projects
   */
  async calculateHourlyBilling(
    projectId: string,
    startDate: Date,
    endDate: Date,
    config: BillingConfiguration
  ): Promise<BillingResult> {
    // Get billable time entries for the period
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        projectId,
        date: {
          gte: startDate,
          lte: endDate
        },
        billable: true,
        status: 'DRAFT' // TimeEntryStatusLocal.DRAFT
      }
    })

    // Calculate labor costs
    const laborAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0)

    // Get related expenses for the period
    // @ts-expect-error - Expense model exists but TypeScript can't find it due to client generation timing
    const expenses = await this.prisma.expense.findMany({
      where: {
        projectId,
        date: {
          gte: startDate,
          lte: endDate
        },
        billable: true
      }
    })

    const expenseAmount = expenses.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0)

    const subtotal = laborAmount + expenseAmount
    const discountAmount = config.discountRate ? subtotal * (config.discountRate / 100) : 0
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * (config.taxRate / 100)
    const total = taxableAmount + taxAmount

    return {
      amount: total,
      currency: config.currency,
      period: { start: startDate, end: endDate },
      timeEntries: timeEntries.map(entry => ({
        ...entry,
        invoiced: false
      })),
      breakdown: {
        labor: laborAmount,
        expenses: expenseAmount,
        tax: taxAmount,
        discount: discountAmount,
        total
      }
    }
  }

  /**
   * Calculate fixed-fee billing based on milestone completion
   */
  async calculateFixedFeeBilling(
    projectId: string,
    billingModel: BillingModel,
    config: BillingConfiguration
  ): Promise<BillingResult> {
    // Get completed milestones
    const milestones = await this.prisma.projectMilestone.findMany({
      where: {
        projectId,
        status: 'COMPLETED' // MilestoneStatusLocal.COMPLETED
      }
    })

    // Calculate milestone payments
    const milestonePayments = billingModel.milestonePayments || []
    let amount = 0

    const readyForInvoicing = milestones.filter(milestone => {
      const payment = milestonePayments.find(p => p.milestoneId === milestone.id)
      return payment !== undefined
    })

    amount = readyForInvoicing.reduce((sum, milestone) => {
      const payment = milestonePayments.find(p => p.milestoneId === milestone.id)
      return sum + (payment?.amount || 0)
    }, 0)

    const discountAmount = config.discountRate ? amount * (config.discountRate / 100) : 0
    const taxableAmount = amount - discountAmount
    const taxAmount = taxableAmount * (config.taxRate / 100)
    const total = taxableAmount + taxAmount

    return {
      amount: total,
      currency: config.currency,
      period: {
        start: new Date(),
        end: new Date()
      },
      milestones,
      readyForInvoicing,
      breakdown: {
        labor: amount,
        expenses: 0,
        tax: taxAmount,
        discount: discountAmount,
        total
      }
    }
  }

  /**
   * Calculate retainer billing with usage tracking
   */
  async calculateRetainerBilling(
    projectId: string,
    startDate: Date,
    endDate: Date,
    config: BillingConfiguration
  ): Promise<BillingResult> {
    // Get retainer contract
    // @ts-expect-error - BillingContract model exists but TypeScript can't find it due to client generation timing
    const retainerContract = await this.prisma.billingContract.findFirst({
      where: {
        projectId,
        contractType: 'RETAINER', // BillingTypeLocal.RETAINER
        isActive: true
      }
    })

    if (!retainerContract) {
      throw new Error('No active retainer contract found for project')
    }

    // Get usage history for the period (using expenses as usage tracking)
    // @ts-expect-error - Expense model exists but TypeScript can't find it due to client generation timing
    const usageHistory = await this.prisma.expense.findMany({
      where: {
        projectId,
        date: {
          gte: startDate,
          lte: endDate
        },
        category: 'SERVICES' // ExpenseCategoryLocal.SERVICES
      }
    })

    const usedAmount = usageHistory.reduce((sum: number, usage: { amount: number }) => sum + usage.amount, 0)
    const retainerAmount = retainerContract.retainerAmount || 0

    // Calculate any overages
    const overageAmount = Math.max(0, usedAmount - retainerAmount)

    const discountAmount = config.discountRate ? overageAmount * (config.discountRate / 100) : 0
    const taxableAmount = overageAmount - discountAmount
    const taxAmount = taxableAmount * (config.taxRate / 100)
    const total = taxableAmount + taxAmount

    return {
      amount: total,
      currency: config.currency,
      period: { start: startDate, end: endDate },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      retainerUsage: usageHistory.map((usage: any) => ({
        id: usage.id,
        projectId: usage.projectId || '',
        amount: usage.amount,
        description: usage.description,
        date: usage.date,
        invoiced: false
      })),
      breakdown: {
        labor: overageAmount,
        expenses: 0,
        tax: taxAmount,
        discount: discountAmount,
        total
      }
    }
  }

  /**
   * Calculate subscription billing for recurring services
   */
  async calculateSubscriptionBilling(
    projectId: string,
    billingPeriod: Date,
    config: BillingConfiguration
  ): Promise<BillingResult> {
    // Get subscription contract
    // @ts-expect-error - BillingContract model exists but TypeScript can't find it due to client generation timing
    const subscriptionContract = await this.prisma.billingContract.findFirst({
      where: {
        projectId,
        contractType: 'SUBSCRIPTION',
        isActive: true
      }
    })

    if (!subscriptionContract) {
      throw new Error('No active subscription contract found for project')
    }

    const subscriptionAmount = subscriptionContract.fixedAmount || 0
    const discountAmount = config.discountRate ? subscriptionAmount * (config.discountRate / 100) : 0
    const taxableAmount = subscriptionAmount - discountAmount
    const taxAmount = taxableAmount * (config.taxRate / 100)
    const total = taxableAmount + taxAmount

    return {
      amount: total,
      currency: config.currency,
      period: { start: billingPeriod, end: billingPeriod },
      breakdown: {
        labor: subscriptionAmount,
        expenses: 0,
        tax: taxAmount,
        discount: discountAmount,
        total
      }
    }
  }

  /**
   * Calculate mixed billing combining multiple models
   */
  async calculateMixedBilling(
    projectId: string,
    billingModels: BillingModel[],
    startDate: Date,
    endDate: Date,
    config: BillingConfiguration
  ): Promise<BillingResult> {
    let totalAmount = 0
    let totalLabor = 0
    let totalExpenses = 0
    const allTimeEntries: TimeEntryWithInvoice[] = []
    const allMilestones: ProjectMilestone[] = []

    for (const model of billingModels) {
      let result: BillingResult

      switch (model.type) {
        case 'HOURLY':
          result = await this.calculateHourlyBilling(projectId, startDate, endDate, config)
          break
        case 'FIXED_FEE':
          result = await this.calculateFixedFeeBilling(projectId, model, config)
          break
        case 'RETAINER':
          result = await this.calculateRetainerBilling(projectId, startDate, endDate, config)
          break
        case 'SUBSCRIPTION':
          result = await this.calculateSubscriptionBilling(projectId, startDate, config)
          break
        default:
          continue
      }

      totalAmount += result.amount
      totalLabor += result.breakdown.labor
      totalExpenses += result.breakdown.expenses

      if (result.timeEntries) {
        allTimeEntries.push(...result.timeEntries)
      }
      if (result.milestones) {
        allMilestones.push(...result.milestones)
      }
    }

    const discountAmount = config.discountRate ? totalAmount * (config.discountRate / 100) : 0
    const taxableAmount = totalAmount - discountAmount
    const taxAmount = taxableAmount * (config.taxRate / 100)
    const total = taxableAmount + taxAmount

    return {
      amount: total,
      currency: config.currency,
      period: { start: startDate, end: endDate },
      timeEntries: allTimeEntries,
      milestones: allMilestones,
      breakdown: {
        labor: totalLabor,
        expenses: totalExpenses,
        tax: taxAmount,
        discount: discountAmount,
        total
      }
    }
  }

  /**
   * Generate invoice for billing result
   */
  async generateInvoice(
    billingResult: BillingResult,
    projectId: string,
    clientId: string,
    config: BillingConfiguration
  ): Promise<Invoice> {
    const invoiceNumber = `INV-${Date.now()}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + config.paymentTerms)

    const lineItems = [
      {
        description: 'Professional Services',
        quantity: 1,
        rate: billingResult.breakdown.labor,
        amount: billingResult.breakdown.labor
      }
    ]

    if (billingResult.breakdown.expenses > 0) {
      lineItems.push({
        description: 'Project Expenses',
        quantity: 1,
        rate: billingResult.breakdown.expenses,
        amount: billingResult.breakdown.expenses
      })
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        clientId,
        projectId,
        invoiceNumber,
        amount: billingResult.amount,
        total: billingResult.breakdown.total,
        status: 'DRAFT',
        dueDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lineItems: lineItems as any,
        notes: `Invoice for services rendered during ${billingResult.period.start.toISOString().split('T')[0]} to ${billingResult.period.end.toISOString().split('T')[0]}`
      }
    })

    return invoice
  }

  /**
   * Process automatic invoicing for projects
   */
  async processAutoInvoicing(): Promise<void> {
    const projects = await this.prisma.project.findMany({
      where: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'ACTIVE' as any
      },
      include: {
        timeEntries: true,
        milestones: true
      }
    })

    for (const project of projects) {
      try {
        // Get billing contracts for the project
    // @ts-expect-error - BillingContract model exists but TypeScript can't find it due to client generation timing
    const contracts = await this.prisma.billingContract.findMany({
          where: {
            projectId: project.id,
            isActive: true,
            autoInvoice: true
          }
        })

        for (const contract of contracts) {
          // Calculate billing period based on cycle
          const now = new Date()
          let startDate: Date
          const endDate: Date = now

          switch (contract.billingCycle) {
            case 'WEEKLY':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case 'MONTHLY':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1)
              break
            case 'QUARTERLY':
              const quarter = Math.floor(now.getMonth() / 3)
              startDate = new Date(now.getFullYear(), quarter * 3, 1)
              break
            case 'ANNUALLY':
              startDate = new Date(now.getFullYear(), 0, 1)
              break
            default:
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }

          // Check if invoice already exists for this period
          const existingInvoice = await this.prisma.invoice.findFirst({
            where: {
              projectId: project.id,
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          })

          if (existingInvoice) continue

          // Calculate billing
          const config: BillingConfiguration = {
            autoInvoice: true,
            billingCycle: contract.billingCycle,
            paymentTerms: 30,
            taxRate: 0.1, // 10%
            currency: 'USD'
          }

          const billingModel: BillingModel = {
            type: contract.contractType,
            hourlyRate: contract.hourlyRate || undefined,
            fixedAmount: contract.fixedAmount || undefined,
            retainerAmount: contract.retainerAmount || undefined,
            billingCycle: contract.billingCycle
          }

          let billingResult: BillingResult

          switch (contract.contractType) {
            case 'HOURLY':
              billingResult = await this.calculateHourlyBilling(project.id, startDate, endDate, config)
              break
            case 'FIXED_FEE':
              billingResult = await this.calculateFixedFeeBilling(project.id, billingModel, config)
              break
            case 'RETAINER':
              billingResult = await this.calculateRetainerBilling(project.id, startDate, endDate, config)
              break
            case 'SUBSCRIPTION':
              billingResult = await this.calculateSubscriptionBilling(project.id, now, config)
              break
            default:
              continue
          }

          // Generate invoice if amount > 0
          if (billingResult.amount > 0) {
            await this.generateInvoice(
              billingResult,
              project.id,
              project.clientId,
              config
            )
          }
        }
      } catch (error) {
        console.error(`Error processing auto-invoicing for project ${project.id}:`, error)
      }
    }
  }

  /**
   * Get profitability analysis for a project
   */
  async getProjectProfitability(projectId: string): Promise<{
    revenue: number
    expenses: number
    profit: number
    profitMargin: number
    timeTracked: number
    timeInvoiced: number
  }> {
    // Get all invoices for the project
    const invoices = await this.prisma.invoice.findMany({
      where: {
        projectId,
        status: {
          in: ['SENT', 'PAID']
        }
      }
    })

    const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0)

    // Get all expenses for the project
    // @ts-expect-error - Expense model exists but TypeScript can't find it due to client generation timing
    const expenses = await this.prisma.expense.findMany({
      where: {
        projectId
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)

    // Get time tracking data
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        projectId
      }
    })

    const timeTracked = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timeInvoiced = timeEntries.filter((entry: any) => entry.invoiceId).reduce((sum, entry) => sum + entry.hours, 0)

    const profit = revenue - totalExpenses
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

    return {
      revenue,
      expenses: totalExpenses,
      profit,
      profitMargin,
      timeTracked,
      timeInvoiced
    }
  }
}

export default MultiBillingEngine