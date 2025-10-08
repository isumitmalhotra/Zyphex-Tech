import { randomBytes, createHash } from 'crypto';
import { prisma } from './prisma';

// Token expiration times
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// Generate a secure random token
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Hash a token for secure storage
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Create email verification token
export async function createVerificationToken(email: string): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

  // Remove any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email }
  });

  // Create new verification token
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires
    }
  });

  return token;
}

// Create password reset token
export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generateToken();
  const hashedToken = hashToken(token);
  const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY);

  // Remove any existing reset tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email }
  });

  // Create new reset token
  await prisma.passwordResetToken.create({
    data: {
      email,
      token: hashedToken,
      expires
    }
  });

  return token;
}

// Verify email verification token
export async function verifyEmailToken(token: string): Promise<string | null> {
  try {
    const hashedToken = hashToken(token);
    
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() }
      }
    });

    if (!verificationToken) {
      return null;
    }

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: hashedToken
        }
      }
    });

    return verificationToken.identifier; // Returns email
  } catch (error) {
    return null;
  }
}

// Verify password reset token
export async function verifyResetToken(token: string): Promise<string | null> {
  try {
    const hashedToken = hashToken(token);
    
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() }
      }
    });

    if (!resetToken) {
      return null;
    }

    return resetToken.email;
  } catch (error) {
    return null;
  }
}

// Delete used password reset token
export async function deleteResetToken(token: string): Promise<void> {
  try {
    const hashedToken = hashToken(token);
    
    await prisma.passwordResetToken.deleteMany({
      where: { token: hashedToken }
    });
  } catch (error) {
    // Error deleting reset token
  }
}

// Clean up expired tokens (should be run periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const now = new Date();
    
    // Clean verification tokens
    await prisma.verificationToken.deleteMany({
      where: { expires: { lt: now } }
    });

    // Clean password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { expires: { lt: now } }
    });

    // Expired tokens cleaned up successfully
  } catch (error) {
    // Error cleaning up expired tokens
  }
}

// Check if user has pending verification
export async function hasPendingVerification(email: string): Promise<boolean> {
  try {
    const count = await prisma.verificationToken.count({
      where: {
        identifier: email,
        expires: { gt: new Date() }
      }
    });
    
    return count > 0;
  } catch (error) {
    return false;
  }
}

// Get verification token info (for debugging/admin)
export async function getVerificationTokenInfo(email: string) {
  try {
    return await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: { gt: new Date() }
      },
      select: {
        expires: true,
        identifier: true
      }
    });
  } catch (error) {
    return null;
  }
}