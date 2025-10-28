'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Download, 
  Send, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  FileText,
  Mail,
  Building
} from 'lucide-react'
import Link from 'next/link'

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
  totalPaid: number
  remainingBalance: number
  isPaid: boolean
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true)
        // For now, get invoice from mock data
        const response = await fetch('/api/financial/mock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: 1, limit: 100 })
        })
        
        const result = await response.json()
        const foundInvoice = result.invoices?.find((inv: Invoice) => inv.id === params.id)
        
        if (foundInvoice) {
          setInvoice(foundInvoice)
          setError(null)
        } else {
          setError('Invoice not found')
        }
      } catch (err) {
        console.error('Error fetching invoice:', err)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchInvoice()
    }
  }, [params.id])

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount || 0)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Paid</Badge>
      case 'pending':
      case 'sent':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pending</Badge>
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Overdue</Badge>
      case 'draft':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Draft</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase()
    switch (statusLower) {
      case 'paid':
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case 'overdue':
        return <AlertTriangle className="w-6 h-6 text-red-400" />
      case 'pending':
      case 'sent':
        return <Clock className="w-6 h-6 text-blue-400" />
      default:
        return <FileText className="w-6 h-6 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-64"></div>
            <div className="h-96 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto max-w-5xl">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h2>
              <p className="text-slate-400 mb-6">{error || 'The invoice you are looking for does not exist.'}</p>
              <Button asChild>
                <Link href="/project-manager/financial/invoices">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Invoices
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In a real app, you'd call: const response = await fetch(`/api/invoices/${invoice.id}/pdf`)
      // For now, show a message
      alert(`PDF download for ${invoice.invoiceNumber} would start here. This feature requires a PDF generation service.`)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      alert('Failed to download PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="border-slate-600 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{invoice.invoiceNumber}</h1>
              <p className="text-slate-400">Invoice Details</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(invoice.status)}
            {getStatusIcon(invoice.status)}
          </div>
        </div>

        {/* Main Invoice Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-2xl mb-2">
                  {formatCurrency(invoice.total, invoice.currency)}
                </CardTitle>
                <p className="text-slate-400">
                  Due {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-slate-600"
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Button>
                {invoice.status === 'DRAFT' && (
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Send className="w-4 h-4 mr-2" />
                    Send Invoice
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    Bill To
                  </h3>
                  <div className="space-y-1 text-slate-300">
                    <p className="font-medium">{invoice.client.company || invoice.client.name}</p>
                    <p className="text-sm text-slate-400">{invoice.client.name}</p>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {invoice.client.email}
                    </p>
                  </div>
                </div>

                {invoice.project && (
                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      Project
                    </h3>
                    <p className="text-slate-300">{invoice.project.name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-3">Invoice Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Invoice Number:</span>
                      <span className="text-slate-300">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Created Date:</span>
                      <span className="text-slate-300">{formatDate(invoice.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Due Date:</span>
                      <span className="text-slate-300">{formatDate(invoice.dueDate)}</span>
                    </div>
                    {invoice.sentAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sent Date:</span>
                        <span className="text-slate-300">{formatDate(invoice.sentAt)}</span>
                      </div>
                    )}
                    {invoice.paidAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Paid Date:</span>
                        <span className="text-green-400">{formatDate(invoice.paidAt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Billing Type:</span>
                      <span className="text-slate-300">
                        {invoice.billingType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {invoice.description && (
              <div className="border-t border-slate-700 pt-6">
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-slate-300">{invoice.description}</p>
              </div>
            )}

            {/* Amount Breakdown */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-white font-semibold mb-4">Amount Breakdown</h3>
              <div className="space-y-3 max-w-md ml-auto">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax ({((invoice.taxAmount / invoice.amount) * 100).toFixed(0)}%):</span>
                  <span>{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white border-t border-slate-700 pt-3">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                {invoice.totalPaid > 0 && (
                  <>
                    <div className="flex justify-between text-green-400">
                      <span>Paid:</span>
                      <span>{formatCurrency(invoice.totalPaid, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-white border-t border-slate-700 pt-3">
                      <span>Balance Due:</span>
                      <span className={invoice.isPaid ? 'text-green-400' : 'text-yellow-400'}>
                        {formatCurrency(invoice.remainingBalance, invoice.currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">Need to make changes?</p>
              <div className="flex gap-3">
                <Button variant="outline" className="border-slate-600" asChild>
                  <Link href={`/project-manager/financial/invoices/${invoice.id}/edit`}>
                    Edit Invoice
                  </Link>
                </Button>
                {!invoice.isPaid && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
