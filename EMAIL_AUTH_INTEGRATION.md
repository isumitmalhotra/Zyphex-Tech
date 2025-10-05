# Email Authentication Integration Examples

This guide shows how to integrate the enhanced email service with your authentication system, including user registration, email verification, password resets, and NextAuth callbacks.

## Table of Contents

1. [User Registration with Email Verification](#user-registration-with-email-verification)
2. [Email Verification Handler](#email-verification-handler)
3. [Password Reset Request](#password-reset-request)
4. [Password Reset Handler](#password-reset-handler)
5. [API Route Examples](#api-route-examples)
6. [NextAuth Integration](#nextauth-integration)

## User Registration with Email Verification

```typescript
import { sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function registerUserWithEmailVerification(
  email: string,
  password: string,
  name?: string
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        emailVerified: null, // Not verified yet
        role: 'USER',
      }
    });

    // Create verification token record
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationExpires
      }
    });

    // Send verification email
    const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
    
    const emailSent = await sendVerificationEmail(
      email,
      verificationUrl,
      name
    );

    if (!emailSent) {
      console.warn('Failed to send verification email, but user was created');
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      emailSent
    };

  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}
```

## Email Verification Handler

```typescript
import { sendWelcomeEmail } from '@/lib/email';

export async function verifyUserEmail(token: string) {
  try {
    // Find verification token
    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!verificationRecord) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user as verified
    const user = await prisma.user.update({
      where: { email: verificationRecord.identifier },
      data: { 
        emailVerified: new Date()
      }
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { 
        identifier_token: {
          identifier: verificationRecord.identifier,
          token: verificationRecord.token
        }
      }
    });

    // Send welcome email
    const welcomeEmailSent = await sendWelcomeEmail(
      user.email,
      user.name || undefined
    );

    if (!welcomeEmailSent) {
      console.warn('Failed to send welcome email');
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      }
    };

  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
}
```

## Password Reset Request

```typescript
import { sendPasswordResetEmail } from '@/lib/email';

export async function requestPasswordReset(email: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security, don't reveal if email exists
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (you may need to create this table)
    await prisma.passwordResetToken.create({
      data: {
        email: user.email,
        token: resetToken,
        expires: resetExpires
      }
    });

    // Send password reset email
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const emailSent = await sendPasswordResetEmail(
      email,
      resetUrl,
      user.name || undefined
    );

    return {
      success: true,
      emailSent,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };

  } catch (error) {
    console.error('Password reset request error:', error);
    throw error;
  }
}
```

## Password Reset Handler

```typescript
export async function resetPassword(token: string, newPassword: string) {
  try {
    // Find reset token
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { email: resetRecord.email },
      data: { 
        password: hashedPassword
      }
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { id: resetRecord.id }
    });

    return {
      success: true,
      message: 'Password has been reset successfully'
    };

  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}
```

## API Route Examples

### User Registration Route

Create `app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Register user
    const result = await registerUserWithEmailVerification(email, password, name);

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      emailSent: result.emailSent
    });

  } catch (error) {
    console.error('Registration API error:', error);
    
    if (error instanceof Error && error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

### Email Verification Route

Create `app/api/auth/verify-email/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyUserEmail(token);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: result.user
    });

  } catch (error) {
    console.error('Email verification API error:', error);
    
    return NextResponse.json(
      { error: 'Email verification failed' },
      { status: 400 }
    );
  }
}
```

### Password Reset Request Route

Create `app/api/auth/forgot-password/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);

    return NextResponse.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Password reset request API error:', error);
    
    return NextResponse.json(
      { error: 'Password reset request failed' },
      { status: 500 }
    );
  }
}
```

## NextAuth Integration

Add these callbacks to your NextAuth configuration in `lib/auth.ts`:

```typescript
import { sendVerificationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

const authConfig = {
  // ... other config
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'email') {
        // For email/password sign-ins, check if email is verified
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        });

        if (!dbUser?.emailVerified) {
          // Optionally resend verification email
          const verificationToken = randomBytes(32).toString('hex');
          await sendVerificationEmail(
            user.email!,
            `${process.env.APP_URL}/verify-email?token=${verificationToken}`,
            user.name || undefined
          );
          return false; // Prevent sign-in until verified
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as Date;
      }
      return session;
    }
  }
};

export default authConfig;
```

## Database Schema Requirements

Make sure your Prisma schema includes these models:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime
  createdAt DateTime @default(now())
}

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}
```

## Usage Examples

### Frontend Registration Form

```typescript
const handleRegistration = async (email: string, password: string, name?: string) => {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });

    const result = await response.json();

    if (result.success) {
      // Show success message and prompt to check email
      toast.success('Registration successful! Please check your email to verify your account.');
    } else {
      toast.error(result.error || 'Registration failed');
    }
  } catch (error) {
    toast.error('Registration failed');
  }
};
```

### Email Verification Page

```typescript
// app/verify-email/page.tsx
export default function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!searchParams.token) {
        setStatus('error');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: searchParams.token })
        });

        const result = await response.json();

        if (result.success) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (error) {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [searchParams.token]);

  if (status === 'loading') return <div>Verifying your email...</div>;
  if (status === 'success') return <div>Email verified successfully! You can now sign in.</div>;
  return <div>Email verification failed. Please try again or contact support.</div>;
}
```

This integration provides a complete email authentication workflow with verification, password resets, and seamless NextAuth integration.