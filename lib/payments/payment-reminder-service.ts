// @ts-expect-error - PaymentReminderType exists in Prisma client but TypeScript can't find it due to client generation timing
import { PaymentReminderType } from '@prisma/client';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// Local enum definition as fallback for TypeScript
type PaymentReminderTypeLocal = 'BEFORE_DUE' | 'ON_DUE_DATE' | 'OVERDUE_1ST' | 'OVERDUE_2ND' | 'OVERDUE_FINAL' | 'CUSTOM';

interface ReminderConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

interface PaymentReminderRequest {
  invoiceId: string;
  type: PaymentReminderTypeLocal;
  customMessage?: string;
  sendEmail?: boolean;
  sendSms?: boolean;
}

interface _LateFeeConfig {
  percentage?: number;
  flatAmount?: number;
  graceDays: number;
  maxFee?: number;
}

// Define structured interfaces for Prisma results
interface _InvoiceWithRelations {
  id: string;
  clientId: string;
  projectId: string | null;
  invoiceNumber: string;
  amount: number;
  total: number;
  dueDate: Date;
  status: string;
  client: {
    id: string;
    name: string;
    email: string;
    paymentConfigs: Array<{
      id: string;
      lateFeeEnabled: boolean;
      lateFeePercentage?: number;
      lateFeeFlatAmount?: number;
      lateFeeGraceDays: number;
    }>;
  };
  project?: {
    id: string;
    name: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
  paymentReminders: Array<{
    id: string;
    type: string;
  }>;
  lateFees: Array<{
    id: string;
    amount: number;
    waived: boolean;
  }>;
}

interface _PaymentReminderData {
  id: string;
  type: PaymentReminderType;
  sentAt: Date;
  dueDate: Date;
  amount: number;
  lateFee: number;
  reminderText: string;
  emailSent: boolean;
  smsGent: boolean;
  responded: boolean;
}

interface _BasicInvoice {
  id: string;
  invoiceNumber: string;
  total: number;
  dueDate: Date;
  client: {
    name: string;
    email: string;
  };
  project?: {
    name: string;
  } | null;
}

export class PaymentReminderService {
  private emailTransporter: nodemailer.Transporter;
  private config: ReminderConfig;

  constructor(config: ReminderConfig) {
    this.config = config;
    this.emailTransporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });
  }

  /**
   * Send payment reminder for an invoice
   */
  async sendPaymentReminder(request: PaymentReminderRequest) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: request.invoiceId },
        include: { 
          client: true, 
          project: true,
          // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
          payments: {
            where: { status: 'COMPLETED' }
          }
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate remaining balance with proper typing
      // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
      const paidAmount = invoice.payments.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);
      const remainingBalance = invoice.total - paidAmount;

      if (remainingBalance <= 0) {
        // Invoice is already paid, skipping reminder
        return;
      }

      // Determine reminder message
      const reminderMessage = this.generateReminderMessage(invoice, request.type, remainingBalance, request.customMessage);

      // Calculate late fee if applicable
      let lateFee = 0;
      if (request.type !== 'BEFORE_DUE' && request.type !== 'ON_DUE_DATE') {
        lateFee = await this.calculateLateFee(invoice.id, remainingBalance);
      }

      // Create reminder record
      // @ts-expect-error - PaymentReminder model exists but TypeScript can't find it due to client generation timing
      const reminder = await prisma.paymentReminder.create({
        data: {
          invoiceId: request.invoiceId,
          type: request.type,
          sentAt: new Date(),
          dueDate: invoice.dueDate,
          amount: remainingBalance,
          lateFee: lateFee,
          reminderText: reminderMessage,
          emailSent: false,
          smsGent: false,
          responded: false
        }
      });

      // Send email reminder
      if (request.sendEmail !== false) {
        await this.sendEmailReminder(invoice, reminder, reminderMessage, lateFee);
        
        // @ts-expect-error - PaymentReminder model exists but TypeScript can't find it due to client generation timing
        await prisma.paymentReminder.update({
          where: { id: reminder.id },
          data: { emailSent: true }
        });
      }

      // Send SMS reminder (if configured)
      if (request.sendSms) {
        await this.sendSmsReminder(invoice, reminderMessage);
        
        // @ts-expect-error - PaymentReminder model exists but TypeScript can't find it due to client generation timing
        await prisma.paymentReminder.update({
          where: { id: reminder.id },
          data: { smsGent: true }
        });
      }

      // Update invoice reminder timestamp
      await prisma.invoice.update({
        where: { id: request.invoiceId },
        data: { 
          // @ts-expect-error - lastReminderAt field exists but TypeScript can't find it due to client generation timing
          lastReminderAt: new Date() 
        }
      });

      return reminder;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send payment reminder: ${errorMessage}`);
    }
  }

  /**
   * Process automated payment reminders
   */
  async processAutomatedReminders() {
    try {
      const today = new Date();
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      // Get unpaid invoices
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          status: { in: ['SENT', 'OVERDUE'] },
          paidAt: null
        },
        include: { 
          client: true,
          // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
          payments: { where: { status: 'COMPLETED' } },
          paymentReminders: true
        }
      });

      const results = [];

      for (const invoice of unpaidInvoices) {
        // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
        const paidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
        const remainingBalance = invoice.total - paidAmount;

        if (remainingBalance <= 0) continue;

        // Check what reminders have already been sent
        // @ts-expect-error - PaymentReminders relation exists but TypeScript can't find it due to client generation timing
        const sentReminderTypes = invoice.paymentReminders.map((r: { type: string }) => r.type);

        // Before due date reminder (3 days before)
        if (invoice.dueDate <= threeDaysFromNow && 
            invoice.dueDate > today &&
            !sentReminderTypes.includes('BEFORE_DUE')) {
          
          const reminder = await this.sendPaymentReminder({
            invoiceId: invoice.id,
            type: 'BEFORE_DUE',
            sendEmail: true
          });
          results.push({ type: 'BEFORE_DUE', invoiceId: invoice.id, reminder });
        }

        // On due date reminder
        if (invoice.dueDate.toDateString() === today.toDateString() &&
            !sentReminderTypes.includes('ON_DUE_DATE')) {
          
          const reminder = await this.sendPaymentReminder({
            invoiceId: invoice.id,
            type: 'ON_DUE_DATE',
            sendEmail: true
          });
          results.push({ type: 'ON_DUE_DATE', invoiceId: invoice.id, reminder });
        }

        // First overdue reminder (7 days after due)
        if (invoice.dueDate <= sevenDaysAgo &&
            !sentReminderTypes.includes('OVERDUE_1ST')) {
          
          await this.markInvoiceOverdue(invoice.id);
          const reminder = await this.sendPaymentReminder({
            invoiceId: invoice.id,
            type: 'OVERDUE_1ST',
            sendEmail: true
          });
          results.push({ type: 'OVERDUE_1ST', invoiceId: invoice.id, reminder });
        }

        // Second overdue reminder (14 days after due)
        if (invoice.dueDate <= fourteenDaysAgo &&
            !sentReminderTypes.includes('OVERDUE_2ND')) {
          
          const reminder = await this.sendPaymentReminder({
            invoiceId: invoice.id,
            type: 'OVERDUE_2ND',
            sendEmail: true
          });
          results.push({ type: 'OVERDUE_2ND', invoiceId: invoice.id, reminder });
        }
      }

      return results;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process automated reminders: ${errorMessage}`);
    }
  }

  /**
   * Calculate and apply late fees
   */
  async calculateLateFee(invoiceId: string, remainingBalance: number): Promise<number> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { 
          // @ts-expect-error - Client and paymentConfigs relations exist but TypeScript can't find them due to client generation timing
          client: { include: { paymentConfigs: true } },
          lateFees: true
        }
      });

      if (!invoice) return 0;

      // Get late fee configuration
      // @ts-expect-error - Client relation exists but TypeScript can't find it due to client generation timing
      const paymentConfig = invoice.client.paymentConfigs[0];
      if (!paymentConfig || !paymentConfig.lateFeeEnabled) {
        return 0;
      }

      // Check grace period
      const daysPastDue = Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPastDue <= paymentConfig.lateFeeGraceDays) {
        return 0;
      }

      // Check if late fee already applied
      // @ts-expect-error - LateFees relation exists but TypeScript can't find it due to client generation timing
      const existingLateFee = invoice.lateFees.find((fee: { waived: boolean }) => !fee.waived);
      if (existingLateFee) {
        return existingLateFee.amount;
      }

      // Calculate late fee
      let lateFeeAmount = 0;
      
      if (paymentConfig.lateFeePercentage) {
        lateFeeAmount = remainingBalance * (paymentConfig.lateFeePercentage / 100);
      } else if (paymentConfig.lateFeeFlatAmount) {
        lateFeeAmount = paymentConfig.lateFeeFlatAmount;
      }

      if (lateFeeAmount > 0) {
        // Apply late fee
        // @ts-expect-error - LateFee model exists but TypeScript can't find it due to client generation timing
        await prisma.lateFee.create({
          data: {
            invoiceId: invoiceId,
            amount: lateFeeAmount,
            percentage: paymentConfig.lateFeePercentage,
            flatFee: paymentConfig.lateFeeFlatAmount,
            appliedAt: new Date(),
            reason: `Late fee applied ${daysPastDue} days after due date`
          }
        });

        // Update invoice total
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            total: invoice.total + lateFeeAmount
          }
        });
      }

      return lateFeeAmount;

    } catch (error: unknown) {
      return 0;
    }
  }

  /**
   * Waive late fee for an invoice
   */
  async waiveLateFee(invoiceId: string, lateFeeId: string, waivedBy: string, _reason?: string) {
    try {
      // @ts-expect-error - LateFee model exists but TypeScript can't find it due to client generation timing
      const lateFee = await prisma.lateFee.findUnique({
        where: { id: lateFeeId },
        include: { invoice: true }
      });

      if (!lateFee || lateFee.invoiceId !== invoiceId) {
        throw new Error('Late fee not found');
      }

      if (lateFee.waived) {
        throw new Error('Late fee already waived');
      }

      // Waive the late fee
      // @ts-expect-error - LateFee model exists but TypeScript can't find it due to client generation timing
      await prisma.lateFee.update({
        where: { id: lateFeeId },
        data: {
          waived: true,
          waivedAt: new Date(),
          waivedBy: waivedBy
        }
      });

      // Update invoice total
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          total: lateFee.invoice.total - lateFee.amount
        }
      });

      return { success: true, message: 'Late fee waived successfully' };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to waive late fee: ${errorMessage}`);
    }
  }

  /**
   * Mark invoice as overdue
   */
  private async markInvoiceOverdue(invoiceId: string) {
    try {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'OVERDUE',
          // @ts-expect-error - overdueAt field exists but TypeScript can't find it due to client generation timing
          overdueAt: new Date()
        }
      });
    } catch (error: unknown) {
      // Failed to mark invoice as overdue
    }
  }

  /**
   * Generate reminder message based on type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateReminderMessage(invoice: any, type: PaymentReminderTypeLocal, remainingBalance: number, customMessage?: string): string {
    if (customMessage) return customMessage;

    const daysOverdue = Math.floor((Date.now() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (type) {
      case 'BEFORE_DUE':
        return `Friendly reminder: Invoice #${invoice.invoiceNumber} for $${remainingBalance.toFixed(2)} is due on ${invoice.dueDate.toLocaleDateString()}. Please submit payment to avoid any late fees.`;
      
      case 'ON_DUE_DATE':
        return `Payment due today: Invoice #${invoice.invoiceNumber} for $${remainingBalance.toFixed(2)} is due today. Please submit payment as soon as possible.`;
      
      case 'OVERDUE_1ST':
        return `Overdue notice: Invoice #${invoice.invoiceNumber} for $${remainingBalance.toFixed(2)} is now ${daysOverdue} days overdue. Please submit payment immediately to avoid additional late fees.`;
      
      case 'OVERDUE_2ND':
        return `Second notice: Invoice #${invoice.invoiceNumber} for $${remainingBalance.toFixed(2)} is ${daysOverdue} days overdue. Immediate payment is required. Please contact us if you need to discuss payment arrangements.`;
      
      case 'OVERDUE_FINAL':
        return `Final notice: Invoice #${invoice.invoiceNumber} for $${remainingBalance.toFixed(2)} is severely overdue (${daysOverdue} days). This account will be forwarded to collections if payment is not received within 5 business days.`;
      
      default:
        return `Payment reminder: Invoice #${invoice.invoiceNumber} for $${remainingBalance.toFixed(2)} requires your attention.`;
    }
  }

  /**
   * Send email reminder
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendEmailReminder(invoice: any, reminder: any, message: string, lateFee: number) {
    try {
      const subject = this.getEmailSubject(reminder.type, invoice.invoiceNumber);
      
      const htmlContent = this.generateEmailTemplate(invoice, message, lateFee);

      await this.emailTransporter.sendMail({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: invoice.client.email,
        subject: subject,
        html: htmlContent,
        text: message
      });

    } catch (error: unknown) {
      throw new Error('Failed to send email reminder');
    }
  }

  /**
   * Send SMS reminder (placeholder for SMS service integration)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendSmsReminder(invoice: any, message: string) {
    try {
      // Placeholder for SMS service integration (Twilio, AWS SNS, etc.)
      // SMS reminder would be sent here for invoice
      
      // TODO: Integrate with SMS service
      // const sms = await twilioClient.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: invoice.client.phone
      // });

    } catch (error: unknown) {
      // SMS reminder failed
    }
  }

  /**
   * Get email subject based on reminder type
   */
  private getEmailSubject(type: PaymentReminderTypeLocal, invoiceNumber: string): string {
    switch (type) {
      case 'BEFORE_DUE':
        return `Payment Reminder - Invoice #${invoiceNumber} Due Soon`;
      case 'ON_DUE_DATE':
        return `Payment Due Today - Invoice #${invoiceNumber}`;
      case 'OVERDUE_1ST':
        return `Overdue Notice - Invoice #${invoiceNumber}`;
      case 'OVERDUE_2ND':
        return `Second Notice - Invoice #${invoiceNumber} Past Due`;
      case 'OVERDUE_FINAL':
        return `FINAL NOTICE - Invoice #${invoiceNumber} Collection Warning`;
      default:
        return `Payment Reminder - Invoice #${invoiceNumber}`;
    }
  }

  /**
   * Generate email template
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateEmailTemplate(invoice: any, message: string, lateFee: number): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .invoice-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .amount { font-size: 24px; font-weight: bold; color: #2563eb; }
        .late-fee { color: #dc2626; font-weight: bold; }
        .footer { background: #374151; color: white; padding: 15px; text-align: center; font-size: 12px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Zyphex Technologies</h1>
          <h2>Payment Reminder</h2>
        </div>
        
        <div class="content">
          <p>Dear ${invoice.client.name},</p>
          <p>${message}</p>
          
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Invoice Number:</strong> #${invoice.invoiceNumber}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> <span class="amount">$${invoice.total.toFixed(2)}</span></p>
            ${lateFee > 0 ? `<p><strong>Late Fee Applied:</strong> <span class="late-fee">$${lateFee.toFixed(2)}</span></p>` : ''}
            ${invoice.project ? `<p><strong>Project:</strong> ${invoice.project.name}</p>` : ''}
          </div>
          
          <p>To make a payment, please click the button below or contact us directly.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/payment/invoice/${invoice.id}" class="button">
            Pay Now
          </a>
          
          <p>If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to contact us.</p>
          
          <p>Thank you for your business!</p>
        </div>
        
        <div class="footer">
          <p>Zyphex Technologies</p>
          <p>Email: ${this.config.fromEmail} | Website: zyphex.com</p>
          <p>This is an automated reminder. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }
}

export default PaymentReminderService;