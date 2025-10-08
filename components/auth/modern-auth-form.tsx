'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
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
  Loader2
} from 'lucide-react'

interface AuthFormProps {
  mode?: 'signin' | 'signup'
}

export function ModernAuthForm({ mode = 'signin' }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  const isSignUp = mode === 'signup'
  const errorParam = searchParams.get('error')

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

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      router.push(callbackUrl)
    }
  }, [session, status, router, searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect above
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Handle registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        
        if (response.ok) {
          // Auto sign-in after registration
          const result = await signIn('credentials', { 
            email, 
            password, 
            redirect: false 
          })
          
          if (result?.ok) {
            router.push('/dashboard')
          } else {
            setError('Registration successful, but sign-in failed. Please try logging in.')
          }
        } else {
          const data = await response.json()
          setError(data.message || 'Registration failed. Please try again.')
        }
      } else {
        // Handle sign-in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })

        if (result?.error) {
          setError('Invalid email or password. Please check your credentials.')
        } else if (result?.ok) {
          const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
          router.push(callbackUrl)
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
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
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setLoadingProvider(null)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div className="w-2 h-2 bg-white/10 rounded-full"></div>
          </div>
        ))}
      </div>

      <Card className="relative z-10 w-full max-w-md mx-4 bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-white/70">
              {isSignUp 
                ? 'Join Zyphex Tech and start building amazing projects' 
                : 'Sign in to access your dashboard and continue your journey'
              }
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/30 text-red-300">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300"
              onClick={() => handleOAuthSignIn('google')}
              disabled={!!loadingProvider}
            >
              {loadingProvider === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Chrome className="w-5 h-5 mr-2" />
              )}
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-white/5 border-white/20 text-white hover:bg-white/10 transition-all duration-300"
              onClick={() => handleOAuthSignIn('azure-ad')}
              disabled={!!loadingProvider}
            >
              {loadingProvider === 'azure-ad' ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Github className="w-5 h-5 mr-2" />
              )}
              Continue with Microsoft
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-white/70">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/90">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:ring-purple-400/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-300 transform hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-5 h-5 mr-2" />
              )}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-white/70">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Link 
                href={isSignUp ? '/login' : '/register'} 
                className="text-purple-300 hover:text-purple-200 font-medium transition-colors"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}