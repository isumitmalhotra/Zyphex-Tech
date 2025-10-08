// Report Generation and Caching Service

import { prisma } from '@/lib/prisma'
import { pdfGenerator } from '@/lib/services/pdf-generator'
import type {
  ReportType,
  ReportCategory,
  ReportConfig,
  ReportData,
  ExportOptions,
  ReportFormat
} from '@/types/reports'
import {
  generateProjectStatusReport,
  generateProjectTimelineReport,
  generateTaskCompletionReport,
  generateResourceAllocationReport,
  generateRevenueReport,
  generateProfitabilityReport,
  generateTeamProductivityReport,
  generateInvoiceStatusReport,
  generateClientSatisfactionReport
} from './report-data'
import crypto from 'crypto'

// ============================================================================
// REPORT GENERATION
// ============================================================================

export class ReportService {
  /**
   * Generate report data based on type
   */
  async generateReportData(
    type: ReportType,
    config: ReportConfig
  ): Promise<ReportData> {
    const startTime = Date.now()

    let data: any[] = []
    let summary: any = {}

    try {
      switch (type) {
        case 'PROJECT_STATUS':
          data = await generateProjectStatusReport(config.filters, config.dateRange)
          summary = this.calculateProjectStatusSummary(data)
          break

        case 'PROJECT_TIMELINE':
          if (!config.filters.find(f => f.field === 'projectId')) {
            throw new Error('Project ID required for timeline report')
          }
          const projectId = config.filters.find(f => f.field === 'projectId')!.value
          const timelineData = await generateProjectTimelineReport(projectId)
          data = [timelineData]
          summary = { projectName: timelineData.projectName }
          break

        case 'TASK_COMPLETION':
          const taskData = await generateTaskCompletionReport(config.filters, config.dateRange)
          data = [taskData]
          summary = {
            totalTasks: taskData.totalTasks,
            completionRate: taskData.completionRate,
            averageCompletionTime: taskData.averageCompletionTime
          }
          break

        case 'RESOURCE_ALLOCATION':
          const userId = config.filters.find(f => f.field === 'userId')?.value
          data = await generateResourceAllocationReport(userId)
          summary = this.calculateResourceSummary(data)
          break

        case 'REVENUE_BY_PROJECT':
          const revenueData = await generateRevenueReport(config.dateRange)
          data = [revenueData]
          summary = {
            totalRevenue: revenueData.totalRevenue,
            projectCount: revenueData.revenueByProject.length
          }
          break

        case 'PROFITABILITY_ANALYSIS':
          data = await generateProfitabilityReport(config.filters)
          summary = this.calculateProfitabilitySummary(data)
          break

        case 'TEAM_PRODUCTIVITY':
          const teamId = config.filters.find(f => f.field === 'teamId')?.value
          const productivityData = await generateTeamProductivityReport(teamId, config.dateRange)
          data = [productivityData]
          summary = {
            teamSize: productivityData.teamSize,
            billableRate: productivityData.billableRate
          }
          break

        case 'INVOICE_STATUS':
          const invoiceData = await generateInvoiceStatusReport(config.dateRange)
          data = [invoiceData]
          summary = {
            totalAmount: invoiceData.totalAmount,
            paidAmount: invoiceData.paidAmount,
            unpaidAmount: invoiceData.unpaidAmount
          }
          break

        case 'CLIENT_SATISFACTION':
          const clientId = config.filters.find(f => f.field === 'clientId')?.value
          data = await generateClientSatisfactionReport(clientId)
          summary = this.calculateClientSatisfactionSummary(data)
          break

        default:
          throw new Error(`Unsupported report type: ${type}`)
      }

      const executionTime = Date.now() - startTime

      return {
        summary: {
          totalRecords: Array.isArray(data) ? data.length : 1,
          ...summary
        },
        data,
        metadata: {
          generatedAt: new Date(),
          reportType: type,
          category: this.getCategoryForType(type),
          filters: config.filters,
          recordCount: Array.isArray(data) ? data.length : 1,
          executionTime
        }
      }
    } catch (error) {
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate and save report
   */
  async generateReport(
    name: string,
    type: ReportType,
    config: ReportConfig,
    userId?: string
  ) {
    const reportData = await this.generateReportData(type, config)

    const report = await prisma.report.create({
      data: {
        name,
        type,
        category: this.getCategoryForType(type),
        status: 'COMPLETED',
        templateId: config.templateId,
        config: config as any,
        data: reportData.data as any,
        metadata: reportData.metadata as any,
        generatedAt: new Date(),
        generatedBy: userId,
        generationTime: reportData.metadata.executionTime
      },
      include: {
        template: true
      }
    })

    return report
  }

  /**
   * Cache report data
   */
  async cacheReportData(
    type: ReportType,
    config: ReportConfig,
    data: ReportData,
    ttlMinutes: number = 30
  ) {
    const cacheKey = this.generateCacheKey(type, config)
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    await prisma.reportCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        category: this.getCategoryForType(type),
        type,
        data: data.data as any,
        metadata: data.metadata as any,
        expiresAt,
        hitCount: 0
      },
      update: {
        data: data.data as any,
        metadata: data.metadata as any,
        expiresAt,
        lastAccess: new Date()
      }
    })
  }

  /**
   * Get cached report data
   */
  async getCachedReportData(
    type: ReportType,
    config: ReportConfig
  ): Promise<ReportData | null> {
    const cacheKey = this.generateCacheKey(type, config)

    const cached = await prisma.reportCache.findUnique({
      where: { cacheKey }
    })

    if (!cached || cached.expiresAt < new Date()) {
      return null
    }

    // Update hit count and last access
    await prisma.reportCache.update({
      where: { id: cached.id },
      data: {
        hitCount: { increment: 1 },
        lastAccess: new Date()
      }
    })

    return {
      summary: {
        totalRecords: Array.isArray(cached.data) ? (cached.data as any[]).length : 1
      },
      data: cached.data as any[],
      metadata: cached.metadata as any
    }
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(type: ReportType, config: ReportConfig): string {
    const key = JSON.stringify({
      type,
      filters: config.filters,
      dateRange: config.dateRange,
      groupBy: config.groupBy,
      sortBy: config.sortBy
    })
    return crypto.createHash('md5').update(key).digest('hex')
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    await prisma.reportCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    })
  }

  /**
   * Export report to various formats
   */
  async exportReport(
    reportId: string,
    format: ReportFormat,
    options: ExportOptions = {}
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { template: true }
    })

    if (!report) {
      throw new Error('Report not found')
    }

    const fileName = options.fileName || `${report.name}-${Date.now()}`

    switch (format) {
      case 'PDF':
        return await this.exportToPDF(report, options, fileName)
      
      case 'EXCEL':
        return await this.exportToExcel(report, options, fileName)
      
      case 'CSV':
        return await this.exportToCSV(report, fileName)
      
      case 'JSON':
        return await this.exportToJSON(report, fileName)
      
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Export to PDF
   */
  private async exportToPDF(
    report: any,
    options: ExportOptions,
    fileName: string
  ) {
    const html = this.generateReportHTML(report, options)
    const buffer = await pdfGenerator.generatePDF(html, {
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: options.branding?.headerText ? `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #64748b; margin-top: 10px;">
          ${options.branding.headerText}
        </div>
      ` : '',
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; color: #64748b;">
          <span>${options.branding?.footerText || 'Generated by Zyphex Tech'}</span>
          <span class="pageNumber"></span>
        </div>
      `
    })

    return {
      buffer,
      fileName: `${fileName}.pdf`,
      mimeType: 'application/pdf'
    }
  }

  /**
   * Export to Excel (CSV for now, can be upgraded to XLSX)
   */
  private async exportToExcel(
    report: any,
    _options: ExportOptions,
    fileName: string
  ) {
    // Simple CSV export (can be upgraded to use xlsx library)
    const csv = this.convertToCSV(report.data)
    const buffer = Buffer.from(csv, 'utf-8')

    return {
      buffer,
      fileName: `${fileName}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  }

  /**
   * Export to CSV
   */
  private async exportToCSV(report: any, fileName: string) {
    const csv = this.convertToCSV(report.data)
    const buffer = Buffer.from(csv, 'utf-8')

    return {
      buffer,
      fileName: `${fileName}.csv`,
      mimeType: 'text/csv'
    }
  }

  /**
   * Export to JSON
   */
  private async exportToJSON(report: any, fileName: string) {
    const json = JSON.stringify(report.data, null, 2)
    const buffer = Buffer.from(json, 'utf-8')

    return {
      buffer,
      fileName: `${fileName}.json`,
      mimeType: 'application/json'
    }
  }

  /**
   * Generate HTML for PDF export
   */
  private generateReportHTML(report: any, options: ExportOptions): string {
    const data = report.data as any[]
    const metadata = report.metadata as any
    const branding = options.branding || {}

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1e293b;
    }
    .header {
      background: linear-gradient(135deg, ${branding.colors?.primary || '#3b82f6'} 0%, ${branding.colors?.secondary || '#8b5cf6'} 100%);
      color: white;
      padding: 30px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header .subtitle { font-size: 14px; opacity: 0.9; }
    .summary {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .summary h2 { font-size: 16px; color: #334155; margin-bottom: 15px; }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .metric {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 3px solid ${branding.colors?.accent || '#10b981'};
    }
    .metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .metric-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 5px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover { background: #f8fafc; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 10px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.name}</h1>
    <div class="subtitle">${report.description || ''}</div>
    <div class="subtitle">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
  </div>

  ${options.includeSummary !== false ? `
  <div class="summary">
    <h2>Summary</h2>
    <div class="metric-grid">
      <div class="metric">
        <div class="metric-label">Total Records</div>
        <div class="metric-value">${metadata.recordCount || data.length}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Report Type</div>
        <div class="metric-value">${report.type.replace(/_/g, ' ')}</div>
      </div>
      <div class="metric">
        <div class="metric-label">Generation Time</div>
        <div class="metric-value">${metadata.executionTime || 0}ms</div>
      </div>
    </div>
  </div>
  ` : ''}

  ${options.includeRawData !== false ? this.generateDataTable(data, report.type) : ''}

  <div class="footer">
    ${branding.footerText || 'Generated by Zyphex Tech - Professional Services Automation Platform'}
  </div>
</body>
</html>
    `
  }

  /**
   * Generate data table HTML
   */
  private generateDataTable(data: any[], reportType: string): string {
    if (!data || data.length === 0) {
      return '<p style="text-align:center;padding:40px;color:#64748b;">No data available</p>'
    }

    const firstRow = Array.isArray(data) ? data[0] : data
    const columns = Object.keys(firstRow).filter(key => 
      typeof firstRow[key] !== 'object' || firstRow[key] === null
    )

    const rows = Array.isArray(data) ? data : [data]

    return `
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${columns.map(col => {
                let value = row[col]
                if (typeof value === 'number') {
                  value = value.toLocaleString()
                } else if (value instanceof Date) {
                  value = value.toLocaleDateString()
                } else if (value === null || value === undefined) {
                  value = '-'
                }
                return `<td>${value}</td>`
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  /**
   * Convert data to CSV
   */
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return ''

    const rows = Array.isArray(data) ? data : [data]
    const headers = Object.keys(rows[0]).filter(key => 
      typeof rows[0][key] !== 'object' || rows[0][key] === null
    )

    const csvRows = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value ?? ''
        }).join(',')
      )
    ]

    return csvRows.join('\n')
  }

  /**
   * Helper methods for summaries
   */
  private calculateProjectStatusSummary(data: any[]) {
    return {
      totalProjects: data.length,
      totalBudget: data.reduce((sum, p) => sum + p.budget, 0),
      totalSpent: data.reduce((sum, p) => sum + p.spent, 0),
      averageProgress: data.reduce((sum, p) => sum + p.progress, 0) / data.length
    }
  }

  private calculateResourceSummary(data: any[]) {
    return {
      totalResources: data.length,
      averageUtilization: data.reduce((sum, r) => sum + r.utilizationRate, 0) / data.length,
      totalHours: data.reduce((sum, r) => sum + r.totalHours, 0)
    }
  }

  private calculateProfitabilitySummary(data: any[]) {
    return {
      totalRevenue: data.reduce((sum, p) => sum + p.revenue, 0),
      totalCosts: data.reduce((sum, p) => sum + p.costs, 0),
      totalProfit: data.reduce((sum, p) => sum + p.profit, 0),
      averageMargin: data.reduce((sum, p) => sum + p.margin, 0) / data.length
    }
  }

  private calculateClientSatisfactionSummary(data: any[]) {
    return {
      totalClients: data.length,
      averageRating: data.reduce((sum, c) => sum + c.averageRating, 0) / data.length,
      totalProjects: data.reduce((sum, c) => sum + c.projectsCompleted, 0)
    }
  }

  /**
   * Get category for report type
   */
  private getCategoryForType(type: ReportType): ReportCategory {
    if (type.startsWith('PROJECT_')) return 'PROJECTS'
    if (type.includes('REVENUE') || type.includes('BUDGET') || type.includes('INVOICE') || type.includes('PROFITABILITY')) return 'FINANCIAL'
    if (type.includes('TEAM') || type.includes('INDIVIDUAL') || type.includes('PRODUCTIVITY') || type.includes('WORKLOAD')) return 'TEAM'
    if (type.includes('CLIENT')) return 'CLIENTS'
    if (type.includes('TIME')) return 'TIME'
    return 'CUSTOM'
  }
}

// Singleton instance
export const reportService = new ReportService()
