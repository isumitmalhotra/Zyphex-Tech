"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { EmailVerificationStatus } from "@/components/auth/email-verification-status"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session?.user) {
      // Automatically redirect to role-specific dashboard
      switch (session.user.role) {
        case "SUPER_ADMIN":
          router.push("/super-admin")
          break
        case "ADMIN":
          router.push("/admin")
          break
        case "PROJECT_MANAGER":
          router.push("/project-manager")
          break
        case "TEAM_MEMBER":
          router.push("/team-member")
          break
        case "CLIENT":
          router.push("/client")
          break
        case "USER":
        default:
          router.push("/user")
          break
      }
    }
  }, [status, router, session])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  const redirectToRole = () => {
    if (session.user.role === "ADMIN") {
      router.push("/admin")
    } else {
      router.push("/user")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <EmailVerificationStatus />
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Welcome to ZyphexTech</CardTitle>
          <CardDescription>
            You are successfully logged in as {session.user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Role: {session.user.role}</p>
          <div className="flex gap-2">
            <Button onClick={redirectToRole}>
              Go to {session.user.role === "ADMIN" ? "Admin" : "User"} Dashboard
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
