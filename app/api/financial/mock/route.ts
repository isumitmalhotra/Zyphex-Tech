import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for financial dashboard
    const mockData = {
      summary: {
        totalInvoices: 127,
        outstandingInvoices: 23,
        overdueInvoices: 5,
        totalRevenue: 285750.50,
        totalExpenses: 67890.25,
        netProfit: 217860.25,
        averageInvoiceValue: 2250.00
      },
      recentInvoices: [
        {
          id: "inv-001",
          invoiceNumber: "INV-2024001",
          amount: 4500.00,
          taxAmount: 450.00,
          total: 4950.00,
          currency: "USD",
          status: "PAID",
          billingType: "FIXED_FEE",
          dueDate: "2024-01-15",
          sentAt: "2024-01-01",
          paidAt: "2024-01-15",
          createdAt: "2024-01-01",
          description: "E-commerce platform development - Phase 1",
          totalPaid: 4950.00,
          remainingBalance: 0,
          isPaid: true,
          client: {
            id: "client-001",
            name: "TechCorp Solutions",
            email: "billing@techcorp.com",
            company: "TechCorp Solutions Inc."
          },
          project: {
            id: "proj-001",
            name: "E-commerce Platform"
          }
        },
        {
          id: "inv-002",
          invoiceNumber: "INV-2024002",
          amount: 3200.00,
          taxAmount: 320.00,
          total: 3520.00,
          currency: "USD",
          status: "PENDING",
          billingType: "HOURLY",
          dueDate: "2024-01-20",
          sentAt: "2024-01-05",
          createdAt: "2024-01-05",
          description: "Mobile app UI/UX design and development",
          totalPaid: 0,
          remainingBalance: 3520.00,
          isPaid: false,
          client: {
            id: "client-002",
            name: "StartupXYZ",
            email: "finance@startupxyz.com",
            company: "StartupXYZ Ltd."
          },
          project: {
            id: "proj-002",
            name: "Mobile App Development"
          }
        },
        {
          id: "inv-003",
          invoiceNumber: "INV-2024003",
          amount: 7500.00,
          taxAmount: 750.00,
          total: 8250.00,
          currency: "USD",
          status: "OVERDUE",
          billingType: "MILESTONE",
          dueDate: "2024-01-10",
          sentAt: "2023-12-20",
          createdAt: "2023-12-20",
          description: "CRM system integration and customization",
          totalPaid: 0,
          remainingBalance: 8250.00,
          isPaid: false,
          client: {
            id: "client-003",
            name: "Enterprise Ltd",
            email: "accounts@enterprise.com",
            company: "Enterprise Ltd."
          },
          project: {
            id: "proj-003",
            name: "CRM System Integration"
          }
        }
      ],
      recentPayments: [
        {
          id: "pay-001",
          amount: 4500.00,
          method: "CREDIT_CARD",
          status: "COMPLETED",
          createdAt: "2024-01-15",
          invoice: {
            id: "inv-001",
            invoiceNumber: "INV-2024001",
            client: {
              id: "client-001",
              name: "TechCorp Solutions"
            }
          }
        },
        {
          id: "pay-002",
          amount: 2800.00,
          method: "BANK_TRANSFER",
          status: "COMPLETED",
          createdAt: "2024-01-12",
          invoice: {
            id: "inv-004",
            invoiceNumber: "INV-2023150",
            client: {
              id: "client-004",
              name: "Global Industries"
            }
          }
        }
      ],
      topClients: [
        {
          client: {
            id: "client-001",
            name: "TechCorp Solutions",
            email: "billing@techcorp.com"
          },
          totalRevenue: 45600.00
        },
        {
          client: {
            id: "client-002",
            name: "StartupXYZ",
            email: "finance@startupxyz.com"
          },
          totalRevenue: 32400.00
        },
        {
          client: {
            id: "client-003",
            name: "Enterprise Ltd",
            email: "accounts@enterprise.com"
          },
          totalRevenue: 28900.00
        }
      ],
      paymentMethods: [
        {
          method: "CREDIT_CARD",
          count: 45,
          total: 125600.00
        },
        {
          method: "BANK_TRANSFER",
          count: 38,
          total: 98750.50
        },
        {
          method: "PAYPAL",
          count: 22,
          total: 61400.00
        }
      ],
      monthlyRevenue: [
        { month: "2023-08", revenue: 38400.00 },
        { month: "2023-09", revenue: 42100.00 },
        { month: "2023-10", revenue: 39800.00 },
        { month: "2023-11", revenue: 47200.00 },
        { month: "2023-12", revenue: 52300.00 },
        { month: "2024-01", revenue: 65950.50 }
      ],
      cashFlow: {
        incoming: 285750.50,
        outgoing: 67890.25,
        net: 217860.25
      }
    }

    return NextResponse.json(mockData)

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Mock invoices data endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { page = 1, limit = 10, status, search } = body

    // Mock invoices data with filtering
    let mockInvoices = [
      {
        id: "inv-001",
        invoiceNumber: "INV-2024001",
        amount: 4500.00,
        taxAmount: 450.00,
        total: 4950.00,
        currency: "USD",
        status: "PAID",
        billingType: "FIXED_FEE",
        dueDate: "2024-01-15",
        sentAt: "2024-01-01",
        paidAt: "2024-01-15",
        createdAt: "2024-01-01",
        description: "E-commerce platform development - Phase 1",
        totalPaid: 4950.00,
        remainingBalance: 0,
        isPaid: true,
        client: {
          id: "client-001",
          name: "TechCorp Solutions",
          email: "billing@techcorp.com",
          company: "TechCorp Solutions Inc."
        },
        project: {
          id: "proj-001",
          name: "E-commerce Platform"
        }
      },
      {
        id: "inv-002",
        invoiceNumber: "INV-2024002",
        amount: 3200.00,
        taxAmount: 320.00,
        total: 3520.00,
        currency: "USD",
        status: "PENDING",
        billingType: "HOURLY",
        dueDate: "2024-01-20",
        sentAt: "2024-01-05",
        createdAt: "2024-01-05",
        description: "Mobile app UI/UX design and development",
        totalPaid: 0,
        remainingBalance: 3520.00,
        isPaid: false,
        client: {
          id: "client-002",
          name: "StartupXYZ",
          email: "finance@startupxyz.com",
          company: "StartupXYZ Ltd."
        },
        project: {
          id: "proj-002",
          name: "Mobile App Development"
        }
      },
      {
        id: "inv-003",
        invoiceNumber: "INV-2024003",
        amount: 7500.00,
        taxAmount: 750.00,
        total: 8250.00,
        currency: "USD",
        status: "OVERDUE",
        billingType: "MILESTONE",
        dueDate: "2024-01-10",
        sentAt: "2023-12-20",
        createdAt: "2023-12-20",
        description: "CRM system integration and customization",
        totalPaid: 0,
        remainingBalance: 8250.00,
        isPaid: false,
        client: {
          id: "client-003",
          name: "Enterprise Ltd",
          email: "accounts@enterprise.com",
          company: "Enterprise Ltd."
        },
        project: {
          id: "proj-003",
          name: "CRM System Integration"
        }
      },
      {
        id: "inv-004",
        invoiceNumber: "INV-2024004",
        amount: 2800.00,
        taxAmount: 280.00,
        total: 3080.00,
        currency: "USD",
        status: "DRAFT",
        billingType: "RETAINER",
        dueDate: "2024-02-01",
        createdAt: "2024-01-18",
        description: "Website redesign consultation",
        totalPaid: 0,
        remainingBalance: 3080.00,
        isPaid: false,
        client: {
          id: "client-004",
          name: "Local Business Co",
          email: "info@localbusiness.com",
          company: "Local Business Co."
        },
        project: {
          id: "proj-004",
          name: "Website Redesign"
        }
      },
      {
        id: "inv-005",
        invoiceNumber: "INV-2024005",
        amount: 5200.00,
        taxAmount: 520.00,
        total: 5720.00,
        currency: "USD",
        status: "SENT",
        billingType: "SUBSCRIPTION",
        dueDate: "2024-01-25",
        sentAt: "2024-01-10",
        createdAt: "2024-01-10",
        description: "Database optimization and performance tuning",
        totalPaid: 0,
        remainingBalance: 5720.00,
        isPaid: false,
        client: {
          id: "client-005",
          name: "DataTech Solutions",
          email: "billing@datatech.com",
          company: "DataTech Solutions Inc."
        },
        project: {
          id: "proj-005",
          name: "Database Optimization"
        }
      }
    ]

    // Apply filters
    if (status && status !== 'ALL') {
      mockInvoices = mockInvoices.filter(inv => inv.status === status)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      mockInvoices = mockInvoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.client.name.toLowerCase().includes(searchLower) ||
        inv.project.name.toLowerCase().includes(searchLower) ||
        inv.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedInvoices = mockInvoices.slice(startIndex, endIndex)

    return NextResponse.json({
      invoices: paginatedInvoices,
      total: mockInvoices.length,
      page,
      limit,
      totalPages: Math.ceil(mockInvoices.length / limit)
    })

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}