/**
 * Email Configuration Module
 * 
 * Centralized email configuration with validation and multi-provider support
 * Supports both Resend (recommended) and traditional SMTP via Nodemailer
 */

// Load environment variables in Node.js environment (for scripts)
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  try {
    require('dotenv').config()
  } catch (e) {
    // dotenv not available, that's okay in Next.js context
  }
}

export type EmailProvider = 'resend' | 'nodemailer'

export interface EmailConfig {
  provider: EmailProvider
  from: {
    email: string
    name: string
  }
  resend?: {
    apiKey: string
  }
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
    pool?: boolean
    maxConnections?: number
    maxMessages?: number
  }
  features: {
    verification: {
      enabled: boolean
      required: boolean
      tokenExpiry: string
    }
    welcomeEmail: boolean
    passwordReset: boolean
    paymentConfirmation: boolean
  }
  retry: {
    maxRetries: number
    retryDelay: number
  }
  development: {
    catchAllEmail?: string
    enablePreview: boolean
  }
}

export class EmailConfigError extends Error {
  constructor(
    message: string,
    public field?: string,
    public suggestion?: string
  ) {
    super(message)
    this.name = 'EmailConfigError'
  }
}

/**
 * Validate and load email configuration from environment variables
 */
export function loadEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || 'resend') as EmailProvider
  
  // Validate provider
  if (!['resend', 'nodemailer'].includes(provider)) {
    throw new EmailConfigError(
      `Invalid EMAIL_PROVIDER: ${provider}. Must be 'resend' or 'nodemailer'`,
      'EMAIL_PROVIDER',
      'Set EMAIL_PROVIDER to either "resend" or "nodemailer" in your .env file'
    )
  }

  // Get from email configuration
  const fromEmail = process.env.EMAIL_FROM
  const fromName = process.env.EMAIL_FROM_NAME || 'Zyphex Technologies'

  if (!fromEmail) {
    throw new EmailConfigError(
      'EMAIL_FROM is required',
      'EMAIL_FROM',
      'Set EMAIL_FROM to your sender email address (e.g., noreply@yourdomain.com)'
    )
  }

  // Validate email format
  if (!isValidEmail(fromEmail)) {
    throw new EmailConfigError(
      `Invalid EMAIL_FROM format: ${fromEmail}`,
      'EMAIL_FROM',
      'EMAIL_FROM must be a valid email address'
    )
  }

  // Base configuration
  const config: EmailConfig = {
    provider,
    from: {
      email: fromEmail,
      name: fromName
    },
    features: {
      verification: {
        enabled: process.env.EMAIL_VERIFICATION_ENABLED === 'true',
        required: process.env.EMAIL_VERIFICATION_REQUIRED === 'true',
        tokenExpiry: process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '24h'
      },
      welcomeEmail: process.env.WELCOME_EMAIL_ENABLED !== 'false',
      passwordReset: process.env.PASSWORD_RESET_EMAIL_ENABLED !== 'false',
      paymentConfirmation: process.env.PAYMENT_CONFIRMATION_EMAIL_ENABLED !== 'false'
    },
    retry: {
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '5000', 10)
    },
    development: {
      catchAllEmail: process.env.DEV_EMAIL_CATCH_ALL,
      enablePreview: process.env.ENABLE_EMAIL_PREVIEW === 'true'
    }
  }

  // Provider-specific configuration
  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      throw new EmailConfigError(
        'RESEND_API_KEY is required when using Resend provider',
        'RESEND_API_KEY',
        'Get your API key from https://resend.com/api-keys and add it to your .env file'
      )
    }

    if (!apiKey.startsWith('re_')) {
      throw new EmailConfigError(
        'Invalid RESEND_API_KEY format',
        'RESEND_API_KEY',
        'Resend API keys should start with "re_"'
      )
    }

    config.resend = { apiKey }
  } else if (provider === 'nodemailer') {
    const host = process.env.EMAIL_SERVER_HOST
    const port = process.env.EMAIL_SERVER_PORT
    const user = process.env.EMAIL_SERVER_USER
    const pass = process.env.EMAIL_SERVER_PASSWORD

    if (!host) {
      throw new EmailConfigError(
        'EMAIL_SERVER_HOST is required when using Nodemailer',
        'EMAIL_SERVER_HOST',
        'Set EMAIL_SERVER_HOST to your SMTP server (e.g., smtp.gmail.com)'
      )
    }

    if (!port) {
      throw new EmailConfigError(
        'EMAIL_SERVER_PORT is required when using Nodemailer',
        'EMAIL_SERVER_PORT',
        'Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)'
      )
    }

    if (!user) {
      throw new EmailConfigError(
        'EMAIL_SERVER_USER is required when using Nodemailer',
        'EMAIL_SERVER_USER',
        'Set EMAIL_SERVER_USER to your SMTP username (often your email address)'
      )
    }

    if (!pass) {
      throw new EmailConfigError(
        'EMAIL_SERVER_PASSWORD is required when using Nodemailer',
        'EMAIL_SERVER_PASSWORD',
        'Set EMAIL_SERVER_PASSWORD to your SMTP password or app-specific password'
      )
    }

    const portNumber = parseInt(port, 10)
    if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
      throw new EmailConfigError(
        `Invalid EMAIL_SERVER_PORT: ${port}`,
        'EMAIL_SERVER_PORT',
        'Port must be a number between 1 and 65535'
      )
    }

    config.smtp = {
      host,
      port: portNumber,
      secure: portNumber === 465, // SSL for port 465, TLS for others
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 10
    }
  }

  return config
}

/**
 * Validate email configuration without throwing errors
 */
export function validateEmailConfig(): {
  valid: boolean
  errors: EmailConfigError[]
  warnings: string[]
  config?: EmailConfig
} {
  const errors: EmailConfigError[] = []
  const warnings: string[] = []

  try {
    const config = loadEmailConfig()

    // Additional validation checks
    if (config.provider === 'nodemailer' && config.smtp) {
      // Warn about common SMTP issues
      if (config.smtp.host.includes('gmail') && !config.smtp.auth.pass.includes(' ')) {
        warnings.push(
          'Gmail detected: Make sure you are using an App Password, not your regular password. ' +
          'Enable 2FA and generate an App Password at: https://myaccount.google.com/apppasswords'
        )
      }

      if (config.smtp.port === 25) {
        warnings.push(
          'Port 25 is often blocked by ISPs. Consider using port 587 (TLS) or 465 (SSL) instead.'
        )
      }

      if (!config.smtp.secure && config.smtp.port !== 587) {
        warnings.push(
          'Using unencrypted connection. Consider using port 587 with TLS or port 465 with SSL.'
        )
      }
    }

    // Development mode warnings
    if (process.env.NODE_ENV === 'production') {
      if (config.development.enablePreview) {
        warnings.push(
          'ENABLE_EMAIL_PREVIEW is enabled in production. Emails may not be sent!'
        )
      }

      if (config.from.email.includes('localhost') || config.from.email.includes('example')) {
        warnings.push(
          'EMAIL_FROM contains a non-production email address. Use a verified domain email.'
        )
      }

      if (!config.features.verification.required) {
        warnings.push(
          'EMAIL_VERIFICATION_REQUIRED is false in production. Consider requiring email verification.'
        )
      }
    }

    return {
      valid: true,
      errors: [],
      warnings,
      config
    }
  } catch (error) {
    if (error instanceof EmailConfigError) {
      errors.push(error)
    } else {
      errors.push(
        new EmailConfigError(
          error instanceof Error ? error.message : 'Unknown configuration error'
        )
      )
    }

    return {
      valid: false,
      errors,
      warnings
    }
  }
}

/**
 * Get email configuration with caching
 */
let cachedConfig: EmailConfig | null = null

export function getEmailConfig(): EmailConfig {
  if (!cachedConfig) {
    cachedConfig = loadEmailConfig()
  }
  return cachedConfig
}

/**
 * Clear cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get SMTP provider suggestions based on common hosts
 */
export function getProviderInfo(host?: string): {
  name: string
  documentation?: string
  commonIssues?: string[]
} {
  if (!host) {
    return { name: 'Unknown' }
  }

  const hostLower = host.toLowerCase()

  if (hostLower.includes('gmail')) {
    return {
      name: 'Gmail',
      documentation: 'https://support.google.com/mail/answer/7126229',
      commonIssues: [
        'Requires App Password (not regular password)',
        'Enable 2-Factor Authentication first',
        'Use port 587 with TLS or 465 with SSL'
      ]
    }
  }

  if (hostLower.includes('sendgrid')) {
    return {
      name: 'SendGrid',
      documentation: 'https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api',
      commonIssues: [
        'Username must be "apikey"',
        'Password is your SendGrid API key',
        'Use port 587 or 465'
      ]
    }
  }

  if (hostLower.includes('mailgun')) {
    return {
      name: 'Mailgun',
      documentation: 'https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp',
      commonIssues: [
        'Use postmaster@yourdomain.mailgun.org as username',
        'Find SMTP credentials in Mailgun domain settings',
        'Verify your domain first'
      ]
    }
  }

  if (hostLower.includes('ses') || hostLower.includes('amazonaws')) {
    return {
      name: 'AWS SES',
      documentation: 'https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html',
      commonIssues: [
        'Must verify email/domain in AWS SES console',
        'Account starts in sandbox mode (limited sending)',
        'Use SMTP credentials (different from AWS access keys)'
      ]
    }
  }

  if (hostLower.includes('outlook') || hostLower.includes('office365')) {
    return {
      name: 'Outlook/Office 365',
      documentation: 'https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353',
      commonIssues: [
        'Use smtp.office365.com on port 587',
        'May require app password',
        'Check if SMTP is enabled for your account'
      ]
    }
  }

  if (hostLower.includes('zoho')) {
    return {
      name: 'Zoho Mail',
      documentation: 'https://www.zoho.com/mail/help/zoho-smtp.html',
      commonIssues: [
        'Use smtp.zoho.com on port 587',
        'Enable IMAP/SMTP access in settings',
        'May require app-specific password'
      ]
    }
  }

  if (hostLower.includes('titan')) {
    return {
      name: 'Titan Email',
      documentation: 'https://support.titan.email/hc/en-us/articles/900002432563',
      commonIssues: [
        'Use smtp.titan.email on port 587',
        'Use full email address as username',
        'Check if account is active'
      ]
    }
  }

  return { name: 'Custom SMTP' }
}

/**
 * Format configuration for display
 */
export function formatConfigForDisplay(config: EmailConfig): string {
  const lines = [
    '📧 Email Configuration',
    '═══════════════════════',
    '',
    `Provider: ${config.provider.toUpperCase()}`,
    `From: ${config.from.name} <${config.from.email}>`,
    ''
  ]

  if (config.provider === 'resend') {
    lines.push(`Resend API Key: ${config.resend?.apiKey.slice(0, 10)}...`)
  } else if (config.smtp) {
    const providerInfo = getProviderInfo(config.smtp.host)
    lines.push(`SMTP Provider: ${providerInfo.name}`)
    lines.push(`Host: ${config.smtp.host}`)
    lines.push(`Port: ${config.smtp.port} (${config.smtp.secure ? 'SSL' : 'TLS'})`)
    lines.push(`User: ${config.smtp.auth.user}`)
  }

  lines.push('')
  lines.push('Features:')
  lines.push(`  Email Verification: ${config.features.verification.enabled ? '✓' : '✗'}`)
  lines.push(`  Verification Required: ${config.features.verification.required ? '✓' : '✗'}`)
  lines.push(`  Welcome Emails: ${config.features.welcomeEmail ? '✓' : '✗'}`)
  lines.push(`  Password Reset: ${config.features.passwordReset ? '✓' : '✗'}`)
  lines.push(`  Payment Confirmation: ${config.features.paymentConfirmation ? '✓' : '✗'}`)

  if (process.env.NODE_ENV === 'development') {
    lines.push('')
    lines.push('Development:')
    if (config.development.catchAllEmail) {
      lines.push(`  Catch-All Email: ${config.development.catchAllEmail}`)
    }
    lines.push(`  Preview Mode: ${config.development.enablePreview ? '✓' : '✗'}`)
  }

  return lines.join('\n')
}
