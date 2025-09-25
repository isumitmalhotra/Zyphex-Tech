"use client"

import { AuthForm } from "@/components/auth/auth-form"
import { SubtleBackground } from "@/components/subtle-background"

export default function RegisterPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center relative">
      <SubtleBackground />
      <div className="relative z-10">
        <AuthForm mode="signup" />
      </div>
    </div>
  )
}
