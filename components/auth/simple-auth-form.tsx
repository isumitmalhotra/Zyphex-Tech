'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome, Loader2 } from 'lucide-react'
import { MicrosoftIcon } from '@/components/icons/microsoft-icon'

interface SimpleAuthFormProps {
  mode?: 'signin' | 'signup' | 'forgot-password' | 'reset-password'
}

export function SimpleAuthForm({ mode = 'signin' }: SimpleAuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect') || searchParams.get('callbackUrl') || '/dashboard'

  const isSignUp = mode === 'signup'
  const isForgotPassword = mode === 'forgot-password'
  const isResetPassword = mode === 'reset-password'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignUp) {
        // Handle signup
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          return
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccess('Account created successfully! Please sign in.')
          setTimeout(() => router.push('/login' + (redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : '')), 2000)
        } else {
          setError(data.error || 'Failed to create account')
        }
      } else if (isForgotPassword) {
        // Handle forgot password
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (response.ok) {
          setSuccess('Password reset link sent to your email!')
        } else {
          setError(data.error || 'Failed to send reset email')
        }
      } else {
        // Handle signin
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid email or password')
        } else {
          router.push(redirectUrl)
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    try {
      setOauthLoading(provider)
      setError('')
      
      // For OAuth providers, we should let NextAuth handle the redirect
      const result = await signIn(provider, { 
        callbackUrl: redirectUrl,
        redirect: true // Let NextAuth handle the redirect
      })
      
      // SignIn will redirect, so this code may not execute
      if (result?.error) {
        setError(`Failed to sign in with ${provider}. Please try again or contact support.`)
        setOauthLoading(null)
      }
      
    } catch (error) {
      setError(`Failed to sign in with ${provider}. Please try again or contact support.`)
      setOauthLoading(null)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account'
      case 'forgot-password': return 'Reset Password'
      case 'reset-password': return 'Set New Password'
      default: return 'Sign In'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'signup': return 'Create a new account to get started'
      case 'forgot-password': return 'Enter your email to receive a reset link'
      case 'reset-password': return 'Enter your new password'
      default: return 'Sign in to your account'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 shadow-xl border border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Please wait...' : getTitle()}
              </Button>
            </form>

            {!isForgotPassword && !isResetPassword && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthSignIn('google')}
                    className="w-full"
                    disabled={isLoading || !!oauthLoading}
                  >
                    {oauthLoading === 'google' ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthSignIn('azure-ad')}
                    className="w-full"
                    disabled={isLoading || !!oauthLoading}
                  >
                    {oauthLoading === 'azure-ad' ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <MicrosoftIcon className="mr-2 h-4 w-4" />
                    )}
                    Microsoft
                  </Button>
                </div>
              </>
            )}

            <div className="text-center space-y-2">
              {mode === 'signin' && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{' '}
                    <Link 
                      href={`/register${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                      className="text-blue-600 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                  <p className="text-sm">
                    <Link href="/forgot-password" className="text-blue-600 hover:underline">
                      Forgot your password?
                    </Link>
                  </p>
                </>
              )}
              {mode === 'signup' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link 
                    href={`/login${redirectUrl !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                    className="text-blue-600 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              )}
              {mode === 'forgot-password' && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
