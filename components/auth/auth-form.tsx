"use client"

import * as React from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Icons } from "@/components/icons"
import { toast } from "sonner"
import { CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  mode?: "signin" | "signup"
}

export function AuthForm({ mode = "signin", ...props }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  // Check for verification status and reset success
  const verificationStatus = searchParams.get('verified')
  const errorStatus = searchParams.get('error')
  const resetStatus = searchParams.get('reset')

  // Show status messages
  const getStatusMessage = () => {
    if (verificationStatus === 'success') {
      return {
        type: 'success' as const,
        message: 'Email verified successfully! You can now sign in.'
      }
    }
    if (resetStatus === 'success') {
      return {
        type: 'success' as const,
        message: 'Password reset successfully! Please sign in with your new password.'
      }
    }
    if (errorStatus === 'invalid-token') {
      return {
        type: 'error' as const,
        message: 'Invalid or expired verification token.'
      }
    }
    if (errorStatus === 'verification-failed') {
      return {
        type: 'error' as const,
        message: 'Email verification failed. Please try again.'
      }
    }
    return null
  }

  const statusMessage = getStatusMessage()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      if (mode === "signup") {
        // Register new user
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          throw new Error(await res.text())
        }
      }

      // Sign in
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.error("Authentication failed. Please check your credentials.")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const socialSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch {
      toast.error("There was a problem signing in with " + provider)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[400px]" {...props}>
      <CardHeader>
        <CardTitle>{mode === "signin" ? "Sign In" : "Create Account"}</CardTitle>
        <CardDescription>
          {mode === "signin"
            ? "Enter your email below to sign in to your account"
            : "Enter your email below to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusMessage && (
          <Alert className={`mb-4 ${
            statusMessage.type === 'success' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={`${
              statusMessage.type === 'success' 
                ? 'text-green-800' 
                : 'text-red-800'
            }`}>
              {statusMessage.message}
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4">
          <form onSubmit={onSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <Link
                      href="/forgot-password"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid gap-3">
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => socialSignIn("google")}
              className="w-full"
            >
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => socialSignIn("azure-ad")}
              className="w-full"
            >
              <Icons.microsoft className="mr-2 h-4 w-4" />
              Microsoft
            </Button>
            <Button
              variant="outline"
              disabled={isLoading}
              onClick={() => socialSignIn("linkedin")}
              className="w-full"
            >
              <Icons.linkedin className="mr-2 h-4 w-4" />
              LinkedIn
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => router.push("/register")}>
                Create one
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button variant="link" className="p-0" onClick={() => router.push("/login")}>
                Sign in
              </Button>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  )
}
