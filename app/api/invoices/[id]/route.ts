import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const invoiceId = params.id

    // Fetch invoice with related data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            address: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            paymentMethod: true,
            paymentReference: true,
            status: true,
            processedAt: true,
            createdAt: true
          },
          orderBy: {
            processedAt: 'desc'
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Authorization check - user must be client owner, admin, or super admin
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const isClientOwner = session.user.id === invoice.client.id

    if (!isAdmin && !isClientOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this invoice' },
        { status: 403 }
      )
    }

    // Calculate totals
    const totalPaid = invoice.payments
      .filter((p: { status: string }) => p.status === 'COMPLETED')
      .reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0)
    
    const remainingBalance = invoice.total - totalPaid

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        totalPaid,
        remainingBalance,
        isPaid: invoice.status === 'PAID'
      }
    })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
