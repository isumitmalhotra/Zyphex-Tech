import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pdfGenerator } from '@/lib/services/pdf-generator'

// Simple PDF generation using HTML/CSS approach
// For production, consider using libraries like pdfkit, puppeteer, or react-pdf
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
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
        
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 8px;
        }
        
        .company-info {
          color: #64748b;
          font-size: 12px;
        }
        
        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          margin: 30px 0 10px;
          color: #10b981;
        }
        
        .receipt-subtitle {
          color: #64748b;
          margin-bottom: 30px;
        }
        
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
        
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .info-item {
          margin-bottom: 15px;
        }
        
        .info-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 600;
        }
        
        .info-value {
          font-size: 15px;
          color: #1a202c;
          font-weight: 500;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          text-align: center;
          margin: 30px 0;
        }
        
        .amount-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        
        .amount-value {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .amount-currency {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .details-table {
          width: 100%;
          margin: 30px 0;
          border-collapse: collapse;
        }
        
        .details-table th {
          background: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .details-table td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .transaction-id {
          font-family: 'Courier New', monospace;
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 11px;
          display: inline-block;
          margin-top: 5px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        
        .footer-note {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          color: #92400e;
          font-size: 13px;
          text-align: left;
        }
        
        @media print {
          body {
            padding: 20px;
          }
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
      <div class="receipt-subtitle">Thank you for your payment</div>
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
        <div class="amount-currency">${payment.currency || 'USD'}</div>
      </div>
      
      <table class="details-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Invoice ${invoice.invoiceNumber}</strong><br>
              <span style="color: #64748b; font-size: 12px;">
                ${invoice.project ? invoice.project.name : 'Services Rendered'}
              </span>
            </td>
            <td style="text-align: right; font-weight: 600;">
              $${payment.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="info-section">
        <div class="info-item">
          <div class="info-label">Billed To</div>
          <div class="info-value">
            ${invoice.client.name}<br>
            ${invoice.client.company || ''}<br>
            ${invoice.client.email}<br>
            ${invoice.client.phone || ''}
          </div>
        </div>
        
        ${payment.paymentReference ? `
        <div class="info-item" style="margin-top: 20px;">
          <div class="info-label">Transaction ID</div>
          <div class="transaction-id">${payment.paymentReference}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="footer-note">
        <strong>Important:</strong> This is an official payment receipt. Please keep this for your records. 
        If you have any questions regarding this payment, please contact our support team at support@zyphex.com 
        or call +1 (555) 123-4567.
      </div>
      
      <div class="footer">
        <p><strong>Zyphex Technologies</strong></p>
        <p>This receipt was generated on ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
        <p style="margin-top: 10px;">Thank you for your business!</p>
      </div>
    </body>
    </html>
  `
}

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const invoiceId = params.id

    // Fetch invoice with payments
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            address: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true
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

    // Authorization check
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    const isClientOwner = session.user.id === invoice.client.id

    if (!isAdmin && !isClientOwner) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this invoice' },
        { status: 403 }
      )
    }

    // Check if invoice has been paid
    if (!invoice.payments || invoice.payments.length === 0) {
      return NextResponse.json(
        { error: 'No completed payments found for this invoice' },
        { status: 400 }
      )
    }

    const lastPayment = invoice.payments[0]

    // Generate HTML receipt
    const receiptHTML = generateReceiptHTML(invoice, lastPayment)

    // Generate PDF from HTML
    try {
      const pdfBuffer = await pdfGenerator.generateReceiptPDF(receiptHTML)

      // Return PDF
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${invoice.invoiceNumber}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        }
      })
    } catch (pdfError) {
      console.error('PDF generation failed, falling back to HTML:', pdfError)
      
      // Fallback to HTML if PDF generation fails
      return new NextResponse(receiptHTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="receipt-${invoice.invoiceNumber}.html"`,
        }
      })
    }

  } catch (error) {
    console.error('Error generating receipt:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate receipt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
