import { PrismaClient } from '@prisma/client'

// Core billing interfaces based on actual schema
export interface BillingModel {
  type: 'HOURLY' | 'FIXED_FEE' | 'RETAINER' | 'SUBSCRIPTION' | 'MILESTONE_BASED' | 'MIXED'
  hourlyRate?: number
  fixedAmount?: number
  retainerAmount?: number
  subscriptionAmount?: number
  billingCycle?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'
  milestonePayments?: MilestonePayment[]
}

export interface MilestonePayment {
  milestoneId: string
  amount: number
  percentage?: number
}

export interface BillingConfiguration {
  autoInvoice: boolean
  billingCycle: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'
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
  timeEntries?: Array<{
    id: string
    projectId: string | null
    userId: string
    description: string | null
    hours: number
    rate: number
    date: Date
    billable: boolean
    invoiced: boolean
  }>
  milestones?: Array<{
    id: string
    projectId: string
    title: string
    status: string
    targetDate: Date
    actualDate: Date | null
  }>
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
        billable: true
      }
    })

    // Calculate labor costs using the amount field
    const laborAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0)

    // For now, skip expenses as the model may not exist
    const expenseAmount = 0

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
        id: entry.id,
        projectId: entry.projectId,
        userId: entry.userId,
        description: entry.description,
        hours: entry.hours,
        rate: entry.rate,
        date: entry.date,
        billable: entry.billable,
        invoiced: false // Default to false for now
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
        status: 'COMPLETED'
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
      period: { start: new Date(), end: new Date() },
      milestones: milestones.map(m => ({
        id: m.id,
        projectId: m.projectId,
        title: m.title,
        status: m.status,
        targetDate: m.targetDate,
        actualDate: m.actualDate
      })),
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
   * Calculate subscription billing for recurring services
   */
  async calculateSubscriptionBilling(
    projectId: string,
    billingPeriod: Date,
    config: BillingConfiguration,
    subscriptionAmount: number
  ): Promise<BillingResult> {
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
   * Generate invoice for billing result
   */
  async generateInvoice(
    billingResult: BillingResult,
    projectId: string,
    clientId: string,
    config: BillingConfiguration
  ) {
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
        lineItems: JSON.stringify(lineItems),
        notes: `Invoice for services rendered during ${billingResult.period.start.toISOString().split('T')[0]} to ${billingResult.period.end.toISOString().split('T')[0]}`
      }
    })

    return invoice
  }

  /**
   * Get project profitability analysis
   */
  async getProjectProfitability(projectId: string) {
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

    // Get time tracking data
    const timeEntries = await this.prisma.timeEntry.findMany({
      where: {
        projectId
      }
    })

    const timeTracked = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const timeInvoiced = timeEntries.filter(entry => entry.status === 'APPROVED').reduce((sum, entry) => sum + entry.hours, 0)

    // For now, set expenses to 0 since we may not have the expense model
    const totalExpenses = 0

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

  /**
   * Calculate billing for different models
   */
  async calculateBilling(
    projectId: string,
    billingModel: BillingModel,
    startDate: Date,
    endDate: Date,
    config: BillingConfiguration
  ): Promise<BillingResult> {
    switch (billingModel.type) {
      case 'HOURLY':
        return this.calculateHourlyBilling(projectId, startDate, endDate, config)
      
      case 'FIXED_FEE':
      case 'MILESTONE_BASED':
        return this.calculateFixedFeeBilling(projectId, billingModel, config)
      
      case 'SUBSCRIPTION':
        return this.calculateSubscriptionBilling(
          projectId,
          startDate,
          config,
          billingModel.subscriptionAmount || 0
        )
      
      default:
        throw new Error(`Unsupported billing type: ${billingModel.type}`)
    }
  }
}

export default MultiBillingEngine