import type { Metadata } from "next"
import { ProjectManagerSidebar } from "@/components/project-manager-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export const metadata: Metadata = {
  title: "Project Manager Dashboard - ZyphexTech",
  description: "Manage your projects and team performance",
}

export default function ProjectManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ProjectManagerSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </SidebarProvider>
  )
}