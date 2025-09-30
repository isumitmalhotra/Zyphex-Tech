'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
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
  Chrome, 
  Linkedin,
  Building2,
  ArrowRight,
  Shield,
  Sparkles,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubtleBackground } from '@/components/subtle-background'

interface AuthFormProps {
  mode?: 'login' | 'register' | 'signin' | 'signup'
}

export function ModernAuthForm({ mode = 'login' }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const router = useRouter()

  const isSignUp = mode === 'register' || mode === 'signup'
  const isSignIn = mode === 'login' || mode === 'signin'

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
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (_error) {
      setError(`Failed to sign in with ${provider}. Please try again.`)
    } finally {
      setLoadingProvider(null)
    }
  }

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: Chrome,
      color: 'from-red-500 to-yellow-500',
      bgColor: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20'
    },
    {
      id: 'azure-ad',
      name: 'Microsoft',
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-600/20'
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
        <Card className="zyphex-card border-gray-700/30 shadow-2xl backdrop-blur-xl bg-gray-900/80">
          <CardHeader className="space-y-6 text-center pb-8">
            {/* Enhanced Logo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Zyphex Tech
                </h1>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Secure • Modern • Reliable</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <CardTitle className="text-2xl font-bold zyphex-heading flex items-center justify-center gap-2">
                {isSignIn ? (
                  <>
                    <ArrowRight className="w-5 h-5 text-blue-400" />
                    Welcome Back
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Join Zyphex Tech
                  </>
                )}
              </CardTitle>
              <CardDescription className="zyphex-subheading text-base">
                {isSignIn 
                  ? 'Sign in to access your personalized dashboard and continue your journey with us' 
                  : 'Create your account to unlock powerful tools and join our innovative community'
                }
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Enhanced Social Login */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-300 mb-4">
                  {isSignIn ? 'Continue with your preferred method' : 'Get started with'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {socialProviders.map((provider) => {
                  const Icon = provider.icon
                  const isProviderLoading = loadingProvider === provider.id
                  
                  return (
                    <Button
                      key={provider.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full h-12 transition-all duration-300 hover-zyphex-lift",
                        provider.bgColor,
                        "border-gray-600/30 hover:border-gray-500/50",
                        isProviderLoading && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleOAuthSignIn(provider.id)}
                      disabled={isLoading || isProviderLoading}
                    >
                      <div className="flex items-center justify-center space-x-3">
                        {isProviderLoading ? (
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        <span className="font-medium">
                          {isProviderLoading ? 'Connecting...' : `Continue with ${provider.name}`}
                        </span>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <Separator className="bg-gray-600/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-4 text-sm text-gray-400 bg-gray-900/80 backdrop-blur-sm rounded-full border border-gray-700/30">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Enhanced Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  <div className="relative group">
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 bg-gray-800/50 border-gray-600/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-gray-500/50 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <div className="relative group">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-gray-800/50 border-gray-600/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-gray-500/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-12 bg-gray-800/50 border-gray-600/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-gray-500/50 transition-all duration-300"
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
                        <span>Create My Account</span>
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

// Keep the original export for backward compatibility
export function AuthForm(props: AuthFormProps) {
  return <ModernAuthForm {...props} />
}