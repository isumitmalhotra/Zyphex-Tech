"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Users,
  Mail,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  Search,
  UserPlus,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { SubtleBackground } from "@/components/subtle-background"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Project {
  id: string
  name: string
  description: string
  users: User[]
  manager: {
    id: string
    name: string
    email: string
  } | null
}

export default function ProjectTeamPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchProject()
    fetchAvailableUsers()
  }, [params.id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch project')
      const data = await response.json()
      setProject(data.project)
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const users = await response.json()
      setAvailableUsers(users.filter((user: User) => 
        user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN'
      ))
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddTeamMember = async () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a team member",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/project-manager/projects/${params.id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      })

      if (!response.ok) throw new Error('Failed to add team member')

      const data = await response.json()
      setProject(prev => prev ? { ...prev, users: data.project.users } : null)
      setIsAddMemberDialogOpen(false)
      setSelectedUserId("")
      
      toast({
        title: "Success",
        description: "Team member added successfully",
      })
    } catch (error) {
      console.error('Error adding team member:', error)
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveTeamMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member from the project?')) return

    try {
      const response = await fetch(`/api/project-manager/projects/${params.id}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error('Failed to remove team member')

      const data = await response.json()
      setProject(prev => prev ? { ...prev, users: data.project.users } : null)
      
      toast({
        title: "Success",
        description: "Team member removed successfully",
      })
    } catch (error) {
      console.error('Error removing team member:', error)
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-400 bg-red-400/10'
      case 'PROJECT_MANAGER': return 'text-blue-400 bg-blue-400/10'
      case 'TEAM_MEMBER': return 'text-green-400 bg-green-400/10'
      case 'MANAGER': return 'text-purple-400 bg-purple-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  // Filter users that are not already in the project
  const nonProjectUsers = availableUsers.filter(user => 
    !project?.users.some(projectUser => projectUser.id === user.id) &&
    user.id !== project?.manager?.id
  )

  // Filter project users based on search
  const filteredProjectUsers = project?.users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto zyphex-accent-text" />
              <p className="mt-2 zyphex-subheading">Loading team...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="relative z-10">
          <Alert className="border-red-800/50 bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Project not found"}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push(`/project-manager/projects/${params.id}`)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/project-manager/projects/${params.id}`)}
              className="zyphex-button"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-2xl font-bold zyphex-heading">Team Management</h1>
              <p className="zyphex-subheading">{project.name}</p>
            </div>
          </div>
          <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogTrigger asChild>
              <Button className="zyphex-button">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="zyphex-heading">Add Team Member</DialogTitle>
                <DialogDescription className="zyphex-subheading">
                  Select a user to add to the project team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Select User</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="zyphex-input">
                      <SelectValue placeholder="Choose a team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {nonProjectUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center space-x-2">
                            <span>{user.name}</span>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddMemberDialogOpen(false)
                    setSelectedUserId("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddTeamMember}
                  disabled={saving || !selectedUserId}
                  className="zyphex-button"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="zyphex-card">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 zyphex-subheading" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 zyphex-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 zyphex-accent-text" />
                <div>
                  <div className="text-2xl font-bold zyphex-text">{project.users.length}</div>
                  <p className="text-xs zyphex-subheading">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {project.users.filter(u => u.role === 'PROJECT_MANAGER').length}
                  </div>
                  <p className="text-xs zyphex-subheading">Project Managers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="zyphex-card">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {project.users.filter(u => u.role === 'TEAM_MEMBER').length}
                  </div>
                  <p className="text-xs zyphex-subheading">Team Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Manager Section */}
        {project.manager && (
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <UserCheck className="h-5 w-5" />
                Project Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {project.manager.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium zyphex-text">{project.manager.name}</h4>
                    <p className="text-sm zyphex-subheading">{project.manager.email}</p>
                    <Badge className="text-blue-400 bg-blue-400/10 mt-1">
                      Project Manager
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `mailto:${project.manager?.email}`}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 zyphex-heading">
              <Users className="h-5 w-5" />
              Team Members ({filteredProjectUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProjectUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto zyphex-subheading mb-4" />
                <p className="zyphex-subheading">No team members found</p>
                <p className="text-sm zyphex-subheading mt-2">
                  {project.users.length === 0 ? "Add team members to get started" : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjectUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium zyphex-text">{user.name}</h4>
                        <p className="text-sm zyphex-subheading">{user.email}</p>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `mailto:${user.email}`}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                          <DropdownMenuItem 
                            onClick={() => handleRemoveTeamMember(user.id)}
                            className="text-red-400 focus:text-red-400"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove from Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}