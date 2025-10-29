'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/utils/export'
import { StatsGridSkeleton } from '@/components/skeletons/stats-skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  emailVerified: Date | null
  deletedAt: Date | null
}

interface UsersData {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function SuperAdminUsersPage() {
  const router = useRouter()
  const [usersData, setUsersData] = useState<UsersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [refreshing, setRefreshing] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: '', name: '' })
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean
    id: string
    name: string
    currentStatus: boolean
  }>({ open: false, id: '', name: '', currentStatus: false })

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('📊 Loading users...', { role: roleFilter, search: searchTerm })
      
      const params = new URLSearchParams({
        limit: '100',
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Users loaded:', result)

      setUsersData(result)
      setError(null)
      toast.success('Users loaded successfully')
    } catch (err) {
      console.error('❌ Error loading users:', err)
      setError('Failed to load users. Please try again.')
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUsers()
    setRefreshing(false)
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/users/${deleteDialog.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete user')

      toast.success(`User "${deleteDialog.name}" deleted successfully`)
      await loadUsers()
      setDeleteDialog({ open: false, id: '', name: '' })
    } catch (_error) {
      toast.error('Failed to delete user')
    }
  }

  const handleStatusToggle = async () => {
    try {
      const response = await fetch(`/api/admin/users/${statusDialog.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !statusDialog.currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update user status')

      toast.success(`User status updated successfully`)
      await loadUsers()
      setStatusDialog({ open: false, id: '', name: '', currentStatus: false })
    } catch (_error) {
      toast.error('Failed to update user status')
    }
  }

  const handleExport = () => {
    if (!usersData) return
    exportToCSV(
      usersData.users.map(u => ({
        ID: u.id,
        Name: u.name || 'N/A',
        Email: u.email,
        Role: u.role,
        Status: u.deletedAt ? 'Deactivated' : 'Active',
        'Email Verified': u.emailVerified ? 'Yes' : 'No',
        'Created At': new Date(u.createdAt).toLocaleDateString()
      })),
      'users-export'
    )
    toast.success('Users exported to CSV')
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter])

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      SUPER_ADMIN: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      ADMIN: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      PROJECT_MANAGER: 'bg-green-500/10 text-green-500 border-green-500/20',
      TEAM_MEMBER: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      CLIENT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    }
    
    return (
      <Badge className={roleColors[role] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'}>
        {role.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Filter users
  const filteredUsers = usersData?.users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && !user.deletedAt) ||
      (statusFilter === 'INACTIVE' && user.deletedAt)
    
    return matchesSearch && matchesRole && matchesStatus
  }) || []

  // Define columns for ResponsiveTable
  const columns: ResponsiveTableColumn<User>[] = [
    {
      key: 'name',
      label: 'User',
      mobileLabel: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{user.name || 'Unnamed User'}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      mobileLabel: 'Role',
      hideOnMobile: false,
      render: (user: User) => getRoleBadge(user.role)
    },
    {
      key: 'status',
      label: 'Status',
      mobileLabel: 'Status',
      hideOnMobile: false,
      render: (user: User) => (
        <div className="flex gap-2">
          {user.deletedAt ? (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              Deactivated
            </Badge>
          ) : (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Active
            </Badge>
          )}
          {user.emailVerified && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              Verified
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined',
      mobileLabel: 'Joined',
      hideOnMobile: true,
      render: (user: User) => formatDate(user.createdAt)
    },
    {
      key: 'actions',
      label: 'Actions',
      mobileLabel: 'Actions',
      render: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/super-admin/users/${user.id}`)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/super-admin/users/${user.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setStatusDialog({
                open: true,
                id: user.id,
                name: user.name || user.email,
                currentStatus: !user.deletedAt
              })}
            >
              {user.deletedAt ? (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteDialog({
                open: true,
                id: user.id,
                name: user.name || user.email
              })}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  if (loading && !usersData) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <StatsGridSkeleton count={4} />
      </div>
    )
  }

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center" data-testid="users-page-header">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
            <p className="text-slate-400">Manage all platform users and their permissions</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-600"
              data-testid="users-refresh-button"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" asChild data-testid="users-add-button">
              <Link href="/super-admin/users/new">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="users-stats-cards">
          <Card className="bg-slate-800/50 border-slate-700" data-testid="stat-total-users">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">
                    {usersData?.pagination.total || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-green-400">
                    {usersData?.users.filter(u => !u.deletedAt).length || 0}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Admins</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {usersData?.users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length || 0}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Deactivated</p>
                  <p className="text-2xl font-bold text-red-400">
                    {usersData?.users.filter(u => u.deletedAt).length || 0}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white"
                    data-testid="users-search-input"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600 text-white" data-testid="users-role-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                  <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                  <SelectItem value="CLIENT">Client</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-slate-900/50 border-slate-600 text-white" data-testid="users-status-filter">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="INACTIVE">Inactive Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button 
                variant="outline" 
                className="border-slate-600"
                onClick={handleExport}
                data-testid="users-export-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/50">
            <CardContent className="p-4">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Users List with ResponsiveTable */}
        <Card className="bg-slate-800/50 border-slate-700" data-testid="users-list-card">
          <CardHeader>
            <CardTitle className="text-white">Users List</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveTable<User>
              data={filteredUsers}
              columns={columns}
              keyExtractor={(user) => user.id}
              emptyMessage="No users found. Try adjusting your filters."
              onRowClick={(user) => router.push(`/super-admin/users/${user.id}`)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, id: '', name: '' })}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      {/* Status Toggle Confirmation Dialog */}
      <ConfirmDialog
        open={statusDialog.open}
        onOpenChange={(open) => !open && setStatusDialog({ open: false, id: '', name: '', currentStatus: false })}
        onConfirm={handleStatusToggle}
        title={statusDialog.currentStatus ? "Deactivate User" : "Activate User"}
        description={`Are you sure you want to ${statusDialog.currentStatus ? 'deactivate' : 'activate'} "${statusDialog.name}"?`}
        confirmText={statusDialog.currentStatus ? "Deactivate" : "Activate"}
      />
    </div>
  )
}
