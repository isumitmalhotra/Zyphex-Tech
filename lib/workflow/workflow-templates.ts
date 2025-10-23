/**
 * Pre-built Workflow Templates
 * 
 * This file contains pre-configured workflow templates for common use cases.
 * Templates can be instantiated and customized by users to quickly set up workflows.
 */

import { WorkflowTrigger, WorkflowCondition, WorkflowAction } from "./workflow-types"

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string // Lucide icon name
  tags: string[]
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedSetupTime: string
  useCases: string[]
  triggers: WorkflowTrigger[]
  conditions: WorkflowCondition | null
  actions: WorkflowAction[]
  priority: number
  maxRetries: number
  retryDelay: number
  timeout: number
  customizationPoints: string[] // What users typically customize
  prerequisites?: string[] // What needs to be set up first
}

/**
 * All available workflow templates
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ============================================================================
  // PROJECT MANAGEMENT TEMPLATES
  // ============================================================================
  {
    id: "project-created-notification",
    name: "New Project Notification",
    description: "Send email and Slack notification when a new project is created",
    category: "project_management",
    icon: "Briefcase",
    tags: ["notification", "project", "email", "slack"],
    difficulty: "beginner",
    estimatedSetupTime: "2 minutes",
    useCases: [
      "Notify team when new projects are created",
      "Keep stakeholders informed of project pipeline",
      "Automatically announce new work in Slack channels"
    ],
    triggers: [
      {
        type: "PROJECT_CREATED",
        config: {}
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "team@company.com",
          subject: "New Project Created: {{entity.data.name}}",
          body: "A new project has been created:\n\nProject: {{entity.data.name}}\nClient: {{entity.data.clientName}}\nStatus: {{entity.data.status}}\nPriority: {{entity.data.priority}}\n\nView project: {{entity.data.url}}"
        },
        order: 1
      },
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#projects",
          text: "🎉 New project created: *{{entity.data.name}}* for {{entity.data.clientName}}"
        },
        order: 2
      }
    ],
    priority: 5,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Email recipient address",
      "Slack channel name",
      "Message content and formatting",
      "Add additional notifications (SMS, Teams, etc.)"
    ]
  },

  {
    id: "project-status-change-alert",
    name: "Project Status Change Alert",
    description: "Alert project manager and client when project status changes to specific states",
    category: "project_management",
    icon: "AlertCircle",
    tags: ["notification", "project", "status", "alert"],
    difficulty: "intermediate",
    estimatedSetupTime: "5 minutes",
    useCases: [
      "Notify when project moves to IN_PROGRESS",
      "Alert when project is COMPLETED",
      "Escalate when project is ON_HOLD"
    ],
    triggers: [
      {
        type: "PROJECT_STATUS_CHANGED",
        config: {}
      }
    ],
    conditions: {
      operator: "OR",
      conditions: [
        { field: "entity.data.status", operator: "EQUALS", value: "IN_PROGRESS" },
        { field: "entity.data.status", operator: "EQUALS", value: "COMPLETED" },
        { field: "entity.data.status", operator: "EQUALS", value: "ON_HOLD" }
      ]
    },
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.projectManagerEmail}}",
          subject: "Project Status Changed: {{entity.data.name}}",
          body: "Project status has changed to: {{entity.data.status}}\n\nProject: {{entity.data.name}}\nClient: {{entity.data.clientName}}\nNew Status: {{entity.data.status}}\n\nView project: {{entity.data.url}}"
        },
        order: 1
      },
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.projectManagerId}}",
          title: "Project Status Updated",
          message: "{{entity.data.name}} is now {{entity.data.status}}"
        },
        order: 2
      }
    ],
    priority: 7,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Status values to monitor",
      "Email recipients",
      "Notification content",
      "Add client email notification"
    ]
  },

  {
    id: "project-overdue-reminder",
    name: "Overdue Project Reminder",
    description: "Send daily reminder for projects that are overdue",
    category: "project_management",
    icon: "Clock",
    tags: ["reminder", "project", "deadline", "overdue"],
    difficulty: "beginner",
    estimatedSetupTime: "3 minutes",
    useCases: [
      "Daily reminders for overdue projects",
      "Escalate to management after X days",
      "Keep team accountable for deadlines"
    ],
    triggers: [
      {
        type: "SCHEDULE",
        config: {
          schedule: "0 9 * * *" // Daily at 9 AM
        }
      }
    ],
    conditions: {
      operator: "AND",
      conditions: [
        { field: "entity.data.status", operator: "EQUALS", value: "IN_PROGRESS" },
        { field: "entity.data.deadline", operator: "LESS_THAN", value: "{{now}}" }
      ]
    },
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.projectManagerEmail}}",
          subject: "⚠️ Overdue Project: {{entity.data.name}}",
          body: "This project is overdue and needs attention:\n\nProject: {{entity.data.name}}\nDeadline: {{entity.data.deadline}}\nDays Overdue: {{entity.data.daysOverdue}}\n\nPlease update the status or deadline."
        },
        order: 1
      },
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#project-alerts",
          text: "⚠️ Overdue project: *{{entity.data.name}}* ({{entity.data.daysOverdue}} days)"
        },
        order: 2
      }
    ],
    priority: 8,
    maxRetries: 2,
    retryDelay: 120,
    timeout: 300,
    customizationPoints: [
      "Schedule time (default: 9 AM daily)",
      "Email recipients",
      "Add escalation after X days",
      "Customize alert thresholds"
    ]
  },

  // ============================================================================
  // TASK MANAGEMENT TEMPLATES
  // ============================================================================
  {
    id: "task-assignment-notification",
    name: "Task Assignment Notification",
    description: "Notify user when a task is assigned to them",
    category: "task_management",
    icon: "UserCheck",
    tags: ["notification", "task", "assignment"],
    difficulty: "beginner",
    estimatedSetupTime: "2 minutes",
    useCases: [
      "Instantly notify users of new task assignments",
      "Send email confirmation of task details",
      "Keep team members informed of their workload"
    ],
    triggers: [
      {
        type: "TASK_ASSIGNED",
        config: {}
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.assignedToId}}",
          title: "New Task Assigned",
          message: "You've been assigned: {{entity.data.title}}"
        },
        order: 1
      },
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.assignedToEmail}}",
          subject: "New Task Assignment: {{entity.data.title}}",
          body: "You've been assigned a new task:\n\nTask: {{entity.data.title}}\nProject: {{entity.data.projectName}}\nPriority: {{entity.data.priority}}\nDue Date: {{entity.data.dueDate}}\n\nDescription:\n{{entity.data.description}}\n\nView task: {{entity.data.url}}"
        },
        order: 2
      }
    ],
    priority: 6,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Add SMS notification for high-priority tasks",
      "Include additional task details",
      "Customize email template",
      "Add Slack notification"
    ]
  },

  {
    id: "task-completion-workflow",
    name: "Task Completion Workflow",
    description: "Notify project manager and update project progress when task is completed",
    category: "task_management",
    icon: "CheckCircle",
    tags: ["notification", "task", "completion"],
    difficulty: "intermediate",
    estimatedSetupTime: "4 minutes",
    useCases: [
      "Notify stakeholders when tasks complete",
      "Track project completion percentage",
      "Trigger next steps in project workflow"
    ],
    triggers: [
      {
        type: "TASK_COMPLETED",
        config: {}
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.projectManagerEmail}}",
          subject: "Task Completed: {{entity.data.title}}",
          body: "A task has been completed:\n\nTask: {{entity.data.title}}\nCompleted By: {{entity.data.completedByName}}\nProject: {{entity.data.projectName}}\nCompletion Date: {{entity.data.completedAt}}\n\nView task: {{entity.data.url}}"
        },
        order: 1
      },
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.projectManagerId}}",
          title: "Task Completed",
          message: "{{entity.data.completedByName}} completed: {{entity.data.title}}"
        },
        order: 2
      },
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#project-updates",
          text: "✅ Task completed: *{{entity.data.title}}* by {{entity.data.completedByName}}"
        },
        order: 3
      }
    ],
    priority: 5,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Add webhook to update external systems",
      "Customize notification recipients",
      "Add celebration message for milestones",
      "Trigger dependent task creation"
    ]
  },

  {
    id: "task-overdue-escalation",
    name: "Overdue Task Escalation",
    description: "Escalate overdue high-priority tasks to management",
    category: "task_management",
    icon: "AlertTriangle",
    tags: ["escalation", "task", "overdue", "priority"],
    difficulty: "intermediate",
    estimatedSetupTime: "5 minutes",
    useCases: [
      "Escalate critical overdue tasks",
      "Notify management of blockers",
      "Ensure high-priority work gets attention"
    ],
    triggers: [
      {
        type: "SCHEDULE",
        config: {
          schedule: "0 */4 * * *" // Every 4 hours
        }
      }
    ],
    conditions: {
      operator: "AND",
      conditions: [
        { field: "entity.data.status", operator: "EQUALS", value: "IN_PROGRESS" },
        { field: "entity.data.dueDate", operator: "LESS_THAN", value: "{{now}}" },
        { field: "entity.data.priority", operator: "EQUALS", value: "HIGH" }
      ]
    },
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "management@company.com",
          subject: "🚨 High-Priority Task Overdue: {{entity.data.title}}",
          body: "A high-priority task is overdue:\n\nTask: {{entity.data.title}}\nAssigned To: {{entity.data.assignedToName}}\nProject: {{entity.data.projectName}}\nDue Date: {{entity.data.dueDate}}\nDays Overdue: {{entity.data.daysOverdue}}\n\nImmediate action required."
        },
        order: 1
      },
      {
        type: "SEND_SMS",
        config: {
          to: "{{entity.data.managerPhone}}",
          body: "High-priority task overdue: {{entity.data.title}} ({{entity.data.daysOverdue}} days)"
        },
        order: 2
      }
    ],
    priority: 9,
    maxRetries: 2,
    retryDelay: 120,
    timeout: 300,
    customizationPoints: [
      "Adjust escalation frequency",
      "Add different priority levels",
      "Include multiple escalation tiers",
      "Add Teams notification"
    ],
    prerequisites: [
      "Configure SMS provider credentials",
      "Set up manager phone numbers"
    ]
  },

  // ============================================================================
  // INVOICE & PAYMENT TEMPLATES
  // ============================================================================
  {
    id: "invoice-created-notification",
    name: "New Invoice Notification",
    description: "Send invoice to client immediately after creation",
    category: "invoice_payment",
    icon: "FileText",
    tags: ["invoice", "notification", "client", "billing"],
    difficulty: "beginner",
    estimatedSetupTime: "3 minutes",
    useCases: [
      "Automatically email invoices to clients",
      "Track invoice send confirmations",
      "Ensure timely billing communication"
    ],
    triggers: [
      {
        type: "INVOICE_CREATED",
        config: {}
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.clientEmail}}",
          subject: "Invoice #{{entity.data.invoiceNumber}} from {{entity.data.companyName}}",
          body: "Dear {{entity.data.clientName}},\n\nPlease find your invoice attached.\n\nInvoice Number: {{entity.data.invoiceNumber}}\nAmount Due: ${{entity.data.amount}}\nDue Date: {{entity.data.dueDate}}\n\nView and pay online: {{entity.data.paymentUrl}}\n\nThank you for your business!"
        },
        order: 1
      },
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.createdById}}",
          title: "Invoice Sent",
          message: "Invoice #{{entity.data.invoiceNumber}} sent to {{entity.data.clientName}}"
        },
        order: 2
      }
    ],
    priority: 7,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Customize email template",
      "Add PDF attachment",
      "Include payment instructions",
      "Add CC recipients (accounting team)"
    ]
  },

  {
    id: "invoice-payment-received",
    name: "Payment Received Confirmation",
    description: "Thank client and notify accounting when invoice is paid",
    category: "invoice_payment",
    icon: "DollarSign",
    tags: ["invoice", "payment", "confirmation", "accounting"],
    difficulty: "beginner",
    estimatedSetupTime: "2 minutes",
    useCases: [
      "Thank clients for payments",
      "Notify accounting of received payments",
      "Update payment status in other systems"
    ],
    triggers: [
      {
        type: "INVOICE_PAID",
        config: {}
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.clientEmail}}",
          subject: "Payment Received - Invoice #{{entity.data.invoiceNumber}}",
          body: "Dear {{entity.data.clientName}},\n\nThank you! We've received your payment.\n\nInvoice Number: {{entity.data.invoiceNumber}}\nAmount Paid: ${{entity.data.amount}}\nPayment Date: {{entity.data.paidAt}}\n\nA receipt has been sent to your email.\n\nWe appreciate your business!"
        },
        order: 1
      },
      {
        type: "SEND_EMAIL",
        config: {
          to: "accounting@company.com",
          subject: "Payment Received: Invoice #{{entity.data.invoiceNumber}}",
          body: "Payment received for:\n\nClient: {{entity.data.clientName}}\nInvoice: {{entity.data.invoiceNumber}}\nAmount: ${{entity.data.amount}}\nPayment Method: {{entity.data.paymentMethod}}\n\nPlease process accordingly."
        },
        order: 2
      },
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#accounting",
          text: "💰 Payment received: ${{entity.data.amount}} from {{entity.data.clientName}} (Invoice #{{entity.data.invoiceNumber}})"
        },
        order: 3
      }
    ],
    priority: 6,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Add webhook to accounting software",
      "Customize thank you message",
      "Include payment receipt",
      "Add celebration for large payments"
    ]
  },

  {
    id: "invoice-overdue-reminder",
    name: "Overdue Invoice Reminder",
    description: "Send polite reminder for overdue invoices with escalating urgency",
    category: "invoice_payment",
    icon: "Bell",
    tags: ["invoice", "overdue", "reminder", "collection"],
    difficulty: "intermediate",
    estimatedSetupTime: "5 minutes",
    useCases: [
      "Automate payment reminders",
      "Reduce manual collection work",
      "Improve payment collection rates"
    ],
    triggers: [
      {
        type: "SCHEDULE",
        config: {
          schedule: "0 10 * * *" // Daily at 10 AM
        }
      }
    ],
    conditions: {
      operator: "AND",
      conditions: [
        { field: "entity.data.status", operator: "EQUALS", value: "SENT" },
        { field: "entity.data.dueDate", operator: "LESS_THAN", value: "{{now}}" }
      ]
    },
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.clientEmail}}",
          subject: "Payment Reminder - Invoice #{{entity.data.invoiceNumber}}",
          body: "Dear {{entity.data.clientName}},\n\nThis is a friendly reminder that payment is overdue.\n\nInvoice Number: {{entity.data.invoiceNumber}}\nAmount Due: ${{entity.data.amount}}\nDue Date: {{entity.data.dueDate}}\nDays Overdue: {{entity.data.daysOverdue}}\n\nPay now: {{entity.data.paymentUrl}}\n\nIf you've already paid, please disregard this message.\n\nThank you!"
        },
        order: 1
      },
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.accountManagerId}}",
          title: "Overdue Invoice",
          message: "Invoice #{{entity.data.invoiceNumber}} is {{entity.data.daysOverdue}} days overdue"
        },
        order: 2
      }
    ],
    priority: 7,
    maxRetries: 2,
    retryDelay: 120,
    timeout: 300,
    customizationPoints: [
      "Add escalation stages (7 days, 14 days, 30 days)",
      "Customize reminder tone based on days overdue",
      "Add late fees calculation",
      "Include payment plan options"
    ]
  },

  // ============================================================================
  // CLIENT COMMUNICATION TEMPLATES
  // ============================================================================
  {
    id: "client-welcome-workflow",
    name: "New Client Welcome Series",
    description: "Send welcome email series to new clients with onboarding information",
    category: "client_communication",
    icon: "UserPlus",
    tags: ["client", "welcome", "onboarding", "email"],
    difficulty: "intermediate",
    estimatedSetupTime: "8 minutes",
    useCases: [
      "Automate client onboarding",
      "Provide welcome information",
      "Set expectations for new clients"
    ],
    triggers: [
      {
        type: "USER_REGISTERED",
        config: {}
      }
    ],
    conditions: {
      operator: "AND",
      conditions: [
        { field: "entity.data.role", operator: "EQUALS", value: "CLIENT" }
      ]
    },
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.email}}",
          subject: "Welcome to {{entity.data.companyName}}! 🎉",
          body: "Dear {{entity.data.name}},\n\nWelcome! We're excited to work with you.\n\nHere's what to expect:\n\n1. Your account is now active\n2. You can access your dashboard at: {{entity.data.dashboardUrl}}\n3. Your dedicated account manager is: {{entity.data.accountManagerName}}\n4. Support email: support@company.com\n\nNext Steps:\n- Complete your profile\n- Schedule a kickoff call\n- Upload project requirements\n\nLet's build something great together!\n\nBest regards,\nThe Team"
        },
        order: 1
      },
      {
        type: "WAIT",
        config: {
          duration: 86400 // 24 hours
        },
        order: 2
      },
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.email}}",
          subject: "Getting Started Guide - Day 2",
          body: "Hi {{entity.data.name}},\n\nHere are some resources to help you get started:\n\n📚 Knowledge Base: {{entity.data.kbUrl}}\n🎥 Video Tutorials: {{entity.data.videosUrl}}\n💬 Community Forum: {{entity.data.forumUrl}}\n\nNeed help? Reply to this email anytime.\n\nBest regards,\nThe Team"
        },
        order: 3
      },
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.accountManagerId}}",
          title: "New Client Onboarded",
          message: "{{entity.data.name}} completed welcome series. Schedule followup call."
        },
        order: 4
      }
    ],
    priority: 6,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 600,
    customizationPoints: [
      "Customize email series timing",
      "Add more follow-up emails",
      "Include personalized content",
      "Add video onboarding"
    ]
  },

  {
    id: "client-milestone-celebration",
    name: "Client Milestone Celebration",
    description: "Celebrate client milestones (anniversaries, project completions, etc.)",
    category: "client_communication",
    icon: "Award",
    tags: ["client", "celebration", "milestone", "engagement"],
    difficulty: "beginner",
    estimatedSetupTime: "3 minutes",
    useCases: [
      "Build client relationships",
      "Celebrate project completions",
      "Recognize client anniversaries"
    ],
    triggers: [
      {
        type: "PROJECT_COMPLETED",
        config: {}
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_EMAIL",
        config: {
          to: "{{entity.data.clientEmail}}",
          subject: "🎉 Congratulations on Project Completion!",
          body: "Dear {{entity.data.clientName}},\n\nCongratulations! Your project is complete.\n\nProject: {{entity.data.projectName}}\nCompleted: {{entity.data.completedAt}}\nDelivered: {{entity.data.deliverables}}\n\nWe've loved working on this project with you. Here's a summary of what we accomplished:\n\n{{entity.data.accomplishments}}\n\nWe'd love to hear your feedback and discuss future projects.\n\nThank you for trusting us with your vision!\n\nBest regards,\nThe Team"
        },
        order: 1
      },
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#client-success",
          text: "🎉 Project completed for {{entity.data.clientName}}: {{entity.data.projectName}}"
        },
        order: 2
      }
    ],
    priority: 5,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Add testimonial request",
      "Include project highlights",
      "Send gift or discount code",
      "Request referrals"
    ]
  },

  // ============================================================================
  // TEAM COLLABORATION TEMPLATES
  // ============================================================================
  {
    id: "daily-standup-reminder",
    name: "Daily Standup Reminder",
    description: "Send daily standup reminder to team with agenda",
    category: "team_collaboration",
    icon: "Users",
    tags: ["team", "standup", "reminder", "meeting"],
    difficulty: "beginner",
    estimatedSetupTime: "2 minutes",
    useCases: [
      "Remind team of daily standup",
      "Share standup agenda",
      "Link to meeting room"
    ],
    triggers: [
      {
        type: "SCHEDULE",
        config: {
          schedule: "0 9 * * 1-5" // Weekdays at 9 AM
        }
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#team-standup",
          text: "☀️ Good morning team! Standup in 15 minutes.\n\n📋 Agenda:\n• What did you do yesterday?\n• What will you do today?\n• Any blockers?\n\n🔗 Join: {{entity.data.meetingUrl}}"
        },
        order: 1
      },
      {
        type: "SEND_TEAMS_MESSAGE",
        config: {
          webhookUrl: "{{entity.data.teamsWebhook}}",
          title: "Daily Standup - 9:15 AM",
          text: "Time for our daily standup! Join the meeting now."
        },
        order: 2
      }
    ],
    priority: 5,
    maxRetries: 2,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Adjust reminder time",
      "Customize meeting days",
      "Add meeting notes link",
      "Include team availability"
    ],
    prerequisites: [
      "Configure Slack webhook",
      "Configure Teams webhook"
    ]
  },

  {
    id: "team-achievement-celebration",
    name: "Team Achievement Broadcast",
    description: "Announce team achievements and wins to the entire company",
    category: "team_collaboration",
    icon: "Trophy",
    tags: ["team", "celebration", "achievement", "morale"],
    difficulty: "beginner",
    estimatedSetupTime: "2 minutes",
    useCases: [
      "Boost team morale",
      "Share wins company-wide",
      "Recognize team efforts"
    ],
    triggers: [
      {
        type: "PROJECT_COMPLETED",
        config: {}
      }
    ],
    conditions: {
      operator: "AND",
      conditions: [
        { field: "entity.data.budget", operator: "GREATER_THAN", value: "50000" }
      ]
    },
    actions: [
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "#company-wins",
          text: "🏆 *MAJOR WIN!* 🏆\n\nTeam {{entity.data.teamName}} just completed: *{{entity.data.projectName}}*\n\nProject Value: ${{entity.data.budget}}\nClient: {{entity.data.clientName}}\nTeam Members: {{entity.data.teamMembers}}\n\nCongratulations to everyone involved! 🎉"
        },
        order: 1
      },
      {
        type: "SEND_EMAIL",
        config: {
          to: "all@company.com",
          subject: "🎉 Team Win: {{entity.data.projectName}} Completed!",
          body: "Great news!\n\nOur team has successfully completed a major project:\n\nProject: {{entity.data.projectName}}\nClient: {{entity.data.clientName}}\nValue: ${{entity.data.budget}}\n\nCongratulations to: {{entity.data.teamMembers}}\n\nLet's celebrate this achievement!"
        },
        order: 2
      }
    ],
    priority: 5,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Add minimum project value threshold",
      "Include project highlights",
      "Add team photos or screenshots",
      "Send to specific departments only"
    ]
  },

  {
    id: "code-review-assignment",
    name: "Code Review Assignment Notification",
    description: "Notify developer when assigned to review code",
    category: "team_collaboration",
    icon: "Code",
    tags: ["code", "review", "developer", "notification"],
    difficulty: "beginner",
    estimatedSetupTime: "2 minutes",
    useCases: [
      "Notify developers of code review assignments",
      "Track code review turnaround time",
      "Ensure timely code reviews"
    ],
    triggers: [
      {
        type: "WEBHOOK",
        config: {
          path: "/webhooks/code-review-assigned"
        }
      }
    ],
    conditions: null,
    actions: [
      {
        type: "SEND_NOTIFICATION",
        config: {
          userId: "{{entity.data.reviewerId}}",
          title: "Code Review Assigned",
          message: "{{entity.data.authorName}} requested review: {{entity.data.prTitle}}"
        },
        order: 1
      },
      {
        type: "SEND_SLACK_MESSAGE",
        config: {
          channel: "@{{entity.data.reviewerSlackId}}",
          text: "👨‍💻 Code review requested by {{entity.data.authorName}}\n\n*{{entity.data.prTitle}}*\n\n{{entity.data.prDescription}}\n\nView PR: {{entity.data.prUrl}}"
        },
        order: 2
      }
    ],
    priority: 6,
    maxRetries: 3,
    retryDelay: 60,
    timeout: 300,
    customizationPoints: [
      "Add email notification",
      "Include code diff summary",
      "Set review deadline",
      "Add priority indicators"
    ],
    prerequisites: [
      "Configure webhook endpoint",
      "Set up GitHub/GitLab integration"
    ]
  }
]

/**
 * Get all templates
 */
export function getAllTemplates(): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(template => template.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(template => template.id === id)
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return WORKFLOW_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    template.useCases.some(useCase => useCase.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: "beginner" | "intermediate" | "advanced"): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(template => template.difficulty === difficulty)
}

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  return Array.from(new Set(WORKFLOW_TEMPLATES.map(t => t.category)))
}

/**
 * Get template statistics
 */
export function getTemplateStats() {
  return {
    total: WORKFLOW_TEMPLATES.length,
    byCategory: getCategories().map(category => ({
      category,
      count: getTemplatesByCategory(category).length
    })),
    byDifficulty: {
      beginner: getTemplatesByDifficulty("beginner").length,
      intermediate: getTemplatesByDifficulty("intermediate").length,
      advanced: getTemplatesByDifficulty("advanced").length
    }
  }
}
