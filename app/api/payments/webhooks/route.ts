import { NextRequest, NextResponse } from 'next/server';
import PaymentProcessingService from '@/lib/payments/payment-processing-service';

// Initialize payment service
const paymentService = new PaymentProcessingService({
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    sandbox: process.env.NODE_ENV !== 'production'
  }
});

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider || !['stripe', 'paypal'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid or missing provider parameter' },
        { status: 400 }
      );
    }

    // Get request headers and body
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body: string | object;
    const contentType = headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      body = await request.text();
    }

    // Process webhook based on provider
    const result = await paymentService.processWebhook(
      provider as 'stripe' | 'paypal',
      body,
      headers
    );

    return NextResponse.json({ 
      success: true, 
      received: result.received,
      type: result.type 
    });

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // For webhooks, we should return 200 even on errors to avoid retries
    // unless it's a configuration issue
    if (errorMessage.includes('not configured') || errorMessage.includes('Invalid provider')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', message: errorMessage },
      { status: 200 } // Return 200 to avoid provider retries
    );
  }
}

// Handle GET requests for webhook verification (if needed by provider)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (provider === 'stripe') {
      // Stripe doesn't typically use GET for webhooks
      return NextResponse.json(
        { error: 'Stripe webhooks use POST method' },
        { status: 405 }
      );
    }

    if (provider === 'paypal') {
      // PayPal webhook verification if needed
      return NextResponse.json({ 
        status: 'PayPal webhook endpoint active' 
      });
    }

    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Webhook verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Webhook verification failed', message: errorMessage },
      { status: 500 }
    );
  }
}