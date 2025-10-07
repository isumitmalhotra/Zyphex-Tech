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

const teamMemberNavigation = [
  {
    title: "Work",
    items: [
      { title: "Dashboard", url: "/team-member", icon: "Home" },
      { title: "My Tasks", url: "/team-member/tasks", icon: "CheckCircle" },
      { title: "Projects", url: "/team-member/projects", icon: "Briefcase" },
      { title: "Time Tracking", url: "/team-member/time", icon: "Clock" },
      { title: "Messages", url: "/team-member/messages", icon: "MessageSquare" },
    ],
  },
  {
    title: "Performance",
    items: [
      { title: "My Reports", url: "/team-member/reports", icon: "BarChart3" },
      { title: "Achievements", url: "/team-member/achievements", icon: "Award" },
      { title: "Skills & Goals", url: "/team-member/skills", icon: "Target" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Knowledge Base", url: "/team-member/kb", icon: "BookOpen" },
      { title: "Documents", url: "/team-member/documents", icon: "FileText" },
      { title: "Tools", url: "/team-member/tools", icon: "Wrench" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/team-member/profile", icon: "User" },
      { title: "Settings", url: "/team-member/settings", icon: "Settings" },
      { title: "Notifications", url: "/team-member/notifications", icon: "Bell" },
    ],
  },
]

export function TeamMemberSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Icon3D icon="Briefcase" className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">Team Portal</span>
            <span className="truncate text-xs text-muted-foreground">ZyphexTech</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {teamMemberNavigation.map((group) => (
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
                  {session?.user?.name || 'Team Member'}
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