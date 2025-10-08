import { prisma } from '@/lib/prisma';
import {
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowStep,
  WorkflowCondition,
  WorkflowLog
} from './types';

// Automation-specific interfaces
export interface ScheduledWorkflow {
  id: string;
  workflowId: string;
  schedule: string;
  nextRun: Date;
  isActive: boolean;
}

export interface InvoiceAutomationData {
  projectId: string;
  timeEntries: TimeEntry[];
  clientId: string;
}

export interface ClientOnboardingData {
  clientData: Record<string, unknown>;
  assignedManager: string;
  services: string[];
}

export interface TimeEntry {
  description?: string;
  hours?: string;
  rate?: number;
  amount?: number;
}

export class WorkflowEngine {
  private static instance: WorkflowEngine;

  static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Get all workflow templates
   */
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    try {
      // In real implementation, would fetch from database
      // For now, return mock templates
      return [
        {
          id: 'client-onboarding',
          name: 'Client Onboarding',
          description: 'Automated client onboarding process',
          category: 'CLIENT_ONBOARDING',
          steps: [
            {
              id: 'step1',
              name: 'Create Client Record',
              type: 'ACTION',
              action: 'create_client',
              parameters: { source: 'automation' }
            },
            {
              id: 'step2',
              name: 'Send Welcome Email',
              type: 'NOTIFICATION',
              action: 'send_email',
              parameters: { template: 'welcome_email' }
            }
          ],
          triggers: [
            {
              id: 'trigger1',
              type: 'MANUAL'
            }
          ],
          variables: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(workflowId?: string, status?: string): Promise<WorkflowExecution[]> {
    try {
      // In real implementation, would fetch from database
      // For now, return mock executions
      return [
        {
          id: 'exec_001',
          workflowId: workflowId || 'client-onboarding',
          status: (status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED') || 'COMPLETED',
          startedAt: new Date(),
          completedAt: new Date(),
          context: { clientId: 'client_123' },
          logs: []
        }
      ];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get scheduled workflows
   */
  async getScheduledWorkflows(): Promise<ScheduledWorkflow[]> {
    try {
      // In real implementation, would fetch from database
      return [
        {
          id: 'schedule_001',
          workflowId: 'invoice-generation',
          schedule: '0 0 1 * *', // Monthly on 1st
          nextRun: new Date(),
          isActive: true
        }
      ];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update workflow template
   */
  async updateWorkflowTemplate(workflowId: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    try {
      // In real implementation, would update in database
      const template = await this.getWorkflowTemplate(workflowId);
      if (!template) {
        throw new Error(`Workflow template ${workflowId} not found`);
      }

      return {
        ...template,
        ...updates,
        updatedAt: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete workflow template
   */
  async deleteWorkflowTemplate(workflowId: string): Promise<void> {
    try {
      // In real implementation, would delete from database
      // Workflow template deleted
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create invoice automation
   */
  async createInvoiceAutomation(data: InvoiceAutomationData): Promise<WorkflowExecution> {
    try {
      const workflowId = 'invoice-automation';
      const context = {
        projectId: data.projectId,
        timeEntries: data.timeEntries,
        clientId: data.clientId
      };

      return await this.executeWorkflow(workflowId, context);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute client onboarding workflow
   */
  async executeClientOnboarding(data: ClientOnboardingData): Promise<WorkflowExecution> {
    try {
      const workflowId = 'client-onboarding';
      const context = {
        clientData: data.clientData,
        assignedManager: data.assignedManager,
        services: data.services
      };

      return await this.executeWorkflow(workflowId, context);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute a workflow with given context
   */
  async executeWorkflow(workflowId: string, context: Record<string, unknown>): Promise<WorkflowExecution> {
    try {
      // Start workflow execution
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        status: 'RUNNING',
        startedAt: new Date(),
        context,
        logs: []
      };

      this.log(execution, 'INFO', `Starting workflow execution for workflow ${workflowId}`);

      // Get workflow template (in real implementation, would be from database)
      const workflow = await this.getWorkflowTemplate(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.isActive) {
        throw new Error(`Workflow ${workflowId} is not active`);
      }

      // Execute workflow steps
      await this.executeWorkflowSteps(workflow, execution);

      execution.status = 'COMPLETED';
      execution.completedAt = new Date();
      this.log(execution, 'INFO', 'Workflow execution completed successfully');

      return execution;
    } catch (error) {
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        status: 'FAILED',
        startedAt: new Date(),
        completedAt: new Date(),
        context,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: []
      };

      this.log(execution, 'ERROR', `Workflow execution failed: ${execution.error}`);
      throw error;
    }
  }

  /**
   * Create a new workflow template
   */
  async createWorkflowTemplate(template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowTemplate> {
    const newTemplate: WorkflowTemplate = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In real implementation, save to database
    // await prisma.workflowTemplate.create({ data: newTemplate });

    return newTemplate;
  }

  /**
   * Schedule automated tasks based on project milestones
   */
  async scheduleAutomatedTasks(projectId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: true,
          client: true
        }
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Client onboarding workflow
      if (project.status === 'PLANNING') {
        await this.executeWorkflow('client_onboarding', {
          projectId: project.id,
          clientId: project.clientId,
          clientName: project.client.name,
          projectName: project.name
        });
      }

      // Project setup workflow
      if (project.status === 'IN_PROGRESS' && project.tasks.length === 0) {
        await this.executeWorkflow('project_setup', {
          projectId: project.id,
          projectName: project.name,
          startDate: project.startDate,
          endDate: project.endDate
        });
      }

      // Milestone check workflow
      const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
      const totalTasks = project.tasks.length;
      
      if (totalTasks > 0) {
        const completionRate = (completedTasks / totalTasks) * 100;
        
        if (completionRate >= 25 && completionRate < 50) {
          await this.executeWorkflow('milestone_25', { projectId, completionRate });
        } else if (completionRate >= 50 && completionRate < 75) {
          await this.executeWorkflow('milestone_50', { projectId, completionRate });
        } else if (completionRate >= 75 && completionRate < 100) {
          await this.executeWorkflow('milestone_75', { projectId, completionRate });
        } else if (completionRate >= 100) {
          await this.executeWorkflow('project_completion', { projectId, completionRate });
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate automated invoices from time entries
   */
  async generateAutomatedInvoices(projectId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          timeEntries: {
            where: {
              billable: true,
              // Only unbilled entries
              status: 'APPROVED'
            }
          }
        }
      });

      if (!project || project.timeEntries.length === 0) {
        return;
      }

      const totalAmount = project.timeEntries.reduce((sum, entry) => {
        return sum + Number(entry.amount || 0);
      }, 0);

      if (totalAmount > 0) {
        // Create invoice
        await prisma.invoice.create({
          data: {
            invoiceNumber: `INV-${Date.now()}`,
            clientId: project.clientId,
            projectId: project.id,
            amount: totalAmount,
            total: totalAmount * 1.1,
            status: 'DRAFT',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            lineItems: JSON.stringify(project.timeEntries.map(entry => ({
              description: entry.description || 'Time entry',
              quantity: parseFloat(entry.hours?.toString() || '0'),
              rate: Number(entry.rate || 0),
              amount: Number(entry.amount || 0)
            })))
          }
        });

        // Send notification
        await this.executeWorkflow('invoice_generated', {
          projectId,
          clientId: project.clientId,
          amount: totalAmount * 1.1
        });
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Send automated email notifications
   */
  async sendAutomatedNotifications(type: string, context: Record<string, unknown>): Promise<void> {
    try {
      const templates = {
        project_deadline_warning: {
          subject: 'Project Deadline Warning',
          template: 'Your project "{{projectName}}" has tasks due in {{daysUntilDue}} days.'
        },
        task_assigned: {
          subject: 'New Task Assigned',
          template: 'You have been assigned task "{{taskTitle}}" in project "{{projectName}}".'
        },
        invoice_generated: {
          subject: 'New Invoice Generated',
          template: 'Invoice for ${{amount}} has been generated for project "{{projectName}}".'
        },
        client_onboarding: {
          subject: 'Welcome to ZyphexTech',
          template: 'Welcome! Your project "{{projectName}}" has been set up successfully.'
        }
      };

      const template = templates[type as keyof typeof templates];
      if (!template) {
        throw new Error(`Email template for type "${type}" not found`);
      }

      // Replace placeholders in template
      let emailContent = template.template;
      Object.entries(context).forEach(([key, value]) => {
        emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });

      // In real implementation, send email using email service
      // Sending email notification

      // Log the notification
      await this.executeWorkflow('email_notification', {
        type,
        subject: template.subject,
        content: emailContent,
        ...context
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get predefined workflow templates
   */
  getDefaultWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'client_onboarding',
        name: 'Client Onboarding',
        description: 'Automated client onboarding process',
        category: 'CLIENT_ONBOARDING',
        steps: [
          {
            id: 'send_welcome_email',
            name: 'Send Welcome Email',
            type: 'NOTIFICATION',
            action: 'send_email',
            parameters: {
              template: 'client_welcome',
              recipient: '{{clientEmail}}'
            }
          },
          {
            id: 'create_project_folder',
            name: 'Create Project Folder',
            type: 'ACTION',
            action: 'create_folder',
            parameters: {
              path: '/projects/{{projectId}}'
            }
          },
          {
            id: 'assign_project_manager',
            name: 'Assign Project Manager',
            type: 'ACTION',
            action: 'assign_user',
            parameters: {
              role: 'PROJECT_MANAGER',
              projectId: '{{projectId}}'
            }
          }
        ],
        triggers: [
          {
            id: 'project_created',
            type: 'EVENT',
            event: 'project.created'
          }
        ],
        variables: [
          { name: 'projectId', type: 'STRING', required: true },
          { name: 'clientId', type: 'STRING', required: true },
          { name: 'clientEmail', type: 'STRING', required: true }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'project_setup',
        name: 'Project Setup',
        description: 'Automated project setup and task creation',
        category: 'PROJECT_SETUP',
        steps: [
          {
            id: 'create_default_tasks',
            name: 'Create Default Tasks',
            type: 'ACTION',
            action: 'create_tasks',
            parameters: {
              tasks: [
                { title: 'Project kickoff meeting', priority: 'HIGH' },
                { title: 'Requirements gathering', priority: 'HIGH' },
                { title: 'Technical documentation', priority: 'MEDIUM' },
                { title: 'Testing and QA', priority: 'MEDIUM' },
                { title: 'Project delivery', priority: 'HIGH' }
              ]
            }
          },
          {
            id: 'schedule_kickoff',
            name: 'Schedule Kickoff Meeting',
            type: 'ACTION',
            action: 'schedule_meeting',
            parameters: {
              title: 'Project Kickoff - {{projectName}}',
              duration: 60
            }
          }
        ],
        triggers: [
          {
            id: 'project_started',
            type: 'EVENT',
            event: 'project.status_changed',
            conditions: [
              { field: 'status', operator: 'EQUALS', value: 'IN_PROGRESS' }
            ]
          }
        ],
        variables: [
          { name: 'projectId', type: 'STRING', required: true },
          { name: 'projectName', type: 'STRING', required: true }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'invoice_generation',
        name: 'Automated Invoice Generation',
        description: 'Generate invoices from billable time entries',
        category: 'BILLING',
        steps: [
          {
            id: 'calculate_billable_hours',
            name: 'Calculate Billable Hours',
            type: 'ACTION',
            action: 'calculate_billing',
            parameters: {
              projectId: '{{projectId}}',
              period: 'monthly'
            }
          },
          {
            id: 'generate_invoice',
            name: 'Generate Invoice',
            type: 'ACTION',
            action: 'create_invoice',
            parameters: {
              clientId: '{{clientId}}',
              projectId: '{{projectId}}'
            }
          },
          {
            id: 'send_invoice_notification',
            name: 'Send Invoice Notification',
            type: 'NOTIFICATION',
            action: 'send_email',
            parameters: {
              template: 'invoice_generated',
              recipient: '{{clientEmail}}'
            }
          }
        ],
        triggers: [
          {
            id: 'monthly_billing',
            type: 'SCHEDULE',
            schedule: '0 0 1 * *' // First day of each month
          }
        ],
        variables: [
          { name: 'projectId', type: 'STRING', required: true },
          { name: 'clientId', type: 'STRING', required: true },
          { name: 'clientEmail', type: 'STRING', required: true }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Private helper methods
  private async executeWorkflowSteps(workflow: WorkflowTemplate, execution: WorkflowExecution): Promise<void> {
    for (const step of workflow.steps) {
      try {
        execution.currentStep = step.id;
        this.log(execution, 'INFO', `Executing step: ${step.name}`);

        // Execute step based on type
        await this.executeStep(step, execution);

        this.log(execution, 'INFO', `Completed step: ${step.name}`);
      } catch (error) {
        this.log(execution, 'ERROR', `Failed to execute step ${step.name}: ${error}`);
        throw error;
      }
    }
  }

  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<void> {
    const parameters = this.replaceVariables(step.parameters, execution.context);

    switch (step.type) {
      case 'ACTION':
        await this.executeAction(step.action, parameters);
        break;
      case 'CONDITION':
        await this.evaluateCondition(step.conditions || [], execution.context);
        break;
      case 'NOTIFICATION':
        await this.sendNotification(step.action, parameters);
        break;
      case 'DELAY':
        await this.executeDelay(parameters);
        break;
      case 'APPROVAL':
        await this.requestApproval(parameters);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeAction(action: string, parameters: Record<string, unknown>): Promise<void> {
    // Mock action implementations
    switch (action) {
      case 'create_tasks':
        // Creating tasks
        break;
      case 'send_email':
        // Sending email
        break;
      case 'create_invoice':
        // Creating invoice
        break;
      case 'assign_user':
        // Assigning user
        break;
      default:
        // Executing action
        break;
    }
  }

  private async evaluateCondition(conditions: WorkflowCondition[], context: Record<string, unknown>): Promise<boolean> {
    return conditions.every(condition => {
      const contextValue = context[condition.field];
      
      switch (condition.operator) {
        case 'EQUALS':
          return contextValue === condition.value;
        case 'NOT_EQUALS':
          return contextValue !== condition.value;
        case 'GREATER_THAN':
          return Number(contextValue) > Number(condition.value);
        case 'LESS_THAN':
          return Number(contextValue) < Number(condition.value);
        case 'CONTAINS':
          return String(contextValue).includes(String(condition.value));
        case 'IN':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        default:
          return false;
      }
    });
  }

  private async sendNotification(action: string, parameters: Record<string, unknown>): Promise<void> {
    // Sending notification
  }

  private async executeDelay(parameters: Record<string, unknown>): Promise<void> {
    const delayMs = Number(parameters.delay || 1000);
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  private async requestApproval(parameters: Record<string, unknown>): Promise<void> {
    // Requesting approval
    // In real implementation, would create approval request
  }

  private replaceVariables(parameters: Record<string, unknown>, context: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        let replacedValue = value;
        Object.entries(context).forEach(([contextKey, contextValue]) => {
          replacedValue = replacedValue.replace(
            new RegExp(`{{${contextKey}}}`, 'g'),
            String(contextValue)
          );
        });
        result[key] = replacedValue;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  private async getWorkflowTemplate(workflowId: string): Promise<WorkflowTemplate | null> {
    // In real implementation, fetch from database
    const templates = this.getDefaultWorkflowTemplates();
    return templates.find(t => t.id === workflowId) || null;
  }

  private log(execution: WorkflowExecution, level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: unknown): void {
    const logEntry: WorkflowLog = {
      timestamp: new Date(),
      level,
      message,
      stepId: execution.currentStep,
      data
    };
    
    execution.logs.push(logEntry);
    // Log entry added
  }
}

// Legacy compatibility
export interface AutomationCondition {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface AutomationAction {
  type: string;
  target: string;
  value: string | number | boolean;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export async function getAutomationRules(): Promise<AutomationRule[]> {
  return [];
}

export async function createAutomationRule(rule: Partial<AutomationRule>): Promise<AutomationRule> {
  return { 
    id: '1', 
    ...rule, 
    createdAt: new Date(), 
    updatedAt: new Date() 
  } as AutomationRule;
}

export async function executeAutomationRule(_ruleId: string): Promise<{ success: boolean }> {
  return { success: true };
}
