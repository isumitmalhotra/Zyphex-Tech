import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProfitabilityMetrics {
  projectId: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  costBreakdown: {
    laborCosts: number;
    expenses: number;
    overhead: number;
    materials: number;
  };
  timeBreakdown: {
    totalHours: number;
    billableHours: number;
    utilizationRate: number;
  };
  revenueByPhase: Array<{
    phase: string;
    revenue: number;
    costs: number;
    profit: number;
  }>;
}

export interface ClientLifetimeValue {
  clientId: string;
  totalRevenue: number;
  totalProjects: number;
  averageProjectValue: number;
  retentionRate: number;
  profitMargin: number;
  projectedLTV: number;
  acquisitionCost: number;
  netLTV: number;
  riskScore: number;
  paymentHistory: {
    averagePaymentTime: number;
    onTimePaymentRate: number;
    totalPayments: number;
  };
}

export interface RevenueProjection {
  period: string;
  projectedRevenue: number;
  confirmedRevenue: number;
  pipelineRevenue: number;
  recurringRevenue: number;
  confidence: number;
  factors: {
    historicalGrowth: number;
    pipelineConversion: number;
    seasonality: number;
    marketTrends: number;
  };
}

export interface CashFlowAnalysis {
  period: string;
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  breakdown: {
    invoicePayments: number;
    recurringRevenue: number;
    expenses: number;
    payroll: number;
    overhead: number;
    investments: number;
  };
  projectedBalance: number;
  burnRate: number;
  runwayMonths: number;
}

export interface ExpenseAnalysis {
  totalExpenses: number;
  expensesByCategory: Record<string, number>;
  expensesByProject: Record<string, number>;
  expensesByUser: Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
    change: number;
  }>;
  reimbursementStatus: {
    pending: number;
    processed: number;
    overdue: number;
  };
  averageExpensePerProject: number;
  expenseToRevenueRatio: number;
}

export class FinancialAnalyticsEngine {

  /**
   * Calculate comprehensive project profitability metrics
   */
  async calculateProjectProfitability(projectId: string): Promise<ProfitabilityMetrics> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          tasks: true
          // Remove unsupported includes: timeEntries, expenses, invoices
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get separate related data due to schema limitations
      const timeEntries = await prisma.timeEntry.findMany({
        where: { projectId },
        include: { user: true }
      });

      const invoices = await prisma.invoice.findMany({
        where: { projectId }
      });

      // Calculate total revenue from invoices (approximation since payments relation doesn't exist)
      const totalRevenue = invoices.reduce((sum: number, invoice: unknown) => {
        return sum + ((invoice as Record<string, unknown>).total as number || 0);
      }, 0);

      // Calculate labor costs
      const laborCosts = timeEntries.reduce((sum: number, entry: unknown) => {
        const hourlyRate = ((entry as Record<string, unknown>).user as Record<string, unknown>)?.hourlyRate as number || 100; // Default rate
        return sum + (((entry as Record<string, unknown>).hours as number) * hourlyRate);
      }, 0);

      // Direct expenses placeholder (expense table doesn't exist in current schema)
      const directExpenses = 0;

      // Calculate overhead (30% of labor costs as default)
      const overheadRate = 0.30;
      const overhead = laborCosts * overheadRate;

      // Total costs
      const totalCosts = laborCosts + directExpenses + overhead;

      // Net profit and margin
      const netProfit = totalRevenue - totalCosts;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Time breakdown
      const totalHours = timeEntries.reduce((sum: number, entry: unknown) => sum + ((entry as Record<string, unknown>).hours as number), 0);
      const billableHours = timeEntries
        .filter((entry: unknown) => (entry as Record<string, unknown>).billable as boolean)
        .reduce((sum: number, entry: unknown) => sum + ((entry as Record<string, unknown>).hours as number), 0);
      const utilizationRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

      // Revenue by project phases (if using project phases)
      const revenueByPhase = await this.calculateRevenueByPhase(projectId);

      return {
        projectId,
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        costBreakdown: {
          laborCosts,
          expenses: directExpenses,
          overhead,
          materials: 0 // Can be extended based on expense categories
        },
        timeBreakdown: {
          totalHours,
          billableHours,
          utilizationRate
        },
        revenueByPhase
      };

    } catch (error: unknown) {
      console.error('Project profitability calculation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to calculate project profitability: ${errorMessage}`);
    }
  }

  /**
   * Calculate client lifetime value with comprehensive metrics
   */
  async calculateClientLifetimeValue(clientId: string): Promise<ClientLifetimeValue> {
    try {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: {
          projects: {
            include: {
              invoices: true,
              // Remove timeEntries include as it may not be supported
            }
          },
          invoices: true
          // Remove payments includes as they don't exist in schema
        }
      });

      if (!client) {
        throw new Error('Client not found');
      }

      // Calculate total revenue (approximation using invoice totals since payments don't exist)
      const totalRevenue = (client as Record<string, unknown>).invoices ? 
        ((client as Record<string, unknown>).invoices as unknown[]).reduce((sum: number, invoice: unknown) => {
          return sum + ((invoice as Record<string, unknown>).total as number || 0);
        }, 0) : 0;

      const totalProjects = (client as Record<string, unknown>).projects ? 
        ((client as Record<string, unknown>).projects as unknown[]).length : 0;
      const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;

      // Calculate retention metrics
      const projectDates = client.projects.map(p => p.createdAt).sort();
      const retentionRate = this.calculateRetentionRate(projectDates);

      // Calculate profit margin for this client
      let totalCosts = 0;
      for (const project of client.projects) {
        const profitability = await this.calculateProjectProfitability(project.id);
        totalCosts += profitability.totalCosts;
      }
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

      // Payment history analysis (stubbed since payments don't exist)
      const paymentHistory = {
        averagePaymentTime: 30, // Default estimate
        onTimePaymentRate: 80,  // Default estimate
        totalPayments: (client as Record<string, unknown>).invoices ? 
          ((client as Record<string, unknown>).invoices as unknown[]).length : 0
      };

      // Project lifetime value with growth assumptions
      const averageMonthlyValue = this.calculateAverageMonthlyValue(client.projects);
      const expectedLifetime = 24; // months (can be made dynamic)
      const projectedLTV = averageMonthlyValue * expectedLifetime * (1 + (retentionRate / 100));

      // Acquisition cost (can be tracked separately)
      const acquisitionCost = 500; // Default value, should come from marketing data

      const netLTV = projectedLTV - acquisitionCost;

      // Risk score calculation
      const riskScore = this.calculateClientRiskScore(paymentHistory, profitMargin, retentionRate);

      return {
        clientId,
        totalRevenue,
        totalProjects,
        averageProjectValue,
        retentionRate,
        profitMargin,
        projectedLTV,
        acquisitionCost,
        netLTV,
        riskScore,
        paymentHistory
      };

    } catch (error: unknown) {
      console.error('Client LTV calculation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to calculate client LTV: ${errorMessage}`);
    }
  }

  /**
   * Generate revenue forecasting based on pipeline and historical data
   */
  async generateRevenueForecasting(months: number = 12): Promise<RevenueProjection[]> {
    try {
      const projections: RevenueProjection[] = [];
      const currentDate = new Date();

      for (let i = 0; i < months; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const period = targetDate.toISOString().substring(0, 7); // YYYY-MM format

        // Get confirmed revenue (existing invoices)
        const confirmedRevenue = await this.getConfirmedRevenue(targetDate);

        // Get pipeline revenue (potential projects)
        const pipelineRevenue = await this.getPipelineRevenue(targetDate);

        // Get recurring revenue (retainer clients)
        const recurringRevenue = await this.getRecurringRevenue(targetDate);

        // Calculate historical growth rate
        const historicalGrowth = await this.calculateHistoricalGrowth(targetDate);

        // Pipeline conversion rate
        const pipelineConversion = await this.calculatePipelineConversion();

        // Seasonality factor
        const seasonality = this.calculateSeasonalityFactor(targetDate.getMonth());

        // Market trends (external factors)
        const marketTrends = 1.05; // 5% growth assumption

        // Apply factors to calculate projected revenue
        const baseProjection = confirmedRevenue + (pipelineRevenue * pipelineConversion) + recurringRevenue;
        const projectedRevenue = baseProjection * historicalGrowth * seasonality * marketTrends;

        // Calculate confidence level
        const confidence = this.calculateProjectionConfidence(
          confirmedRevenue,
          pipelineRevenue,
          recurringRevenue,
          i
        );

        projections.push({
          period,
          projectedRevenue,
          confirmedRevenue,
          pipelineRevenue,
          recurringRevenue,
          confidence,
          factors: {
            historicalGrowth,
            pipelineConversion,
            seasonality,
            marketTrends
          }
        });
      }

      return projections;

    } catch (error: unknown) {
      console.error('Revenue forecasting failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate revenue forecasting: ${errorMessage}`);
    }
  }

  /**
   * Analyze cash flow projections and trends
   */
  async analyzeCashFlow(months: number = 12): Promise<CashFlowAnalysis[]> {
    try {
      const analysis: CashFlowAnalysis[] = [];
      const currentDate = new Date();
      let cumulativeCashFlow = await this.getCurrentCashBalance();

      for (let i = 0; i < months; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const period = targetDate.toISOString().substring(0, 7);

        // Calculate cash inflows
        const invoicePayments = await this.getProjectedInvoicePayments(targetDate);
        const recurringRevenue = await this.getRecurringRevenue(targetDate);
        const cashInflow = invoicePayments + recurringRevenue;

        // Calculate cash outflows
        const expenses = await this.getProjectedExpenses(targetDate);
        const payroll = await this.getProjectedPayroll(targetDate);
        const overhead = await this.getProjectedOverhead(targetDate);
        const investments = await this.getProjectedInvestments(targetDate);
        const cashOutflow = expenses + payroll + overhead + investments;

        // Net cash flow
        const netCashFlow = cashInflow - cashOutflow;
        cumulativeCashFlow += netCashFlow;

        // Calculate burn rate and runway
        const burnRate = cashOutflow;
        const runwayMonths = cumulativeCashFlow > 0 ? cumulativeCashFlow / burnRate : 0;

        analysis.push({
          period,
          cashInflow,
          cashOutflow,
          netCashFlow,
          cumulativeCashFlow,
          breakdown: {
            invoicePayments,
            recurringRevenue,
            expenses,
            payroll,
            overhead,
            investments
          },
          projectedBalance: cumulativeCashFlow,
          burnRate,
          runwayMonths
        });
      }

      return analysis;

    } catch (error: unknown) {
      console.error('Cash flow analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to analyze cash flow: ${errorMessage}`);
    }
  }

  /**
   * Comprehensive expense tracking and categorization
   */
  async analyzeExpenses(_startDate: Date, _endDate: Date): Promise<ExpenseAnalysis> {
    // Stub implementation: expense tracking not available in current schema
    return {
      totalExpenses: 0,
      expensesByCategory: {},
      expensesByProject: {},
      expensesByUser: {},
      monthlyTrends: [],
      reimbursementStatus: {
        pending: 0,
        processed: 0,
        overdue: 0
      },
      averageExpensePerProject: 0,
      expenseToRevenueRatio: 0
    };
  }

  /**
   * Generate comprehensive financial dashboard data
   */
  async generateFinancialDashboard() {
    try {
      const currentDate = new Date();
      const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twelveMonthsAgo = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);

      // Get all active projects for profitability analysis
      const activeProjects = await prisma.project.findMany({
        where: {
          status: { in: ['IN_PROGRESS', 'ON_HOLD', 'REVIEW'] }
        }
      });

      const projectProfitability = await Promise.all(
        activeProjects.map(project => this.calculateProjectProfitability(project.id))
      );

      // Get all clients for LTV analysis
      const activeClients = await prisma.client.findMany({
        where: {
          projects: { some: {} }
        }
      });

      const clientLTV = await Promise.all(
        activeClients.slice(0, 10).map(client => this.calculateClientLifetimeValue(client.id))
      );

      // Generate forecasting
      const revenueForecasting = await this.generateRevenueForecasting(6);

      // Cash flow analysis
      const cashFlowAnalysis = await this.analyzeCashFlow(6);

      // Expense analysis
      const expenseAnalysis = await this.analyzeExpenses(thirtyDaysAgo, currentDate);

      // Overall metrics
      const totalRevenue = await this.getTotalRevenue(twelveMonthsAgo, currentDate);
      const totalProfit = projectProfitability.reduce((sum, p) => sum + p.netProfit, 0);
      const averageProfitMargin = projectProfitability.length > 0 
        ? projectProfitability.reduce((sum, p) => sum + p.profitMargin, 0) / projectProfitability.length 
        : 0;

      return {
        overview: {
          totalRevenue,
          totalProfit,
          averageProfitMargin,
          activeProjects: activeProjects.length,
          activeClients: activeClients.length
        },
        projectProfitability,
        clientLTV,
        revenueForecasting,
        cashFlowAnalysis,
        expenseAnalysis,
        generatedAt: currentDate
      };

    } catch (error: unknown) {
      console.error('Financial dashboard generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate financial dashboard: ${errorMessage}`);
    }
  }

  // Helper methods
  private async calculateRevenueByPhase(_projectId: string) {
    // Implementation for revenue by project phases
    return [
      { phase: 'Planning', revenue: 0, costs: 0, profit: 0 },
      { phase: 'Development', revenue: 0, costs: 0, profit: 0 },
      { phase: 'Testing', revenue: 0, costs: 0, profit: 0 },
      { phase: 'Deployment', revenue: 0, costs: 0, profit: 0 }
    ];
  }

  private calculateRetentionRate(projectDates: Date[]): number {
    if (projectDates.length < 2) return 0;
    
    // Simple retention calculation based on project frequency
    const daysBetweenProjects = projectDates.map((date, index) => {
      if (index === 0) return 0;
      return (date.getTime() - projectDates[index - 1].getTime()) / (1000 * 60 * 60 * 24);
    }).filter(days => days > 0);

    const averageDaysBetween = daysBetweenProjects.reduce((sum, days) => sum + days, 0) / daysBetweenProjects.length;
    
    // Convert to retention rate (higher frequency = higher retention)
    return Math.min(100, Math.max(0, 100 - (averageDaysBetween / 30) * 10));
  }

  private analyzePaymentHistory(invoices: Array<{
    id: string;
    createdAt: Date;
    payments: Array<{
      invoiceId: string;
      processedAt: Date | null;
    }>;
  }>) {
    const payments = invoices.flatMap(invoice => invoice.payments);
    
    if (payments.length === 0) {
      return {
        averagePaymentTime: 0,
        onTimePaymentRate: 0,
        totalPayments: 0
      };
    }

    // Calculate average payment time and on-time rate
    let totalPaymentDays = 0;
    let onTimePayments = 0;

    payments.forEach(payment => {
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      if (invoice && payment.processedAt) {
        const paymentDays = Math.ceil((payment.processedAt.getTime() - invoice.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        totalPaymentDays += paymentDays;
        
        if (paymentDays <= 30) { // Consider 30 days as on-time
          onTimePayments++;
        }
      }
    });

    return {
      averagePaymentTime: Math.round(totalPaymentDays / payments.length),
      onTimePaymentRate: Math.round((onTimePayments / payments.length) * 100),
      totalPayments: payments.length
    };
  }

  private calculateAverageMonthlyValue(projects: Array<{
    budget?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }>): number {
    if (projects.length === 0) return 0;

    const totalValue = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalMonths = projects.reduce((sum, project) => {
      if (project.startDate && project.endDate) {
        const months = (project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return sum + Math.max(1, months);
      }
      return sum + 3; // Default 3 months if no dates
    }, 0);

    return totalMonths > 0 ? totalValue / totalMonths : 0;
  }

  private calculateClientRiskScore(paymentHistory: unknown, profitMargin: number, retentionRate: number): number {
    let riskScore = 50; // Start with medium risk

    // Payment history impact
    const history = paymentHistory as Record<string, unknown>;
    if ((history.onTimePaymentRate as number) > 80) riskScore -= 20;
    else if ((history.onTimePaymentRate as number) < 50) riskScore += 30;

    // Profit margin impact
    if (profitMargin > 20) riskScore -= 15;
    else if (profitMargin < 5) riskScore += 25;

    // Retention rate impact
    if (retentionRate > 75) riskScore -= 10;
    else if (retentionRate < 25) riskScore += 20;

    return Math.min(100, Math.max(0, riskScore));
  }

  // Additional helper methods for forecasting and cash flow
  private async getConfirmedRevenue(targetDate: Date): Promise<number> {
    // Get revenue from existing invoices for the target month
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ['SENT', 'PAID'] }
      }
    });

    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }

  private async getPipelineRevenue(_targetDate: Date): Promise<number> {
    // Get potential revenue from pipeline projects
    // This would integrate with your project pipeline/CRM data
    return 0; // Placeholder
  }

  private async getRecurringRevenue(_targetDate: Date): Promise<number> {
    // Get recurring revenue from retainer clients
    // This would integrate with your recurring billing data
    return 0; // Placeholder
  }

  private async calculateHistoricalGrowth(_targetDate: Date): Promise<number> {
    // Calculate growth rate based on historical data
    return 1.1; // 10% growth assumption
  }

  private async calculatePipelineConversion(): Promise<number> {
    // Calculate conversion rate from pipeline to closed deals
    return 0.3; // 30% conversion rate assumption
  }

  private calculateSeasonalityFactor(month: number): number {
    // Adjust for seasonal variations
    const seasonalityFactors = [0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.0, 0.95, 1.05, 1.1, 1.05, 0.8];
    return seasonalityFactors[month] || 1.0;
  }

  private calculateProjectionConfidence(confirmed: number, pipeline: number, recurring: number, monthsOut: number): number {
    const baseConfidence = 100;
    const confirmedWeight = confirmed / (confirmed + pipeline + recurring + 1);
    const timeDecay = Math.max(0.5, 1 - (monthsOut * 0.1));
    
    return Math.round(baseConfidence * confirmedWeight * timeDecay);
  }

  private async getCurrentCashBalance(): Promise<number> {
    // Get current cash balance - would integrate with banking/accounting
    return 100000; // Placeholder
  }

  private async getProjectedInvoicePayments(_targetDate: Date): Promise<number> {
    // Project invoice payments for target month
    return 50000; // Placeholder
  }

  private async getProjectedExpenses(_targetDate: Date): Promise<number> {
    // Project expenses for target month
    return 15000; // Placeholder
  }

  private async getProjectedPayroll(_targetDate: Date): Promise<number> {
    // Project payroll for target month
    return 25000; // Placeholder
  }

  private async getProjectedOverhead(_targetDate: Date): Promise<number> {
    // Project overhead for target month
    return 8000; // Placeholder
  }

  private async getProjectedInvestments(_targetDate: Date): Promise<number> {
    // Project investments for target month
    return 5000; // Placeholder
  }

  private calculateMonthlyExpenseTrends(_expenses: unknown[]) {
    // Stub implementation since expenses are not available
    return [];
  }

  private async getTotalRevenue(_startDate: Date, _endDate: Date): Promise<number> {
    // Stub implementation: payment tracking not available in current schema
    // Use invoice totals as approximation
    const invoices = await prisma.invoice.findMany();
    return invoices.reduce((sum: number, invoice) => sum + (invoice.total || 0), 0);
  }
}

export default FinancialAnalyticsEngine;