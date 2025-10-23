// Workflow Types
export interface WorkflowTrigger {
  type: string
  config: Record<string, unknown>
}

// Condition leaf node (actual condition check)
export interface WorkflowConditionLeaf {
  field: string
  operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "GREATER_THAN_OR_EQUAL" | "LESS_THAN_OR_EQUAL" | "CONTAINS" | "NOT_CONTAINS" | "STARTS_WITH" | "ENDS_WITH" | "IN" | "NOT_IN" | "IS_NULL" | "IS_NOT_NULL"
  value: unknown
}

// Condition group node (logical combination)
export interface WorkflowConditionGroup {
  operator: "AND" | "OR" | "NOT"
  conditions: WorkflowCondition[]
}

// Unified condition type (can be leaf or group)
export type WorkflowCondition = WorkflowConditionLeaf | WorkflowConditionGroup

export interface WorkflowAction {
  type: string
  config: Record<string, unknown>
  order: number
}

export interface WorkflowFormData {
  name: string
  description: string
  enabled: boolean
  triggers: WorkflowTrigger[]
  conditions: WorkflowCondition | null
  actions: WorkflowAction[]
  priority: number
  maxRetries: number
  retryDelay: number
  timeout: number
  category: string
  tags: string[]
}

// Trigger Types
export const TRIGGER_TYPES = [
  { value: "PROJECT_CREATED", label: "Project Created", description: "When a new project is created" },
  { value: "PROJECT_UPDATED", label: "Project Updated", description: "When a project is updated" },
  { value: "PROJECT_DELETED", label: "Project Deleted", description: "When a project is deleted" },
  { value: "PROJECT_STATUS_CHANGED", label: "Project Status Changed", description: "When project status changes" },
  { value: "TASK_CREATED", label: "Task Created", description: "When a new task is created" },
  { value: "TASK_UPDATED", label: "Task Updated", description: "When a task is updated" },
  { value: "TASK_COMPLETED", label: "Task Completed", description: "When a task is marked complete" },
  { value: "INVOICE_CREATED", label: "Invoice Created", description: "When a new invoice is created" },
  { value: "INVOICE_PAID", label: "Invoice Paid", description: "When an invoice is paid" },
  { value: "INVOICE_OVERDUE", label: "Invoice Overdue", description: "When an invoice becomes overdue" },
  { value: "USER_REGISTERED", label: "User Registered", description: "When a new user registers" },
  { value: "USER_ROLE_CHANGED", label: "User Role Changed", description: "When user role changes" },
  { value: "MESSAGE_RECEIVED", label: "Message Received", description: "When a message is received" },
  { value: "FILE_UPLOADED", label: "File Uploaded", description: "When a file is uploaded" },
  { value: "SCHEDULE", label: "Schedule", description: "Run on a schedule (cron)" },
  { value: "WEBHOOK", label: "Webhook", description: "Triggered by external webhook" },
  { value: "MANUAL", label: "Manual", description: "Manually triggered" },
] as const

// Action Types
export const ACTION_TYPES = [
  { value: "SEND_EMAIL", label: "Send Email", description: "Send an email notification", icon: "Mail" },
  { value: "SEND_SMS", label: "Send SMS", description: "Send SMS via Twilio", icon: "MessageSquare" },
  { value: "SEND_SLACK_MESSAGE", label: "Send Slack Message", description: "Post to Slack channel", icon: "MessageCircle" },
  { value: "SEND_TEAMS_MESSAGE", label: "Send Teams Message", description: "Post to Microsoft Teams", icon: "Users" },
  { value: "CREATE_TASK", label: "Create Task", description: "Create a new task", icon: "CheckSquare" },
  { value: "UPDATE_PROJECT", label: "Update Project", description: "Update project details", icon: "Briefcase" },
  { value: "ASSIGN_USER", label: "Assign User", description: "Assign user to entity", icon: "UserPlus" },
  { value: "CREATE_NOTIFICATION", label: "Create Notification", description: "Create in-app notification", icon: "Bell" },
  { value: "WEBHOOK", label: "Call Webhook", description: "Make HTTP request", icon: "Webhook" },
  { value: "WAIT", label: "Wait", description: "Pause for specified duration", icon: "Clock" },
  { value: "CONDITIONAL_BRANCH", label: "Conditional Branch", description: "Branch based on condition", icon: "GitBranch" },
  { value: "UPDATE_DATABASE", label: "Update Database", description: "Update database record", icon: "Database" },
  { value: "RUN_SCRIPT", label: "Run Script", description: "Execute custom script", icon: "Code" },
] as const

// Condition Operators
export const CONDITION_OPERATORS = [
  { value: "EQUALS", label: "Equals", symbol: "=" },
  { value: "NOT_EQUALS", label: "Not Equals", symbol: "≠" },
  { value: "GREATER_THAN", label: "Greater Than", symbol: ">" },
  { value: "LESS_THAN", label: "Less Than", symbol: "<" },
  { value: "GREATER_THAN_OR_EQUAL", label: "Greater Than or Equal", symbol: "≥" },
  { value: "LESS_THAN_OR_EQUAL", label: "Less Than or Equal", symbol: "≤" },
  { value: "CONTAINS", label: "Contains", symbol: "∋" },
  { value: "NOT_CONTAINS", label: "Not Contains", symbol: "∌" },
  { value: "STARTS_WITH", label: "Starts With", symbol: "^" },
  { value: "ENDS_WITH", label: "Ends With", symbol: "$" },
  { value: "IN", label: "In Array", symbol: "∈" },
  { value: "NOT_IN", label: "Not In Array", symbol: "∉" },
  { value: "IS_NULL", label: "Is Null", symbol: "∅" },
  { value: "IS_NOT_NULL", label: "Is Not Null", symbol: "≠∅" },
] as const

// Workflow Categories
export const WORKFLOW_CATEGORIES = [
  { value: "project-management", label: "Project Management" },
  { value: "communication", label: "Communication" },
  { value: "billing", label: "Billing & Invoicing" },
  { value: "notifications", label: "Notifications" },
  { value: "automation", label: "Automation" },
  { value: "reporting", label: "Reporting" },
  { value: "integration", label: "Integration" },
  { value: "custom", label: "Custom" },
] as const
