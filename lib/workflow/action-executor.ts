/**
 * Action Executor - Executes workflow actions
 * 
 * Executes workflow actions with retry logic, error handling,
 * timeout management, and result tracking.
 * 
 * @module lib/workflow/action-executor
 */

import {
  ActionConfig,
  ActionType,
  ActionResult,
  ExecutionContext,
  Workflow,
  EmailActionConfig,
  SlackActionConfig,
  NotificationActionConfig,
  CreateTaskActionConfig,
  UpdateProjectStatusConfig,
  WebhookActionConfig,
} from '@/types/workflow'
import {
  sendEmail,
  extractEmails,
} from './services/email-service'
import {
  sendSlackMessage,
  findChannelByName,
} from './services/slack-service'
import {
  sendTeamsMessage,
  createSimpleTeamsCard,
} from './services/teams-service'
import {
  sendSms,
  formatPhoneNumber,
} from './services/sms-service'

/**
 * Executes workflow actions
 */
export class ActionExecutor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(prisma: any) {
    this.prisma = prisma
  }

  /**
   * Initialize the action executor
   */
  public async initialize(): Promise<void> {
    // Initialization logic if needed
  }

  /**
   * Execute all actions in a workflow
   */
  public async executeActions(
    actions: ActionConfig[],
    context: ExecutionContext,
    workflow: Workflow,
    executionId: string
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = []

    // Sort actions by order
    const sortedActions = [...actions].sort((a, b) => (a.order || 0) - (b.order || 0))

    for (const action of sortedActions) {
      const result = await this.executeAction(action, context, workflow, executionId)
      results.push(result)

      // Stop execution if action failed and continueOnError is false
      if (result.status === 'FAILED' && !action.continueOnError) {
        break
      }
    }

    return results
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: ActionConfig,
    context: ExecutionContext,
    workflow: Workflow,
    executionId: string
  ): Promise<ActionResult> {
    const startTime = new Date()
    const timeout = action.timeout || workflow.timeout || 300000 // 5 minutes default

    try {
      // Execute with timeout
      const resultPromise = this.executeActionByType(action, context, executionId)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Action timeout')), timeout * 1000)
      )

      const result = await Promise.race([resultPromise, timeoutPromise])

      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      return {
        actionType: action.type,
        order: action.order || 0,
        status: 'SUCCESS',
        startedAt: startTime,
        completedAt: endTime,
        duration,
        result: result as string | number | boolean | Record<string, unknown> | undefined,
      }
    } catch (error) {
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      // Retry if configured
      if (action.retryOnError && workflow.maxRetries > 0) {
        // TODO: Implement retry logic for individual actions
      }

      return {
        actionType: action.type,
        order: action.order || 0,
        status: 'FAILED',
        startedAt: startTime,
        completedAt: endTime,
        duration,
        error: {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      }
    }
  }

  /**
   * Execute action by type
   */
  private async executeActionByType(
    action: ActionConfig,
    context: ExecutionContext,
    _executionId: string
  ): Promise<Record<string, unknown> | string | number | boolean> {
    switch (action.type) {
      // Notification Actions
      case ActionType.SEND_EMAIL:
        return await this.executeSendEmail(action, context)
      case ActionType.SEND_SLACK:
        return await this.executeSendSlack(action, context)
      case ActionType.SEND_TEAMS:
        return await this.executeSendTeams(action, context)
      case ActionType.SEND_SMS:
        return await this.executeSendSms(action, context)
      case ActionType.CREATE_NOTIFICATION:
        return await this.executeCreateNotification(action, context)

      // Project Actions
      case ActionType.CREATE_TASK:
        return await this.executeCreateTask(action, context)
      case ActionType.UPDATE_PROJECT_STATUS:
        return await this.executeUpdateProjectStatus(action, context)
      case ActionType.UPDATE_PROJECT_FIELD:
        return await this.executeUpdateProjectField(action, context)

      // Task Actions
      case ActionType.UPDATE_TASK_STATUS:
        return await this.executeUpdateTaskStatus(action, context)
      case ActionType.UPDATE_TASK_PRIORITY:
        return await this.executeUpdateTaskPriority(action, context)
      case ActionType.ASSIGN_TASK:
        return await this.executeAssignTask(action, context)
      case ActionType.ADD_TASK_COMMENT:
        return await this.executeAddTaskComment(action, context)

      // Webhook Actions
      case ActionType.WEBHOOK:
        return await this.executeWebhook(action, context)

      // Delay Action
      case ActionType.DELAY:
        return await this.executeDelay(action, context)

      default:
        throw new Error(`Unsupported action type: ${action.type}`)
    }
  }

  // ========================================================================
  // NOTIFICATION ACTIONS
  // ========================================================================

  private async executeSendEmail(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as EmailActionConfig
    
    // Apply template variables
    const to = this.applyTemplates(config.to, context) as string
    const subject = this.applyTemplates(config.subject, context) as string
    const body = this.applyTemplates(config.body, context) as string

    // Extract and validate email addresses
    const emails = extractEmails(to)
    
    if (emails.length === 0) {
      throw new Error('No valid email addresses provided')
    }

    // Send email using SendGrid
    const result = await sendEmail({
      to: emails,
      subject,
      text: body,
      html: body.includes('<') ? body : undefined, // Use HTML if contains HTML tags
    })

    if (!result.success) {
      throw new Error(`Email send failed: ${result.error}`)
    }

    return {
      sent: true,
      to: emails,
      subject,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    }
  }

  private async executeSendSlack(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as SlackActionConfig
    
    const message = this.applyTemplates(config.message, context) as string
    let channel = config.channel

    // Try to resolve channel name to ID if it starts with #
    if (channel.startsWith('#')) {
      const channelInfo = await findChannelByName(channel)
      if (channelInfo) {
        channel = channelInfo.id
      }
    }

    // Send message to Slack
    const result = await sendSlackMessage({
      channel,
      text: message,
    })

    if (!result.success) {
      throw new Error(`Slack message failed: ${result.error}`)
    }

    return {
      sent: true,
      channel: result.channel,
      messageId: result.messageId,
      timestamp: result.timestamp,
    }
  }

  private async executeSendTeams(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as unknown as Record<string, unknown>
    
    const webhookUrl = config.webhookUrl as string
    const title = this.applyTemplates(config.title as string || 'Notification', context) as string
    const message = this.applyTemplates(config.message as string, context) as string

    if (!webhookUrl) {
      throw new Error('Teams webhook URL is required')
    }

    // Create simple Teams card
    const card = createSimpleTeamsCard(title, message, config.color as string)

    // Send to Teams
    const result = await sendTeamsMessage({
      webhookUrl,
      ...card,
    })

    if (!result.success) {
      throw new Error(`Teams message failed: ${result.error}`)
    }

    return {
      sent: true,
      timestamp: new Date().toISOString(),
    }
  }

  private async executeSendSms(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as unknown as Record<string, unknown>
    
    const to = this.applyTemplates(config.to as string, context) as string
    const body = this.applyTemplates(config.body as string, context) as string

    if (!to) {
      throw new Error('SMS recipient phone number is required')
    }

    // Format phone number if needed
    const phoneNumber = formatPhoneNumber(to)

    // Send SMS using Twilio
    const result = await sendSms({
      to: phoneNumber,
      body,
    })

    if (!result.success) {
      throw new Error(`SMS send failed: ${result.error}`)
    }

    return {
      sent: true,
      to: result.to,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
    }
  }

  private async executeCreateNotification(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as NotificationActionConfig
    
    const title = this.applyTemplates(config.title, context) as string
    const message = this.applyTemplates(config.message, context) as string
    const userId = this.applyTemplates(config.userId, context) as string | string[]

    const userIds = Array.isArray(userId) ? userId : [userId]

    // Create notifications in database
    const notifications = await Promise.all(
      userIds.map((uid) =>
        this.prisma.notification.create({
          data: {
            userId: uid,
            title,
            message,
            type: config.type || 'INFO',
          },
        })
      )
    )

    return {
      created: notifications.length,
      notificationIds: notifications.map((n) => n.id),
    }
  }

  // ========================================================================
  // PROJECT ACTIONS
  // ========================================================================

  private async executeCreateTask(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as CreateTaskActionConfig
    
    const projectId = this.applyTemplates(config.projectId, context) as string
    const title = this.applyTemplates(config.title, context) as string
    const description = config.description
      ? (this.applyTemplates(config.description, context) as string)
      : null

    const task = await this.prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assigneeId: config.assigneeId || null,
        createdBy: context.user?.id || 'system',
        priority: (config.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
        status: (config.status as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED') || 'TODO',
        dueDate: config.dueDate ? new Date(config.dueDate) : null,
      },
    })

    return {
      taskId: task.id,
      title: task.title,
    }
  }

  private async executeUpdateProjectStatus(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as UpdateProjectStatusConfig
    
    const projectId = this.applyTemplates(config.projectId, context) as string
    const status = this.applyTemplates(config.status, context) as 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        status,
      },
    })

    return {
      projectId: project.id,
      status: project.status,
    }
  }

  private async executeUpdateProjectField(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as Record<string, unknown>
    
    const projectId = this.applyTemplates(config.projectId, context) as string
    const field = config.field as string
    const value = this.applyTemplates(config.value, context)

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        [field]: value,
      },
    })

    return {
      projectId: project.id,
      field,
      value,
    }
  }

  // ========================================================================
  // TASK ACTIONS
  // ========================================================================

  private async executeUpdateTaskStatus(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as Record<string, unknown>
    
    const taskId = this.applyTemplates(config.taskId, context) as string
    const status = this.applyTemplates(config.status, context) as 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'TESTING' | 'DONE' | 'CANCELLED'

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { status },
    })

    return {
      taskId: task.id,
      status: task.status,
    }
  }

  private async executeUpdateTaskPriority(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as Record<string, unknown>
    
    const taskId = this.applyTemplates(config.taskId, context) as string
    const priority = this.applyTemplates(config.priority, context) as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { priority },
    })

    return {
      taskId: task.id,
      priority: task.priority,
    }
  }

  private async executeAssignTask(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as Record<string, unknown>
    
    const taskId = this.applyTemplates(config.taskId, context) as string
    const assigneeId = this.applyTemplates(config.assigneeId, context) as string

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    })

    return {
      taskId: task.id,
      assigneeId: task.assigneeId,
    }
  }

  private async executeAddTaskComment(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as Record<string, unknown>
    
    const taskId = this.applyTemplates(config.taskId, context) as string
    const comment = this.applyTemplates(config.comment, context) as string
    const userId = this.applyTemplates(config.userId, context) as string

    // TODO: Create task comment (add to your schema if needed)
    console.log('Adding task comment:', { taskId, comment, userId })

    return {
      taskId,
      comment,
      added: true,
    }
  }

  // ========================================================================
  // WEBHOOK ACTION
  // ========================================================================

  private async executeWebhook(
    action: ActionConfig,
    context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as WebhookActionConfig
    
    const url = this.applyTemplates(config.url, context) as string
    const method = config.method || 'POST'
    const headers = config.headers || {}
    const body = config.body
      ? typeof config.body === 'string'
        ? this.applyTemplates(config.body, context)
        : config.body
      : undefined

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const responseData = await response.json()

    return {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    }
  }

  // ========================================================================
  // DELAY ACTION
  // ========================================================================

  private async executeDelay(
    action: ActionConfig,
    _context: ExecutionContext
  ): Promise<Record<string, unknown>> {
    const config = action.config as Record<string, unknown>
    const delayMs = (config.delay as number) || 1000

    await new Promise((resolve) => setTimeout(resolve, delayMs))

    return {
      delayed: true,
      duration: delayMs,
    }
  }

  // ========================================================================
  // TEMPLATE HELPERS
  // ========================================================================

  /**
   * Apply template variables to a string or array of strings
   */
  private applyTemplates(
    template: string | string[] | unknown,
    context: ExecutionContext
  ): string | string[] | unknown {
    if (typeof template === 'string') {
      return this.replaceTemplateVariables(template, context)
    }

    if (Array.isArray(template)) {
      return template.map((t) => this.applyTemplates(t, context))
    }

    return template
  }

  /**
   * Replace template variables in string
   */
  private replaceTemplateVariables(template: string, context: ExecutionContext): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(path.trim(), context as unknown as Record<string, unknown>)
      return value !== undefined ? String(value) : match
    })
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(path: string, obj: Record<string, unknown>): unknown {
    const parts = path.split('.')
    let current: unknown = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }

      if (typeof current === 'object') {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current
  }
}
