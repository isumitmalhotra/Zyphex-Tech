import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import ConditionalFooter from "@/components/conditional-footer"
import { ScrollProgressBar, ZyphexParticles } from "@/components/scroll-animations"
import AuthProvider from "@/providers/AuthProvider"
import { ReactQueryProvider } from "@/providers/ReactQueryProvider"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Zyphex Tech - Leading Remote IT Services Agency",
  description:
    "Transform your business with cutting-edge remote IT solutions. Custom software development, cloud migration, mobile apps, and more. Expert remote teams delivering exceptional results.",
  keywords:
    "remote IT services, software development, cloud solutions, mobile apps, web development, digital transformation, remote teams, Zyphex Tech",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} dark`}>
        <AuthProvider>
          <ReactQueryProvider>
            <Toaster position="top-right" theme="dark" />
            <ScrollProgressBar />
            <div className="min-h-screen relative flex flex-col">
              <ZyphexParticles />
              <div className="relative z-10 flex flex-col min-h-screen">
                <Header />
                <main className="relative flex-1">{children}</main>
                <ConditionalFooter />
              </div>
            </div>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
