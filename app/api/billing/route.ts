import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { BillingEngine } from "@/lib/billing/engine"
import { hasPermission, Permission } from "@/lib/auth/permissions"

const billingEngine = new BillingEngine()

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    const user = session.user as { id: string; email: string; role: 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT' | 'SUPER_ADMIN' }
    if (!await hasPermission(user, Permission.CREATE_INVOICE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { projectId, billingType, options } = body

    if (!projectId || !billingType) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, billingType" }, 
        { status: 400 }
      )
    }

    const invoice = await billingEngine.generateInvoice(projectId, billingType, options)

    return NextResponse.json({
      success: true,
      invoice
    })

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate invoice" },
      { status: 500 }
    )
  }
}

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
    const action = searchParams.get('action')
    const projectId = searchParams.get('projectId')

    if (action === 'profitability' && projectId) {
      const metrics = await billingEngine.calculateProjectProfitability(projectId)
      return NextResponse.json({ success: true, metrics })
    }

    if (action === 'recurring') {
      const invoices = await billingEngine.generateRecurringInvoices()
      return NextResponse.json({ success: true, invoices })
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "API request failed" },
      { status: 500 }
    )
  }
}