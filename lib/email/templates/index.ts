/**
 * Email Templates Index
 * 
 * Central export point for all email templates
 */

export { generateWelcomeEmail } from './welcome'
export type { WelcomeEmailData } from './welcome'

export { generateVerificationEmail } from './verification'
export type { VerificationEmailData } from './verification'

export { generatePasswordResetEmail } from './password-reset'
export type { PasswordResetEmailData } from './password-reset'

export { generateInvoiceEmail } from './invoice'
export type { InvoiceEmailData } from './invoice'

export { generatePaymentConfirmationEmail } from './payment-confirmation'
export type { PaymentConfirmationEmailData } from './payment-confirmation'

export { 
  generateMeetingInvitationEmail,
  generateMeetingReminderEmail,
  generateMeetingCancellationEmail,
  generateMeetingSummaryEmail
} from './meeting'
export type { 
  MeetingInvitationData,
  MeetingReminderData,
  MeetingCancellationData,
  MeetingSummaryData
} from './meeting'


export type { EmailTemplate, BaseTemplateData } from './base'
