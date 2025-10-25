import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface DateRange {
  startDate: string
  endDate: string
}

interface ReportData {
  reportType: string
  generatedDate: string
  dateRange: DateRange
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      reportType,
      reportName,
      dateRange,
      projectIds,
      teamMemberIds,
      includeSections,
      customBranding,
    } = body

    // Validate report type
    const validReportTypes = ['PROJECT_STATUS', 'TEAM_PERFORMANCE', 'FINANCIAL', 'TIME', 'CLIENT']
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Generate report data based on type
    let reportData: Record<string, unknown> = {}

    switch (reportType) {
      case 'PROJECT_STATUS':
        reportData = await generateProjectStatusReport(projectIds, dateRange)
        break
      case 'TEAM_PERFORMANCE':
        reportData = await generateTeamPerformanceReport(teamMemberIds, dateRange)
        break
      case 'FINANCIAL':
        reportData = await generateFinancialReport(projectIds, dateRange)
        break
      case 'TIME':
        reportData = await generateTimeReport(projectIds, teamMemberIds, dateRange)
        break
      case 'CLIENT':
        reportData = await generateClientReport(projectIds, dateRange)
        break
    }

    // Save generated report to database
    const report = await prisma.report.create({
      data: {
        name: reportName,
        type: reportType,
        dateRange: JSON.stringify(dateRange),
        data: JSON.stringify(reportData),
        sections: JSON.stringify(includeSections || []),
        branding: JSON.stringify(customBranding || {}),
        generatedById: session.user.id,
        generatedAt: new Date(),
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        name: report.name,
        type: report.type,
        data: reportData,
        generatedAt: report.generatedAt,
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// Project Status Report Generator
async function generateProjectStatusReport(projectIds: string[], dateRange: DateRange) {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
    },
    include: {
      tasks: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      milestones: true,
      client: {
        select: { name: true, company: true },
      },
      projectManager: {
        select: { name: true, email: true },
      },
    },
  })

  const reportData = projects.map((project) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(
      (task) => task.status === 'DONE'
    ).length
    const inProgressTasks = project.tasks.filter(
      (task) => task.status === 'IN_PROGRESS'
    ).length
    const blockedTasks = project.tasks.filter(
      (task) => task.status === 'BLOCKED'
    ).length

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return {
      projectId: project.id,
      projectName: project.name,
      client: project.client?.name || project.client?.company || 'N/A',
      projectManager: project.projectManager?.name || 'Unassigned',
      status: project.status,
      progress: Math.round(progress),
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      milestones: project.milestones.map((m) => ({
        name: m.name,
        dueDate: m.dueDate,
        status: m.status,
      })),
      startDate: project.startDate,
      endDate: project.endDate,
    }
  })

  return {
    reportType: 'Project Status Report',
    generatedDate: new Date().toISOString(),
    dateRange,
    projects: reportData,
    summary: {
      totalProjects: projects.length,
      onTrack: reportData.filter((p) => p.progress >= 75).length,
      atRisk: reportData.filter((p) => p.progress >= 50 && p.progress < 75).length,
      delayed: reportData.filter((p) => p.progress < 50).length,
    },
  }
}

// Team Performance Report Generator
async function generateTeamPerformanceReport(teamMemberIds: string[], dateRange: DateRange) {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  const teamMembers = await prisma.user.findMany({
    where: {
      id: { in: teamMemberIds },
    },
    include: {
      assignedTasks: {
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      timeEntries: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
    },
  })

  const performanceData = teamMembers.map((member) => {
    const totalTasks = member.assignedTasks.length
    const completedTasks = member.assignedTasks.filter(
      (task) => task.status === 'DONE'
    ).length
    const totalHours = member.timeEntries.reduce(
      (sum, entry) => sum + entry.hours,
      0
    )
    const billableHours = member.timeEntries
      .filter((entry) => entry.billable)
      .reduce((sum, entry) => sum + entry.hours, 0)

    return {
      userId: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalHours: Math.round(totalHours * 10) / 10,
      billableHours: Math.round(billableHours * 10) / 10,
      productivity: totalHours > 0 ? (completedTasks / totalHours) * 10 : 0,
    }
  })

  return {
    reportType: 'Team Performance Report',
    generatedDate: new Date().toISOString(),
    dateRange,
    teamMembers: performanceData,
    summary: {
      totalMembers: teamMembers.length,
      totalTasksCompleted: performanceData.reduce((sum, m) => sum + m.completedTasks, 0),
      totalHoursLogged: performanceData.reduce((sum, m) => sum + m.totalHours, 0),
      averageCompletionRate:
        performanceData.reduce((sum, m) => sum + m.completionRate, 0) /
        (performanceData.length || 1),
    },
  }
}

// Financial Report Generator
async function generateFinancialReport(projectIds: string[], dateRange: DateRange) {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
    },
    include: {
      tasks: {
        include: {
          timeEntries: {
            where: {
              date: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    },
  })

  const financialData = projects.map((project) => {
    const totalRevenue = project.tasks.reduce((sum, task) => {
      const taskRevenue = task.timeEntries
        .filter((entry) => entry.billable)
        .reduce((entrySum, entry) => entrySum + (entry.amount || 0), 0)
      return sum + taskRevenue
    }, 0)

    const totalHours = project.tasks.reduce((sum, task) => {
      const taskHours = task.timeEntries.reduce(
        (entrySum, entry) => entrySum + entry.hours,
        0
      )
      return sum + taskHours
    }, 0)

    const budget = project.budget || 0
    const budgetUtilization = budget > 0 ? (totalRevenue / budget) * 100 : 0

    return {
      projectId: project.id,
      projectName: project.name,
      budget,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalHours: Math.round(totalHours * 10) / 10,
      budgetUtilization: Math.round(budgetUtilization * 10) / 10,
      profitMargin:
        budget > 0 ? Math.round(((budget - totalRevenue) / budget) * 100) : 0,
    }
  })

  return {
    reportType: 'Financial Report',
    generatedDate: new Date().toISOString(),
    dateRange,
    projects: financialData,
    summary: {
      totalBudget: financialData.reduce((sum, p) => sum + p.budget, 0),
      totalRevenue: financialData.reduce((sum, p) => sum + p.totalRevenue, 0),
      averageBudgetUtilization:
        financialData.reduce((sum, p) => sum + p.budgetUtilization, 0) /
        (financialData.length || 1),
    },
  }
}

// Time Report Generator
async function generateTimeReport(
  projectIds: string[],
  teamMemberIds: string[],
  dateRange: DateRange
) {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(projectIds.length > 0 && {
        task: { projectId: { in: projectIds } },
      }),
      ...(teamMemberIds.length > 0 && {
        userId: { in: teamMemberIds },
      }),
    },
    include: {
      user: { select: { name: true, email: true } },
      task: {
        include: {
          project: { select: { name: true } },
        },
      },
    },
  })

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
  const billableHours = timeEntries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + entry.hours, 0)
  const nonBillableHours = totalHours - billableHours

  const byProject = projectIds.map((projectId) => {
    const projectEntries = timeEntries.filter(
      (entry) => entry.task?.projectId === projectId
    )
    const projectHours = projectEntries.reduce(
      (sum, entry) => sum + entry.hours,
      0
    )
    const projectName = projectEntries[0]?.task?.project?.name || 'Unknown'

    return {
      projectId,
      projectName,
      totalHours: Math.round(projectHours * 10) / 10,
      entries: projectEntries.length,
    }
  })

  return {
    reportType: 'Time Report',
    generatedDate: new Date().toISOString(),
    dateRange,
    summary: {
      totalHours: Math.round(totalHours * 10) / 10,
      billableHours: Math.round(billableHours * 10) / 10,
      nonBillableHours: Math.round(nonBillableHours * 10) / 10,
      billablePercentage: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
    },
    byProject,
    entries: timeEntries.map((entry) => ({
      date: entry.date,
      user: entry.user?.name || 'Unknown',
      project: entry.task?.project?.name || 'Unknown',
      hours: entry.hours,
      billable: entry.billable,
      description: entry.description,
    })),
  }
}

// Client Report Generator
async function generateClientReport(projectIds: string[], dateRange: DateRange) {
  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  const projects = await prisma.project.findMany({
    where: {
      id: { in: projectIds },
    },
    include: {
      client: true,
      tasks: {
        where: {
          updatedAt: { gte: startDate, lte: endDate },
        },
      },
      milestones: true,
    },
  })

  const clientData = projects.map((project) => {
    const completedTasks = project.tasks.filter(
      (task) => task.status === 'DONE'
    ).length
    const upcomingTasks = project.tasks.filter(
      (task) => task.status === 'TODO' || task.status === 'IN_PROGRESS'
    ).length

    const completedMilestones = project.milestones.filter(
      (m) => m.status === 'COMPLETED'
    ).length
    const upcomingMilestones = project.milestones.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'PENDING'
    ).length

    return {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client?.name || project.client?.company || 'N/A',
      status: project.status,
      deliverables: {
        completed: completedTasks,
        upcoming: upcomingTasks,
      },
      milestones: {
        completed: completedMilestones,
        upcoming: upcomingMilestones,
      },
      progress:
        project.tasks.length > 0
          ? Math.round((completedTasks / project.tasks.length) * 100)
          : 0,
    }
  })

  return {
    reportType: 'Client Report',
    generatedDate: new Date().toISOString(),
    dateRange,
    projects: clientData,
    summary: {
      totalProjects: projects.length,
      totalDeliverables: clientData.reduce(
        (sum, p) => sum + p.deliverables.completed + p.deliverables.upcoming,
        0
      ),
      completedDeliverables: clientData.reduce(
        (sum, p) => sum + p.deliverables.completed,
        0
      ),
    },
  }
}
