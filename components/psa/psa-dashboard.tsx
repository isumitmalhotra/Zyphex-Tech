import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { DashboardMetrics, Alert, ProjectHealthMetrics, ResourceMetrics, FinancialMetrics, ClientSatisfactionMetrics, CapacityWarning, OutstandingInvoice } from '@/lib/psa/types';

interface PSADashboardProps {
  userId?: string;
  _role?: string; // Prefixed with _ to indicate intentionally unused
}

export function PSADashboard({ userId, _role }: PSADashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/psa/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMetrics = async () => {
    try {
      const response = await fetch('/api/psa/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh-metrics' })
      });
      
      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No dashboard data available</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PSA Dashboard</h1>
          <p className="text-gray-500">Professional Services Automation</p>
        </div>
        <Button onClick={refreshMetrics} variant="outline">
          Refresh Metrics
        </Button>
      </div>

      {/* Alerts Section */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-800">Active Alerts</h3>
          </div>
          <div className="space-y-2">
            {dashboardData.alerts.slice(0, 3).map((alert: Alert, index: number) => (
              <div key={index} className="text-sm text-yellow-700">
                {alert.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Project Health</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={dashboardData.financialSummary?.totalRevenue || 0}
              format="currency"
              trend={12.5}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <MetricCard
              title="Active Projects"
              value={1} // Since projectHealth is a single object, not an array
              trend={8.2}
              icon={<CheckCircle className="h-4 w-4" />}
            />
            <MetricCard
              title="Resource Utilization"
              value={dashboardData.resourceMetrics?.utilizationRate || 0}
              format="percentage"
              trend={-2.1}
              icon={<Users className="h-4 w-4" />}
            />
            <MetricCard
              title="Client Satisfaction"
              value={dashboardData.clientSatisfaction?.overallScore || 0}
              format="score"
              trend={5.8}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectHealthOverview projects={dashboardData.projectHealth ? [dashboardData.projectHealth] : []} />
            <ResourceUtilizationChart data={dashboardData.resourceMetrics} />
          </div>
        </TabsContent>

        {/* Project Health Tab */}
        <TabsContent value="projects" className="space-y-6">
          <ProjectHealthDashboard projects={dashboardData.projectHealth ? [dashboardData.projectHealth] : []} />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <ResourceDashboard data={dashboardData.resourceMetrics} />
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <FinancialDashboard data={dashboardData.financialSummary} />
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <ClientDashboard data={dashboardData.clientSatisfaction} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'number' | 'currency' | 'percentage' | 'score';
  trend?: number;
  icon?: React.ReactNode;
}

// Metric Card Component
function MetricCard({ title, value, format = 'number', trend, icon }: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'score':
        return `${val.toFixed(1)}/10`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {trend && (
          <p className={`text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Project Health Overview Component
function ProjectHealthOverview({ projects }: { projects: ProjectHealthMetrics[] }) {
  const healthCounts = projects.reduce((acc: Record<string, number>, project) => {
    const status = project.status || 'UNKNOWN';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Health Overview</CardTitle>
        <CardDescription>Current status of all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(healthCounts).map(([status, count]: [string, number]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center">
                <Badge variant={getStatusVariant(status)} className="mr-2">
                  {status}
                </Badge>
                <span className="text-sm">{count} projects</span>
              </div>
              <Progress value={(count / projects.length) * 100} className="w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Resource Utilization Chart Component
function ResourceUtilizationChart({ data }: { data: ResourceMetrics | null }) {
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Utilization</CardTitle>
        <CardDescription>Current team capacity and utilization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Utilization</span>
            <span className="text-sm text-gray-500">{data.utilizationRate?.toFixed(1)}%</span>
          </div>
          <Progress value={data.utilizationRate || 0} />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Billable Hours</p>
              <p className="text-2xl font-bold">{data.billableHours || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Hours</p>
              <p className="text-2xl font-bold">{data.availableHours || 0}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Project Health Dashboard
function ProjectHealthDashboard({ projects }: { projects: ProjectHealthMetrics[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.projectId}>
            <CardHeader>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <Badge variant={getStatusVariant(project.status)}>
                {project.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Completion</span>
                    <span>{project.completionPercentage?.toFixed(1)}%</span>
                  </div>
                  <Progress value={project.completionPercentage || 0} />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Budget Used</span>
                    <span>{project.budgetUtilization?.toFixed(1)}%</span>
                  </div>
                  <Progress value={project.budgetUtilization || 0} />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Health Score</span>
                  <span className="font-semibold">{project.healthScore}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Resource Dashboard
function ResourceDashboard({ data }: { data: ResourceMetrics | null }) {
  if (!data) return <div>No resource data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Capacity"
          value={data.totalCapacity || 0}
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="Utilized Capacity"
          value={data.utilizedCapacity || 0}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="Utilization Rate"
          value={data.utilizationRate || 0}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>
      
      {/* Capacity Warnings */}
      {data.capacityWarnings && data.capacityWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Capacity Warnings</CardTitle>
            <CardDescription>Resources approaching or exceeding capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.capacityWarnings.map((warning: CapacityWarning, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">{warning.resourceName}</p>
                    <p className="text-sm text-gray-500">
                      {warning.currentUtilization}% utilized
                    </p>
                  </div>
                  <Badge variant="destructive">
                    Overloaded
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Financial Dashboard
function FinancialDashboard({ data }: { data: FinancialMetrics | null }) {
  if (!data) return <div>No financial data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={data.totalRevenue || 0}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          title="Gross Profit"
          value={data.grossProfit || 0}
          format="currency"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Profit Margin"
          value={data.profitMargin || 0}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value={data.monthlyRecurringRevenue || 0}
          format="currency"
          icon={<DollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Outstanding Invoices */}
      {data.outstandingInvoices && data.outstandingInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Invoices</CardTitle>
            <CardDescription>Invoices pending payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.outstandingInvoices.slice(0, 5).map((invoice: OutstandingInvoice) => (
                <div key={invoice.invoiceId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.clientName}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}
                    </p>
                    {invoice.daysOverdue > 0 && (
                      <Badge variant="destructive">
                        {invoice.daysOverdue} days overdue
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Client Dashboard
function ClientDashboard({ data }: { data: ClientSatisfactionMetrics | null }) {
  if (!data) return <div>No client data available</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Overall Score"
          value={data.overallScore || 0}
          format="score"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricCard
          title="NPS Score"
          value={data.npsScore || 0}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <MetricCard
          title="Response Rate"
          value={data.responseRate || 0}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricCard
          title="Feedback Count"
          value={data.feedbackCount || 0}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      {/* Recent Feedback */}
      {data.recentFeedback && data.recentFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Client Feedback</CardTitle>
            <CardDescription>Latest satisfaction scores and comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentFeedback.slice(0, 5).map((feedback, index: number) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{feedback.clientName}</p>
                    <Badge variant={feedback.score >= 8 ? 'default' : feedback.score >= 6 ? 'secondary' : 'destructive'}>
                      {feedback.score}/10
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{feedback.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(feedback.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to get badge variant based on status
function getStatusVariant(status: string) {
  switch (status?.toLowerCase()) {
    case 'healthy':
    case 'completed':
      return 'default';
    case 'warning':
    case 'in_progress':
      return 'secondary';
    case 'critical':
    case 'at_risk':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default PSADashboard;