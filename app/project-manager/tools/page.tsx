'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Filter, RefreshCw, Settings, Trash2, Check, X, AlertCircle, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { integrationTemplates, integrationCategories, getIntegrationTemplate } from '@/lib/integrations/templates'
import { Textarea } from '@/components/ui/textarea'

interface Integration {
  id: string
  name: string
  type: string
  category: string
  description?: string
  isEnabled: boolean
  configuration?: any
  apiKey?: string
  webhookUrl?: string
  lastSyncAt?: string
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'SYNCING' | 'PENDING'
  errorMessage?: string
  syncFrequency?: string
  _count?: { logs: number }
}

export default function ToolsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [configValues, setConfigValues] = useState<any>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'available'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'PROJECT_MANAGER' && session?.user?.role !== 'ADMIN') {
        router.push('/dashboard')
      } else {
        fetchIntegrations()
      }
    }
  }, [status, session, router])

  useEffect(() => {
    filterIntegrations()
  }, [integrations, searchQuery, selectedCategory, viewMode])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/integrations')
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const filterIntegrations = () => {
    let filtered = [...integrations]

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(int => int.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(int =>
        int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        int.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by view mode
    if (viewMode === 'active') {
      filtered = filtered.filter(int => int.isEnabled)
    }

    setFilteredIntegrations(filtered)
  }

  const getAvailableTemplates = () => {
    const existingTypes = integrations.map(int => int.type)
    return integrationTemplates.filter(template => !existingTypes.includes(template.type))
  }

  const handleAddIntegration = async () => {
    if (!selectedTemplate) return

    try {
      setActionLoading('add')
      
      const configData: any = {}
      selectedTemplate.configFields.forEach((field: any) => {
        if (configValues[field.name]) {
          configData[field.name] = configValues[field.name]
        }
      })

      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplate.name,
          type: selectedTemplate.type,
          category: selectedTemplate.category,
          description: selectedTemplate.description,
          configuration: configData,
          webhookUrl: configValues.webhookUrl || null
        })
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `${selectedTemplate.name} integration added successfully`
        })
        setShowAddDialog(false)
        setSelectedTemplate(null)
        setConfigValues({})
        fetchIntegrations()
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to add integration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add integration',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleIntegration = async (integration: Integration) => {
    try {
      setActionLoading(integration.id)
      
      const res = await fetch(`/api/integrations/${integration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: !integration.isEnabled
        })
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Integration ${!integration.isEnabled ? 'enabled' : 'disabled'} successfully`
        })
        fetchIntegrations()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update integration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update integration',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleTestConnection = async (integration: Integration) => {
    try {
      setActionLoading(`test-${integration.id}`)
      
      const res = await fetch(`/api/integrations/${integration.id}/test`, {
        method: 'POST'
      })

      const result = await res.json()

      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      })

      fetchIntegrations()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSync = async (integration: Integration) => {
    try {
      setActionLoading(`sync-${integration.id}`)
      
      const res = await fetch(`/api/integrations/${integration.id}/sync`, {
        method: 'POST'
      })

      const result = await res.json()

      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      })

      fetchIntegrations()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync integration',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteIntegration = async () => {
    if (!selectedIntegration) return

    try {
      setActionLoading('delete')
      
      const res = await fetch(`/api/integrations/${selectedIntegration.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Integration deleted successfully'
        })
        setShowDeleteDialog(false)
        setSelectedIntegration(null)
        fetchIntegrations()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete integration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete integration',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openConfigDialog = (integration: Integration) => {
    setSelectedIntegration(integration)
    const template = getIntegrationTemplate(integration.type)
    setSelectedTemplate(template)
    setConfigValues(integration.configuration || {})
    setShowConfigDialog(true)
  }

  const handleUpdateConfig = async () => {
    if (!selectedIntegration) return

    try {
      setActionLoading('update')
      
      const res = await fetch(`/api/integrations/${selectedIntegration.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration: configValues
        })
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Configuration updated successfully'
        })
        setShowConfigDialog(false)
        setSelectedIntegration(null)
        setConfigValues({})
        fetchIntegrations()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update configuration',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: any } = {
      ACTIVE: { variant: 'default', icon: Check, color: 'text-green-600' },
      INACTIVE: { variant: 'secondary', icon: X, color: 'text-gray-600' },
      ERROR: { variant: 'destructive', icon: AlertCircle, color: 'text-red-600' },
      SYNCING: { variant: 'default', icon: RefreshCw, color: 'text-blue-600 animate-spin' },
      PENDING: { variant: 'outline', icon: Clock, color: 'text-yellow-600' }
    }

    const config = variants[status] || variants.INACTIVE
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const stats = {
    total: integrations.length,
    active: integrations.filter(i => i.isEnabled).length,
    error: integrations.filter(i => i.status === 'ERROR').length
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Tools & Integrations</h1>
            <p className="zyphex-subheading">Manage third-party integrations and tools</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="w-full md:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search integrations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrationCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                >
                  All
                </Button>
                <Button
                  variant={viewMode === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('active')}
                >
                  Active Only
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'ALL'
                    ? 'No integrations match your filters'
                    : 'No integrations configured yet'}
                </p>
                {!searchQuery && selectedCategory === 'ALL' && (
                  <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Integration
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredIntegrations.map(integration => {
              const template = getIntegrationTemplate(integration.type)
              return (
                <Card key={integration.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{template?.icon || '🔌'}</span>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {integrationCategories.find(c => c.value === integration.category)?.label}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={integration.isEnabled}
                        onCheckedChange={() => handleToggleIntegration(integration)}
                        disabled={actionLoading === integration.id}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {integration.description || template?.description}
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        {integration.lastSyncAt && (
                          <span className="text-xs text-muted-foreground">
                            Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {integration.errorMessage && (
                        <p className="text-xs text-red-600">{integration.errorMessage}</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleTestConnection(integration)}
                      disabled={actionLoading === `test-${integration.id}`}
                    >
                      {actionLoading === `test-${integration.id}` ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test'
                      )}
                    </Button>
                    {integration.isEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSync(integration)}
                        disabled={actionLoading === `sync-${integration.id}` || integration.status === 'SYNCING'}
                      >
                        {actionLoading === `sync-${integration.id}` || integration.status === 'SYNCING' ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Sync'
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfigDialog(integration)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIntegration(integration)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })
          )}
        </div>

        {/* Add Integration Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Choose an integration to connect with your workspace
              </DialogDescription>
            </DialogHeader>

            {!selectedTemplate ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {getAvailableTemplates().map(template => (
                  <Card
                    key={template.type}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {integrationCategories.find(c => c.value === template.category)?.label}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
                {getAvailableTemplates().length === 0 && (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    All available integrations have been added
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <span className="text-4xl">{selectedTemplate.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTemplate.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedTemplate.features.map((feature: string, i: number) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Configuration</h4>
                  {selectedTemplate.configFields.map((field: any) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-red-600">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder}
                          value={configValues[field.name] || ''}
                          onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={configValues[field.name] || ''}
                          onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                          required={field.required}
                        />
                      )}
                      {field.description && (
                        <p className="text-xs text-muted-foreground">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold text-sm">Setup Instructions</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {selectedTemplate.setupInstructions.map((instruction: string, i: number) => (
                      <li key={i}>{instruction}</li>
                    ))}
                  </ol>
                  <a
                    href={selectedTemplate.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-block mt-2"
                  >
                    View official documentation →
                  </a>
                </div>
              </div>
            )}

            <DialogFooter>
              {selectedTemplate && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null)
                    setConfigValues({})
                  }}
                >
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setSelectedTemplate(null)
                  setConfigValues({})
                }}
              >
                Cancel
              </Button>
              {selectedTemplate && (
                <Button onClick={handleAddIntegration} disabled={actionLoading === 'add'}>
                  {actionLoading === 'add' ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Integration
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Configure Integration Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
              <DialogDescription>
                Update integration settings and credentials
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4">
                {selectedTemplate.configFields.map((field: any) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={`edit-${field.name}`}>
                      {field.label}
                      {field.required && <span className="text-red-600">*</span>}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={`edit-${field.name}`}
                        placeholder={field.placeholder}
                        value={configValues[field.name] || ''}
                        onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                      />
                    ) : (
                      <Input
                        id={`edit-${field.name}`}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={configValues[field.name] || ''}
                        onChange={(e) => setConfigValues({ ...configValues, [field.name]: e.target.value })}
                      />
                    )}
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfigDialog(false)
                  setSelectedIntegration(null)
                  setConfigValues({})
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateConfig} disabled={actionLoading === 'update'}>
                {actionLoading === 'update' ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Settings className="mr-2 h-4 w-4" />
                )}
                Update Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Integration?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedIntegration?.name}? This action cannot be undone.
                All configuration and sync data will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedIntegration(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteIntegration}
                disabled={actionLoading === 'delete'}
                className="bg-red-600 hover:bg-red-700"
              >
                {actionLoading === 'delete' ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}