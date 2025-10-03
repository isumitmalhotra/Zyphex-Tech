import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AlternativePaymentService from '@/lib/payments/alternative-payment-service';

// Define interface for bank transaction data
interface BankTransaction {
  date: string;
  amount: number;
  description: string;
  reference: string;
}

const alternativePaymentService = new AlternativePaymentService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'record_bank_transfer':
        const bankTransfer = await alternativePaymentService.recordBankTransfer({
          invoiceId: data.invoiceId,
          amount: data.amount,
          currency: data.currency || 'USD',
          transferReference: data.transferReference,
          bankAccountLast4: data.bankAccountLast4,
          transferDate: data.transferDate ? new Date(data.transferDate) : new Date(),
          notes: data.notes
        });
        
        return NextResponse.json({ 
          success: true, 
          payment: bankTransfer,
          message: 'Bank transfer recorded successfully' 
        });

      case 'record_check_payment':
        const checkPayment = await alternativePaymentService.recordCheckPayment({
          invoiceId: data.invoiceId,
          amount: data.amount,
          currency: data.currency || 'USD',
          checkNumber: data.checkNumber,
          checkDate: new Date(data.checkDate),
          bankName: data.bankName,
          routingNumber: data.routingNumber,
          notes: data.notes
        });
        
        return NextResponse.json({ 
          success: true, 
          payment: checkPayment,
          message: 'Check payment recorded successfully' 
        });

      case 'update_payment_status':
        const updatedPayment = await alternativePaymentService.updatePaymentStatus({
          paymentId: data.paymentId,
          status: data.status,
          notes: data.notes,
          processedDate: data.processedDate ? new Date(data.processedDate) : undefined,
          failureReason: data.failureReason
        });
        
        return NextResponse.json({ 
          success: true, 
          payment: updatedPayment,
          message: 'Payment status updated successfully' 
        });

      case 'reconcile_bank_statement':
        if (!data.transactions || !Array.isArray(data.transactions)) {
          return NextResponse.json(
            { error: 'Bank transactions array required' },
            { status: 400 }
          );
        }

        const reconciliationResults = await alternativePaymentService.reconcileBankStatement(
          data.transactions.map((txn: BankTransaction) => ({
            date: new Date(txn.date),
            amount: txn.amount,
            description: txn.description,
            reference: txn.reference
          }))
        );
        
        return NextResponse.json({ 
          success: true, 
          results: reconciliationResults,
          message: `Reconciled ${reconciliationResults.length} transactions` 
        });

      case 'generate_payment_instructions':
        if (!data.invoiceId || !data.paymentMethods) {
          return NextResponse.json(
            { error: 'Invoice ID and payment methods required' },
            { status: 400 }
          );
        }

        const instructions = await alternativePaymentService.generatePaymentInstructions(
          data.invoiceId,
          data.paymentMethods
        );
        
        return NextResponse.json({ 
          success: true, 
          instructions,
          message: 'Payment instructions generated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    console.error('Alternative payment API error:', error);
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

    switch (action) {
      case 'pending_payments':
        const pendingPayments = await alternativePaymentService.getPendingPayments();
        return NextResponse.json({ success: true, payments: pendingPayments });

      case 'export_payments':
        const startDate = searchParams.get('startDate') 
          ? new Date(searchParams.get('startDate')!) 
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const endDate = searchParams.get('endDate') 
          ? new Date(searchParams.get('endDate')!) 
          : new Date();
        
        const format = searchParams.get('format') as 'csv' | 'json' || 'csv';
        
        const exportData = await alternativePaymentService.exportPaymentsForAccounting(
          startDate,
          endDate,
          format
        );

        if (format === 'csv') {
          return new NextResponse(exportData as string, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename=payments-export.csv'
            }
          });
        } else {
          return NextResponse.json({ success: true, data: exportData });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: unknown) {
    console.error('Alternative payment API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch payment data', message: errorMessage },
      { status: 500 }
    );
  }
}