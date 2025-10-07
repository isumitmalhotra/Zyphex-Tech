"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access was denied. You may not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'Default':
        return 'An error occurred during authentication.'
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.'
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account in the database.'
      case 'EmailCreateAccount':
        return 'Could not create email account in the database.'
      case 'Callback':
        return 'Error in the OAuth callback handler route.'
      case 'OAuthAccountNotLinked':
        return 'Email on the account is already linked, but not with this OAuth account.'
      case 'EmailSignin':
        return 'The email could not be sent.'
      case 'CredentialsSignin':
        return 'Invalid email or password.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden zyphex-gradient-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-red-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="auth-glass-card border-0 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-white">
              Authentication Error
            </CardTitle>
            <CardDescription className="text-slate-300">
              We encountered an issue while processing your request
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Message */}
            <Alert className="border-red-500/20 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {getErrorMessage(error || null)}
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                asChild
                className="w-full auth-button-glow hover:opacity-90 text-white font-semibold py-3 transition-all duration-300"
              >
                <Link href="/login">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
              >
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-slate-400">
              If the problem persists, please{" "}
              <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
                contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}