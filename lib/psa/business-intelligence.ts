import { prisma } from '@/lib/prisma';

// Business Intelligence interfaces
export interface ReportData {
  id: string
  name: string
  type: string
  data: Record<string, unknown>[]
  generatedAt: Date
}

export interface BusinessIntelligenceOptions {
  timeframe?: number;
  projectId?: string;
  clientId?: string;
}

// Project types for business intelligence (Updated to match Prisma types)
interface ProjectWithDetails {
  id: string;
  name: string;
  budget: number | null; // Changed from Decimal to number since we'll convert
  status: string;
  invoices: {
    id: string;
    amount: number; // Will be converted from Decimal
    total?: number; // Optional for backward compatibility
    status: string;
    createdAt: Date;
  }[];
  timeEntries: {
    id: string;
    hours: number; // Will be converted from Decimal
    rate?: number; // Will be converted from Decimal
    billable: boolean;
    date: Date;
    userId: string;
    projectId: string | null;
  }[];
  client: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
}

// Simplified interfaces for report results
interface ProjectProfitabilityReport {
  projectId: string;
  projectName: string;
  clientName: string; // Added this field
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
}

interface ResourceUtilizationReport {
  resourceId: string;
  resourceName: string;
  totalHours: number;
  billableHours: number;
  utilizationRate: number;
  projectCount: number; // Added this field
}

interface ClientPerformanceReport {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  projectCount: number;
  avgProjectValue: number;
  totalValue: number; // Added this field
  acquisitionDate: Date; // Added this field
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  includeHeaders?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// User efficiency tracking interface
interface UserEfficiencyData {
  userId: string;
  userName: string;
  totalHours: number;
  billableHours: number;
  projects: Set<string>;
  efficiency: number;
}

// Client with related data (Updated to match Prisma)
interface _ClientWithDetails {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  invoices: {
    id: string;
    amount: number; // Will be converted from Decimal
    total?: number; // Optional for backward compatibility
    status: string;
    createdAt: Date;
  }[];
  projects: ProjectWithDetails[];
}

// Custom report configuration
interface CustomReportConfig {
  name: string;
  type: string;
  query: string;
  filters: Record<string, unknown>;
  columns: string[];
  parameters?: Record<string, unknown>;
}

// Schedule configuration
interface ScheduleConfig {
  reportType: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'csv' | 'pdf' | 'excel';
  schedule?: string; // Cron expression or schedule string
  parameters?: Record<string, unknown>;
}

export async function generateReport(reportType: string, _params?: Record<string, unknown>): Promise<ReportData> {
  return {
    id: '1',
    name: reportType,
    type: reportType,
    data: [],
    generatedAt: new Date()
  }
}

export async function getAnalytics(_type: string) {
  return {
    revenue: 0,
    projects: 0,
    clients: 0,
    tasks: 0
  }
}

export async function getDashboardMetrics() {
  return {
    totalRevenue: 0,
    activeProjects: 0,
    completedTasks: 0,
    clientSatisfaction: 0
  }
}

export class BusinessIntelligence {
  /**
   * Get project profitability analysis
   */
  async getProjectProfitabilityAnalysis(options: BusinessIntelligenceOptions = {}) {
    try {
      const { timeframe = 30, projectId, clientId } = options;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const projects = await prisma.project.findMany({
        where: {
          AND: [
            projectId ? { id: projectId } : {},
            clientId ? { clientId } : {},
            { createdAt: { gte: startDate } }
          ]
        },
        include: {
          timeEntries: true,
          invoices: true,
          client: true
        }
      });

      return projects.map((project): ProjectProfitabilityReport => {
        const totalRevenue = project.invoices.reduce((sum: number, invoice) => 
          sum + Number(invoice.amount || invoice.total || 0), 0);
        const totalCosts = project.timeEntries.reduce((sum: number, entry) => {
          const rate = Number(entry.rate) || 0;
          const hours = Number(entry.hours) || 0;
          return sum + (rate * hours);
        }, 0);
        
        const profit = totalRevenue - totalCosts;
        const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          clientName: project.client.name,
          revenue: totalRevenue,
          costs: totalCosts,
          profit,
          margin
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get resource efficiency report
   */
  async getResourceEfficiencyReport(options: BusinessIntelligenceOptions = {}) {
    try {
      const { timeframe = 30 } = options;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          date: { gte: startDate }
        },
        include: {
          user: true,
          project: true
        }
      });

      const userEfficiency = timeEntries.reduce((acc: Record<string, UserEfficiencyData>, entry) => {
        const userId = entry.userId;
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: entry.user.name || entry.user.email,
            totalHours: 0,
            billableHours: 0,
            projects: new Set(),
            efficiency: 0
          };
        }

        const hours = Number(entry.hours);
        acc[userId].totalHours += hours;
        if (entry.billable) {
          acc[userId].billableHours += hours;
        }
        acc[userId].projects.add(entry.projectId || '');

        return acc;
      }, {});

      return Object.values(userEfficiency).map((user): ResourceUtilizationReport => ({
        resourceId: user.userId,
        resourceName: user.userName,
        totalHours: user.totalHours,
        billableHours: user.billableHours,
        utilizationRate: user.totalHours > 0 ? (user.billableHours / user.totalHours) * 100 : 0,
        projectCount: user.projects.size
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get client lifetime value analysis
   */
  async getClientLifetimeValueAnalysis(options: BusinessIntelligenceOptions = {}) {
    try {
      const { timeframe = 365, clientId } = options;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const clients = await prisma.client.findMany({
        where: {
          AND: [
            clientId ? { id: clientId } : {},
            { createdAt: { gte: startDate } }
          ]
        },
        include: {
          projects: {
            include: {
              invoices: true,
              timeEntries: true
            }
          },
          invoices: true
        }
      });

      return clients.map((client): ClientPerformanceReport => {
        const totalRevenue = client.invoices.reduce((sum: number, invoice) => 
          sum + Number(invoice.amount || invoice.total || 0), 0);
        const projectRevenue = client.projects.reduce((sum: number, project) => {
          return sum + project.invoices.reduce((pSum: number, invoice) => 
            pSum + Number(invoice.amount || invoice.total || 0), 0);
        }, 0);

        const totalValue = totalRevenue + projectRevenue;
        const projectCount = client.projects.length;
        const averageProjectValue = projectCount > 0 ? totalValue / projectCount : 0;

        return {
          clientId: client.id,
          clientName: client.name,
          totalRevenue: totalValue,
          projectCount,
          avgProjectValue: averageProjectValue,
          totalValue,
          acquisitionDate: client.createdAt
        };
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(options: BusinessIntelligenceOptions = {}) {
    try {
      const { timeframe: _timeframe = 90, projectId } = options;
      
      // Mock predictive analytics - in real implementation, would use ML algorithms
      return {
        projectCompletionPredictions: [
          {
            projectId: projectId || 'project_1',
            predictedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            confidence: 85,
            factors: ['Team velocity', 'Historical data', 'Current progress']
          }
        ],
        revenueForecast: {
          nextMonth: 50000,
          nextQuarter: 150000,
          confidence: 78
        },
        resourceDemand: {
          developers: 3,
          designers: 1,
          projectManagers: 1,
          timeframe: 'next 30 days'
        },
        riskAssessment: {
          budgetRisk: 'LOW',
          scheduleRisk: 'MEDIUM',
          resourceRisk: 'LOW'
        }
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(options: BusinessIntelligenceOptions = {}) {
    try {
      const { timeframe = 30 } = options;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: { gte: startDate }
        }
      });

      const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
      const paidInvoices = invoices.filter(invoice => invoice.status === 'PAID');
      const paidRevenue = paidInvoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);
      const outstandingRevenue = totalRevenue - paidRevenue;

      return {
        totalRevenue,
        paidRevenue,
        outstandingRevenue,
        invoiceCount: invoices.length,
        paidInvoiceCount: paidInvoices.length,
        averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
        collectionRate: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(options: BusinessIntelligenceOptions = {}) {
    try {
      const { timeframe = 30, projectId } = options;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const projects = await prisma.project.findMany({
        where: {
          AND: [
            projectId ? { id: projectId } : {},
            { createdAt: { gte: startDate } }
          ]
        },
        include: {
          tasks: true,
          timeEntries: true
        }
      });

      return {
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
        onTimeProjects: projects.filter(p => 
          p.endDate && new Date(p.endDate) >= new Date()
        ).length,
        averageCompletionRate: projects.reduce((sum, project) => {
          const totalTasks = project.tasks.length;
          const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
          return sum + (totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);
        }, 0) / projects.length || 0,
        totalHoursLogged: projects.reduce((sum, project) => {
          return sum + project.timeEntries.reduce((tSum, entry) => tSum + Number(entry.hours), 0);
        }, 0)
      };
    } catch (error) {
      return {};
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(reportConfig: CustomReportConfig): Promise<ReportData> {
    try {
      return {
        id: `report_${Date.now()}`,
        name: reportConfig.name,
        type: reportConfig.type,
        data: [],
        generatedAt: new Date()
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export data in various formats
   */
  async exportData(reportType: string, format: string, _options: ExportOptions) {
    try {
      // Mock export functionality
      return {
        downloadUrl: `/api/exports/${reportType}.${format}`,
        filename: `${reportType}_${new Date().toISOString().split('T')[0]}.${format}`,
        size: '1.2MB',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Schedule automated report
   */
  async scheduleReport(scheduleConfig: ScheduleConfig) {
    try {
      return {
        id: `schedule_${Date.now()}`,
        reportType: scheduleConfig.reportType,
        schedule: scheduleConfig.schedule,
        recipients: scheduleConfig.recipients,
        nextRun: new Date(),
        isActive: true
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh report cache
   */
  async refreshReportCache() {
    try {
      // Mock cache refresh - Report cache refreshed
    } catch (error) {
      throw error;
    }
  }
}

export class BusinessIntelligenceDashboard {
  static async getProjectProfitabilityAnalysis(_startDate: Date, _endDate: Date) {
    return []
  }
  
  static async getRevenueAnalysis() {
    return { revenue: 0, growth: 0 }
  }
  
  static async getClientAnalysis() {
    return []
  }
}
