import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
  // For development, we'll use a simple configuration
  // In production, you should use a proper email service like SendGrid, Mailgun, etc.
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      service,
      budget,
      message,
      newsletter,
      terms
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !service || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate terms acceptance
    if (!terms) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions' },
        { status: 400 }
      );
    }

    // Prepare email content
    const fullName = `${firstName} ${lastName}`;
    const subject = `New Contact Form Submission from ${fullName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Contact Form Submission</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { background: white; padding: 8px; border-radius: 4px; border: 1px solid #ddd; }
            .service-tag { display: inline-block; background: #667eea; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Contact Form Submission</h1>
              <p>A potential client has reached out to Zyphex Tech</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${fullName}</div>
              </div>

              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>

              ${phone ? `
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${phone}</div>
              </div>
              ` : ''}

              ${company ? `
              <div class="field">
                <div class="label">Company:</div>
                <div class="value">${company}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="label">Service Interest:</div>
                <div class="value">
                  <span class="service-tag">${service}</span>
                </div>
              </div>

              ${budget ? `
              <div class="field">
                <div class="label">Budget Range:</div>
                <div class="value">${budget}</div>
              </div>
              ` : ''}

              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>

              <div class="field">
                <div class="label">Newsletter Subscription:</div>
                <div class="value">${newsletter ? 'Yes' : 'No'}</div>
              </div>

              <div class="field">
                <div class="label">Submission Date:</div>
                <div class="value">${new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
New Contact Form Submission

Name: ${fullName}
Email: ${email}
${phone ? `Phone: ${phone}\n` : ''}${company ? `Company: ${company}\n` : ''}
Service Interest: ${service}
${budget ? `Budget Range: ${budget}\n` : ''}
Message: ${message}

Newsletter Subscription: ${newsletter ? 'Yes' : 'No'}
Submission Date: ${new Date().toLocaleString()}
    `;

    // Send email to company
    try {
      const transporter = createTransporter();

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@zyphextech.com',
        to: process.env.CONTACT_EMAIL || 'contact@zyphextech.com',
        subject: subject,
        html: htmlContent,
        text: textContent,
      });

      // Optional: Send confirmation email to user
      if (process.env.SEND_CONFIRMATION_EMAIL === 'true') {
        const confirmationHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Thank you for contacting Zyphex Tech</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Thank you for contacting Zyphex Tech!</h1>
                </div>
                <div class="content">
                  <p>Dear ${firstName},</p>
                  <p>Thank you for reaching out to us. We've received your message and will get back to you within 24 hours.</p>
                  <p>Here's a summary of your inquiry:</p>
                  <ul>
                    <li><strong>Service:</strong> ${service}</li>
                    ${budget ? `<li><strong>Budget:</strong> ${budget}</li>` : ''}
                  </ul>
                  <p>Best regards,<br>The Zyphex Tech Team</p>
                </div>
              </div>
            </body>
          </html>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@zyphextech.com',
          to: email,
          subject: 'Thank you for contacting Zyphex Tech',
          html: confirmationHtml,
        });
      }

    } catch (emailError) {
      // Don't fail the request if email fails, but log it
      // In production, you might want to use a queue system
    }

    // Store in database (optional - for record keeping)
    try {
      // You could add database storage here if needed
      // const contactSubmission = await prisma.contactSubmission.create({
      //   data: {
      //     firstName,
      //     lastName,
      //     email,
      //     phone,
      //     company,
      //     service,
      //     budget,
      //     message,
      //     newsletter,
      //   },
      // });
    } catch (dbError) {
      // Don't fail if database storage fails
    }

    return NextResponse.json(
      {
        message: 'Contact form submitted successfully',
        success: true
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
