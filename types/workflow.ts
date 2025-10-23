/**
 * Workflow Automation System - TypeScript Types & Enums
 * 
 * Comprehensive type definitions for the workflow automation system.
 * These types extend Prisma-generated types with additional structures
 * for workflow configuration, execution, and monitoring.
 * 
 * @module types/workflow
 */

// Note: Prisma types will be available after client generation
// For now, we define our own enums that match the Prisma schema
// import { Workflow, WorkflowExecution, WorkflowLog, WorkflowExecutionStatus, WorkflowLogLevel } from '@prisma/client'

// ============================================================================
// PRISMA ENUM DEFINITIONS (matching schema.prisma)
// ============================================================================

/**
 * Workflow execution status (matches Prisma enum)
 */
export enum WorkflowExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
  RETRYING = 'RETRYING',
}

/**
 * Workflow log level (matches Prisma enum)
 */
export enum WorkflowLogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

// ============================================================================
// PRISMA MODEL TYPE STUBS
// ============================================================================
// These will be replaced by actual Prisma types in production code
// For now, they serve as documentation and prevent import errors

export interface Workflow {
  id: string
  name: string
  description: string | null
  enabled: boolean
  version: number
  triggers: unknown // JSON
  conditions: unknown // JSON
  actions: unknown // JSON
  priority: number
  maxRetries: number
  retryDelay: number
  timeout: number
  executionCount: number
  successCount: number
  failureCount: number
  lastExecutionAt: Date | null
  avgExecutionMs: number | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  category: string | null
  tags: string[]
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: WorkflowExecutionStatus
  triggeredBy: string
  triggerSource: string | null
  context: unknown // JSON
  startedAt: Date
  completedAt: Date | null
  duration: number | null
  actionsExecuted: number
  actionsSuccess: number
  actionsFailed: number
  results: unknown // JSON
  errors: unknown // JSON
  retryCount: number
  createdAt: Date
}

export interface WorkflowLog {
  id: string
  workflowId: string
  executionId: string | null
  level: WorkflowLogLevel
  message: string
  data: unknown // JSON
  action: string | null
  step: number | null
  timestamp: Date
  duration: number | null
}

// ============================================================================
// TRIGGER TYPES
// ============================================================================

/**
 * Available trigger types for workflows
 */
export enum TriggerType {
  // Project Triggers
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_STATUS_CHANGED = 'PROJECT_STATUS_CHANGED',
  PROJECT_MILESTONE_REACHED = 'PROJECT_MILESTONE_REACHED',
  PROJECT_BUDGET_THRESHOLD = 'PROJECT_BUDGET_THRESHOLD',
  PROJECT_DEADLINE_APPROACHING = 'PROJECT_DEADLINE_APPROACHING',
  
  // Task Triggers
  TASK_CREATED = 'TASK_CREATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  TASK_PRIORITY_CHANGED = 'TASK_PRIORITY_CHANGED',
  TASK_STATUS_CHANGED = 'TASK_STATUS_CHANGED',
  
  // Time Triggers
  SCHEDULE_DAILY = 'SCHEDULE_DAILY',
  SCHEDULE_WEEKLY = 'SCHEDULE_WEEKLY',
  SCHEDULE_MONTHLY = 'SCHEDULE_MONTHLY',
  SCHEDULE_CUSTOM = 'SCHEDULE_CUSTOM',
  SPECIFIC_DATE = 'SPECIFIC_DATE',
  RELATIVE_DATE = 'RELATIVE_DATE', // X days before/after project date
  
  // Financial Triggers
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_SENT = 'INVOICE_SENT',
  INVOICE_PAID = 'INVOICE_PAID',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  BUDGET_ALERT = 'BUDGET_ALERT',
  
  // Client Triggers
  CLIENT_CREATED = 'CLIENT_CREATED',
  CLIENT_UPDATED = 'CLIENT_UPDATED',
  
  // Team Triggers
  TEAM_MEMBER_ADDED = 'TEAM_MEMBER_ADDED',
  TEAM_MEMBER_REMOVED = 'TEAM_MEMBER_REMOVED',
  
  // Custom Triggers
  WEBHOOK = 'WEBHOOK',
  MANUAL = 'MANUAL',
}

/**
 * Trigger configuration structure
 */
export interface TriggerConfig {
  type: TriggerType
  config: TriggerSpecificConfig
  enabled?: boolean
}

/**
 * Project trigger specific configuration
 */
export interface ProjectTriggerConfig {
  status?: string[] // Specific statuses to trigger on
  milestoneId?: string // Specific milestone
  budgetThreshold?: number // Percentage (e.g., 80 = 80%)
  deadlineDays?: number // Days before deadline
}

/**
 * Task trigger specific configuration
 */
export interface TaskTriggerConfig {
  priority?: string[] // Specific priorities
  status?: string[] // Specific statuses
  assigneeId?: string // Specific assignee
  isMilestone?: boolean // Only milestone tasks
}

/**
 * Schedule trigger specific configuration
 */
export interface ScheduleTriggerConfig {
  schedule?: string // Cron expression
  time?: string // HH:MM format
  dayOfWeek?: number[] // 0-6 (Sunday-Saturday)
  dayOfMonth?: number[] // 1-31
  timezone?: string // IANA timezone
}

/**
 * Financial trigger specific configuration
 */
export interface FinancialTriggerConfig {
  invoiceStatus?: string[] // Specific invoice statuses
  overdueDays?: number // Days overdue
  amountThreshold?: number // Minimum amount
  clientId?: string // Specific client
}

/**
 * Union type for all trigger configs
 */
export type TriggerSpecificConfig = 
  | ProjectTriggerConfig 
  | TaskTriggerConfig 
  | ScheduleTriggerConfig 
  | FinancialTriggerConfig 
  | Record<string, unknown>

// ============================================================================
// CONDITION TYPES
// ============================================================================

/**
 * Condition operators
 */
export enum ConditionOperator {
  // Comparison
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_OR_EQUAL = 'GREATER_OR_EQUAL',
  LESS_OR_EQUAL = 'LESS_OR_EQUAL',
  
  // String
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  MATCHES_REGEX = 'MATCHES_REGEX',
  
  // Array
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  
  // Boolean
  IS_TRUE = 'IS_TRUE',
  IS_FALSE = 'IS_FALSE',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  
  // Date
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  BETWEEN = 'BETWEEN',
}

/**
 * Logical operators for combining conditions
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
}

/**
 * Single condition check
 */
export interface Condition {
  field: string // Dot notation path (e.g., 'project.status', 'task.priority')
  operator: ConditionOperator
  value: string | number | boolean | Date | null | (string | number)[] // Comparison value
}

/**
 * Condition group with logical operator
 */
export interface ConditionGroup {
  operator: LogicalOperator
  conditions: (Condition | ConditionGroup)[]
}

/**
 * Full condition tree (can be a single condition or group)
 */
export type ConditionTree = Condition | ConditionGroup

/**
 * Condition configuration (alias for ConditionTree for backward compatibility)
 */
export type ConditionConfig = ConditionTree | null

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Available action types
 */
export enum ActionType {
  // Notification Actions
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SLACK = 'SEND_SLACK',
  SEND_TEAMS = 'SEND_TEAMS',
  CREATE_NOTIFICATION = 'CREATE_NOTIFICATION',
  SEND_SMS = 'SEND_SMS',
  
  // Project Actions
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_PROJECT_STATUS = 'UPDATE_PROJECT_STATUS',
  ASSIGN_TEAM_MEMBER = 'ASSIGN_TEAM_MEMBER',
  GENERATE_REPORT = 'GENERATE_REPORT',
  UPDATE_PROJECT_FIELD = 'UPDATE_PROJECT_FIELD',
  
  // Task Actions
  UPDATE_TASK_STATUS = 'UPDATE_TASK_STATUS',
  UPDATE_TASK_PRIORITY = 'UPDATE_TASK_PRIORITY',
  ASSIGN_TASK = 'ASSIGN_TASK',
  ADD_TASK_COMMENT = 'ADD_TASK_COMMENT',
  
  // Client Actions
  SEND_INVOICE = 'SEND_INVOICE',
  CREATE_MEETING = 'CREATE_MEETING',
  SEND_PROJECT_UPDATE = 'SEND_PROJECT_UPDATE',
  REQUEST_APPROVAL = 'REQUEST_APPROVAL',
  
  // Financial Actions
  ADD_LATE_FEE = 'ADD_LATE_FEE',
  SEND_PAYMENT_REMINDER = 'SEND_PAYMENT_REMINDER',
  
  // Custom Actions
  WEBHOOK = 'WEBHOOK',
  CUSTOM_SCRIPT = 'CUSTOM_SCRIPT',
  
  // Flow Control
  DELAY = 'DELAY',
  WAIT_FOR_APPROVAL = 'WAIT_FOR_APPROVAL',
}

/**
 * Action configuration structure
 */
export interface ActionConfig {
  type: ActionType
  config: ActionSpecificConfig
  order?: number // Execution order (lower = earlier)
  continueOnError?: boolean // Continue workflow if this action fails
  retryOnError?: boolean // Retry this specific action
  timeout?: number // Action-specific timeout in seconds
}

/**
 * Email action configuration
 */
export interface EmailActionConfig {
  to: string | string[] // Email addresses or template variables
  cc?: string | string[]
  bcc?: string | string[]
  subject: string // Can include template variables
  body: string // HTML or plain text, supports templates
  attachments?: string[] // File paths or URLs
  template?: string // Email template name
}

/**
 * Slack action configuration
 */
export interface SlackActionConfig {
  channel: string // Channel ID or name
  message: string // Supports markdown and template variables
  username?: string // Bot username
  iconEmoji?: string // Bot icon
  attachments?: Record<string, unknown>[] // Slack attachment objects
}

/**
 * Teams action configuration
 */
export interface TeamsActionConfig {
  webhookUrl: string
  message: string
  title?: string
  color?: string // Hex color for message card
}

/**
 * Notification action configuration
 */
export interface NotificationActionConfig {
  userId: string | string[] // User IDs or template variable
  title: string
  message: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  link?: string // Optional link URL
}

/**
 * Task creation action configuration
 */
export interface CreateTaskActionConfig {
  projectId: string // Template variable supported
  title: string
  description?: string
  assigneeId?: string
  priority?: string
  dueDate?: string // ISO date or relative (e.g., '+7d')
  status?: string
  tags?: string[]
}

/**
 * Project status update configuration
 */
export interface UpdateProjectStatusConfig {
  projectId: string // Template variable supported
  status: string
  notes?: string
}

/**
 * Webhook action configuration
 */
export interface WebhookActionConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: Record<string, unknown> | string
  timeout?: number
}

/**
 * Union type for all action configs
 */
export type ActionSpecificConfig = 
  | EmailActionConfig 
  | SlackActionConfig 
  | TeamsActionConfig 
  | NotificationActionConfig 
  | CreateTaskActionConfig 
  | UpdateProjectStatusConfig 
  | WebhookActionConfig 
  | Record<string, unknown>

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

/**
 * Execution context passed to workflow engine
 */
export interface ExecutionContext {
  // Trigger information
  triggeredBy: 'USER_ACTION' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT' | 'MANUAL' | 'TEST'
  triggerSource?: string // User ID, cron name, webhook URL, etc.
  
  // Entity context (what triggered the workflow)
  entity?: {
    type: 'project' | 'task' | 'invoice' | 'client' | 'user'
    id: string
    data?: Record<string, unknown> // Full entity data
    changes?: Record<string, unknown> // What changed (for update triggers)
  }
  
  // Additional context
  user?: {
    id: string
    email: string
    name?: string
    role?: string
  }
  
  // Metadata
  timestamp: Date
  metadata?: Record<string, unknown>
}

/**
 * Execution result for an action
 */
export interface ActionResult {
  actionType: ActionType
  order: number
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED'
  startedAt: Date
  completedAt: Date
  duration: number // milliseconds
  result?: Record<string, unknown> | string | number | boolean // Action-specific result
  error?: {
    message: string
    stack?: string
    code?: string
  }
}

/**
 * Full workflow execution result
 */
export interface WorkflowExecutionResult {
  executionId: string
  workflowId: string
  status: WorkflowExecutionStatus
  startedAt: Date
  completedAt?: Date
  duration?: number
  actionsExecuted: number
  actionsSuccess: number
  actionsFailed: number
  results: ActionResult[]
  errors?: Array<{ message: string; stack?: string; code?: string }>
}

// ============================================================================
// WORKFLOW BUILDER TYPES
// ============================================================================

/**
 * Workflow template structure
 */
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  triggers: TriggerConfig[]
  conditions: ConditionTree
  actions: ActionConfig[]
  icon?: string
  author?: string
  version?: string
}

/**
 * Workflow validation result
 */
export interface WorkflowValidation {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'ERROR'
}

export interface ValidationWarning {
  field: string
  message: string
  severity: 'WARNING'
}

// ============================================================================
// MONITORING & STATISTICS
// ============================================================================

/**
 * Workflow statistics for monitoring
 */
export interface WorkflowStats {
  workflowId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  avgExecutionTime: number
  lastExecutionAt?: Date
  successRate: number
  errorRate: number
}

/**
 * System-wide workflow metrics
 */
export interface WorkflowSystemMetrics {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions24h: number
  successRate24h: number
  avgExecutionTime24h: number
  failedExecutions24h: number
  topWorkflows: Array<{
    workflowId: string
    workflowName: string
    executionCount: number
  }>
  recentErrors: Array<{
    workflowId: string
    workflowName: string
    error: string
    timestamp: Date
  }>
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create workflow request body
 */
export interface CreateWorkflowRequest {
  name: string
  description?: string
  triggers: TriggerConfig[]
  conditions: ConditionTree
  actions: ActionConfig[]
  enabled?: boolean
  category?: string
  tags?: string[]
  priority?: number
  maxRetries?: number
  retryDelay?: number
  timeout?: number
}

/**
 * Update workflow request body
 */
export interface UpdateWorkflowRequest extends Partial<CreateWorkflowRequest> {
  version?: number
}

/**
 * Test workflow request body
 */
export interface TestWorkflowRequest {
  context?: ExecutionContext
  dryRun?: boolean // Don't actually execute actions, just validate
}

/**
 * Workflow list query parameters
 */
export interface WorkflowListQuery {
  page?: number
  limit?: number
  enabled?: boolean
  category?: string
  tags?: string[]
  search?: string
  sortBy?: 'name' | 'createdAt' | 'lastExecutionAt' | 'executionCount'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Workflow execution query parameters
 */
export interface WorkflowExecutionQuery {
  page?: number
  limit?: number
  status?: WorkflowExecutionStatus | WorkflowExecutionStatus[]
  startDate?: string
  endDate?: string
  triggeredBy?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Template variable context for string interpolation
 */
export interface TemplateVariables {
  project?: Record<string, unknown>
  task?: Record<string, unknown>
  invoice?: Record<string, unknown>
  client?: Record<string, unknown>
  user?: Record<string, unknown>
  execution?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Workflow with computed fields
 */
export interface WorkflowWithStats extends Workflow {
  stats?: WorkflowStats
  isActive?: boolean
  lastError?: string
}

/**
 * Workflow execution with workflow details
 */
export interface WorkflowExecutionWithWorkflow extends WorkflowExecution {
  workflow: Workflow
}
