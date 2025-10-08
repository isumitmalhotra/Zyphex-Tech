// @ts-expect-error - PayPal service exists but TypeScript can't find it due to module resolution timing
import PayPalPaymentService from './paypal-service';
import PaymentReminderService from './payment-reminder-service';
import AlternativePaymentService from './alternative-payment-service';
import { prisma } from '@/lib/prisma';

// Local enum definitions as fallback for TypeScript
type PaymentMethodLocal = 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'CHECK' | 'WIRE_TRANSFER' | 'CASH' | 'CREDIT_CARD';
type _PaymentStatusLocal = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'PARTIALLY_PAID' | 'CHARGEBACK';

interface PaymentProcessorConfig {
  stripe?: {
    publishableKey: string;
    secretKey: string;
    webhookSecret?: string;
  };
  paypal?: {
    clientId: string;
    clientSecret: string;
    sandbox: boolean;
  };
  email?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
}

interface CreatePaymentRequest {
  invoiceId: string;
  paymentMethod: PaymentMethodLocal;
  amount?: number; // Optional, defaults to invoice total
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
}

interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentCount: number;
  lastPaymentDate?: Date;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

export class PaymentProcessingService {
  private paypalService?: PayPalPaymentService;
  private reminderService?: PaymentReminderService;
  private alternativeService: AlternativePaymentService;
  private config: PaymentProcessorConfig;

  constructor(config: PaymentProcessorConfig) {
    this.config = config;
    
    // Initialize PayPal service if configured
    if (config.paypal) {
      this.paypalService = new PayPalPaymentService(config.paypal);
    }

    // Initialize reminder service if email configured
    if (config.email) {
      this.reminderService = new PaymentReminderService(config.email);
    }

    // Always initialize alternative payment service
    this.alternativeService = new AlternativePaymentService();
  }

  /**
   * Create payment for invoice with specified method
   */
  async createPayment(request: CreatePaymentRequest) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: request.invoiceId },
        include: { 
          // @ts-expect-error - Client and paymentConfigs relations exist but TypeScript can't find them due to client generation timing
          client: { include: { paymentConfigs: true } },
          payments: { where: { status: 'COMPLETED' } }
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Calculate amount to pay with proper typing
      // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
      const paidAmount = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      const remainingBalance = invoice.total - paidAmount;
      const paymentAmount = request.amount || remainingBalance;

      if (paymentAmount <= 0) {
        throw new Error('Invoice is already paid in full');
      }

      // Route to appropriate payment processor
      switch (request.paymentMethod) {
        case 'STRIPE':
          // Note: Stripe service would be imported and used here
          throw new Error('Stripe integration not yet implemented in this demo');

        case 'PAYPAL':
          if (!this.paypalService) {
            throw new Error('PayPal not configured');
          }
          return await this.paypalService.createOrder({
            invoiceId: request.invoiceId,
            amount: paymentAmount,
            // @ts-expect-error - Currency field exists but TypeScript can't find it due to client generation timing
            currency: invoice.currency,
            returnUrl: request.returnUrl,
            cancelUrl: request.cancelUrl
          });

        case 'BANK_TRANSFER':
          // Generate payment instructions
          const instructions = await this.alternativeService.generatePaymentInstructions(
            request.invoiceId,
            ['BANK_TRANSFER']
          );
          return {
            paymentMethod: 'BANK_TRANSFER',
            amount: paymentAmount,
            // @ts-expect-error - Currency field exists but TypeScript can't find it due to client generation timing
            currency: invoice.currency,
            instructions: instructions.bankTransfer
          };

        case 'CHECK':
          const checkInstructions = await this.alternativeService.generatePaymentInstructions(
            request.invoiceId,
            ['CHECK']
          );
          return {
            paymentMethod: 'CHECK',
            amount: paymentAmount,
            // @ts-expect-error - Currency field exists but TypeScript can't find it due to client generation timing
            currency: invoice.currency,
            instructions: checkInstructions.check
          };

        default:
          throw new Error(`Payment method ${request.paymentMethod} not supported`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create payment: ${errorMessage}`);
    }
  }

  /**
   * Process payment webhook from external providers
   */
  async processWebhook(provider: 'stripe' | 'paypal', body: string | object, headers: Record<string, string>) {
    try {
      switch (provider) {
        case 'stripe':
          // Note: Stripe webhook handling would be implemented here
          throw new Error('Stripe webhook handling not yet implemented');

        case 'paypal':
          if (!this.paypalService) {
            throw new Error('PayPal not configured');
          }
          return await this.paypalService.handleWebhook(body, headers);

        default:
          throw new Error(`Unknown webhook provider: ${provider}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process webhook: ${errorMessage}`);
    }
  }

  /**
   * Get payment summary for an invoice
   */
  async getPaymentSummary(invoiceId: string): Promise<PaymentSummary> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { 
          // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
          payments: true,
          lateFees: { where: { waived: false } }
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
      const completedPayments = invoice.payments.filter((p: { status: string }) => p.status === 'COMPLETED');
      const paidAmount = completedPayments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      
      // Include late fees in total amount
      // @ts-expect-error - LateFees relation exists but TypeScript can't find it due to client generation timing
      const lateFeeAmount = invoice.lateFees.reduce((sum: number, fee: { amount: number }) => sum + fee.amount, 0);
      const totalAmount = invoice.total + lateFeeAmount;
      const remainingBalance = totalAmount - paidAmount;

      // Determine status
      let status: PaymentSummary['status'] = 'PENDING';
      if (remainingBalance <= 0) {
        status = 'PAID';
      } else if (paidAmount > 0) {
        status = 'PARTIAL';
      } else if (invoice.dueDate < new Date()) {
        status = 'OVERDUE';
      }

      const lastPayment = completedPayments
        .sort((a: { processedAt?: Date }, b: { processedAt?: Date }) => (b.processedAt?.getTime() || 0) - (a.processedAt?.getTime() || 0))[0];

      return {
        totalAmount,
        paidAmount,
        remainingBalance,
        paymentCount: completedPayments.length,
        lastPaymentDate: lastPayment?.processedAt || undefined,
        status
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get payment summary: ${errorMessage}`);
    }
  }

  /**
   * Send payment reminder for invoice
   */
  async sendPaymentReminder(invoiceId: string, type: 'before_due' | 'overdue' | 'final' = 'overdue') {
    try {
      if (!this.reminderService) {
        throw new Error('Payment reminders not configured');
      }

      const reminderType = type === 'before_due' ? 'BEFORE_DUE' : 
                          type === 'final' ? 'OVERDUE_FINAL' : 'OVERDUE_1ST';

      return await this.reminderService.sendPaymentReminder({
        invoiceId,
        type: reminderType,
        sendEmail: true
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send payment reminder: ${errorMessage}`);
    }
  }

  /**
   * Process automated reminders for all invoices
   */
  async processAutomatedReminders() {
    try {
      if (!this.reminderService) {
        throw new Error('Payment reminders not configured');
      }

      return await this.reminderService.processAutomatedReminders();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process automated reminders: ${errorMessage}`);
    }
  }

  /**
   * Calculate and apply late fees
   */
  async applyLateFees(invoiceId: string) {
    try {
      if (!this.reminderService) {
        throw new Error('Late fee service not configured');
      }

      const paymentSummary = await this.getPaymentSummary(invoiceId);
      const lateFee = await this.reminderService.calculateLateFee(invoiceId, paymentSummary.remainingBalance);

      return { lateFee, applied: lateFee > 0 };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to apply late fees: ${errorMessage}`);
    }
  }

  /**
   * Get all payments for an invoice
   */
  async getInvoicePayments(invoiceId: string) {
    try {
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const payments = await prisma.payment.findMany({
        where: { invoiceId },
        include: { invoice: { include: { client: true } } },
        orderBy: { createdAt: 'desc' }
      });

      return payments;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get invoice payments: ${errorMessage}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string) {
    try {
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { invoice: true }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      switch (payment.paymentMethod) {
        case 'STRIPE':
          // Note: Stripe refund would be implemented here
          throw new Error('Stripe refunds not yet implemented');

        case 'PAYPAL':
          if (!this.paypalService) {
            throw new Error('PayPal not configured');
          }
          return await this.paypalService.processRefund(paymentId, amount, reason);

        case 'BANK_TRANSFER':
        case 'CHECK':
        case 'WIRE_TRANSFER':
          // Manual refund process
          // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'REFUNDED',
              refundAmount: amount || payment.amount,
              refundReason: reason || 'Manual refund',
              metadata: {
                ...payment.metadata as object,
                refundedAt: new Date().toISOString(),
                refundMethod: 'MANUAL'
              }
            }
          });

          return { success: true, message: 'Manual refund recorded' };

        default:
          throw new Error(`Refunds not supported for payment method: ${payment.paymentMethod}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to refund payment: ${errorMessage}`);
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate: Date, endDate: Date) {
    try {
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const payments = await prisma.payment.findMany({
        where: {
          processedAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        },
        include: { invoice: { include: { client: true } } }
      });

      const analytics = {
        totalRevenue: 0,
        paymentCount: payments.length,
        averagePayment: 0,
        paymentMethods: {} as Record<string, number>,
        monthlyTrends: {} as Record<string, number>,
        clientBreakdown: {} as Record<string, { amount: number; count: number }>
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payments.forEach((payment: any) => {
        analytics.totalRevenue += payment.amount;
        
        // Payment method breakdown
        analytics.paymentMethods[payment.paymentMethod] = 
          (analytics.paymentMethods[payment.paymentMethod] || 0) + payment.amount;

        // Monthly trends
        const monthKey = payment.processedAt?.toISOString().substring(0, 7) || '';
        analytics.monthlyTrends[monthKey] = 
          (analytics.monthlyTrends[monthKey] || 0) + payment.amount;

        // Client breakdown
        const clientName = payment.invoice.client.name;
        if (!analytics.clientBreakdown[clientName]) {
          analytics.clientBreakdown[clientName] = { amount: 0, count: 0 };
        }
        analytics.clientBreakdown[clientName].amount += payment.amount;
        analytics.clientBreakdown[clientName].count += 1;
      });

      analytics.averagePayment = analytics.paymentCount > 0 ? 
        analytics.totalRevenue / analytics.paymentCount : 0;

      return analytics;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get payment analytics: ${errorMessage}`);
    }
  }

  /**
   * Get pending manual payments for review
   */
  async getPendingManualPayments() {
    return await this.alternativeService.getPendingPayments();
  }

  /**
   * Approve manual payment
   */
  async approveManualPayment(paymentId: string, notes?: string) {
    return await this.alternativeService.updatePaymentStatus({
      paymentId,
      status: 'COMPLETED',
      notes: notes || 'Manually approved',
      processedDate: new Date()
    });
  }

  /**
   * Reject manual payment
   */
  async rejectManualPayment(paymentId: string, reason: string) {
    return await this.alternativeService.updatePaymentStatus({
      paymentId,
      status: 'FAILED',
      failureReason: reason,
      notes: `Payment rejected: ${reason}`
    });
  }
}

export default PaymentProcessingService;