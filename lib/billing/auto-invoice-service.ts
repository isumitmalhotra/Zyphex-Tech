import { PrismaClient } from '@prisma/client'
import { MultiBillingEngine } from './billing-engine'
import type { BillingConfiguration, BillingModel } from './billing-engine'

export interface InvoiceTemplate {
  id: string
  name: string
  companyLogo?: string
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  headerColor: string
  accentColor: string
  footerText?: string
  termsAndConditions?: string
  customFields?: Record<string, string>
}

export interface InvoiceGenerationOptions {
  template?: InvoiceTemplate
  currency?: string
  dueDate?: Date
  sendEmail?: boolean
  attachments?: string[]
  notes?: string
  customLineItems?: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
}

interface TimeEntry {
  id: string
  date: Date
  description: string
  hours: number
  rate: number
  user: {
    id: string
    name: string
  }
}

interface UserBreakdown {
  userName: string
  entries: TimeEntry[]
  totalHours: number
  totalAmount: number
}

interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
  details: Array<{
    date: Date
    description: string
    hours: number
    rate: number
  }> | Record<string, unknown> | unknown[]
}

export interface AutoInvoiceRule {
  id: string
  projectId?: string
  clientId?: string
  triggerType: 'TIME_BASED' | 'MILESTONE' | 'RECURRING' | 'MANUAL'
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  isActive: boolean
  template: InvoiceTemplate
  billingConfiguration: BillingConfiguration
  conditions?: {
    minimumAmount?: number
    requireApproval?: boolean
    timePeriodDays?: number
  }
}

export class AutoInvoiceService {
  private prisma: PrismaClient
  private billingEngine: MultiBillingEngine

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
    this.billingEngine = new MultiBillingEngine(prismaClient)
  }

  /**
   * Generate time-based invoice from approved time entries
   */
  async generateTimeBasedInvoice(
    projectId: string,
    startDate: Date,
    endDate: Date,
    options: InvoiceGenerationOptions = {}
  ) {
    try {
      // Get project and client information
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true
          // Note: timeEntries not available in include - will query separately
        }
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get time entries separately since not available in include
      const timeEntries = await this.prisma.timeEntry.findMany({
        where: {
          projectId,
          date: { gte: startDate, lte: endDate },
          billable: true,
          status: 'APPROVED'
          // Note: invoiceId field not available in current schema
        },
        include: {
          user: { select: { name: true, hourlyRate: true } }
        }
      })

      if (timeEntries.length === 0) {
        throw new Error('No billable time entries found for the specified period')
      }

      // Calculate billing configuration
      const config: BillingConfiguration = {
        autoInvoice: true,
        billingCycle: 'MONTHLY',
        paymentTerms: 30,
        taxRate: 10,
        currency: options.currency || 'USD'
        // Note: project.metadata not available in current schema
      }

      // Calculate hourly billing
      const billingResult = await this.billingEngine.calculateHourlyBilling(
        projectId,
        startDate,
        endDate,
        config
      )

      // Group time entries by user for detailed breakdown  
      const userBreakdown = timeEntries.reduce((acc: Record<string, UserBreakdown>, entry: unknown) => {
        const e = entry as Record<string, unknown>
        const user = e.user as Record<string, unknown> | undefined
        const userId = user?.id as string || e.userId as string
        const userName = user?.name as string || 'Unknown User'
        if (!acc[userId]) {
          acc[userId] = {
            userName,
            entries: [],
            totalHours: 0,
            totalAmount: 0
          }
        }
        acc[userId].entries.push(e as unknown as TimeEntry)
        acc[userId].totalHours += (e.hours as number) || 0
        acc[userId].totalAmount += (e.amount as number) || ((e.hours as number) * (e.rate as number)) || 0
        return acc
      }, {} as Record<string, UserBreakdown>)

      // Create detailed line items
      const lineItems = Object.values(userBreakdown).map((user: UserBreakdown) => ({
        description: `${user.userName} - Professional Services (${user.totalHours} hours)`,
        quantity: user.totalHours,
        rate: user.totalAmount / user.totalHours,
        amount: user.totalAmount,
        details: user.entries.map((entry: unknown) => {
          const e = entry as Record<string, unknown>
          return {
            date: e.date,
            description: e.description,
            hours: e.hours,
            rate: e.rate
          }
        })
      }))

      // Add custom line items if provided
      if (options.customLineItems) {
        lineItems.push(...options.customLineItems.map(item => ({
          ...item,
          details: []
        })))
      }

      // Generate invoice
      const invoice = await this.createInvoice({
        projectId,
        clientId: project.clientId,
        amount: billingResult.amount,
        total: billingResult.breakdown.total,
        taxAmount: billingResult.breakdown.tax,
        discountAmount: billingResult.breakdown.discount,
        currency: config.currency,
        dueDate: options.dueDate || new Date(Date.now() + config.paymentTerms * 24 * 60 * 60 * 1000),
        lineItems,
        notes: options.notes || `Time-based billing for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        template: options.template,
        billingType: 'HOURLY'
      })

      // Link time entries to invoice
      await this.prisma.timeEntry.updateMany({
        where: {
          id: { in: timeEntries.map((entry: unknown) => (entry as Record<string, unknown>).id as string) }
        },
        data: {} // Remove invoiceId update as field doesn't exist
      })

      // Send email if requested
      if (options.sendEmail) {
        await this.sendInvoiceEmail(invoice.id, options.template)
      }

      return invoice

    } catch (error) {
      throw error
    }
  }

  /**
   * Generate milestone-based invoice on project completion
   */
  async generateMilestoneInvoice(
    projectId: string,
    milestoneIds: string[],
    options: InvoiceGenerationOptions = {}
  ) {
    try {
      // Get project and milestone information
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          milestones: {
            where: {
              id: { in: milestoneIds },
              status: 'COMPLETED'
            }
          }
        }
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      if (project.milestones.length === 0) {
        throw new Error('No completed milestones found')
      }

      // Get billing configuration for milestone-based billing
      const config: BillingConfiguration = {
        autoInvoice: true,
        billingCycle: 'ONE_TIME',
        paymentTerms: 30,
        taxRate: 10,
        currency: options.currency || 'USD'
      }

      // Create milestone payments configuration
      const milestonePayments = project.milestones.map(milestone => ({
        milestoneId: milestone.id,
        amount: this.calculateMilestoneAmount(milestone, project),
        percentage: 0 // Will be calculated based on project total
      }))

      const billingModel: BillingModel = {
        type: 'MILESTONE_BASED',
        milestonePayments
      }

      // Calculate milestone billing
      const billingResult = await this.billingEngine.calculateFixedFeeBilling(
        projectId,
        billingModel,
        config
      )

      // Create line items for each milestone
      const lineItems = project.milestones.map(milestone => ({
        description: `Milestone: ${milestone.title}`,
        quantity: 1,
        rate: this.calculateMilestoneAmount(milestone, project),
        amount: this.calculateMilestoneAmount(milestone, project),
        details: {
          milestoneId: milestone.id,
          targetDate: milestone.targetDate,
          completedDate: milestone.actualDate,
          deliverables: milestone.deliverables
        }
      }))

      // Generate invoice
      const invoice = await this.createInvoice({
        projectId,
        clientId: project.clientId,
        amount: billingResult.amount,
        total: billingResult.breakdown.total,
        taxAmount: billingResult.breakdown.tax,
        discountAmount: billingResult.breakdown.discount,
        currency: config.currency,
        dueDate: options.dueDate || new Date(Date.now() + config.paymentTerms * 24 * 60 * 60 * 1000),
        lineItems,
        notes: options.notes || `Milestone completion billing for ${project.milestones.length} completed milestones`,
        template: options.template,
        billingType: 'MILESTONE_BASED'
      })

      // Mark milestones as invoiced
      await this.prisma.projectMilestone.updateMany({
        where: { id: { in: milestoneIds } },
        data: {
          deliverables: JSON.stringify({ invoiced: true, invoiceId: invoice.id })
        }
      })

      // Send email if requested
      if (options.sendEmail) {
        await this.sendInvoiceEmail(invoice.id, options.template)
      }

      return invoice

    } catch (error) {
      throw error
    }
  }

  /**
   * Generate recurring invoice for retainer clients
   */
  async generateRecurringInvoice(
    rule: AutoInvoiceRule,
    options: InvoiceGenerationOptions = {}
  ) {
    try {
      const { projectId, clientId } = rule

      if (!projectId && !clientId) {
        throw new Error('Either projectId or clientId must be specified for recurring invoices')
      }

      // Determine billing period based on frequency
      const now = new Date()
      const { startDate, endDate } = this.calculateBillingPeriod(now, rule.frequency || 'MONTHLY')

      if (projectId) {
        // Project-based recurring invoice
        return await this.generateProjectRecurringInvoice(projectId, rule, startDate, endDate, options)
      } else {
        // Client-based recurring invoice (retainer)
        return await this.generateClientRecurringInvoice(clientId!, rule, startDate, endDate, options)
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Process all scheduled automatic invoices
   */
  async processScheduledInvoices() {
    try {
      // Get all active auto-invoice rules
      const rules = await this.getActiveAutoInvoiceRules()

      const results = []

      for (const rule of rules) {
        try {
          // Check if it's time to generate an invoice for this rule
          if (await this.shouldGenerateInvoice(rule)) {
            const invoice = await this.generateRecurringInvoice(rule, {
              template: rule.template,
              sendEmail: true
            })
            if (invoice?.id) {
              results.push({ ruleId: rule.id, invoiceId: invoice.id, status: 'success' })
            }
          }
        } catch (error) {
          results.push({ ruleId: rule.id, status: 'error', error: (error as Error).message })
        }
      }

      return results

    } catch (error) {
      throw error
    }
  }

  /**
   * Create invoice with multi-currency support and customization
   */
  private async createInvoice({
    projectId,
    clientId,
    amount,
    total,
    taxAmount = 0,
    discountAmount = 0,
    currency = 'USD',
    dueDate,
    lineItems,
    notes,
    template,
    billingType = 'HOURLY'
  }: {
    projectId: string
    clientId: string
    amount: number
    total: number
    taxAmount?: number
    discountAmount?: number
    currency?: string
    dueDate: Date
    lineItems: LineItem[]
    notes?: string
    template?: InvoiceTemplate
    billingType?: string
  }) {
    // Generate unique invoice number with currency prefix
    const invoiceNumber = await this.generateInvoiceNumber(currency)

    // Convert currency if needed
    const convertedAmounts = await this.convertCurrency({
      amount,
      total,
      taxAmount,
      discountAmount
    }, currency)

    const invoiceData = {
      clientId,
      projectId,
      invoiceNumber,
      amount: convertedAmounts.amount,
      total: convertedAmounts.total,
      taxAmount: convertedAmounts.taxAmount,
      discountAmount: convertedAmounts.discountAmount,
      currency,
      status: 'DRAFT' as const,
      billingType: billingType as 'HOURLY' | 'MILESTONE' | 'FIXED' | 'RETAINER',
      dueDate,
      lineItems: JSON.stringify(lineItems),
      notes,
      terms: template?.termsAndConditions,
      metadata: template ? JSON.stringify({
        template: {
          id: template.id,
          name: template.name,
          companyLogo: template.companyLogo,
          companyName: template.companyName,
          companyAddress: template.companyAddress,
          companyEmail: template.companyEmail,
          companyPhone: template.companyPhone,
          headerColor: template.headerColor,
          accentColor: template.accentColor,
          footerText: template.footerText,
          customFields: template.customFields
        }
      }) : null
    }

    const invoice = await this.prisma.invoice.create({
      data: invoiceData,
      include: {
        client: true,
        project: true
      }
    })

    return invoice
  }

  /**
   * Calculate milestone amount based on project value and milestone weight
   */
  private calculateMilestoneAmount(milestone: unknown, project: unknown): number {
    // Default milestone amount calculation
    // This could be enhanced with more sophisticated logic
    const baseAmount = (project as Record<string, unknown>).budget as number || 10000 // Default project budget
    const milestoneWeight = (milestone as Record<string, unknown>).order ? (1 / ((milestone as Record<string, unknown>).order as number)) : 1
    return Math.round(baseAmount * milestoneWeight)
  }

  /**
   * Calculate billing period based on frequency
   */
  private calculateBillingPeriod(date: Date, frequency: string) {
    const startDate = new Date(date)
    const endDate = new Date(date)

    switch (frequency) {
      case 'WEEKLY':
        startDate.setDate(date.getDate() - 7)
        break
      case 'MONTHLY':
        startDate.setMonth(date.getMonth() - 1)
        break
      case 'QUARTERLY':
        startDate.setMonth(date.getMonth() - 3)
        break
      default:
        startDate.setMonth(date.getMonth() - 1)
    }

    return { startDate, endDate }
  }

  /**
   * Generate unique invoice number with currency prefix
   */
  private async generateInvoiceNumber(currency: string): Promise<string> {
    const prefix = currency.toUpperCase()
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  /**
   * Convert currency amounts (placeholder for actual currency conversion)
   */
  private async convertCurrency(amounts: {
    amount: number
    total: number
    taxAmount: number
    discountAmount: number
  }, _targetCurrency: string) {
    // Placeholder for actual currency conversion
    // In production, integrate with exchange rate API
    return amounts
  }

  /**
   * Send invoice email with customized template
   */
  private async sendInvoiceEmail(invoiceId: string, template?: InvoiceTemplate) {
    // Placeholder for email sending logic
    // Integration with email service (SendGrid, AWS SES, etc.)
  }

  /**
   * Get active auto-invoice rules (placeholder)
   */
  private async getActiveAutoInvoiceRules(): Promise<AutoInvoiceRule[]> {
    // Placeholder - would typically fetch from database
    return []
  }

  /**
   * Check if invoice should be generated for a rule (placeholder)
   */
  private async shouldGenerateInvoice(_rule: AutoInvoiceRule): Promise<boolean> {
    // Placeholder for scheduling logic
    return false
  }

  /**
   * Generate project-based recurring invoice (placeholder)
   */
  private async generateProjectRecurringInvoice(
    projectId: string,
    rule: AutoInvoiceRule,
    startDate: Date,
    endDate: Date,
    options: InvoiceGenerationOptions
  ) {
    // Implementation for project-based recurring invoices
    return await this.generateTimeBasedInvoice(projectId, startDate, endDate, options)
  }

  /**
   * Generate client-based recurring invoice (placeholder)
   */
  private async generateClientRecurringInvoice(
    _clientId: string,
    _rule: AutoInvoiceRule,
    _startDate: Date,
    _endDate: Date,
    _options: InvoiceGenerationOptions
  ) {
    // Implementation for client-based recurring invoices
    throw new Error('Client-based recurring invoices not yet implemented')
  }
}

export default AutoInvoiceService