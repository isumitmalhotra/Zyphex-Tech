'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight,
  Shield,
  Sparkles,
  AlertCircle,
  Github,
  Chrome,
  Loader2,
  CheckCircle,
  Code,
  Zap
} from 'lucide-react'
import { PasswordStrength } from '@/components/auth/password-strength'

interface EnhancedAuthFormProps {
  mode?: 'signin' | 'signup' | 'forgot-password' | 'reset-password'
}

export function EnhancedAuthForm({ mode = 'signin' }: EnhancedAuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const isSignUp = mode === 'signup'
  const isForgotPassword = mode === 'forgot-password'
  const isResetPassword = mode === 'reset-password'
  const errorParam = searchParams.get('error')
  const token = searchParams.get('token')

  // Handle OAuth errors
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'google': 'Google sign-in failed. Please check your account and try again.',
        'azure-ad': 'Microsoft sign-in failed. Please check your account and try again.',
        'OAuthSignin': 'OAuth provider error. Please try again.',
        'OAuthCallback': 'OAuth callback error. Please try again.',
        'CredentialsSignin': 'Invalid email or password. Please check your credentials.',
        'default': 'Sign-in failed. Please try again.'
      }
      setError(errorMessages[errorParam] || errorMessages.default)
    }
  }, [errorParam])

  // Redirect if already authenticated (except for reset password)
  useEffect(() => {
    if (status === 'authenticated' && session && !isResetPassword) {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      router.push(callbackUrl)
    }
  }, [session, status, router, searchParams, isResetPassword])

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center zyphex-gradient-bg">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (session && !isResetPassword) {
    return null // Will redirect above
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignUp) {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        // Handle registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setSuccess('Account created successfully! Signing you in...')
          // Auto sign-in after registration
          const signInResult = await signIn('credentials', {
            email,
            password,
            redirect: false
          })
          
          if (signInResult?.ok) {
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
            router.push(callbackUrl)
          } else {
            setError('Registration successful, but sign-in failed. Please try logging in manually.')
          }
        } else {
          setError(data.error || 'Registration failed')
        }
      } else if (isForgotPassword) {
        // Handle forgot password
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setSuccess('Password reset email sent! Check your inbox for further instructions.')
          setEmail('')
        } else {
          setError(data.error || 'Failed to send reset email')
        }
      } else if (isResetPassword) {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        // Handle password reset
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          setSuccess('Password reset successfully! Redirecting to login...')
          setTimeout(() => router.push('/login'), 2000)
        } else {
          setError(data.error || 'Password reset failed')
        }
      } else {
        // Handle sign-in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })
        
        if (result?.ok) {
          const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
          router.push(callbackUrl)
        } else {
          setError('Invalid email or password')
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setLoadingProvider(provider)
    setError('')
    
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error(`${provider} sign-in error:`, error)
      setError(`${provider} sign-in failed. Please try again.`)
      setLoadingProvider(null)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create Account'
      case 'forgot-password': return 'Forgot Password'
      case 'reset-password': return 'Reset Password'
      default: return 'Welcome Back'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Join the future of technology'
      case 'forgot-password': return 'Enter your email to reset your password'
      case 'reset-password': return 'Enter your new password'
      default: return 'Sign in to your account'
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden zyphex-gradient-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Floating Tech Icons */}
        <div className="absolute top-16 left-16 auth-icon-float">
          <div className="w-8 h-8 zyphex-gradient-primary rounded-lg flex items-center justify-center opacity-30 hover:opacity-50 transition-opacity">
            <Code className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="absolute top-32 right-32 auth-icon-float delay-1">
          <div className="w-6 h-6 zyphex-gradient-secondary rounded-full flex items-center justify-center opacity-30 hover:opacity-50 transition-opacity">
            <Zap className="w-3 h-3 text-slate-700" />
          </div>
        </div>
        <div className="absolute bottom-32 left-32 auth-icon-float delay-2">
          <div className="w-10 h-10 border-2 border-blue-400 rounded-lg opacity-20 hover:opacity-40 transition-opacity"></div>
        </div>
        <div className="absolute bottom-16 right-16 auth-icon-float">
          <div className="w-4 h-4 bg-blue-400 rounded opacity-20 hover:opacity-40 transition-opacity"></div>
        </div>
        <div className="absolute top-1/2 left-8 auth-icon-float delay-1">
          <div className="w-6 h-6 border border-purple-400 rounded-full opacity-20 hover:opacity-40 transition-opacity"></div>
        </div>
        <div className="absolute top-1/3 right-8 auth-icon-float delay-2">
          <div className="w-8 h-8 border-2 border-pink-400 rounded opacity-15 hover:opacity-30 transition-opacity"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="auth-glass-card border-0 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 zyphex-gradient-primary rounded-2xl flex items-center justify-center shadow-lg auth-icon-float">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-white">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {getSubtitle()}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="border-green-500/20 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* OAuth Buttons (not for forgot/reset password) */}
            {!isForgotPassword && !isResetPassword && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loadingProvider === 'google'}
                >
                  {loadingProvider === 'google' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Continue with Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                  onClick={() => handleOAuthSignIn('github')}
                  disabled={loadingProvider === 'github'}
                >
                  {loadingProvider === 'github' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Github className="mr-2 h-4 w-4" />
                  )}
                  Continue with GitHub
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field (signup only) */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 auth-input-glass text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="Enter your full name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 auth-input-glass text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password field (not for forgot password) */}
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    {isResetPassword ? 'New Password' : 'Password'}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 auth-input-glass text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                      placeholder={isResetPassword ? 'Enter new password' : 'Enter your password'}
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator for Signup and Reset */}
                  {(isSignUp || isResetPassword) && password && (
                    <PasswordStrength password={password} className="mt-2" />
                  )}
                </div>
              )}

              {/* Confirm Password field (signup and reset password) */}
              {(isSignUp || isResetPassword) && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 auth-input-glass text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400"
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full auth-button-glow hover:opacity-90 text-white font-semibold py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Please wait...' : getTitle()}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="text-center space-y-2">
              {mode === 'signin' && (
                <>
                  <div>
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Don't have an account? </span>
                    <Link 
                      href="/register" 
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                    >
                      Sign up
                    </Link>
                  </div>
                </>
              )}
              
              {mode === 'signup' && (
                <div>
                  <span className="text-sm text-slate-400">Already have an account? </span>
                  <Link 
                    href="/login" 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                  >
                    Sign in
                  </Link>
                </div>
              )}
              
              {(mode === 'forgot-password' || mode === 'reset-password') && (
                <div>
                  <Link 
                    href="/login" 
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Back to sign in
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}