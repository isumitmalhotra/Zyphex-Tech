// Report Data Aggregation Service

import { prisma } from '@/lib/prisma'
import type {
  ProjectStatusReport,
  ProjectTimelineReport,
  TaskCompletionReport,
  ResourceAllocationReport,
  RevenueReport,
  ProfitabilityReport,
  TeamProductivityReport,
  InvoiceStatusReport,
  ClientSatisfactionReport,
  ReportFilter,
  DateRange
} from '@/types/reports'

// ============================================================================
// PROJECT REPORTS
// ============================================================================

export async function generateProjectStatusReport(
  filters: ReportFilter[] = [],
  dateRange?: DateRange
): Promise<ProjectStatusReport[]> {
  const projectFilter: any = { deletedAt: null }
  
  // Apply filters
  filters.forEach(filter => {
    if (filter.field === 'projectId') {
      projectFilter.id = filter.value
    } else if (filter.field === 'clientId') {
      projectFilter.clientId = filter.value
    } else if (filter.field === 'status') {
      projectFilter.status = filter.value
    }
  })

  if (dateRange) {
    projectFilter.startDate = { gte: dateRange.start, lte: dateRange.end }
  }

  const projects = await prisma.project.findMany({
    where: projectFilter,
    include: {
      client: true,
      tasks: {
        where: { deletedAt: null }
      },
      team: {
        include: { members: true }
      },
      budget: true,
      expenses: true,
      risks: {
        where: { status: { not: 'CLOSED' } }
      }
    }
  })

  return projects.map(project => {
    const totalBudget = project.budget?.amount || 0
    const totalSpent = project.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const tasksCompleted = project.tasks.filter(t => t.status === 'COMPLETED').length
    const tasksInProgress = project.tasks.filter(t => t.status === 'IN_PROGRESS').length
    
    const daysRemaining = project.endDate 
      ? Math.ceil((project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client.name,
      status: project.status,
      progress: project.progress,
      budget: totalBudget,
      spent: totalSpent,
      variance: totalBudget - totalSpent,
      tasksTotal: project.tasks.length,
      tasksCompleted,
      tasksInProgress,
      teamSize: project.team?.members.length || 0,
      daysRemaining,
      risks: project.risks.length,
      issues: project.tasks.filter(t => t.priority === 'HIGH' && t.status !== 'COMPLETED').length
    }
  })
}

export async function generateProjectTimelineReport(
  projectId: string
): Promise<ProjectTimelineReport> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: {
        orderBy: { dueDate: 'asc' }
      },
      tasks: {
        where: { deletedAt: null },
        include: { taskListItem: { include: { taskList: true } } }
      }
    }
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Group tasks by phase (task list)
  const phaseMap = new Map<string, { name: string; tasks: any[] }>()
  
  project.tasks.forEach(task => {
    const phaseName = task.taskListItem?.taskList?.name || 'Unassigned'
    if (!phaseMap.has(phaseName)) {
      phaseMap.set(phaseName, { name: phaseName, tasks: [] })
    }
    phaseMap.get(phaseName)!.tasks.push(task)
  })

  const phases = Array.from(phaseMap.values()).map(phase => ({
    name: phase.name,
    progress: phase.tasks.length > 0
      ? Math.round((phase.tasks.filter(t => t.status === 'COMPLETED').length / phase.tasks.length) * 100)
      : 0,
    tasksCompleted: phase.tasks.filter(t => t.status === 'COMPLETED').length,
    tasksTotal: phase.tasks.length
  }))

  return {
    projectId: project.id,
    projectName: project.name,
    startDate: project.startDate,
    endDate: project.endDate,
    milestones: project.milestones.map(m => ({
      name: m.name,
      dueDate: m.dueDate,
      status: m.status,
      completedAt: m.completedAt || undefined
    })),
    phases
  }
}

export async function generateTaskCompletionReport(
  filters: ReportFilter[] = [],
  dateRange?: DateRange
): Promise<TaskCompletionReport> {
  const taskFilter: any = { deletedAt: null }
  
  if (dateRange) {
    taskFilter.OR = [
      { createdAt: { gte: dateRange.start, lte: dateRange.end } },
      { completedAt: { gte: dateRange.start, lte: dateRange.end } }
    ]
  }

  filters.forEach(filter => {
    if (filter.field === 'projectId') {
      taskFilter.projectId = filter.value
    } else if (filter.field === 'assigneeId') {
      taskFilter.assignedUserId = filter.value
    }
  })

  const tasks = await prisma.task.findMany({
    where: taskFilter,
    include: {
      project: true
    }
  })

  const completed = tasks.filter(t => t.status === 'COMPLETED')
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS')
  const notStarted = tasks.filter(t => t.status === 'PENDING')
  const overdue = tasks.filter(t => 
    t.dueDate && t.dueDate < new Date() && t.status !== 'COMPLETED'
  )

  const completionTimes = completed
    .filter(t => t.completedAt && t.createdAt)
    .map(t => (t.completedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0

  // By priority
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  const byPriority = priorities.map(priority => ({
    priority,
    count: tasks.filter(t => t.priority === priority).length,
    completed: completed.filter(t => t.priority === priority).length
  }))

  // By project
  const projectMap = new Map<string, { name: string; total: number; completed: number }>()
  tasks.forEach(task => {
    if (!task.project) return
    if (!projectMap.has(task.projectId)) {
      projectMap.set(task.projectId, {
        name: task.project.name,
        total: 0,
        completed: 0
      })
    }
    const proj = projectMap.get(task.projectId)!
    proj.total++
    if (task.status === 'COMPLETED') proj.completed++
  })

  const byProject = Array.from(projectMap.values()).map(p => ({
    projectName: p.name,
    total: p.total,
    completed: p.completed
  }))

  return {
    period: dateRange 
      ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
      : 'All Time',
    totalTasks: tasks.length,
    completed: completed.length,
    inProgress: inProgress.length,
    notStarted: notStarted.length,
    overdue: overdue.length,
    completionRate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
    averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
    byPriority,
    byProject
  }
}

export async function generateResourceAllocationReport(
  userId?: string
): Promise<ResourceAllocationReport[]> {
  const userFilter: any = { deletedAt: null }
  
  if (userId) {
    userFilter.id = userId
  }

  const users = await prisma.user.findMany({
    where: userFilter,
    include: {
      resourceAllocations: {
        include: {
          project: true
        }
      },
      timeEntries: {
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      }
    }
  })

  return users.map(user => {
    const totalHours = user.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const allocatedHours = user.resourceAllocations.reduce(
      (sum, alloc) => sum + (alloc.hoursPerWeek || 0),
      0
    )
    const availableHours = 40 - allocatedHours // Assuming 40 hour work week
    
    const projectHoursMap = new Map<string, { name: string; hours: number }>()
    user.timeEntries.forEach(entry => {
      if (!entry.projectId) return
      if (!projectHoursMap.has(entry.projectId)) {
        projectHoursMap.set(entry.projectId, { name: '', hours: 0 })
      }
      projectHoursMap.get(entry.projectId)!.hours += entry.hours
    })

    // Add project names
    user.resourceAllocations.forEach(alloc => {
      if (projectHoursMap.has(alloc.projectId)) {
        projectHoursMap.get(alloc.projectId)!.name = alloc.project.name
      }
    })

    const projects = Array.from(projectHoursMap.values()).map(p => ({
      projectName: p.name,
      hours: p.hours,
      percentage: totalHours > 0 ? (p.hours / totalHours) * 100 : 0
    }))

    return {
      userId: user.id,
      userName: user.name || user.email,
      role: user.role,
      totalHours,
      allocatedHours,
      availableHours,
      utilizationRate: allocatedHours > 0 ? (totalHours / allocatedHours) * 100 : 0,
      projects,
      skills: (user.skills as string[]) || []
    }
  })
}

// ============================================================================
// FINANCIAL REPORTS
// ============================================================================

export async function generateRevenueReport(
  dateRange?: DateRange
): Promise<RevenueReport> {
  const invoiceFilter: any = { status: 'PAID' }
  
  if (dateRange) {
    invoiceFilter.paidAt = { gte: dateRange.start, lte: dateRange.end }
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceFilter,
    include: {
      project: { include: { client: true } },
      client: true
    }
  })

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  // Revenue by project
  const projectMap = new Map<string, { name: string; clientName: string; revenue: number }>()
  invoices.forEach(inv => {
    if (!inv.project) return
    if (!projectMap.has(inv.projectId!)) {
      projectMap.set(inv.projectId!, {
        name: inv.project.name,
        clientName: inv.project.client.name,
        revenue: 0
      })
    }
    projectMap.get(inv.projectId!)!.revenue += inv.totalAmount
  })

  const revenueByProject = Array.from(projectMap.values())
    .map(p => ({
      projectName: p.name,
      clientName: p.clientName,
      revenue: p.revenue,
      percentage: (p.revenue / totalRevenue) * 100
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Revenue by client
  const clientMap = new Map<string, { name: string; revenue: number; projectCount: number }>()
  invoices.forEach(inv => {
    const clientId = inv.clientId
    const clientName = inv.client.name
    
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: clientName, revenue: 0, projectCount: 0 })
    }
    const client = clientMap.get(clientId)!
    client.revenue += inv.totalAmount
    if (inv.projectId && !projectMap.has(inv.projectId)) {
      client.projectCount++
    }
  })

  const revenueByClient = Array.from(clientMap.values())
    .map(c => ({
      clientName: c.name,
      revenue: c.revenue,
      projectCount: c.projectCount
    }))
    .sort((a, b) => b.revenue - a.revenue)

  // Monthly trend (last 12 months)
  const monthlyMap = new Map<string, number>()
  invoices.forEach(inv => {
    if (!inv.paidAt) return
    const monthKey = inv.paidAt.toISOString().substring(0, 7) // YYYY-MM
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + inv.totalAmount)
  })

  const sortedMonths = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const monthlyTrend = sortedMonths.map((entry, index) => {
    const prevRevenue = index > 0 ? sortedMonths[index - 1][1] : entry[1]
    const growth = prevRevenue > 0 ? ((entry[1] - prevRevenue) / prevRevenue) * 100 : 0
    
    return {
      month: entry[0],
      revenue: entry[1],
      growth
    }
  })

  return {
    period: dateRange 
      ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
      : 'All Time',
    totalRevenue,
    revenueByProject,
    revenueByClient,
    monthlyTrend
  }
}

export async function generateProfitabilityReport(
  filters: ReportFilter[] = []
): Promise<ProfitabilityReport[]> {
  const projectFilter: any = { deletedAt: null }
  
  filters.forEach(filter => {
    if (filter.field === 'projectId') {
      projectFilter.id = filter.value
    } else if (filter.field === 'clientId') {
      projectFilter.clientId = filter.value
    }
  })

  const projects = await prisma.project.findMany({
    where: projectFilter,
    include: {
      client: true,
      invoices: { where: { status: 'PAID' } },
      expenses: true,
      timeEntries: true,
      budget: true
    }
  })

  return projects.map(project => {
    const revenue = project.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const directCosts = project.expenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    // Calculate labor costs from time entries
    const laborCosts = project.timeEntries.reduce((sum, entry) => {
      const hourlyRate = entry.hourlyRate || 50 // Default rate
      return sum + (entry.hours * hourlyRate)
    }, 0)
    
    const totalCosts = directCosts + laborCosts
    const profit = revenue - totalCosts
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0
    
    const budgetedRevenue = project.budget?.amount || 0
    const budgetedProfit = budgetedRevenue - totalCosts
    const variance = profit - budgetedProfit

    return {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client.name,
      revenue,
      costs: totalCosts,
      profit,
      margin,
      budgetedProfit,
      variance
    }
  })
}

// ============================================================================
// TEAM REPORTS
// ============================================================================

export async function generateTeamProductivityReport(
  teamId?: string,
  dateRange?: DateRange
): Promise<TeamProductivityReport> {
  const timeFilter: any = {}
  
  if (dateRange) {
    timeFilter.createdAt = { gte: dateRange.start, lte: dateRange.end }
  }

  const taskFilter: any = { deletedAt: null }
  if (dateRange) {
    taskFilter.completedAt = { gte: dateRange.start, lte: dateRange.end }
  }

  const userFilter: any = { deletedAt: null }
  if (teamId) {
    userFilter.teamMemberships = {
      some: { teamId }
    }
  }

  const users = await prisma.user.findMany({
    where: userFilter,
    include: {
      timeEntries: { where: timeFilter },
      assignedTasks: { where: taskFilter }
    }
  })

  const totalHours = users.reduce((sum, user) => 
    sum + user.timeEntries.reduce((s, entry) => s + entry.hours, 0), 0
  )
  
  const billableHours = users.reduce((sum, user) =>
    sum + user.timeEntries.filter(e => e.isBillable).reduce((s, e) => s + e.hours, 0), 0
  )
  
  const tasksCompleted = users.reduce((sum, user) =>
    sum + user.assignedTasks.filter(t => t.status === 'COMPLETED').length, 0
  )

  const members = users.map(user => {
    const hoursWorked = user.timeEntries.reduce((sum, entry) => sum + entry.hours, 0)
    const completed = user.assignedTasks.filter(t => t.status === 'COMPLETED').length
    
    return {
      name: user.name || user.email,
      hoursWorked,
      tasksCompleted: completed,
      productivity: hoursWorked > 0 ? completed / hoursWorked : 0
    }
  })

  const completedTasks = users.flatMap(u => u.assignedTasks.filter(t => t.status === 'COMPLETED'))
  const avgTaskTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, task) => {
        const timeEntries = users.flatMap(u => u.timeEntries.filter(e => e.taskId === task.id))
        return sum + timeEntries.reduce((s, e) => s + e.hours, 0)
      }, 0) / completedTasks.length
    : 0

  return {
    period: dateRange 
      ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
      : 'All Time',
    teamSize: users.length,
    totalHours,
    billableHours,
    billableRate: totalHours > 0 ? (billableHours / totalHours) * 100 : 0,
    tasksCompleted,
    averageTaskTime: Math.round(avgTaskTime * 10) / 10,
    members
  }
}

// ============================================================================
// CLIENT REPORTS
// ============================================================================

export async function generateInvoiceStatusReport(
  dateRange?: DateRange
): Promise<InvoiceStatusReport> {
  const invoiceFilter: any = {}
  
  if (dateRange) {
    invoiceFilter.createdAt = { gte: dateRange.start, lte: dateRange.end }
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceFilter,
    include: { client: true }
  })

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidAmount = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)
  
  const unpaidAmount = totalAmount - paidAmount
  const overdueAmount = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.totalAmount, 0)

  // By status
  const statuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']
  const byStatus = statuses.map(status => ({
    status,
    count: invoices.filter(inv => inv.status === status).length,
    amount: invoices.filter(inv => inv.status === status).reduce((sum, inv) => sum + inv.totalAmount, 0)
  }))

  // By client
  const clientMap = new Map<string, { name: string; invoices: number; amount: number; paid: number }>()
  invoices.forEach(inv => {
    if (!clientMap.has(inv.clientId)) {
      clientMap.set(inv.clientId, {
        name: inv.client.name,
        invoices: 0,
        amount: 0,
        paid: 0
      })
    }
    const client = clientMap.get(inv.clientId)!
    client.invoices++
    client.amount += inv.totalAmount
    if (inv.status === 'PAID') {
      client.paid += inv.totalAmount
    }
  })

  const byClient = Array.from(clientMap.values())

  return {
    period: dateRange 
      ? `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`
      : 'All Time',
    totalInvoices: invoices.length,
    totalAmount,
    paidAmount,
    unpaidAmount,
    overdueAmount,
    byStatus,
    byClient
  }
}

export async function generateClientSatisfactionReport(
  clientId?: string
): Promise<ClientSatisfactionReport[]> {
  const clientFilter: any = { deletedAt: null }
  
  if (clientId) {
    clientFilter.id = clientId
  }

  const clients = await prisma.client.findMany({
    where: clientFilter,
    include: {
      projects: {
        where: { deletedAt: null, status: 'COMPLETED' },
        include: {
          milestones: true,
          budget: true,
          expenses: true
        }
      },
      contactLogs: {
        orderBy: { contactDate: 'desc' },
        take: 10
      }
    }
  })

  return clients.map(client => {
    const projectsCompleted = client.projects.length
    
    // Calculate on-time delivery
    const onTimeProjects = client.projects.filter(p => 
      p.endDate && p.actualEndDate && p.actualEndDate <= p.endDate
    ).length
    const onTimeDelivery = projectsCompleted > 0 ? (onTimeProjects / projectsCompleted) * 100 : 0

    // Calculate budget adherence
    const projectsWithBudget = client.projects.filter(p => p.budget)
    const withinBudget = projectsWithBudget.filter(p => {
      const spent = p.expenses.reduce((sum, exp) => sum + exp.amount, 0)
      return p.budget && spent <= p.budget.amount
    }).length
    const budgetAdherence = projectsWithBudget.length > 0 
      ? (withinBudget / projectsWithBudget.length) * 100 
      : 0

    // Mock ratings (would come from feedback system)
    const averageRating = 4.5
    const communicationScore = 4.7
    const deliveryScore = 4.3
    const qualityScore = 4.6

    const feedback = client.contactLogs.slice(0, 5).map(log => ({
      date: log.contactDate,
      project: 'Project Name', // Would need project relation
      rating: 4.5,
      comments: log.notes || ''
    }))

    return {
      clientId: client.id,
      clientName: client.name,
      projectsCompleted,
      averageRating,
      communicationScore,
      deliveryScore,
      qualityScore,
      onTimeDelivery,
      budgetAdherence,
      feedback
    }
  })
}
