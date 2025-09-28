"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { SubtleBackground } from "@/components/subtle-background"

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative">
      <SubtleBackground />
      
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        <AuthForm mode="signin" />
      </div>

      {/* Additional Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/5 via-transparent to-slate-900/5" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-600/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-slate-600/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>
    </div>
  )
}
