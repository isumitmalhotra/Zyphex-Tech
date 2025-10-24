'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Building2, 
  Search, 
  Plus, 
  Grid3x3,
  List,
  MoreVertical,
  Calendar,
  DollarSign,
  Briefcase,
  Activity,
  Mail,
  Phone,
  ChevronRight,
  Download,
  RefreshCw,
  Globe,
  Clock,
  MessageSquare,
  Timer,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  address: string | null;
  website?: string | null;
  timezone?: string | null;
  logo?: string | null;
  industry?: string | null;
  status: string;
  createdAt: string;
  projectCount: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalBudget: number;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  status: string;
  completionRate: number;
  budget: number;
  budgetUsed: number;
  startDate: string | null;
  endDate: string | null;
  priority: string;
  methodology: string;
}

interface Stats {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  totalBudget: number;
  activeProjects: number;
  completedProjects: number;
  clientHealthScore: number;
  averageRevenuePerClient: number;
}

export default function ClientProjectsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [_statusFilter, _setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New client form state
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    website: '',
    timezone: '',
    industry: '',
    notes: '',
  });
  const [_logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // New project form state
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    hourlyRate: '',
    startDate: '',
    endDate: '',
    priority: 'MEDIUM',
    methodology: 'AGILE',
  });

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: _statusFilter,
        sortBy,
        page: currentPage.toString(),
        limit: '12',
      });

      const response = await fetch(`/api/project-manager/clients?${params}`);
      if (!response.ok) throw new Error('Failed to fetch clients');

      const data = await response.json();
      setClients(data.clients);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch('/api/project-manager/clients/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchClients();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchTerm, _statusFilter, sortBy, currentPage]);

  // Create new client
  const handleCreateClient = async () => {
    try {
      const response = await fetch('/api/project-manager/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create client');
      }

      toast.success('Client created successfully');
      setShowNewClientDialog(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        website: '',
        timezone: '',
        industry: '',
        notes: '',
      });
      setLogoFile(null);
      setLogoPreview('');
      fetchClients();
      fetchStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create client';
      toast.error(message);
    }
  };

  // Create new project for client
  const handleCreateProject = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(
        `/api/project-manager/clients/${selectedClient.id}/projects`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProject),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }

      toast.success('Project created successfully');
      setShowNewProjectDialog(false);
      setNewProject({
        name: '',
        description: '',
        budget: '',
        hourlyRate: '',
        startDate: '',
        endDate: '',
        priority: 'MEDIUM',
        methodology: 'AGILE',
      });
      fetchClients();
      fetchStats();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      toast.error(message);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Company', 'Projects', 'Active', 'Completed', 'Revenue'],
      ...clients.map((c) => [
        c.name,
        c.email,
        c.company,
        c.projectCount,
        c.activeProjects,
        c.completedProjects,
        c.totalRevenue,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clients.csv';
    a.click();
    toast.success('Clients exported successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500/10 text-green-500';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500';
      case 'PLANNING':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'ON_HOLD':
        return 'bg-orange-500/10 text-orange-500';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-500';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'LOW':
        return 'bg-green-500/10 text-green-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 zyphex-gradient-bg relative min-h-screen">
      <div className="flex flex-1 flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold zyphex-heading">
                Client Projects
              </h1>
              <p className="zyphex-subheading mt-1">
                Manage clients and their project portfolios
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchClients}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Create a new client profile with complete information
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Logo Upload */}
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Client Logo
                      </label>
                      <div className="mt-2 flex items-center gap-4">
                        {logoPreview ? (
                          <div className="relative w-20 h-20 border rounded-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => {
                                setLogoFile(null);
                                setLogoPreview('');
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLogoFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setLogoPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Name *</label>
                        <Input
                          value={newClient.name}
                          onChange={(e) =>
                            setNewClient({ ...newClient, name: e.target.value })
                          }
                          placeholder="Client name"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          type="email"
                          value={newClient.email}
                          onChange={(e) =>
                            setNewClient({ ...newClient, email: e.target.value })
                          }
                          placeholder="client@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Company</label>
                        <Input
                          value={newClient.company}
                          onChange={(e) =>
                            setNewClient({ ...newClient, company: e.target.value })
                          }
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Industry</label>
                        <Select
                          value={newClient.industry}
                          onValueChange={(value) =>
                            setNewClient({ ...newClient, industry: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="real-estate">Real Estate</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone
                        </label>
                        <Input
                          value={newClient.phone}
                          onChange={(e) =>
                            setNewClient({ ...newClient, phone: e.target.value })
                          }
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          Website
                        </label>
                        <Input
                          value={newClient.website}
                          onChange={(e) =>
                            setNewClient({ ...newClient, website: e.target.value })
                          }
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Address</label>
                        <Input
                          value={newClient.address}
                          onChange={(e) =>
                            setNewClient({ ...newClient, address: e.target.value })
                          }
                          placeholder="Full address"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Timezone
                        </label>
                        <Select
                          value={newClient.timezone}
                          onValueChange={(value) =>
                            setNewClient({ ...newClient, timezone: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                            <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                            <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                            <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                            <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewClientDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateClient}
                      disabled={!newClient.name || !newClient.email}
                    >
                      Create Client
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsLoading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : stats ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Clients
                    </CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalClients}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeClients} active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${stats.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${Math.round(stats.averageRevenuePerClient).toLocaleString()}{' '}
                      avg per client
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Projects
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.activeProjects}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.completedProjects} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Client Health
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.clientHealthScore}%
                    </div>
                    <Progress value={stats.clientHealthScore} className="mt-2" />
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="projectCount">Projects</SelectItem>
                <SelectItem value="createdAt">Date Added</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Clients Grid/List */}
        {loading ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
            }
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clients found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first client'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowNewClientDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedClient(client)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {client.company}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setShowNewProjectDialog(true);
                          }}
                        >
                          Add Project
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/project-manager/client-comms?client=${client.id}`;
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/project-manager/time-tracking?client=${client.id}`;
                          }}
                        >
                          <Timer className="h-4 w-4 mr-2" />
                          View Time Logs
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/project-manager/budget?client=${client.id}`;
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          View Budget
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {client.email}
                      </span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{client.phone}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {client.projectCount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Projects
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">
                          {client.activeProjects}
                        </div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {client.completedProjects}
                        </div>
                        <div className="text-xs text-muted-foreground">Done</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-muted-foreground">Revenue</span>
                        <span className="text-sm font-semibold">
                          ${client.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(client.totalRevenue / client.totalBudget) * 100}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{client.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {client.company}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            {client.email}
                          </span>
                          {client.phone && (
                            <span className="text-sm text-muted-foreground">
                              {client.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {client.projectCount}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Projects
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-500">
                            {client.activeProjects}
                          </div>
                          <div className="text-xs text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">
                            {client.completedProjects}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completed
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold">
                            ${client.totalRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Client Details Sidebar */}
      <Dialog
        open={!!selectedClient && !showNewProjectDialog}
        onOpenChange={(open) => !open && setSelectedClient(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">
                      {selectedClient.name}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedClient.company}
                    </DialogDescription>
                  </div>
                  <Badge variant="secondary">{selectedClient.status}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={selectedClient.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {selectedClient.website}
                        </a>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.address}</span>
                      </div>
                    )}
                    {selectedClient.timezone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.timezone.replace('_', ' ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Client since{' '}
                        {new Date(selectedClient.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {selectedClient.projectCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total Projects
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        {selectedClient.activeProjects}
                      </div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500">
                        {selectedClient.completedProjects}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Completed
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-xl font-bold">
                        ${selectedClient.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Projects */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">Projects</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowNewProjectDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </div>
                  {selectedClient.projects.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No projects yet
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {selectedClient.projects.map((project) => (
                        <Card key={project.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold">{project.name}</h4>
                                  <Badge className={getStatusColor(project.status)}>
                                    {project.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={getPriorityColor(project.priority)}>
                                    {project.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {project.budgetUsed.toLocaleString()} /{' '}
                                    {project.budget.toLocaleString()}
                                  </span>
                                  {project.startDate && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(project.startDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  <Badge variant="outline">{project.methodology}</Badge>
                                </div>
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{project.completionRate}%</span>
                                  </div>
                                  <Progress value={project.completionRate} />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  (window.location.href = `/project-manager/projects/${project.id}`)
                                }
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `/project-manager/client-comms?client=${selectedClient.id}`)
                    }
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewProjectDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `/project-manager/time-tracking?client=${selectedClient.id}`)
                    }
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Time Logs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `/project-manager/budget?client=${selectedClient.id}`)
                    }
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Budget
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      (window.location.href = `/project-manager/documents?client=${selectedClient.id}`)
                    }
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Documents
                  </Button>
                  {selectedClient.website && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedClient.website!, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Website
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              {selectedClient && `For ${selectedClient.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Name *</label>
              <Input
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={newProject.description}
                onChange={(e) =>
                  setNewProject({ ...newProject, description: e.target.value })
                }
                placeholder="Brief project description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Budget *</label>
                <Input
                  type="number"
                  value={newProject.budget}
                  onChange={(e) =>
                    setNewProject({ ...newProject, budget: e.target.value })
                  }
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hourly Rate *</label>
                <Input
                  type="number"
                  value={newProject.hourlyRate}
                  onChange={(e) =>
                    setNewProject({ ...newProject, hourlyRate: e.target.value })
                  }
                  placeholder="150"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={newProject.startDate}
                  onChange={(e) =>
                    setNewProject({ ...newProject, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={newProject.endDate}
                  onChange={(e) =>
                    setNewProject({ ...newProject, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newProject.priority}
                  onValueChange={(value) =>
                    setNewProject({ ...newProject, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Methodology</label>
                <Select
                  value={newProject.methodology}
                  onValueChange={(value) =>
                    setNewProject({ ...newProject, methodology: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGILE">Agile</SelectItem>
                    <SelectItem value="WATERFALL">Waterfall</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewProjectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={
                !newProject.name || !newProject.budget || !newProject.hourlyRate
              }
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}