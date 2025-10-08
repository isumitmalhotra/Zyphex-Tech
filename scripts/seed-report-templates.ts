// Seed script for built-in report templates
// Run with: npx ts-node scripts/seed-report-templates.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const reportTemplates = [
  // PROJECT REPORTS
  {
    name: 'Project Status Summary',
    description: 'Comprehensive overview of all active projects including budget, progress, and team allocation',
    category: 'PROJECTS' as const,
    type: 'PROJECT_STATUS' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'projects',
          type: 'projects',
          fields: ['id', 'name', 'status', 'progress', 'budget', 'spent']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'status-distribution',
          type: 'pie',
          title: 'Projects by Status',
          dataKey: 'status'
        },
        {
          id: 'budget-vs-spent',
          type: 'bar',
          title: 'Budget vs Spent',
          xAxis: 'projectName',
          yAxis: 'amount'
        }
      ]
    },
    layout: {
      sections: [
        { id: 'summary', type: 'summary', title: 'Executive Summary' },
        { id: 'chart1', type: 'chart', chartId: 'status-distribution' },
        { id: 'chart2', type: 'chart', chartId: 'budget-vs-spent' },
        { id: 'table', type: 'table', title: 'Project Details' }
      ]
    }
  },
  {
    name: 'Task Completion Report',
    description: 'Analysis of task completion rates, overdue tasks, and productivity metrics',
    category: 'PROJECTS' as const,
    type: 'TASK_COMPLETION' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'tasks',
          type: 'tasks',
          fields: ['id', 'title', 'status', 'priority', 'dueDate', 'completedAt']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'completion-rate',
          type: 'doughnut',
          title: 'Completion Rate',
          dataKey: 'status'
        },
        {
          id: 'by-priority',
          type: 'bar',
          title: 'Tasks by Priority',
          xAxis: 'priority',
          yAxis: 'count'
        }
      ]
    }
  },
  {
    name: 'Resource Allocation Report',
    description: 'Team member allocation across projects with utilization rates and availability',
    category: 'PROJECTS' as const,
    type: 'RESOURCE_ALLOCATION' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'users',
          type: 'users',
          fields: ['id', 'name', 'role', 'hourlyRate']
        },
        {
          id: 'allocations',
          type: 'custom',
          fields: ['userId', 'projectId', 'hoursPerWeek']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'utilization',
          type: 'bar',
          title: 'Team Utilization',
          xAxis: 'userName',
          yAxis: 'utilizationRate'
        }
      ]
    }
  },

  // FINANCIAL REPORTS
  {
    name: 'Revenue by Project',
    description: 'Revenue breakdown by project and client with trend analysis',
    category: 'FINANCIAL' as const,
    type: 'REVENUE_BY_PROJECT' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'invoices',
          type: 'invoices',
          fields: ['id', 'projectId', 'totalAmount', 'paidAt', 'status']
        }
      ],
      filters: [
        {
          field: 'status',
          operator: 'eq',
          value: 'PAID',
          label: 'Invoice Status',
          type: 'select'
        }
      ],
      charts: [
        {
          id: 'revenue-by-project',
          type: 'bar',
          title: 'Revenue by Project',
          xAxis: 'projectName',
          yAxis: 'revenue'
        },
        {
          id: 'monthly-trend',
          type: 'line',
          title: 'Monthly Revenue Trend',
          xAxis: 'month',
          yAxis: 'revenue'
        }
      ]
    }
  },
  {
    name: 'Profitability Analysis',
    description: 'Project profitability with cost breakdown and margin analysis',
    category: 'FINANCIAL' as const,
    type: 'PROFITABILITY_ANALYSIS' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'projects',
          type: 'projects',
          fields: ['id', 'name', 'budget']
        },
        {
          id: 'expenses',
          type: 'custom',
          fields: ['projectId', 'amount', 'category']
        },
        {
          id: 'revenue',
          type: 'invoices',
          fields: ['projectId', 'totalAmount']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'profit-margin',
          type: 'bar',
          title: 'Profit Margin by Project',
          xAxis: 'projectName',
          yAxis: 'margin'
        }
      ]
    }
  },
  {
    name: 'Invoice Status Report',
    description: 'Invoice payment status, aging analysis, and collection metrics',
    category: 'FINANCIAL' as const,
    type: 'INVOICE_STATUS' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'invoices',
          type: 'invoices',
          fields: ['id', 'invoiceNumber', 'status', 'totalAmount', 'dueDate', 'paidAt']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'by-status',
          type: 'pie',
          title: 'Invoices by Status',
          dataKey: 'status'
        },
        {
          id: 'aging',
          type: 'bar',
          title: 'Invoice Aging',
          xAxis: 'ageGroup',
          yAxis: 'amount'
        }
      ]
    }
  },

  // TEAM REPORTS
  {
    name: 'Team Productivity Report',
    description: 'Team output metrics including billable hours, tasks completed, and efficiency',
    category: 'TEAM' as const,
    type: 'TEAM_PRODUCTIVITY' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'time_entries',
          type: 'time_entries',
          fields: ['userId', 'hours', 'isBillable', 'date']
        },
        {
          id: 'tasks',
          type: 'tasks',
          fields: ['assignedUserId', 'status', 'completedAt']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'billable-rate',
          type: 'doughnut',
          title: 'Billable vs Non-Billable Hours',
          dataKey: 'isBillable'
        },
        {
          id: 'member-productivity',
          type: 'bar',
          title: 'Productivity by Team Member',
          xAxis: 'userName',
          yAxis: 'productivity'
        }
      ]
    }
  },
  {
    name: 'Time Tracking Summary',
    description: 'Detailed time entry analysis with project and task breakdown',
    category: 'TEAM' as const,
    type: 'TIME_TRACKING' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'time_entries',
          type: 'time_entries',
          fields: ['userId', 'projectId', 'taskId', 'hours', 'date', 'description']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'by-project',
          type: 'pie',
          title: 'Hours by Project',
          dataKey: 'projectName'
        },
        {
          id: 'daily-hours',
          type: 'line',
          title: 'Daily Hours Trend',
          xAxis: 'date',
          yAxis: 'hours'
        }
      ]
    }
  },

  // CLIENT REPORTS
  {
    name: 'Client Satisfaction Report',
    description: 'Client feedback, ratings, and service quality metrics',
    category: 'CLIENTS' as const,
    type: 'CLIENT_SATISFACTION' as const,
    isBuiltIn: true,
    config: {
      dataSources: [
        {
          id: 'clients',
          type: 'clients',
          fields: ['id', 'name']
        },
        {
          id: 'projects',
          type: 'projects',
          fields: ['clientId', 'status', 'endDate']
        }
      ],
      filters: [],
      charts: [
        {
          id: 'satisfaction-scores',
          type: 'bar',
          title: 'Satisfaction Scores',
          xAxis: 'clientName',
          yAxis: 'rating'
        }
      ]
    }
  }
]

async function main() {
  console.log('🌱 Seeding report templates...')

  for (const template of reportTemplates) {
    const created = await prisma.reportTemplate.create({
      data: template as any
    })
    console.log(`✅ Created template: ${created.name}`)
  }

  console.log(`🎉 Successfully seeded ${reportTemplates.length} report templates!`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding templates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
