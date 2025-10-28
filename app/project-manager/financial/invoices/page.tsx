'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import { useUser, usePermission } from "@/hooks/use-permissions"
import {
  FileText,
  Plus,
  Search,
  Filter,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  taxAmount: number
  total: number
  currency: string
  status: string
  billingType: string
  dueDate: string
  sentAt?: string
  paidAt?: string
  createdAt: string
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
  totalPaid: number
  remainingBalance: number
  isPaid: boolean
}

interface InvoicesData {
  invoices: Invoice[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ProjectManagerInvoicesPage() {
  const user = useUser()
  const hasFinancialsPermission = usePermission(Permission.VIEW_FINANCIALS)
  
  const [invoicesData, setInvoicesData] = useState<InvoicesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Debug permissions
  console.log('🔐 Permission Debug:', {
    user: user?.email,
    role: user?.role,
    hasFinancialsPermission,
    requiredPermission: Permission.VIEW_FINANCIALS
  })

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true)
        console.log('📊 Loading invoices...', { page: currentPage, status: statusFilter, search: searchTerm })
        
        const response = await fetch('/api/financial/mock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page: currentPage,
            limit: 10,
            status: statusFilter === 'all' ? null : statusFilter,
            search: searchTerm
          })
        })
        
        console.log('📊 Response status:', response.status)
        const result = await response.json()
        console.log('📊 Response data:', result)

        if (result.invoices) {
          setInvoicesData({
            invoices: result.invoices,
            pagination: {
              page: result.page,
              limit: result.limit,
              total: result.total,
              pages: result.totalPages
            }
          })
          console.log('✅ Invoices loaded:', result.invoices.length)
          setError(null)
        } else {
          console.error('❌ No invoices in response:', result)
          setError(result.error || 'Failed to load invoices')
        }
      } catch (err) {
        setError('Failed to load invoices')
        console.error('❌ Invoices fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadInvoices()
  }, [currentPage, statusFilter, searchTerm])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/invoices?${params}`)
      const result = await response.json()

      if (result.success) {
        setInvoicesData(result)
        setError(null)
      } else {
        setError(result.error || 'Failed to load invoices')
      }
    } catch (err) {
      setError('Failed to load invoices')
      console.error('Invoices fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          invoiceId
        })
      })

      const result = await response.json()

      if (result.success) {
        fetchInvoices() // Refresh the list
      } else {
        setError(result.error || 'Failed to send invoice')
      }
    } catch (err) {
      setError('Failed to send invoice')
      console.error('Send invoice error:', err)
    }
  }

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'sent':
        return <Send className="w-4 h-4 text-blue-500" />
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
    switch (status.toLowerCase()) {
      case 'paid':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`
      case 'sent':
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`
      case 'overdue':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`
      case 'draft':
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`
      default:
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`
    }
  }

  // No need to filter again on client since API already filters
  // Just use the invoices directly from the API response
  const filteredInvoices = invoicesData?.invoices || []

  console.log('🔍 Filter debug:', {
    invoicesDataExists: !!invoicesData,
    totalInvoices: invoicesData?.invoices?.length,
    searchTerm,
    searchTermLength: searchTerm.length,
    filteredCount: filteredInvoices.length,
    sampleInvoice: invoicesData?.invoices?.[0],
    firstInvoiceNumber: invoicesData?.invoices?.[0]?.invoiceNumber
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-slate-600 rounded w-1/4"></div>
                      <div className="h-6 bg-slate-600 rounded w-1/2"></div>
                      <div className="h-4 bg-slate-600 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('🎨 About to render main content. Invoices to display:', filteredInvoices.length)

  return (
    <PermissionGuard 
      permission={Permission.VIEW_FINANCIALS}
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-slate-400">You do not have permission to view financials</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Invoice Management</h1>
                <p className="text-slate-400 mt-2">
                  Create, send, and track invoices for your projects
                </p>
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" asChild>
                <Link href="/project-manager/financial/invoices/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Invoice
                </Link>
              </Button>
            </div>

            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        placeholder="Search invoices..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 bg-slate-900/50 border-slate-600 text-white">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="SENT">Sent</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            <div className="space-y-4">
              {filteredInvoices.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No invoices found</h3>
                    <p className="text-slate-400 mb-4">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Create your first invoice to get started'
                      }
                    </p>
                    <Button asChild>
                      <Link href="/project-manager/financial/invoices/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredInvoices.map((invoice) => (
                  <Card key={invoice.id} className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            {getStatusIcon(invoice.status)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-white text-lg">
                                {invoice.invoiceNumber}
                              </h3>
                              <span className={getStatusBadge(invoice.status)}>
                                {invoice.status}
                              </span>
                            </div>
                            <p className="text-slate-400">
                              {invoice?.client?.company || invoice?.client?.name || 'Unknown Client'}
                              {invoice?.project?.name && ` • ${invoice.project.name}`}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span>Created: {invoice?.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}</span>
                              <span>Due: {invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</span>
                              {invoice?.paidAt && (
                                <span>Paid: {new Date(invoice.paidAt).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                              {formatCurrency(invoice.total, invoice.currency)}
                            </div>
                            {!invoice.isPaid && invoice.totalPaid > 0 && (
                              <div className="text-sm text-slate-400">
                                {formatCurrency(invoice.remainingBalance, invoice.currency)} remaining
                              </div>
                            )}
                            <div className="text-xs text-slate-500">
                              {invoice?.billingType ? 
                                invoice.billingType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : 
                                'Standard Billing'
                              }
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/project-manager/financial/invoices/${invoice.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/project-manager/financial/invoices/${invoice.id}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                            {invoice.status === 'DRAFT' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleSendInvoice(invoice.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Send className="w-4 h-4 mr-1" />
                                Send
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {invoicesData && invoicesData.pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-slate-400 px-4">
                  Page {currentPage} of {invoicesData.pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === invoicesData.pagination.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  )
}