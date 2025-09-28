"use client"

import { usePathname } from "next/navigation"
import Footer from "@/components/footer"

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't render footer on admin routes since admin layout handles its own footer
  if (pathname?.startsWith('/admin')) {
    return null
  }
  
  return <Footer />
}