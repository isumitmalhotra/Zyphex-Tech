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
    <div style="text-align: center; padding: 40px 0 30px;">
      <div style="font-size: 80px; margin-bottom: 24px; animation: bounce 1s ease-in-out;">🎉</div>
      <h1 style="background: linear-gradient(135deg, #00bfff 0%, #0080ff 50%, #0066cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0 0 12px; font-size: 40px; font-weight: 800;">Welcome to ${appName}!</h1>
      <p style="color: #64748b; font-size: 20px; margin: 0; font-weight: 500;">We're thrilled to have you on board 🚀</p>
    </div>

    <p style="font-size: 17px; line-height: 1.8; color: #1e293b;">
      Hi <strong style="color: #0080ff;">${data.recipientName}</strong>,
    </p>

    <p style="font-size: 17px; line-height: 1.8; color: #1e293b;">
      Your email has been <strong style="color: #22c55e;">verified successfully!</strong> 🎊 Welcome to our innovative platform. 
      We're excited to help you transform your IT infrastructure and achieve your business goals.
    </p>

    ${createInfoBox(`
      <strong style="font-size: 16px;">🌟 What you can do now:</strong><br><br>
      <div style="line-height: 2.2;">
        ${features.map(f => `<div style="margin: 8px 0;">${f}</div>`).join('')}
      </div>
    `, 'success')}

    <p style="font-size: 17px; line-height: 1.8; color: #1e293b; margin-top: 32px;">
      Ready to dive in? Click the button below to access your personalized dashboard:
    </p>

    ${createButton(dashboardUrl, '🚀 Go to Dashboard')}

    <div style="background: linear-gradient(135deg, rgba(0, 191, 255, 0.05) 0%, rgba(0, 102, 204, 0.05) 100%); padding: 28px; border-radius: 12px; margin: 36px 0; border: 1px solid rgba(0, 191, 255, 0.2);">
      <h3 style="margin: 0 0 20px; color: #0f172a; font-size: 20px; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 28px;">💡</span> Getting Started Tips
      </h3>
      <ul style="margin: 0; padding-left: 24px; color: #475569; font-size: 15px; line-height: 2.2;">
        <li><strong>Complete your profile</strong> to personalize your experience and unlock advanced features</li>
        <li><strong>Explore our services</strong> to find the perfect IT solution for your needs</li>
        <li><strong>Browse our portfolio</strong> to see our previous successful projects and case studies</li>
        <li><strong>Connect with our team</strong> for personalized consultation and expert guidance</li>
        <li><strong>Check out our resources</strong> for tutorials, guides, and best practices</li>
      </ul>
    </div>

    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border-left: 4px solid #0080ff;">
      <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #334155;">
        <strong style="color: #0f172a; font-size: 16px;">💬 Need help?</strong><br>
        Our dedicated support team is here to assist you 24/7! Don't hesitate to reach out with any questions, 
        concerns, or feedback. We're committed to your success!
      </p>
    </div>

    <div style="margin-top: 48px; padding-top: 32px; border-top: 2px solid #e2e8f0;">
      <p style="font-size: 17px; line-height: 1.8; color: #1e293b; margin: 0;">
        Welcome aboard! 👋<br>
        <strong style="background: linear-gradient(135deg, #00bfff 0%, #0066cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 18px;">The ${appName} Team</strong>
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
