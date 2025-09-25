'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Clock, RefreshCw } from 'lucide-react';

interface EmailVerificationStatusProps {
  showResendButton?: boolean;
  className?: string;
}

export function EmailVerificationStatus({ 
  showResendButton = true, 
  className = '' 
}: EmailVerificationStatusProps) {
  const { data: session, status } = useSession();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Don't show anything while loading
  if (status === 'loading') {
    return null;
  }

  // Don't show for unauthenticated users
  if (!session?.user) {
    return null;
  }

  const isVerified = session.user.emailVerified;
  const userEmail = session.user.email;

  const handleResendVerification = async () => {
    if (!userEmail || isResending) return;

    setIsResending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Verification email sent! Please check your inbox.'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send verification email'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      });
    } finally {
      setIsResending(false);
    }
  };

  // If email is verified, show success status
  if (isVerified) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Your email address has been verified.
        </AlertDescription>
      </Alert>
    );
  }

  // If email is not verified, show warning and resend option
  return (
    <div className={`space-y-3 ${className}`}>
      <Alert className="border-yellow-200 bg-yellow-50">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Your email address is not verified. Please check your inbox for a verification email.
        </AlertDescription>
      </Alert>

      {showResendButton && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Didn&apos;t receive the email?
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="flex items-center gap-2"
          >
            {isResending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {isResending ? 'Sending...' : 'Resend Email'}
          </Button>
        </div>
      )}

      {message && (
        <Alert className={`${
          message.type === 'success' 
            ? 'border-green-200 bg-green-50' 
            : message.type === 'error'
            ? 'border-red-200 bg-red-50'
            : 'border-blue-200 bg-blue-50'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : message.type === 'error' ? (
            <XCircle className="h-4 w-4 text-red-600" />
          ) : (
            <Mail className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription className={`${
            message.type === 'success' 
              ? 'text-green-800' 
              : message.type === 'error'
              ? 'text-red-800'
              : 'text-blue-800'
          }`}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}