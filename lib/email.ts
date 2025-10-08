import * as nodemailer from 'nodemailer';

// Email configuration interfaces
interface EmailConfig {
  host: string;
  port: number;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create email transporter with enhanced configuration
function createTransporter() {
  // Validate required environment variables
  const host = process.env.EMAIL_SERVER_HOST;
  const port = process.env.EMAIL_SERVER_PORT;
  const user = process.env.EMAIL_SERVER_USER;
  const password = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !port || !user || !password) {
    throw new Error(
      'Missing required email configuration. Please set EMAIL_SERVER_HOST, EMAIL_SERVER_PORT, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD in your .env file.'
    );
  }

  const portNumber = Number(port);
  if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
    throw new Error('EMAIL_SERVER_PORT must be a valid port number between 1 and 65535');
  }

  const config: EmailConfig = {
    host,
    port: portNumber,
    auth: {
      user,
      pass: password
    }
  };

  // Configuring SMTP transporter

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465 (SSL), false for other ports like 587 (TLS)
    auth: config.auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV !== 'development' // Allow self-signed certificates in development
    },
    // Connection pooling for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    // Enhanced timeout settings
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000      // 60 seconds
  });
}

// Enhanced send email utility with better error handling and logging
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      // Email credentials not configured, skipping email send
      return false;
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@zyphextech.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    // Sending email

    const result = await transporter.sendMail(mailOptions);
    // Email sent successfully
    return true;
  } catch (error) {
    // Failed to send email
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        // Tip: Check your email credentials. For Gmail, you may need an app-specific password.
      } else if (error.message.includes('Connection timeout')) {
        // Tip: Check your SMTP server settings and firewall configuration.
      } else if (error.message.includes('self signed certificate')) {
        // Tip: Your SMTP server uses a self-signed certificate. Consider updating TLS settings.
      }
    }
    
    return false;
  }
}

// Email verification
export async function sendVerificationEmail(
  email: string, 
  verificationUrl: string, 
  userName?: string
): Promise<boolean> {
  const subject = `Verify your email address - ${process.env.APP_NAME || 'Zyphex Tech'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${process.env.APP_NAME || 'Zyphex Tech'}!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          
          <p>Thank you for signing up! Please verify your email address to complete your registration and access all features.</p>
          
          <p>Click the button below to verify your email:</p>
          
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          
          <p><strong>This link will expire in 24 hours.</strong></p>
          
          <p>If you didn't create an account with us, please ignore this email.</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Zyphex Tech'} Team</p>
        </div>
        <div class="footer">
          <p>© 2024 ${process.env.APP_NAME || 'Zyphex Tech'}. All rights reserved.</p>
          <p>If you have any questions, contact us at ${process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

// Welcome email for verified users
export async function sendWelcomeEmail(
  email: string, 
  userName?: string
): Promise<boolean> {
  const subject = `Welcome to ${process.env.APP_NAME || 'Zyphex Tech'}!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to ${process.env.APP_NAME || 'Zyphex Tech'}!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          
          <p>Your email has been verified successfully! Welcome to our platform. We're excited to have you on board.</p>
          
          <div class="features">
            <h3>What you can do now:</h3>
            <ul>
              <li>✅ Access your personalized dashboard</li>
              <li>✅ Explore our premium IT services</li>
              <li>✅ Contact our expert team</li>
              <li>✅ View your project portfolio</li>
              <li>✅ Get priority support</li>
            </ul>
          </div>
          
          <p>Ready to get started?</p>
          
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
          
          <p>If you have any questions or need assistance, our support team is here to help!</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Zyphex Tech'} Team</p>
        </div>
        <div class="footer">
          <p>© 2024 ${process.env.APP_NAME || 'Zyphex Tech'}. All rights reserved.</p>
          <p>Contact us: ${process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

// Password reset email
export async function sendPasswordResetEmail(
  email: string, 
  resetUrl: string, 
  userName?: string
): Promise<boolean> {
  const subject = `Reset your password - ${process.env.APP_NAME || 'Zyphex Tech'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          
          <p>We received a request to reset your password for your ${process.env.APP_NAME || 'Zyphex Tech'} account.</p>
          
          <p>Click the button below to reset your password:</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
          </div>
          
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, if you continue to receive these emails, please contact our support team.</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Zyphex Tech'} Team</p>
        </div>
        <div class="footer">
          <p>© 2024 ${process.env.APP_NAME || 'Zyphex Tech'}. All rights reserved.</p>
          <p>Security Questions? Contact us at ${process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

// Email change notification
export async function sendEmailChangeNotification(
  oldEmail: string,
  newEmail: string,
  userName?: string
): Promise<boolean> {
  const subject = `Email address changed - ${process.env.APP_NAME || 'Zyphex Tech'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Address Changed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Address Changed</h1>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          
          <p>This email confirms that your email address has been changed on your ${process.env.APP_NAME || 'Zyphex Tech'} account.</p>
          
          <p><strong>Previous email:</strong> ${oldEmail}</p>
          <p><strong>New email:</strong> ${newEmail}</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't make this change, please contact our support team immediately.
          </div>
          
          <p>You will need to use your new email address for future logins.</p>
          
          <p>Best regards,<br>The ${process.env.APP_NAME || 'Zyphex Tech'} Team</p>
        </div>
        <div class="footer">
          <p>© 2024 ${process.env.APP_NAME || 'Zyphex Tech'}. All rights reserved.</p>
          <p>Security Questions? Contact us at ${process.env.SUPPORT_EMAIL || 'support@zyphextech.com'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to both old and new email addresses
  const oldEmailResult = await sendEmail({ to: oldEmail, subject, html });
  const newEmailResult = await sendEmail({ to: newEmail, subject, html });
  
  return oldEmailResult && newEmailResult;
}

// Enhanced test email configuration with detailed diagnostics
export async function testEmailConfiguration(): Promise<{
  success: boolean;
  message: string;
  details?: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    from?: string;
    error?: string;
    suggestion?: string;
  };
}> {
  try {
    // Testing email configuration...
    
    // Check if environment variables are set
    const host = process.env.EMAIL_SERVER_HOST;
    const port = process.env.EMAIL_SERVER_PORT;
    const user = process.env.EMAIL_SERVER_USER;
    const password = process.env.EMAIL_SERVER_PASSWORD;
    
    if (!host || !port || !user || !password) {
      return {
        success: false,
        message: 'Email configuration is incomplete. Please check your environment variables.',
        details: {
          host: host || 'Not set',
          port: Number(port) || 0,
          user: user || 'Not set'
        }
      };
    }
    
    const transporter = createTransporter();
    
    // Verifying SMTP connection...
    await transporter.verify();
    
    // Email configuration is valid!
    
    return {
      success: true,
      message: 'Email configuration is valid and ready to send emails.',
      details: {
        host,
        port: Number(port),
        secure: Number(port) === 465,
        user,
        from: process.env.EMAIL_FROM || 'noreply@zyphextech.com'
      }
    };
  } catch (error) {
    // Email configuration test failed
    
    let errorMessage = 'Email configuration test failed.';
    const details: { error: string; suggestion?: string } = { 
      error: error instanceof Error ? error.message : String(error) 
    };
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        errorMessage = 'Invalid email credentials. Please check your username and password.';
        details.suggestion = 'For Gmail, you may need to generate an app-specific password.';
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Cannot connect to email server. Please check your host and port settings.';
        details.suggestion = 'Verify that your SMTP server address and port are correct.';
      } else if (error.message.includes('certificate')) {
        errorMessage = 'SSL/TLS certificate issue with email server.';
        details.suggestion = 'Check your email server SSL/TLS configuration.';
      }
    }
    
    return {
      success: false,
      message: errorMessage,
      details
    };
  }
}

// Send test email
export async function sendTestEmail(
  to: string,
  customMessage?: string
): Promise<boolean> {
  const appName = process.env.APP_NAME || 'Zyphex Tech';
  const subject = `Test Email from ${appName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .success { background: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧪 Test Email</h1>
        </div>
        <div class="content">
          <div class="success">
            <strong>✅ Success!</strong> Your email configuration is working correctly.
          </div>
          
          <p>This is a test email from <strong>${appName}</strong>.</p>
          
          ${customMessage ? `<p><strong>Custom Message:</strong> ${customMessage}</p>` : ''}
          
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>SMTP Host: ${process.env.EMAIL_SERVER_HOST}</li>
            <li>SMTP Port: ${process.env.EMAIL_SERVER_PORT}</li>
            <li>From Address: ${process.env.EMAIL_FROM || 'noreply@zyphextech.com'}</li>
            <li>Test Time: ${new Date().toISOString()}</li>
          </ul>
          
          <p>If you received this email, your email service is configured correctly!</p>
          
          <p>Best regards,<br>The ${appName} Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}