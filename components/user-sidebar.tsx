"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import Image from "next/image"
import { Icon3D } from "@/components/3d-icons"
import { useSession, signOut } from "next-auth/react"
import { useSidebarCounts } from "@/hooks/use-sidebar-counts"

const userNavigation = [
  {
    title: "Dashboard",
    items: [
      { title: "Dashboard", url: "/user", icon: "Home" },
      { title: "My Projects", url: "/user/projects", icon: "Briefcase" },
      { title: "Messages", url: "/user/messages", icon: "MessageSquare" },
      { title: "Appointments", url: "/user/appointments", icon: "Calendar" },
    ],
  },
  {
    title: "Account",
    items: [
      { title: "Profile", url: "/user/profile", icon: "User" },
      { title: "Settings", url: "/user/settings", icon: "Settings" },
      { title: "Documents", url: "/user/documents", icon: "FileText" },
      { title: "Billing", url: "/user/billing", icon: "CreditCard" },
    ],
  },
  {
    title: "Support",
    items: [
      { title: "Notifications", url: "/user/notifications", icon: "Bell" },
      { title: "Help Center", url: "/user/help", icon: "HelpCircle" },
      { title: "Downloads", url: "/user/downloads", icon: "Download" },
    ],
  },
]

export function UserSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Get dynamic counts - hooks must be called at top level
  const { counts } = useSidebarCounts()
  
  // Session data loaded
  React.useEffect(() => {
    if (session?.user) {
      // Session loaded successfully
    }
  }, [session])
  
  // Use fallback counts if loading or error
  const safeCounts = {
    notifications: counts?.notifications || 0,
    messages: counts?.messages || 0,
    projects: counts?.projects || 0,
    appointments: counts?.appointments || 0
  }

  return (
    <Sidebar collapsible="icon" className="zyphex-glass-effect border-r border-gray-800/50">
      <SidebarHeader className="border-b border-gray-800/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 animate-zyphex-glow">
            <Image src="/zyphex-logo.png" alt="Zyphex Tech" width={32} height={32} className="object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg zyphex-heading">User Portal</span>
            <span className="text-xs zyphex-subheading">Zyphex Tech</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        {userNavigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs font-semibold zyphex-subheading uppercase tracking-wider mb-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      className="w-full justify-start hover-zyphex-glow transition-all duration-300"
                    >
                      <Link href={item.url} className="flex items-center gap-3 p-3 rounded-lg">
                        <Icon3D icon={item.icon} size={20} />
                        <span className="font-medium">{item.title}</span>
                        {item.title === "Messages" && safeCounts.messages > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto bg-blue-500/20 text-blue-400 border-blue-500/30"
                          >
                            {safeCounts.messages}
                          </Badge>
                        )}
                        {item.title === "Notifications" && safeCounts.notifications > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-red-500/20 text-red-400 border-red-500/30">
                            {safeCounts.notifications}
                          </Badge>
                        )}
                        {item.title === "My Projects" && safeCounts.projects > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
                            {safeCounts.projects}
                          </Badge>
                        )}
                        {item.title === "Appointments" && safeCounts.appointments > 0 && (
                          <Badge variant="secondary" className="ml-auto bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {safeCounts.appointments}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800/50 p-4">
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg zyphex-card-bg">
          {session?.user?.image ? (
            <div className="relative">
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                unoptimized={true}
                onError={(e) => {
                  // Hide the image element if it fails to load and show fallback
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div 
                className="w-10 h-10 rounded-full zyphex-gradient-primary flex items-center justify-center" 
                style={{ display: 'none' }}
              >
                <Icon3D icon="User" size={20} color="white" />
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full zyphex-gradient-primary flex items-center justify-center">
              <Icon3D icon="User" size={20} color="white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium zyphex-heading truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs zyphex-subheading truncate">
              {session?.user?.email || 'No email'}
            </p>
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-green-400 truncate">
                Image: {session?.user?.image ? '✓' : '✗'} | Provider: {session?.user?.provider || 'unknown'}
              </p>
            )}
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full zyphex-button-secondary bg-transparent hover-zyphex-lift"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
