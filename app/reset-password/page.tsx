"use client"

import { Suspense } from 'react';
import { SimpleAuthForm } from "@/components/auth/simple-auth-form"

function ResetPasswordContent() {
  return <SimpleAuthForm mode="reset-password" />
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center zyphex-gradient-bg">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}