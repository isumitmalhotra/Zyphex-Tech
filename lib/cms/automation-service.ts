/**
 * CMS Workflow Automation Service
 * 
 * Automates content operations with triggers, conditions, and actions:
 * - Event-based triggers
 * - Condition evaluation
 * - Automated actions
 * - Workflow templates
 * - Execution history
 * - Error handling
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  type: TriggerType;
  config: Record<string, unknown>;
}

export type TriggerType =
  | 'page_created'
  | 'page_updated'
  | 'page_published'
  | 'page_unpublished'
  | 'page_deleted'
  | 'section_created'
  | 'section_updated'
  | 'section_deleted'
  | 'schedule_due'
  | 'version_created'
  | 'status_changed'
  | 'manual';

export interface AutomationCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
  logic?: 'AND' | 'OR';
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty';

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
  order: number;
}

export type ActionType =
  | 'publish_page'
  | 'unpublish_page'
  | 'update_status'
  | 'send_notification'
  | 'create_version'
  | 'assign_category'
  | 'add_tag'
  | 'remove_tag'
  | 'schedule_publish'
  | 'create_translation'
  | 'update_field'
  | 'run_webhook'
  | 'wait';

export interface AutomationExecution {
  id: string;
  ruleId: string;
  triggeredBy: TriggerType;
  triggeredAt: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  context: ExecutionContext;
  actions: ActionExecution[];
  completedAt?: Date;
  error?: string;
}

export interface ExecutionContext {
  pageId?: string;
  sectionId?: string;
  userId?: string;
  triggerData: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ActionExecution {
  actionType: ActionType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  result?: unknown;
  error?: string;
}

export interface CreateAutomationInput {
  name: string;
  description?: string;
  isActive?: boolean;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  createdBy: string;
}

export interface UpdateAutomationInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  trigger?: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions?: AutomationAction[];
}

export interface TriggerAutomationInput {
  ruleId: string;
  triggerType: TriggerType;
  context: ExecutionContext;
  userId: string;
}

// ============================================================================
// Automation CRUD Operations
// ============================================================================

/**
 * Create a new automation rule
 */
export async function createAutomation(input: CreateAutomationInput): Promise<AutomationRule> {
  const rule = await prisma.cmsAutomationRule.create({
    data: {
      name: input.name,
      description: input.description,
      isActive: input.isActive ?? true,
      trigger: input.trigger as never,
      conditions: input.conditions as never || [],
      actions: input.actions as never,
      createdBy: input.createdBy,
    },
  });

  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || undefined,
    isActive: rule.isActive,
    trigger: rule.trigger as unknown as AutomationTrigger,
    conditions: rule.conditions as unknown as AutomationCondition[],
    actions: rule.actions as unknown as AutomationAction[],
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

/**
 * Get automation rule by ID
 */
export async function getAutomation(id: string): Promise<AutomationRule | null> {
  const rule = await prisma.cmsAutomationRule.findUnique({
    where: { id },
  });

  if (!rule) {
    return null;
  }

  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || undefined,
    isActive: rule.isActive,
    trigger: rule.trigger as unknown as AutomationTrigger,
    conditions: rule.conditions as unknown as AutomationCondition[],
    actions: rule.actions as unknown as AutomationAction[],
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

/**
 * Get all automation rules
 */
export async function getAutomations(filters: {
  isActive?: boolean;
  triggerType?: TriggerType;
  createdBy?: string;
} = {}): Promise<AutomationRule[]> {
  const where: Record<string, unknown> = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  const rules = await prisma.cmsAutomationRule.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Filter by trigger type if specified
  let filteredRules = rules;
  if (filters.triggerType) {
    filteredRules = rules.filter((r) => {
      const trigger = r.trigger as unknown as AutomationTrigger;
      return trigger.type === filters.triggerType;
    });
  }

  return filteredRules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description || undefined,
    isActive: rule.isActive,
    trigger: rule.trigger as unknown as AutomationTrigger,
    conditions: rule.conditions as unknown as AutomationCondition[],
    actions: rule.actions as unknown as AutomationAction[],
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }));
}

/**
 * Update automation rule
 */
export async function updateAutomation(
  id: string,
  input: UpdateAutomationInput
): Promise<AutomationRule> {
  const data: Record<string, unknown> = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.trigger !== undefined) data.trigger = input.trigger as never;
  if (input.conditions !== undefined) data.conditions = input.conditions as never;
  if (input.actions !== undefined) data.actions = input.actions as never;

  const rule = await prisma.cmsAutomationRule.update({
    where: { id },
    data,
  });

  return {
    id: rule.id,
    name: rule.name,
    description: rule.description || undefined,
    isActive: rule.isActive,
    trigger: rule.trigger as unknown as AutomationTrigger,
    conditions: rule.conditions as unknown as AutomationCondition[],
    actions: rule.actions as unknown as AutomationAction[],
    createdBy: rule.createdBy,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

/**
 * Delete automation rule
 */
export async function deleteAutomation(id: string): Promise<void> {
  await prisma.cmsAutomationRule.delete({
    where: { id },
  });
}

/**
 * Toggle automation active status
 */
export async function toggleAutomationStatus(id: string): Promise<AutomationRule> {
  const rule = await prisma.cmsAutomationRule.findUnique({
    where: { id },
  });

  if (!rule) {
    throw new Error('Automation rule not found');
  }

  return updateAutomation(id, { isActive: !rule.isActive });
}

// ============================================================================
// Automation Execution
// ============================================================================

/**
 * Trigger automation execution
 */
export async function triggerAutomation(
  input: TriggerAutomationInput
): Promise<AutomationExecution> {
  const rule = await getAutomation(input.ruleId);

  if (!rule) {
    throw new Error('Automation rule not found');
  }

  if (!rule.isActive) {
    throw new Error('Automation rule is not active');
  }

  // Create execution record
  const execution = await prisma.cmsAutomationExecution.create({
    data: {
      ruleId: input.ruleId,
      triggeredBy: input.triggerType,
      status: 'pending',
      context: input.context as never,
      actions: [],
    },
  });

  // Execute automation asynchronously
  executeAutomation(execution.id, rule, input.context).catch((error) => {
    console.error('Automation execution error:', error);
  });

  return {
    id: execution.id,
    ruleId: execution.ruleId,
    triggeredBy: execution.triggeredBy as TriggerType,
    triggeredAt: execution.triggeredAt,
    status: execution.status as AutomationExecution['status'],
    context: execution.context as unknown as ExecutionContext,
    actions: execution.actions as unknown as ActionExecution[],
    completedAt: execution.completedAt || undefined,
    error: execution.error || undefined,
  };
}

/**
 * Execute automation
 */
async function executeAutomation(
  executionId: string,
  rule: AutomationRule,
  context: ExecutionContext
): Promise<void> {
  try {
    // Update status to running
    await prisma.cmsAutomationExecution.update({
      where: { id: executionId },
      data: { status: 'running' },
    });

    // Evaluate conditions
    const conditionsMet = await evaluateConditions(rule.conditions, context);

    if (!conditionsMet) {
      await prisma.cmsAutomationExecution.update({
        where: { id: executionId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          error: 'Conditions not met',
        },
      });
      return;
    }

    // Execute actions in order
    const actionExecutions: ActionExecution[] = [];

    for (const action of rule.actions.sort((a, b) => a.order - b.order)) {
      const actionExecution: ActionExecution = {
        actionType: action.type,
        status: 'running',
        startedAt: new Date(),
      };

      try {
        const result = await executeAction(action, context);
        actionExecution.status = 'completed';
        actionExecution.completedAt = new Date();
        actionExecution.result = result;
      } catch (error) {
        actionExecution.status = 'failed';
        actionExecution.completedAt = new Date();
        actionExecution.error = error instanceof Error ? error.message : 'Unknown error';
      }

      actionExecutions.push(actionExecution);
    }

    // Update execution with results
    const hasFailures = actionExecutions.some((a) => a.status === 'failed');

    await prisma.cmsAutomationExecution.update({
      where: { id: executionId },
      data: {
        status: hasFailures ? 'failed' : 'completed',
        completedAt: new Date(),
        actions: actionExecutions as never,
      },
    });
  } catch (error) {
    await prisma.cmsAutomationExecution.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Evaluate automation conditions
 */
async function evaluateConditions(
  conditions: AutomationCondition[],
  context: ExecutionContext
): Promise<boolean> {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions means always execute
  }

  // Get page data if pageId is in context
  let pageData: Record<string, unknown> = {};
  if (context.pageId) {
    const page = await prisma.cmsPage.findUnique({
      where: { id: context.pageId },
    });
    if (page) {
      pageData = page as unknown as Record<string, unknown>;
    }
  }

  const results: boolean[] = [];

  for (const condition of conditions) {
    const value = getFieldValue(pageData, condition.field);
    const result = evaluateCondition(value, condition.operator, condition.value);
    results.push(result);
  }

  // Apply logic (default to AND)
  const logic = conditions[0]?.logic || 'AND';
  return logic === 'AND' ? results.every((r) => r) : results.some((r) => r);
}

/**
 * Get field value from object
 */
function getFieldValue(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.');
  let value: unknown = obj;

  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  value: unknown,
  operator: ConditionOperator,
  expected: unknown
): boolean {
  switch (operator) {
    case 'equals':
      return value === expected;
    case 'not_equals':
      return value !== expected;
    case 'contains':
      return String(value).includes(String(expected));
    case 'not_contains':
      return !String(value).includes(String(expected));
    case 'starts_with':
      return String(value).startsWith(String(expected));
    case 'ends_with':
      return String(value).endsWith(String(expected));
    case 'greater_than':
      return Number(value) > Number(expected);
    case 'less_than':
      return Number(value) < Number(expected);
    case 'in':
      return Array.isArray(expected) && expected.includes(value);
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(value);
    case 'is_empty':
      return !value || value === '' || (Array.isArray(value) && value.length === 0);
    case 'is_not_empty':
      return !!value && value !== '' && (!Array.isArray(value) || value.length > 0);
    default:
      return false;
  }
}

/**
 * Execute a single action
 */
async function executeAction(
  action: AutomationAction,
  context: ExecutionContext
): Promise<unknown> {
  const { type, config } = action;

  switch (type) {
    case 'publish_page':
      if (!context.pageId) throw new Error('Page ID required for publish action');
      return await prisma.cmsPage.update({
        where: { id: context.pageId },
        data: { status: 'published', publishedAt: new Date() },
      });

    case 'unpublish_page':
      if (!context.pageId) throw new Error('Page ID required for unpublish action');
      return await prisma.cmsPage.update({
        where: { id: context.pageId },
        data: { status: 'draft', publishedAt: null },
      });

    case 'update_status':
      if (!context.pageId) throw new Error('Page ID required for status update');
      return await prisma.cmsPage.update({
        where: { id: context.pageId },
        data: { status: config.status as string },
      });

    case 'update_field':
      if (!context.pageId) throw new Error('Page ID required for field update');
      return await prisma.cmsPage.update({
        where: { id: context.pageId },
        data: { [config.field as string]: config.value },
      });

    case 'send_notification':
      // In production, integrate with email/notification service
      console.log('Notification:', config.message);
      return { sent: true, message: config.message };

    case 'wait':
      const ms = Number(config.milliseconds || 1000);
      await new Promise((resolve) => setTimeout(resolve, ms));
      return { waited: ms };

    case 'run_webhook':
      // In production, make HTTP request to webhook URL
      console.log('Webhook:', config.url);
      return { triggered: true, url: config.url };

    default:
      throw new Error(`Unsupported action type: ${type}`);
  }
}

// ============================================================================
// Automation Execution History
// ============================================================================

/**
 * Get automation execution by ID
 */
export async function getAutomationExecution(id: string): Promise<AutomationExecution | null> {
  const execution = await prisma.cmsAutomationExecution.findUnique({
    where: { id },
  });

  if (!execution) {
    return null;
  }

  return {
    id: execution.id,
    ruleId: execution.ruleId,
    triggeredBy: execution.triggeredBy as TriggerType,
    triggeredAt: execution.triggeredAt,
    status: execution.status as AutomationExecution['status'],
    context: execution.context as unknown as ExecutionContext,
    actions: execution.actions as unknown as ActionExecution[],
    completedAt: execution.completedAt || undefined,
    error: execution.error || undefined,
  };
}

/**
 * Get automation executions
 */
export async function getAutomationExecutions(filters: {
  ruleId?: string;
  status?: AutomationExecution['status'];
  limit?: number;
} = {}): Promise<AutomationExecution[]> {
  const where: Record<string, unknown> = {};

  if (filters.ruleId) {
    where.ruleId = filters.ruleId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const executions = await prisma.cmsAutomationExecution.findMany({
    where,
    orderBy: { triggeredAt: 'desc' },
    take: filters.limit || 100,
  });

  return executions.map((execution) => ({
    id: execution.id,
    ruleId: execution.ruleId,
    triggeredBy: execution.triggeredBy as TriggerType,
    triggeredAt: execution.triggeredAt,
    status: execution.status as AutomationExecution['status'],
    context: execution.context as unknown as ExecutionContext,
    actions: execution.actions as unknown as ActionExecution[],
    completedAt: execution.completedAt || undefined,
    error: execution.error || undefined,
  }));
}

/**
 * Get automation execution statistics
 */
export async function getAutomationStats(ruleId?: string) {
  const where: Record<string, unknown> = ruleId ? { ruleId } : {};

  const [total, completed, failed, running] = await Promise.all([
    prisma.cmsAutomationExecution.count({ where }),
    prisma.cmsAutomationExecution.count({ where: { ...where, status: 'completed' } }),
    prisma.cmsAutomationExecution.count({ where: { ...where, status: 'failed' } }),
    prisma.cmsAutomationExecution.count({ where: { ...where, status: 'running' } }),
  ]);

  return {
    total,
    completed,
    failed,
    running,
    pending: total - completed - failed - running,
    successRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

// ============================================================================
// Automation Templates
// ============================================================================

/**
 * Get automation templates (predefined rules)
 */
export function getAutomationTemplates(): Array<Omit<CreateAutomationInput, 'createdBy'>> {
  return [
    {
      name: 'Auto-publish on approval',
      description: 'Automatically publish page when status changes to approved',
      isActive: true,
      trigger: {
        type: 'status_changed',
        config: { newStatus: 'approved' },
      },
      conditions: [
        {
          field: 'status',
          operator: 'equals',
          value: 'approved',
          logic: 'AND',
        },
      ],
      actions: [
        {
          type: 'publish_page',
          config: {},
          order: 1,
        },
      ],
    },
    {
      name: 'Notify on page creation',
      description: 'Send notification when new page is created',
      isActive: true,
      trigger: {
        type: 'page_created',
        config: {},
      },
      actions: [
        {
          type: 'send_notification',
          config: {
            message: 'New page created',
            recipients: ['admin@example.com'],
          },
          order: 1,
        },
      ],
    },
    {
      name: 'Auto-archive old pages',
      description: 'Archive pages older than 365 days',
      isActive: false,
      trigger: {
        type: 'schedule_due',
        config: { schedule: 'daily' },
      },
      conditions: [
        {
          field: 'createdAt',
          operator: 'less_than',
          value: Date.now() - 365 * 24 * 60 * 60 * 1000,
          logic: 'AND',
        },
      ],
      actions: [
        {
          type: 'update_status',
          config: { status: 'archived' },
          order: 1,
        },
      ],
    },
  ];
}
