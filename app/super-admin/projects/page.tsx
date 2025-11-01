'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Briefcase, Search, Plus, MoreVertical, Calendar, Users, DollarSign, Eye, Edit, Archive, Trash2, RefreshCw, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from "sonner"
import { exportToCSV } from "@/lib/utils/export"
import { StatsGridSkeleton } from "@/components/skeletons/stats-skeleton"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DataPagination } from "@/components/data-pagination"
import { ResponsiveTable, type ResponsiveTableColumn } from '@/components/ui/responsive-table'
import { EmptyState } from '@/components/ui/empty-state'

interface Project {
  id: string
  name: string
  status: string
  progress: number | null
  startDate: string | null
  endDate: string | null
  budget: number | null
  client?: { name: string } | null
  _count?: { teamMembers: number }
}

export default function ProjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; name: string; action: 'delete' | 'archive' }>({
    open: false,
    id: "",
    name: "",
    action: 'delete'
  })
  const [stats, setStats] = useState({ total: 0, active: 0, totalBudget: 0, totalTeamMembers: 0 })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterStatus])

  useEffect(() => {
    fetchProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
        calculateStats(data)
        toast.success(`Loaded ${data.length} projects`)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      toast.error('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (projectsList: Project[]) => {
    const total = projectsList.length
    const active = projectsList.filter((p: Project) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length
    const totalBudget = projectsList.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0)
    const totalTeamMembers = projectsList.reduce((sum: number, p: Project) => sum + (p._count?.teamMembers || 0), 0)
    setStats({ total, active, totalBudget, totalTeamMembers })
  }

  const handleAction = async () => {
    try {
      if (deleteDialog.action === 'delete') {
        const response = await fetch(`/api/admin/projects/${deleteDialog.id}`, { method: 'DELETE' })
        if (response.ok) {
          setProjects(prev => {
            const updated = prev.filter((p: Project) => p.id !== deleteDialog.id)
            calculateStats(updated)
            return updated
          })
          toast.success(`Project "${deleteDialog.name}" deleted successfully!`)
        } else {
          toast.error('Failed to delete project')
        }
      } else {
        const response = await fetch(`/api/admin/projects/${deleteDialog.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ARCHIVED' })
        })
        if (response.ok) {
          toast.success(`Project "${deleteDialog.name}" archived successfully!`)
          fetchProjects()
        } else {
          toast.error('Failed to archive project')
        }
      }
      setDeleteDialog({ open: false, id: "", name: "", action: 'delete' })
    } catch (error) {
      console.error('Failed to perform action:', error)
      toast.error(`Failed to ${deleteDialog.action} project`)
    }
  }

  const handleExport = () => {
    const exportData = filteredProjects.map(project => ({
      Name: project.name,
      Status: project.status.replace('_', ' '),
      Progress: `${project.progress || 0}%`,
      'Start Date': project.startDate || 'N/A',
      'End Date': project.endDate || 'N/A',
      Budget: project.budget ? `$${project.budget.toLocaleString()}` : 'N/A',
      Client: project.client?.name || 'N/A',
      'Team Size': project._count?.teamMembers || 0
    }))
    
    exportToCSV(exportData, 'projects')
  }

  const filteredProjects = projects.filter((project: Project) => {
    const matchesSearch = project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'IN_PROGRESS': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'ACTIVE': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'PLANNING': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'ON_HOLD': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'REVIEW': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'COMPLETED': 'bg-green-500/10 text-green-500 border-green-500/20',
      'ARCHIVED': 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }

  const formatStatus = (status: string) => {
    return status?.replace('_', ' ').split(' ').map((word: string) => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const formatBudget = (amount: number | null) => {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount)
  }

  // Define columns for ResponsiveTable
  const columns: ResponsiveTableColumn<Project>[] = [
    {
      key: 'name',
      label: 'Project Name',
      mobileLabel: 'Project',
      render: (project: Project) => (
        <div className="font-semibold">{project.name}</div>
      )
    },
    {
      key: 'client',
      label: 'Client',
      mobileLabel: 'Client',
      hideOnMobile: false,
      render: (project: Project) => (
        <div className="text-sm">{project.client?.name || 'No Client'}</div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      mobileLabel: 'Status',
      hideOnMobile: false,
      render: (project: Project) => (
        <Badge className={getStatusColor(project.status)}>
          {formatStatus(project.status)}
        </Badge>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      mobileLabel: 'Progress',
      hideOnMobile: true,
      render: (project: Project) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden max-w-[100px]">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">{project.progress || 0}%</span>
        </div>
      )
    },
    {
      key: 'timeline',
      label: 'Timeline',
      mobileLabel: 'Timeline',
      hideOnMobile: true,
      render: (project: Project) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'budget',
      label: 'Budget',
      mobileLabel: 'Budget',
      hideOnMobile: true,
      render: (project: Project) => (
        <div className="font-mono text-sm">{formatBudget(project.budget)}</div>
      )
    },
    {
      key: 'team',
      label: 'Team',
      mobileLabel: 'Team',
      hideOnMobile: true,
      render: (project: Project) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{project._count?.teamMembers || 0}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      mobileLabel: 'Actions',
      render: (project: Project) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/super-admin/projects/${project.id}`)}>
              <Eye className='mr-2 h-4 w-4' />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/super-admin/projects/${project.id}/edit`)}>
              <Edit className='mr-2 h-4 w-4' />
              Edit Project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteDialog({ open: true, id: project.id, name: project.name, action: 'archive' })}>
              <Archive className='mr-2 h-4 w-4' />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem 
              className='text-destructive'
              onClick={() => setDeleteDialog({ open: true, id: project.id, name: project.name, action: 'delete' })}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between' data-testid="projects-page-header">
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Projects</h2>
          <p className='text-muted-foreground'>Manage and track all your projects</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' size='icon' onClick={handleExport} title="Export to CSV" data-testid="projects-export-button">
            <Download className='h-4 w-4' />
          </Button>
          <Button onClick={fetchProjects} variant='outline' disabled={loading} data-testid="projects-refresh-button">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href='/super-admin/projects/new'>
            <Button data-testid="projects-add-button">
              <Plus className='mr-2 h-4 w-4' />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4' data-testid="projects-stats-cards">
        <Card data-testid="stat-total-projects">
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Projects</CardTitle>
            <Briefcase className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>{stats.active} active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Projects</CardTitle>
            <Briefcase className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.active}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Budget</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatBudget(stats.totalBudget)}</div>
            <p className='text-xs text-muted-foreground'>Combined budgets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Team Members</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalTeamMembers}</div>
            <p className='text-xs text-muted-foreground'>Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card data-testid="projects-list-card">
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>All Projects</CardTitle>
              <CardDescription>A list of all projects and their details</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search projects...'
                  className='pl-8 w-[300px]'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="projects-search-input"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className='px-3 py-2 bg-background border border-input rounded-md text-sm'
                data-testid="projects-status-filter"
              >
                <option value='all'>All Status</option>
                <option value='ACTIVE'>Active</option>
                <option value='IN_PROGRESS'>In Progress</option>
                <option value='PLANNING'>Planning</option>
                <option value='ON_HOLD'>On Hold</option>
                <option value='REVIEW'>Review</option>
                <option value='COMPLETED'>Completed</option>
                <option value='ARCHIVED'>Archived</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-4'>
              <StatsGridSkeleton count={4} />
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No projects found"
              description={searchQuery || filterStatus !== 'all' 
                ? "Try adjusting your search or filters to find what you're looking for." 
                : "Get started by creating your first project."}
              action={{
                label: "Create Project",
                onClick: () => router.push('/super-admin/projects/new')
              }}
            />
          ) : (
            <>
              <ResponsiveTable<Project>
                data={filteredProjects}
                columns={columns}
                keyExtractor={(project) => project.id}
                emptyMessage="No projects found. Try adjusting your filters."
                onRowClick={(project) => router.push(`/super-admin/projects/${project.id}`)}
              />
              
              {/* Pagination */}
              {filteredProjects.length > itemsPerPage && (
                <div className="mt-4">
                  <DataPagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredProjects.length / itemsPerPage)}
                    totalItems={filteredProjects.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={deleteDialog.action === 'delete' ? 'Delete Project?' : 'Archive Project?'}
        description={`Are you sure you want to ${deleteDialog.action} "${deleteDialog.name}"? ${deleteDialog.action === 'delete' ? 'This action cannot be undone.' : 'You can restore it later.'}`}
        confirmText={deleteDialog.action === 'delete' ? 'Delete' : 'Archive'}
        cancelText="Cancel"
        onConfirm={handleAction}
        variant={deleteDialog.action === 'delete' ? 'destructive' : 'default'}
      />
    </div>
  )
}
