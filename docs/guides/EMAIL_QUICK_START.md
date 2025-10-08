# Email Service - Quick Start Guide

**5-Minute Setup** ⚡

---

## Step 1: Choose Provider (2 minutes)

### Option A: Resend (Recommended) ⭐

1. Go to https://resend.com
2. Sign up (free account)
3. Get API key from https://resend.com/api-keys
4. Add to `.env`:

```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company Name"
```

### Option B: Gmail SMTP

1. Enable 2FA: https://myaccount.google.com/security
2. Create App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:

```env
EMAIL_PROVIDER="nodemailer"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-16-char-app-password"
EMAIL_FROM="your-email@gmail.com"
EMAIL_FROM_NAME="Your Name"
```

---

## Step 2: Test Configuration (1 minute)

```bash
npm run test:email your-email@example.com
```

**Expected Output:**
```
✅ Configuration is valid!
✅ Connection successful!
✅ Test email sent successfully!
📬 Check your inbox (and spam folder)
```

---

## Step 3: Send Your First Email (2 minutes)

```typescript
import { emailService, generateWelcomeEmail } from '@/lib/email'

// Generate email from template
const template = generateWelcomeEmail({
  recipientName: 'John Doe',
  dashboardUrl: 'https://yourapp.com/dashboard'
})

// Send email
const result = await emailService.sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text
})

// Check result
if (result.success) {
  console.log('✅ Email sent!', result.messageId)
} else {
  console.error('❌ Email failed:', result.error)
}
```

---

## Available Templates

### 1. Welcome Email
```typescript
import { generateWelcomeEmail } from '@/lib/email'

const template = generateWelcomeEmail({
  recipientName: 'User Name'
})
```

### 2. Email Verification
```typescript
import { generateVerificationEmail } from '@/lib/email'

const template = generateVerificationEmail({
  recipientName: 'User Name',
  verificationUrl: 'https://yourapp.com/verify?token=xxx'
})
```

### 3. Password Reset
```typescript
import { generatePasswordResetEmail } from '@/lib/email'

const template = generatePasswordResetEmail({
  recipientName: 'User Name',
  resetUrl: 'https://yourapp.com/reset?token=xxx'
})
```

### 4. Invoice
```typescript
import { generateInvoiceEmail } from '@/lib/email'

const template = generateInvoiceEmail({
  recipientName: 'Client Name',
  invoiceNumber: 'INV-001',
  invoiceDate: '2024-10-01',
  dueDate: '2024-10-31',
  amount: 2500.00,
  currency: 'USD',
  items: [
    { description: 'Service', quantity: 1, rate: 2500, amount: 2500 }
  ],
  subtotal: 2500.00,
  total: 2500.00,
  invoiceUrl: 'https://yourapp.com/invoices/123'
})
```

### 5. Payment Confirmation
```typescript
import { generatePaymentConfirmationEmail } from '@/lib/email'

const template = generatePaymentConfirmationEmail({
  recipientName: 'Client Name',
  invoiceNumber: 'INV-001',
  paymentDate: new Date().toLocaleString(),
  amount: 2500.00,
  currency: 'USD',
  paymentMethod: 'Credit Card',
  transactionId: 'pi_xxx'
})
```

---

## Testing All Templates

```bash
# Test all 5 templates at once
npm run test:email your-email@example.com --template=all

# Test specific template
npm run test:email your-email@example.com --template=welcome
```

---

## Environment Variables (Full List)

Copy to your `.env` file:

```env
# === REQUIRED ===
EMAIL_PROVIDER="resend"  # or "nodemailer"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company"

# === RESEND (if using Resend) ===
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# === SMTP (if using Nodemailer) ===
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# === OPTIONAL ===
EMAIL_VERIFICATION_ENABLED="true"
EMAIL_VERIFICATION_REQUIRED="false"
WELCOME_EMAIL_ENABLED="true"
PASSWORD_RESET_EMAIL_ENABLED="true"
EMAIL_MAX_RETRIES="3"
EMAIL_RETRY_DELAY="5000"

# === DEVELOPMENT ===
ENABLE_EMAIL_PREVIEW="false"  # Set to "true" to preview without sending
DEV_EMAIL_CATCH_ALL=""  # Redirect all emails to this address in dev
ENABLE_EMAIL_LOGGING="true"

# === APPLICATION ===
APP_NAME="Your App"
APP_URL="http://localhost:3000"
SUPPORT_EMAIL="support@yourdomain.com"
```

---

## Health Check (Admin Only)

Check email service status:

```bash
# GET request
curl http://localhost:3000/api/health/email \
  -H "Cookie: next-auth.session-token=xxx"
```

Response:
```json
{
  "status": "healthy",
  "message": "Email service is operational",
  "provider": "resend",
  "timestamp": "2024-10-07T12:00:00.000Z"
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

---

## Common Issues & Solutions

### ❌ "RESEND_API_KEY is required"

**Fix:** Add `RESEND_API_KEY="re_xxx"` to `.env`

### ❌ "Invalid login" (Gmail)

**Fix:** Use App Password, not regular password
1. https://myaccount.google.com/security (enable 2FA)
2. https://myaccount.google.com/apppasswords (create app password)

### ❌ Emails going to spam

**Fix:** 
- Use Resend (better deliverability)
- Verify your domain
- Set up SPF/DKIM records

### ❌ "Connection timeout"

**Fix:**
- Check firewall settings
- Try different port (587, 465, or 25)
- Verify SMTP host is correct

---

## Production Checklist

Before deploying to production:

- [ ] Set `EMAIL_PROVIDER="resend"` (recommended)
- [ ] Use production API key
- [ ] Verify sending domain
- [ ] Set up SPF record
- [ ] Configure DKIM
- [ ] Set `EMAIL_VERIFICATION_REQUIRED="true"`
- [ ] Disable `ENABLE_EMAIL_PREVIEW`
- [ ] Remove `DEV_EMAIL_CATCH_ALL`
- [ ] Test with multiple email providers (Gmail, Outlook, etc.)
- [ ] Monitor delivery rates

---

## Next Steps

1. ✅ **You're ready!** Start sending emails
2. 📖 Read full docs: `EMAIL_SERVICE_SETUP_COMPLETE.md`
3. 🔧 See integration examples: `EMAIL_INTEGRATION_EXAMPLES.md`
4. 🧪 Test all templates: `npm run test:email --template=all`
5. 📊 Monitor via `/api/health/email`

---

## Support

- **Test emails:** `npm run test:email your@email.com`
- **Check config:** Use `validateEmailConfig()` function
- **View logs:** Set `ENABLE_EMAIL_LOGGING="true"`
- **Health check:** GET `/api/health/email` (admin only)

---

**Email Service Ready** ✅  
*Start sending beautiful emails in minutes!*
