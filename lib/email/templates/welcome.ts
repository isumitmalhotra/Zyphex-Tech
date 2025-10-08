/**
 * Welcome Email Template
 * 
 * Sent to users after successful email verification
 */

import {
  EmailTemplate,
  BaseTemplateData,
  generateBaseHTML,
  createButton,
  createInfoBox
} from './base'

export interface WelcomeEmailData extends BaseTemplateData {
  recipientName: string
  dashboardUrl?: string
  features?: string[]
}

export function generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
  const appName = data.appName || process.env.APP_NAME || 'Zyphex Tech'
  const dashboardUrl = data.dashboardUrl || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`
  
  const defaultFeatures = [
    '✅ Access your personalized dashboard',
    '✅ Explore our premium IT services',
    '✅ Contact our expert team',
    '✅ View your project portfolio',
    '✅ Get priority support'
  ]
  
  const features = data.features || defaultFeatures

  const content = `
    <div style="text-align: center; padding: 30px 0;">
      <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
      <h1 style="color: #667eea; margin: 0 0 10px; font-size: 32px;">Welcome to ${appName}!</h1>
      <p style="color: #6c757d; font-size: 18px; margin: 0;">We're excited to have you on board</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Hi <strong>${data.recipientName}</strong>,
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Your email has been verified successfully! Welcome to our platform. 
      We're thrilled to have you join our community.
    </p>

    ${createInfoBox(`
      <strong>What you can do now:</strong><br><br>
      ${features.join('<br>')}
    `, 'success')}

    <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 30px;">
      Ready to get started? Click the button below to access your dashboard:
    </p>

    ${createButton(dashboardUrl, 'Go to Dashboard')}

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="margin: 0 0 12px; color: #495057; font-size: 16px;">
        💡 Getting Started Tips
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 14px; line-height: 1.8;">
        <li>Complete your profile to personalize your experience</li>
        <li>Explore our services to find the right solution for you</li>
        <li>Check out our portfolio to see our previous work</li>
        <li>Reach out to our team if you have any questions</li>
      </ul>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      If you have any questions or need assistance, our support team is here to help! 
      Don't hesitate to reach out.
    </p>

    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e9ecef;">
      <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
        Best regards,<br>
        <strong>The ${appName} Team</strong>
      </p>
    </div>
  `

  const html = generateBaseHTML(content, data)

  const text = `
Welcome to ${appName}!

Hi ${data.recipientName},

Your email has been verified successfully! Welcome to our platform. We're thrilled to have you join our community.

WHAT YOU CAN DO NOW:
${features.map(f => f.replace('✅ ', '• ')).join('\n')}

GETTING STARTED TIPS:
• Complete your profile to personalize your experience
• Explore our services to find the right solution for you
• Check out our portfolio to see our previous work
• Reach out to our team if you have any questions

ACCESS YOUR DASHBOARD:
${dashboardUrl}

If you have any questions or need assistance, our support team is here to help!

Best regards,
The ${appName} Team

---
© ${new Date().getFullYear()} ${appName}. All rights reserved.
Need help? Contact us at ${data.supportEmail || process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}
  `.trim()

  return {
    subject: `Welcome to ${appName}! 🎉`,
    html,
    text
  }
}
