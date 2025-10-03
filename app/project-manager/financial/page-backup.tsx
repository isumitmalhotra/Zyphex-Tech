"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface FinancialSummary {
  totalInvoices: number
  outstandingInvoices: number
  overdueInvoices: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  averageInvoiceValue: number
}

interface RecentInvoice {
  id: string
  invoiceNumber: string
  amount: number
  total: number
  status: string
  dueDate: string
  createdAt: string
  description?: string
  client: {
    id: string
    name: string
    email: string
    company?: string
  }
  project?: {
    id: string
    name: string
  }
}

interface FinancialData {
  summary: FinancialSummary
  recentInvoices: RecentInvoice[]
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
  topClients: Array<{
    client: {
      id: string
      name: string
      email: string
    }
    totalRevenue: number
  }>
  paymentMethods: Array<{
    method: string
    count: number
    total: number
  }>
  cashFlow: {
    incoming: number
    outgoing: number
    net: number
  }
}

export default function ProjectManagerFinancialPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/financial/mock?period=${period}`)
        const result = await response.json()

        if (result.summary) {
          setFinancialData(result)
          setError(null)
        } else {
          setError(result.error || 'Failed to load financial data')
        }
      } catch (err) {
        setError('Failed to load financial data')
        console.error('Financial data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [period])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'sent':
        return 'text-blue-600 bg-blue-100'
      case 'overdue':
        return 'text-red-600 bg-red-100'
      case 'draft':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold zyphex-heading">Financial Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700/50">
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-24 mb-2"></div>
                <div className="h-8 bg-slate-600 rounded w-16"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">Financial Management</h1>
              <p className="zyphex-subheading mt-2">
                Track revenue, manage invoices, and monitor financial performance
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <Button className="zyphex-button" asChild>
                <Link href="/project-manager/financial/invoices/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Link>
              </Button>
            </div>
          </div>

          {error && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {financialData && (
            <>
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(financialData.summary.totalRevenue)}
                    </div>
                    <p className="text-xs text-slate-400">
                      From {financialData.summary.totalInvoices - financialData.summary.outstandingInvoices} paid invoices
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Profit Margin
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {((financialData.summary.netProfit / financialData.summary.totalRevenue) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(financialData.summary.netProfit)} profit
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Collection Rate
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {(((financialData.summary.totalInvoices - financialData.summary.outstandingInvoices) / financialData.summary.totalInvoices) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-400">
                      {financialData.summary.totalInvoices - financialData.summary.outstandingInvoices} of {financialData.summary.totalInvoices} invoices
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">
                      Overdue Invoices
                    </CardTitle>
                    <Clock className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {financialData.summary.overdueInvoices}
                    </div>
                    <p className="text-xs text-slate-400">
                      Require immediate attention
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-white">
                    Recent Invoices
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/project-manager/financial/invoices">
                        <FileText className="w-4 h-4 mr-2" />
                        View All
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData.recentInvoices.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">
                        No invoices found for this period
                      </p>
                    ) : (
                      financialData.recentInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">
                                {invoice.invoiceNumber}
                              </h4>
                              <p className="text-sm text-slate-400">
                                {invoice.client.company || invoice.client.name}
                                {invoice.project && ` • ${invoice.project.name}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium text-white">
                                {formatCurrency(invoice.total)}
                              </div>
                              <div className="text-sm text-slate-400">
                                Due {new Date(invoice.dueDate).toLocaleDateString()}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                  <Link href="/project-manager/financial/invoices/new">
                    <Plus className="w-6 h-6" />
                    Create Invoice
                  </Link>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                  <Link href="/project-manager/financial/expenses">
                    <DollarSign className="w-6 h-6" />
                    Track Expenses
                  </Link>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                  <Link href="/project-manager/financial/reports">
                    <BarChart3 className="w-6 h-6" />
                    View Reports
                  </Link>
                </Button>
                
                <Button className="h-20 flex flex-col gap-2" variant="outline" asChild>
                  <Link href="/project-manager/financial/settings">
                    <FileText className="w-6 h-6" />
                    Billing Settings
                  </Link>
                </Button>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}