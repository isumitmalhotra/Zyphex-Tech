import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate password reset token
    const token = await createPasswordResetToken(email);
    
    // Create reset URL
    const resetUrl = `${process.env.APP_URL || process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      email,
      resetUrl,
      user.name || undefined
    );

    if (!emailSent) {
      console.error('Failed to send password reset email to:', email);
    }

    // Always return success for security
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}