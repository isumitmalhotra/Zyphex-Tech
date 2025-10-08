/**
 * Payment Confirmation Email Template
 * 
 * Sent to clients after successful payment
 */

import {
  EmailTemplate,
  BaseTemplateData,
  generateBaseHTML,
  createButton,
  createInfoBox,
  createDetailsTable
} from './base'

export interface PaymentConfirmationEmailData extends BaseTemplateData {
  recipientName: string
  invoiceNumber: string
  paymentDate: string
  amount: number
  currency: string
  paymentMethod: string
  transactionId?: string
  last4?: string
  receiptUrl?: string
  invoiceUrl?: string
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationEmailData): EmailTemplate {
  const appName = data.appName || process.env.APP_NAME || 'Zyphex Tech'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency
    }).format(amount)
  }

  const paymentMethodDisplay = data.last4 
    ? `${data.paymentMethod} ending in ${data.last4}`
    : data.paymentMethod

  const content = `
    <div style="text-align: center; padding: 30px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
      <h1 style="color: #28a745; margin: 0 0 10px; font-size: 32px;">Payment Successful!</h1>
      <p style="color: #6c757d; font-size: 18px; margin: 0;">Your payment has been processed</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hi <strong>${data.recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Thank you for your payment! We've successfully received your payment and your invoice has been marked as paid.
    </p>

    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 8px; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
        Amount Paid
      </p>
      <p style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700;">
        ${formatCurrency(data.amount)}
      </p>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
        ${data.currency}
      </p>
    </div>

    ${createDetailsTable({
      'Invoice Number': `<strong>${data.invoiceNumber}</strong>`,
      'Payment Date': data.paymentDate,
      'Payment Method': paymentMethodDisplay,
      ...(data.transactionId ? { 'Transaction ID': `<code style="font-size: 12px; background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${data.transactionId}</code>` } : {})
    })}

    ${createInfoBox(`
      <strong>✓ Your payment has been confirmed</strong><br>
      A receipt has been ${data.receiptUrl ? 'attached to this email and is also' : ''} available for download.
    `, 'success')}

    <div style="text-align: center; margin: 30px 0;">
      ${data.receiptUrl ? createButton(data.receiptUrl, 'Download Receipt') : ''}
      ${data.invoiceUrl ? createButton(data.invoiceUrl, 'View Invoice') : ''}
    </div>

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin: 0 0 12px; color: #495057; font-size: 16px;">
        📧 What's Next?
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 14px; line-height: 1.8;">
        <li>Save this email for your records</li>
        <li>Download and keep the receipt for your accounting</li>
        <li>You can view this invoice anytime in your dashboard</li>
        <li>We'll send you updates as we work on your project</li>
      </ul>
    </div>

    <div style="background-color: #e7f3ff; border-left: 4px solid #0066cc; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #004085; font-size: 14px;">
        <strong>💡 Need a different receipt format?</strong><br>
        Contact our support team and we'll be happy to provide any additional documentation you need.
      </p>
    </div>

    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        Thank you for your business! We truly appreciate your trust in us.
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 20px 0 0;">
        Best regards,<br>
        <strong>The ${appName} Team</strong>
      </p>
    </div>
  `

  const html = generateBaseHTML(content, data)

  const text = `
Payment Successful! ✅

Hi ${data.recipientName},

Thank you for your payment! We've successfully received your payment and your invoice has been marked as paid.

AMOUNT PAID: ${formatCurrency(data.amount)} ${data.currency}

PAYMENT DETAILS:
Invoice Number: ${data.invoiceNumber}
Payment Date: ${data.paymentDate}
Payment Method: ${paymentMethodDisplay}
${data.transactionId ? `Transaction ID: ${data.transactionId}` : ''}

✓ Your payment has been confirmed!
${data.receiptUrl ? `A receipt is available for download at: ${data.receiptUrl}` : ''}

${data.invoiceUrl ? `VIEW INVOICE:\n${data.invoiceUrl}\n` : ''}

WHAT'S NEXT?
• Save this email for your records
• Download and keep the receipt for your accounting
• You can view this invoice anytime in your dashboard
• We'll send you updates as we work on your project

💡 Need a different receipt format?
Contact our support team and we'll be happy to provide any additional documentation you need.

Thank you for your business! We truly appreciate your trust in us.

Best regards,
The ${appName} Team

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
Questions? Contact us at ${data.supportEmail || process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}
  `.trim()

  return {
    subject: `Payment Confirmed - Invoice ${data.invoiceNumber}`,
    html,
    text
  }
}
