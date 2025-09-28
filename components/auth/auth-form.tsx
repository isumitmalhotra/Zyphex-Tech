'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthFormProps {
  mode?: 'login' | 'register' | 'signin' | 'signup'
}

export function AuthForm({ mode = 'login' }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
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

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleGithubSignIn = () => {
    signIn('github', { callbackUrl: '/dashboard' })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="zyphex-card-bg border-gray-800/50 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="relative w-10 h-10 animate-zyphex-glow">
              <Image 
                src="/zyphex-logo.png" 
                alt="Zyphex Tech" 
                width={40} 
                height={40} 
                className="object-contain" 
              />
            </div>
            <span className="font-bold text-2xl zyphex-heading">Zyphex Tech</span>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold zyphex-heading">
              {isSignIn ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="zyphex-subheading">
              {isSignIn 
                ? 'Sign in to access your dashboard' 
                : 'Join us to get started with your projects'
              }
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Social Login */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white/5 border-gray-700/50 hover:bg-white/10 hover-zyphex-glow"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white/5 border-gray-700/50 hover:bg-white/10 hover-zyphex-glow"
              onClick={handleGithubSignIn}
              disabled={isLoading}
            >
              <Github className="w-4 h-4 mr-2" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <Separator className="bg-gray-700/50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 text-sm text-gray-400 bg-gray-900">
                or continue with email
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-200">
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
                    className="pl-10 bg-white/5 border-gray-700/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white/5 border-gray-700/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-200">
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
                  className="pl-10 pr-10 bg-white/5 border-gray-700/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignIn && (
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className={cn(
                "w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
                "text-white font-semibold py-3 rounded-lg transition-all duration-300",
                "shadow-lg hover:shadow-blue-500/25 hover-zyphex-glow",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                isSignIn ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400">
            {isSignIn ? (
              <>
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
