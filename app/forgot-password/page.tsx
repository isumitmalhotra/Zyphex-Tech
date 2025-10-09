"use client"

import { Suspense } from "react"
import { SimpleAuthForm } from "@/components/auth/simple-auth-form"

function ForgotPasswordContent() {
  return <SimpleAuthForm mode="forgot-password" />
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
}