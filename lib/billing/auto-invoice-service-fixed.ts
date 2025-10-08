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

export interface CurrencyExchangeRate {
  from: string
  to: string
  rate: number
  lastUpdated: Date
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
  private exchangeRates: Map<string, CurrencyExchangeRate> = new Map()

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
    this.billingEngine = new MultiBillingEngine(prismaClient)
    this.initializeExchangeRates()
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
        }
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get billable time entries for the period
      const timeEntries = await this.prisma.timeEntry.findMany({
        where: {
          projectId,
          date: { gte: startDate, lte: endDate },
          billable: true,
          status: 'APPROVED'
          // Remove invoiceId filter as field doesn't exist in schema
        },
        include: {
          user: { 
            select: { 
              id: true,
              name: true, 
              hourlyRate: true 
            } 
          }
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
      }

      // Calculate hourly billing
      const billingResult = await this.billingEngine.calculateHourlyBilling(
        projectId,
        startDate,
        endDate,
        config
      )

      // Group time entries by user for detailed breakdown
      interface UserBreakdown {
        userName: string
        entries: typeof timeEntries
        totalHours: number
        totalAmount: number
      }

      const userBreakdown = timeEntries.reduce((acc: Record<string, {
        userName: string
        entries: unknown[]
        totalHours: number
        totalAmount: number
      }>, entry: unknown) => {
        const e = entry as Record<string, unknown>
        const userId = e.userId as string
        const userName = (e.user as Record<string, unknown>)?.name as string || 'Unknown User'
        if (!acc[userId]) {
          acc[userId] = {
            userName,
            entries: [],
            totalHours: 0,
            totalAmount: 0
          }
        }
        acc[userId].entries.push(entry)
        acc[userId].totalHours += e.hours as number
        acc[userId].totalAmount += (e.amount as number) || ((e.hours as number) * ((e.user as Record<string, unknown>)?.hourlyRate as number || 0))
        return acc
      }, {} as Record<string, UserBreakdown>)

      // Create detailed line items
      const lineItems = Object.values(userBreakdown).map((user) => ({
        description: `${user.userName} - Professional Services (${user.totalHours} hours)`,
        quantity: user.totalHours,
        rate: user.totalAmount / user.totalHours,
        amount: user.totalAmount,
        details: user.entries.map((entry: unknown) => {
          const e = entry as Record<string, unknown>
          return {
            date: e.date as Date,
            description: e.description as string | null,
            hours: e.hours as number,
            rate: e.rate as number
          }
        })
      }))

      // Add custom line items if provided
      if (options.customLineItems) {
        const customWithDetails = options.customLineItems.map(item => ({
          ...item,
          details: []
        }))
        lineItems.push(...customWithDetails)
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
        _billingType: 'HOURLY'
      })

      // Link time entries to invoice
      await this.prisma.timeEntry.updateMany({
        where: {
          id: { in: timeEntries.map(entry => entry.id) }
        },
        data: { 
          // Remove invoiceId update as field doesn't exist in schema
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
          client: true
        }
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      const milestones = await this.prisma.projectMilestone.findMany({
        where: {
          id: { in: milestoneIds },
          status: 'COMPLETED'
        }
      })

      if (milestones.length === 0) {
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
      const milestonePayments = milestones.map(milestone => ({
        milestoneId: milestone.id,
        amount: this.calculateMilestoneAmount(milestone, project),
        percentage: 0
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
      const lineItems = milestones.map(milestone => ({
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
        notes: options.notes || `Milestone completion billing for ${milestones.length} completed milestones`,
        template: options.template,
        _billingType: 'MILESTONE_BASED'
      })

      // Mark milestones as invoiced
      await this.prisma.projectMilestone.updateMany({
        where: { id: { in: milestoneIds } },
        data: {
          deliverables: JSON.stringify({ 
            ...(typeof milestones[0].deliverables === 'object' && milestones[0].deliverables !== null ? milestones[0].deliverables : {}),
            invoiced: true, 
            invoiceId: invoice.id 
          })
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
    clientId: string,
    amount: number,
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
    options: InvoiceGenerationOptions = {}
  ) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      })

      if (!client) {
        throw new Error(`Client ${clientId} not found`)
      }

      // Calculate billing period
      const now = new Date()
      const { startDate, endDate } = this.calculateBillingPeriod(now, frequency)

      // Check if invoice already exists for this period
      const existingInvoice = await this.prisma.invoice.findFirst({
        where: {
          clientId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: ['DRAFT', 'SENT', 'PAID']
          }
        }
      })

      if (existingInvoice) {
        throw new Error(`Invoice already exists for this billing period`)
      }

      const config: BillingConfiguration = {
        autoInvoice: true,
        billingCycle: frequency,
        paymentTerms: 30,
        taxRate: 10,
        currency: options.currency || 'USD'
      }

      // Convert amount to target currency
      const convertedAmount = await this.convertCurrency(amount, 'USD', config.currency)
      const taxAmount = convertedAmount * (config.taxRate / 100)
      const total = convertedAmount + taxAmount

      // Create line items for recurring service
      const lineItems = [{
        description: `${frequency.toLowerCase()} retainer service`,
        quantity: 1,
        rate: convertedAmount,
        amount: convertedAmount,
        details: {
          period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          frequency
        }
      }]

      // Generate invoice
      const invoice = await this.createInvoice({
        projectId: '', // No specific project for retainer
        clientId,
        amount: convertedAmount,
        total,
        taxAmount,
        discountAmount: 0,
        currency: config.currency,
        dueDate: options.dueDate || new Date(Date.now() + config.paymentTerms * 24 * 60 * 60 * 1000),
        lineItems,
        notes: options.notes || `${frequency} retainer billing`,
        template: options.template,
        _billingType: 'RETAINER'
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
    _billingType = 'HOURLY'
  }: {
    projectId: string
    clientId: string
    amount: number
    total: number
    taxAmount?: number
    discountAmount?: number
    currency?: string
    dueDate: Date
    lineItems: Array<{
      description: string
      quantity: number
      rate: number
      amount: number
      details?: Array<{
        date: Date
        description: string | null
        hours: number
        rate: number
      }> | Record<string, unknown> | unknown[]
    }>
    notes?: string
    template?: InvoiceTemplate
    _billingType?: string
  }) {
    // Generate unique invoice number with currency prefix
    const invoiceNumber = await this.generateInvoiceNumber(currency)

    const invoiceData = {
      clientId,
      projectId: projectId || undefined,
      invoiceNumber,
      amount,
      total,
      taxAmount,
      discountAmount,
      status: 'DRAFT' as const,
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
    const baseAmount = (project as Record<string, unknown>).budget as number || 10000
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
   * Convert currency with caching
   */
  private async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount
    }

    const rateKey = `${fromCurrency}-${toCurrency}`
    let exchangeRate = this.exchangeRates.get(rateKey)

    // Check if rate is stale (older than 1 hour)
    if (!exchangeRate || Date.now() - exchangeRate.lastUpdated.getTime() > 3600000) {
      exchangeRate = await this.fetchExchangeRate(fromCurrency, toCurrency)
      this.exchangeRates.set(rateKey, exchangeRate)
    }

    return amount * exchangeRate.rate
  }

  /**
   * Fetch exchange rate from external API
   */
  private async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<CurrencyExchangeRate> {
    // Placeholder implementation - in production, integrate with actual exchange rate API
    // Example: exchangerate-api.com, fixer.io, or currencylayer.com
    
    const mockRates: Record<string, number> = {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-CAD': 1.25,
      'EUR-USD': 1.18,
      'GBP-USD': 1.37,
      'CAD-USD': 0.80
    }

    const rateKey = `${fromCurrency}-${toCurrency}`
    const rate = mockRates[rateKey] || 1.0

    return {
      from: fromCurrency,
      to: toCurrency,
      rate,
      lastUpdated: new Date()
    }
  }

  /**
   * Initialize exchange rates cache
   */
  private initializeExchangeRates() {
    // Initialize with common currency pairs
    const commonPairs = ['USD-EUR', 'USD-GBP', 'USD-CAD', 'EUR-USD', 'GBP-USD', 'CAD-USD']
    
    commonPairs.forEach(async (pair) => {
      const [from, to] = pair.split('-')
      try {
        const rate = await this.fetchExchangeRate(from, to)
        this.exchangeRates.set(pair, rate)
      } catch (error) {
        // Silent failure for exchange rate initialization
      }
    })
  }

  /**
   * Send invoice email with customized template
   */
  private async sendInvoiceEmail(invoiceId: string, template?: InvoiceTemplate) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          project: true
        }
      })

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`)
      }

      // Email configuration
      const emailData = {
        to: invoice.client.email,
        subject: `Invoice ${invoice.invoiceNumber} from ${template?.companyName || 'Your Company'}`,
        template: template || this.getDefaultTemplate(),
        invoice,
        attachments: []
      }

      // Update invoice status to SENT
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
          status: 'SENT'
          // Remove sentAt field as it doesn't exist in schema
        }
      })

      return true

    } catch (error) {
      throw error
    }
  }

  /**
   * Get default invoice template
   */
  private getDefaultTemplate(): InvoiceTemplate {
    return {
      id: 'default',
      name: 'Default Template',
      companyName: 'Zyphex Technologies',
      companyAddress: '123 Business Street, City, State 12345',
      companyEmail: 'billing@zyphex.com',
      companyPhone: '+1 (555) 123-4567',
      headerColor: '#2563eb',
      accentColor: '#3b82f6',
      footerText: 'Thank you for your business!',
      termsAndConditions: 'Payment is due within 30 days of invoice date.'
    }
  }

  /**
   * Get exchange rate for currency conversion
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return 1.0
    }

    const rate = await this.convertCurrency(1, fromCurrency, toCurrency)
    return rate
  }

  /**
   * Generate invoice PDF (placeholder)
   */
  async generateInvoicePDF(invoiceId: string, template?: InvoiceTemplate): Promise<Buffer> {
    // Placeholder for PDF generation
    // In production, integrate with PDF library like puppeteer, jsPDF, or PDFKit
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, project: true }
    })

    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`)
    }

    // Mock PDF buffer
    const pdfContent = `Invoice ${invoice.invoiceNumber} - ${template?.companyName || 'Company'}`
    return Buffer.from(pdfContent)
  }
}

export default AutoInvoiceService