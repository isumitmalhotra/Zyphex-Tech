"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Mail,
  Phone,
  Building2,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download
} from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { generateAvatar } from "@/lib/utils/avatar"
import { toast } from "sonner"
import { exportToCSV } from "@/lib/utils/export"
import { StatsGridSkeleton } from "@/components/skeletons/stats-skeleton"
import { TableSkeletonWithActions } from "@/components/skeletons/table-skeleton"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DataPagination } from "@/components/data-pagination"
import { useSortableData } from "@/hooks/use-sortable-data"
import { SortableTableHeader } from "@/components/sortable-table-header"

interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  _count?: {
    projects: number
  }
}

export default function ClientsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, active: 0, leads: 0, totalRevenue: 0 })
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    id: string
    name: string
  }>({ open: false, id: "", name: "" })

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data)
      calculateStats(data)
      toast.success('Clients loaded successfully')
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate stats from real data
  const calculateStats = (clientsList: Client[]) => {
    const total = clientsList.length
    const active = clientsList.filter((c: Client) => c._count && c._count.projects > 0).length
    const leads = clientsList.filter((c: Client) => !c._count || c._count.projects === 0).length
    // Note: Revenue calculation would need project data - using placeholder for now
    const totalRevenue = 0
    
    setStats({ total, active, leads, totalRevenue })
  }

  // Delete client
  const handleDeleteClient = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${deleteDialog.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete client')
      
      toast.success(`Client "${deleteDialog.name}" deleted successfully`)
      setDeleteDialog({ open: false, id: "", name: "" })
      
      // Refresh the list
      setClients((prev: Client[]) => prev.filter((c: Client) => c.id !== deleteDialog.id))
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client. Please try again.')
    }
  }

  // Export clients to CSV
  const handleExport = () => {
    const exportData = filteredClients.map(client => ({
      Name: client.name,
      Email: client.email,
      Phone: client.phone || 'N/A',
      Company: client.company || 'N/A',
      Projects: client._count?.projects || 0,
      Status: getStatusInfo(client._count?.projects || 0).label
    }))
    exportToCSV(exportData, 'clients')
  }

  // Load clients on mount
  useEffect(() => {
    fetchClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter clients based on search
  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Apply sorting
  const { items: sortedClients, requestSort, getSortDirection } = useSortableData(filteredClients)

  // Apply pagination
  const paginatedClients = sortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const formatRevenue = (amount: number | null): string => {
    if (!amount) return '$0'
    return `$${amount.toLocaleString()}`
  }

  const formatPhone = (phone: string | null): string => {
    return phone || 'N/A'
  }

  const getStatusInfo = (projectCount: number) => {
    if (projectCount === 0) {
      return { label: 'Lead', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' }
    } else if (projectCount >= 3) {
      return { label: 'Premium', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' }
    } else {
      return { label: 'Active', color: 'bg-green-500/10 text-green-500 border-green-500/20' }
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2 mb-4">
          <div className="space-y-1">
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <StatsGridSkeleton count={4} />
        <TableSkeletonWithActions rows={10} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your clients and relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={fetchClients}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href="/super-admin/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All registered clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently working on projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
            <p className="text-xs text-muted-foreground">
              Potential new clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRevenue(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Clients</CardTitle>
              <CardDescription>
                Manage your client relationships ({filteredClients.length} results)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? 'No clients found matching your search.' : 'No clients found.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHeader
                    label="Client"
                    sortKey="name"
                    onSort={requestSort}
                    sortDirection={getSortDirection('name')}
                  />
                  <SortableTableHeader
                    label="Email"
                    sortKey="email"
                    onSort={requestSort}
                    sortDirection={getSortDirection('email')}
                  />
                  <SortableTableHeader
                    label="Phone"
                    sortKey="phone"
                    onSort={requestSort}
                    sortDirection={getSortDirection('phone')}
                  />
                  <SortableTableHeader
                    label="Company"
                    sortKey="company"
                    onSort={requestSort}
                    sortDirection={getSortDirection('company')}
                  />
                  <TableHead>Status</TableHead>
                  <SortableTableHeader
                    label="Projects"
                    sortKey="_count.projects"
                    onSort={requestSort}
                    sortDirection={getSortDirection('_count.projects')}
                    align="center"
                  />
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => {
                  const projectCount = client._count?.projects || 0
                  const statusInfo = getStatusInfo(projectCount)
                  
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={generateAvatar(client.name, 32)} />
                            <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {client.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {formatPhone(client.phone)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{client.company || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{projectCount}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push(`/super-admin/clients/${client.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/super-admin/clients/${client.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Client
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeleteDialog({ open: true, id: client.id, name: client.name })}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination */}
          {filteredClients.length > 0 && (
            <div className="mt-4">
              <DataPagination
                currentPage={currentPage}
                totalPages={Math.ceil(sortedClients.length / itemsPerPage)}
                totalItems={sortedClients.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Client?"
        description={`Are you sure you want to delete "${deleteDialog.name}"? This will permanently remove the client and all associated data. This action cannot be undone.`}
        onConfirm={handleDeleteClient}
        variant="destructive"
      />
    </div>
  )
}
