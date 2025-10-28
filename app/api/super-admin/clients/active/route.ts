import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch active clients (not soft-deleted) with their related data
    const clients = await prisma.client.findMany({
      where: {
        deletedAt: null
      },
      include: {
        projects: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            name: true,
            status: true,
            budget: true,
            budgetUsed: true,
            startDate: true,
            endDate: true,
            createdAt: true
          }
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
            dueDate: true,
            paidAt: true
          }
        },
        contactLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          select: {
            id: true,
            createdAt: true,
            type: true,
            content: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate client statistics and health metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientsWithStats = clients.map((client: any) => {
      const activeProjects = client.projects.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
      )
      const completedProjects = client.projects.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.status === 'COMPLETED'
      )

      // Calculate total revenue from invoices
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalRevenue = client.invoices.reduce((sum: number, inv: any) => {
        if (inv.status === 'PAID') {
          return sum + (inv.amount || 0)
        }
        return sum
      }, 0)

      // Calculate current project value (active projects budget)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentValue = activeProjects.reduce((sum: number, p: any) => {
        return sum + (p.budget || 0)
      }, 0)

      // Calculate health score based on:
      // - Active projects (20 points per project, max 60)
      // - Payment history (40 points if all paid)
      // - Recent contact (20 points if contacted in last 30 days)
      let healthScore = 0
      
      // Active projects score (max 60)
      healthScore += Math.min(activeProjects.length * 20, 60)
      
      // Payment history score (40 points)
      const paidInvoices = client.invoices.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (inv: any) => inv.status === 'PAID'
      ).length
      const totalInvoices = client.invoices.length
      if (totalInvoices > 0) {
        healthScore += Math.round((paidInvoices / totalInvoices) * 40)
      } else {
        healthScore += 30 // New clients get benefit of doubt
      }
      
      // Recent contact score (20 points)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentContact = client.contactLogs.some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (log: any) => new Date(log.createdAt) > thirtyDaysAgo
      )
      if (recentContact) {
        healthScore += 20
      }

      // Determine health status
      let healthStatus = 'excellent'
      if (healthScore < 50) healthStatus = 'poor'
      else if (healthScore < 70) healthStatus = 'fair'
      else if (healthScore < 85) healthStatus = 'good'

      // Get last contact date (using createdAt from ContactLog)
      const lastContact = client.contactLogs.length > 0 
        ? client.contactLogs[0].createdAt 
        : null

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        website: client.website,
        address: client.address,
        industry: client.company || 'General', // Use company as industry proxy
        status: 'active',
        healthScore,
        healthStatus,
        activeProjects: activeProjects.length,
        completedProjects: completedProjects.length,
        totalProjects: client.projects.length,
        totalRevenue,
        currentValue,
        lastContact,
        contactPerson: client.name, // Client name as contact person
        recentActivity: client.contactLogs.slice(0, 5),
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      }
    })

    // Calculate overall statistics
    const stats = {
      totalClients: clientsWithStats.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      excellentHealth: clientsWithStats.filter((c: any) => c.healthStatus === 'excellent').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      goodHealth: clientsWithStats.filter((c: any) => c.healthStatus === 'good').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fairHealth: clientsWithStats.filter((c: any) => c.healthStatus === 'fair').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      poorHealth: clientsWithStats.filter((c: any) => c.healthStatus === 'poor').length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      avgHealthScore: Math.round(clientsWithStats.reduce((sum: number, c: any) => sum + c.healthScore, 0) / clientsWithStats.length) || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalRevenue: clientsWithStats.reduce((sum: number, c: any) => sum + c.totalRevenue, 0),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      totalActiveProjects: clientsWithStats.reduce((sum: number, c: any) => sum + c.activeProjects, 0)
    }

    return NextResponse.json({
      clients: clientsWithStats,
      stats
    })

  } catch (error) {
    console.error('Error fetching active clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active clients' },
      { status: 500 }
    )
  }
}
