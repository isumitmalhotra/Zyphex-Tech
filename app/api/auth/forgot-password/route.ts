import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success for security (don't reveal if email exists)
    const responseMessage = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      return NextResponse.json({
        success: true,
        message: responseMessage
      });
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.password) {
      return NextResponse.json({
        success: true,
        message: responseMessage
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    try {
      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { email: email.toLowerCase() }
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          email: email.toLowerCase(),
          token: resetToken,
          expires: resetExpires
        }
      });
    } catch (dbError) {
      // For now, create the reset URL anyway and try to send the email
    }

    // Generate reset URL
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    // Send password reset email using the configured email service
    const emailSent = await sendPasswordResetEmail(
      email,
      resetUrl,
      user.name || undefined
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: responseMessage,
      emailSent: true
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred while processing your request. Please try again later.' },
      { status: 500 }
    );
  }
}