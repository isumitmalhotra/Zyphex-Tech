"use client"

import { Suspense } from "react"
import { SimpleAuthForm } from "@/components/auth/simple-auth-form"

function LoginContent() {
  return <SimpleAuthForm mode="signin" />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
