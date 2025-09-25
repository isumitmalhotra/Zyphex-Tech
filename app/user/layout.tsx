import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { UserSidebar } from "@/components/user-sidebar"
import Footer from "@/components/footer"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 container mx-auto p-6">{children}</div>
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
