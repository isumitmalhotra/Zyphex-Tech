"use client"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon3D } from "@/components/3d-icons"
import { useSession, signOut } from "next-auth/react"

const projectManagerNavigation = [
  {
    title: "Dashboard",
    items: [
      { title: "Dashboard", url: "/project-manager", icon: "Home" },
      { title: "Project Overview", url: "/project-manager/overview", icon: "BarChart3" },
      { title: "Team Performance", url: "/project-manager/performance", icon: "TrendingUp" },
    ],
  },
  {
    title: "Project Management",
    items: [
      { title: "All Projects", url: "/project-manager/projects", icon: "Briefcase" },
      { title: "Active Projects", url: "/project-manager/projects/active", icon: "Zap" },
      { title: "Project Planning", url: "/project-manager/planning", icon: "Calendar" },
      { title: "Milestones", url: "/project-manager/milestones", icon: "Flag" },
      { title: "Resource Allocation", url: "/project-manager/resources", icon: "Users" },
    ],
  },
  {
    title: "Team Management",
    items: [
      { title: "Team Members", url: "/project-manager/team", icon: "Users" },
      { title: "Task Assignment", url: "/project-manager/tasks", icon: "CheckCircle" },
      { title: "Workload Management", url: "/project-manager/workload", icon: "Clock" },
      { title: "Team Communication", url: "/project-manager/communication", icon: "MessageSquare" },
    ],
  },
  {
    title: "Client Relations",
    items: [
      { title: "Client Projects", url: "/project-manager/clients", icon: "Building" },
      { title: "Client Communications", url: "/project-manager/client-comms", icon: "Mail" },
      { title: "Status Reports", url: "/project-manager/reports", icon: "FileText" },
      { title: "Meetings & Reviews", url: "/project-manager/meetings", icon: "Video" },
    ],
  },
  {
    title: "Analytics & Reports",
    items: [
      { title: "Project Analytics", url: "/project-manager/analytics", icon: "BarChart3" },
      { title: "Time Tracking", url: "/project-manager/time-tracking", icon: "Timer" },
      { title: "Budget Tracking", url: "/project-manager/budget", icon: "DollarSign" },
      { title: "Performance Reports", url: "/project-manager/performance-reports", icon: "Target" },
    ],
  },
  {
    title: "Tools & Resources",
    items: [
      { title: "Document Management", url: "/project-manager/documents", icon: "FileText" },
      { title: "Templates", url: "/project-manager/templates", icon: "Copy" },
      { title: "Tools & Integrations", url: "/project-manager/tools", icon: "Wrench" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/project-manager/profile", icon: "User" },
      { title: "Settings", url: "/project-manager/settings", icon: "Settings" },
      { title: "Notifications", url: "/project-manager/notifications", icon: "Bell" },
    ],
  },
]

export function ProjectManagerSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <Icon3D icon="Target" className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">PM Portal</span>
            <span className="truncate text-xs text-muted-foreground">ZyphexTech</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {projectManagerNavigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-muted-foreground">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} className="flex items-center gap-3">
                          <Icon3D icon={item.icon} className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                <Icon3D icon="User" className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">
                  {session?.user?.name || 'Project Manager'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {session?.user?.email}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}