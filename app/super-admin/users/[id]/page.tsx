'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Briefcase,
  Clock,
  Activity,
  Settings,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  image: string | null
  skills: string[] | null
  hourlyRate: number | null
  timezone: string | null
  createdAt: string
  updatedAt: string
  emailVerified: Date | null
  deletedAt: Date | null
  _count?: {
    projects: number
    assignedTasks: number
    timeEntries: number
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/users/${params.id}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`)
        }

        const data = await response.json()
        setUser(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete user "${user?.name || user?.email}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      alert('User deleted successfully')
      router.push('/super-admin/users')
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user')
    }
  }

  const handleToggleStatus = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !!user?.deletedAt })
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      alert(`User ${user?.deletedAt ? 'activated' : 'deactivated'} successfully`)
      // Refresh user data
      window.location.reload()
    } catch (err) {
      console.error('Error updating user status:', err)
      alert('Failed to update user status')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Super Admin</Badge>
      case 'ADMIN':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Admin</Badge>
      case 'PROJECT_MANAGER':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Project Manager</Badge>
      case 'TEAM_MEMBER':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Team Member</Badge>
      case 'CLIENT':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Client</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{role}</Badge>
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-64"></div>
            <div className="h-96 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="container mx-auto max-w-6xl">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">User Not Found</h2>
              <p className="text-slate-400 mb-6">{error || 'The user you are looking for does not exist.'}</p>
              <Button asChild>
                <Link href="/super-admin/users">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="border-slate-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">User Profile</h1>
              <p className="text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              className="border-slate-600"
            >
              {user.deletedAt ? <UserCheck className="w-4 h-4 mr-2" /> : <UserX className="w-4 h-4 mr-2" />}
              {user.deletedAt ? 'Activate' : 'Deactivate'}
            </Button>
            <Button variant="outline" className="border-slate-600" asChild>
              <Link href={`/super-admin/users/${user.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteUser}
              className="border-red-600 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* User Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
                {user.image ? (
                  <Image src={user.image} alt={user.name || ''} width={96} height={96} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {user.name || 'Unnamed User'}
                  </h2>
                  {getRoleBadge(user.role)}
                  {user.deletedAt && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      Deactivated
                    </Badge>
                  )}
                  {user.emailVerified && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Email Verified
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                  {user.timezone && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{user.timezone}</span>
                    </div>
                  )}
                  {user.hourlyRate && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <span>${user.hourlyRate}/hour</span>
                    </div>
                  )}
                </div>

                {user.skills && user.skills.length > 0 && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-sm mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Projects</p>
                  <p className="text-2xl font-bold text-white">
                    {user._count?.projects || 0}
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Tasks Assigned</p>
                  <p className="text-2xl font-bold text-white">
                    {user._count?.assignedTasks || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Time Entries</p>
                  <p className="text-2xl font-bold text-white">
                    {user._count?.timeEntries || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Additional Info */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="bg-slate-900/50">
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="mt-6">
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No recent activity</p>
                  <p className="text-slate-500 text-sm mt-2">Activity tracking will be implemented in the next phase</p>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="mt-6">
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Projects list will appear here</p>
                  <p className="text-slate-500 text-sm mt-2">This feature is under development</p>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="mt-6">
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Permissions management will appear here</p>
                  <p className="text-slate-500 text-sm mt-2">This feature is under development</p>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">User settings will appear here</p>
                  <p className="text-slate-500 text-sm mt-2">This feature is under development</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
