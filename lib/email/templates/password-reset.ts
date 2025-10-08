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
    <div style="text-align: center; padding: 40px 0 30px;">
      <div style="font-size: 72px; margin-bottom: 24px;">🔑</div>
      <h1 style="background: linear-gradient(135deg, #00bfff 0%, #0080ff 50%, #0066cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px; font-size: 36px; font-weight: 800;">Reset Your Password</h1>
      <p style="color: #64748b; font-size: 18px; margin: 0; font-weight: 500;">Secure password reset request</p>
    </div>

    <p style="font-size: 16px; line-height: 1.8; color: #1e293b;">
      Hi <strong style="color: #0080ff;">${recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.8; color: #1e293b;">
      We received a request to reset your password for your ${appName} account. No worries, it happens to the best of us! 🔐
    </p>

    <p style="font-size: 16px; line-height: 1.8; color: #1e293b;">
      Click the button below to create a new secure password:
    </p>

    ${createButton(data.resetUrl, '🔒 Reset Password')}

    <div style="background: linear-gradient(135deg, rgba(0, 191, 255, 0.08) 0%, rgba(0, 128, 255, 0.08) 100%); padding: 20px; border-radius: 12px; margin: 28px 0; border: 1px solid rgba(0, 191, 255, 0.2);">
      <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center; font-weight: 500;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #0080ff; word-break: break-all; text-align: center; font-family: monospace;">
        ${data.resetUrl}
      </p>
    </div>

    ${createInfoBox(`
      <strong>⚠️ Security Notice:</strong> This password reset link will expire in 
      <strong>${expiryMinutes} minutes</strong> for security reasons. Act quickly!
    `, 'warning')}

    ${data.ipAddress ? `
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.8;">
          <strong style="color: #0f172a; font-size: 15px;">📍 Request Details:</strong><br>
          <span style="color: #64748b;">IP Address:</span> <code style="background: white; padding: 2px 6px; border-radius: 4px; color: #0080ff;">${data.ipAddress}</code>${data.userAgent ? `<br><span style="color: #64748b;">Device:</span> ${data.userAgent}` : ''}
        </p>
      </div>
    ` : ''}

    <div style="background: linear-gradient(135deg, rgba(0, 191, 255, 0.05) 0%, rgba(0, 102, 204, 0.05) 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid rgba(0, 191, 255, 0.15);">
      <h3 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">🔒</span> Password Security Tips
      </h3>
      <ul style="margin: 0; padding-left: 24px; color: #475569; font-size: 14px; line-height: 2;">
        <li><strong>Use at least 8 characters</strong> with a mix of letters, numbers, and symbols</li>
        <li><strong>Don't reuse passwords</strong> from other websites or accounts</li>
        <li><strong>Consider using a password manager</strong> to generate and store secure passwords</li>
        <li><strong>Enable two-factor authentication</strong> for extra security layer</li>
        <li><strong>Avoid personal information</strong> like birthdays or names</li>
      </ul>
    </div>

    ${createInfoBox(`
      <strong>🛡️ Didn't request this?</strong><br>
      If you didn't request a password reset, please <strong>ignore this email</strong>. Your password will remain unchanged and secure. 
      If you continue to receive these emails, please contact our support team immediately for assistance.
    `, 'error')}

    <div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #e2e8f0;">
      <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0;">
        Stay secure! 🛡️<br>
        <strong style="background: linear-gradient(135deg, #00bfff 0%, #0066cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 18px;">The ${appName} Security Team</strong>
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
