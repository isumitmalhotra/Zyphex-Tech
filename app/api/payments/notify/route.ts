import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
// Lazy load to prevent build-time initialization
// import { emailService } from '@/lib/services/email-service'
// import { pdfGenerator } from '@/lib/services/pdf-generator'

// This would be your Stripe webhook secret
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Helper function to generate receipt HTML (reuse from receipt route)
function generateReceiptHTML(invoice: any, payment: any): string {
  const formattedDate = new Date(payment.processedAt || payment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = new Date(payment.processedAt || payment.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${invoice.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #1a202c;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3b82f6;
        }
        .logo { font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 8px; }
        .company-info { color: #64748b; font-size: 12px; }
        .receipt-title { font-size: 28px; font-weight: bold; margin: 30px 0 10px; color: #10b981; }
        .status-badge {
          display: inline-block;
          background: #d1fae5;
          color: #065f46;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 12px;
          margin-bottom: 30px;
        }
        .info-section { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-item { margin-bottom: 15px; }
        .info-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 600;
        }
        .info-value { font-size: 15px; color: #1a202c; font-weight: 500; }
        .amount-section {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
        }
        .amount-label { font-size: 14px; opacity: 0.9; margin-bottom: 8px; }
        .amount-value { font-size: 48px; font-weight: bold; margin-bottom: 5px; }
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">ZYPHEX</div>
        <div class="company-info">
          Zyphex Technologies<br>
          123 Business Street, Suite 100<br>
          San Francisco, CA 94105<br>
          support@zyphex.com | +1 (555) 123-4567
        </div>
      </div>
      
      <div class="receipt-title">Payment Receipt</div>
      <div class="status-badge">✓ PAID</div>
      
      <div class="info-section">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Receipt Number</div>
            <div class="info-value">${payment.id}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Invoice Number</div>
            <div class="info-value">${invoice.invoiceNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Date</div>
            <div class="info-value">${formattedDate} at ${formattedTime}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Payment Method</div>
            <div class="info-value">${payment.paymentMethod}</div>
          </div>
        </div>
      </div>
      
      <div class="amount-section">
        <div class="amount-label">Amount Paid</div>
        <div class="amount-value">$${payment.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</div>
        <div>${payment.currency || 'USD'}</div>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <div class="info-label">Billed To</div>
          <div class="info-value">
            ${invoice.client.name}<br>
            ${invoice.client.company || ''}<br>
            ${invoice.client.email}
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>Zyphex Technologies</strong></p>
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `
}

/**
 * POST /api/payments/notify
 * 
 * Called after payment success/failure to send email notifications
 */
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, status, errorMessage, errorCode } = body

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoiceId' },
        { status: 400 }
      )
    }

    // Fetch invoice with details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: {
            processedAt: 'desc'
          },
          take: 1
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Handle payment success
    if (status === 'success' || status === 'COMPLETED') {
      const lastPayment = invoice.payments[0]
      
      if (!lastPayment) {
        return NextResponse.json(
          { error: 'No completed payment found' },
          { status: 400 }
        )
      }

      // Lazy load services
      const { emailService } = await import('@/lib/services/email-service')
      const { pdfGenerator } = await import('@/lib/services/pdf-generator')

      // Generate receipt PDF
      let receiptPDF: Buffer | undefined
      try {
        const receiptHTML = generateReceiptHTML(invoice, lastPayment)
        receiptPDF = await pdfGenerator.generateReceiptPDF(receiptHTML)
      } catch (error) {
        console.error('PDF generation failed:', error)
        // Continue without PDF attachment
      }

      // Send payment confirmation email
      const emailResult = await emailService.sendPaymentConfirmation(
        {
          invoiceNumber: invoice.invoiceNumber,
          amount: lastPayment.amount,
          currency: lastPayment.currency,
          paymentDate: new Date(lastPayment.processedAt || lastPayment.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          paymentMethod: lastPayment.paymentMethod,
          transactionId: lastPayment.paymentReference || undefined,
          clientName: invoice.client.name || 'Valued Customer',
          clientEmail: invoice.client.email,
          receiptUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices/${invoice.id}/payment-success`
        },
        receiptPDF
      )

      return NextResponse.json({
        success: true,
        emailSent: emailResult.success,
        messageId: emailResult.messageId,
        message: 'Payment confirmation email sent'
      })
    }

    // Handle payment failure
    if (status === 'failed' || status === 'FAILED') {
      // Lazy load email service
      const { emailService } = await import('@/lib/services/email-service')
      
      const emailResult = await emailService.sendPaymentFailure({
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        currency: 'USD',
        errorMessage: errorMessage || 'Payment processing failed',
        errorCode: errorCode,
        clientName: invoice.client.name || 'Valued Customer',
        clientEmail: invoice.client.email,
        retryUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices/${invoice.id}/payment`
      })

      return NextResponse.json({
        success: true,
        emailSent: emailResult.success,
        messageId: emailResult.messageId,
        message: 'Payment failure notification sent'
      })
    }

    return NextResponse.json(
      { error: 'Invalid status. Use "success" or "failed"' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Payment notification error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
