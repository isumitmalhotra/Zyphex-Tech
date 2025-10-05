import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

// Send verification email
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

    console.log(`📧 Email verification requested for: ${email}`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that email address' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true
      });
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    try {
      // Delete any existing verification tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { identifier: email.toLowerCase() }
      });

      // Create new verification token
      await prisma.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token: verificationToken,
          expires: verificationExpires
        }
      });
    } catch (dbError) {
      console.error('Database error creating verification token:', dbError);
      return NextResponse.json(
        { error: 'Failed to generate verification token. Please try again later.' },
        { status: 500 }
      );
    }

    // Create verification URL
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

    console.log(`📧 Sending email verification to: ${email} from: ${process.env.EMAIL_FROM}`);

    // Send verification email using the configured email service
    const emailSent = await sendVerificationEmail(
      email,
      verificationUrl,
      user.name || undefined
    );

    if (!emailSent) {
      console.error(`❌ Failed to send verification email to: ${email}`);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log(`✅ Verification email sent successfully to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox and spam folder.',
      emailSent: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while sending verification email. Please try again later.' },
      { status: 500 }
    );
  }
}

// Resend verification email
export async function PUT(req: NextRequest) {
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

    console.log(`🔄 Email verification resend requested for: ${email}`);

    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with that email address' },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        alreadyVerified: true
      });
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    try {
      // Delete any existing verification tokens for this user
      await prisma.verificationToken.deleteMany({
        where: { identifier: email.toLowerCase() }
      });

      // Create new verification token
      await prisma.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token: verificationToken,
          expires: verificationExpires
        }
      });
    } catch (dbError) {
      console.error('Database error creating verification token:', dbError);
      return NextResponse.json(
        { error: 'Failed to generate verification token. Please try again later.' },
        { status: 500 }
      );
    }

    // Create verification URL
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;

    console.log(`📧 Resending email verification to: ${email} from: ${process.env.EMAIL_FROM}`);

    // Send verification email using the configured email service
    const emailSent = await sendVerificationEmail(
      email,
      verificationUrl,
      user.name || undefined
    );

    if (!emailSent) {
      console.error(`❌ Failed to resend verification email to: ${email}`);
      return NextResponse.json(
        { error: 'Failed to resend verification email. Please try again later.' },
        { status: 500 }
      );
    }

    console.log(`✅ Verification email resent successfully to: ${email}`);

    return NextResponse.json({
      success: true,
      message: 'Verification email resent successfully. Please check your inbox and spam folder.',
      emailSent: true
    });

  } catch (error) {
    console.error('Email verification resend error:', error);
    
    return NextResponse.json(
      { error: 'An error occurred while resending verification email. Please try again later.' },
      { status: 500 }
    );
  }
}