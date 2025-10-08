# 📧 Titan Email - Complete Setup Guide

## 🌟 Overview

This guide will help you configure **Titan Email** with your Zyphex Tech application. Titan provides professional email hosting with excellent deliverability and enterprise-grade features.

---

## ✅ Current Configuration

Your Titan Email is already configured in `.env`:

```env
# Titan Email SMTP Configuration
EMAIL_SERVER_HOST=smtp.titan.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=No-reply@zyphextech.com
EMAIL_SERVER_PASSWORD=No-Reply@1
```

---

## 🔧 Titan Email Settings

### SMTP Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| **Host** | `smtp.titan.email` | Titan's SMTP server |
| **Port** | `587` (TLS) or `465` (SSL) | Standard ports |
| **Security** | STARTTLS | Recommended |
| **Authentication** | Required | Username + Password |
| **Username** | `No-reply@zyphextech.com` | Your Titan email |
| **Password** | `No-Reply@1` | Your email password |

### IMAP Settings (For Reference)

| Setting | Value |
|---------|-------|
| **Host** | `imap.titan.email` |
| **Port** | `993` (SSL) or `143` (STARTTLS) |
| **Security** | SSL/TLS |

### POP3 Settings (For Reference)

| Setting | Value |
|---------|-------|
| **Host** | `pop.titan.email` |
| **Port** | `995` (SSL) or `110` (STARTTLS) |
| **Security** | SSL/TLS |

---

## 🚀 Testing Your Configuration

### 1. Test SMTP Connection

Create a test file: `test-titan-email.ts`

```typescript
import { sendEmail } from '@/lib/email'

async function testTitanEmail() {
  try {
    console.log('🧪 Testing Titan Email connection...\n')
    
    const result = await sendEmail({
      to: 'your-test-email@example.com', // Change this to your email
      subject: 'Test Email from Zyphex Tech',
      html: `
        <h1>✅ Email Test Successful!</h1>
        <p>Your Titan Email SMTP configuration is working correctly.</p>
        <p><strong>Sent from:</strong> No-reply@zyphextech.com</p>
        <p><strong>Server:</strong> smtp.titan.email:587</p>
      `,
      text: 'Email Test Successful! Your Titan Email SMTP configuration is working correctly.'
    })
    
    if (result) {
      console.log('✅ Email sent successfully!')
      console.log('📧 Check your inbox at: your-test-email@example.com')
    } else {
      console.log('❌ Email failed to send')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testTitanEmail()
```

Run the test:
```bash
npx ts-node test-titan-email.ts
```

### 2. Test Registration Email Flow

```bash
# 1. Start your development server
npm run dev

# 2. Go to: http://localhost:3000/auth/register

# 3. Create a new account with your email

# 4. Check your inbox for verification email
```

---

## 🔐 Security Best Practices

### 1. Environment Variables (Production)

**Never commit credentials to Git!** For production, use:

```env
# .env.production (DO NOT COMMIT)
EMAIL_SERVER_HOST=smtp.titan.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=${TITAN_EMAIL_USER}
EMAIL_SERVER_PASSWORD=${TITAN_EMAIL_PASSWORD}
```

Set these in your VPS:
```bash
# On your server
export TITAN_EMAIL_USER="No-reply@zyphextech.com"
export TITAN_EMAIL_PASSWORD="your-secure-password"
```

### 2. Use App-Specific Passwords

Consider using Titan's app-specific passwords for better security:
1. Log in to Titan Email admin panel
2. Go to Security Settings
3. Generate app-specific password
4. Use that password in your `.env` file

### 3. Enable 2FA

Enable two-factor authentication on your Titan account for enhanced security.

---

## 📊 DNS Configuration

### Required DNS Records

To ensure best deliverability, configure these DNS records in your domain settings:

#### 1. SPF Record (Sender Policy Framework)

```txt
Type: TXT
Name: @
Value: v=spf1 include:titan.email ~all
TTL: 3600
```

**What it does:** Prevents email spoofing by specifying which servers can send email from your domain.

#### 2. DKIM Record (DomainKeys Identified Mail)

Get your DKIM keys from Titan Email admin panel, then add:

```txt
Type: TXT
Name: default._domainkey
Value: [Your DKIM key from Titan]
TTL: 3600
```

**What it does:** Adds digital signature to your emails for authentication.

#### 3. DMARC Record (Domain-based Message Authentication)

```txt
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@zyphextech.com
TTL: 3600
```

**What it does:** Tells receiving servers what to do with emails that fail SPF/DKIM checks.

#### 4. MX Records (Mail Exchange)

```txt
Type: MX
Priority: 10
Value: mx1.titan.email
TTL: 3600

Type: MX
Priority: 20
Value: mx2.titan.email
TTL: 3600
```

**What it does:** Routes incoming emails to Titan's servers.

### Verify DNS Configuration

Check your DNS records:
```bash
# Check SPF
nslookup -type=TXT zyphextech.com

# Check MX records
nslookup -type=MX zyphextech.com

# Check DKIM
nslookup -type=TXT default._domainkey.zyphextech.com
```

Or use online tools:
- [MXToolbox](https://mxtoolbox.com/)
- [DNS Checker](https://dnschecker.org/)

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "Authentication Failed" Error

**Solution:**
- Verify username is correct: `No-reply@zyphextech.com`
- Check password is correct
- Ensure 2FA is disabled or using app-specific password
- Check if account is active in Titan admin panel

```bash
# Test credentials manually
telnet smtp.titan.email 587
EHLO zyphextech.com
AUTH LOGIN
# Enter base64 encoded username
# Enter base64 encoded password
```

#### 2. Connection Timeout

**Solution:**
- Check firewall allows port 587
- Verify server can reach `smtp.titan.email`
- Try alternative port 465 (SSL)

```bash
# Test connectivity
telnet smtp.titan.email 587
# Should connect successfully

# Test with OpenSSL
openssl s_client -connect smtp.titan.email:587 -starttls smtp
```

#### 3. Emails Going to Spam

**Solutions:**
- ✅ Configure SPF, DKIM, DMARC records (see above)
- ✅ Use your custom domain in `EMAIL_FROM`
- ✅ Warm up your email sending (start with low volume)
- ✅ Maintain good sender reputation
- ✅ Include unsubscribe link in marketing emails
- ✅ Avoid spam trigger words

#### 4. "Connection Refused" Error

**Solution:**
- Check if using correct port (587 or 465)
- Verify TLS settings in code
- Check VPS firewall rules

```typescript
// Ensure your email config uses correct TLS settings
const transporter = createTransporter({
  host: 'smtp.titan.email',
  port: 587,
  secure: false, // false for port 587, true for 465
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD
  },
  tls: {
    rejectUnauthorized: true
  }
})
```

---

## 📈 Monitoring & Logs

### Enable Email Logging

Update `lib/email.ts` to add detailed logging:

```typescript
async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('📧 Sending email:', {
    to: options.to,
    subject: options.subject,
    timestamp: new Date().toISOString()
  })
  
  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Zyphex Tech <no-reply@zyphextech.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    })
    
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    })
    
    return true
  } catch (error) {
    console.error('❌ Email sending failed:', error)
    return false
  }
}
```

### Monitor Email Deliverability

Track these metrics:
- **Sent**: Total emails sent
- **Delivered**: Successfully delivered
- **Bounced**: Failed deliveries
- **Spam**: Marked as spam
- **Opened**: Email opens (requires tracking pixel)
- **Clicked**: Link clicks (requires UTM parameters)

---

## 🌐 Production Deployment

### VPS Configuration

1. **Set environment variables on your VPS:**

```bash
ssh root@66.116.199.219

# Edit environment file
nano /var/www/zyphextech/.env

# Add Titan credentials
EMAIL_SERVER_HOST=smtp.titan.email
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=No-reply@zyphextech.com
EMAIL_SERVER_PASSWORD=No-Reply@1

# Restart application
pm2 restart zyphextech
```

2. **Verify configuration:**

```bash
# Check if variables are set
pm2 env zyphextech | grep EMAIL

# Check logs
pm2 logs zyphextech --lines 100
```

3. **Test email sending:**

```bash
# On VPS
cd /var/www/zyphextech
node -e "
const { sendEmail } = require('./lib/email');
sendEmail({
  to: 'test@example.com',
  subject: 'Production Test',
  html: '<p>Test from production</p>',
  text: 'Test from production'
}).then(r => console.log('Result:', r));
"
```

---

## 📊 Rate Limits

### Titan Email Limits

| Plan | Daily Limit | Per Hour | Per Minute |
|------|-------------|----------|------------|
| **Standard** | 1,000 | 100 | 10 |
| **Professional** | 5,000 | 500 | 50 |
| **Enterprise** | Custom | Custom | Custom |

### Implement Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 emails per hour
  message: 'Too many emails sent, please try again later'
})

// Apply to email routes
app.post('/api/auth/register', emailLimiter, registerHandler)
```

---

## 🎯 Best Practices

### ✅ DO:

1. **Use Professional Email Addresses**
   - ✅ `no-reply@zyphextech.com`
   - ✅ `support@zyphextech.com`
   - ✅ `notifications@zyphextech.com`
   - ❌ `test@gmail.com`

2. **Include Plain Text Version**
   - Already handled by templates ✅

3. **Implement Email Verification**
   - Already implemented ✅

4. **Monitor Deliverability**
   - Use Titan analytics dashboard

5. **Keep DNS Records Updated**
   - Regularly verify SPF/DKIM/DMARC

### ❌ DON'T:

1. **Don't Send Bulk Emails Without Permission**
2. **Don't Use Deceptive Subject Lines**
3. **Don't Forget Unsubscribe Links** (for marketing)
4. **Don't Ignore Bounce Rates**
5. **Don't Send From Shared/Generic Emails** (affects reputation)

---

## 📞 Support

### Titan Email Support

- **Website**: [titan.email](https://titan.email)
- **Support Portal**: [support.titan.email](https://support.titan.email)
- **Documentation**: [help.titan.email](https://help.titan.email)
- **Status Page**: [status.titan.email](https://status.titan.email)

### Zyphex Tech Email Issues

If you encounter email issues:

1. **Check Configuration**: Verify `.env` settings
2. **Review Logs**: Check `pm2 logs` or console output
3. **Test Connection**: Use test script above
4. **Verify DNS**: Check DNS records are propagated
5. **Contact Titan**: If SMTP issues persist

---

## ✅ Quick Checklist

Before going live:

- [ ] Titan Email account is active
- [ ] SMTP credentials are correct in `.env`
- [ ] DNS records configured (SPF, DKIM, DMARC, MX)
- [ ] Test email sending works locally
- [ ] Test email sending works on VPS
- [ ] Emails are not going to spam
- [ ] Email templates are branded correctly
- [ ] Rate limiting is implemented
- [ ] Error handling is in place
- [ ] Monitoring/logging is set up

---

**Configuration Status**: ✅ Active  
**SMTP Server**: smtp.titan.email:587  
**Email From**: No-reply@zyphextech.com  
**Last Updated**: December 2024
