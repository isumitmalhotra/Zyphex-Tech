"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, CheckCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden zyphex-gradient-bg">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md p-6">
        <Card className="auth-glass-card border-0 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            {/* Mail Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center shadow-lg auth-icon-float">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold text-white">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-slate-300">
              We've sent you a verification link
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Success Message */}
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                A sign-in link has been sent to your email address. Click the link to complete your sign-in.
              </AlertDescription>
            </Alert>

            {/* Instructions */}
            <div className="text-center space-y-4 text-slate-300">
              <p className="text-sm">
                Didn't receive the email? Check your spam folder or try signing in again.
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Email sent successfully</span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              asChild
              variant="outline"
              className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>

            {/* Help Text */}
            <div className="text-center text-sm text-slate-400">
              Having trouble?{" "}
              <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
                Contact support
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}