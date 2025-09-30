"use client"

import { usePathname } from "next/navigation"
import Footer from "@/components/footer"

export default function ConditionalFooter() {
  const pathname = usePathname()
  
  // Don't render footer on dashboard routes since they have their own layouts
  const dashboardRoutes = ['/admin', '/team-member', '/project-manager', '/client', '/super-admin', '/user']
  
  if (dashboardRoutes.some(route => pathname?.startsWith(route))) {
    return null
  }
  
  return <Footer />
}