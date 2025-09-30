"use client"

import type React from "react"
import Footer from "@/components/footer"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="overflow-hidden">
        <div className="flex flex-col min-h-screen overflow-hidden">
          <div className="flex-1 overflow-hidden">{children}</div>
          {/* Footer positioned within the admin content area, to the right of sidebar */}
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
