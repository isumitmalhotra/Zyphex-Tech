/**
 * Workflow Automation System - Main Export
 * 
 * Central export point for the workflow automation engine and related components.
 * 
 * @module lib/workflow
 */

export { WorkflowEngine, type WorkflowEngineConfig } from './workflow-engine'
export { TriggerEvaluator } from './trigger-evaluator'
export { ConditionEvaluator } from './condition-evaluator'
export { ActionExecutor } from './action-executor'
export {
  triggerWorkflows,
  triggerProjectWorkflows,
  triggerTaskWorkflows,
  triggerInvoiceWorkflows,
  triggerClientWorkflows,
  triggerScheduledWorkflows,
  triggerWebhookWorkflows,
  triggerWorkflowsAsync,
} from './trigger-helper'
