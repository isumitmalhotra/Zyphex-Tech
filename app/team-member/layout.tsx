import type { Metadata } from "next"
import { TeamMemberSidebar } from "@/components/team-member-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "Team Member Dashboard - ZyphexTech",
  description: "Track your tasks and productivity",
}

export default function TeamMemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <TeamMemberSidebar />
      <MobileNavWrapper 
        sidebarContent={<TeamMemberSidebar />}
        headerContent={<span className="text-lg font-semibold">Team Dashboard</span>}
      >
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </MobileNavWrapper>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}