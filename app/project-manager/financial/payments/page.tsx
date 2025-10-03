"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Download,
  Search,
  Filter
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Payment {
  id: string
  amount: number
  method: string
  status: string
  createdAt: string
  invoice: {
    id: string
    invoiceNumber: string
    client: {
      id: string
      name: string
    }
  }
}

interface PaymentsData {
  payments: Payment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ProjectManagerPaymentsPage() {
  const [paymentsData, setPaymentsData] = useState<PaymentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [_currentPage, _setCurrentPage] = useState(1)

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true)
        // Using mock data for payments
        const mockPayments = {
          payments: [
            {
              id: "pay-001",
              amount: 4950.00,
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
            },
            {
              id: "pay-003",
              amount: 3200.00,
              method: "PAYPAL",
              status: "PENDING",
              createdAt: "2024-01-18",
              invoice: {
                id: "inv-002",
                invoiceNumber: "INV-2024002",
                client: {
                  id: "client-002",
                  name: "StartupXYZ"
                }
              }
            },
            {
              id: "pay-004",
              amount: 1500.00,
              method: "CHECK",
              status: "FAILED",
              createdAt: "2024-01-10",
              invoice: {
                id: "inv-005",
                invoiceNumber: "INV-2024005",
                client: {
                  id: "client-005",
                  name: "DataTech Solutions"
                }
              }
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 4,
            pages: 1
          }
        }
        
        setPaymentsData(mockPayments)
        setError(null)
      } catch (err) {
        setError('Failed to load payments')
        console.error('Payments fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [_currentPage, statusFilter, methodFilter, searchTerm])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      case 'cancelled':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      case 'cancelled':
        return <XCircle className="w-4 h-4" />
      default:
        return <RefreshCw className="w-4 h-4" />
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'CREDIT_CARD':
        return 'text-blue-600 bg-blue-100'
      case 'BANK_TRANSFER':
        return 'text-green-600 bg-green-100'
      case 'PAYPAL':
        return 'text-purple-600 bg-purple-100'
      case 'CHECK':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-slate-600 bg-slate-100'
    }
  }

  const filteredPayments = paymentsData?.payments.filter(payment =>
    payment?.invoice?.invoiceNumber?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    payment?.invoice?.client?.name?.toLowerCase()?.includes(searchTerm.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                <p className="text-slate-300">Loading payments...</p>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
          <div className="container mx-auto px-6 py-8">
            <Alert className="border-red-600 bg-red-900/20">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          </div>
        </PermissionGuard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Management</h1>
              <p className="text-slate-400">Track and manage all payment transactions</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export Payments
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Processed</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(paymentsData?.payments.reduce((sum, p) => sum + p.amount, 0) || 0)}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-green-400">
                      {paymentsData?.payments.filter(p => p.status === 'COMPLETED').length || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {paymentsData?.payments.filter(p => p.status === 'PENDING').length || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Failed</p>
                    <p className="text-2xl font-bold text-red-400">
                      {paymentsData?.payments.filter(p => p.status === 'FAILED').length || 0}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="CHECK">Check</option>
                </select>

                <Button variant="outline" className="border-slate-600">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No payments found</h3>
                    <p className="text-slate-500">No payments match your current filters.</p>
                  </div>
                ) : (
                  filteredPayments.map((payment) => (
                    <div key={payment.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-semibold text-white">
                              {formatCurrency(payment.amount)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(payment.method)}`}>
                              {payment.method.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-slate-400 mb-2">
                            Invoice: {payment?.invoice?.invoiceNumber} • {payment?.invoice?.client?.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            Processed: {payment?.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/project-manager/financial/payments/${payment.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </div>
  )
}