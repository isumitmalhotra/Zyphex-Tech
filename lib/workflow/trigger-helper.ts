/**
 * Workflow Trigger Helper
 * 
 * Centralized utility for triggering workflows from API routes.
 * Provides simple functions to trigger workflows based on events.
 * 
 * @module lib/workflow/trigger-helper
 */

import { prisma } from '@/lib/prisma'
import { WorkflowEngine } from './workflow-engine'
import {
  TriggerType,
  ExecutionContext,
  WorkflowExecutionResult,
} from '@/types/workflow'

// Lazy-loaded engine instance
let engineInstance: WorkflowEngine | null = null

/**
 * Get or initialize workflow engine
 */
function getEngine(): WorkflowEngine {
  if (!engineInstance) {
    engineInstance = WorkflowEngine.getInstance(prisma, {
      maxConcurrentExecutions: 10,
      defaultTimeout: 300,
      enableLogging: true,
      retryEnabled: true,
    })
  }
  return engineInstance
}

/**
 * Trigger workflows based on event type
 */
export async function triggerWorkflows(
  triggerType: TriggerType,
  context: ExecutionContext
): Promise<WorkflowExecutionResult[]> {
  try {
    // Get engine instance
    const engine = getEngine()

    // Initialize engine if not already initialized
    if (!engine.isEngineInitialized()) {
      await engine.initialize()
    }

    // Find all active workflows with this trigger type
    // @ts-expect-error - Extended Prisma client has workflow at runtime
    const workflows = await prisma.workflow.findMany({
      where: {
        enabled: true,
        // Use JSON path query to search in triggers array
        triggers: {
          path: '$',
          array_contains: [{ type: triggerType }],
        },
      },
    })

    if (workflows.length === 0) {
      console.log(`No active workflows found for trigger: ${triggerType}`)
      return []
    }

    console.log(`Found ${workflows.length} workflow(s) for trigger: ${triggerType}`)

    // Execute all matching workflows
    const results: WorkflowExecutionResult[] = []

    for (const workflow of workflows) {
      try {
        const result = await engine.executeWorkflow(workflow.id, context)
        results.push(result)
      } catch (error) {
        console.error(`Failed to execute workflow ${workflow.id}:`, error)
        // Continue with other workflows
      }
    }

    return results
  } catch (error) {
    console.error(`Error triggering workflows for ${triggerType}:`, error)
    return []
  }
}

/**
 * Trigger workflows for project events
 */
export async function triggerProjectWorkflows(
  triggerType: TriggerType,
  projectId: string,
  projectData: Record<string, unknown>,
  userId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  const context: ExecutionContext = {
    triggeredBy: 'USER_ACTION',
    triggerSource: userId,
    entity: {
      type: 'project',
      id: projectId,
      data: projectData,
      changes,
    },
    user: await getUserContext(userId),
    timestamp: new Date(),
  }

  await triggerWorkflows(triggerType, context)
}

/**
 * Trigger workflows for task events
 */
export async function triggerTaskWorkflows(
  triggerType: TriggerType,
  taskId: string,
  taskData: Record<string, unknown>,
  userId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  const context: ExecutionContext = {
    triggeredBy: 'USER_ACTION',
    triggerSource: userId,
    entity: {
      type: 'task',
      id: taskId,
      data: taskData,
      changes,
    },
    user: await getUserContext(userId),
    timestamp: new Date(),
  }

  await triggerWorkflows(triggerType, context)
}

/**
 * Trigger workflows for invoice events
 */
export async function triggerInvoiceWorkflows(
  triggerType: TriggerType,
  invoiceId: string,
  invoiceData: Record<string, unknown>,
  userId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  const context: ExecutionContext = {
    triggeredBy: 'USER_ACTION',
    triggerSource: userId,
    entity: {
      type: 'invoice',
      id: invoiceId,
      data: invoiceData,
      changes,
    },
    user: await getUserContext(userId),
    timestamp: new Date(),
  }

  await triggerWorkflows(triggerType, context)
}

/**
 * Trigger workflows for client events
 */
export async function triggerClientWorkflows(
  triggerType: TriggerType,
  clientId: string,
  clientData: Record<string, unknown>,
  userId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  const context: ExecutionContext = {
    triggeredBy: 'USER_ACTION',
    triggerSource: userId,
    entity: {
      type: 'client',
      id: clientId,
      data: clientData,
      changes,
    },
    user: await getUserContext(userId),
    timestamp: new Date(),
  }

  await triggerWorkflows(triggerType, context)
}

/**
 * Trigger workflows for scheduled events
 */
export async function triggerScheduledWorkflows(
  triggerType: TriggerType,
  metadata?: Record<string, unknown>
): Promise<void> {
  const context: ExecutionContext = {
    triggeredBy: 'SCHEDULE',
    triggerSource: 'CRON_JOB',
    timestamp: new Date(),
    metadata,
  }

  await triggerWorkflows(triggerType, context)
}

/**
 * Trigger workflows via webhook
 */
export async function triggerWebhookWorkflows(
  workflowId: string,
  webhookData: Record<string, unknown>,
  source: string
): Promise<WorkflowExecutionResult> {
  const engine = getEngine()

  if (!engine.isEngineInitialized()) {
    await engine.initialize()
  }

  const context: ExecutionContext = {
    triggeredBy: 'WEBHOOK',
    triggerSource: source,
    timestamp: new Date(),
    metadata: webhookData,
  }

  return await engine.executeWorkflow(workflowId, context)
}

/**
 * Get user context for execution
 */
async function getUserContext(
  userId: string
): Promise<{ id: string; email: string; name?: string; role?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  if (!user) {
    return {
      id: userId,
      email: 'unknown@example.com',
      name: 'Unknown User',
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || undefined,
    role: user.role || undefined,
  }
}

/**
 * Background trigger (fire and forget)
 * Useful for non-blocking workflow execution
 */
export function triggerWorkflowsAsync(
  triggerType: TriggerType,
  context: ExecutionContext
): void {
  // Fire and forget - don't await
  triggerWorkflows(triggerType, context).catch((error) => {
    console.error('Background workflow trigger failed:', error)
  })
}
