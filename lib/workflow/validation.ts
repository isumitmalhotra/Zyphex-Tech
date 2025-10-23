/**
 * Workflow Validation Utilities
 * 
 * Validates workflow configuration, triggers, conditions, and actions
 * to ensure they are correctly formatted before saving.
 */

import { TriggerType, ActionType, TriggerConfig, ConditionConfig, ActionConfig, ConditionTree } from '@/types/workflow'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate complete workflow configuration
 */
export function validateWorkflow(workflow: {
  name?: string
  triggers?: unknown
  conditions?: unknown
  actions?: unknown
}): ValidationResult {
  const errors: string[] = []

  // Validate name
  if (!workflow.name || typeof workflow.name !== 'string') {
    errors.push('Workflow name is required and must be a string')
  } else if (workflow.name.length < 3) {
    errors.push('Workflow name must be at least 3 characters')
  } else if (workflow.name.length > 255) {
    errors.push('Workflow name must be less than 255 characters')
  }

  // Validate triggers
  if (!workflow.triggers) {
    errors.push('At least one trigger is required')
  } else {
    const triggerValidation = validateTriggers(workflow.triggers)
    errors.push(...triggerValidation.errors)
  }

  // Validate conditions (optional)
  if (workflow.conditions) {
    const conditionValidation = validateConditions(workflow.conditions)
    errors.push(...conditionValidation.errors)
  }

  // Validate actions
  if (!workflow.actions) {
    errors.push('At least one action is required')
  } else {
    const actionValidation = validateActions(workflow.actions)
    errors.push(...actionValidation.errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate trigger configuration
 */
export function validateTriggers(triggers: unknown): ValidationResult {
  const errors: string[] = []

  if (!Array.isArray(triggers)) {
    errors.push('Triggers must be an array')
    return { valid: false, errors }
  }

  if (triggers.length === 0) {
    errors.push('At least one trigger is required')
    return { valid: false, errors }
  }

  const validTriggerTypes = Object.values(TriggerType)

  triggers.forEach((trigger, index) => {
    const t = trigger as TriggerConfig

    if (!t.type) {
      errors.push(`Trigger ${index + 1}: type is required`)
    } else if (!validTriggerTypes.includes(t.type)) {
      errors.push(`Trigger ${index + 1}: invalid type "${t.type}"`)
    }

    // Validate schedule triggers have cron expression
    if (
      t.type === TriggerType.SCHEDULE_DAILY ||
      t.type === TriggerType.SCHEDULE_WEEKLY ||
      t.type === TriggerType.SCHEDULE_MONTHLY
    ) {
      // Type guard: schedule triggers have schedule config
      const scheduleConfig = t.config as { schedule?: string }
      if (!scheduleConfig || !scheduleConfig.schedule) {
        errors.push(`Trigger ${index + 1}: schedule configuration is required for schedule triggers`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate condition configuration
 */
export function validateConditions(conditions: unknown): ValidationResult {
  const errors: string[] = []

  if (!conditions || typeof conditions !== 'object') {
    errors.push('Conditions must be an object')
    return { valid: false, errors }
  }

  const c = conditions as ConditionConfig

  // Null check
  if (!c) {
    errors.push('Conditions cannot be null')
    return { valid: false, errors }
  }

  // Must have operator
  if (!c.operator) {
    errors.push('Condition operator is required')
  } else if (!['AND', 'OR', 'NOT'].includes(c.operator)) {
    errors.push(`Invalid condition operator: ${c.operator}`)
  }

  // Type guard for group conditions
  const hasConditions = 'conditions' in c && Array.isArray(c.conditions)
  
  // Validate nested conditions
  if (hasConditions) {
    if (c.conditions.length === 0 && c.operator !== 'NOT') {
      errors.push('Condition group must have at least one condition')
    }

    c.conditions.forEach((condition, index: number) => {
      // Check if it's a nested group or a simple condition
      if ('operator' in condition && 'conditions' in condition) {
        // Recursive validation for nested groups
        const nestedValidation = validateConditions(condition as ConditionTree)
        nestedValidation.errors.forEach(error => {
          errors.push(`Nested condition ${index + 1}: ${error}`)
        })
      } else {
        // Validate simple condition (leaf node)
        // At this point we know it has field, operator, value properties
        const leafCond = condition as { field: string; operator: string; value: unknown }
        
        if (!leafCond.field) {
          errors.push(`Condition ${index + 1}: field is required`)
        }

        if (!leafCond.operator) {
          errors.push(`Condition ${index + 1}: operator is required`)
        } else {
          const validOperators = [
            'EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN',
            'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL',
            'CONTAINS', 'NOT_CONTAINS', 'STARTS_WITH', 'ENDS_WITH',
            'IN', 'NOT_IN', 'IS_NULL', 'IS_NOT_NULL',
            'MATCHES_REGEX', 'DATE_BEFORE', 'DATE_AFTER',
            'DATE_BETWEEN', 'CHANGED', 'NOT_CHANGED',
          ]

          if (!validOperators.includes(leafCond.operator)) {
            errors.push(`Condition ${index + 1}: invalid operator "${leafCond.operator}"`)
          }
        }

        // Validate value is present for operators that need it
        if (
          leafCond.operator &&
          !['IS_NULL', 'IS_NOT_NULL'].includes(leafCond.operator) &&
          leafCond.value === undefined
        ) {
          errors.push(`Condition ${index + 1}: value is required for operator "${leafCond.operator}"`)
        }
      }
    })
  } else if (!hasConditions) {
    errors.push('Conditions array is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate action configuration
 */
export function validateActions(actions: unknown): ValidationResult {
  const errors: string[] = []

  if (!Array.isArray(actions)) {
    errors.push('Actions must be an array')
    return { valid: false, errors }
  }

  if (actions.length === 0) {
    errors.push('At least one action is required')
    return { valid: false, errors }
  }

  const validActionTypes = Object.values(ActionType)

  actions.forEach((action, index) => {
    const a = action as ActionConfig

    if (!a.type) {
      errors.push(`Action ${index + 1}: type is required`)
    } else if (!validActionTypes.includes(a.type)) {
      errors.push(`Action ${index + 1}: invalid type "${a.type}"`)
    }

    if (!a.config) {
      errors.push(`Action ${index + 1}: config is required`)
    } else {
      // Validate action-specific config
      const configErrors = validateActionConfig(a.type, a.config as Record<string, unknown>)
      configErrors.forEach(error => {
        errors.push(`Action ${index + 1}: ${error}`)
      })
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate action-specific configuration
 */
function validateActionConfig(type: ActionType, config: Record<string, unknown>): string[] {
  const errors: string[] = []

  switch (type) {
    case ActionType.SEND_EMAIL:
      if (!config.to) errors.push('Email "to" address is required')
      if (!config.subject) errors.push('Email subject is required')
      if (!config.body) errors.push('Email body is required')
      break

    case ActionType.SEND_SLACK:
      if (!config.channel) errors.push('Slack channel is required')
      if (!config.message) errors.push('Slack message is required')
      break

    case ActionType.SEND_TEAMS:
      if (!config.webhookUrl) errors.push('Teams webhook URL is required')
      if (!config.message) errors.push('Teams message is required')
      break

    case ActionType.SEND_SMS:
      if (!config.to) errors.push('SMS recipient phone number is required')
      if (!config.body) errors.push('SMS message body is required')
      break

    case ActionType.CREATE_TASK:
      if (!config.title) errors.push('Task title is required')
      if (!config.projectId) errors.push('Project ID is required')
      break

    case ActionType.UPDATE_PROJECT_STATUS:
      if (!config.projectId) errors.push('Project ID is required')
      if (!config.status) errors.push('New status is required')
      break

    case ActionType.UPDATE_TASK_STATUS:
      if (!config.taskId) errors.push('Task ID is required')
      if (!config.status) errors.push('New status is required')
      break

    case ActionType.ASSIGN_TASK:
      if (!config.taskId) errors.push('Task ID is required')
      if (!config.userId) errors.push('User ID is required')
      break

    case ActionType.WEBHOOK:
      if (!config.url) errors.push('Webhook URL is required')
      if (!config.method) errors.push('HTTP method is required')
      break

    case ActionType.DELAY:
      if (!config.seconds) errors.push('Delay duration in seconds is required')
      if (typeof config.seconds === 'number' && config.seconds < 1) {
        errors.push('Delay must be at least 1 second')
      }
      break

    // Add more action-specific validations as needed
  }

  return errors
}

/**
 * Validate template variables in strings
 */
export function validateTemplateVariables(text: string, availableVariables: string[]): ValidationResult {
  const errors: string[] = []
  
  // Find all template variables in the format {{variable}}
  const regex = /{{(\s*[^}]+\s*)}}/g
  const matches = text.matchAll(regex)

  for (const match of matches) {
    const variable = match[1].trim()
    
    // Check if variable exists in available variables
    if (!availableVariables.includes(variable)) {
      errors.push(`Unknown template variable: {{${variable}}}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export const workflowValidation = {
  validateWorkflow,
  validateTriggers,
  validateConditions,
  validateActions,
  validateTemplateVariables,
}

export default workflowValidation
