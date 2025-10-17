import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  getUserDashboardData,
  getUserTasks,
  getUnreadMessageCount,
  getInvoices,
  getTaskStats,
  getInvoiceStats,
} from "@/lib/db-queries"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API called for user dashboard (OPTIMIZED)')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      console.log('❌ Dashboard: Unauthorized - no session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`✅ Dashboard: Fetching data for user ${session.user.id}`)

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // Default to 30 days
    const periodDays = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // ============================================================================
    // OPTIMIZED: Use query library with minimal field selection and proper indexes
    // ============================================================================
    
    // Fetch user dashboard data with counts (single optimized query)
    const user = await getUserDashboardData(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Fetch dashboard data in parallel with optimized queries
    const [
      { data: tasks },
      unreadMessageCount,
      { data: invoices },
      taskStats,
      invoiceStatsData,
    ] = await Promise.all([
      // Get user's tasks with pagination (uses Task_assigneeId_status_idx)
      getUserTasks(user.id, { page: 1, limit: 20 }),

      // Get unread message count (uses Message_receiverId_readAt_idx)
      getUnreadMessageCount(user.id),

      // Get recent invoices (uses Invoice_clientId_status_idx)
      getInvoices(
        {
          issueDate: { from: startDate },
        },
        { page: 1, limit: 10 }
      ),

      // Get task statistics (optimized aggregation)
      getTaskStats({ assigneeId: user.id }),

      // Get invoice statistics (optimized aggregation)
      getInvoiceStats(),
    ])

    // Calculate comprehensive task statistics from optimized data
    const enhancedTaskStats = {
      total: taskStats.total,
      completed: taskStats.completedCount,
      inProgress: taskStats.byStatus['IN_PROGRESS'] || 0,
      todo: taskStats.byStatus['TODO'] || 0,
      overdue: taskStats.overdueCount,
      highPriority: taskStats.byPriority['HIGH'] || 0,
      dueThisWeek: taskStats.dueThisWeek,
    }

    // Build enhanced invoice statistics
    const enhancedInvoiceStats = {
      total: invoiceStatsData.total,
      totalAmount: invoiceStatsData.totalAmount,
      paidAmount: invoiceStatsData.paidAmount,
      unpaidAmount: invoiceStatsData.unpaidAmount,
      overdue: invoiceStatsData.overdueCount,
      collectionRate: invoiceStatsData.collectionRate,
    }

    // Build activity feed from recent tasks (already fetched)
    const activityFeed = tasks.slice(0, 10).map(task => ({
      type: 'task',
      title: `Task "${task.title}" ${task.status.toLowerCase()}`,
      time: task.createdAt,
      project: task.project?.name,
      icon: task.status === 'COMPLETED' ? 'CheckCircle' : 
            task.status === 'IN_PROGRESS' ? 'Clock' : 'Circle',
      color: task.status === 'COMPLETED' ? 'text-green-400' : 
             task.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-gray-400'
    }))

    // Upcoming deadlines from tasks
    const now = new Date()
    const upcomingDeadlines = tasks
      .filter(t => t.dueDate && new Date(t.dueDate) > now)
      .slice(0, 5)
      .map(t => ({
        type: 'task',
        title: t.title,
        dueDate: t.dueDate,
        project: t.project?.name,
        priority: t.priority,
        daysUntil: Math.ceil(
          (new Date(t.dueDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)

    // Build comprehensive dashboard response
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
      stats: {
        // Project stats from user counts
        projects: {
          active: user._count.projects,
          total: user._count.projects, // Simplified for performance
        },
        // Task stats from optimized queries
        tasks: enhancedTaskStats,
        // Invoice stats from optimized queries
        invoices: enhancedInvoiceStats,
        // Message stats
        messages: {
          unread: unreadMessageCount,
        },
      },
      recentActivity: activityFeed,
      upcomingDeadlines,
      recentTasks: tasks.slice(0, 10).map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        project: task.project,
        assignee: task.assignee,
      })),
      recentInvoices: invoices.slice(0, 5).map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        amount: invoice.amount,
        total: invoice.total,
        dueDate: invoice.dueDate,
        client: invoice.client,
        project: invoice.project,
      })),
    }

    console.log('✅ Dashboard: Data fetched successfully (OPTIMIZED)')
    console.log(`📊 Dashboard: ${enhancedTaskStats.total} tasks, ${unreadMessageCount} unread messages`)

    return NextResponse.json(dashboardData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    })

  } catch (error) {
    console.error('❌ Dashboard API Error:', error)
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
