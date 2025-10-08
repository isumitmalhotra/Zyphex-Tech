/**
 * Invoice Email Template
 * 
 * Sent to clients when a new invoice is created
 */

import {
  EmailTemplate,
  BaseTemplateData,
  generateBaseHTML,
  createButton,
  createInfoBox,
  createDetailsTable
} from './base'

export interface InvoiceEmailData extends BaseTemplateData {
  recipientName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  amount: number
  currency: string
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  subtotal: number
  tax?: number
  taxRate?: number
  total: number
  invoiceUrl: string
  paymentUrl?: string
  notes?: string
}

export function generateInvoiceEmail(data: InvoiceEmailData): EmailTemplate {
  const appName = data.appName || process.env.APP_NAME || 'Zyphex Tech'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency
    }).format(amount)
  }

  const itemsHtml = data.items.map(item => `
    <tr style="border-bottom: 1px solid #e9ecef;">
      <td style="padding: 12px 16px; color: #495057;">${item.description}</td>
      <td style="padding: 12px 16px; text-align: center; color: #495057;">${item.quantity}</td>
      <td style="padding: 12px 16px; text-align: right; color: #495057;">${formatCurrency(item.rate)}</td>
      <td style="padding: 12px 16px; text-align: right; color: #212529; font-weight: 600;">${formatCurrency(item.amount)}</td>
    </tr>
  `).join('')

  const content = `
    <div style="text-align: center; padding: 30px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">📄</div>
      <h1 style="color: #667eea; margin: 0 0 10px; font-size: 32px;">New Invoice</h1>
      <p style="color: #6c757d; font-size: 18px; margin: 0;">Invoice #${data.invoiceNumber}</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hi <strong>${data.recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Thank you for your business! A new invoice has been created for you.
    </p>

    ${createDetailsTable({
      'Invoice Number': `<strong>${data.invoiceNumber}</strong>`,
      'Invoice Date': data.invoiceDate,
      'Due Date': `<strong>${data.dueDate}</strong>`,
      'Amount Due': `<strong style="color: #667eea; font-size: 18px;">${formatCurrency(data.total)}</strong>`
    })}

    <div style="margin: 30px 0;">
      <h3 style="margin: 0 0 16px; color: #495057; font-size: 18px;">Invoice Items</h3>
      <table style="width: 100%; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px 16px; text-align: left; color: #495057; font-weight: 600; font-size: 14px;">Description</th>
            <th style="padding: 12px 16px; text-align: center; color: #495057; font-weight: 600; font-size: 14px; width: 80px;">Qty</th>
            <th style="padding: 12px 16px; text-align: right; color: #495057; font-weight: 600; font-size: 14px; width: 120px;">Rate</th>
            <th style="padding: 12px 16px; text-align: right; color: #495057; font-weight: 600; font-size: 14px; width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr style="border-top: 2px solid #e9ecef;">
            <td colspan="3" style="padding: 12px 16px; text-align: right; color: #6c757d;">Subtotal:</td>
            <td style="padding: 12px 16px; text-align: right; color: #495057; font-weight: 600;">${formatCurrency(data.subtotal)}</td>
          </tr>
          ${data.tax ? `
          <tr>
            <td colspan="3" style="padding: 12px 16px; text-align: right; color: #6c757d;">Tax (${data.taxRate || 0}%):</td>
            <td style="padding: 12px 16px; text-align: right; color: #495057; font-weight: 600;">${formatCurrency(data.tax)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 2px solid #667eea; background-color: #f8f9fa;">
            <td colspan="3" style="padding: 16px; text-align: right; color: #212529; font-size: 18px; font-weight: 700;">Total:</td>
            <td style="padding: 16px; text-align: right; color: #667eea; font-size: 18px; font-weight: 700;">${formatCurrency(data.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${data.notes ? createInfoBox(`<strong>Notes:</strong><br>${data.notes}`, 'info') : ''}

    <div style="text-align: center; margin: 30px 0;">
      ${data.paymentUrl ? createButton(data.paymentUrl, 'Pay Invoice Now') : ''}
      ${createButton(data.invoiceUrl, 'View Invoice')}
    </div>

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin: 0 0 12px; color: #495057; font-size: 16px;">
        💳 Payment Methods
      </h3>
      <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.8;">
        We accept all major credit cards, debit cards, and online payment methods. 
        Your payment information is secure and encrypted.
      </p>
    </div>

    ${createInfoBox(`
      Please ensure payment is made by <strong>${data.dueDate}</strong> to avoid any late fees.
    `, 'warning')}

    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
      <p style="font-size: 16px; line-height: 1.6; color: #333;">
        If you have any questions about this invoice, please don't hesitate to contact us.
      </p>
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 20px 0 0;">
        Best regards,<br>
        <strong>The ${appName} Team</strong>
      </p>
    </div>
  `

  const html = generateBaseHTML(content, data)

  const itemsText = data.items.map(item => 
    `${item.description} - Qty: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)}`
  ).join('\n')

  const text = `
New Invoice - ${data.invoiceNumber}

Hi ${data.recipientName},

Thank you for your business! A new invoice has been created for you.

INVOICE DETAILS:
Invoice Number: ${data.invoiceNumber}
Invoice Date: ${data.invoiceDate}
Due Date: ${data.dueDate}
Amount Due: ${formatCurrency(data.total)}

INVOICE ITEMS:
${itemsText}

Subtotal: ${formatCurrency(data.subtotal)}
${data.tax ? `Tax (${data.taxRate || 0}%): ${formatCurrency(data.tax)}` : ''}
TOTAL: ${formatCurrency(data.total)}

${data.notes ? `NOTES:\n${data.notes}\n` : ''}

${data.paymentUrl ? `PAY INVOICE NOW:\n${data.paymentUrl}\n\n` : ''}
VIEW INVOICE:
${data.invoiceUrl}

PAYMENT METHODS:
We accept all major credit cards, debit cards, and online payment methods.
Your payment information is secure and encrypted.

⚠️ Please ensure payment is made by ${data.dueDate} to avoid any late fees.

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
The ${appName} Team

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
Questions? Contact us at ${data.supportEmail || process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}
  `.trim()

  return {
    subject: `Invoice ${data.invoiceNumber} from ${appName}`,
    html,
    text
  }
}
