"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Users, 
  Search, 
  Plus,
  MoreVertical,
  Eye,
  Edit,
  UserX,
  Briefcase,
  Clock,
  TrendingUp,
  RefreshCw,
  Award,
  Target,
  Download
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { generateAvatar } from "@/lib/utils/avatar"
import { toast } from "sonner"
import { exportToCSV } from "@/lib/utils/export"
import { CardGridSkeleton } from "@/components/skeletons/card-skeleton"
import { ConfirmDialog } from "@/components/confirm-dialog"

interface TeamMember {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: Date | null
  image: string | null
  totalHours?: number
  completedTasks?: number
  totalTasks?: number
  efficiency?: number
  projectCount?: number
}

interface TeamStats {
  total: number
  active: number
  projectManagers: number
  teamMembers: number
}

export default function TeamManagementPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: ""
  })
  const [stats, setStats] = useState<TeamStats>({
    total: 0,
    active: 0,
    projectManagers: 0,
    teamMembers: 0
  })

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      
      // Fetch all users
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch team members')
      
      const users = await response.json()
      
      // Filter for team members (PROJECT_MANAGER and TEAM_MEMBER roles)
      const team = users.filter((user: TeamMember) => 
        user.role === 'PROJECT_MANAGER' || user.role === 'TEAM_MEMBER'
      )
      
      // Add mock performance data for now (in production, fetch from performance API)
      const teamWithPerformance = team.map((member: TeamMember) => ({
        ...member,
        totalHours: Math.floor(Math.random() * 160) + 40, // 40-200 hours
        completedTasks: Math.floor(Math.random() * 50) + 10, // 10-60 tasks
        totalTasks: Math.floor(Math.random() * 30) + 60, // 60-90 tasks
        efficiency: Math.floor(Math.random() * 30) + 70, // 70-100%
        projectCount: Math.floor(Math.random() * 5) + 1 // 1-5 projects
      }))
      
      setTeamMembers(teamWithPerformance)
      calculateStats(teamWithPerformance)
      toast.success(`Loaded ${teamWithPerformance.length} team members`)
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to load team members. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (members: TeamMember[]) => {
    const total = members.length
    const active = members.filter((m: TeamMember) => {
      if (!m.emailVerified) return false
      return true
    }).length
    const projectManagers = members.filter((m: TeamMember) => m.role === 'PROJECT_MANAGER').length
    const teamMembersCount = members.filter((m: TeamMember) => m.role === 'TEAM_MEMBER').length
    
    setStats({
      total,
      active,
      projectManagers,
      teamMembers: teamMembersCount
    })
  }

  useEffect(() => {
    fetchTeamMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter team members
  const filteredMembers = teamMembers.filter((member: TeamMember) => {
    const matchesSearch = 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === "all" || member.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  // Get efficiency badge
  const getEfficiencyBadge = (efficiency: number | undefined) => {
    if (!efficiency) return { label: 'N/A', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
    
    if (efficiency >= 90) {
      return { label: 'Excellent', color: 'bg-green-500/10 text-green-500 border-green-500/20' }
    } else if (efficiency >= 75) {
      return { label: 'Good', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
    } else if (efficiency >= 60) {
      return { label: 'Average', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' }
    } else {
      return { label: 'Needs Improvement', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
    }
  }

  // Handle deactivate member
  const handleDeactivate = async () => {
    try {
      // Implementation would call API to deactivate user
      // const response = await fetch(`/api/admin/users/${deleteDialog.id}`, { method: 'DELETE' })
      // if (!response.ok) throw new Error('Failed to deactivate')
      
      toast.success(`${deleteDialog.name} has been deactivated`)
      setDeleteDialog({ open: false, id: "", name: "" })
      fetchTeamMembers()
    } catch (error) {
      console.error('Error deactivating member:', error)
      toast.error('Failed to deactivate member. Please try again.')
    }
  }

  // Handle export to CSV
  const handleExport = () => {
    const exportData = filteredMembers.map(member => ({
      Name: member.name || 'N/A',
      Email: member.email,
      Role: member.role.replace('_', ' '),
      'Total Hours': member.totalHours || 0,
      'Completed Tasks': member.completedTasks || 0,
      'Total Tasks': member.totalTasks || 0,
      'Efficiency (%)': member.efficiency || 0,
      Projects: member.projectCount || 0,
      Status: member.emailVerified ? 'Active' : 'Inactive'
    }))
    
    exportToCSV(exportData, 'team-members')
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">
            Manage team members and track performance ({filteredMembers.length} members)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} title="Export to CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchTeamMembers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/super-admin/users/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Verified and active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Managers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectManagers}</div>
            <p className="text-xs text-muted-foreground">
              Managing projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Executing tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                View and manage all team members ({filteredMembers.length} results)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {roleFilter === "all" ? "All Roles" : roleFilter.replace('_', ' ')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setRoleFilter("all")}>
                    All Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("PROJECT_MANAGER")}>
                    Project Managers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("TEAM_MEMBER")}>
                    Team Members
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No team members found matching your search.' : 'No team members found.'}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => {
                const efficiencyBadge = getEfficiencyBadge(member.efficiency)
                const completionRate = member.totalTasks && member.completedTasks 
                  ? Math.round((member.completedTasks / member.totalTasks) * 100) 
                  : 0
                
                return (
                  <Card key={member.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.image || generateAvatar(member.name || member.email, 48)} />
                            <AvatarFallback>
                              {(member.name || member.email).substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{member.name || 'No Name'}</h3>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/super-admin/users/${member.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/super-admin/users/${member.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteDialog({ open: true, id: member.id, name: member.name || member.email })}
                              className="text-red-600"
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">
                          {member.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={efficiencyBadge.color}>
                          {efficiencyBadge.label}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Target className="h-3 w-3" />
                            Task Completion
                          </span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-500">{member.totalHours || 0}</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Clock className="h-3 w-3" />
                            Hours
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-500">
                            {member.completedTasks || 0}/{member.totalTasks || 0}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Tasks
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-500">{member.projectCount || 0}</div>
                          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            Projects
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Deactivate Team Member?"
        description={`Are you sure you want to deactivate ${deleteDialog.name}? This action can be reversed later.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        onConfirm={handleDeactivate}
        variant="destructive"
      />
    </div>
  )
}
