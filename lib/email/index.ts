/**
 * Email Service - Central Export Point
 * 
 * Usage:
 *   import { emailService } from '@/lib/email'
 *   import { generateWelcomeEmail } from '@/lib/email'
 */

// Main email service
export { emailService } from './service'
export type { SendEmailOptions, EmailResult, EmailAttachment } from './service'

// Configuration
export { 
  getEmailConfig, 
  validateEmailConfig,
  formatConfigForDisplay,
  getProviderInfo 
} from './config'
export type { EmailConfig, EmailProvider } from './config'

// Templates
export {
  generateWelcomeEmail,
  generateVerificationEmail,
  generatePasswordResetEmail,
  generateInvoiceEmail,
  generatePaymentConfirmationEmail
} from './templates'

export type {
  EmailTemplate,
  BaseTemplateData,
  WelcomeEmailData,
  VerificationEmailData,
  PasswordResetEmailData,
  InvoiceEmailData,
  PaymentConfirmationEmailData
} from './templates'
