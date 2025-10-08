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
    <div style="text-align: center; padding: 40px 0 30px;">
      <div style="font-size: 72px; margin-bottom: 24px; animation: pulse 2s ease-in-out infinite;">📧</div>
      <h1 style="background: linear-gradient(135deg, #00bfff 0%, #0080ff 50%, #0066cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px; font-size: 36px; font-weight: 800;">Verify Your Email</h1>
      <p style="color: #64748b; font-size: 18px; margin: 0; font-weight: 500;">One more step to get started with Zyphex Tech</p>
    </div>

    <p style="font-size: 16px; line-height: 1.8; color: #1e293b;">
      Hi <strong style="color: #0080ff;">${recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.8; color: #1e293b;">
      Thank you for signing up for ${appName}! We're <strong>thrilled</strong> to have you on board. 
      Get ready to experience cutting-edge IT services and solutions.
    </p>

    <p style="font-size: 16px; line-height: 1.8; color: #1e293b;">
      To complete your registration and unlock all premium features, please verify your email address 
      by clicking the button below:
    </p>

    ${createButton(data.verificationUrl, '✓ Verify Email Address')}

    <div style="background: linear-gradient(135deg, rgba(0, 191, 255, 0.08) 0%, rgba(0, 128, 255, 0.08) 100%); padding: 20px; border-radius: 12px; margin: 28px 0; border: 1px solid rgba(0, 191, 255, 0.2);">
      <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center; font-weight: 500;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin: 12px 0 0; font-size: 13px; color: #0080ff; word-break: break-all; text-align: center; font-family: monospace;">
        ${data.verificationUrl}
      </p>
    </div>

    ${createInfoBox(`
      <strong>⏱️ Important:</strong> This verification link will expire in <strong>${expiryHours} hours</strong> for security reasons. Don't wait!
    `, 'warning')}

    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px;">🔒</span> Why verify your email?
      </h3>
      <ul style="margin: 0; padding-left: 24px; color: #475569; font-size: 15px; line-height: 2;">
        <li><strong>Secure your account</strong> and protect your valuable data</li>
        <li><strong>Receive important notifications</strong> and platform updates</li>
        <li><strong>Enable password recovery</strong> if you ever forget it</li>
        <li><strong>Access all premium features</strong> and services</li>
        <li><strong>Join our community</strong> of IT professionals</li>
      </ul>
    </div>

    ${createInfoBox(`
      <strong>🛡️ Didn't sign up?</strong> If you didn't create an account with ${appName}, please ignore this email. 
      Your email address will not be added to our system and no further action is required.
    `, 'info')}

    <div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #e2e8f0;">
      <p style="font-size: 16px; line-height: 1.6; color: #1e293b; margin: 0;">
        Best regards,<br>
        <strong style="background: linear-gradient(135deg, #00bfff 0%, #0066cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 18px;">The ${appName} Team</strong>
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
