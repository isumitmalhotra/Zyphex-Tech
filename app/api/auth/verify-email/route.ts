import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyEmailToken } from '@/lib/tokens';
import { sendWelcomeEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing-token', req.url)
      );
    }

    // Verify the token and get email
    const email = await verifyEmailToken(token);

    if (!email) {
      return NextResponse.redirect(
        new URL('/login?error=invalid-token', req.url)
      );
    }

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { email },
      data: { 
        emailVerified: new Date()
      }
    });

    // Send welcome email
    await sendWelcomeEmail(email, user.name || undefined);

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/login?verified=success', req.url)
    );

  } catch (error) {
    return NextResponse.redirect(
      new URL('/login?error=verification-failed', req.url)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the token and get email
    const email = await verifyEmailToken(token);

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { email },
      data: { 
        emailVerified: new Date()
      }
    });

    // Send welcome email
    await sendWelcomeEmail(email, user.name || undefined);

    return NextResponse.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}