"use client"

import type * as React from "react"
import {
  BarChart3,
  ChevronUp,
  Home,
  LogOut,
  Settings,
  Shield,
  Users,
  User2,
  Briefcase,
  FileText,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermission, useUser } from "@/hooks/use-permissions"
import { Permission } from "@/lib/auth/permissions"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Admin navigation data
const data = {
  user: {
    name: "Admin User",
    email: "admin@zyphextech.com",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
      isActive: true,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: BarChart3,
      items: [
        {
          title: "Overview",
          url: "/admin/analytics",
        },
        {
          title: "Traffic",
          url: "/admin/analytics/traffic",
        },
        {
          title: "Conversions",
          url: "/admin/analytics/conversions",
        },
        {
          title: "Performance",
          url: "/admin/analytics/performance",
        },
      ],
    },
    {
      title: "Projects",
      url: "/admin/projects",
      icon: Briefcase,
      items: [
        {
          title: "All Projects",
          url: "/admin/projects",
        },
        {
          title: "Active Projects",
          url: "/admin/projects/active",
        },
        {
          title: "Completed",
          url: "/admin/projects/completed",
        },
        {
          title: "Proposals",
          url: "/admin/projects/proposals",
        },
      ],
    },
    {
      title: "Clients",
      url: "/admin/clients",
      icon: Users,
      items: [
        {
          title: "All Clients",
          url: "/admin/clients",
        },
        {
          title: "Active Clients",
          url: "/admin/clients/active",
        },
        {
          title: "Leads",
          url: "/admin/clients/leads",
        },
        {
          title: "Client Portal",
          url: "/admin/clients/portal",
        },
      ],
    },
    {
      title: "Content Management",
      url: "/admin/content",
      icon: FileText,
      items: [
        {
          title: "Page Content",
          url: "/admin/content/manage",
        },
        {
          title: "Pages Management",
          url: "/admin/content/pages",
        },
        {
          title: "Content Types",
          url: "/admin/content/content-types",
        },
        {
          title: "Media Library",
          url: "/admin/content/media",
        },
        {
          title: "Dynamic Content",
          url: "/admin/content",
        },
      ],
    },
    {
      title: "Messages",
      url: "/admin/messages",
      icon: MessageSquare,
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const user = useUser()
  
  // Permission-based navigation filtering
  const hasViewDashboard = usePermission(Permission.VIEW_DASHBOARD)
  const hasViewAnalytics = usePermission(Permission.VIEW_ANALYTICS)
  const hasViewProjects = usePermission(Permission.VIEW_PROJECTS)
  const hasViewClients = usePermission(Permission.VIEW_CLIENTS)
  const hasManageSettings = usePermission(Permission.MANAGE_SETTINGS)
  
  // Filter navigation items based on permissions
  const filteredNavItems = data.navMain.filter(item => {
    switch (item.title) {
      case 'Dashboard':
        return hasViewDashboard
      case 'Analytics':
        return hasViewAnalytics
      case 'Projects':
        return hasViewProjects
      case 'Clients':
        return hasViewClients
      case 'Content Management':
        return hasManageSettings || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      default:
        return true
    }
  })

  return (
    <Sidebar collapsible="icon" {...props} className="zyphex-glass-effect border-gray-800/50">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg zyphex-gradient-primary animate-pulse-3d">
            <Image src="/zyphex-logo.png" alt="Zyphex Tech" width={24} height={24} className="object-contain" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold zyphex-heading">Zyphex Tech</span>
            <span className="truncate text-xs zyphex-subheading">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="zyphex-glass-effect">
        <SidebarGroup>
          <SidebarGroupLabel className="zyphex-heading">Main Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      asChild={!item.items}
                      tooltip={item.title}
                      isActive={pathname === item.url}
                      className="zyphex-button-secondary hover-zyphex-glow"
                    >
                      {item.items ? (
                        <>
                          {item.icon && <item.icon className="animate-pulse-3d" />}
                          <span className="zyphex-heading">{item.title}</span>
                          <ChevronUp className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      ) : (
                        <Link href={item.url}>
                          {item.icon && <item.icon className="animate-pulse-3d" />}
                          <span className="zyphex-heading">{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                              className="hover-zyphex-glow"
                            >
                              <Link href={subItem.url}>
                                <span className="zyphex-subheading hover:text-white transition-colors">
                                  {subItem.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Management section removed - can be added back when needed */}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="zyphex-heading">System</SidebarGroupLabel>
          <SidebarMenu>
            {hasManageSettings && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings" className="zyphex-button-secondary hover-zyphex-glow">
                  <Link href="/admin/settings">
                    <Settings className="animate-pulse-3d" />
                    <span className="zyphex-heading">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Security" className="zyphex-button-secondary hover-zyphex-glow">
                  <Link href="/admin/security">
                    <Shield className="animate-pulse-3d" />
                    <span className="zyphex-heading">Security</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground zyphex-card hover-zyphex-glow"
                >
                  <Avatar className="h-8 w-8 rounded-lg zyphex-blue-glow">
                    <AvatarImage src={data.user.avatar || "/placeholder.svg"} alt={data.user.name} />
                    <AvatarFallback className="rounded-lg zyphex-gradient-primary">
                      {data.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold zyphex-heading">{data.user.name}</span>
                    <span className="truncate text-xs zyphex-subheading">{data.user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg zyphex-glass-effect border-gray-800/50"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg zyphex-blue-glow">
                      <AvatarImage src={data.user.avatar || "/placeholder.svg"} alt={data.user.name} />
                      <AvatarFallback className="rounded-lg zyphex-gradient-primary">
                        {data.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold zyphex-heading">{data.user.name}</span>
                      <span className="truncate text-xs zyphex-subheading">{data.user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="hover-zyphex-glow">
                    <User2 />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover-zyphex-glow">
                    <Settings />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover-zyphex-glow">
                    <BarChart3 />
                    Activity
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover-zyphex-glow text-red-400">
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
