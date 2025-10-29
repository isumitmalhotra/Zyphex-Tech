import type { Metadata } from "next"
import { AdminSidebar } from "@/components/admin-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "sonner"
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper"

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
      <MobileNavWrapper 
        sidebarContent={<AdminSidebar />}
        headerContent={<span className="text-lg font-semibold">Super Admin</span>}
      >
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </MobileNavWrapper>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}