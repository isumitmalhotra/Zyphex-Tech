'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function EmailVerificationStatus() {
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')

  const handleResend = async () => {
    setIsResending(true)
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST'
      })

      if (response.ok) {
        setMessage('Verification email sent!')
      } else {
        setMessage('Error sending verification email')
      }
    } catch (error) {
      setMessage('Error sending verification email')
    }

    setIsResending(false)
  }

  return (
    <div className="text-center space-y-4">
      <p>Please check your email to verify your account.</p>
      <Button onClick={handleResend} disabled={isResending}>
        {isResending ? 'Sending...' : 'Resend Verification Email'}
      </Button>
      {message && <p className="text-sm">{message}</p>}
    </div>
  )
}
