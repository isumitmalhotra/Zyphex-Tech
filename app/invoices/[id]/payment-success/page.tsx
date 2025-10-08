"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Download, ArrowLeft, Mail, Loader2, AlertCircle } from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  total: number
  currency: string
  status: string
  dueDate: string
  client: {
    id: string
    name: string
    email: string
  }
  payments: Array<{
    id: string
    amount: number
    paymentMethod: string
    processedAt: string
    paymentReference?: string
  }>
}

export default function PaymentSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReceipt, setDownloadingReceipt] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const sendEmailNotification = async () => {
    try {
      await fetch('/api/payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          status: 'success'
        })
      })
      setEmailSent(true)
    } catch (err) {
      console.error('Failed to send email notification:', err)
      // Don't show error to user, email is a background operation
    }
  }

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/invoices/${invoiceId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Invoice not found")
        }
        throw new Error("Failed to load invoice details")
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
      fetchInvoiceDetails()
      sendEmailNotification()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId])

  const handleDownloadReceipt = async () => {
    try {
      setDownloadingReceipt(true)
      
      const response = await fetch(`/api/invoices/${invoiceId}/receipt`)
      
      if (!response.ok) {
        throw new Error("Failed to generate receipt")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${invoice?.invoiceNumber || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download receipt")
    } finally {
      setDownloadingReceipt(false)
    }
  }

  const getLastPayment = () => {
    if (!invoice || !invoice.payments || invoice.payments.length === 0) {
      return null
    }
    return invoice.payments.sort((a, b) => 
      new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    )[0]
  }

  const formatCardNumber = (reference?: string) => {
    if (!reference) return "N/A"
    // Extract last 4 digits if reference contains card info
    const match = reference.match(/\d{4}$/)
    return match ? `•••• ${match[0]}` : reference
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SubtleBackground />
        <Card className="w-full max-w-md zyphex-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
            <p className="text-lg zyphex-subheading">Loading payment details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              {error || "Unable to load invoice details"}
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

  const lastPayment = getLastPayment()

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <SubtleBackground />
      
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Success Icon */}
        <div className="flex justify-center mb-8 animate-in zoom-in duration-500">
          <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6 shadow-lg">
            <CheckCircle className="h-20 w-20 text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-bold zyphex-heading mb-3">
            Payment Successful!
          </h1>
          <p className="text-xl zyphex-subheading">
            Your payment has been processed successfully
          </p>
        </div>

        {/* Payment Details Card */}
        <Card className="mb-6 zyphex-card hover-zyphex-lift animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <CardHeader>
            <CardTitle className="zyphex-heading">Payment Confirmation</CardTitle>
            <CardDescription>
              A confirmation email has been sent to {invoice.client.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Invoice Number</p>
                <p className="text-lg font-semibold zyphex-heading">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Payment Date</p>
                <p className="text-lg font-semibold zyphex-heading">
                  {lastPayment ? new Date(lastPayment.processedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Payment Amount */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 dark:from-green-500/20 dark:to-green-500/10 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Amount Paid</p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                ${(lastPayment?.amount || invoice.total).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{invoice.currency || 'USD'}</p>
            </div>

            <Separator />

            {/* Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Payment Method</p>
                <p className="text-base font-semibold zyphex-heading">
                  {lastPayment?.paymentMethod || 'Credit Card'}
                </p>
              </div>
              {lastPayment?.paymentMethod === 'STRIPE' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Card Number</p>
                  <p className="text-base font-semibold zyphex-heading">
                    {formatCardNumber(lastPayment.paymentReference)}
                  </p>
                </div>
              )}
            </div>

            {lastPayment?.paymentReference && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Transaction ID</p>
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded break-all">
                    {lastPayment.paymentReference}
                  </p>
                </div>
              </>
            )}

            {/* Invoice Status */}
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Invoice Status</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                {invoice.status}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Button 
            onClick={handleDownloadReceipt}
            disabled={downloadingReceipt}
            className="w-full zyphex-gradient-primary h-12 text-base"
            size="lg"
          >
            {downloadingReceipt ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Download Receipt
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard')}
            className="w-full h-12 text-base"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </div>

        {/* Additional Info */}
        <Card className="zyphex-card animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium zyphex-heading mb-1">
                  Confirmation Email Sent
                </p>
                <p className="text-sm text-muted-foreground">
                  A detailed payment receipt has been sent to <span className="font-medium">{invoice.client.email}</span>. 
                  Please check your inbox and spam folder. If you don't receive it within 10 minutes, please contact support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Link */}
        <div className="text-center mt-8 animate-in fade-in duration-700 delay-600">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <Link 
              href="/contact" 
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
