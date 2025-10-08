"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { XCircle, RefreshCw, ArrowLeft, Mail, AlertTriangle, CreditCard, Loader2 } from "lucide-react"
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
}

export default function PaymentFailedPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Get error details from URL params
  const errorCode = searchParams.get('error_code')
  const errorMessage = searchParams.get('error_message')
  const paymentMethod = searchParams.get('payment_method')

  const sendEmailNotification = async () => {
    try {
      await fetch('/api/payments/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          status: 'failed',
          errorCode: errorCode || undefined,
          errorMessage: errorMessage || undefined
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

  const getErrorDetails = () => {
    if (errorMessage) {
      return {
        title: "Payment Processing Error",
        message: errorMessage,
        type: "processing"
      }
    }

    switch (errorCode) {
      case 'card_declined':
        return {
          title: "Card Declined",
          message: "Your card was declined. Please try a different payment method or contact your bank.",
          type: "card"
        }
      case 'insufficient_funds':
        return {
          title: "Insufficient Funds",
          message: "Your card has insufficient funds to complete this transaction.",
          type: "card"
        }
      case 'expired_card':
        return {
          title: "Card Expired",
          message: "The card you're trying to use has expired. Please use a different card.",
          type: "card"
        }
      case 'incorrect_cvc':
        return {
          title: "Incorrect Security Code",
          message: "The security code (CVC) you entered is incorrect. Please try again.",
          type: "card"
        }
      case 'processing_error':
        return {
          title: "Processing Error",
          message: "There was an error processing your payment. Please try again in a few moments.",
          type: "processing"
        }
      case 'network_error':
        return {
          title: "Network Error",
          message: "Unable to connect to payment processor. Please check your internet connection and try again.",
          type: "network"
        }
      default:
        return {
          title: "Payment Failed",
          message: "Your payment could not be processed. Please try again or contact support.",
          type: "general"
        }
    }
  }

  const handleRetry = () => {
    router.push(`/invoices/${invoiceId}/payment`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <SubtleBackground />
        <Card className="w-full max-w-md zyphex-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
            <p className="text-lg zyphex-subheading">Loading invoice details...</p>
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
                <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
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

  const errorDetails = getErrorDetails()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <SubtleBackground />
      
      <div className="max-w-3xl mx-auto relative z-10">
        {/* Error Icon */}
        <div className="flex justify-center mb-8 animate-in zoom-in duration-500">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-6 shadow-lg">
            <XCircle className="h-20 w-20 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-bold zyphex-heading mb-3">
            Payment Failed
          </h1>
          <p className="text-xl zyphex-subheading">
            We couldn't process your payment
          </p>
        </div>

        {/* Error Details Card */}
        <Card className="mb-6 zyphex-card border-red-200 dark:border-red-900/30 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          <CardHeader>
            <CardTitle className="zyphex-heading text-red-600 dark:text-red-400">
              {errorDetails.title}
            </CardTitle>
            <CardDescription>
              {errorDetails.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Invoice Number</p>
                <p className="text-lg font-semibold zyphex-heading">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Amount Due</p>
                <p className="text-lg font-semibold zyphex-heading">
                  ${invoice.total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
            </div>

            {paymentMethod && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Attempted Payment Method</p>
                  <p className="text-base font-semibold zyphex-heading">{paymentMethod}</p>
                </div>
              </>
            )}

            {errorCode && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Error Code</p>
                  <p className="text-sm font-mono bg-muted px-3 py-2 rounded">{errorCode}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Tips */}
        <Card className="mb-6 zyphex-card animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <CardHeader>
            <CardTitle className="zyphex-heading flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
              Troubleshooting Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-1 mt-0.5">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium zyphex-heading">Check your card details</p>
                  <p className="text-sm text-muted-foreground">Ensure your card number, expiry date, and security code are correct.</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-1 mt-0.5">
                  <CreditCard className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium zyphex-heading">Verify sufficient funds</p>
                  <p className="text-sm text-muted-foreground">Make sure you have enough balance or credit limit available.</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-1 mt-0.5">
                  <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium zyphex-heading">Try a different payment method</p>
                  <p className="text-sm text-muted-foreground">Use an alternative card or payment option if available.</p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-1 mt-0.5">
                  <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium zyphex-heading">Contact your bank</p>
                  <p className="text-sm text-muted-foreground">Your bank may have declined the transaction for security reasons.</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-450">
          <Button 
            onClick={handleRetry}
            className="w-full zyphex-gradient-primary h-12 text-base"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Try Again
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

        {/* Support Alert */}
        <Alert className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
          <Mail className="h-4 w-4" />
          <AlertTitle>Need Help?</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-3">
              If you continue to experience issues, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/contact')}
                className="w-full sm:w-auto"
              >
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className="w-full sm:w-auto"
              >
                <a href={`mailto:support@zyphex.com?subject=Payment Failed - Invoice ${invoice.invoiceNumber}`}>
                  Email Support Directly
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Additional Info */}
        <div className="text-center mt-8 animate-in fade-in duration-700 delay-750">
          <p className="text-sm text-muted-foreground">
            Your invoice remains active.{' '}
            <span className="font-medium">No charges were made to your account.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
