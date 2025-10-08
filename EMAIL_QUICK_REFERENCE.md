# 📧 Email System - Quick Reference Guide

## 🚀 Quick Start

### Send Verification Email
```typescript
import { generateVerificationEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email'

const verificationUrl = 'https://yourapp.com/verify?token=abc123'
const template = generateVerificationEmail({
  recipientName: 'John Doe',
  verificationUrl,
  expiryHours: 24
})

await sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text
})
```

### Send Welcome Email
```typescript
import { generateWelcomeEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email'

const template = generateWelcomeEmail({
  recipientName: 'John Doe',
  dashboardUrl: 'https://yourapp.com/dashboard'
})

await sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text
})
```

### Send Password Reset Email
```typescript
import { generatePasswordResetEmail } from '@/lib/email/templates'
import { sendEmail } from '@/lib/email'

const template = generatePasswordResetEmail({
  recipientName: 'John Doe',
  resetUrl: 'https://yourapp.com/reset-password?token=xyz789',
  expiryMinutes: 60,
  ipAddress: '192.168.1.1',
  userAgent: 'Chrome 120.0'
})

await sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text
})
```

---

## 🎨 Available Email Templates

| Template | Function | Use Case |
|----------|----------|----------|
| **Verification Email** | `generateVerificationEmail()` | New user registration |
| **Welcome Email** | `generateWelcomeEmail()` | After email verification |
| **Password Reset** | `generatePasswordResetEmail()` | Forgot password flow |
| **Invoice** | `generateInvoiceEmail()` | Payment invoices |
| **Payment Confirmation** | `generatePaymentConfirmationEmail()` | Payment success |
| **Meeting Invitation** | `generateMeetingInvitationEmail()` | Schedule meetings |

---

## 🎨 Design System Colors

### Primary Gradient
```css
background: linear-gradient(135deg, #00bfff 0%, #0080ff 50%, #0066cc 100%);
```

### Text Colors
- **Primary Text**: `#1e293b`
- **Secondary Text**: `#64748b`
- **Accent Text**: `#0080ff`

### Info Box Colors
- **Info**: `#00bfff` (Cyan)
- **Success**: `#22c55e` (Green)
- **Warning**: `#fbbf24` (Yellow)
- **Error**: `#ef4444` (Red)

---

## 🛠️ Utility Functions

### Create Custom Button
```typescript
import { createButton } from '@/lib/email/templates/base'

const buttonHtml = createButton(
  'https://yourapp.com/action',
  '🚀 Take Action'
)
```

### Create Info Box
```typescript
import { createInfoBox } from '@/lib/email/templates/base'

const infoHtml = createInfoBox(
  '<strong>Important:</strong> This link expires in 24 hours',
  'warning' // 'info' | 'success' | 'warning' | 'error'
)
```

### Format URL
```typescript
import { formatUrl } from '@/lib/email/templates/base'

const linkHtml = formatUrl(
  'https://yourapp.com',
  'Visit Our Website'
)
```

---

## 📋 Email Template Parameters

### Verification Email
```typescript
{
  recipientName?: string      // User's name (default: 'there')
  verificationUrl: string     // REQUIRED: Verification link
  expiryHours?: number        // Token expiry (default: 24)
  appName?: string            // App name (default: env.APP_NAME)
  appUrl?: string             // App URL (default: env.APP_URL)
  supportEmail?: string       // Support email (default: env.SUPPORT_EMAIL)
}
```

### Welcome Email
```typescript
{
  recipientName: string       // REQUIRED: User's name
  dashboardUrl?: string       // Dashboard link
  features?: string[]         // Custom feature list
  appName?: string
  appUrl?: string
  supportEmail?: string
}
```

### Password Reset Email
```typescript
{
  recipientName?: string      // User's name (default: 'there')
  resetUrl: string            // REQUIRED: Reset link
  expiryMinutes?: number      // Token expiry (default: 60)
  ipAddress?: string          // Request IP (optional)
  userAgent?: string          // Browser info (optional)
  appName?: string
  appUrl?: string
  supportEmail?: string
}
```

---

## 🔧 Configuration

### Environment Variables
```env
# Required - Titan Email SMTP Configuration
EMAIL_SERVER_HOST=smtp.titan.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=no-reply@zyphextech.com
EMAIL_SERVER_PASSWORD=your-titan-password

# Optional (defaults shown)
APP_NAME=Zyphex Tech
APP_URL=https://zyphextech.com
NEXTAUTH_URL=https://zyphextech.com
SUPPORT_EMAIL=support@zyphextech.com
EMAIL_FROM=Zyphex Tech <noreply@zyphextech.com>
```

---

## 🐛 Common Issues

### Emails Not Sending
```typescript
// Check SMTP connection
try {
  await sendEmail({
    to: 'test@example.com',
    subject: 'Test',
    html: '<p>Test email</p>',
    text: 'Test email'
  })
  console.log('✅ Email sent successfully')
} catch (error) {
  console.error('❌ Email error:', error)
}
```

### Emails Going to Spam
1. Configure SPF/DKIM/DMARC records
2. Use reputable SMTP service (Titan Email, SendGrid, Resend)
3. Include plain text version (already included)
4. Avoid spam trigger words

---

## 📱 Test Email Rendering

### Preview in Browser
```typescript
// Save to HTML file for preview
import fs from 'fs'
import { generateVerificationEmail } from '@/lib/email/templates'

const template = generateVerificationEmail({
  recipientName: 'Test User',
  verificationUrl: 'https://example.com/verify?token=test123'
})

fs.writeFileSync('email-preview.html', template.html)
// Open email-preview.html in browser
```

---

## 🎯 Best Practices

### ✅ DO:
- Always provide plain text version (handled automatically)
- Use clear, actionable CTAs
- Include support contact information
- Set appropriate expiry times
- Log email sending status
- Handle email errors gracefully

### ❌ DON'T:
- Send emails synchronously (use background jobs for scale)
- Include sensitive data in email content
- Use misleading subject lines
- Forget to escape user-provided content
- Send without rate limiting

---

## 📊 Email Metrics (Future Enhancement)

Track email performance:
```typescript
// Add tracking pixel (optional)
const trackingPixel = `<img src="${appUrl}/api/email/track/${emailId}" width="1" height="1" />`

// Add UTM parameters
const trackedUrl = `${url}?utm_source=email&utm_medium=verification`
```

---

## 🚀 Production Checklist

Before going live:
- [ ] Set up SMTP credentials
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Test all email templates
- [ ] Check spam scores ([Mail Tester](https://www.mail-tester.com/))
- [ ] Verify responsive design on mobile
- [ ] Set up email monitoring/logging
- [ ] Configure rate limiting
- [ ] Test error handling

---

## 📚 Additional Resources

- [Email Template Files](./lib/email/templates/)
- [Full Documentation](./EMAIL_SYSTEM_MODERNIZATION_COMPLETE.md)
- [Nodemailer Docs](https://nodemailer.com/)
- [Email Best Practices](https://www.litmus.com/blog/email-best-practices/)

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: December 2024
