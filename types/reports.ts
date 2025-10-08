// Report Types and Interfaces

import { 
  ReportType, 
  ReportCategory, 
  ReportFormat, 
  ReportStatus, 
  ReportFrequency,
  ReportTemplate,
  Report,
  ReportSchedule,
  ReportCache
} from '@prisma/client'

// ============================================================================
// REPORT TEMPLATE TYPES
// ============================================================================

export interface ReportTemplateConfig {
  dataSources: DataSource[]
  filters: FilterConfig[]
  groupBy?: string[]
  orderBy?: OrderByConfig[]
  charts?: ChartConfig[]
  formatting?: FormattingOptions
}

export interface DataSource {
  id: string
  type: 'projects' | 'invoices' | 'time_entries' | 'tasks' | 'users' | 'clients' | 'custom'
  fields: string[]
  joins?: JoinConfig[]
  aggregations?: AggregationConfig[]
}

export interface JoinConfig {
  table: string
  type: 'inner' | 'left' | 'right'
  on: string
}

export interface AggregationConfig {
  field: string
  function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'group_concat'
  alias: string
}

export interface FilterConfig {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'between'
  value: any
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect'
  options?: { label: string; value: any }[]
}

export interface OrderByConfig {
  field: string
  direction: 'asc' | 'desc'
}

export interface ChartConfig {
  id: string
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'table'
  title: string
  dataKey: string
  xAxis?: string
  yAxis?: string
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
}

export interface FormattingOptions {
  currency?: string
  dateFormat?: string
  numberFormat?: string
  decimalPlaces?: number
  showTotals?: boolean
  showSubtotals?: boolean
}

export interface ReportLayout {
  sections: ReportSection[]
  header?: HeaderConfig
  footer?: FooterConfig
  pageSettings?: PageSettings
}

export interface ReportSection {
  id: string
  type: 'header' | 'summary' | 'chart' | 'table' | 'text' | 'image'
  title?: string
  content?: any
  chartId?: string
  columns?: ColumnConfig[]
  style?: SectionStyle
}

export interface ColumnConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'currency' | 'date' | 'percentage' | 'boolean'
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: string
}

export interface SectionStyle {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  padding?: string
  margin?: string
  fontSize?: string
}

export interface HeaderConfig {
  logo?: string
  companyName?: string
  title?: string
  subtitle?: string
  showDate?: boolean
  customFields?: { label: string; value: string }[]
}

export interface FooterConfig {
  showPageNumbers?: boolean
  text?: string
  showGeneratedDate?: boolean
  customFields?: { label: string; value: string }[]
}

export interface PageSettings {
  size: 'A4' | 'Letter' | 'Legal'
  orientation: 'portrait' | 'landscape'
  margin: { top: string; right: string; bottom: string; left: string }
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface ReportConfig {
  templateId?: string
  filters: ReportFilter[]
  dateRange?: DateRange
  groupBy?: string[]
  sortBy?: { field: string; direction: 'asc' | 'desc' }[]
  limit?: number
  includeSummary?: boolean
  includeCharts?: boolean
}

export interface ReportFilter {
  field: string
  operator: string
  value: any
}

export interface DateRange {
  start: Date
  end: Date
}

export interface ReportData {
  summary: ReportSummary
  data: any[]
  charts?: ChartData[]
  tables?: TableData[]
  metadata: ReportMetadata
}

export interface ReportSummary {
  totalRecords: number
  totals?: Record<string, number>
  averages?: Record<string, number>
  counts?: Record<string, number>
  keyMetrics?: KeyMetric[]
}

export interface KeyMetric {
  label: string
  value: number | string
  format: 'number' | 'currency' | 'percentage'
  change?: number // Percentage change from previous period
  trend?: 'up' | 'down' | 'stable'
}

export interface ChartData {
  id: string
  type: string
  title: string
  data: any[]
  labels: string[]
  datasets: Dataset[]
}

export interface Dataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
}

export interface TableData {
  id: string
  title: string
  columns: ColumnConfig[]
  rows: any[]
  totals?: Record<string, number>
}

export interface ReportMetadata {
  generatedAt: Date
  generatedBy?: string
  reportType: ReportType
  category: ReportCategory
  filters: ReportFilter[]
  recordCount: number
  executionTime?: number
}

// ============================================================================
// REPORT SCHEDULE TYPES
// ============================================================================

export interface ScheduleConfig {
  frequency: ReportFrequency
  cronExpression?: string
  timezone?: string
  startDate?: Date
  endDate?: Date
}

export interface DeliverySettings {
  format: ReportFormat
  recipients: string[]
  subject?: string
  body?: string
  attachmentName?: string
}

export interface ScheduleExecution {
  scheduleId: string
  executedAt: Date
  status: 'success' | 'failed'
  error?: string
  reportId?: string
  deliveredTo?: string[]
}

// ============================================================================
// PRE-BUILT REPORT TYPES
// ============================================================================

export interface ProjectStatusReport {
  projectId: string
  projectName: string
  clientName: string
  status: string
  progress: number
  budget: number
  spent: number
  variance: number
  tasksTotal: number
  tasksCompleted: number
  tasksInProgress: number
  teamSize: number
  daysRemaining: number
  risks: number
  issues: number
}

export interface ProjectTimelineReport {
  projectId: string
  projectName: string
  startDate: Date
  endDate: Date
  milestones: {
    name: string
    dueDate: Date
    status: string
    completionDate?: Date
  }[]
  phases: {
    name: string
    progress: number
    tasksCompleted: number
    tasksTotal: number
  }[]
}

export interface TaskCompletionReport {
  period: string
  totalTasks: number
  completed: number
  inProgress: number
  notStarted: number
  overdue: number
  completionRate: number
  averageCompletionTime: number
  byPriority: { priority: string; count: number; completed: number }[]
  byProject: { projectName: string; total: number; completed: number }[]
}

export interface ResourceAllocationReport {
  userId: string
  userName: string
  role: string
  totalHours: number
  allocatedHours: number
  availableHours: number
  utilizationRate: number
  projects: {
    projectName: string
    hours: number
    percentage: number
  }[]
  skills: string[]
}

export interface RevenueReport {
  period: string
  totalRevenue: number
  revenueByProject: {
    projectName: string
    clientName: string
    revenue: number
    percentage: number
  }[]
  revenueByClient: {
    clientName: string
    revenue: number
    projectCount: number
  }[]
  monthlyTrend: {
    month: string
    revenue: number
    growth: number
  }[]
}

export interface ProfitabilityReport {
  projectId: string
  projectName: string
  clientName: string
  revenue: number
  costs: number
  profit: number
  margin: number
  budgetedProfit: number
  variance: number
}

export interface TeamProductivityReport {
  period: string
  teamSize: number
  totalHours: number
  billableHours: number
  billableRate: number
  tasksCompleted: number
  averageTaskTime: number
  members: {
    name: string
    hoursWorked: number
    tasksCompleted: number
    productivity: number
  }[]
}

export interface InvoiceStatusReport {
  period: string
  totalInvoices: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
  overdueAmount: number
  byStatus: {
    status: string
    count: number
    amount: number
  }[]
  byClient: {
    clientName: string
    invoices: number
    amount: number
    paid: number
  }[]
}

export interface ClientSatisfactionReport {
  clientId: string
  clientName: string
  projectsCompleted: number
  averageRating: number
  communicationScore: number
  deliveryScore: number
  qualityScore: number
  onTimeDelivery: number
  budgetAdherence: number
  feedback: {
    date: Date
    project: string
    rating: number
    comments: string
  }[]
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  format: ReportFormat
  includeCharts?: boolean
  includeSummary?: boolean
  includeRawData?: boolean
  branding?: BrandingOptions
  fileName?: string
}

export interface BrandingOptions {
  logo?: string
  companyName?: string
  colors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  headerText?: string
  footerText?: string
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

export interface ReportFormData {
  name: string
  description?: string
  category: ReportCategory
  type: ReportType
  templateId?: string
  filters: ReportFilter[]
  dateRange?: DateRange
  format?: ReportFormat
}

export interface ScheduleFormData {
  name: string
  description?: string
  templateId: string
  frequency: ReportFrequency
  cronExpression?: string
  timezone?: string
  format: ReportFormat
  recipients: string[]
  subject?: string
  body?: string
  config: ReportConfig
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ReportListResponse {
  reports: (Report & { template?: ReportTemplate })[]
  total: number
  page: number
  pageSize: number
}

export interface TemplateListResponse {
  templates: ReportTemplate[]
  total: number
  categories: { category: ReportCategory; count: number }[]
}

export interface ScheduleListResponse {
  schedules: (ReportSchedule & { template: ReportTemplate })[]
  total: number
  active: number
  inactive: number
}

export interface ReportGenerationResponse {
  reportId: string
  status: ReportStatus
  message: string
  estimatedTime?: number
}

export interface ReportExportResponse {
  downloadUrl: string
  fileName: string
  fileSize: number
  expiresAt: Date
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

export type ReportWithRelations = Report & {
  template?: ReportTemplate
  schedule?: ReportSchedule & {
    template: ReportTemplate
  }
}

export type ReportTemplateWithStats = ReportTemplate & {
  _count?: {
    reports: number
    schedules: number
  }
}

export type ReportScheduleWithTemplate = ReportSchedule & {
  template: ReportTemplate
  _count?: {
    reports: number
  }
}

// Export all Prisma types
export type {
  ReportType,
  ReportCategory,
  ReportFormat,
  ReportStatus,
  ReportFrequency,
  ReportTemplate,
  Report,
  ReportSchedule,
  ReportCache
}
