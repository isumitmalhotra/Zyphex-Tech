'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import {
  Globe,
  Search,
  Shield,
  Key,
  Palette,
  Eye,
  Settings,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Lock,
  Unlock,
  Copy,
  RefreshCw,
  Check,
  X,
  TrendingUp,
  Activity,
  LogIn,
  Clock,
  Zap,
  Plus,
  Download
} from 'lucide-react';

export default function ClientPortalPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  // Mock data - Replace with actual API calls
  const portalClients = [
    {
      id: 'CLT-001',
      name: 'TechMart Inc.',
      portalEnabled: true,
      username: 'techmart',
      lastLogin: '2025-10-25 14:32',
      loginCount: 142,
      activeUsers: 5,
      totalUsers: 8,
      projects: 3,
      documents: 23,
      messages: 45,
      customBranding: true,
      customDomain: 'portal.techmart.com',
      theme: 'Blue & White',
      logo: 'TM',
      features: {
        projects: true,
        documents: true,
        messaging: true,
        analytics: true,
        invoices: true,
        timeTracking: false
      },
      permissions: {
        viewProjects: true,
        downloadDocuments: true,
        uploadDocuments: false,
        createTasks: true,
        viewTeam: true,
        viewBudget: false
      },
      analytics: {
        pageViews: 1245,
        avgSessionDuration: '8m 32s',
        topPage: 'Projects Dashboard',
        engagement: 87
      },
      createdDate: '2023-01-15',
      lastUpdated: '2025-10-20'
    },
    {
      id: 'CLT-002',
      name: 'GlobalTech Solutions',
      portalEnabled: true,
      username: 'globaltech',
      lastLogin: '2025-10-24 09:15',
      loginCount: 89,
      activeUsers: 3,
      totalUsers: 5,
      projects: 2,
      documents: 18,
      messages: 32,
      customBranding: false,
      customDomain: null,
      theme: 'Default',
      logo: 'GT',
      features: {
        projects: true,
        documents: true,
        messaging: true,
        analytics: false,
        invoices: true,
        timeTracking: false
      },
      permissions: {
        viewProjects: true,
        downloadDocuments: true,
        uploadDocuments: true,
        createTasks: false,
        viewTeam: true,
        viewBudget: true
      },
      analytics: {
        pageViews: 687,
        avgSessionDuration: '6m 18s',
        topPage: 'Documents',
        engagement: 72
      },
      createdDate: '2023-06-20',
      lastUpdated: '2025-10-18'
    },
    {
      id: 'CLT-003',
      name: 'DataInsights Corp',
      portalEnabled: true,
      username: 'datainsights',
      lastLogin: '2025-10-26 11:45',
      loginCount: 234,
      activeUsers: 8,
      totalUsers: 10,
      projects: 1,
      documents: 15,
      messages: 28,
      customBranding: true,
      customDomain: 'client.datainsights.com',
      theme: 'Dark Mode',
      logo: 'DI',
      features: {
        projects: true,
        documents: true,
        messaging: true,
        analytics: true,
        invoices: true,
        timeTracking: true
      },
      permissions: {
        viewProjects: true,
        downloadDocuments: true,
        uploadDocuments: true,
        createTasks: true,
        viewTeam: true,
        viewBudget: true
      },
      analytics: {
        pageViews: 2156,
        avgSessionDuration: '12m 45s',
        topPage: 'Analytics Dashboard',
        engagement: 94
      },
      createdDate: '2024-02-10',
      lastUpdated: '2025-10-25'
    },
    {
      id: 'CLT-004',
      name: 'FitLife Health',
      portalEnabled: false,
      username: 'fitlife',
      lastLogin: '2025-10-15 16:20',
      loginCount: 45,
      activeUsers: 0,
      totalUsers: 4,
      projects: 2,
      documents: 20,
      messages: 38,
      customBranding: false,
      customDomain: null,
      theme: 'Default',
      logo: 'FH',
      features: {
        projects: true,
        documents: true,
        messaging: false,
        analytics: false,
        invoices: true,
        timeTracking: false
      },
      permissions: {
        viewProjects: true,
        downloadDocuments: true,
        uploadDocuments: false,
        createTasks: false,
        viewTeam: false,
        viewBudget: false
      },
      analytics: {
        pageViews: 312,
        avgSessionDuration: '4m 12s',
        topPage: 'Projects',
        engagement: 45
      },
      createdDate: '2023-09-05',
      lastUpdated: '2025-10-10'
    },
    {
      id: 'CLT-005',
      name: 'StartupHub Technologies',
      portalEnabled: true,
      username: 'startuphub',
      lastLogin: '2025-10-26 15:10',
      loginCount: 312,
      activeUsers: 12,
      totalUsers: 15,
      projects: 4,
      documents: 31,
      messages: 52,
      customBranding: true,
      customDomain: 'portal.startuphub.io',
      theme: 'Purple & Gold',
      logo: 'SH',
      features: {
        projects: true,
        documents: true,
        messaging: true,
        analytics: true,
        invoices: true,
        timeTracking: true
      },
      permissions: {
        viewProjects: true,
        downloadDocuments: true,
        uploadDocuments: true,
        createTasks: true,
        viewTeam: true,
        viewBudget: true
      },
      analytics: {
        pageViews: 3421,
        avgSessionDuration: '15m 28s',
        topPage: 'Projects Dashboard',
        engagement: 96
      },
      createdDate: '2024-05-12',
      lastUpdated: '2025-10-26'
    },
    {
      id: 'CLT-006',
      name: 'Enterprise Solutions Ltd',
      portalEnabled: true,
      username: 'enterprise',
      lastLogin: '2025-10-22 13:05',
      loginCount: 67,
      activeUsers: 4,
      totalUsers: 10,
      projects: 1,
      documents: 19,
      messages: 24,
      customBranding: false,
      customDomain: null,
      theme: 'Default',
      logo: 'ES',
      features: {
        projects: true,
        documents: true,
        messaging: true,
        analytics: false,
        invoices: true,
        timeTracking: false
      },
      permissions: {
        viewProjects: true,
        downloadDocuments: true,
        uploadDocuments: false,
        createTasks: false,
        viewTeam: true,
        viewBudget: false
      },
      analytics: {
        pageViews: 523,
        avgSessionDuration: '5m 47s',
        topPage: 'Documents',
        engagement: 58
      },
      createdDate: '2022-11-20',
      lastUpdated: '2025-10-15'
    }
  ];

  const filteredClients = portalClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPortals = portalClients.length;
  const activePortals = portalClients.filter(c => c.portalEnabled).length;
  const totalLogins = portalClients.reduce((sum, c) => sum + c.loginCount, 0);
  const avgEngagement = portalClients.reduce((sum, c) => sum + c.analytics.engagement, 0) / portalClients.length;

  const handleTogglePortal = (clientId: string, currentState: boolean) => {
    toast({
      title: currentState ? 'Portal Disabled' : 'Portal Enabled',
      description: `Portal access ${currentState ? 'disabled' : 'enabled'} for client ${clientId}`
    });
  };

  const handleGenerateCredentials = (clientId: string) => {
    toast({
      title: 'Credentials Generated',
      description: `New login credentials generated for ${clientId}`
    });
  };

  const handleCopyCredentials = (username: string) => {
    navigator.clipboard.writeText(username);
    toast({
      title: 'Copied',
      description: 'Username copied to clipboard'
    });
  };

  const handleSaveBranding = (clientId: string) => {
    toast({
      title: 'Branding Updated',
      description: `Portal branding saved for ${clientId}`
    });
  };

  const handleSavePermissions = (clientId: string) => {
    toast({
      title: 'Permissions Updated',
      description: `Portal permissions saved for ${clientId}`
    });
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return 'text-green-600';
    if (engagement >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Client Portal Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Configure and manage client portal access and settings
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-indigo-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Portals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {totalPortals}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {activePortals} active
                  </p>
                </div>
                <Globe className="h-10 w-10 text-indigo-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-green-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Portals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-green-600">
                    {activePortals}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {((activePortals / totalPortals) * 100).toFixed(0)}% enabled
                  </p>
                </div>
                <Check className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-blue-600">
                    {totalLogins}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All time activity
                  </p>
                </div>
                <LogIn className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-purple-600">
                    {avgEngagement.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    User engagement
                  </p>
                </div>
                <Activity className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search portals by client name, username, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="zyphex-button-primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Setup New Portal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Portal List */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-[calc(100vh-450px)]">
              <div className="space-y-4 pr-4">
                {filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    className={`zyphex-card hover-zyphex-lift cursor-pointer transition-all ${
                      selectedClient === client.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => setSelectedClient(client.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                            {client.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <CardTitle className="text-xl">{client.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                {client.id}
                              </Badge>
                              <Badge className={client.portalEnabled ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-500/10 text-gray-600 border-gray-500/20'}>
                                {client.portalEnabled ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                {client.portalEnabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                              {client.customBranding && (
                                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                  <Palette className="h-3 w-3 mr-1" />
                                  Custom Brand
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {client.activeUsers}/{client.totalUsers} users active
                              </span>
                              <span className="flex items-center gap-1">
                                <LogIn className="h-3 w-3" />
                                {client.loginCount} logins
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last: {client.lastLogin}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={client.portalEnabled}
                          onCheckedChange={() => handleTogglePortal(client.id, client.portalEnabled)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Portal Credentials */}
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold">Portal Username</Label>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCredentials(client.username);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateCredentials(client.id);
                              }}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-gray-400" />
                          <code className="text-sm font-mono">{client.username}</code>
                        </div>
                        {client.customDomain && (
                          <div className="flex items-center gap-2 mt-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-blue-600">{client.customDomain}</span>
                          </div>
                        )}
                      </div>

                      <Separator className="my-4" />

                      {/* Portal Content */}
                      <div className="mb-4">
                        <Label className="text-xs font-semibold mb-2 block">Portal Content</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                            <div className="text-lg font-bold">{client.projects}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Projects</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <FileText className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                            <div className="text-lg font-bold">{client.documents}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Documents</div>
                          </div>
                          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <div className="text-lg font-bold">{client.messages}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Messages</div>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Enabled Features */}
                      <div className="mb-4">
                        <Label className="text-xs font-semibold mb-2 block">Enabled Features</Label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(client.features).map(([feature, enabled]) => (
                            enabled && (
                              <Badge key={feature} variant="outline" className="text-xs">
                                <Check className="h-3 w-3 mr-1 text-green-600" />
                                {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Analytics Summary */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Engagement Score</span>
                          <span className={`text-lg font-bold ${getEngagementColor(client.analytics.engagement)}`}>
                            {client.analytics.engagement}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Page Views:</span>
                            <span className="font-semibold ml-1">{client.analytics.pageViews}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Avg Session:</span>
                            <span className="font-semibold ml-1">{client.analytics.avgSessionDuration}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client.id);
                          }}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveBranding(client.id);
                          }}
                        >
                          <Palette className="h-3 w-3 mr-1" />
                          Branding
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSavePermissions(client.id);
                          }}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Permissions
                        </Button>
                        <Button
                          size="sm"
                          className="zyphex-button-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`//${client.customDomain || 'portal.zyphex.com'}`, '_blank');
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Portal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredClients.length === 0 && (
                  <Card className="zyphex-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Globe className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Portals Found</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {searchTerm
                          ? 'Try adjusting your search term'
                          : 'Get started by setting up your first client portal'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar - Portal Settings & Analytics */}
          <div className="space-y-6">
            {/* Selected Portal Settings */}
            {selectedClient && (
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-500" />
                    Portal Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const client = portalClients.find(c => c.id === selectedClient);
                    if (!client) return null;

                    return (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Access Status
                          </Label>
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <span className="text-sm font-medium">Portal Access</span>
                            <Switch
                              checked={client.portalEnabled}
                              onCheckedChange={() => handleTogglePortal(client.id, client.portalEnabled)}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Features
                          </Label>
                          <div className="space-y-2">
                            {Object.entries(client.features).map(([feature, enabled]) => (
                              <div key={feature} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <span className="text-sm">
                                  {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                                </span>
                                <Switch checked={enabled} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Permissions
                          </Label>
                          <div className="space-y-2">
                            {Object.entries(client.permissions).map(([permission, enabled]) => (
                              <div key={permission} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <span className="text-sm">
                                  {permission.charAt(0).toUpperCase() + permission.slice(1).replace(/([A-Z])/g, ' $1')}
                                </span>
                                {enabled ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button className="w-full zyphex-button-primary" size="sm">
                          Save Changes
                        </Button>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Portal Usage Statistics */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Page Views
                  </span>
                  <span className="font-semibold">
                    {portalClients.reduce((sum, c) => sum + c.analytics.pageViews, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Active Users Today
                  </span>
                  <span className="font-semibold text-green-600">
                    {portalClients.reduce((sum, c) => sum + c.activeUsers, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Portals with Custom Branding
                  </span>
                  <span className="font-semibold text-purple-600">
                    {portalClients.filter(c => c.customBranding).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    High Engagement (&gt;80%)
                  </span>
                  <span className="font-semibold text-blue-600">
                    {portalClients.filter(c => c.analytics.engagement > 80).length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Portals */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Performing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {portalClients
                    .filter(c => c.portalEnabled)
                    .sort((a, b) => b.analytics.engagement - a.analytics.engagement)
                    .slice(0, 3)
                    .map((client, index) => (
                      <div key={client.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          'bg-orange-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{client.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {client.analytics.engagement}% engagement
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Enable Portals
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset All Credentials
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Analytics Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
