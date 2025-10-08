# Email Service Setup and Configuration Guide

**Status:** ✅ COMPLETE  
**Date:** October 7, 2025  
**Version:** 2.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Email Templates](#email-templates)
6. [Testing](#testing)
7. [API Reference](#api-reference)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Zyphex Tech email service provides a robust, production-ready email delivery system with:

- **Multi-Provider Support:** Choose between Resend (recommended) or traditional SMTP
- **Beautiful Templates:** Pre-built, responsive email templates for all use cases
- **Retry Logic:** Automatic retry with exponential backoff
- **Health Monitoring:** Built-in health check endpoint
- **Development Tools:** Email testing scripts and preview mode
- **Type Safety:** Full TypeScript support

### Architecture

```
lib/email/
├── config.ts              # Configuration management
├── service.ts             # Main email service with retry logic
├── index.ts               # Central exports
└── templates/
    ├── base.ts            # Base template utilities
    ├── welcome.ts         # Welcome email
    ├── verification.ts    # Email verification
    ├── password-reset.ts  # Password reset
    ├── invoice.ts         # Invoice emails
    ├── payment-confirmation.ts
    └── index.ts           # Template exports
```

---

## ✨ Features

### Core Features

- ✅ **Multiple Providers:** Resend API or traditional SMTP (Gmail, SendGrid, Mailgun, AWS SES, etc.)
- ✅ **Automatic Retries:** Configurable retry logic with exponential backoff
- ✅ **Queue System:** Built-in email queue for reliability
- ✅ **Error Handling:** Comprehensive error handling and logging
- ✅ **Development Mode:** Catch-all emails and preview mode for testing
- ✅ **Production Ready:** SPF/DKIM support, rate limiting, connection pooling

### Email Templates

- ✅ **Welcome Email:** Sent after successful email verification
- ✅ **Email Verification:** Verify email addresses with secure tokens
- ✅ **Password Reset:** Secure password reset flow
- ✅ **Invoice:** Professional invoice delivery
- ✅ **Payment Confirmation:** Payment receipts with PDF attachments
- ✅ **Responsive Design:** Mobile-friendly HTML emails
- ✅ **Plain Text Fallback:** Automatic plain text generation

### Developer Tools

- ✅ **Testing Script:** Command-line tool to test all templates
- ✅ **Health Check API:** Monitor email service status
- ✅ **Configuration Validation:** Comprehensive validation with helpful errors
- ✅ **Preview Mode:** Preview emails without sending

---

## 🚀 Quick Start

### 1. Choose Your Email Provider

#### Option A: Resend (Recommended)

**Pros:**
- Simple API, excellent deliverability
- 100 emails/day free tier, 3,000/month
- No complex SMTP configuration
- Built-in analytics

**Setup:**
1. Sign up at https://resend.com
2. Get your API key
3. Configure `.env`:

```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company Name"
```

#### Option B: SMTP (Gmail, SendGrid, etc.)

**Pros:**
- Use existing email service
- More control over email infrastructure
- No additional service dependencies

**Setup for Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password at https://myaccount.google.com/apppasswords
3. Configure `.env`:

```env
EMAIL_PROVIDER="nodemailer"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-specific-password"
EMAIL_FROM="your-email@gmail.com"
EMAIL_FROM_NAME="Your Name"
```

### 2. Test Your Configuration

```bash
# Test basic email sending
npm run test:email your-email@example.com

# Test specific template
npm run test:email your-email@example.com --template=welcome

# Test all templates
npm run test:email your-email@example.com --template=all
```

### 3. Use in Your Code

```typescript
import { emailService } from '@/lib/email'
import { generateWelcomeEmail } from '@/lib/email'

// Send welcome email
const template = generateWelcomeEmail({
  recipientName: 'John Doe',
  dashboardUrl: 'https://yourapp.com/dashboard'
})

const result = await emailService.sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text
})

if (result.success) {
  console.log('Email sent!', result.messageId)
} else {
  console.error('Email failed:', result.error)
}
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# === REQUIRED ===

# Provider choice: "resend" or "nodemailer"
EMAIL_PROVIDER="resend"

# Email from address (required for both providers)
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company Name"

# === RESEND CONFIGURATION (if using Resend) ===
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# === SMTP CONFIGURATION (if using Nodemailer) ===
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-specific-password"

# === OPTIONAL FEATURES ===

# Email verification
EMAIL_VERIFICATION_ENABLED="true"
EMAIL_VERIFICATION_REQUIRED="false"
EMAIL_VERIFICATION_TOKEN_EXPIRY="24h"

# Email types
WELCOME_EMAIL_ENABLED="true"
PASSWORD_RESET_EMAIL_ENABLED="true"
PAYMENT_CONFIRMATION_EMAIL_ENABLED="true"

# Retry configuration
EMAIL_MAX_RETRIES="3"
EMAIL_RETRY_DELAY="5000"  # milliseconds

# Development settings
DEV_EMAIL_CATCH_ALL="dev@example.com"  # All emails go here in dev
ENABLE_EMAIL_PREVIEW="true"  # Preview instead of sending
ENABLE_EMAIL_LOGGING="true"  # Log all email attempts

# Application
APP_NAME="Your App Name"
APP_URL="http://localhost:3000"
SUPPORT_EMAIL="support@yourdomain.com"
```

### Provider-Specific Examples

#### Gmail

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-char-app-password"
```

**Important:** Use App Password, not your regular password!
1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords

#### SendGrid

```env
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="SG.your-api-key-here"
```

#### AWS SES

```env
EMAIL_SERVER_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-aws-smtp-username"
EMAIL_SERVER_PASSWORD="your-aws-smtp-password"
```

#### Mailgun

```env
EMAIL_SERVER_HOST="smtp.mailgun.org"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="postmaster@yourdomain.mailgun.org"
EMAIL_SERVER_PASSWORD="your-mailgun-smtp-password"
```

---

## 📧 Email Templates

All templates support both HTML and plain text versions.

### 1. Welcome Email

Sent after successful email verification.

```typescript
import { generateWelcomeEmail } from '@/lib/email'

const template = generateWelcomeEmail({
  recipientName: 'John Doe',
  dashboardUrl: 'https://yourapp.com/dashboard',
  features: [  // Optional custom features list
    '✅ Feature 1',
    '✅ Feature 2'
  ]
})

await emailService.sendEmail({
  to: user.email,
  subject: template.subject,
  html: template.html,
  text: template.text
})
```

### 2. Email Verification

Verify user email addresses.

```typescript
import { generateVerificationEmail } from '@/lib/email'

const template = generateVerificationEmail({
  recipientName: 'John Doe',
  verificationUrl: `https://yourapp.com/verify?token=${token}`,
  expiryHours: 24  // Optional, defaults to 24
})
```

### 3. Password Reset

Secure password reset emails.

```typescript
import { generatePasswordResetEmail } from '@/lib/email'

const template = generatePasswordResetEmail({
  recipientName: 'John Doe',
  resetUrl: `https://yourapp.com/reset?token=${token}`,
  expiryMinutes: 60,  // Optional, defaults to 60
  ipAddress: request.ip,  // Optional
  userAgent: request.headers['user-agent']  // Optional
})
```

### 4. Invoice

Professional invoice emails.

```typescript
import { generateInvoiceEmail } from '@/lib/email'

const template = generateInvoiceEmail({
  recipientName: 'Client Name',
  invoiceNumber: 'INV-2024-001',
  invoiceDate: '2024-10-01',
  dueDate: '2024-10-31',
  amount: 2500.00,
  currency: 'USD',
  items: [
    {
      description: 'Web Development',
      quantity: 1,
      rate: 1500.00,
      amount: 1500.00
    },
    {
      description: 'UI/UX Design',
      quantity: 5,
      rate: 200.00,
      amount: 1000.00
    }
  ],
  subtotal: 2500.00,
  tax: 0,
  total: 2500.00,
  invoiceUrl: 'https://yourapp.com/invoices/123',
  paymentUrl: 'https://yourapp.com/invoices/123/pay',
  notes: 'Thank you for your business!'  // Optional
})
```

### 5. Payment Confirmation

Payment receipts with optional PDF attachment.

```typescript
import { generatePaymentConfirmationEmail } from '@/lib/email'

const template = generatePaymentConfirmationEmail({
  recipientName: 'Client Name',
  invoiceNumber: 'INV-2024-001',
  paymentDate: new Date().toLocaleString(),
  amount: 2500.00,
  currency: 'USD',
  paymentMethod: 'Credit Card',
  transactionId: 'pi_1234567890',
  last4: '4242',  // Optional
  receiptUrl: 'https://yourapp.com/receipts/123'
})

// Send with PDF attachment
await emailService.sendEmail({
  to: client.email,
  subject: template.subject,
  html: template.html,
  text: template.text,
  attachments: [{
    filename: 'receipt.pdf',
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]
})
```

---

## 🧪 Testing

### Command-Line Testing

```bash
# Test basic email (configuration + simple test email)
npm run test:email your-email@example.com

# Test specific template
npm run test:email your-email@example.com --template=welcome
npm run test:email your-email@example.com --template=verification
npm run test:email your-email@example.com --template=password-reset
npm run test:email your-email@example.com --template=invoice
npm run test:email your-email@example.com --template=payment-confirmation

# Test all templates at once
npm run test:email your-email@example.com --template=all
```

### Health Check API

Test email service health from admin dashboard:

```bash
# GET request (requires admin authentication)
curl http://localhost:3000/api/health/email \
  -H "Cookie: next-auth.session-token=xxx"

# Response
{
  "status": "healthy",
  "message": "Email service is operational",
  "provider": "resend",
  "configuration": {
    "from": {
      "email": "noreply@yourdomain.com",
      "name": "Your Company"
    },
    "features": { ... },
    "retry": { ... }
  },
  "connection": {
    "verified": true,
    "details": { ... }
  }
}
```

Send test email via API:

```bash
# POST request
curl -X POST http://localhost:3000/api/health/email \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=xxx" \
  -d '{"to":"test@example.com"}'
```

### Programmatic Testing

```typescript
import { emailService } from '@/lib/email'
import { validateEmailConfig } from '@/lib/email'

// Validate configuration
const validation = validateEmailConfig()
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors)
}

// Test connection
const connectionTest = await emailService.testConnection()
console.log('Connection:', connectionTest.success)

// Send test email
const result = await emailService.sendTestEmail('test@example.com')
console.log('Test email:', result.success)
```

---

## 📚 API Reference

### Email Service

#### `emailService.sendEmail(options)`

Send an email with retry logic.

```typescript
const result = await emailService.sendEmail({
  to: 'user@example.com',  // or ['user1@example.com', 'user2@example.com']
  from: 'custom@example.com',  // Optional, uses config default
  subject: 'Email Subject',
  html: '<h1>HTML content</h1>',
  text: 'Plain text content',  // Optional, auto-generated from HTML
  replyTo: 'reply@example.com',  // Optional
  cc: 'cc@example.com',  // Optional
  bcc: 'bcc@example.com',  // Optional
  attachments: [{  // Optional
    filename: 'file.pdf',
    content: buffer,
    contentType: 'application/pdf'
  }]
})

// Result
{
  success: true,
  messageId: 'msg_xxxx',
  provider: 'resend',
  attempts: 1
}
```

#### `emailService.testConnection()`

Test email service connection.

```typescript
const result = await emailService.testConnection()

// Result
{
  success: true,
  message: 'Connection verified',
  provider: 'resend',
  details: { ... }
}
```

#### `emailService.sendTestEmail(to)`

Send a test email to verify configuration.

```typescript
const result = await emailService.sendTestEmail('test@example.com')
```

### Configuration

#### `validateEmailConfig()`

Validate email configuration without throwing errors.

```typescript
const validation = validateEmailConfig()

// Result
{
  valid: true,
  errors: [],
  warnings: ['Warning message'],
  config: { ... }
}
```

#### `getEmailConfig()`

Get current email configuration (cached).

```typescript
const config = getEmailConfig()

// Result
{
  provider: 'resend',
  from: {
    email: 'noreply@example.com',
    name: 'Company Name'
  },
  features: { ... },
  retry: { ... }
}
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] **Domain Verification:** Verify your sending domain with your email provider
- [ ] **SPF Record:** Add SPF record to DNS for better deliverability
- [ ] **DKIM:** Configure DKIM for email authentication
- [ ] **DMARC:** Set up DMARC policy for email security
- [ ] **Rate Limits:** Configure appropriate rate limits
- [ ] **Monitoring:** Set up email delivery monitoring
- [ ] **Error Alerts:** Configure alerts for email failures
- [ ] **Test Deliverability:** Test with major email providers (Gmail, Outlook, Yahoo)

### DNS Configuration

#### SPF Record

Add to your domain's DNS:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

For SMTP providers, check their documentation for SPF record.

#### DKIM

Configure DKIM through your email provider's dashboard:

- **Resend:** Automatic DKIM signing
- **SendGrid:** Configure in sender authentication
- **Gmail:** Google handles DKIM automatically
- **AWS SES:** Configure in SES console

### Environment Variables (Production)

```env
# Provider
EMAIL_PROVIDER="resend"  # Recommended for production

# Credentials
RESEND_API_KEY="re_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company Name"

# Features
EMAIL_VERIFICATION_ENABLED="true"
EMAIL_VERIFICATION_REQUIRED="true"  # Require verification in production
WELCOME_EMAIL_ENABLED="true"
PASSWORD_RESET_EMAIL_ENABLED="true"

# Retry
EMAIL_MAX_RETRIES="3"
EMAIL_RETRY_DELAY="5000"

# Logging
ENABLE_EMAIL_LOGGING="true"

# Application
APP_NAME="Your Company"
APP_URL="https://yourdomain.com"
SUPPORT_EMAIL="support@yourdomain.com"

# DISABLE development features
ENABLE_EMAIL_PREVIEW="false"
# DEV_EMAIL_CATCH_ALL should NOT be set in production
```

### Monitoring

Monitor these metrics:

1. **Delivery Rate:** Target >99%
2. **Bounce Rate:** Target <2%
3. **Spam Complaints:** Target <0.1%
4. **Open Rate:** Track for engagement
5. **Error Rate:** Monitor failed sends
6. **Retry Success:** Track retry effectiveness

### Rate Limiting

Configure rate limits based on your email provider:

- **Resend Free:** 100 emails/day, 3,000/month
- **Resend Paid:** 50,000+/month depending on plan
- **Gmail:** 500 emails/day for Google Workspace
- **SendGrid Free:** 100 emails/day
- **AWS SES:** 14 emails/second in production

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "RESEND_API_KEY is required"

**Problem:** Missing or invalid Resend API key

**Solution:**
1. Get API key from https://resend.com/api-keys
2. Add to `.env`: `RESEND_API_KEY="re_xxxx"`
3. API key must start with `re_`

#### 2. "Invalid login" with Gmail

**Problem:** Using regular password instead of App Password

**Solution:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use 16-character app password (no spaces)

#### 3. "Connection timeout"

**Problem:** Cannot connect to SMTP server

**Solution:**
1. Check firewall settings
2. Verify SMTP host and port
3. Common ports: 587 (TLS), 465 (SSL), 25 (unsecured)
4. Try different port if one doesn't work

#### 4. Emails going to spam

**Problem:** Poor email deliverability

**Solution:**
1. Verify your sending domain
2. Configure SPF record
3. Set up DKIM
4. Implement DMARC
5. Avoid spam trigger words
6. Include unsubscribe link
7. Maintain good sender reputation

#### 5. "self signed certificate"

**Problem:** SSL certificate issues

**Solution:**
Add to `.env`:
```env
NODE_ENV="development"  # Allows self-signed certs in dev
```

Or update SMTP configuration to skip verification.

#### 6. Templates not rendering correctly

**Problem:** Email client compatibility

**Solution:**
- Templates use inline CSS for maximum compatibility
- Test with https://www.emailonacid.com or https://litmus.com
- Check in Gmail, Outlook, Apple Mail
- Use plain text fallback for accessibility

### Debugging

Enable detailed logging:

```env
ENABLE_EMAIL_LOGGING="true"
NODE_ENV="development"
```

Check logs for:
- Configuration errors
- Connection failures
- Send attempts
- Retry behavior
- Provider responses

### Testing Deliverability

1. **Mail Tester:** https://www.mail-tester.com
2. **MX Toolbox:** https://mxtoolbox.com/deliverability
3. **Gmail Postmaster:** https://postmaster.google.com
4. **Outlook Postmaster:** https://sendersupport.olc.protection.outlook.com

### Get Help

1. Check logs: Enable `ENABLE_EMAIL_LOGGING="true"`
2. Run test script: `npm run test:email your@email.com`
3. Check health endpoint: `GET /api/health/email`
4. Review configuration: Use `validateEmailConfig()`
5. Check provider status:
   - Resend: https://status.resend.com
   - SendGrid: https://status.sendgrid.com
   - Gmail: https://www.google.com/appsstatus

---

## 📊 Feature Matrix

| Feature | Resend | Nodemailer (SMTP) |
|---------|--------|------------------|
| Easy Setup | ✅ | ⚠️ Requires SMTP config |
| Free Tier | ✅ 100/day | ✅ Provider dependent |
| Deliverability | ✅ Excellent | ⚠️ Depends on provider |
| Analytics | ✅ Built-in | ❌ Manual tracking |
| Webhooks | ✅ Supported | ❌ Not available |
| Attachments | ✅ Supported | ✅ Supported |
| Templates | ✅ HTML/Text | ✅ HTML/Text |
| Retry Logic | ✅ Automatic | ✅ Automatic |
| Connection Pool | ✅ Managed | ✅ Configurable |

**Recommendation:** Use Resend for production for simplicity and reliability.

---

## 📝 Summary

✅ **Complete email service** with multi-provider support  
✅ **5 professional templates** ready to use  
✅ **Automatic retries** for reliability  
✅ **Health monitoring** built-in  
✅ **Testing tools** included  
✅ **Production-ready** with SPF/DKIM support  
✅ **Full TypeScript** support  
✅ **Comprehensive documentation**

**Next Steps:**
1. Configure your `.env` file
2. Run `npm run test:email your@email.com`
3. Integrate into your auth flows
4. Monitor via `/api/health/email`
5. Deploy to production

---

**Email Service Complete** ✅  
*Ready for production deployment with full monitoring and testing capabilities!*
