'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setMessage('Password reset email sent! Check your inbox.')
        setIsSuccess(true)
      } else {
        setMessage('Error sending reset email. Please try again.')
        setIsSuccess(false)
      }
    } catch {
      setMessage('Error sending reset email. Please try again.')
      setIsSuccess(false)
    }

    setIsLoading(false)
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
              Forgot Password?
            </CardTitle>
            <CardDescription className="zyphex-subheading">
              No worries! Enter your email and we&apos;ll send you a reset link.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Message Alert */}
          {message && (
            <Alert variant={isSuccess ? "default" : "destructive"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Email'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-400">
            <Link
              href="/login"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
