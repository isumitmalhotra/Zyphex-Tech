import type { Metadata } from "next"
import { ClientSidebar } from "@/components/client-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Client Portal - ZyphexTech",
  description: "View your projects and communicate with our team",
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ClientSidebar />
      <MobileNavWrapper 
        sidebarContent={<ClientSidebar />}
        headerContent={<span className="text-lg font-semibold">Client Portal</span>}
      >
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </MobileNavWrapper>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}