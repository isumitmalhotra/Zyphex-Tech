// PSA Core Types and Interfaces

export interface ProjectHealthMetrics {
  projectId: string;
  name: string;
  healthScore: number; // 0-100
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'AT_RISK';
  completionPercentage: number;
  budgetUtilization: number;
  scheduleVariance: number; // Days ahead/behind
  teamProductivity: number;
  clientSatisfaction: number;
  riskFactors: RiskFactor[];
  lastUpdated: Date;
}

export interface RiskFactor {
  type: 'BUDGET' | 'SCHEDULE' | 'RESOURCE' | 'SCOPE' | 'QUALITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  impact: string;
  mitigation?: string;
}

export interface ResourceMetrics {
  totalCapacity: number;
  utilizedCapacity: number;
  utilizationRate: number;
  availableHours: number;
  billableHours: number;
  billableRate: number;
  resourcesByRole: ResourceByRole[];
  capacityWarnings: CapacityWarning[];
  forecastedUtilization: ForecastedUtilization[];
}

export interface ResourceByRole {
  role: string;
  totalResources: number;
  activeResources: number;
  utilization: number;
  averageRate: number;
  productivity: number;
}

export interface CapacityWarning {
  resourceId: string;
  resourceName: string;
  currentUtilization: number;
  projectedOverflow: number;
  affectedProjects: string[];
  recommendedAction: string;
}

export interface ForecastedUtilization {
  date: Date;
  projectedUtilization: number;
  confidence: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  profitMargin: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  projectProfitability: ProjectProfitability[];
  cashFlow: CashFlowData[];
  outstandingInvoices: OutstandingInvoice[];
  revenueByService: RevenueByService[];
}

export interface ProjectProfitability {
  projectId: string;
  projectName: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  budgetVariance: number;
}

export interface CashFlowData {
  date: Date;
  income: number;
  expenses: number;
  netFlow: number;
  cumulativeFlow: number;
}

export interface OutstandingInvoice {
  invoiceId: string;
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  status: 'PENDING' | 'OVERDUE' | 'DISPUTED';
}

export interface RevenueByService {
  service: string;
  revenue: number;
  percentage: number;
  growth: number;
}

export interface ClientMetrics {
  totalClients: number;
  activeClients: number;
  averageSatisfactionScore: number;
  satisfactionTrend: SatisfactionTrend[];
  clientLifetimeValue: ClientLifetimeValue[];
  churnRate: number;
  renewalRate: number;
  upsellOpportunities: UpsellOpportunity[];
}

export interface ClientSatisfactionMetrics {
  overallScore: number;
  npsScore: number;
  satisfactionTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  responseRate: number;
  feedbackCount: number;
  recentFeedback: Array<{
    clientId: string;
    clientName: string;
    score: number;
    comment: string;
    date: Date;
  }>;
  topIssues: Array<{
    category: string;
    frequency: number;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export interface SatisfactionTrend {
  date: Date;
  score: number;
  responseCount: number;
}

export interface ClientLifetimeValue {
  clientId: string;
  clientName: string;
  currentValue: number;
  projectedValue: number;
  acquisitionCost: number;
  profitability: number;
  riskScore: number;
}

export interface UpsellOpportunity {
  clientId: string;
  clientName: string;
  opportunity: string;
  estimatedValue: number;
  probability: number;
  timeline: string;
}

// Workflow Engine Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'CLIENT_ONBOARDING' | 'PROJECT_SETUP' | 'TASK_AUTOMATION' | 'BILLING' | 'REPORTING';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'ACTION' | 'CONDITION' | 'DELAY' | 'APPROVAL' | 'NOTIFICATION';
  action: string;
  parameters: Record<string, any>;
  conditions?: WorkflowCondition[];
  nextStep?: string;
  onSuccess?: string;
  onFailure?: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'SCHEDULE' | 'EVENT' | 'MANUAL' | 'WEBHOOK';
  event?: string;
  schedule?: string; // Cron expression
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'IN';
  value: any;
}

export interface WorkflowVariable {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'OBJECT';
  defaultValue?: any;
  required: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  context: Record<string, any>;
  currentStep?: string;
  logs: WorkflowLog[];
  error?: string;
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  stepId?: string;
  data?: any;
}

// Integration Hub Types
export interface IntegrationEndpoint {
  id: string;
  name: string;
  type: 'WEBHOOK' | 'API' | 'SCHEDULED';
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: IntegrationAuth;
  isActive: boolean;
  lastSync?: Date;
  errorCount: number;
}

export interface IntegrationAuth {
  type: 'NONE' | 'API_KEY' | 'OAUTH' | 'BASIC' | 'BEARER';
  credentials: Record<string, string>;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event: string;
  payload: any;
  timestamp: Date;
  processed: boolean;
  processingLogs?: string[];
}

// Alert System Types
export interface Alert {
  id: string;
  type: 'PROJECT_RISK' | 'DEADLINE_WARNING' | 'BUDGET_OVERRUN' | 'RESOURCE_CONFLICT' | 'CLIENT_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  projectId?: string;
  clientId?: string;
  resourceId?: string;
  createdAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  actions: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
}

// Business Intelligence Types
export interface BIReport {
  id: string;
  name: string;
  category: 'FINANCIAL' | 'OPERATIONAL' | 'STRATEGIC';
  description: string;
  query: string;
  parameters: BIParameter[];
  schedule?: string;
  recipients: string[];
  lastRun?: Date;
  isActive: boolean;
}

export interface BIParameter {
  name: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  label: string;
  defaultValue?: any;
  required: boolean;
}

export interface PredictiveAnalytics {
  projectId: string;
  projectName: string;
  originalEndDate: Date;
  predictedEndDate: Date;
  confidence: number;
  factors: PredictionFactor[];
  recommendations: string[];
}

// PSA Configuration Types
export interface PSAConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  dashboard: {
    autoRefresh: boolean;
    refreshInterval: number;
    alertThresholds: {
      projectHealth: number;
      resourceUtilization: number;
      budgetVariance: number;
    };
  };
  automation: {
    enabled: boolean;
    maxConcurrentWorkflows: number;
    defaultTimeout: number;
    retryAttempts: number;
  };
  integration: {
    webhookTimeout: number;
    maxPayloadSize: number;
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
    };
    monitoringEnabled: boolean;
  };
  businessIntelligence: {
    cacheResults: boolean;
    cacheDuration: number;
    enablePredictiveAnalytics: boolean;
  };
  notifications: {
    enabled: boolean;
    channels: string[];
    escalationRules: AlertRule[];
  };
  security: {
    enableAuditLog: boolean;
    enableEncryption: boolean;
    sessionTimeout: number;
  };
}

// Dashboard Metrics
export interface DashboardMetrics {
  projectHealth: ProjectHealthMetrics;
  resourceMetrics: ResourceMetrics;
  financialSummary: FinancialMetrics;
  clientSatisfaction: ClientSatisfactionMetrics;
  alerts: Alert[];
  systemHealth: SystemHealth;
  lastUpdated: Date;
}

// Alert Rule
export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'EMAIL' | 'SLACK' | 'SMS' | 'WEBHOOK';
  recipients: string[];
  enabled: boolean;
}

// System Health
export interface SystemHealth {
  overall: 'HEALTHY' | 'WARNING' | 'ERROR';
  components: {
    dashboard: 'HEALTHY' | 'WARNING' | 'ERROR';
    automation: 'HEALTHY' | 'WARNING' | 'ERROR';
    integration: 'HEALTHY' | 'WARNING' | 'ERROR';
    businessIntelligence: 'HEALTHY' | 'WARNING' | 'ERROR';
  };
  lastChecked: Date;
  uptime: number;
  version: string;
  error?: string;
}

export interface PredictionFactor {
  factor: string;
  impact: number; // -1 to 1
  weight: number;
  description: string;
}