/**
 * Email Service Integration for Workflow Actions
 * 
 * Integrates with SendGrid for sending transactional and template emails
 * from workflow actions.
 */

import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: 'attachment' | 'inline';
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Validate API key is configured
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, email not sent');
      return {
        success: false,
        error: 'SendGrid API key not configured',
      };
    }

    // Set default from address
    const from = options.from || process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@example.com';

    // Build email message
    const msg: {
      to: string | string[];
      from: string;
      subject: string;
      cc?: string | string[];
      bcc?: string | string[];
      replyTo?: string;
      templateId?: string;
      dynamicTemplateData?: Record<string, unknown>;
      text?: string;
      html?: string;
      attachments?: Array<{ content: string; filename: string; type?: string; disposition?: string }>;
    } = {
      to: options.to,
      from,
      subject: options.subject,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
    };

    // Add content (template or HTML/text)
    if (options.templateId) {
      msg.templateId = options.templateId;
      msg.dynamicTemplateData = options.dynamicTemplateData || {};
    } else {
      msg.text = options.text || '';
      msg.html = options.html || options.text || '';
    }

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      msg.attachments = options.attachments;
    }

    // Send email
    // @ts-expect-error - SendGrid type complexity - msg is compatible with MailDataRequired
    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error: unknown) {
    console.error('SendGrid email error:', error);
    
    // Extract error message
    let errorMessage = 'Unknown error';
    if (error && typeof error === 'object' && 'response' in error) {
      const sendGridError = error as { response?: { body?: { errors?: Array<{ message: string }> } }; message?: string };
      if (sendGridError.response?.body?.errors) {
        errorMessage = sendGridError.response.body.errors.map((e: { message: string }) => e.message).join(', ');
      } else if (sendGridError.message) {
        errorMessage = sendGridError.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(emails: EmailOptions[]): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const email of emails) {
    const result = await sendEmail(email);
    results.push(result);
  }

  return results;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract email addresses from various formats
 */
export function extractEmails(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.filter(isValidEmail);
  }

  // Split by comma, semicolon, or space
  return input
    .split(/[,;\s]+/)
    .map(email => email.trim())
    .filter(email => email && isValidEmail(email));
}

/**
 * Replace template variables in email content
 */
export function replaceTemplateVariables(
  content: string,
  variables: Record<string, unknown>
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }

  return result;
}

/**
 * Generate HTML from plain text
 */
export function textToHtml(text: string): string {
  return text
    .split('\n')
    .map(line => `<p>${line}</p>`)
    .join('\n');
}

/**
 * Test SendGrid configuration
 */
export async function testEmailConfiguration(): Promise<{
  configured: boolean;
  error?: string;
}> {
  if (!SENDGRID_API_KEY) {
    return {
      configured: false,
      error: 'SENDGRID_API_KEY environment variable not set',
    };
  }

  if (!process.env.SENDGRID_FROM_EMAIL && !process.env.EMAIL_FROM) {
    return {
      configured: false,
      error: 'SENDGRID_FROM_EMAIL or EMAIL_FROM environment variable not set',
    };
  }

  return { configured: true };
}

const emailService = {
  sendEmail,
  sendBatchEmails,
  isValidEmail,
  extractEmails,
  replaceTemplateVariables,
  textToHtml,
  testEmailConfiguration,
};

export default emailService;
