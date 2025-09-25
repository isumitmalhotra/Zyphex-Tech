"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Simulate authentication check
    // In a real app, you'd check if user is authenticated and has admin privileges
    const isAuthenticated = true // This would come from your auth system

    if (isAuthenticated) {
      router.push("/admin")
    } else {
      router.push("/login")
    }
  }, [router])

  return null
}
