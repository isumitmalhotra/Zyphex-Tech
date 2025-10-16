import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { hasPermission, Permission } from "@/lib/auth/permissions"

const prisma = new PrismaClient()

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    const user = session.user as { id: string; email: string; role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT' | 'SUPER_ADMIN' }
    if (!await hasPermission(user, Permission.VIEW_FINANCIALS)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const skip = (page - 1) * limit

    const where: { invoiceId?: string } = {}
    if (invoiceId) {
      where.invoiceId = invoiceId
    }

    const [payments, total] = await Promise.all([
      // @ts-expect-error - Payment model exists but may not be in type definitions
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              client: {
                select: {
                  name: true,
                  company: true
                }
              }
            }
          }
        }
      }),
      // @ts-expect-error - Payment model count method
      prisma.payment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payments" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    const user = session.user as { id: string; email: string; role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT' | 'SUPER_ADMIN' }
    if (!await hasPermission(user, Permission.MANAGE_BILLING)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      invoiceId, 
      amount, 
      paymentMethod, 
      paymentReference,
      metadata 
    } = body

    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId, amount, paymentMethod" },
        { status: 400 }
      )
    }

    // Get invoice to validate
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // Get completed payments separately
    // @ts-expect-error - Payment model findMany method
    const completedPayments = await prisma.payment.findMany({
      where: { 
        invoiceId,
        status: 'COMPLETED' 
      }
    })

    // Calculate remaining balance
    const totalPaid = completedPayments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)
    const remainingBalance = invoice.total - totalPaid

    if (amount > remainingBalance) {
      return NextResponse.json(
        { error: `Payment amount ${amount} exceeds remaining balance ${remainingBalance}` },
        { status: 400 }
      )
    }

    // Record payment in database
    // @ts-expect-error - Payment model create method
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount,
        // @ts-expect-error - currency field exists in schema
        currency: invoice.currency || 'USD',
        paymentMethod,
        paymentReference: paymentReference || `PAY-${Date.now()}`,
        status: 'COMPLETED',
        processedAt: new Date(),
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      include: {
        invoice: true
      }
    })

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + amount
    if (newTotalPaid >= invoice.total) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment,
      paymentId: payment.id,
      transactionId: payment.paymentReference
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process payment" },
      { status: 500 }
    )
  }
}