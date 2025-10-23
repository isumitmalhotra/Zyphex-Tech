/**
 * Workflow Automation Engine - Core Orchestrator
 * 
 * Central engine for executing workflow automations. Handles trigger evaluation,
 * condition checking, action execution, error handling, and retry logic.
 * 
 * @module lib/workflow/workflow-engine
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowLogLevel,
  TriggerConfig,
  ConditionTree,
  ActionConfig,
  ExecutionContext,
  WorkflowExecutionResult,
  ActionResult,
} from '@/types/workflow'
import { TriggerEvaluator } from './trigger-evaluator'
import { ConditionEvaluator } from './condition-evaluator'
import { ActionExecutor } from './action-executor'

// Type alias for extended Prisma client
type ExtendedPrismaClient = typeof prisma

/**
 * Configuration for the workflow engine
 */
export interface WorkflowEngineConfig {
  maxConcurrentExecutions?: number
  defaultTimeout?: number
  enableLogging?: boolean
  retryEnabled?: boolean
}

/**
 * Workflow Engine - Singleton orchestrator for workflow automation
 */
export class WorkflowEngine {
  private static instance: WorkflowEngine | null = null
  private prisma: ExtendedPrismaClient
  private triggerEvaluator: TriggerEvaluator
  private conditionEvaluator: ConditionEvaluator
  private actionExecutor: ActionExecutor
  private config: WorkflowEngineConfig
  private activeExecutions: Map<string, Promise<WorkflowExecutionResult>>
  private isInitialized: boolean = false

  /**
   * Private constructor (singleton pattern)
   */
  private constructor(prismaClient: ExtendedPrismaClient, config: WorkflowEngineConfig = {}) {
    this.prisma = prismaClient
    this.config = {
      maxConcurrentExecutions: config.maxConcurrentExecutions || 10,
      defaultTimeout: config.defaultTimeout || 300000, // 5 minutes
      enableLogging: config.enableLogging !== false,
      retryEnabled: config.retryEnabled !== false,
    }
    this.activeExecutions = new Map()
    this.triggerEvaluator = new TriggerEvaluator(prismaClient)
    this.conditionEvaluator = new ConditionEvaluator()
    this.actionExecutor = new ActionExecutor(prismaClient)
  }

  /**
   * Get or create singleton instance
   */
  public static getInstance(
    prismaClient?: ExtendedPrismaClient,
    config?: WorkflowEngineConfig
  ): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      if (!prismaClient) {
        throw new Error('Prisma client required for first initialization')
      }
      WorkflowEngine.instance = new WorkflowEngine(prismaClient, config)
    }
    return WorkflowEngine.instance
  }

  /**
   * Initialize the workflow engine
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      await this.log(
        'ENGINE',
        WorkflowLogLevel.INFO,
        'Workflow engine initializing...',
        { config: this.config }
      )

      // Initialize sub-components
      await this.triggerEvaluator.initialize()
      await this.conditionEvaluator.initialize()
      await this.actionExecutor.initialize()

      this.isInitialized = true

      await this.log(
        'ENGINE',
        WorkflowLogLevel.INFO,
        'Workflow engine initialized successfully',
        {
          maxConcurrentExecutions: this.config.maxConcurrentExecutions,
          defaultTimeout: this.config.defaultTimeout,
        }
      )
    } catch (error) {
      await this.log(
        'ENGINE',
        WorkflowLogLevel.ERROR,
        'Failed to initialize workflow engine',
        { error: error instanceof Error ? error.message : String(error) }
      )
      throw error
    }
  }

  /**
   * Execute a workflow with given context
   */
  public async executeWorkflow(
    workflowId: string,
    context: ExecutionContext
  ): Promise<WorkflowExecutionResult> {
    // Check concurrent execution limit
    if (this.activeExecutions.size >= this.config.maxConcurrentExecutions!) {
      throw new Error('Maximum concurrent executions reached')
    }

    // Create execution promise
    const executionPromise = this.executeWorkflowInternal(workflowId, context)

    // Track active execution
    this.activeExecutions.set(workflowId, executionPromise)

    try {
      const result = await executionPromise
      return result
    } finally {
      this.activeExecutions.delete(workflowId)
    }
  }

  /**
   * Internal workflow execution logic
   */
  private async executeWorkflowInternal(
    workflowId: string,
    context: ExecutionContext
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now()
    let execution: WorkflowExecution | null = null

    try {
      // Load workflow
      const workflow = await this.loadWorkflow(workflowId)
      if (!workflow) {
        throw new Error(`Workflow not found: ${workflowId}`)
      }

      if (!workflow.enabled) {
        throw new Error(`Workflow is disabled: ${workflowId}`)
      }

      // Create execution record
      execution = await this.createExecution(workflow, context)

      await this.logExecution(
        workflow.id,
        execution.id,
        WorkflowLogLevel.INFO,
        'Workflow execution started',
        {
          triggeredBy: context.triggeredBy,
          triggerSource: context.triggerSource,
        }
      )

      // Update execution status to RUNNING
      await this.updateExecutionStatus(execution.id, WorkflowExecutionStatus.RUNNING)

      // Step 1: Evaluate triggers (already triggered, but validate)
      await this.logExecution(
        workflow.id,
        execution.id,
        WorkflowLogLevel.INFO,
        'Validating trigger conditions',
        {}
      )

      const triggerValid = await this.triggerEvaluator.evaluate(
        workflow.triggers as TriggerConfig[],
        context
      )

      if (!triggerValid) {
        await this.logExecution(
          workflow.id,
          execution.id,
          WorkflowLogLevel.WARNING,
          'Trigger conditions not met',
          {}
        )
        return await this.completeExecution(
          execution.id,
          WorkflowExecutionStatus.CANCELLED,
          [],
          startTime,
          'Trigger conditions not met'
        )
      }

      // Step 2: Evaluate conditions
      await this.logExecution(
        workflow.id,
        execution.id,
        WorkflowLogLevel.INFO,
        'Evaluating workflow conditions',
        {}
      )

      const conditionsMet = await this.conditionEvaluator.evaluate(
        workflow.conditions as ConditionTree,
        context
      )

      if (!conditionsMet) {
        await this.logExecution(
          workflow.id,
          execution.id,
          WorkflowLogLevel.INFO,
          'Workflow conditions not met, execution skipped',
          {}
        )
        return await this.completeExecution(
          execution.id,
          WorkflowExecutionStatus.CANCELLED,
          [],
          startTime,
          'Conditions not met'
        )
      }

      // Step 3: Execute actions
      await this.logExecution(
        workflow.id,
        execution.id,
        WorkflowLogLevel.INFO,
        `Executing ${(workflow.actions as ActionConfig[]).length} action(s)`,
        {}
      )

      const actionResults = await this.actionExecutor.executeActions(
        workflow.actions as ActionConfig[],
        context,
        workflow,
        execution.id
      )

      // Step 4: Determine final status
      const failedActions = actionResults.filter((r) => r.status === 'FAILED')
      const finalStatus =
        failedActions.length === 0
          ? WorkflowExecutionStatus.SUCCESS
          : failedActions.length === actionResults.length
          ? WorkflowExecutionStatus.FAILED
          : WorkflowExecutionStatus.SUCCESS // Partial success

      await this.logExecution(
        workflow.id,
        execution.id,
        WorkflowLogLevel.INFO,
        'Workflow execution completed',
        {
          status: finalStatus,
          actionsExecuted: actionResults.length,
          actionsSuccess: actionResults.filter((r) => r.status === 'SUCCESS').length,
          actionsFailed: failedActions.length,
        }
      )

      // Step 5: Complete execution
      const result = await this.completeExecution(
        execution.id,
        finalStatus,
        actionResults,
        startTime
      )

      // Step 6: Update workflow statistics
      await this.updateWorkflowStats(workflow.id, finalStatus, Date.now() - startTime)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      if (execution) {
        await this.logExecution(
          execution.workflowId,
          execution.id,
          WorkflowLogLevel.ERROR,
          'Workflow execution failed',
          {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
          }
        )

        // Check if retry is needed
        if (
          this.config.retryEnabled &&
          execution.retryCount < (await this.getWorkflowMaxRetries(workflowId))
        ) {
          await this.scheduleRetry(execution, error as Error)
          return await this.completeExecution(
            execution.id,
            WorkflowExecutionStatus.RETRYING,
            [],
            startTime,
            errorMessage
          )
        }

        return await this.completeExecution(
          execution.id,
          WorkflowExecutionStatus.FAILED,
          [],
          startTime,
          errorMessage
        )
      }

      throw error
    }
  }

  /**
   * Load workflow from database
   */
  private async loadWorkflow(workflowId: string): Promise<Workflow | null> {
    return await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    }) as Workflow | null
  }

  /**
   * Create execution record
   */
  private async createExecution(
    workflow: Workflow,
    context: ExecutionContext
  ): Promise<WorkflowExecution> {
    return await this.prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: WorkflowExecutionStatus.PENDING,
        triggeredBy: context.triggeredBy,
        triggerSource: context.triggerSource || null,
        context: context as unknown as Prisma.InputJsonValue,
        retryCount: 0,
      },
    }) as unknown as WorkflowExecution
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: WorkflowExecutionStatus
  ): Promise<void> {
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status },
    })
  }

  /**
   * Complete execution
   */
  private async completeExecution(
    executionId: string,
    status: WorkflowExecutionStatus,
    actionResults: ActionResult[],
    startTime: number,
    errorMessage?: string
  ): Promise<WorkflowExecutionResult> {
    const duration = Date.now() - startTime
    const actionsSuccess = actionResults.filter((r) => r.status === 'SUCCESS').length
    const actionsFailed = actionResults.filter((r) => r.status === 'FAILED').length

    // @ts-expect-error - Extended Prisma client has workflowExecution model at runtime
    const execution = await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status,
        completedAt: new Date(),
        duration,
        actionsExecuted: actionResults.length,
        actionsSuccess,
        actionsFailed,
        results: actionResults as unknown as Prisma.InputJsonValue,
        errors: errorMessage ? [{ message: errorMessage }] : undefined,
      },
    }) as WorkflowExecution

    return {
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt || undefined,
      duration,
      actionsExecuted: actionResults.length,
      actionsSuccess,
      actionsFailed,
      results: actionResults,
      errors: errorMessage ? [{ message: errorMessage }] : undefined,
    }
  }

  /**
   * Update workflow statistics
   */
  private async updateWorkflowStats(
    workflowId: string,
    status: WorkflowExecutionStatus,
    duration: number
  ): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    })

    if (!workflow) return

    const isSuccess = status === WorkflowExecutionStatus.SUCCESS
    const newExecutionCount = workflow.executionCount + 1
    const newSuccessCount = workflow.successCount + (isSuccess ? 1 : 0)
    const newFailureCount = workflow.failureCount + (isSuccess ? 0 : 1)

    // Calculate new average execution time
    const currentAvg = workflow.avgExecutionMs || 0
    const newAvg = Math.round(
      (currentAvg * workflow.executionCount + duration) / newExecutionCount
    )

    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        executionCount: newExecutionCount,
        successCount: newSuccessCount,
        failureCount: newFailureCount,
        lastExecutionAt: new Date(),
        avgExecutionMs: newAvg,
      },
    })
  }

  /**
   * Get workflow max retries
   */
  private async getWorkflowMaxRetries(workflowId: string): Promise<number> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
      select: { maxRetries: true },
    })
    return workflow?.maxRetries || 3
  }

  /**
   * Schedule retry for failed execution
   */
  private async scheduleRetry(
    execution: WorkflowExecution,
    error: Error
  ): Promise<void> {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: execution.workflowId },
      select: { retryDelay: true },
    })

    const retryDelay = workflow?.retryDelay || 60 // seconds
    const nextRetryAt = new Date(Date.now() + retryDelay * 1000)

    await this.prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        retryCount: { increment: 1 },
        nextRetryAt,
      },
    })

    await this.logExecution(
      execution.workflowId,
      execution.id,
      WorkflowLogLevel.WARNING,
      'Execution scheduled for retry',
      {
        retryCount: execution.retryCount + 1,
        nextRetryAt: nextRetryAt.toISOString(),
        error: error.message,
      }
    )
  }

  /**
   * Log workflow execution event
   */
  private async logExecution(
    workflowId: string,
    executionId: string,
    level: WorkflowLogLevel,
    message: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.enableLogging) return

    try {
      await this.prisma.workflowLog.create({
        data: {
          workflowId,
          executionId,
          level,
          message,
          data: data as Prisma.InputJsonValue,
          timestamp: new Date(),
        },
      })
    } catch (error) {
      // Log to console if database logging fails
      console.error('Failed to log workflow execution:', error)
    }
  }

  /**
   * Log general engine event
   */
  private async log(
    source: string,
    level: WorkflowLogLevel,
    message: string,
    data: Record<string, unknown>
  ): Promise<void> {
    if (!this.config.enableLogging) return

    console.log(`[WorkflowEngine:${source}] [${level}] ${message}`, data)
  }

  /**
   * Get active execution count
   */
  public getActiveExecutionCount(): number {
    return this.activeExecutions.size
  }

  /**
   * Check if engine is initialized
   */
  public isEngineInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Shutdown the engine gracefully
   */
  public async shutdown(): Promise<void> {
    await this.log(
      'ENGINE',
      WorkflowLogLevel.INFO,
      'Shutting down workflow engine...',
      { activeExecutions: this.activeExecutions.size }
    )

    // Wait for active executions to complete
    if (this.activeExecutions.size > 0) {
      await Promise.allSettled(Array.from(this.activeExecutions.values()))
    }

    this.isInitialized = false
    WorkflowEngine.instance = null

    await this.log(
      'ENGINE',
      WorkflowLogLevel.INFO,
      'Workflow engine shut down successfully',
      {}
    )
  }
}
