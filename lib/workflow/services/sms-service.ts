/**
 * SMS Service Integration for Workflow Actions
 * 
 * Integrates with Twilio for sending SMS messages from workflow actions.
 */

import twilio from 'twilio';

// Initialize Twilio client
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export interface SmsOptions {
  to: string | string[];
  body: string;
  from?: string;
  mediaUrl?: string[]; // For MMS
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  to?: string;
  error?: string;
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSms(options: SmsOptions): Promise<SmsResult> {
  try {
    // Validate Twilio is configured
    if (!twilioClient) {
      console.warn('Twilio not configured, SMS not sent');
      return {
        success: false,
        error: 'Twilio credentials not configured',
      };
    }

    if (!TWILIO_PHONE_NUMBER && !options.from) {
      return {
        success: false,
        error: 'No from phone number configured',
      };
    }

    // Get phone numbers
    const from = options.from || TWILIO_PHONE_NUMBER;
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Validate phone numbers
    for (const phone of recipients) {
      if (!isValidPhoneNumber(phone)) {
        return {
          success: false,
          error: `Invalid phone number: ${phone}`,
        };
      }
    }

    // Send to first recipient (Twilio sends one at a time)
    const to = recipients[0];

    const messageOptions: Record<string, unknown> = {
      body: options.body,
      from,
      to,
    };

    // Add media URL for MMS
    if (options.mediaUrl && options.mediaUrl.length > 0) {
      messageOptions.mediaUrl = options.mediaUrl;
    }

    // @ts-expect-error - Twilio types are complex, messageOptions is compatible
    const message = await twilioClient.messages.create(messageOptions);

    return {
      success: true,
      messageId: message.sid,
      to: message.to,
    };
  } catch (error) {
    console.error('Twilio SMS error:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBatchSms(
  recipients: string[],
  body: string
): Promise<SmsResult[]> {
  const results: SmsResult[] = [];

  for (const recipient of recipients) {
    const result = await sendSms({ to: recipient, body });
    results.push(result);
  }

  return results;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic E.164 format validation
  // Should start with + and contain 10-15 digits
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string, countryCode = '1'): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if not present
  if (!cleaned.startsWith(countryCode)) {
    cleaned = countryCode + cleaned;
  }

  // Add + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Replace template variables in SMS body
 */
export function replaceSmsVariables(
  body: string,
  variables: Record<string, unknown>
): string {
  let result = body;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }

  return result;
}

/**
 * Truncate SMS message to fit within length limits
 */
export function truncateSmsMessage(
  message: string,
  maxLength = 160
): string {
  if (message.length <= maxLength) {
    return message;
  }

  // Truncate and add ellipsis
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Get SMS message segment count
 */
export function getSmsSegmentCount(message: string): number {
  const length = message.length;

  if (length === 0) return 0;
  if (length <= 160) return 1;
  if (length <= 306) return 2;

  // For longer messages, each segment is 153 characters
  return Math.ceil(length / 153);
}

/**
 * Create notification SMS message
 */
export function createNotificationSms(options: {
  title: string;
  message: string;
  url?: string;
}): string {
  let sms = `${options.title}\n\n${options.message}`;

  if (options.url) {
    sms += `\n\n${options.url}`;
  }

  return sms;
}

/**
 * Test Twilio configuration
 */
export async function testSmsConfiguration(): Promise<{
  configured: boolean;
  phoneNumber?: string;
  error?: string;
}> {
  if (!TWILIO_ACCOUNT_SID) {
    return {
      configured: false,
      error: 'TWILIO_ACCOUNT_SID environment variable not set',
    };
  }

  if (!TWILIO_AUTH_TOKEN) {
    return {
      configured: false,
      error: 'TWILIO_AUTH_TOKEN environment variable not set',
    };
  }

  if (!TWILIO_PHONE_NUMBER) {
    return {
      configured: false,
      error: 'TWILIO_PHONE_NUMBER environment variable not set',
    };
  }

  if (!twilioClient) {
    return {
      configured: false,
      error: 'Twilio client not initialized',
    };
  }

  try {
    // Verify credentials by fetching account info
    const _account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();

    return {
      configured: true,
      phoneNumber: TWILIO_PHONE_NUMBER,
    };
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const smsService = {
  sendSms,
  sendBatchSms,
  isValidPhoneNumber,
  formatPhoneNumber,
  replaceSmsVariables,
  truncateSmsMessage,
  getSmsSegmentCount,
  createNotificationSms,
  testSmsConfiguration,
};

export default smsService;
