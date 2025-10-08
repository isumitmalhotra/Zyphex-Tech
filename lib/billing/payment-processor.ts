import Stripe from 'stripe'
import { PaymentDetails, PaymentResult } from './engine'

// Extended payment method type for processor-specific methods
type ExtendedPaymentMethod = PaymentDetails['paymentMethod'] | 'WIRE_TRANSFER' | 'CASH';

// Extended payment details with additional methods
interface _ExtendedPaymentDetails extends Omit<PaymentDetails, 'paymentMethod'> {
  paymentMethod: ExtendedPaymentMethod;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-09-30.clover'
})

export interface ManualPaymentDetails {
  method: 'BANK_TRANSFER' | 'CHECK' | 'WIRE_TRANSFER' | 'CASH'
  reference: string
  notes?: string
  receivedDate: Date
}

export class PaymentProcessor {
  /**
   * Process payment through appropriate gateway
   */
  async processPayment(paymentDetails: PaymentDetails | _ExtendedPaymentDetails): Promise<PaymentResult> {
    try {
      // Type assertion for extended payment methods
      const method = paymentDetails.paymentMethod as ExtendedPaymentMethod;
      
      switch (method) {
        case 'STRIPE':
          return await this.processStripePayment(
            paymentDetails.amount,
            paymentDetails.currency,
            paymentDetails.metadata
          )
        
        case 'PAYPAL':
          return await this.processPayPalPayment(
            paymentDetails.amount,
            paymentDetails.currency
          )
        
        case 'BANK_TRANSFER':
        case 'CHECK':
        case 'WIRE_TRANSFER':
        case 'CASH':
          return this.processManualPayment(paymentDetails)
        
        default:
          throw new Error(`Unsupported payment method: ${paymentDetails.paymentMethod}`)
      }
    } catch (error) {
      return {
        success: false,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    try {
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(amount * 100)

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: metadata || {},
      })

      return {
        success: true,
        paymentId: paymentIntent.id,
        transactionId: paymentIntent.id,
        amount: amount,
        currency: currency
      }
    } catch (error) {
      return {
        success: false,
        amount: amount,
        currency: currency,
        error: error instanceof Error ? error.message : 'Stripe payment failed'
      }
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(
    _amount: number,
    _currency: string
  ): Promise<PaymentResult> {
    try {
      // PayPal integration would go here
      // For now, return a mock success response
      
      // In a real implementation, you would:
      // 1. Create PayPal order
      // 2. Handle payment confirmation
      // 3. Return actual transaction details
      
      return {
        success: true,
        paymentId: `paypal_${Date.now()}`,
        transactionId: `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: _amount,
        currency: _currency
      }
    } catch (error) {
      return {
        success: false,
        amount: _amount,
        currency: _currency,
        error: error instanceof Error ? error.message : 'PayPal payment failed'
      }
    }
  }

  /**
   * Process manual payment (bank transfer, check, etc.)
   */
  processManualPayment(paymentDetails: PaymentDetails | _ExtendedPaymentDetails): PaymentResult {
    // Manual payments are considered successful immediately
    // since they're recorded manually by admin
    return {
      success: true,
      paymentId: `manual_${Date.now()}`,
      transactionId: paymentDetails.paymentReference || `${paymentDetails.paymentMethod.toLowerCase()}_${Date.now()}`,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency
    }
  }

  /**
   * Record manual payment
   */
  async recordManualPayment(
    invoiceId: string,
    details: ManualPaymentDetails
  ): Promise<void> {
    // This would typically be handled by the BillingEngine
    // but can be used for direct manual payment recording
    // Recording manual payment for invoice: {invoiceId}, details: {details}
    
    // In a real implementation, you might:
    // 1. Validate the payment details
    // 2. Send notifications
    // 3. Update accounting systems
    // 4. Generate receipts
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      if (paymentId.startsWith('pi_')) {
        // Stripe payment intent
        const refund = await stripe.refunds.create({
          payment_intent: paymentId,
          amount: amount ? Math.round(amount * 100) : undefined,
          reason: (reason as 'duplicate' | 'fraudulent' | 'requested_by_customer') || 'requested_by_customer',
        })

        return {
          success: true,
          paymentId: refund.id,
          transactionId: refund.id,
          amount: amount || 0,
          currency: 'USD' // Default currency for refunds
        }
      } else {
        // Manual or other payment methods
        return {
          success: true,
          paymentId: `refund_${Date.now()}`,
          transactionId: `ref_${paymentId}`,
          amount: amount || 0,
          currency: 'USD' // Default currency for refunds
        }
      }
    } catch (error) {
      return {
        success: false,
        amount: amount || 0,
        currency: 'USD',
        error: error instanceof Error ? error.message : 'Refund failed'
      }
    }
  }

  /**
   * Get payment status from Stripe
   */
  async getStripePaymentStatus(paymentIntentId: string): Promise<string> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      return paymentIntent.status
    } catch (error) {
      return 'unknown'
    }
  }

  /**
   * Create payment link for invoice
   */
  async createPaymentLink(
    invoiceId: string,
    amount: number,
    currency: string,
    description: string
  ): Promise<string | null> {
    try {
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: description,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          invoiceId,
        },
        after_completion: {
          type: 'redirect',
          redirect: {
            url: `${process.env.NEXTAUTH_URL}/invoices/${invoiceId}/payment-success`,
          },
        },
      })

      return paymentLink.url
    } catch (error) {
      return null
    }
  }

  /**
   * Validate webhook signature (for Stripe)
   */
  validateStripeWebhook(
    body: string,
    signature: string,
    endpointSecret: string
  ): Stripe.Event | null {
    try {
      return stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (error) {
      return null
    }
  }
}