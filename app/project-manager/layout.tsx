import type { Metadata } from "next"
import { ProjectManagerSidebar } from "@/components/project-manager-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileNavWrapper } from "@/components/mobile-nav-wrapper"
import { Toaster } from "sonner"

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
      <MobileNavWrapper 
        sidebarContent={<ProjectManagerSidebar />}
        headerContent={<span className="text-lg font-semibold">Project Manager</span>}
      >
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </MobileNavWrapper>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  )
}