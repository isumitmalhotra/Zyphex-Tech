"use client"

import { Suspense } from "react"
import { SimpleAuthForm } from "@/components/auth/simple-auth-form"

function RegisterContent() {
  return <SimpleAuthForm mode="signup" />
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  )
}
