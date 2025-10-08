import { PrismaClient } from '@prisma/client'
import { InvoiceGeneratorService } from './simple-invoice-generator'
import type { InvoiceTemplate } from './simple-invoice-generator'

export interface RecurringInvoiceRule {
  id: string
  clientId: string
  projectId?: string
  name: string
  description?: string
  amount: number
  currency: string
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  dayOfWeek?: number // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number // 1-31 for monthly
  startDate: Date
  endDate?: Date
  isActive: boolean
  template: InvoiceTemplate
  lastGenerated?: Date
  nextDue: Date
  autoSend: boolean
  metadata?: Record<string, unknown>
}

export interface ScheduledInvoiceJob {
  id: string
  ruleId: string
  scheduledFor: Date
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  attempts: number
  errorMessage?: string
  invoiceId?: string
  createdAt: Date
  completedAt?: Date
}

export class AutomatedInvoiceScheduler {
  private prisma: PrismaClient
  private invoiceGenerator: InvoiceGeneratorService
  private recurringRules: Map<string, RecurringInvoiceRule> = new Map()
  private scheduledJobs: Map<string, ScheduledInvoiceJob> = new Map()
  private schedulerInterval?: NodeJS.Timeout

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient
    this.invoiceGenerator = new InvoiceGeneratorService(prismaClient)
    this.loadRecurringRules()
  }

  /**
   * Create a new recurring invoice rule
   */
  async createRecurringRule(rule: Omit<RecurringInvoiceRule, 'id' | 'nextDue'>): Promise<RecurringInvoiceRule> {
    const newRule: RecurringInvoiceRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nextDue: this.calculateNextDueDate(rule.startDate, rule.frequency, rule.dayOfWeek, rule.dayOfMonth)
    }

    // Store in memory cache
    this.recurringRules.set(newRule.id, newRule)

    // In production, store in database
    // Created recurring invoice rule

    // Schedule the first invoice
    await this.scheduleInvoiceJob(newRule)

    return newRule
  }

  /**
   * Update an existing recurring rule
   */
  async updateRecurringRule(ruleId: string, updates: Partial<RecurringInvoiceRule>): Promise<RecurringInvoiceRule> {
    const existingRule = this.recurringRules.get(ruleId)
    if (!existingRule) {
      throw new Error(`Recurring rule ${ruleId} not found`)
    }

    const updatedRule = { ...existingRule, ...updates }

    // Recalculate next due date if frequency or timing changed
    if (updates.frequency || updates.dayOfWeek || updates.dayOfMonth) {
      updatedRule.nextDue = this.calculateNextDueDate(
        new Date(),
        updatedRule.frequency,
        updatedRule.dayOfWeek,
        updatedRule.dayOfMonth
      )
    }

    this.recurringRules.set(ruleId, updatedRule)

    // Updated recurring invoice rule

    return updatedRule
  }

  /**
   * Delete a recurring rule
   */
  async deleteRecurringRule(ruleId: string): Promise<void> {
    this.recurringRules.delete(ruleId)
    
    // Cancel any pending jobs for this rule
    const pendingJobs = Array.from(this.scheduledJobs.values())
      .filter(job => job.ruleId === ruleId && job.status === 'PENDING')

    for (const job of pendingJobs) {
      this.scheduledJobs.delete(job.id)
    }

    // Deleted recurring rule and cancelled pending jobs
  }

  /**
   * Get all recurring rules
   */
  getRecurringRules(): RecurringInvoiceRule[] {
    return Array.from(this.recurringRules.values())
  }

  /**
   * Get active recurring rules
   */
  getActiveRecurringRules(): RecurringInvoiceRule[] {
    return this.getRecurringRules().filter(rule => rule.isActive)
  }

  /**
   * Process all scheduled invoice jobs
   */
  async processScheduledJobs(): Promise<ScheduledInvoiceJob[]> {
    const now = new Date()
    const results: ScheduledInvoiceJob[] = []

    // Find jobs that are due to run
    const dueJobs = Array.from(this.scheduledJobs.values())
      .filter(job => 
        job.status === 'PENDING' && 
        job.scheduledFor <= now &&
        job.attempts < 3 // Max 3 attempts
      )

    // Processing scheduled invoice jobs

    for (const job of dueJobs) {
      try {
        await this.processInvoiceJob(job)
        results.push(job)
      } catch (error) {
        // Error processing job
        job.status = 'FAILED'
        job.attempts += 1
        job.errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push(job)
      }
    }

    return results
  }

  /**
   * Process a single invoice job
   */
  private async processInvoiceJob(job: ScheduledInvoiceJob): Promise<void> {
    job.status = 'PROCESSING'
    job.attempts += 1

    const rule = this.recurringRules.get(job.ruleId)
    if (!rule) {
      throw new Error(`Recurring rule ${job.ruleId} not found`)
    }

    if (!rule.isActive) {
      throw new Error(`Recurring rule ${job.ruleId} is not active`)
    }

    try {
      // Generate the invoice
      const frequency = rule.frequency === 'WEEKLY' ? 'MONTHLY' : 
                       rule.frequency === 'QUARTERLY' ? 'QUARTERLY' : 'MONTHLY'
      
      const invoice = await this.invoiceGenerator.generateRetainerInvoice(
        rule.clientId,
        rule.amount,
        frequency,
        {
          currency: rule.currency,
          sendEmail: rule.autoSend,
          notes: rule.description,
          template: rule.template
        }
      )

      // Update job status
      job.status = 'COMPLETED'
      job.invoiceId = invoice.id
      job.completedAt = new Date()

      // Update rule with last generated date
      rule.lastGenerated = new Date()
      rule.nextDue = this.calculateNextDueDate(
        new Date(),
        rule.frequency,
        rule.dayOfWeek,
        rule.dayOfMonth
      )

      // Schedule the next invoice
      await this.scheduleInvoiceJob(rule)

      // Successfully generated recurring invoice

    } catch (error) {
      job.status = 'FAILED'
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  /**
   * Schedule an invoice job for a recurring rule
   */
  private async scheduleInvoiceJob(rule: RecurringInvoiceRule): Promise<ScheduledInvoiceJob> {
    const job: ScheduledInvoiceJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      scheduledFor: rule.nextDue,
      status: 'PENDING',
      attempts: 0,
      createdAt: new Date()
    }

    this.scheduledJobs.set(job.id, job)

    // Scheduled invoice job

    return job
  }

  /**
   * Calculate the next due date based on frequency and timing preferences
   */
  private calculateNextDueDate(
    fromDate: Date,
    frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    dayOfWeek?: number,
    dayOfMonth?: number
  ): Date {
    const nextDate = new Date(fromDate)

    switch (frequency) {
      case 'WEEKLY':
        // Add 7 days
        nextDate.setDate(nextDate.getDate() + 7)
        
        // Set to specific day of week if provided
        if (dayOfWeek !== undefined) {
          const currentDay = nextDate.getDay()
          const daysToAdd = (dayOfWeek - currentDay + 7) % 7
          nextDate.setDate(nextDate.getDate() + daysToAdd)
        }
        break

      case 'MONTHLY':
        // Add 1 month
        nextDate.setMonth(nextDate.getMonth() + 1)
        
        // Set to specific day of month if provided
        if (dayOfMonth !== undefined) {
          nextDate.setDate(Math.min(dayOfMonth, this.getDaysInMonth(nextDate)))
        }
        break

      case 'QUARTERLY':
        // Add 3 months
        nextDate.setMonth(nextDate.getMonth() + 3)
        
        // Set to specific day of month if provided
        if (dayOfMonth !== undefined) {
          nextDate.setDate(Math.min(dayOfMonth, this.getDaysInMonth(nextDate)))
        }
        break

      case 'YEARLY':
        // Add 1 year
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        
        // Set to specific day of month if provided
        if (dayOfMonth !== undefined) {
          nextDate.setDate(Math.min(dayOfMonth, this.getDaysInMonth(nextDate)))
        }
        break
    }

    return nextDate
  }

  /**
   * Get number of days in a month
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  /**
   * Load recurring rules from storage (placeholder)
   */
  private async loadRecurringRules(): Promise<void> {
    // In production, load from database
    // For now, create some mock rules
    const mockRules: RecurringInvoiceRule[] = [
      {
        id: 'rule-1',
        clientId: '1',
        name: 'Acme Corp Monthly Retainer',
        description: 'Monthly retainer services',
        amount: 5000,
        currency: 'USD',
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        startDate: new Date('2024-01-01'),
        isActive: true,
        template: this.invoiceGenerator.getDefaultTemplate(),
        nextDue: new Date('2024-02-01'),
        autoSend: true
      },
      {
        id: 'rule-2',
        clientId: '2',
        name: 'TechStart Quarterly Support',
        description: 'Quarterly technical support package',
        amount: 12000,
        currency: 'USD',
        frequency: 'QUARTERLY',
        dayOfMonth: 15,
        startDate: new Date('2024-01-15'),
        isActive: true,
        template: this.invoiceGenerator.getDefaultTemplate(),
        nextDue: new Date('2024-04-15'),
        autoSend: true
      }
    ]

    for (const rule of mockRules) {
      this.recurringRules.set(rule.id, rule)
    }

    // Loaded recurring invoice rules
  }

  /**
   * Get upcoming invoices (next 30 days)
   */
  getUpcomingInvoices(days: number = 30): Array<{
    rule: RecurringInvoiceRule
    dueDate: Date
    amount: number
    currency: string
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() + days)

    return this.getActiveRecurringRules()
      .filter(rule => rule.nextDue <= cutoffDate)
      .map(rule => ({
        rule,
        dueDate: rule.nextDue,
        amount: rule.amount,
        currency: rule.currency
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
  }

  /**
   * Get scheduled jobs
   */
  getScheduledJobs(): ScheduledInvoiceJob[] {
    return Array.from(this.scheduledJobs.values())
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
  }

  /**
   * Get job statistics
   */
  getJobStatistics(): {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
  } {
    const jobs = this.getScheduledJobs()
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'PENDING').length,
      processing: jobs.filter(j => j.status === 'PROCESSING').length,
      completed: jobs.filter(j => j.status === 'COMPLETED').length,
      failed: jobs.filter(j => j.status === 'FAILED').length
    }
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(): Promise<ScheduledInvoiceJob[]> {
    const failedJobs = this.getScheduledJobs()
      .filter(job => job.status === 'FAILED' && job.attempts < 3)

    // Retrying failed jobs

    for (const job of failedJobs) {
      job.status = 'PENDING'
      job.errorMessage = undefined
    }

    return this.processScheduledJobs()
  }

  /**
   * Start the scheduler (in production, this would be a cron job or background service)
   */
  startScheduler(intervalMinutes: number = 60): void {
    // Starting automated invoice scheduler

    this.schedulerInterval = setInterval(async () => {
      try {
        await this.processScheduledJobs()
      } catch (error) {
        // Error in scheduled job processing
      }
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = undefined
      // Stopped automated invoice scheduler
    }
  }
}

export default AutomatedInvoiceScheduler