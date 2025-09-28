"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Edit,
  RefreshCw,
  AlertCircle,
  Trash2,
  ExternalLink,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useAdminClients } from "@/hooks/use-admin-data"
// import { CreateClientDialog } from "@/components/admin/create-client-dialog"
// import { EditClientDialog } from "@/components/admin/edit-client-dialog"
import { useState } from "react"

export default function ClientsPage() {
  const { clients, isLoading, error, mutate } = useAdminClients()
  const [searchTerm, setSearchTerm] = useState("")
  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        mutate() // Refresh the client list
      } else {
        alert('Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="zyphex-card">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <Alert className="border-red-500">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load clients. Please try again.
              <Button onClick={() => mutate()} variant="outline" size="sm" className="ml-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <SubtleBackground />

        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 relative z-10">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 text-zyphex-primary hover:text-zyphex-accent" />
            <Separator orientation="vertical" className="mr-2 h-4 bg-zyphex-secondary/30" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/admin" className="text-zyphex-primary hover:text-zyphex-accent">Admin</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-zyphex-accent">Clients</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-gradient-text">Client Management</h1>
              <p className="text-zyphex-primary/70 mt-1">Manage your clients and their information</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => mutate()}
                className="zyphex-button-secondary"
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <Card className="zyphex-card border-zyphex-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-glass-effect border-gray-600 focus:border-blue-400"
                  />
                </div>
                <Button variant="outline" size="sm" className="zyphex-button-secondary bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button 
                  onClick={() => alert('Add client functionality coming soon!')}
                  className="zyphex-button-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Clients Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className="zyphex-card hover-zyphex-lift group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 zyphex-blue-glow">
                        <AvatarFallback className="zyphex-gradient-primary">
                          {client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg zyphex-heading">{client.name}</CardTitle>
                        <CardDescription className="zyphex-subheading">{client.company || 'Individual Client'}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zyphex-primary hover:text-zyphex-accent hover:bg-zyphex-accent/10"
                        onClick={() => alert('Edit functionality coming soon!')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                      <Mail className="h-4 w-4" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                      <Phone className="h-4 w-4" />
                      <span>{client.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                      <Building className="h-4 w-4" />
                      <span>{client.company || 'Individual'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                      <MapPin className="h-4 w-4" />
                      <span>{client.address || 'No address'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm zyphex-subheading">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold zyphex-heading">{client._count.projects}</div>
                        <div className="text-xs zyphex-subheading">Total Projects</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold zyphex-heading">
                          {client.projects.filter(p => p.status === 'IN_PROGRESS').length}
                        </div>
                        <div className="text-xs zyphex-subheading">Active Projects</div>
                      </div>
                    </div>
                    {client.website && (
                      <div className="mt-3 text-center">
                        <a 
                          href={client.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-zyphex-accent hover:underline text-sm flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* TODO: Re-enable when dialog components are created
      <CreateClientDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSuccess={() => mutate()} 
      />
      
      <EditClientDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        client={editingClient}
        onSuccess={() => mutate()}
      />
      */}
    </>
  )
}
