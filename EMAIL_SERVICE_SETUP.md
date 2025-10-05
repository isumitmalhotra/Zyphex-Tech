# Email Service Integration Setup Guide

## Overview

The email service has been successfully integrated into your Zyphex Tech application using Nodemailer with enhanced configuration, error handling, and security features.

## Files Created/Modified

### 1. Enhanced Email Service (`lib/email.ts`)
- **Enhanced SMTP Configuration**: Validates environment variables and provides detailed error messages
- **Improved Security**: Different TLS settings for development vs production
- **Connection Pooling**: Better performance with connection reuse
- **Error Handling**: Specific error messages for common issues (invalid credentials, connection timeouts, etc.)
- **Email Templates**: Professional HTML templates for verification, password reset, welcome, and email change notifications
- **Test Functions**: Built-in configuration testing and test email sending

### 2. Environment Configuration Example (`.env.email.example`)
- Complete example of required environment variables
- Provider-specific instructions (Gmail, Outlook, Yahoo)
- Security best practices and setup tips

### 3. Test API Endpoint (`app/api/auth/test-email/route.ts`)
- **GET**: Test email configuration and SMTP connection
- **POST**: Send test emails to verify functionality

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Server Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# Email Settings
EMAIL_FROM=noreply@zyphextech.com

# App Configuration
APP_NAME=Zyphex Tech
APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@zyphextech.com
```

## Provider-Specific Setup

### Gmail Setup
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → App passwords
   - Select "Mail" and generate password
   - Use this password in `EMAIL_SERVER_PASSWORD`
3. **Configuration**:
   ```env
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-16-char-app-password
   ```

### Outlook/Hotmail Setup
1. **Enable SMTP** in your Outlook account settings
2. **Configuration**:
   ```env
   EMAIL_SERVER_HOST=smtp-mail.outlook.com
   EMAIL_SERVER_PORT=587
   EMAIL_SERVER_USER=your-email@outlook.com
   EMAIL_SERVER_PASSWORD=your-regular-password
   ```

### Custom SMTP Provider
1. **Get SMTP settings** from your email provider
2. **Common ports**:
   - 587: TLS (recommended)
   - 465: SSL
   - 25: Unencrypted (not recommended)

## Available Functions

### Core Functions

```typescript
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail, 
  sendEmailChangeNotification,
  testEmailConfiguration,
  sendTestEmail 
} from '@/lib/email';
```

### 1. Email Verification
```typescript
const success = await sendVerificationEmail(
  'user@example.com',
  'https://yourapp.com/verify?token=abc123',
  'John Doe' // optional
);
```

### 2. Password Reset
```typescript
const success = await sendPasswordResetEmail(
  'user@example.com',
  'https://yourapp.com/reset?token=abc123',
  'John Doe' // optional
);
```

### 3. Welcome Email
```typescript
const success = await sendWelcomeEmail(
  'user@example.com',
  'John Doe' // optional
);
```

### 4. Email Change Notification
```typescript
const success = await sendEmailChangeNotification(
  'old@example.com',
  'new@example.com',
  'John Doe' // optional
);
```

### 5. Test Configuration
```typescript
const result = await testEmailConfiguration();
console.log(result.success, result.message, result.details);
```

### 6. Send Test Email
```typescript
const success = await sendTestEmail(
  'test@example.com',
  'Custom test message' // optional
);
```

## API Endpoints

### Test Configuration
```bash
GET /api/auth/test-email
```

**Response:**
```json
{
  "success": true,
  "message": "Email configuration is valid and ready to send emails.",
  "details": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "your-email@gmail.com",
    "from": "noreply@zyphextech.com"
  },
  "timestamp": "2024-10-03T12:00:00.000Z"
}
```

### Send Test Email
```bash
POST /api/auth/test-email
Content-Type: application/json

{
  "to": "test@example.com",
  "message": "Custom test message"
}
```

## Security Features

### 1. Environment Validation
- Validates all required environment variables
- Provides specific error messages for missing configuration
- Port validation and secure connection detection

### 2. TLS/SSL Configuration
- Automatic SSL detection for port 465
- Development vs production TLS settings
- Strong cipher suites for production

### 3. Connection Pooling
- Reuses SMTP connections for better performance
- Configurable connection limits
- Automatic connection cleanup

### 4. Error Handling
- Specific error messages for common issues
- Helpful suggestions for Gmail app passwords
- Network and certificate error detection

### 5. Rate Limiting Ready
- Connection pooling prevents overwhelming SMTP servers
- Ready for bulk email operations with built-in batching

## Testing Your Setup

### 1. Test Configuration
```bash
curl -X GET http://localhost:3000/api/auth/test-email
```

### 2. Send Test Email
```bash
curl -X POST http://localhost:3000/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "message": "Test from Zyphex Tech"}'
```

### 3. Check Development Console
Look for these log messages:
- `🔧 Configuring SMTP transporter for...`
- `📤 Sending email to:...`
- `✅ Email sent successfully:...`

## Troubleshooting

### Common Issues

#### 1. "Invalid login" Error
- **Gmail**: Use app-specific password, not regular password
- **Outlook**: Ensure SMTP is enabled in account settings
- **Custom**: Verify username/password with your provider

#### 2. "Connection refused" Error
- Check SMTP host and port settings
- Verify firewall/network access to SMTP server
- Try different ports (587 for TLS, 465 for SSL)

#### 3. "Certificate" Errors
- Production: Contact your SMTP provider
- Development: Check TLS settings in the configuration

#### 4. "Authentication failed"
- Verify credentials are correctly set in .env
- For Gmail, ensure 2FA is enabled and app password is used
- Check if account has SMTP access enabled

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed SMTP communication logs.

## Integration with NextAuth

The email service integrates seamlessly with your existing NextAuth configuration. Update your `lib/auth.ts` to use these functions:

```typescript
import { sendVerificationEmail } from '@/lib/email';

// In your NextAuth configuration
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === 'email') {
      // Send verification email for email sign-ups
      await sendVerificationEmail(
        user.email!,
        `${process.env.APP_URL}/verify?token=${token}`,
        user.name || undefined
      );
    }
    return true;
  }
}
```

## Production Considerations

### 1. Email Service Providers
For production, consider using dedicated email services:
- **SendGrid**: Professional email API
- **AWS SES**: Amazon's email service
- **Mailgun**: Developer-friendly email API
- **Postmark**: Transactional email specialist

### 2. Security
- Use environment variables for all credentials
- Enable 2FA for email accounts
- Use app-specific passwords
- Regularly rotate credentials
- Monitor email delivery rates

### 3. Deliverability
- Set up SPF, DKIM, and DMARC records
- Use a dedicated sending domain
- Monitor bounce and complaint rates
- Implement email validation

### 4. Monitoring
- Log all email sending attempts
- Monitor delivery success rates
- Set up alerts for email failures
- Track email engagement metrics

## Support

The email service includes comprehensive error handling and logging. Check your application logs for detailed error messages and suggested fixes.

For additional help:
1. Check the console logs for specific error messages
2. Test your configuration using the `/api/auth/test-email` endpoint
3. Verify your SMTP provider's documentation
4. Ensure all environment variables are properly set

## Features Summary

✅ **Complete SMTP Configuration** - Works with any SMTP provider  
✅ **Security Hardened** - TLS/SSL, connection pooling, credential validation  
✅ **Professional Templates** - Beautiful HTML email templates  
✅ **Error Handling** - Comprehensive error messages and suggestions  
✅ **Testing Tools** - Built-in configuration testing and test emails  
✅ **Production Ready** - Connection pooling, rate limiting, monitoring  
✅ **Developer Friendly** - Detailed logging and debug information  
✅ **NextAuth Integration** - Ready to use with your authentication system  

Your email service is now fully configured and ready for password resets, email verifications, and all authentication-related email communications!