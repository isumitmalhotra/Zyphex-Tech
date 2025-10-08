import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
}

export interface PaymentConfirmationData {
  invoiceNumber: string
  amount: number
  currency: string
  paymentDate: string
  paymentMethod: string
  transactionId?: string
  clientName: string
  clientEmail: string
  receiptUrl?: string
}

export interface PaymentFailureData {
  invoiceNumber: string
  amount: number
  currency: string
  errorMessage: string
  errorCode?: string
  clientName: string
  clientEmail: string
  retryUrl: string
}

export class EmailService {
  private fromEmail: string
  private fromName: string

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@zyphex.com'
    this.fromName = process.env.EMAIL_FROM_NAME || 'Zyphex Technologies'
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured, skipping email send')
        return { success: false, error: 'Email service not configured' }
      }

      const result = await resend.emails.send({
        from: options.from || `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html || '',
        text: options.text || '',
        attachments: options.attachments,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc
      })

      if (result.error) {
        console.error('Email send error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true, messageId: result.data?.id }
    } catch (error) {
      console.error('Email service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    data: PaymentConfirmationData,
    receiptPDF?: Buffer
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = this.generatePaymentConfirmationHTML(data)
    const text = this.generatePaymentConfirmationText(data)

    const attachments: EmailOptions['attachments'] = []
    if (receiptPDF) {
      attachments.push({
        filename: `receipt-${data.invoiceNumber}.pdf`,
        content: receiptPDF,
        contentType: 'application/pdf'
      })
    }

    return this.sendEmail({
      to: data.clientEmail,
      subject: `Payment Confirmation - Invoice ${data.invoiceNumber}`,
      html,
      text,
      attachments: attachments.length > 0 ? attachments : undefined
    })
  }

  /**
   * Send payment failure notification
   */
  async sendPaymentFailure(
    data: PaymentFailureData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = this.generatePaymentFailureHTML(data)
    const text = this.generatePaymentFailureText(data)

    return this.sendEmail({
      to: data.clientEmail,
      subject: `Payment Failed - Invoice ${data.invoiceNumber}`,
      html,
      text
    })
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(
    email: string,
    name: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Zyphex Technologies!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for joining Zyphex Technologies. We're excited to have you on board!</p>
            <p>Your account has been successfully created and you can now start using our platform to manage your projects, track time, and generate invoices.</p>
            <p><strong>Getting Started:</strong></p>
            <ul>
              <li>Complete your profile</li>
              <li>Explore the dashboard</li>
              <li>Set up your first project</li>
              <li>Invite team members</li>
            </ul>
            <center>
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
            </center>
            <p>If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>Zyphex Technologies | support@zyphex.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Welcome to Zyphex Technologies!

Hi ${name},

Thank you for joining Zyphex Technologies. We're excited to have you on board!

Your account has been successfully created and you can now start using our platform.

Getting Started:
- Complete your profile
- Explore the dashboard
- Set up your first project
- Invite team members

Visit your dashboard: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard

If you have any questions, feel free to reach out to our support team.

Zyphex Technologies
support@zyphex.com
    `.trim()

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Zyphex Technologies',
      html,
      text
    })
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetUrl: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>We received a request to reset your password for your Zyphex Technologies account.</p>
            <p>Click the button below to reset your password:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will not change until you create a new one</li>
              </ul>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>Zyphex Technologies | support@zyphex.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Password Reset Request

We received a request to reset your password for your Zyphex Technologies account.

Click this link to reset your password:
${resetUrl}

SECURITY NOTICE:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will not change until you create a new one

Zyphex Technologies
support@zyphex.com
    `.trim()

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Zyphex Technologies',
      html,
      text
    })
  }

  /**
   * Send invoice email with PDF attachment
   */
  async sendInvoiceEmail(
    invoice: any,
    pdfBuffer: Buffer
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 New Invoice</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.clientName || 'Valued Client'},</p>
            <p>Please find attached your invoice from Zyphex Technologies.</p>
            <div class="details">
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber || invoice.number}</p>
              <p><strong>Amount:</strong> $${(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}</p>
            </div>
            <p>The invoice is attached as a PDF document for your records.</p>
            ${invoice.paymentUrl ? `
            <center>
              <a href="${invoice.paymentUrl}" class="button">Pay Invoice</a>
            </center>
            ` : ''}
            <p>Thank you for your business!</p>
          </div>
          <div class="footer">
            <p>Zyphex Technologies | accounting@zyphex.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
New Invoice from Zyphex Technologies

Dear ${invoice.clientName || 'Valued Client'},

Please find attached your invoice.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber || invoice.number}
- Amount: $${(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'}

${invoice.paymentUrl ? `Pay online: ${invoice.paymentUrl}` : ''}

Thank you for your business!

Zyphex Technologies
accounting@zyphex.com
    `.trim()

    return this.sendEmail({
      to: invoice.clientEmail || invoice.email,
      subject: `Invoice ${invoice.invoiceNumber || invoice.number} from Zyphex Technologies`,
      html,
      text,
      attachments: [{
        filename: `invoice-${invoice.invoiceNumber || invoice.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    })
  }

  /**
   * Send project notification to team members
   */
  async sendProjectNotification(
    project: any,
    teamMembers: any[],
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const recipients = teamMembers.map(member => member.email).filter(Boolean)
    
    if (recipients.length === 0) {
      return { success: false, error: 'No valid recipients' }
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .project-info { background: #f5f3ff; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .message-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 Project Update</h1>
          </div>
          <div class="content">
            <div class="project-info">
              <h2 style="margin: 0 0 10px; color: #7c3aed;">${project.name}</h2>
              <p style="margin: 0; color: #64748b;">Status: ${project.status || 'In Progress'}</p>
            </div>
            <div class="message-box">
              <p style="margin: 0;"><strong>📝 Update:</strong></p>
              <p style="margin: 10px 0 0;">${message}</p>
            </div>
            <center>
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects/${project.id}" class="button">View Project</a>
            </center>
          </div>
          <div class="footer">
            <p>Zyphex Technologies | projects@zyphex.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Project Update: ${project.name}

Status: ${project.status || 'In Progress'}

UPDATE:
${message}

View project: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/projects/${project.id}

Zyphex Technologies
projects@zyphex.com
    `.trim()

    return this.sendEmail({
      to: recipients,
      subject: `Project Update: ${project.name}`,
      html,
      text
    })
  }

  /**
   * Send payment reminder for overdue invoices
   */
  async sendPaymentReminder(
    invoice: any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const daysOverdue = invoice.daysOverdue || 0
    const urgencyLevel = daysOverdue > 30 ? 'URGENT' : daysOverdue > 14 ? 'Important' : 'Reminder'

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .details { background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Payment ${urgencyLevel}</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.clientName || 'Valued Client'},</p>
            ${daysOverdue > 0 ? `
            <div class="alert">
              <strong>This invoice is ${daysOverdue} days overdue.</strong>
            </div>
            ` : '<p>This is a friendly reminder that your payment is due soon.</p>'}
            <div class="details">
              <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber || invoice.number}</p>
              <p><strong>Amount Due:</strong> $${(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              <p><strong>Original Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
              ${daysOverdue > 0 ? `<p style="color: #dc2626;"><strong>Days Overdue:</strong> ${daysOverdue}</p>` : ''}
            </div>
            <p>Please process this payment at your earliest convenience to avoid any late fees or service interruptions.</p>
            ${invoice.paymentUrl ? `
            <center>
              <a href="${invoice.paymentUrl}" class="button">Pay Now</a>
            </center>
            ` : ''}
            <p>If you've already sent payment, please disregard this notice.</p>
            <p>Questions? Contact our billing department at accounting@zyphex.com</p>
          </div>
          <div class="footer">
            <p>Zyphex Technologies | accounting@zyphex.com</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Payment ${urgencyLevel}

Dear ${invoice.clientName || 'Valued Client'},

${daysOverdue > 0 ? `⚠️ This invoice is ${daysOverdue} days overdue.\n` : 'This is a friendly reminder that your payment is due soon.\n'}

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber || invoice.number}
- Amount Due: $${(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
- Original Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
${daysOverdue > 0 ? `- Days Overdue: ${daysOverdue}` : ''}

Please process this payment at your earliest convenience to avoid any late fees or service interruptions.

${invoice.paymentUrl ? `Pay now: ${invoice.paymentUrl}\n` : ''}

If you've already sent payment, please disregard this notice.

Questions? Contact our billing department at accounting@zyphex.com

Zyphex Technologies
accounting@zyphex.com
    `.trim()

    return this.sendEmail({
      to: invoice.clientEmail || invoice.email,
      subject: `${urgencyLevel}: Payment Due for Invoice ${invoice.invoiceNumber || invoice.number}`,
      html,
      text
    })
  }

  /**
   * Generate payment confirmation HTML email
   */
  private generatePaymentConfirmationHTML(data: PaymentConfirmationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7fafc;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #10b981;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #d1fae5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
          }
          h1 {
            color: #10b981;
            margin: 0 0 10px;
            font-size: 28px;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
          }
          .details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-weight: 500;
          }
          .detail-value {
            color: #1a202c;
            font-weight: 600;
          }
          .amount-box {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            text-align: center;
            padding: 30px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .amount-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
          }
          .amount-value {
            font-size: 42px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
          .note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ZYPHEX</div>
            <div class="subtitle">Zyphex Technologies</div>
          </div>
          
          <div class="success-icon">✓</div>
          
          <h1>Payment Successful!</h1>
          <p class="subtitle">Your payment has been processed successfully.</p>
          
          <div class="amount-box">
            <div class="amount-label">Amount Paid</div>
            <div class="amount-value">$${data.amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}</div>
            <div>${data.currency}</div>
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number</span>
              <span class="detail-value">${data.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Date</span>
              <span class="detail-value">${data.paymentDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method</span>
              <span class="detail-value">${data.paymentMethod}</span>
            </div>
            ${data.transactionId ? `
            <div class="detail-row">
              <span class="detail-label">Transaction ID</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${data.transactionId}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="note">
            <strong>Receipt Attached:</strong> Your payment receipt is attached to this email as a PDF. 
            Please keep it for your records.
          </div>
          
          ${data.receiptUrl ? `
          <center>
            <a href="${data.receiptUrl}" class="button">View Receipt Online</a>
          </center>
          ` : ''}
          
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>If you have any questions, please contact us at support@zyphex.com</p>
            <p style="margin-top: 20px; font-size: 12px;">
              Zyphex Technologies<br>
              123 Business Street, Suite 100<br>
              San Francisco, CA 94105<br>
              +1 (555) 123-4567
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate payment confirmation plain text email
   */
  private generatePaymentConfirmationText(data: PaymentConfirmationData): string {
    return `
PAYMENT CONFIRMATION

Dear ${data.clientName},

Your payment has been successfully processed!

Amount Paid: $${data.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${data.currency}

Invoice Number: ${data.invoiceNumber}
Payment Date: ${data.paymentDate}
Payment Method: ${data.paymentMethod}
${data.transactionId ? `Transaction ID: ${data.transactionId}` : ''}

Your payment receipt is attached to this email as a PDF. Please keep it for your records.

Thank you for your business!

If you have any questions, please contact us at support@zyphex.com

---
Zyphex Technologies
123 Business Street, Suite 100
San Francisco, CA 94105
+1 (555) 123-4567
    `.trim()
  }

  /**
   * Generate payment failure HTML email
   */
  private generatePaymentFailureHTML(data: PaymentFailureData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7fafc;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #ef4444;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .error-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: #fee2e2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
          }
          h1 {
            color: #ef4444;
            margin: 0 0 10px;
            font-size: 28px;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
          }
          .error-box {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .error-message {
            color: #991b1b;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #64748b;
            font-weight: 500;
          }
          .detail-value {
            color: #1a202c;
            font-weight: 600;
          }
          .tips {
            margin: 20px 0;
          }
          .tip {
            padding: 12px;
            margin: 8px 0;
            background: #f0f9ff;
            border-left: 3px solid #3b82f6;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ZYPHEX</div>
            <div class="subtitle">Zyphex Technologies</div>
          </div>
          
          <div class="error-icon">✕</div>
          
          <h1>Payment Failed</h1>
          <p class="subtitle">We were unable to process your payment.</p>
          
          <div class="error-box">
            <div class="error-message">${data.errorMessage}</div>
            ${data.errorCode ? `<div style="font-size: 12px; color: #64748b;">Error Code: ${data.errorCode}</div>` : ''}
          </div>
          
          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number</span>
              <span class="detail-value">${data.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount</span>
              <span class="detail-value">$${data.amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} ${data.currency}</span>
            </div>
          </div>
          
          <div class="tips">
            <h3 style="color: #1a202c; margin-bottom: 15px;">What to do next:</h3>
            <div class="tip">
              ✓ Check that your card details are correct
            </div>
            <div class="tip">
              ✓ Verify you have sufficient funds available
            </div>
            <div class="tip">
              ✓ Contact your bank if the issue persists
            </div>
            <div class="tip">
              ✓ Try a different payment method
            </div>
          </div>
          
          <center>
            <a href="${data.retryUrl}" class="button">Try Again</a>
          </center>
          
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; color: #92400e;">
            <strong>Important:</strong> No charges were made to your account. Your invoice remains active.
          </div>
          
          <div class="footer">
            <p><strong>Need Help?</strong></p>
            <p>If you continue to experience issues, please contact our support team:</p>
            <p>Email: support@zyphex.com | Phone: +1 (555) 123-4567</p>
            <p style="margin-top: 20px; font-size: 12px;">
              Zyphex Technologies<br>
              123 Business Street, Suite 100<br>
              San Francisco, CA 94105
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate payment failure plain text email
   */
  private generatePaymentFailureText(data: PaymentFailureData): string {
    return `
PAYMENT FAILED

Dear ${data.clientName},

We were unable to process your payment.

Error: ${data.errorMessage}
${data.errorCode ? `Error Code: ${data.errorCode}` : ''}

Invoice Number: ${data.invoiceNumber}
Amount: $${data.amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${data.currency}

WHAT TO DO NEXT:
- Check that your card details are correct
- Verify you have sufficient funds available
- Contact your bank if the issue persists
- Try a different payment method

Try again: ${data.retryUrl}

IMPORTANT: No charges were made to your account. Your invoice remains active.

Need help? Contact our support team:
Email: support@zyphex.com
Phone: +1 (555) 123-4567

---
Zyphex Technologies
123 Business Street, Suite 100
San Francisco, CA 94105
    `.trim()
  }
}

// Singleton instance
export const emailService = new EmailService()
