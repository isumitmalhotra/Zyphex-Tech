'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'

interface LoginFormProps {
  callbackUrl?: string
}

export default function LoginForm({ callbackUrl = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 6
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    const errors: string[] = []
    
    if (!email) {
      errors.push('Email is required')
    }
    
    if (!password) {
      errors.push('Password is required')
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '))
      return
    }

    if (!validateEmail(email)) {
      setError('Invalid email address')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (err) {
      setError('An error occurred during login')
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'azure-ad') => {
    try {
      await signIn(provider, { callbackUrl })
    } catch (err) {
      setError(`Failed to login with ${provider}`)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              if (email && !validateEmail(email)) {
                setError('Invalid email address')
              }
            }}
            disabled={isLoading}
            required
            data-testid="email-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => {
                if (password && !validatePassword(password)) {
                  setError('Password must be at least 6 characters')
                }
              }}
              disabled={isLoading}
              required
              data-testid="password-input"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              data-testid="toggle-password"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/auth/forgot-password')}
            className="text-sm text-blue-600 hover:text-blue-700"
            data-testid="forgot-password-link"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          data-testid="submit-button"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            disabled={isLoading}
            data-testid="google-login-button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthLogin('azure-ad')}
            disabled={isLoading}
            data-testid="microsoft-login-button"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#f25022" d="M0 0h11.377v11.377H0z" />
              <path fill="#00a4ef" d="M12.623 0H24v11.377H12.623z" />
              <path fill="#7fba00" d="M0 12.623h11.377V24H0z" />
              <path fill="#ffb900" d="M12.623 12.623H24V24H12.623z" />
            </svg>
            Sign in with Microsoft
          </Button>
        </div>

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <button
            type="button"
            onClick={() => router.push('/auth/register')}
            className="text-blue-600 hover:text-blue-700"
            data-testid="register-link"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  )
}
