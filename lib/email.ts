import nodemailer from 'nodemailer';

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

// Create email transporter
function createTransporter() {
  const config: EmailConfig = {
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    auth: {
      user: process.env.EMAIL_SERVER_USER || '',
      pass: process.env.EMAIL_SERVER_PASSWORD || ''
    }
  };

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    auth: config.auth,
    tls: {
      rejectUnauthorized: false // For development only
    }
  });
}

// Send email utility
async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.warn('Email credentials not configured, skipping email send');
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

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
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

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}