"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Download, 
  CreditCard, 
  Calendar, 
  DollarSign,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  Loader2,
  AlertCircle
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { format } from "date-fns"

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  total: number
  currency: string
  status: string
  dueDate: string
  issuedDate: string
  description?: string
  client: {
    id: string
    name: string
    email: string
    phone?: string
    company?: string
    address?: string
  }
  project?: {
    id: string
    name: string
    description?: string
  }
  payments: Array<{
    id: string
    amount: number
    currency: string
    paymentMethod: string
    paymentReference?: string
    status: string
    processedAt: string
    createdAt: string
  }>
  totalPaid: number
  remainingBalance: number
  isPaid: boolean
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/invoices/${invoiceId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Invoice not found")
        }
        if (response.status === 403) {
          throw new Error("You don't have permission to view this invoice")
        }
        throw new Error("Failed to load invoice")
      }

      const data = await response.json()
      setInvoice(data.invoice)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId])

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true)
      
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
      
      if (!response.ok) {
        throw new Error("Failed to generate PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download PDF")
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handlePayNow = () => {
    router.push(`/invoices/${invoiceId}/payment`)
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-green-500 text-white'
      case 'PENDING':
        return 'bg-yellow-500 text-white'
      case 'OVERDUE':
        return 'bg-red-500 text-white'
      case 'CANCELLED':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <SubtleBackground />
        <Card className="w-full max-w-md zyphex-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-lg zyphex-subheading">Loading invoice details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <SubtleBackground />
        <Card className="w-full max-w-md zyphex-card">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <CardTitle className="text-center zyphex-heading text-2xl">Error Loading Invoice</CardTitle>
            <CardDescription className="text-center">
              {error || "Invoice not found"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.push('/dashboard')} className="w-full zyphex-gradient-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <SubtleBackground />
      
      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
            
            {!invoice.isPaid && invoice.status !== 'CANCELLED' && (
              <Button
                onClick={handlePayNow}
                className="zyphex-gradient-primary"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay Now
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Header Card */}
        <Card className="zyphex-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl zyphex-heading mb-2">
                  Invoice {invoice.invoiceNumber}
                </CardTitle>
                {invoice.description && (
                  <CardDescription className="text-base">
                    {invoice.description}
                  </CardDescription>
                )}
              </div>
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Dates and Amount Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Issued Date
                </p>
                <p className="text-lg font-semibold zyphex-heading">
                  {format(new Date(invoice.issuedDate), 'MMM dd, yyyy')}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </p>
                <p className="text-lg font-semibold zyphex-heading">
                  {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Status */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-xl font-semibold zyphex-heading">
                    ${invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    ${invoice.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Remaining Balance</p>
                  <p className="text-xl font-semibold text-red-600 dark:text-red-400">
                    ${invoice.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & Project Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{invoice.client.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${invoice.client.email}`} className="text-blue-600 hover:underline">
                  {invoice.client.email}
                </a>
              </div>
              
              {invoice.client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{invoice.client.phone}</span>
                </div>
              )}
              
              {invoice.client.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{invoice.client.company}</span>
                </div>
              )}
              
              {invoice.client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{invoice.client.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          {invoice.project && (
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 zyphex-heading">
                  <FileText className="h-5 w-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-lg">{invoice.project.name}</p>
                  {invoice.project.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.project.description}
                    </p>
                  )}
                </div>
                
                <Link href={`/projects/${invoice.project.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Project Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {payment.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.paymentMethod} • {format(new Date(payment.processedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                      {payment.paymentReference && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Ref: {payment.paymentReference}
                        </p>
                      )}
                    </div>
                    <Badge variant={payment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
