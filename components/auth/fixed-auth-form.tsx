'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubtleBackground } from '@/components/subtle-background'
import { Icons } from '@/components/icons'

interface AuthFormProps {
  mode?: 'login' | 'register' | 'signin' | 'signup'
  oauthError?: string | null
}

export function FixedAuthForm({ mode = 'login', oauthError }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const router = useRouter()
  const { data: session } = useSession()

  const isSignUp = mode === 'register' || mode === 'signup'
  const isSignIn = mode === 'login' || mode === 'signin'

  // Set OAuth error if provided
  useEffect(() => {
    if (oauthError) {
      const errorMessages = {
        'google': 'Google sign-in failed. Please try again or check your credentials.',
        'azure-ad': 'Microsoft sign-in failed. Please try again or check your credentials.',
        'default': 'OAuth sign-in failed. Please try again.'
      }
      setError(errorMessages[oauthError as keyof typeof errorMessages] || errorMessages.default)
    }
  }, [oauthError])

  // Redirect if already authenticated
  if (session) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isSignIn) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })

        if (result?.error) {
          setError('Invalid credentials. Please try again.')
        } else if (result?.ok) {
          router.push('/dashboard')
        }
      } else {
        // Handle registration
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        })
        
        if (response.ok) {
          const result = await signIn('credentials', { 
            email, 
            password, 
            redirect: false 
          })
          
          if (result?.ok) {
            router.push('/dashboard')
          }
        } else {
          const data = await response.json()
          setError(data.message || 'Registration failed. Please try again.')
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
      // Use window.location.href for direct redirect to OAuth provider
      window.location.href = `/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent('/dashboard')}`
      
    } catch (error) {
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setLoadingProvider(null)
    }
  }

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: Icons.google,
      brandColors: 'hover:bg-white hover:text-gray-900 border-gray-300/30 hover:border-gray-300',
      textColor: 'text-gray-100 hover:text-gray-900',
      gradientBg: 'bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10'
    },
    {
      id: 'azure-ad',
      name: 'Microsoft',
      icon: Icons.microsoft,
      brandColors: 'hover:bg-blue-600 hover:text-white border-blue-500/30 hover:border-blue-500',
      textColor: 'text-gray-100 hover:text-white',
      gradientBg: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
    }
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <SubtleBackground />
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-full blur-3xl animate-spin-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <Card className="bg-gradient-to-br from-gray-800/90 via-gray-900/95 to-black/90 border border-gray-600/30 shadow-2xl backdrop-blur-xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 hover-zyphex-glow transition-all duration-300 hover:scale-110">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
            
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {isSignIn ? 'Welcome Back' : 'Create Account'}
              </CardTitle>
              <CardDescription className="text-gray-300 mt-2 text-lg">
                {isSignIn 
                  ? 'Sign in to access your dashboard' 
                  : 'Join our platform and start building'
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-400 font-medium">
                Continue with
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {socialProviders.map((provider) => {
                  const Icon = provider.icon
                  const isProviderLoading = loadingProvider === provider.id
                  
                  return (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-12 transition-all duration-300 group relative overflow-hidden",
                        "border-2 backdrop-blur-sm",
                        provider.gradientBg,
                        provider.brandColors,
                        provider.textColor,
                        "shadow-md hover:shadow-lg transform hover:scale-[1.02]",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100",
                        isProviderLoading && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleOAuthSignIn(provider.id)}
                      disabled={isLoading || isProviderLoading}
                    >
                      {/* Background gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative flex items-center justify-center space-x-2">
                        {isProviderLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                        )}
                        <span className="font-medium text-sm">
                          {isProviderLoading ? 'Connecting...' : provider.name}
                        </span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-600/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-4 py-1 text-gray-400 font-medium rounded-full border border-gray-600/30">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Full Name</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-gray-800/50 border-gray-600/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-gray-500/50 transition-all duration-300"
                    placeholder="Enter your full name"
                    required={isSignUp}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-gray-800/50 border-gray-600/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-gray-500/50 transition-all duration-300"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-200 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>Password</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12 bg-gray-800/50 border-gray-600/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-gray-500/50 transition-all duration-300"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isSignIn && (
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link
                      href="/forgot-password"
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 font-medium"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600",
                  "hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700",
                  "text-white font-semibold rounded-lg transition-all duration-300",
                  "shadow-lg hover:shadow-blue-500/25 hover-zyphex-glow hover-zyphex-lift",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                )}
                disabled={isLoading || loadingProvider !== null}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    {isSignIn ? (
                      <>
                        <ArrowRight className="w-5 h-5" />
                        <span>Sign In to Dashboard</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </div>
                )}
              </Button>
            </form>

            {/* Enhanced Footer */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-400">
                  {isSignIn ? (
                    <>
                      Don&apos;t have an account?{' '}
                      <Link
                        href="/register"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 font-medium"
                      >
                        Create one now
                      </Link>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <Link
                        href="/login"
                        className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 font-medium"
                      >
                        Sign in here
                      </Link>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-center text-xs text-gray-500">
                <p>
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}