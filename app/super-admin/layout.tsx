import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "Super Admin Dashboard - ZyphexTech",
  description: "Complete system administration and oversight",
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </SidebarProvider>
  )
}