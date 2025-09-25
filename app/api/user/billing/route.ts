import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Invoice {
  id: string
  invoiceNumber: string
  projectId: string
  projectName: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  currency: string
  issueDate: string
  dueDate: string
  paidDate?: string
  description: string
  items: InvoiceItem[]
  taxRate: number
  taxAmount: number
  totalAmount: number
  createdAt: string
  updatedAt: string
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')

    // Mock invoices data
    const allInvoices: Invoice[] = [
      {
        id: '1',
        invoiceNumber: 'INV-2024-001',
        projectId: '1',
        projectName: 'E-commerce Platform Redesign',
        status: 'paid',
        amount: 12500,
        currency: 'USD',
        issueDate: '2024-01-01',
        dueDate: '2024-01-31',
        paidDate: '2024-01-25',
        description: 'Initial development phase - Design system and authentication',
        items: [
          {
            id: '1',
            description: 'UI/UX Design System',
            quantity: 1,
            rate: 5000,
            amount: 5000
          },
          {
            id: '2',
            description: 'Authentication System Development',
            quantity: 1,
            rate: 7500,
            amount: 7500
          }
        ],
        taxRate: 0.08,
        taxAmount: 1000,
        totalAmount: 13500,
        createdAt: '2024-01-01T09:00:00Z',
        updatedAt: '2024-01-25T14:30:00Z'
      },
      {
        id: '2',
        invoiceNumber: 'INV-2024-002',
        projectId: '1',
        projectName: 'E-commerce Platform Redesign',
        status: 'sent',
        amount: 15000,
        currency: 'USD',
        issueDate: '2024-02-01',
        dueDate: '2024-02-28',
        description: 'Second phase - API development and product catalog',
        items: [
          {
            id: '3',
            description: 'Product Catalog API',
            quantity: 1,
            rate: 8000,
            amount: 8000
          },
          {
            id: '4',
            description: 'Payment Integration',
            quantity: 1,
            rate: 7000,
            amount: 7000
          }
        ],
        taxRate: 0.08,
        taxAmount: 1200,
        totalAmount: 16200,
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z'
      },
      {
        id: '3',
        invoiceNumber: 'INV-2024-003',
        projectId: '2',
        projectName: 'Mobile App Development',
        status: 'draft',
        amount: 18000,
        currency: 'USD',
        issueDate: '2024-02-15',
        dueDate: '2024-03-15',
        description: 'Mobile app development - Initial phase',
        items: [
          {
            id: '5',
            description: 'Mobile UI/UX Design',
            quantity: 1,
            rate: 6000,
            amount: 6000
          },
          {
            id: '6',
            description: 'React Native Development Setup',
            quantity: 1,
            rate: 4000,
            amount: 4000
          },
          {
            id: '7',
            description: 'Core Features Development',
            quantity: 1,
            rate: 8000,
            amount: 8000
          }
        ],
        taxRate: 0.08,
        taxAmount: 1440,
        totalAmount: 19440,
        createdAt: '2024-02-15T11:00:00Z',
        updatedAt: '2024-02-15T11:00:00Z'
      },
      {
        id: '4',
        invoiceNumber: 'INV-2024-004',
        projectId: '3',
        projectName: 'Data Analytics Dashboard',
        status: 'paid',
        amount: 8000,
        currency: 'USD',
        issueDate: '2024-01-10',
        dueDate: '2024-01-25',
        paidDate: '2024-01-20',
        description: 'Analytics dashboard development - Complete project',
        items: [
          {
            id: '8',
            description: 'Dashboard Development',
            quantity: 1,
            rate: 5000,
            amount: 5000
          },
          {
            id: '9',
            description: 'Data Integration',
            quantity: 1,
            rate: 3000,
            amount: 3000
          }
        ],
        taxRate: 0.08,
        taxAmount: 640,
        totalAmount: 8640,
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: '2024-01-20T16:45:00Z'
      }
    ]

    // Filter invoices based on query parameters
    let filteredInvoices = allInvoices

    if (status) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status)
    }

    if (projectId) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.projectId === projectId)
    }

    // Calculate billing statistics
    const stats = {
      total: filteredInvoices.length,
      totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      paidAmount: filteredInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingAmount: filteredInvoices
        .filter(inv => inv.status === 'sent')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      overdueAmount: filteredInvoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
      statusBreakdown: {
        draft: filteredInvoices.filter(inv => inv.status === 'draft').length,
        sent: filteredInvoices.filter(inv => inv.status === 'sent').length,
        paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
        overdue: filteredInvoices.filter(inv => inv.status === 'overdue').length,
        cancelled: filteredInvoices.filter(inv => inv.status === 'cancelled').length
      }
    }

    return NextResponse.json({
      success: true,
      invoices: filteredInvoices,
      stats
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      projectId, 
      projectName, 
      description, 
      items, 
      dueDate,
      taxRate = 0.08 
    } = body

    if (!projectId || !projectName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, projectName, items' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const amount = items.reduce((sum: number, item: InvoiceItem) => sum + item.amount, 0)
    const taxAmount = Math.round(amount * taxRate * 100) / 100
    const totalAmount = amount + taxAmount

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`

    // Create new invoice (mock implementation)
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      projectId,
      projectName,
      status: 'draft',
      amount,
      currency: 'USD',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: description || `Invoice for ${projectName}`,
      items: items.map((item: Omit<InvoiceItem, 'id'>, index: number) => ({
        id: (Date.now() + index).toString(),
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      taxRate,
      taxAmount,
      totalAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: newInvoice
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, status, paidDate, ...otherUpdates } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Update invoice (mock implementation)
    const updatedInvoice = {
      id: invoiceId,
      ...otherUpdates,
      status,
      ...(status === 'paid' && paidDate && { paidDate }),
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}