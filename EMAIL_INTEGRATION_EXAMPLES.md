# Email Service Integration Examples

Quick reference for integrating the new email service into existing auth flows.

---

## 📧 Updating Existing Email Functions

### Before (Old Service)

```typescript
// Old way using lib/email.ts
import { sendVerificationEmail, sendWelcomeEmail } from '@/lib/email'

await sendVerificationEmail(email, verificationUrl, userName)
await sendWelcomeEmail(email, userName)
```

### After (New Service)

```typescript
// New way using lib/email/
import { emailService, generateVerificationEmail, generateWelcomeEmail } from '@/lib/email'

// Verification email
const verificationTemplate = generateVerificationEmail({
  recipientName: userName,
  verificationUrl: verificationUrl,
  expiryHours: 24
})

await emailService.sendEmail({
  to: email,
  subject: verificationTemplate.subject,
  html: verificationTemplate.html,
  text: verificationTemplate.text
})

// Welcome email
const welcomeTemplate = generateWelcomeEmail({
  recipientName: userName,
  dashboardUrl: `${process.env.APP_URL}/dashboard`
})

await emailService.sendEmail({
  to: email,
  subject: welcomeTemplate.subject,
  html: welcomeTemplate.html,
  text: welcomeTemplate.text
})
```

---

## 🔐 Auth Flow Integration

### 1. Registration with Email Verification

```typescript
// app/api/auth/register/route.ts
import { emailService, generateVerificationEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      emailVerified: null  // Not verified yet
    }
  })
  
  // Generate verification token
  const token = await generateVerificationToken(user.id)
  const verificationUrl = `${process.env.APP_URL}/auth/verify?token=${token}`
  
  // Send verification email
  const template = generateVerificationEmail({
    recipientName: name,
    verificationUrl,
    expiryHours: 24
  })
  
  const emailResult = await emailService.sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
  
  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error)
    // Continue anyway - user can request resend
  }
  
  return NextResponse.json({
    success: true,
    message: 'Registration successful. Please check your email to verify your account.',
    userId: user.id
  })
}
```

### 2. Email Verification Handler

```typescript
// app/api/auth/verify/route.ts
import { emailService, generateWelcomeEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  // Verify token and get user
  const user = await verifyToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
  
  // Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() }
  })
  
  // Send welcome email (if enabled)
  if (process.env.WELCOME_EMAIL_ENABLED === 'true') {
    const template = generateWelcomeEmail({
      recipientName: user.name || 'there',
      dashboardUrl: `${process.env.APP_URL}/dashboard`
    })
    
    await emailService.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
  }
  
  return NextResponse.json({
    success: true,
    message: 'Email verified successfully!'
  })
}
```

### 3. Password Reset Request

```typescript
// app/api/auth/forgot-password/route.ts
import { emailService, generatePasswordResetEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { email } = await request.json()
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    // Return success even if user not found (security)
    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent.'
    })
  }
  
  // Generate reset token
  const token = await generateResetToken(user.id)
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`
  
  // Send password reset email
  const template = generatePasswordResetEmail({
    recipientName: user.name || 'there',
    resetUrl,
    expiryMinutes: 60,
    ipAddress: request.headers.get('x-forwarded-for') || undefined,
    userAgent: request.headers.get('user-agent') || undefined
  })
  
  const emailResult = await emailService.sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
  
  if (!emailResult.success) {
    console.error('Failed to send password reset email:', emailResult.error)
    // Return generic message (don't leak email sending errors)
  }
  
  return NextResponse.json({
    success: true,
    message: 'If an account exists, a password reset email has been sent.'
  })
}
```

### 4. Password Reset Confirmation

```typescript
// app/api/auth/reset-password/route.ts
import { emailService } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const { token, newPassword } = await request.json()
  
  // Verify token and get user
  const user = await verifyResetToken(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
  
  // Update password
  const hashedPassword = await hash(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })
  
  // Send confirmation email (optional)
  await emailService.sendEmail({
    to: user.email,
    subject: 'Password Changed Successfully',
    html: `
      <h1>Password Changed</h1>
      <p>Hi ${user.name || 'there'},</p>
      <p>Your password has been changed successfully.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `,
    text: `Your password has been changed successfully. If you didn't make this change, please contact support immediately.`
  })
  
  return NextResponse.json({
    success: true,
    message: 'Password reset successfully!'
  })
}
```

---

## 💳 Payment Email Integration

### Invoice Created

```typescript
// app/api/invoices/route.ts
import { emailService, generateInvoiceEmail } from '@/lib/email'

export async function POST(request: Request) {
  const invoiceData = await request.json()
  
  // Create invoice in database
  const invoice = await prisma.invoice.create({ data: invoiceData })
  
  // Send invoice email to client
  const template = generateInvoiceEmail({
    recipientName: invoice.client.name,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.createdAt.toLocaleDateString(),
    dueDate: invoice.dueDate.toLocaleDateString(),
    amount: invoice.total,
    currency: invoice.currency,
    items: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    total: invoice.total,
    invoiceUrl: `${process.env.APP_URL}/invoices/${invoice.id}`,
    paymentUrl: `${process.env.APP_URL}/invoices/${invoice.id}/pay`,
    notes: invoice.notes
  })
  
  await emailService.sendEmail({
    to: invoice.client.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
  
  return NextResponse.json({ success: true, invoice })
}
```

### Payment Confirmation

```typescript
// app/api/webhooks/stripe/route.ts (Stripe webhook handler)
import { emailService, generatePaymentConfirmationEmail } from '@/lib/email'
import { pdfGenerator } from '@/lib/services/pdf-generator'

export async function POST(request: Request) {
  const event = await verifyStripeWebhook(request)
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    
    // Get invoice and client details
    const invoice = await prisma.invoice.findUnique({
      where: { id: paymentIntent.metadata.invoiceId },
      include: { client: true, payment: true }
    })
    
    // Generate payment confirmation template
    const template = generatePaymentConfirmationEmail({
      recipientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      paymentDate: new Date().toLocaleString(),
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: 'Credit Card',
      transactionId: paymentIntent.id,
      last4: paymentIntent.payment_method?.card?.last4,
      receiptUrl: `${process.env.APP_URL}/invoices/${invoice.id}/receipt`
    })
    
    // Generate PDF receipt (optional)
    const receiptHTML = generateReceiptHTML(invoice)
    const receiptPDF = await pdfGenerator.generateReceiptPDF(receiptHTML)
    
    // Send email with PDF attachment
    await emailService.sendEmail({
      to: invoice.client.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments: [{
        filename: `receipt-${invoice.invoiceNumber}.pdf`,
        content: receiptPDF,
        contentType: 'application/pdf'
      }]
    })
  }
  
  return NextResponse.json({ received: true })
}
```

---

## 🔍 Error Handling Best Practices

### Basic Error Handling

```typescript
const result = await emailService.sendEmail({
  to: user.email,
  subject: 'Test Email',
  html: '<h1>Test</h1>'
})

if (result.success) {
  console.log('Email sent!', result.messageId)
} else {
  console.error('Email failed:', result.error)
  // Handle error appropriately
}
```

### With Retry Information

```typescript
const result = await emailService.sendEmail(options)

if (result.success) {
  console.log(`Email sent after ${result.attempts} attempt(s)`)
  
  // Log if it took multiple attempts
  if (result.attempts && result.attempts > 1) {
    console.warn(`Email required ${result.attempts} attempts to send`)
  }
} else {
  console.error(`Email failed after ${result.attempts} attempts:`, result.error)
  
  // Alert admin if email is critical
  if (isCriticalEmail) {
    await alertAdmin({
      type: 'email_failure',
      email: options.to,
      error: result.error,
      attempts: result.attempts
    })
  }
}
```

### Graceful Degradation

```typescript
try {
  const template = generateWelcomeEmail({ recipientName: user.name })
  
  const result = await emailService.sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
  
  if (!result.success) {
    // Log error but don't fail the request
    console.error('Welcome email failed to send:', result.error)
    
    // Optionally queue for retry later
    await queueEmailForRetry({
      to: user.email,
      template: 'welcome',
      data: { recipientName: user.name }
    })
  }
  
  // Continue with user registration regardless of email status
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email }
  })
  
} catch (error) {
  // Email service completely failed - log but don't crash
  console.error('Email service error:', error)
  
  // Still return successful registration
  return NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email },
    warning: 'Account created but welcome email could not be sent'
  })
}
```

---

## 🧪 Testing Integration

### Test Email in Development

```typescript
// Always test before deploying
if (process.env.NODE_ENV === 'development') {
  const testResult = await emailService.sendTestEmail('your-email@example.com')
  console.log('Test email:', testResult)
}
```

### Preview Emails Without Sending

```env
# .env.local (development only)
ENABLE_EMAIL_PREVIEW="true"
```

This will log email details without actually sending.

### Catch-All in Development

```env
# .env.local (development only)
DEV_EMAIL_CATCH_ALL="dev@example.com"
```

All emails will be sent to this address in development, regardless of the `to` field.

---

## 📊 Monitoring Email Delivery

### Track Email Status

```typescript
const result = await emailService.sendEmail(options)

// Log to analytics/monitoring
await analytics.track('email_sent', {
  type: 'welcome',
  success: result.success,
  provider: result.provider,
  attempts: result.attempts,
  messageId: result.messageId,
  error: result.error
})
```

### Health Check Integration

```typescript
// Add to your monitoring dashboard
async function checkEmailHealth() {
  const response = await fetch('/api/health/email', {
    headers: {
      'Cookie': sessionCookie  // Admin auth required
    }
  })
  
  const health = await response.json()
  
  if (health.status !== 'healthy') {
    // Alert admin
    await sendAlert({
      type: 'service_unhealthy',
      service: 'email',
      details: health
    })
  }
  
  return health
}
```

---

## ✅ Migration Checklist

When migrating from old email service to new one:

- [ ] Update environment variables (add `EMAIL_PROVIDER`, etc.)
- [ ] Replace `sendVerificationEmail` with new template system
- [ ] Replace `sendWelcomeEmail` with new template system
- [ ] Replace `sendPasswordResetEmail` with new template system
- [ ] Test all email flows in development
- [ ] Run `npm run test:email your@email.com --template=all`
- [ ] Check email deliverability with Mail Tester
- [ ] Update error handling to use new result format
- [ ] Add monitoring for email delivery
- [ ] Test in production with small user group
- [ ] Monitor delivery rates for 24 hours
- [ ] Full rollout

---

**Integration Complete** ✅  
*All existing auth flows can now use the new email service!*
