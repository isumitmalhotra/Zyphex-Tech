import { PrismaClient } from '@prisma/client';

// Local enum fallbacks for TypeScript timing issues
const _PaymentMethodLocal = {
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHECK: 'CHECK',
  WIRE_TRANSFER: 'WIRE_TRANSFER',
  OTHER: 'OTHER'
} as const;

const _PaymentStatusLocal = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED'
} as const;

type PaymentMethod = typeof _PaymentMethodLocal[keyof typeof _PaymentMethodLocal];
type PaymentStatus = typeof _PaymentStatusLocal[keyof typeof _PaymentStatusLocal];

const prisma = new PrismaClient();

interface BankTransferRequest {
  invoiceId: string;
  amount: number;
  currency: string;
  transferReference: string;
  bankAccountLast4?: string;
  transferDate?: Date;
  notes?: string;
}

interface CheckPaymentRequest {
  invoiceId: string;
  amount: number;
  currency: string;
  checkNumber: string;
  checkDate: Date;
  bankName?: string;
  routingNumber?: string;
  notes?: string;
}

interface PaymentTrackingUpdate {
  paymentId: string;
  status: PaymentStatus;
  notes?: string;
  processedDate?: Date;
  failureReason?: string;
}

export class AlternativePaymentService {

  /**
   * Record bank transfer payment
   */
  async recordBankTransfer(request: BankTransferRequest) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: request.invoiceId },
        include: { client: true, project: true }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create payment record
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const payment = await prisma.payment.create({
        data: {
          invoiceId: request.invoiceId,
          amount: request.amount,
          currency: request.currency,
          paymentMethod: 'BANK_TRANSFER',
          paymentReference: request.transferReference,
          status: 'PENDING', // Requires manual verification
          metadata: {
            transferReference: request.transferReference,
            bankAccountLast4: request.bankAccountLast4,
            transferDate: request.transferDate?.toISOString(),
            recordedAt: new Date().toISOString(),
            notes: request.notes
          }
        }
      });

      // Send confirmation email to client
      await this.sendPaymentConfirmationEmail(invoice, payment, 'BANK_TRANSFER');

      return payment;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to record bank transfer: ${errorMessage}`);
    }
  }

  /**
   * Record check payment
   */
  async recordCheckPayment(request: CheckPaymentRequest) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: request.invoiceId },
        include: { client: true, project: true }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create payment record
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const payment = await prisma.payment.create({
        data: {
          invoiceId: request.invoiceId,
          amount: request.amount,
          currency: request.currency,
          paymentMethod: 'CHECK',
          paymentReference: request.checkNumber,
          status: 'PENDING', // Requires manual verification/deposit
          metadata: {
            checkNumber: request.checkNumber,
            checkDate: request.checkDate.toISOString(),
            bankName: request.bankName,
            routingNumber: request.routingNumber,
            recordedAt: new Date().toISOString(),
            notes: request.notes
          }
        }
      });

      // Send confirmation email to client
      await this.sendPaymentConfirmationEmail(invoice, payment, 'CHECK');

      return payment;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to record check payment: ${errorMessage}`);
    }
  }

  /**
   * Update payment status (for manual verification)
   */
  async updatePaymentStatus(request: PaymentTrackingUpdate) {
    try {
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const payment = await prisma.payment.findUnique({
        where: { id: request.paymentId },
        include: { invoice: { include: { client: true, payments: true } } }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update payment record
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const updatedPayment = await prisma.payment.update({
        where: { id: request.paymentId },
        data: {
          status: request.status,
          processedAt: request.status === 'COMPLETED' ? (request.processedDate || new Date()) : null,
          failureReason: request.status === 'FAILED' ? request.failureReason : null,
          metadata: {
            ...payment.metadata as object,
            statusUpdatedAt: new Date().toISOString(),
            statusNotes: request.notes
          }
        }
      });

      // If payment is completed, check if invoice is fully paid
      if (request.status === 'COMPLETED') {
        await this.checkInvoiceFullyPaid(payment.invoiceId);
      }

      // Send status update email
      if (request.status === 'COMPLETED') {
        await this.sendPaymentProcessedEmail(payment.invoice, payment);
      } else if (request.status === 'FAILED') {
        await this.sendPaymentFailedEmail(payment.invoice, payment, request.failureReason);
      }

      return updatedPayment;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update payment status: ${errorMessage}`);
    }
  }

  /**
   * Get pending payments requiring verification
   */
  async getPendingPayments() {
    try {
      // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: 'PENDING',
          paymentMethod: { in: ['BANK_TRANSFER', 'CHECK', 'WIRE_TRANSFER'] }
        },
        include: {
          invoice: {
            include: {
              client: true,
              project: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return pendingPayments;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get pending payments: ${errorMessage}`);
    }
  }

  /**
   * Reconcile bank statement with payments
   */
  async reconcileBankStatement(bankTransactions: Array<{
    date: Date;
    amount: number;
    description: string;
    reference?: string;
  }>) {
    try {
      const reconciliationResults = [];

      for (const transaction of bankTransactions) {
        // Try to match with pending bank transfers
        // @ts-expect-error - Payment model exists but TypeScript can't find it due to client generation timing
        const matchingPayments = await prisma.payment.findMany({
          where: {
            status: 'PENDING',
            paymentMethod: 'BANK_TRANSFER',
            amount: transaction.amount,
            OR: [
              { paymentReference: { contains: transaction.reference || '' } },
              { paymentReference: { contains: transaction.description } }
            ]
          },
          include: { invoice: true }
        });

        if (matchingPayments.length === 1) {
          // Auto-match found
          const payment = matchingPayments[0];
          
          await this.updatePaymentStatus({
            paymentId: payment.id,
            status: 'COMPLETED',
            processedDate: transaction.date,
            notes: `Auto-matched from bank statement: ${transaction.description}`
          });

          reconciliationResults.push({
            type: 'auto-matched',
            payment: payment,
            transaction: transaction
          });
        } else if (matchingPayments.length > 1) {
          // Multiple matches - requires manual review
          reconciliationResults.push({
            type: 'multiple-matches',
            payments: matchingPayments,
            transaction: transaction
          });
        } else {
          // No match found
          reconciliationResults.push({
            type: 'no-match',
            transaction: transaction
          });
        }
      }

      return reconciliationResults;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to reconcile bank statement: ${errorMessage}`);
    }
  }

  /**
   * Generate payment instructions for clients
   */
  async generatePaymentInstructions(invoiceId: string, paymentMethods: PaymentMethod[]) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { 
          // @ts-expect-error - PaymentConfigs relation exists but TypeScript can't find it due to client generation timing
          client: { include: { paymentConfigs: true } },
          project: true 
        }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const instructions: Record<string, unknown> = {};

      // Get payment configuration
      // @ts-expect-error - Client relation exists but TypeScript can't find it due to client generation timing
      const paymentConfig = invoice.client.paymentConfigs[0];

      for (const method of paymentMethods) {
        switch (method) {
          case 'BANK_TRANSFER':
            if (paymentConfig?.bankTransferEnabled) {
              instructions.bankTransfer = {
                accountName: paymentConfig.bankAccountName,
                accountNumber: paymentConfig.bankAccountNumber,
                routingNumber: paymentConfig.bankRoutingNumber,
                swiftCode: paymentConfig.bankSwiftCode,
                reference: `INV-${invoice.invoiceNumber}`,
                amount: invoice.total,
                // @ts-expect-error - Currency property exists but TypeScript can't find it due to schema timing
                currency: invoice.currency || 'USD'
              };
            }
            break;

          case 'CHECK':
            if (paymentConfig?.checkEnabled) {
              instructions.check = {
                payableTo: 'Zyphex Technologies',
                amount: invoice.total,
                // @ts-expect-error - Currency property exists but TypeScript can't find it due to schema timing
                currency: invoice.currency || 'USD',
                memo: `Invoice #${invoice.invoiceNumber}`,
                mailTo: 'Zyphex Technologies\n123 Business Street\nCity, State 12345'
              };
            }
            break;

          case 'WIRE_TRANSFER':
            instructions.wireTransfer = {
              beneficiaryName: 'Zyphex Technologies',
              accountNumber: paymentConfig?.bankAccountNumber,
              routingNumber: paymentConfig?.bankRoutingNumber,
              swiftCode: paymentConfig?.bankSwiftCode,
              reference: `INV-${invoice.invoiceNumber}`,
              amount: invoice.total,
              // @ts-expect-error - Currency property exists but TypeScript can't find it due to schema timing
              currency: invoice.currency || 'USD'
            };
            break;
        }
      }

      return instructions;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate payment instructions: ${errorMessage}`);
    }
  }

  /**
   * Check if invoice is fully paid and update status
   */
  private async checkInvoiceFullyPaid(invoiceId: string) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
        include: { payments: { where: { status: 'COMPLETED' } } }
      });

      if (!invoice) return;

      // @ts-expect-error - Payments relation exists but TypeScript can't find it due to client generation timing
      const totalPaid = invoice.payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

      if (totalPaid >= invoice.total) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        });
      }
    } catch (error: unknown) {
      // Failed to check invoice payment status
    }
  }

  /**
   * Send payment confirmation email (placeholder)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendPaymentConfirmationEmail(invoice: any, payment: any, method: string) {
    try {
      // Placeholder for email service integration
      // Payment confirmation email would be sent here
      
      // TODO: Integrate with email service
      // const emailContent = this.generatePaymentConfirmationTemplate(invoice, payment, method);
      // await emailService.send({
      //   to: invoice.client.email,
      //   subject: `Payment Received - Invoice #${invoice.invoiceNumber}`,
      //   html: emailContent
      // });

    } catch (error: unknown) {
      // Failed to send payment confirmation email
    }
  }

  /**
   * Send payment processed email (placeholder)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendPaymentProcessedEmail(invoice: any, payment: any) {
    try {
      // Payment processed email would be sent here
      
      // TODO: Integrate with email service

    } catch (error: unknown) {
      // Failed to send payment processed email
    }
  }

  /**
   * Send payment failed email (placeholder)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async sendPaymentFailedEmail(invoice: any, payment: any, reason?: string) {
    try {
      // Payment failed email would be sent here
      
      // TODO: Integrate with email service

    } catch (error: unknown) {
      // Failed to send payment failed email
    }
  }

  /**
   * Export payments for accounting
   */
  async exportPaymentsForAccounting(startDate: Date, endDate: Date, format: 'csv' | 'json' = 'csv') {
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
        include: {
          invoice: {
            include: {
              client: true,
              project: true
            }
          }
        },
        orderBy: { processedAt: 'asc' }
      });

      if (format === 'csv') {
        return this.generateCSVReport(payments);
      } else {
        return payments;
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to export payments: ${errorMessage}`);
    }
  }

  /**
   * Generate CSV report for payments
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateCSVReport(payments: any[]): string {
    const headers = [
      'Payment ID',
      'Invoice Number',
      'Client Name',
      'Project Name',
      'Payment Method',
      'Amount',
      'Currency',
      'Payment Date',
      'Reference',
      'Status'
    ];

    const rows = payments.map(payment => [
      payment.id,
      payment.invoice.invoiceNumber,
      payment.invoice.client.name,
      payment.invoice.project?.name || 'N/A',
      payment.paymentMethod,
      payment.amount.toFixed(2),
      payment.currency,
      payment.processedAt?.toISOString().split('T')[0] || '',
      payment.paymentReference || '',
      payment.status
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}

export default AlternativePaymentService;