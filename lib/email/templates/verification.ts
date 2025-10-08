/**
 * Email Verification Template
 * 
 * Sent to users to verify their email address
 */

import {
  EmailTemplate,
  BaseTemplateData,
  generateBaseHTML,
  createButton,
  createInfoBox
} from './base'

export interface VerificationEmailData extends BaseTemplateData {
  recipientName?: string
  verificationUrl: string
  expiryHours?: number
}

export function generateVerificationEmail(data: VerificationEmailData): EmailTemplate {
  const appName = data.appName || process.env.APP_NAME || 'Zyphex Tech'
  const recipientName = data.recipientName || 'there'
  const expiryHours = data.expiryHours || 24

  const content = `
    <div style="text-align: center; padding: 30px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">📧</div>
      <h1 style="color: #667eea; margin: 0 0 10px; font-size: 32px;">Verify Your Email</h1>
      <p style="color: #6c757d; font-size: 18px; margin: 0;">One more step to get started</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hi <strong>${recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Thank you for signing up for ${appName}! We're excited to have you on board.
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      To complete your registration and access all features, please verify your email address 
      by clicking the button below:
    </p>

    ${createButton(data.verificationUrl, 'Verify Email Address')}

    <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #6c757d; text-align: center;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #667eea; word-break: break-all; text-align: center;">
        ${data.verificationUrl}
      </p>
    </div>

    ${createInfoBox(`
      <strong>⏱️ Important:</strong> This verification link will expire in <strong>${expiryHours} hours</strong> for security reasons.
    `, 'warning')}

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin: 0 0 12px; color: #495057; font-size: 16px;">
        🔒 Why verify your email?
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 14px; line-height: 1.8;">
        <li>Secure your account and protect your data</li>
        <li>Receive important notifications and updates</li>
        <li>Reset your password if you forget it</li>
        <li>Access all premium features</li>
      </ul>
    </div>

    ${createInfoBox(`
      If you didn't create an account with ${appName}, please ignore this email. 
      Your email address will not be added to our system.
    `, 'info')}

    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
        Best regards,<br>
        <strong>The ${appName} Team</strong>
      </p>
    </div>
  `

  const html = generateBaseHTML(content, data)

  const text = `
Verify Your Email Address

Hi ${recipientName},

Thank you for signing up for ${appName}! We're excited to have you on board.

To complete your registration and access all features, please verify your email address by clicking the link below:

${data.verificationUrl}

⏱️ IMPORTANT: This verification link will expire in ${expiryHours} hours for security reasons.

WHY VERIFY YOUR EMAIL?
• Secure your account and protect your data
• Receive important notifications and updates
• Reset your password if you forget it
• Access all premium features

If you didn't create an account with ${appName}, please ignore this email.

Best regards,
The ${appName} Team

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
Need help? Contact us at ${data.supportEmail || process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}
  `.trim()

  return {
    subject: `Verify your email address - ${appName}`,
    html,
    text
  }
}
