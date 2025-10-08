/**
 * Unified Email Service
 * 
 * Supports multiple email providers (Resend and Nodemailer)
 * with retry logic, queue system, and comprehensive error handling
 */

import { Resend } from 'resend'
import * as nodemailer from 'nodemailer'
import { getEmailConfig, EmailProvider } from './config'

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
  encoding?: string
}

export interface SendEmailOptions {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  provider?: EmailProvider
  attempts?: number
}

/**
 * Email queue item for retry logic
 */
interface QueuedEmail {
  id: string
  options: SendEmailOptions
  attempts: number
  lastError?: string
  createdAt: Date
  nextRetry?: Date
}

class UnifiedEmailService {
  private resendClient?: Resend
  private nodemailerTransport?: nodemailer.Transporter
  private emailQueue: Map<string, QueuedEmail> = new Map()
  private config: ReturnType<typeof getEmailConfig>

  constructor() {
    this.config = getEmailConfig()
    this.initializeProvider()
  }

  /**
   * Initialize the email provider
   */
  private initializeProvider(): void {
    if (this.config.provider === 'resend') {
      if (!this.config.resend?.apiKey) {
        throw new Error('Resend API key not configured')
      }
      this.resendClient = new Resend(this.config.resend.apiKey)
    } else if (this.config.provider === 'nodemailer') {
      if (!this.config.smtp) {
        throw new Error('SMTP configuration not found')
      }
      
      this.nodemailerTransport = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure,
        auth: {
          user: this.config.smtp.auth.user,
          pass: this.config.smtp.auth.pass
        },
        pool: this.config.smtp.pool,
        maxConnections: this.config.smtp.maxConnections,
        maxMessages: this.config.smtp.maxMessages,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV !== 'development'
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      } as any)  // Type assertion needed for nodemailer's complex types
    }
  }

  /**
   * Send email with retry logic
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailResult> {
    // Development mode: redirect all emails
    if (process.env.NODE_ENV === 'development' && this.config.development.catchAllEmail) {
      options.to = this.config.development.catchAllEmail
      if (options.cc) options.cc = []
      if (options.bcc) options.bcc = []
    }

    // Preview mode: don't actually send
    if (this.config.development.enablePreview) {
      console.log('📧 Email Preview Mode - Email would be sent:', {
        to: options.to,
        subject: options.subject,
        provider: this.config.provider
      })
      return {
        success: true,
        messageId: `preview-${Date.now()}`,
        provider: this.config.provider
      }
    }

    // Attempt to send with retries
    let lastError: string = ''
    
    for (let attempt = 1; attempt <= this.config.retry.maxRetries; attempt++) {
      try {
        const result = await this.attemptSend(options)
        
        if (result.success) {
          if (process.env.ENABLE_EMAIL_LOGGING === 'true') {
            console.log('✅ Email sent successfully:', {
              to: options.to,
              subject: options.subject,
              messageId: result.messageId,
              provider: this.config.provider,
              attempts: attempt
            })
          }
          
          return {
            ...result,
            attempts: attempt
          }
        }
        
        lastError = result.error || 'Unknown error'
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        
        if (process.env.ENABLE_EMAIL_LOGGING === 'true') {
          console.error(`❌ Email send attempt ${attempt} failed:`, {
            to: options.to,
            subject: options.subject,
            error: lastError,
            provider: this.config.provider
          })
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < this.config.retry.maxRetries) {
        await this.sleep(this.config.retry.retryDelay * attempt)
      }
    }

    // All retries failed
    console.error('❌ Email send failed after all retries:', {
      to: options.to,
      subject: options.subject,
      error: lastError,
      provider: this.config.provider,
      attempts: this.config.retry.maxRetries
    })

    return {
      success: false,
      error: lastError,
      provider: this.config.provider,
      attempts: this.config.retry.maxRetries
    }
  }

  /**
   * Attempt to send email once
   */
  private async attemptSend(options: SendEmailOptions): Promise<EmailResult> {
    if (this.config.provider === 'resend') {
      return this.sendViaResend(options)
    } else {
      return this.sendViaNodemailer(options)
    }
  }

  /**
   * Send via Resend
   */
  private async sendViaResend(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.resendClient) {
      return {
        success: false,
        error: 'Resend client not initialized',
        provider: 'resend'
      }
    }

    try {
      const from = options.from || `${this.config.from.name} <${this.config.from.email}>`
      
      const result = await this.resendClient.emails.send({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        replyTo: options.replyTo,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content instanceof Buffer ? att.content : Buffer.from(att.content),
          ...(att.contentType && { content_type: att.contentType })
        }))
      })

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
          provider: 'resend'
        }
      }

      return {
        success: true,
        messageId: result.data?.id,
        provider: 'resend'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Resend error',
        provider: 'resend'
      }
    }
  }

  /**
   * Send via Nodemailer
   */
  private async sendViaNodemailer(options: SendEmailOptions): Promise<EmailResult> {
    if (!this.nodemailerTransport) {
      return {
        success: false,
        error: 'Nodemailer transport not initialized',
        provider: 'nodemailer'
      }
    }

    try {
      const from = options.from || `"${this.config.from.name}" <${this.config.from.email}>`
      
      const result = await this.nodemailerTransport.sendMail({
        from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          encoding: att.encoding
        }))
      })

      return {
        success: true,
        messageId: result.messageId,
        provider: 'nodemailer'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Nodemailer error',
        provider: 'nodemailer'
      }
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<{
    success: boolean
    message: string
    provider: EmailProvider
    details?: any
  }> {
    try {
      if (this.config.provider === 'resend') {
        // Resend doesn't have a verify method, so we'll just check if client is initialized
        if (!this.resendClient) {
          return {
            success: false,
            message: 'Resend client not initialized',
            provider: 'resend'
          }
        }

        return {
          success: true,
          message: 'Resend client initialized successfully',
          provider: 'resend',
          details: {
            apiKey: this.config.resend?.apiKey.slice(0, 10) + '...'
          }
        }
      } else {
        // Nodemailer has a verify method
        if (!this.nodemailerTransport) {
          return {
            success: false,
            message: 'Nodemailer transport not initialized',
            provider: 'nodemailer'
          }
        }

        await this.nodemailerTransport.verify()

        return {
          success: true,
          message: 'SMTP connection verified successfully',
          provider: 'nodemailer',
          details: {
            host: this.config.smtp?.host,
            port: this.config.smtp?.port,
            secure: this.config.smtp?.secure,
            user: this.config.smtp?.auth.user
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        provider: this.config.provider
      }
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<EmailResult> {
    const appName = this.config.from.name
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f7; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
          .success { background: #d4edda; border: 1px solid #28a745; padding: 16px; border-radius: 6px; margin: 20px 0; color: #155724; }
          .details { background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .details p { margin: 8px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🧪 Test Email</h1>
          </div>
          <div class="success">
            <strong>✅ Success!</strong> Your email configuration is working correctly.
          </div>
          <p>This is a test email from <strong>${appName}</strong>.</p>
          <div class="details">
            <p><strong>Configuration Details:</strong></p>
            <p>Provider: <strong>${this.config.provider.toUpperCase()}</strong></p>
            ${this.config.provider === 'nodemailer' ? `
              <p>SMTP Host: ${this.config.smtp?.host}</p>
              <p>SMTP Port: ${this.config.smtp?.port}</p>
            ` : ''}
            <p>From: ${this.config.from.email}</p>
            <p>Test Time: ${new Date().toISOString()}</p>
          </div>
          <p>If you received this email, your email service is configured correctly!</p>
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The ${appName} Team</strong>
          </p>
        </div>
      </body>
      </html>
    `

    return this.sendEmail({
      to,
      subject: `Test Email from ${appName} - ${new Date().toLocaleString()}`,
      html,
      text: `Test Email\n\nThis is a test email from ${appName}.\n\nProvider: ${this.config.provider}\nTest Time: ${new Date().toISOString()}\n\nIf you received this email, your email service is configured correctly!`
    })
  }

  /**
   * Strip HTML tags for plain text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    size: number
    items: Array<{
      id: string
      to: string | string[]
      subject: string
      attempts: number
      lastError?: string
    }>
  } {
    const items = Array.from(this.emailQueue.values()).map(item => ({
      id: item.id,
      to: item.options.to,
      subject: item.options.subject,
      attempts: item.attempts,
      lastError: item.lastError
    }))

    return {
      size: this.emailQueue.size,
      items
    }
  }
}

// Export singleton instance
export const emailService = new UnifiedEmailService()

// Export class for testing
export { UnifiedEmailService }
