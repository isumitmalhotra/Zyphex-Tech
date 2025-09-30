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

const clientNavigation = [
  {
    title: "Dashboard",
    items: [
      { title: "Dashboard", url: "/client", icon: "Home" },
      { title: "My Projects", url: "/client/projects", icon: "Briefcase" },
      { title: "Project Requests", url: "/client/requests", icon: "Plus" },
      { title: "Communication", url: "/client/messages", icon: "MessageSquare" },
    ],
  },
  {
    title: "Project Management",
    items: [
      { title: "Active Projects", url: "/client/active", icon: "Zap" },
      { title: "Timeline & Milestones", url: "/client/timeline", icon: "Calendar" },
      { title: "Progress Reports", url: "/client/reports", icon: "BarChart3" },
      { title: "Deliverables", url: "/client/deliverables", icon: "Package" },
    ],
  },
  {
    title: "Financial",
    items: [
      { title: "Invoices & Billing", url: "/client/billing", icon: "CreditCard" },
      { title: "Payments", url: "/client/payments", icon: "DollarSign" },
      { title: "Budget Tracking", url: "/client/budget", icon: "TrendingUp" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Documents", url: "/client/documents", icon: "FileText" },
      { title: "Downloads", url: "/client/downloads", icon: "Download" },
      { title: "Support Center", url: "/client/support", icon: "HelpCircle" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Company Profile", url: "/client/profile", icon: "Building" },
      { title: "Settings", url: "/client/settings", icon: "Settings" },
      { title: "Notifications", url: "/client/notifications", icon: "Bell" },
    ],
  },
]

export function ClientSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-blue-600 text-white">
            <Icon3D icon="Building" className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-white">Client Portal</span>
            <span className="truncate text-xs text-muted-foreground">ZyphexTech</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {clientNavigation.map((group) => (
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
                  {session?.user?.name || 'Client'}
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