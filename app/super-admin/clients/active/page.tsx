'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import {
  Users,
  Search,
  TrendingUp,
  DollarSign,
  Briefcase,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Activity,
  MessageSquare,
  FileText,
  Edit,
  Plus,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  Target,
  BarChart3,
  History
} from 'lucide-react';

export default function ActiveClientsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [healthFilter, setHealthFilter] = useState('all');

  // Mock data - Replace with actual API calls
  const clients = [
    {
      id: 'CLT-001',
      name: 'TechMart Inc.',
      logo: 'TM',
      industry: 'E-Commerce',
      status: 'active',
      healthScore: 95,
      activeProjects: 3,
      completedProjects: 8,
      totalRevenue: 450000,
      currentValue: 125000,
      contactPerson: 'John Smith',
      email: 'john@techmart.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      since: '2023-01-15',
      lastContact: '2025-10-24',
      nextMeeting: '2025-10-28',
      satisfaction: 4.8,
      projectSuccessRate: 92,
      avgResponseTime: '2 hours',
      notes: 'Premium client with high engagement. Interested in expanding services.',
      recentActivities: [
        { type: 'meeting', description: 'Quarterly review meeting', date: '2025-10-24' },
        { type: 'project', description: 'E-Commerce platform phase 2 started', date: '2025-10-20' },
        { type: 'payment', description: 'Invoice #1234 paid', date: '2025-10-18' }
      ],
      communications: 45,
      documents: 23
    },
    {
      id: 'CLT-002',
      name: 'GlobalTech Solutions',
      logo: 'GT',
      industry: 'Technology',
      status: 'active',
      healthScore: 78,
      activeProjects: 2,
      completedProjects: 5,
      totalRevenue: 320000,
      currentValue: 85000,
      contactPerson: 'Robert Wilson',
      email: 'robert@globaltech.com',
      phone: '+1 (555) 234-5678',
      location: 'New York, NY',
      since: '2023-06-20',
      lastContact: '2025-10-22',
      nextMeeting: '2025-11-02',
      satisfaction: 4.3,
      projectSuccessRate: 85,
      avgResponseTime: '4 hours',
      notes: 'Regular client with consistent project pipeline.',
      recentActivities: [
        { type: 'email', description: 'Project update sent', date: '2025-10-22' },
        { type: 'project', description: 'Website revamp completed', date: '2025-10-15' },
        { type: 'call', description: 'Status call conducted', date: '2025-10-10' }
      ],
      communications: 32,
      documents: 18
    },
    {
      id: 'CLT-003',
      name: 'DataInsights Corp',
      logo: 'DI',
      industry: 'Analytics',
      status: 'active',
      healthScore: 88,
      activeProjects: 1,
      completedProjects: 3,
      totalRevenue: 280000,
      currentValue: 95000,
      contactPerson: 'Mark Thompson',
      email: 'mark@datainsights.com',
      phone: '+1 (555) 345-6789',
      location: 'Austin, TX',
      since: '2024-02-10',
      lastContact: '2025-10-25',
      nextMeeting: '2025-10-30',
      satisfaction: 4.6,
      projectSuccessRate: 88,
      avgResponseTime: '3 hours',
      notes: 'Fast-growing startup with high potential for expansion.',
      recentActivities: [
        { type: 'meeting', description: 'Sprint planning meeting', date: '2025-10-25' },
        { type: 'project', description: 'Analytics dashboard milestone reached', date: '2025-10-22' },
        { type: 'email', description: 'Feature request received', date: '2025-10-20' }
      ],
      communications: 28,
      documents: 15
    },
    {
      id: 'CLT-004',
      name: 'FitLife Health',
      logo: 'FH',
      industry: 'Healthcare',
      status: 'active',
      healthScore: 82,
      activeProjects: 2,
      completedProjects: 4,
      totalRevenue: 195000,
      currentValue: 75000,
      contactPerson: 'Emily Davis',
      email: 'emily@fitlife.com',
      phone: '+1 (555) 456-7890',
      location: 'Los Angeles, CA',
      since: '2023-09-05',
      lastContact: '2025-10-23',
      nextMeeting: '2025-11-01',
      satisfaction: 4.5,
      projectSuccessRate: 87,
      avgResponseTime: '3.5 hours',
      notes: 'Health app client with focus on user experience.',
      recentActivities: [
        { type: 'project', description: 'Mobile app redesign approved', date: '2025-10-23' },
        { type: 'call', description: 'Weekly sync call', date: '2025-10-21' },
        { type: 'payment', description: 'Monthly retainer received', date: '2025-10-01' }
      ],
      communications: 38,
      documents: 20
    },
    {
      id: 'CLT-005',
      name: 'StartupHub Technologies',
      logo: 'SH',
      industry: 'SaaS',
      status: 'active',
      healthScore: 91,
      activeProjects: 4,
      completedProjects: 2,
      totalRevenue: 580000,
      currentValue: 200000,
      contactPerson: 'Chris Taylor',
      email: 'chris@startuphub.com',
      phone: '+1 (555) 567-8901',
      location: 'Seattle, WA',
      since: '2024-05-12',
      lastContact: '2025-10-26',
      nextMeeting: '2025-10-29',
      satisfaction: 4.9,
      projectSuccessRate: 94,
      avgResponseTime: '1.5 hours',
      notes: 'Strategic partner with multiple concurrent projects. High priority.',
      recentActivities: [
        { type: 'meeting', description: 'Product roadmap discussion', date: '2025-10-26' },
        { type: 'project', description: 'SaaS platform phase 1 completed', date: '2025-10-25' },
        { type: 'email', description: 'Expansion proposal sent', date: '2025-10-24' }
      ],
      communications: 52,
      documents: 31
    },
    {
      id: 'CLT-006',
      name: 'Enterprise Solutions Ltd',
      logo: 'ES',
      industry: 'Enterprise',
      status: 'active',
      healthScore: 65,
      activeProjects: 1,
      completedProjects: 6,
      totalRevenue: 420000,
      currentValue: 150000,
      contactPerson: 'Anna Brown',
      email: 'anna@enterprise.com',
      phone: '+1 (555) 678-9012',
      location: 'Chicago, IL',
      since: '2022-11-20',
      lastContact: '2025-10-15',
      nextMeeting: '2025-11-05',
      satisfaction: 3.8,
      projectSuccessRate: 78,
      avgResponseTime: '6 hours',
      notes: 'Needs attention. Recent communication gaps. Schedule check-in call.',
      recentActivities: [
        { type: 'email', description: 'Project delay notification', date: '2025-10-15' },
        { type: 'project', description: 'Cloud migration paused', date: '2025-10-10' },
        { type: 'call', description: 'Escalation call', date: '2025-10-08' }
      ],
      communications: 24,
      documents: 19
    }
  ];

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (score >= 70) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Needs Attention';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHealth = healthFilter === 'all' ||
                         (healthFilter === 'excellent' && client.healthScore >= 85) ||
                         (healthFilter === 'good' && client.healthScore >= 70 && client.healthScore < 85) ||
                         (healthFilter === 'attention' && client.healthScore < 70);
    
    return matchesSearch && matchesHealth;
  });

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
  const avgHealthScore = clients.reduce((sum, c) => sum + c.healthScore, 0) / clients.length;
  const totalActiveProjects = clients.reduce((sum, c) => sum + c.activeProjects, 0);
  const avgSatisfaction = clients.reduce((sum, c) => sum + c.satisfaction, 0) / clients.length;

  const handleEditClient = (clientId: string) => {
    toast({
      title: 'Edit Client',
      description: `Opening edit form for ${clientId}`
    });
  };

  const handleAddNote = (clientId: string) => {
    toast({
      title: 'Add Note',
      description: `Adding note to client ${clientId}`
    });
  };

  const handleScheduleMeeting = (clientId: string) => {
    toast({
      title: 'Schedule Meeting',
      description: `Opening calendar for client ${clientId}`
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'project': return <Briefcase className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Active Clients
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and monitor all active client relationships
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {clients.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Active relationships
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-green-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-green-600">
                    ${(totalRevenue / 1000).toFixed(0)}K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Lifetime value
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-purple-600">
                    {avgHealthScore.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Overall health
                  </p>
                </div>
                <Activity className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-yellow-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-yellow-600">
                    {totalActiveProjects}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    In progress
                  </p>
                </div>
                <Briefcase className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search clients by name, contact, industry, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={healthFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHealthFilter('all')}
                  className={healthFilter === 'all' ? 'zyphex-button-primary' : ''}
                >
                  All Clients
                </Button>
                <Button
                  variant={healthFilter === 'excellent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHealthFilter('excellent')}
                  className={healthFilter === 'excellent' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Excellent
                </Button>
                <Button
                  variant={healthFilter === 'good' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHealthFilter('good')}
                  className={healthFilter === 'good' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Good
                </Button>
                <Button
                  variant={healthFilter === 'attention' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setHealthFilter('attention')}
                  className={healthFilter === 'attention' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Needs Attention
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button className="zyphex-button-primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Clients List */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-[calc(100vh-450px)]">
              <div className="space-y-4 pr-4">
                {filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    className={`zyphex-card hover-zyphex-lift cursor-pointer transition-all ${
                      selectedClient === client.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedClient(client.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {client.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-xl">{client.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {client.id}
                              </Badge>
                              <Badge className={getHealthBadgeColor(client.healthScore)}>
                                {getHealthLabel(client.healthScore)}
                              </Badge>
                            </div>
                            <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {client.industry}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {client.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Client since {client.since}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Client Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Health Score</div>
                          <div className="flex items-center gap-2">
                            <div className={`text-2xl font-bold ${getHealthColor(client.healthScore)}`}>
                              {client.healthScore}%
                            </div>
                          </div>
                          <Progress value={client.healthScore} className="h-1 mt-2" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Active Projects</div>
                          <div className="text-2xl font-bold text-blue-600">{client.activeProjects}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {client.completedProjects} completed
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Value</div>
                          <div className="text-2xl font-bold text-green-600">
                            ${(client.currentValue / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            ${(client.totalRevenue / 1000).toFixed(0)}K total
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Satisfaction</div>
                          <div className="flex items-center gap-1">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span className="text-2xl font-bold">{client.satisfaction}</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {client.projectSuccessRate}% success rate
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Contact Information */}
                      <div className="mb-4">
                        <div className="font-semibold mb-2">Contact Person</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{client.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-blue-600">{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MessageSquare className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                          <div className="text-lg font-bold">{client.communications}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Communications</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <FileText className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                          <div className="text-lg font-bold">{client.documents}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Documents</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Clock className="h-5 w-5 text-green-500 mx-auto mb-1" />
                          <div className="text-lg font-bold">{client.avgResponseTime}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Avg Response</div>
                        </div>
                      </div>

                      {/* Notes */}
                      {client.notes && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{client.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClient(client.id);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddNote(client.id);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Note
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScheduleMeeting(client.id);
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule Meeting
                        </Button>
                        <Button
                          size="sm"
                          className="zyphex-button-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client.id);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredClients.length === 0 && (
                  <Card className="zyphex-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Clients Found</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {searchTerm || healthFilter !== 'all'
                          ? 'Try adjusting your filters or search term'
                          : 'Get started by adding your first client'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar - Client Details & Analytics */}
          <div className="space-y-6">
            {/* Selected Client Details */}
            {selectedClient && (
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const client = clients.find(c => c.id === selectedClient);
                    if (!client) return null;

                    return (
                      <div className="space-y-4">
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3 pr-4">
                            {client.recentActivities.map((activity, index) => (
                              <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">{activity.description}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.date}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Next Meeting
                          </Label>
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <Calendar className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{client.nextMeeting}</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Last Contact
                          </Label>
                          <div className="text-sm">{client.lastContact}</div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Client Analytics Summary */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  Analytics Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Client Satisfaction
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{avgSatisfaction.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Clients with Excellent Health
                  </span>
                  <span className="font-semibold text-green-600">
                    {clients.filter(c => c.healthScore >= 85).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Clients Needing Attention
                  </span>
                  <span className="font-semibold text-red-600">
                    {clients.filter(c => c.healthScore < 70).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Completed Projects
                  </span>
                  <span className="font-semibold">
                    {clients.reduce((sum, c) => sum + c.completedProjects, 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Health Distribution */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Health Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600">Excellent (85-100%)</span>
                    <span className="text-sm font-bold">{clients.filter(c => c.healthScore >= 85).length}</span>
                  </div>
                  <Progress 
                    value={(clients.filter(c => c.healthScore >= 85).length / clients.length) * 100} 
                    className="h-2 bg-gray-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-yellow-600">Good (70-84%)</span>
                    <span className="text-sm font-bold">
                      {clients.filter(c => c.healthScore >= 70 && c.healthScore < 85).length}
                    </span>
                  </div>
                  <Progress 
                    value={(clients.filter(c => c.healthScore >= 70 && c.healthScore < 85).length / clients.length) * 100} 
                    className="h-2 bg-gray-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-600">Needs Attention (&lt;70%)</span>
                    <span className="text-sm font-bold">{clients.filter(c => c.healthScore < 70).length}</span>
                  </div>
                  <Progress 
                    value={(clients.filter(c => c.healthScore < 70).length / clients.length) * 100} 
                    className="h-2 bg-gray-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  View Communication History
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Award className="h-4 w-4 mr-2" />
                  Generate Client Report
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Revenue Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
