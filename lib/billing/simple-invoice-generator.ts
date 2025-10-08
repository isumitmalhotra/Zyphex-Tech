import { PrismaClient } from '@prisma/client'

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
}

export interface InvoiceGenerationOptions {
  template?: InvoiceTemplate
  currency?: string
  dueDate?: Date
  sendEmail?: boolean
  notes?: string
}

export class InvoiceGeneratorService {
  private prisma: PrismaClient

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
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
      // Get project information
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true
        }
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get billable time entries
      const timeEntries = await this.prisma.timeEntry.findMany({
        where: {
          projectId,
          date: { gte: startDate, lte: endDate },
          billable: true,
          status: 'APPROVED'
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

      // Calculate totals
      const subtotal = timeEntries.reduce((sum, entry) => sum + entry.amount, 0)
      const taxRate = 0.1 // 10% tax
      const taxAmount = subtotal * taxRate
      const total = subtotal + taxAmount

      // Create line items grouped by user
      interface UserGroup {
        userName: string
        hours: number
        amount: number
        entries: Array<{
          date: string
          description: string
          hours: number
          rate: number
        }>
      }

      const userGroups = timeEntries.reduce((groups, entry) => {
        const userId = entry.userId
        if (!groups[userId]) {
          groups[userId] = {
            userName: entry.user?.name || 'Unknown User',
            hours: 0,
            amount: 0,
            entries: []
          }
        }
        groups[userId].hours += entry.hours
        groups[userId].amount += entry.amount
        groups[userId].entries.push({
          date: entry.date.toISOString().split('T')[0],
          description: entry.description || '',
          hours: entry.hours,
          rate: entry.rate
        })
        return groups
      }, {} as Record<string, UserGroup>)

      const lineItems = Object.values(userGroups).map((group) => ({
        description: `${group.userName} - Professional Services`,
        quantity: group.hours,
        rate: group.amount / group.hours,
        amount: group.amount,
        details: group.entries
      }))

      // Generate invoice
      const invoice = await this.createInvoice({
        projectId,
        clientId: project.clientId,
        amount: subtotal,
        total,
        taxAmount,
        dueDate: options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems,
        notes: options.notes || `Time-based billing for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        template: options.template
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
   * Generate milestone-based invoice
   */
  async generateMilestoneInvoice(
    projectId: string,
    milestoneIds: string[],
    options: InvoiceGenerationOptions = {}
  ) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { client: true }
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

      // Calculate milestone amounts (simplified)
      const baseAmount = project.budget || 10000
      const milestoneAmount = baseAmount / milestones.length

      const subtotal = milestoneAmount * milestones.length
      const taxAmount = subtotal * 0.1
      const total = subtotal + taxAmount

      const lineItems = milestones.map(milestone => ({
        description: `Milestone: ${milestone.title}`,
        quantity: 1,
        rate: milestoneAmount,
        amount: milestoneAmount,
        details: {
          targetDate: milestone.targetDate,
          completedDate: milestone.actualDate
        }
      }))

      const invoice = await this.createInvoice({
        projectId,
        clientId: project.clientId,
        amount: subtotal,
        total,
        taxAmount,
        dueDate: options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems,
        notes: options.notes || `Milestone completion billing`,
        template: options.template
      })

      if (options.sendEmail) {
        await this.sendInvoiceEmail(invoice.id, options.template)
      }

      return invoice

    } catch (error) {
      throw error
    }
  }

  /**
   * Generate recurring retainer invoice
   */
  async generateRetainerInvoice(
    clientId: string,
    amount: number,
    frequency: 'MONTHLY' | 'QUARTERLY',
    options: InvoiceGenerationOptions = {}
  ) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: clientId }
      })

      if (!client) {
        throw new Error(`Client ${clientId} not found`)
      }

      const taxAmount = amount * 0.1
      const total = amount + taxAmount

      const lineItems = [{
        description: `${frequency.toLowerCase()} retainer service`,
        quantity: 1,
        rate: amount,
        amount,
        details: {
          frequency,
          period: new Date().toISOString().split('T')[0]
        }
      }]

      const invoice = await this.createInvoice({
        projectId: '', // No specific project
        clientId,
        amount,
        total,
        taxAmount,
        dueDate: options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lineItems,
        notes: options.notes || `${frequency} retainer billing`,
        template: options.template
      })

      if (options.sendEmail) {
        await this.sendInvoiceEmail(invoice.id, options.template)
      }

      return invoice

    } catch (error) {
      throw error
    }
  }

  /**
   * Create invoice record in database
   */
  private async createInvoice({
    projectId,
    clientId,
    amount,
    total,
    taxAmount = 0,
    dueDate,
    lineItems,
    notes,
    template
  }: {
    projectId: string
    clientId: string
    amount: number
    total: number
    taxAmount?: number
    dueDate: Date
    lineItems: Array<{
      description: string
      quantity: number
      rate: number
      amount: number
      details: object
    }>
    notes?: string
    template?: InvoiceTemplate
  }) {
    const invoiceNumber = `INV-${Date.now()}`

    const invoiceData = {
      clientId,
      projectId: projectId || undefined,
      invoiceNumber,
      amount,
      total,
      taxAmount,
      status: 'DRAFT' as const,
      dueDate,
      lineItems: JSON.stringify(lineItems),
      notes,
      terms: template?.termsAndConditions,
      metadata: template ? JSON.stringify({ template }) : null
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
   * Send invoice email
   */
  private async sendInvoiceEmail(invoiceId: string, template?: InvoiceTemplate) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { client: true, project: true }
      })

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`)
      }

      // Update invoice status
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'SENT' }
      })

      return true

    } catch (error) {
      throw error
    }
  }

  /**
   * Get multi-currency exchange rates
   */
  async getExchangeRates(): Promise<Record<string, number>> {
    // Mock exchange rates - in production, integrate with currency API
    return {
      'USD-EUR': 0.85,
      'USD-GBP': 0.73,
      'USD-CAD': 1.25,
      'EUR-USD': 1.18,
      'GBP-USD': 1.37,
      'CAD-USD': 0.80
    }
  }

  /**
   * Convert currency amount
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount
    }

    const rates = await this.getExchangeRates()
    const rateKey = `${fromCurrency}-${toCurrency}`
    const rate = rates[rateKey] || 1.0

    return amount * rate
  }

  /**
   * Get default company template
   */
  getDefaultTemplate(): InvoiceTemplate {
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
      termsAndConditions: 'Payment is due within 30 days of invoice date. Late payments may incur additional fees.'
    }
  }
}

export default InvoiceGeneratorService