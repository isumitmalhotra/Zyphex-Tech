import { prisma } from '@/lib/prisma';
import {
  ProjectHealthMetrics,
  ResourceMetrics,
  FinancialMetrics,
  ClientMetrics,
  RiskFactor,
  ProjectProfitability,
  ClientLifetimeValue,
  Alert
} from './types';

// Task interface for proper typing
interface Task {
  id: string;
  status: string;
  title: string;
  dueDate?: Date | string | null;
}

// Alert creation interface
interface CreateAlertData {
  type: 'PROJECT_RISK' | 'DEADLINE_WARNING' | 'BUDGET_OVERRUN' | 'RESOURCE_CONFLICT' | 'CLIENT_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  projectId?: string;
  clientId?: string;
  resourceId?: string;
}

// Alert update interface
interface UpdateAlertData {
  title?: string;
  description?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolvedAt?: Date;
  assignedTo?: string;
}

// Metrics refresh result interface
interface MetricsRefreshResult {
  projectHealth: ProjectHealthMetrics[];
  resourceMetrics: ResourceMetrics;
  financialSummary: FinancialMetrics;
  clientSatisfaction: ClientMetrics;
  alerts: Alert[];
  refreshedAt: Date;
}

export class PSADashboard {
  /**
   * Get comprehensive project health metrics
   */
  async getProjectHealth(userId?: string): Promise<ProjectHealthMetrics[]> {
    try {
      const projects = await prisma.project.findMany({
        where: userId ? {
          OR: [
            { users: { some: { id: userId } } },
            { teamMembers: { some: { userId } } },
            { tasks: { some: { assigneeId: userId } } }
          ]
        } : undefined,
        include: {
          tasks: {
            include: {
              timeEntries: true
            }
          },
          timeEntries: true,
          client: true,
          invoices: true
        }
      });

      const healthMetrics: ProjectHealthMetrics[] = [];

      for (const project of projects) {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t: Task) => t.status === 'DONE').length;
        const overdueTasks = project.tasks.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
        ).length;

        // Calculate completion percentage
        const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Calculate budget utilization
        const totalBudget = Number(project.budget || 0);
        const budgetUsed = Number(project.budgetUsed || 0);
        const budgetUtilization = totalBudget > 0 ? (budgetUsed / totalBudget) * 100 : 0;

        // Calculate schedule variance
        const scheduleVariance = this.calculateScheduleVariance(project);

        // Calculate team productivity
        const teamProductivity = await this.calculateTeamProductivity(project.id);

        // Mock client satisfaction (in real implementation, would come from surveys)
        const clientSatisfaction = this.mockClientSatisfaction();

        // Identify risk factors
        const riskFactors = this.identifyRiskFactors(
          budgetUtilization,
          scheduleVariance,
          overdueTasks,
          totalTasks,
          teamProductivity
        );

        // Calculate overall health score
        const healthScore = this.calculateHealthScore(
          completionPercentage,
          budgetUtilization,
          scheduleVariance,
          teamProductivity,
          clientSatisfaction,
          riskFactors.length
        );

        // Determine status
        let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'AT_RISK';
        if (healthScore >= 80) status = 'HEALTHY';
        else if (healthScore >= 60) status = 'WARNING';
        else if (healthScore >= 40) status = 'AT_RISK';
        else status = 'CRITICAL';

        healthMetrics.push({
          projectId: project.id,
          name: project.name,
          healthScore,
          status,
          completionPercentage,
          budgetUtilization,
          scheduleVariance,
          teamProductivity,
          clientSatisfaction,
          riskFactors,
          lastUpdated: new Date()
        });
      }

      return healthMetrics;
    } catch (error) {
      console.error('Error getting project health:', error);
      throw new Error('Failed to fetch project health metrics');
    }
  }

  /**
   * Get resource utilization metrics
   */
  async getResourceUtilization(): Promise<ResourceMetrics> {
    try {
      // Get all active users
      const users = await prisma.user.findMany({
        where: {
          deletedAt: null,
          role: { in: ['TEAM_MEMBER', 'PROJECT_MANAGER'] }
        },
        include: {
          timeEntries: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      });

      const totalCapacity = users.length * 40 * 4; // 40 hours/week * 4 weeks
      let utilizedCapacity = 0;
      let billableHours = 0;

      const resourcesByRole: Record<string, { 
        totalResources: number; 
        activeResources: number; 
        totalHours: number; 
        billableHours: number;
      }> = {};

      for (const user of users) {
        const userHours = user.timeEntries.reduce((total, entry) => {
          return total + (entry.hours ? Number(entry.hours) : 0);
        }, 0);

        const userBillableHours = user.timeEntries
          .filter(entry => entry.billable)
          .reduce((total, entry) => total + (entry.hours ? Number(entry.hours) : 0), 0);

        utilizedCapacity += userHours;
        billableHours += userBillableHours;

        // Group by role
        const role = user.role;
        if (!resourcesByRole[role]) {
          resourcesByRole[role] = {
            totalResources: 0,
            activeResources: 0,
            totalHours: 0,
            billableHours: 0
          };
        }

        resourcesByRole[role].totalResources++;
        if (userHours > 0) resourcesByRole[role].activeResources++;
        resourcesByRole[role].totalHours += userHours;
        resourcesByRole[role].billableHours += userBillableHours;
      }

      const utilizationRate = totalCapacity > 0 ? (utilizedCapacity / totalCapacity) * 100 : 0;
      const availableHours = totalCapacity - utilizedCapacity;
      const billableRate = utilizedCapacity > 0 ? (billableHours / utilizedCapacity) * 100 : 0;

      // Convert resourcesByRole to required format
      const resourcesByRoleArray = Object.entries(resourcesByRole).map(([role, data]) => ({
        role,
        totalResources: data.totalResources,
        activeResources: data.activeResources,
        utilization: data.totalResources > 0 ? (data.totalHours / (data.totalResources * 160)) * 100 : 0,
        averageRate: 75, // Mock average rate
        productivity: data.totalHours > 0 ? (data.billableHours / data.totalHours) * 100 : 0
      }));

      return {
        totalCapacity,
        utilizedCapacity,
        utilizationRate,
        availableHours,
        billableHours,
        billableRate,
        resourcesByRole: resourcesByRoleArray,
        capacityWarnings: [], // Would be calculated based on upcoming project demands
        forecastedUtilization: [] // Would use predictive algorithms
      };
    } catch (error) {
      console.error('Error getting resource utilization:', error);
      throw new Error('Failed to fetch resource utilization metrics');
    }
  }

  /**
   * Get financial performance metrics
   */
  async getFinancialSummary(): Promise<FinancialMetrics> {
    try {
      // Get invoices for financial data
      const invoices = await prisma.invoice.findMany({
        include: {
          client: true,
          project: true
        }
      });

      const totalRevenue = invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      // Mock costs calculation (would be more sophisticated in real implementation)
      const totalCosts = totalRevenue * 0.6; // Assume 60% cost ratio
      const grossProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      // Calculate MRR and ARR
      const monthlyRevenue = invoices
        .filter(inv => {
          const invoiceDate = new Date(inv.createdAt);
          const currentMonth = new Date();
          return invoiceDate.getMonth() === currentMonth.getMonth() && 
                 invoiceDate.getFullYear() === currentMonth.getFullYear() &&
                 inv.status === 'PAID';
        })
        .reduce((sum, inv) => sum + Number(inv.amount), 0);

      const monthlyRecurringRevenue = monthlyRevenue; // Simplified
      const annualRecurringRevenue = monthlyRecurringRevenue * 12;

      // Project profitability
      const projectProfitability: ProjectProfitability[] = [];
      const projects = await prisma.project.findMany({
        include: {
          invoices: true,
          timeEntries: true
        }
      });

      for (const project of projects) {
        const projectRevenue = project.invoices
          .filter(inv => inv.status === 'PAID')
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        const projectCosts = project.timeEntries
          .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        const profit = projectRevenue - projectCosts;
        const margin = projectRevenue > 0 ? (profit / projectRevenue) * 100 : 0;
        const budgetVariance = Number(project.budget || 0) > 0 ? 
          ((projectRevenue - Number(project.budget)) / Number(project.budget)) * 100 : 0;

        projectProfitability.push({
          projectId: project.id,
          projectName: project.name,
          revenue: projectRevenue,
          costs: projectCosts,
          profit,
          margin,
          budgetVariance
        });
      }

      // Outstanding invoices
      const outstandingInvoices = invoices
        .filter(inv => ['PENDING', 'SENT'].includes(inv.status))
        .map(inv => {
          const daysOverdue = inv.dueDate ? 
            Math.max(0, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;

          return {
            invoiceId: inv.id,
            clientId: inv.clientId,
            clientName: inv.client.name,
            amount: Number(inv.amount),
            dueDate: new Date(inv.dueDate || inv.createdAt),
            daysOverdue,
            status: (daysOverdue > 0 ? 'OVERDUE' : 'PENDING') as 'PENDING' | 'OVERDUE' | 'DISPUTED'
          };
        });

      return {
        totalRevenue,
        totalCosts,
        grossProfit,
        profitMargin,
        monthlyRecurringRevenue,
        annualRecurringRevenue,
        projectProfitability,
        cashFlow: [], // Would calculate from historical data
        outstandingInvoices,
        revenueByService: [] // Would categorize by service types
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw new Error('Failed to fetch financial metrics');
    }
  }

  /**
   * Get client satisfaction and metrics
   */
  async getClientSatisfaction(): Promise<ClientMetrics> {
    try {
      const clients = await prisma.client.findMany({
        include: {
          projects: {
            include: {
              invoices: true
            }
          }
        }
      });

      const totalClients = clients.length;
      const activeClients = clients.filter(client => 
        client.projects.some(project => 
          project.status === 'IN_PROGRESS' || project.status === 'PLANNING'
        )
      ).length;

      // Mock satisfaction scores (would come from surveys/feedback system)
      const averageSatisfactionScore = 4.2;

      // Calculate client lifetime values
      const clientLifetimeValue: ClientLifetimeValue[] = clients.map(client => {
        const totalRevenue = client.projects.reduce((sum, project) => {
          return sum + project.invoices
            .filter(inv => inv.status === 'PAID')
            .reduce((invSum, inv) => invSum + Number(inv.amount), 0);
        }, 0);

        return {
          clientId: client.id,
          clientName: client.name,
          currentValue: totalRevenue,
          projectedValue: totalRevenue * 1.5, // Mock projection
          acquisitionCost: 5000, // Mock acquisition cost
          profitability: totalRevenue - 5000,
          riskScore: Math.random() * 100 // Mock risk score
        };
      });

      return {
        totalClients,
        activeClients,
        averageSatisfactionScore,
        satisfactionTrend: [], // Would track over time
        clientLifetimeValue,
        churnRate: 5.2, // Mock churn rate
        renewalRate: 94.8, // Mock renewal rate
        upsellOpportunities: [] // Would identify from client data
      };
    } catch (error) {
      console.error('Error getting client satisfaction:', error);
      throw new Error('Failed to fetch client metrics');
    }
  }

  /**
   * Get active alerts for projects and resources
   */
  async getActiveAlerts(): Promise<Alert[]> {
    try {
      const alerts: Alert[] = [];
      
      // Check for project risks
      const projectHealth = await this.getProjectHealth();
      
      for (const project of projectHealth) {
        if (project.status === 'CRITICAL' || project.status === 'AT_RISK') {
          alerts.push({
            id: `project_${project.projectId}_${Date.now()}`,
            type: 'PROJECT_RISK',
            severity: project.status === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
            title: `Project ${project.name} requires attention`,
            description: `Health score: ${project.healthScore}%. Risk factors: ${project.riskFactors.map(r => r.type).join(', ')}`,
            projectId: project.projectId,
            createdAt: new Date(),
            actions: [
              {
                id: 'view_project',
                label: 'View Project',
                action: 'navigate'
              },
              {
                id: 'update_status',
                label: 'Update Status',
                action: 'modal'
              }
            ]
          });
        }
      }

      // Check for deadline warnings
      const upcomingDeadlines = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          },
          status: { not: 'DONE' }
        },
        include: {
          project: true,
          assignee: true
        }
      });

      for (const task of upcomingDeadlines) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        alerts.push({
          id: `deadline_${task.id}_${Date.now()}`,
          type: 'DEADLINE_WARNING',
          severity: daysUntilDue <= 2 ? 'HIGH' : 'MEDIUM',
          title: `Task "${task.title}" due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`}`,
          description: `Project: ${task.project.name}${task.assignee ? `, Assigned to: ${task.assignee.name}` : ''}`,
          projectId: task.projectId,
          createdAt: new Date(),
          actions: [
            {
              id: 'view_task',
              label: 'View Task',
              action: 'navigate'
            }
          ]
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      throw new Error('Failed to fetch active alerts');
    }
  }

  // Helper methods
  private calculateScheduleVariance(project: unknown): number {
    const proj = project as { startDate?: Date | string; endDate?: Date | string };
    if (!proj.startDate || !proj.endDate) return 0;
    
    const plannedDuration = new Date(proj.endDate).getTime() - new Date(proj.startDate).getTime();
    const actualDuration = Date.now() - new Date(proj.startDate).getTime();
    const variance = (actualDuration - plannedDuration) / (1000 * 60 * 60 * 24);
    
    return Math.round(variance);
  }

  private async calculateTeamProductivity(projectId: string): Promise<number> {
    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId },
      include: { task: true }
    });

    if (timeEntries.length === 0) return 0;

    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.hours ? Number(entry.hours) : 0), 0);
    const billableHours = timeEntries
      .filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.hours ? Number(entry.hours) : 0), 0);

    return totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
  }

  private mockClientSatisfaction(): number {
    return Math.round((Math.random() * 2 + 3) * 10) / 10; // 3.0 - 5.0 range
  }

  private identifyRiskFactors(
    budgetUtilization: number,
    scheduleVariance: number,
    overdueTasks: number,
    totalTasks: number,
    teamProductivity: number
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    if (budgetUtilization > 90) {
      risks.push({
        type: 'BUDGET',
        severity: budgetUtilization > 100 ? 'CRITICAL' : 'HIGH',
        description: `Budget utilization at ${budgetUtilization.toFixed(1)}%`,
        impact: 'Project may exceed budget constraints',
        mitigation: 'Review scope and optimize resource allocation'
      });
    }

    if (scheduleVariance > 5) {
      risks.push({
        type: 'SCHEDULE',
        severity: scheduleVariance > 14 ? 'CRITICAL' : 'HIGH',
        description: `Project running ${scheduleVariance} days behind schedule`,
        impact: 'Delivery timeline at risk',
        mitigation: 'Reallocate resources or adjust timeline'
      });
    }

    if (overdueTasks > 0 && totalTasks > 0) {
      const overdueRate = (overdueTasks / totalTasks) * 100;
      if (overdueRate > 20) {
        risks.push({
          type: 'SCHEDULE',
          severity: overdueRate > 50 ? 'CRITICAL' : 'HIGH',
          description: `${overdueTasks} tasks overdue (${overdueRate.toFixed(1)}% of total)`,
          impact: 'Project momentum and quality at risk',
          mitigation: 'Review task priorities and resource allocation'
        });
      }
    }

    if (teamProductivity < 60) {
      risks.push({
        type: 'RESOURCE',
        severity: teamProductivity < 40 ? 'CRITICAL' : 'MEDIUM',
        description: `Team productivity at ${teamProductivity.toFixed(1)}%`,
        impact: 'Low billable hour ratio affecting profitability',
        mitigation: 'Review team capacity and task allocation'
      });
    }

    return risks;
  }

  private calculateHealthScore(
    completion: number,
    budgetUtilization: number,
    scheduleVariance: number,
    productivity: number,
    satisfaction: number,
    riskCount: number
  ): number {
    let score = 0;

    // Completion percentage (30% weight)
    score += (completion / 100) * 30;

    // Budget performance (25% weight)
    const budgetScore = budgetUtilization <= 100 ? 
      Math.max(0, (100 - Math.abs(budgetUtilization - 80)) / 100) : 
      Math.max(0, (100 - (budgetUtilization - 100)) / 100);
    score += budgetScore * 25;

    // Schedule performance (20% weight)
    const scheduleScore = Math.max(0, (100 - Math.abs(scheduleVariance * 5)) / 100);
    score += scheduleScore * 20;

    // Team productivity (15% weight)
    score += (productivity / 100) * 15;

    // Client satisfaction (10% weight)
    score += ((satisfaction - 1) / 4) * 10;

    // Risk penalty
    score -= riskCount * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: CreateAlertData): Promise<Alert> {
    try {
      const newAlert: Alert = {
        id: `alert_${Date.now()}`,
        type: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.description,
        projectId: alertData.projectId,
        clientId: alertData.clientId,
        resourceId: alertData.resourceId,
        createdAt: new Date(),
        actions: [
          {
            id: 'view_details',
            label: 'View Details',
            action: 'navigate'
          }
        ]
      };
      
      // In real implementation, would save to database
      console.log('Alert created:', newAlert);
      return newAlert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Update an existing alert
   */
  async updateAlert(alertId: string, updates: UpdateAlertData): Promise<Alert | null> {
    try {
      // In real implementation, would fetch existing alert and update it
      const updatedAlert: Alert = {
        id: alertId,
        type: 'PROJECT_RISK', // Would come from existing alert
        severity: updates.severity || 'MEDIUM',
        title: updates.title || 'Updated Alert',
        description: updates.description || 'Alert has been updated',
        createdAt: new Date(), // Would come from existing alert
        resolvedAt: updates.resolvedAt,
        assignedTo: updates.assignedTo,
        actions: [
          {
            id: 'view_details',
            label: 'View Details',
            action: 'navigate'
          }
        ]
      };
      
      // In real implementation, would update in database
      console.log('Alert updated:', updatedAlert);
      return updatedAlert;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  /**
   * Refresh all metrics
   */
  async refreshAllMetrics(): Promise<MetricsRefreshResult> {
    try {
      // In real implementation, would refresh cached metrics
      const projectHealth = await this.getProjectHealth();
      const resourceMetrics = await this.getResourceUtilization();
      const financialSummary = await this.getFinancialSummary();
      const clientSatisfaction = await this.getClientSatisfaction();
      const alerts = await this.getActiveAlerts();
      
      console.log('All metrics refreshed');
      return {
        projectHealth,
        resourceMetrics,
        financialSummary,
        clientSatisfaction,
        alerts,
        refreshedAt: new Date()
      };
    } catch (error) {
      console.error('Error refreshing metrics:', error);
      throw error;
    }
  }
}
