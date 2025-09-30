'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SubtleBackground } from '@/components/subtle-background'

export function ModernForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to send reset email. Please try again.')
      }
    } catch (_error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
        <SubtleBackground />
        
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <Card className="zyphex-card border-gray-700/30 shadow-2xl backdrop-blur-xl bg-gray-900/80">
            <CardHeader className="space-y-6 text-center pb-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-2xl">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Check Your Email
                  </h1>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span>Password reset instructions sent</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <CardDescription className="zyphex-subheading text-base">
                  We&apos;ve sent password reset instructions to <strong className="text-blue-400">{email}</strong>
                </CardDescription>
                <CardDescription className="zyphex-subheading text-sm">
                  Please check your email and follow the instructions to reset your password. The link will expire in 24 hours.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-200">Didn&apos;t receive the email?</p>
                    <p className="text-xs text-gray-400">
                      Check your spam folder or wait a few minutes and try again.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push('/login')}
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600",
                  "hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700",
                  "text-white font-semibold rounded-lg transition-all duration-300",
                  "shadow-lg hover:shadow-blue-500/25 hover-zyphex-glow hover-zyphex-lift"
                )}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Return to Login
              </Button>

              <div className="text-center text-sm text-gray-400">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 font-medium"
                >
                  Try a different email address
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <SubtleBackground />
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-full blur-3xl animate-spin-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <Card className="zyphex-card border-gray-700/30 shadow-2xl backdrop-blur-xl bg-gray-900/80">
          <CardHeader className="space-y-6 text-center pb-8">
            {/* Enhanced Logo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-2xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Reset Password
                </h1>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>Secure • Fast • Reliable</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <CardDescription className="zyphex-subheading text-base">
                Enter your email address and we&apos;ll send you instructions to reset your password
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Enhanced Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="h-12 bg-gray-800/50 border-gray-600/30 focus:border-purple-500/50 focus:ring-purple-500/20 hover:border-gray-500/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={cn(
                  "w-full h-12 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600",
                  "hover:from-purple-700 hover:via-blue-700 hover:to-cyan-700",
                  "text-white font-semibold rounded-lg transition-all duration-300",
                  "shadow-lg hover:shadow-purple-500/25 hover-zyphex-glow hover-zyphex-lift",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Reset Email...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>Send Reset Instructions</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Enhanced Footer */}
            <div className="space-y-4">
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Link>
              </div>
              
              <div className="text-center text-xs text-gray-500">
                <p>
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
                    Sign up here
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
export function ForgotPasswordForm() {
  return <ModernForgotPasswordForm />
}