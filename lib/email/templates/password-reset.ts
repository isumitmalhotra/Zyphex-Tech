/**
 * Password Reset Email Template
 * 
 * Sent to users when they request a password reset
 */

import {
  EmailTemplate,
  BaseTemplateData,
  generateBaseHTML,
  createButton,
  createInfoBox
} from './base'

export interface PasswordResetEmailData extends BaseTemplateData {
  recipientName?: string
  resetUrl: string
  expiryMinutes?: number
  ipAddress?: string
  userAgent?: string
}

export function generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
  const appName = data.appName || process.env.APP_NAME || 'Zyphex Tech'
  const recipientName = data.recipientName || 'there'
  const expiryMinutes = data.expiryMinutes || 60

  const content = `
    <div style="text-align: center; padding: 30px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">🔑</div>
      <h1 style="color: #667eea; margin: 0 0 10px; font-size: 32px;">Reset Your Password</h1>
      <p style="color: #6c757d; font-size: 18px; margin: 0;">Secure password reset request</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hi <strong>${recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      We received a request to reset your password for your ${appName} account.
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Click the button below to create a new password:
    </p>

    ${createButton(data.resetUrl, 'Reset Password')}

    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #6c757d; text-align: center;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #667eea; word-break: break-all; text-align: center;">
        ${data.resetUrl}
      </p>
    </div>

    ${createInfoBox(`
      <strong>⚠️ Security Notice:</strong> This password reset link will expire in 
      <strong>${expiryMinutes} minutes</strong> for security reasons.
    `, 'warning')}

    ${data.ipAddress ? `
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0; font-size: 13px; color: #6c757d;">
          <strong>Request Details:</strong><br>
          IP Address: ${data.ipAddress}${data.userAgent ? `<br>Device: ${data.userAgent}` : ''}
        </p>
      </div>
    ` : ''}

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin: 0 0 12px; color: #495057; font-size: 16px;">
        🔒 Password Security Tips
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 14px; line-height: 1.8;">
        <li>Use at least 8 characters with a mix of letters, numbers, and symbols</li>
        <li>Don't reuse passwords from other websites</li>
        <li>Consider using a password manager</li>
        <li>Enable two-factor authentication for extra security</li>
      </ul>
    </div>

    ${createInfoBox(`
      <strong>Didn't request this?</strong><br>
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged. 
      If you continue to receive these emails, please contact our support team immediately.
    `, 'error')}

    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
        Best regards,<br>
        <strong>The ${appName} Team</strong>
      </p>
    </div>
  `

  const html = generateBaseHTML(content, data)

  const text = `
Reset Your Password

Hi ${recipientName},

We received a request to reset your password for your ${appName} account.

RESET YOUR PASSWORD:
${data.resetUrl}

⚠️ SECURITY NOTICE: This password reset link will expire in ${expiryMinutes} minutes for security reasons.

${data.ipAddress ? `
REQUEST DETAILS:
IP Address: ${data.ipAddress}
${data.userAgent ? `Device: ${data.userAgent}` : ''}
` : ''}

PASSWORD SECURITY TIPS:
• Use at least 8 characters with a mix of letters, numbers, and symbols
• Don't reuse passwords from other websites
• Consider using a password manager
• Enable two-factor authentication for extra security

DIDN'T REQUEST THIS?
If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
If you continue to receive these emails, please contact our support team immediately.

Best regards,
The ${appName} Team

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
Security Questions? Contact us at ${data.supportEmail || process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}
  `.trim()

  return {
    subject: `Reset your password - ${appName}`,
    html,
    text
  }
}
