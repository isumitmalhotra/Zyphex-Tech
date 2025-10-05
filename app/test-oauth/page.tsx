'use client'

import { signIn } from 'next-auth/react'

export default function TestOAuthPage() {
  console.log('🧪 TestOAuth component loaded')

  const handleGoogleLogin = () => {
    console.log('🔴 Google login clicked!')
    alert('Google login clicked!')
    signIn('google', { callbackUrl: '/dashboard' })
  }

  const handleMicrosoftLogin = () => {
    console.log('🔵 Microsoft login clicked!')
    alert('Microsoft login clicked!')
    signIn('azure-ad', { callbackUrl: '/dashboard' })
  }

  const testFunction = () => {
    console.log('✅ Test function works!')
    alert('Test function works!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl text-white text-center mb-8">OAuth Test Page</h1>
        
        <button
          onClick={testFunction}
          className="w-full bg-green-500 text-white px-4 py-3 rounded-md text-lg font-semibold"
        >
          🧪 Test Button (Should Work)
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-blue-500 text-white px-4 py-3 rounded-md text-lg font-semibold"
        >
          🔴 Google OAuth Login
        </button>

        <button
          onClick={handleMicrosoftLogin}
          className="w-full bg-red-500 text-white px-4 py-3 rounded-md text-lg font-semibold"
        >
          🔵 Microsoft OAuth Login
        </button>

        <div className="text-center">
          <a href="/login" className="text-blue-400 hover:text-blue-300">
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}