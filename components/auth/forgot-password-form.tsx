'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address'
      });
      return;
    }

    if (!validateEmail(email)) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid email address'
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        setEmailSent(true);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to send reset email'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email || isLoading) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Reset email sent again!'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to resend email'
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Forgot Password
        </CardTitle>
        <CardDescription>
          {emailSent 
            ? 'Check your email for reset instructions'
            : 'Enter your email to receive a password reset link'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
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

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="font-medium">{email}</p>
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Sending...' : 'Resend Email'}
              </Button>

              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}