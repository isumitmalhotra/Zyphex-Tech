import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get real invoices from database
    const invoices = await prisma.invoice.findMany({
      where: {
        project: {
          users: {
            some: { id: user.id }
          }
        }
      },
      include: {
        client: true,
        project: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      invoices: invoices,
      stats: {
        total: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.amount, 0),
        paidAmount: invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching billing data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
