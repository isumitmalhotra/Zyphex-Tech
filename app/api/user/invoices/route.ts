import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where conditions
    const whereConditions: any = {
      project: {
        users: {
          some: { id: session.user.id }
        }
      }
    }

    if (status) {
      whereConditions.status = status.toUpperCase()
    }

    if (projectId) {
      whereConditions.projectId = projectId
    }

    if (startDate && endDate) {
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereConditions,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            budget: true
          },
          include: {
            users: { 
              select: { 
                id: true, 
                name: true, 
                email: true 
              } 
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            processedAt: true,
            paymentReference: true,
            status: true
          },
          orderBy: { processedAt: 'desc' }
        },
        timeEntries: {
          select: {
            id: true,
            hours: true,
            date: true,
            description: true,
            billable: true
          },
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    })

    // Calculate additional statistics for each invoice
    const invoicesWithStats = invoices.map(invoice => {
      const totalPaid = invoice.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
      const remainingAmount = invoice.total - totalPaid
      const billableHours = invoice.timeEntries
        .filter((entry: any) => entry.billable)
        .reduce((sum: number, entry: any) => sum + parseFloat(entry.hours?.toString() || '0'), 0)
      
      return {
        ...invoice,
        stats: {
          totalPaid: Math.round(totalPaid * 100) / 100,
          remainingAmount: Math.round(remainingAmount * 100) / 100,
          paymentStatus: remainingAmount <= 0 ? 'FULLY_PAID' : 
                        totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
          billableHours: Math.round(billableHours * 100) / 100,
          isOverdue: invoice.dueDate && invoice.status !== 'PAID' 
            ? new Date(invoice.dueDate) < new Date()
            : false,
          daysPastDue: invoice.dueDate && invoice.status !== 'PAID'
            ? Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
            : 0
        }
      }
    })

    // Calculate summary statistics
    const summary = {
      total: invoicesWithStats.length,
      totalAmount: invoicesWithStats.reduce((sum, inv) => sum + inv.amount, 0),
      totalPaid: invoicesWithStats.reduce((sum, inv) => sum + inv.stats.totalPaid, 0),
      totalPending: invoicesWithStats.reduce((sum, inv) => sum + inv.stats.remainingAmount, 0),
      statusBreakdown: {
        draft: invoicesWithStats.filter(inv => inv.status === 'DRAFT').length,
        sent: invoicesWithStats.filter(inv => inv.status === 'SENT').length,
        paid: invoicesWithStats.filter(inv => inv.status === 'PAID').length,
        overdue: invoicesWithStats.filter(inv => inv.stats.isOverdue).length,
        cancelled: invoicesWithStats.filter(inv => inv.status === 'CANCELLED').length
      },
      averageAmount: invoicesWithStats.length > 0 
        ? Math.round((invoicesWithStats.reduce((sum, inv) => sum + inv.amount, 0) / invoicesWithStats.length) * 100) / 100
        : 0
    }

    return NextResponse.json({
      invoices: invoicesWithStats,
      summary
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
