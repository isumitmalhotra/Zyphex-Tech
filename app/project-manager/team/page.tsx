"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Search,
  MoreHorizontal,
  Mail,
  Calendar,
  Clock,
  Star,
  Loader2,
  UserPlus,
  Settings,
  BarChart3,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  image?: string
  department?: string
  skills: string[] | null
  hourlyRate: number | null
  availability: string | null
  projectsCount: number
  tasksCompleted: number
  rating?: number
  joinedAt: string | null
  lastActive: string | null
}

export default function TeamManagementPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("ALL")
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL")
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    busy: 0,
    onVacation: 0,
    teamMembers: 0,
    projectManagers: 0,
    totalProjects: 0,
    totalTasksCompleted: 0,
  })

  useEffect(() => {
    fetchTeam()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTeam = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/project-manager/team')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
        setStats(data.statistics || stats)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate avgRating from members
  const avgRating = members.length > 0 
    ? (members.reduce((sum, m) => sum + (m.rating || 0), 0) / members.length).toFixed(1) 
    : "0.0"

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.skills && member.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesDepartment = departmentFilter === "ALL" || member.department === departmentFilter
    const matchesAvailability = availabilityFilter === "ALL" || member.availability === availabilityFilter
    
    return matchesSearch && matchesDepartment && matchesAvailability
  })

  const availabilityColors = {
    AVAILABLE: "bg-green-100 text-green-800",
    BUSY: "bg-yellow-100 text-yellow-800",
    VACATION: "bg-blue-100 text-blue-800",
    SICK: "bg-red-100 text-red-800",
  }

  const departments = [...new Set(members.map(m => m.department).filter((d): d is string => !!d))]

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin zyphex-heading" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Team Management</h1>
            <p className="zyphex-subheading">Manage team members and their assignments</p>
          </div>
          <Button className="zyphex-button-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Members</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.total}</div>
              <p className="text-xs zyphex-subheading">Team members</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Available</CardTitle>
              <Clock className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.available}</div>
              <p className="text-xs zyphex-subheading">Ready to work</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Busy</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.busy}</div>
              <p className="text-xs zyphex-subheading">In active work</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.onVacation}</div>
              <p className="text-xs zyphex-subheading">Vacation/Sick</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{avgRating}</div>
              <p className="text-xs zyphex-subheading">Team performance</p>
            </CardContent>
          </Card>

          <Card className="zyphex-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Tasks</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{stats.totalTasksCompleted}</div>
              <p className="text-xs zyphex-subheading">Completed tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Management */}
        <Card className="zyphex-card">
          <CardHeader>
            <CardTitle className="zyphex-heading">Team Members</CardTitle>
            <CardDescription className="zyphex-subheading">
              Manage team members, their skills, and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members, skills, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="BUSY">Busy</SelectItem>
                  <SelectItem value="VACATION">Vacation</SelectItem>
                  <SelectItem value="SICK">Sick</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Members Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.image} alt={member.name} />
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.department || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {member.skills && member.skills.slice(0, 3).map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {member.skills && member.skills.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{member.skills.length - 3}
                            </Badge>
                          )}
                          {!member.skills && <span className="text-sm text-gray-500">No skills listed</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={availabilityColors[member.availability as keyof typeof availabilityColors] || availabilityColors.AVAILABLE}>
                          {member.availability || "AVAILABLE"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{member.projectsCount} projects</p>
                          <p className="text-gray-500">{member.tasksCompleted} tasks completed</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{member.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">${member.hourlyRate}/hr</p>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Performance
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium zyphex-heading mb-2">No team members found</h3>
                <p className="zyphex-subheading mb-4">
                  {searchTerm || departmentFilter !== "ALL" || availabilityFilter !== "ALL"
                    ? "Try adjusting your filters or search terms."
                    : "Start by adding team members to your organization."}
                </p>
                <Button className="zyphex-button-primary">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}