import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PaymentProcessingService from '@/lib/payments/payment-processing-service';

// Initialize payment service with configuration
const paymentService = new PaymentProcessingService({
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    sandbox: process.env.NODE_ENV !== 'production'
  },
  email: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPassword: process.env.SMTP_PASSWORD || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@zyphex.com',
    fromName: process.env.FROM_NAME || 'Zyphex Technologies'
  }
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_payment':
        const payment = await paymentService.createPayment({
          invoiceId: data.invoiceId,
          paymentMethod: data.paymentMethod,
          amount: data.amount,
          metadata: data.metadata,
          returnUrl: data.returnUrl,
          cancelUrl: data.cancelUrl
        });
        
        return NextResponse.json({ 
          success: true, 
          payment,
          message: 'Payment created successfully' 
        });

      case 'send_reminder':
        const reminder = await paymentService.sendPaymentReminder(
          data.invoiceId,
          data.type || 'overdue'
        );
        
        return NextResponse.json({ 
          success: true, 
          reminder,
          message: 'Payment reminder sent successfully' 
        });

      case 'apply_late_fees':
        const lateFeeResult = await paymentService.applyLateFees(data.invoiceId);
        
        return NextResponse.json({ 
          success: true, 
          lateFee: lateFeeResult.lateFee,
          applied: lateFeeResult.applied,
          message: lateFeeResult.applied ? 'Late fee applied' : 'No late fee applied'
        });

      case 'refund_payment':
        const refund = await paymentService.refundPayment(
          data.paymentId,
          data.amount,
          data.reason
        );
        
        return NextResponse.json({ 
          success: true, 
          refund,
          message: 'Payment refunded successfully' 
        });

      case 'approve_manual_payment':
        const approvedPayment = await paymentService.approveManualPayment(
          data.paymentId,
          data.notes
        );
        
        return NextResponse.json({ 
          success: true, 
          payment: approvedPayment,
          message: 'Payment approved successfully' 
        });

      case 'reject_manual_payment':
        const rejectedPayment = await paymentService.rejectManualPayment(
          data.paymentId,
          data.reason
        );
        
        return NextResponse.json({ 
          success: true, 
          payment: rejectedPayment,
          message: 'Payment rejected' 
        });

      case 'process_automated_reminders':
        const reminderResults = await paymentService.processAutomatedReminders();
        
        return NextResponse.json({ 
          success: true, 
          results: reminderResults,
          message: `Processed ${reminderResults.length} reminders` 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    console.error('Payment processing API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Payment processing failed', message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const invoiceId = searchParams.get('invoiceId');

    switch (action) {
      case 'payment_summary':
        if (!invoiceId) {
          return NextResponse.json(
            { error: 'Invoice ID required' },
            { status: 400 }
          );
        }
        
        const summary = await paymentService.getPaymentSummary(invoiceId);
        return NextResponse.json({ success: true, summary });

      case 'invoice_payments':
        if (!invoiceId) {
          return NextResponse.json(
            { error: 'Invoice ID required' },
            { status: 400 }
          );
        }
        
        const payments = await paymentService.getInvoicePayments(invoiceId);
        return NextResponse.json({ success: true, payments });

      case 'pending_payments':
        const pendingPayments = await paymentService.getPendingManualPayments();
        return NextResponse.json({ success: true, payments: pendingPayments });

      case 'analytics':
        const startDate = searchParams.get('startDate') 
          ? new Date(searchParams.get('startDate')!) 
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        
        const endDate = searchParams.get('endDate') 
          ? new Date(searchParams.get('endDate')!) 
          : new Date(); // Today
        
        const analytics = await paymentService.getPaymentAnalytics(startDate, endDate);
        return NextResponse.json({ success: true, analytics });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    console.error('Payment processing API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch payment data', message: errorMessage },
      { status: 500 }
    );
  }
}