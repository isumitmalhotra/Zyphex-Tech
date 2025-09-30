import type { Metadata } from "next"
import { ClientSidebar } from "@/components/client-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

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
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </SidebarProvider>
  )
}