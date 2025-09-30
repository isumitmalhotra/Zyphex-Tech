import type { Metadata } from "next"
import { TeamMemberSidebar } from "@/components/team-member-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

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
    <div className="min-h-screen flex">
      <SidebarProvider>
        <TeamMemberSidebar />
        <main className="flex-1 overflow-hidden min-h-screen">
          {children}
        </main>
      </SidebarProvider>
    </div>
  )
}