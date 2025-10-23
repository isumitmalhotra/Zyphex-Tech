/**
 * Trigger Evaluator - Evaluates workflow triggers
 * 
 * Determines if workflow triggers match the current execution context.
 * Handles trigger validation and matching logic.
 * 
 * @module lib/workflow/trigger-evaluator
 */

import {
  TriggerConfig,
  TriggerType,
  ExecutionContext,
  ProjectTriggerConfig,
  TaskTriggerConfig,
  FinancialTriggerConfig,
} from '@/types/workflow'

/**
 * Evaluates workflow triggers against execution context
 */
export class TriggerEvaluator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(prisma: any) {
    this.prisma = prisma
  }

  /**
   * Initialize the trigger evaluator
   */
  public async initialize(): Promise<void> {
    // Initialization logic if needed
  }

  /**
   * Evaluate if triggers match the execution context
   */
  public async evaluate(
    triggers: TriggerConfig[],
    context: ExecutionContext
  ): Promise<boolean> {
    if (!triggers || triggers.length === 0) {
      return true // No triggers = always execute
    }

    // All triggers must match (AND logic)
    for (const trigger of triggers) {
      if (trigger.enabled === false) {
        continue
      }

      const matches = await this.evaluateTrigger(trigger, context)
      if (!matches) {
        return false
      }
    }

    return true
  }

  /**
   * Evaluate a single trigger
   */
  private async evaluateTrigger(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): Promise<boolean> {
    switch (trigger.type) {
      // Project Triggers
      case TriggerType.PROJECT_CREATED:
        return this.evaluateProjectCreated(trigger, context)
      case TriggerType.PROJECT_STATUS_CHANGED:
        return this.evaluateProjectStatusChanged(trigger, context)
      case TriggerType.PROJECT_MILESTONE_REACHED:
        return this.evaluateProjectMilestoneReached(trigger, context)
      case TriggerType.PROJECT_BUDGET_THRESHOLD:
        return this.evaluateProjectBudgetThreshold(trigger, context)
      case TriggerType.PROJECT_DEADLINE_APPROACHING:
        return this.evaluateProjectDeadlineApproaching(trigger, context)

      // Task Triggers
      case TriggerType.TASK_CREATED:
        return this.evaluateTaskCreated(trigger, context)
      case TriggerType.TASK_ASSIGNED:
        return this.evaluateTaskAssigned(trigger, context)
      case TriggerType.TASK_COMPLETED:
        return this.evaluateTaskCompleted(trigger, context)
      case TriggerType.TASK_OVERDUE:
        return this.evaluateTaskOverdue(trigger, context)
      case TriggerType.TASK_PRIORITY_CHANGED:
        return this.evaluateTaskPriorityChanged(trigger, context)
      case TriggerType.TASK_STATUS_CHANGED:
        return this.evaluateTaskStatusChanged(trigger, context)

      // Financial Triggers
      case TriggerType.INVOICE_CREATED:
        return this.evaluateInvoiceCreated(trigger, context)
      case TriggerType.INVOICE_SENT:
        return this.evaluateInvoiceSent(trigger, context)
      case TriggerType.INVOICE_PAID:
        return this.evaluateInvoicePaid(trigger, context)
      case TriggerType.INVOICE_OVERDUE:
        return this.evaluateInvoiceOverdue(trigger, context)
      case TriggerType.PAYMENT_RECEIVED:
        return this.evaluatePaymentReceived(trigger, context)

      // Schedule Triggers (handled by cron jobs)
      case TriggerType.SCHEDULE_DAILY:
      case TriggerType.SCHEDULE_WEEKLY:
      case TriggerType.SCHEDULE_MONTHLY:
      case TriggerType.SCHEDULE_CUSTOM:
        return true // Already triggered by scheduler

      // Manual/Webhook
      case TriggerType.MANUAL:
      case TriggerType.WEBHOOK:
        return true // Already triggered manually

      default:
        console.warn(`Unknown trigger type: ${trigger.type}`)
        return false
    }
  }

  // ========================================================================
  // PROJECT TRIGGER EVALUATORS
  // ========================================================================

  private evaluateProjectCreated(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    return context.entity?.type === 'project'
  }

  private evaluateProjectStatusChanged(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'project') return false

    const config = trigger.config as ProjectTriggerConfig
    if (!config.status || config.status.length === 0) return true

    const projectData = context.entity.data as Record<string, unknown>
    const newStatus = projectData?.status as string

    return config.status.includes(newStatus)
  }

  private evaluateProjectMilestoneReached(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'project') return false

    const config = trigger.config as ProjectTriggerConfig
    const projectData = context.entity.data as Record<string, unknown>

    if (config.milestoneId) {
      return projectData?.milestoneId === config.milestoneId
    }

    return !!projectData?.milestoneReached
  }

  private evaluateProjectBudgetThreshold(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'project') return false

    const config = trigger.config as ProjectTriggerConfig
    if (!config.budgetThreshold) return true

    const projectData = context.entity.data as Record<string, unknown>
    const budgetUsed = projectData?.budgetUsed as number
    const budgetTotal = projectData?.budgetTotal as number

    if (!budgetUsed || !budgetTotal) return false

    const percentage = (budgetUsed / budgetTotal) * 100
    return percentage >= config.budgetThreshold
  }

  private evaluateProjectDeadlineApproaching(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'project') return false

    const config = trigger.config as ProjectTriggerConfig
    if (!config.deadlineDays) return true

    const projectData = context.entity.data as Record<string, unknown>
    const deadline = projectData?.deadline as string

    if (!deadline) return false

    const deadlineDate = new Date(deadline)
    const now = new Date()
    const daysUntilDeadline = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return daysUntilDeadline <= config.deadlineDays
  }

  // ========================================================================
  // TASK TRIGGER EVALUATORS
  // ========================================================================

  private evaluateTaskCreated(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    return context.entity?.type === 'task'
  }

  private evaluateTaskAssigned(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'task') return false

    const config = trigger.config as TaskTriggerConfig
    const taskData = context.entity.data as Record<string, unknown>

    if (config.assigneeId) {
      return taskData?.assigneeId === config.assigneeId
    }

    return !!taskData?.assigneeId
  }

  private evaluateTaskCompleted(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'task') return false

    const taskData = context.entity.data as Record<string, unknown>
    return taskData?.status === 'COMPLETED' || taskData?.completed === true
  }

  private evaluateTaskOverdue(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'task') return false

    const taskData = context.entity.data as Record<string, unknown>
    const dueDate = taskData?.dueDate as string

    if (!dueDate) return false

    const dueDateObj = new Date(dueDate)
    const now = new Date()

    return dueDateObj < now && taskData?.status !== 'COMPLETED'
  }

  private evaluateTaskPriorityChanged(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'task') return false

    const config = trigger.config as TaskTriggerConfig
    if (!config.priority || config.priority.length === 0) return true

    const taskData = context.entity.data as Record<string, unknown>
    const newPriority = taskData?.priority as string

    return config.priority.includes(newPriority)
  }

  private evaluateTaskStatusChanged(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'task') return false

    const config = trigger.config as TaskTriggerConfig
    if (!config.status || config.status.length === 0) return true

    const taskData = context.entity.data as Record<string, unknown>
    const newStatus = taskData?.status as string

    return config.status.includes(newStatus)
  }

  // ========================================================================
  // FINANCIAL TRIGGER EVALUATORS
  // ========================================================================

  private evaluateInvoiceCreated(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    return context.entity?.type === 'invoice'
  }

  private evaluateInvoiceSent(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'invoice') return false

    const invoiceData = context.entity.data as Record<string, unknown>
    return invoiceData?.status === 'SENT' || !!invoiceData?.sentAt
  }

  private evaluateInvoicePaid(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'invoice') return false

    const invoiceData = context.entity.data as Record<string, unknown>
    return invoiceData?.status === 'PAID' || !!invoiceData?.paidAt
  }

  private evaluateInvoiceOverdue(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'invoice') return false

    const config = trigger.config as FinancialTriggerConfig
    const invoiceData = context.entity.data as Record<string, unknown>
    const dueDate = invoiceData?.dueDate as string

    if (!dueDate) return false

    const dueDateObj = new Date(dueDate)
    const now = new Date()
    const daysOverdue = Math.ceil(
      (now.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (config.overdueDays) {
      return daysOverdue >= config.overdueDays
    }

    return daysOverdue > 0 && invoiceData?.status !== 'PAID'
  }

  private evaluatePaymentReceived(
    trigger: TriggerConfig,
    context: ExecutionContext
  ): boolean {
    if (context.entity?.type !== 'invoice') return false

    const config = trigger.config as FinancialTriggerConfig
    const invoiceData = context.entity.data as Record<string, unknown>

    if (config.amountThreshold) {
      const amount = invoiceData?.amount as number
      return amount >= config.amountThreshold
    }

    return !!invoiceData?.paidAt
  }
}
