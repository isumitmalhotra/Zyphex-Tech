# 📧 Email Service Quick Reference Card

> **Status:** ✅ Production Ready | **Version:** 2.0 | **Setup Time:** 5 minutes

---

## 🚀 Quick Start

### 1. Configure (30 seconds)

```env
# .env - Choose ONE provider:

# Option A: Resend (Recommended)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Option B: Gmail
EMAIL_PROVIDER="nodemailer"
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your@gmail.com"
```

### 2. Test (30 seconds)

```bash
npm run test:email your-email@example.com
```

### 3. Use (1 minute)

```typescript
import { emailService, generateWelcomeEmail } from '@/lib/email'

// Send welcome email
const template = generateWelcomeEmail({ recipientName: 'John' })
await emailService.sendEmail({
  to: 'user@example.com',
  subject: template.subject,
  html: template.html,
  text: template.text
})
```

---

## 📋 Available Templates

```typescript
import {
  generateWelcomeEmail,
  generateVerificationEmail,
  generatePasswordResetEmail,
  generateInvoiceEmail,
  generatePaymentConfirmationEmail
} from '@/lib/email'
```

| Template | Use Case | Required Data |
|----------|----------|---------------|
| `generateWelcomeEmail()` | New user welcome | `recipientName` |
| `generateVerificationEmail()` | Email verification | `verificationUrl` |
| `generatePasswordResetEmail()` | Password reset | `resetUrl` |
| `generateInvoiceEmail()` | Send invoice | `invoiceNumber`, `items`, `amount` |
| `generatePaymentConfirmationEmail()` | Payment receipt | `invoiceNumber`, `amount` |

---

## 🎯 Common Use Cases

### Email Verification

```typescript
import { emailService, generateVerificationEmail } from '@/lib/email'

const template = generateVerificationEmail({
  verificationUrl: `https://app.com/verify?token=${token}`,
  recipientName: user.name,
  expiryHours: 24
})

await emailService.sendEmail({
  to: user.email,
  ...template
})
```

### Password Reset

```typescript
import { emailService, generatePasswordResetEmail } from '@/lib/email'

const template = generatePasswordResetEmail({
  resetUrl: `https://app.com/reset?token=${token}`,
  recipientName: user.name,
  expiryMinutes: 60,
  ipAddress: request.ip
})

await emailService.sendEmail({
  to: user.email,
  ...template
})
```

### Invoice

```typescript
import { emailService, generateInvoiceEmail } from '@/lib/email'

const template = generateInvoiceEmail({
  recipientName: 'John Doe',
  invoiceNumber: 'INV-001',
  issueDate: '2024-10-07',
  dueDate: '2024-10-31',
  amount: 2500.00,
  currency: 'USD',
  items: [
    { description: 'Web Development', amount: 1500.00 },
    { description: 'UI/UX Design', amount: 1000.00 }
  ],
  subtotal: 2500.00,
  invoiceUrl: 'https://app.com/invoices/INV-001',
  paymentUrl: 'https://app.com/pay/INV-001'
})

await emailService.sendEmail({
  to: client.email,
  ...template
})
```

### Payment Confirmation

```typescript
import { emailService, generatePaymentConfirmationEmail } from '@/lib/email'

const template = generatePaymentConfirmationEmail({
  recipientName: 'John Doe',
  invoiceNumber: 'INV-001',
  paymentDate: '2024-10-07',
  amount: 2500.00,
  currency: 'USD',
  paymentMethod: 'Credit Card',
  transactionId: 'pi_xxxxxxxxxxxxx',
  last4: '4242',
  receiptUrl: 'https://app.com/receipt/INV-001'
})

await emailService.sendEmail({
  to: client.email,
  ...template,
  attachments: [{
    filename: 'receipt.pdf',
    content: pdfBuffer
  }]
})
```

---

## 🔧 Testing Commands

```bash
# Validate configuration
npx tsx scripts/validate-email-config.ts

# Test basic email
npm run test:email your@email.com

# Test all templates
npm run test:email your@email.com --template=all

# Test specific template
npm run test:email your@email.com --template=welcome
npm run test:email your@email.com --template=verification
npm run test:email your@email.com --template=password-reset
npm run test:email your@email.com --template=invoice
npm run test:email your@email.com --template=payment-confirmation
```

---

## 🏥 Health Check

### API Endpoint

```bash
# Check health (admin only)
GET /api/health/email

# Send test email (admin only)
POST /api/health/email
Content-Type: application/json

{
  "to": "test@example.com"
}
```

### Response

```json
{
  "status": "healthy",
  "provider": "resend",
  "configuration": {
    "from": { "email": "noreply@domain.com", "name": "Your Company" }
  },
  "connection": { "verified": true },
  "queue": { "size": 0 }
}
```

---

## ⚙️ Configuration Reference

### Required Variables

```env
EMAIL_PROVIDER="resend"              # or "nodemailer"
RESEND_API_KEY="re_xxx"             # If using Resend
EMAIL_FROM="noreply@domain.com"
```

### Optional Variables

```env
EMAIL_FROM_NAME="Your Company"
EMAIL_VERIFICATION_REQUIRED="true"
EMAIL_MAX_RETRIES="3"
EMAIL_RETRY_DELAY="5000"
```

### Development Variables

```env
ENABLE_EMAIL_PREVIEW="true"                    # Preview only, don't send
DEV_EMAIL_CATCH_ALL="dev@example.com"         # Redirect all emails
ENABLE_EMAIL_LOGGING="true"                    # Detailed logs
```

### SMTP Variables (if using nodemailer)

```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
```

---

## 📊 Provider Comparison

| Provider | Setup | Free Tier | Deliverability | Best For |
|----------|-------|-----------|----------------|----------|
| **Resend** | ⭐⭐⭐ Easy | 100/day | ⭐⭐⭐ Excellent | Production apps |
| Gmail | ⭐⭐ Medium | 500/day | ⭐⭐ Good | Development/testing |
| SendGrid | ⭐⭐ Medium | 100/day | ⭐⭐⭐ Excellent | High volume |
| AWS SES | ⭐ Complex | Varies | ⭐⭐⭐ Excellent | AWS infrastructure |

---

## 🐛 Troubleshooting

### Email Not Sending

```bash
# 1. Check configuration
npx tsx scripts/validate-email-config.ts

# 2. Test connection
npm run test:email your@email.com

# 3. Check health endpoint
curl http://localhost:3000/api/health/email
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `RESEND_API_KEY is required` | Add API key to `.env` |
| `Invalid email format` | Check `EMAIL_FROM` format |
| `Connection timeout` | Check SMTP credentials/firewall |
| `Message not found` | Check spam folder |
| `Authentication failed` | Enable "less secure apps" (Gmail) or use app password |

### Gmail App Password

1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate
4. Use generated password in `EMAIL_SERVER_PASSWORD`

---

## 📁 File Structure

```
lib/email/
├── config.ts           # Configuration & validation
├── service.ts          # Email sending logic
├── index.ts            # Main exports
└── templates/
    ├── base.ts         # Base HTML utilities
    ├── welcome.ts      # Welcome template
    ├── verification.ts # Verification template
    ├── password-reset.ts
    ├── invoice.ts
    ├── payment-confirmation.ts
    └── index.ts        # Template exports

scripts/
├── test-email.ts       # Testing script
└── validate-email-config.ts

app/api/health/email/
└── route.ts            # Health check endpoint
```

---

## 🔐 Security Checklist

### Before Production

- [ ] Use environment variables (never hardcode)
- [ ] Enable SPF record for sending domain
- [ ] Configure DKIM (automatic with Resend)
- [ ] Set up DMARC policy
- [ ] Test with major email providers
- [ ] Disable preview mode (`ENABLE_EMAIL_PREVIEW="false"`)
- [ ] Remove development catch-all
- [ ] Set up monitoring/alerts
- [ ] Rate limit email endpoints
- [ ] Validate email addresses

---

## 📈 Monitoring

### Key Metrics

```typescript
// Get queue status
const status = await emailService.getQueueStatus()
console.log(`Queue size: ${status.size}`)

// Check result
const result = await emailService.sendEmail({...})
if (result.success) {
  console.log('✅ Sent:', result.messageId)
} else {
  console.error('❌ Failed:', result.error)
}
```

### Health Check

```bash
# Monitor via API
watch -n 60 'curl -s http://localhost:3000/api/health/email | jq'
```

---

## 💡 Pro Tips

1. **Use Resend for production** - Best deliverability, simple setup
2. **Always provide plain text** - Some clients prefer it
3. **Test on mobile** - Templates are responsive
4. **Monitor bounce rate** - Keep under 2%
5. **Enable retry logic** - Handles transient failures
6. **Use preview mode** - Safe development testing
7. **Track open rates** - Add tracking pixels if needed
8. **Keep templates updated** - Maintain brand consistency

---

## 📚 Documentation Links

- **Quick Start:** `EMAIL_QUICK_START.md`
- **Complete Guide:** `EMAIL_SERVICE_SETUP_COMPLETE.md`
- **Integration Examples:** `EMAIL_INTEGRATION_EXAMPLES.md`
- **Final Report:** `EMAIL_SERVICE_FINAL_REPORT.md`
- **Configuration:** `.env.example`

---

## 🎯 Production Deployment

### Pre-Launch Checklist

```bash
# 1. Configure production environment
✅ Set EMAIL_PROVIDER
✅ Add API key or SMTP credentials
✅ Set FROM address
✅ Disable preview mode

# 2. Verify domain
✅ Add SPF record: "v=spf1 include:_spf.resend.com ~all"
✅ Configure DKIM (via Resend dashboard)
✅ Set DMARC policy

# 3. Test thoroughly
✅ Run: npm run test:email your@email.com --template=all
✅ Check delivery to Gmail, Outlook, Yahoo
✅ Test mobile rendering
✅ Verify links work

# 4. Monitor
✅ Set up /api/health/email monitoring
✅ Configure alerts for failures
✅ Track delivery rates
```

---

## 🚀 Next Steps

1. **Configure:** Add credentials to `.env`
2. **Test:** Run `npm run test:email`
3. **Integrate:** Update auth flows
4. **Monitor:** Check `/api/health/email`
5. **Deploy:** Follow production checklist

---

**Email Service:** ✅ Ready  
**Templates:** ✅ 5 Available  
**Testing:** ✅ Comprehensive  
**Docs:** ✅ Complete  

*Start sending beautiful emails in 5 minutes!* 📧✨
