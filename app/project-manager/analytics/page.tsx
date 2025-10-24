"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Target,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { subDays, subMonths } from "date-fns";

interface OverviewData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueProjects: number;
  productivityScore: number;
  budgetUtilization: number;
  healthScore: number;
}

interface ProjectPerformance {
  projectsByStatus: Array<{ status: string; count: number }>;
  onTimeVsDelayed: { onTime: number; delayed: number; total: number };
  budgetVariance: Array<{ projectName: string; budget: number; used: number; variance: number }>;
  completionTrend: Array<{ month: string; count: number }>;
}

interface ResourceUtilization {
  teamWorkload: Array<{
    name: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    estimatedHours: number;
    utilization: number;
  }>;
  resourceAllocation: Array<{ status: string; count: number }>;
  capacity: {
    total: number;
    utilized: number;
    utilization: number;
    available: number;
  };
}

interface TimeAnalytics {
  timeByProject: Array<{ name: string; billable: number; nonBillable: number }>;
  billableVsNonBillable: {
    billable: number;
    nonBillable: number;
    total: number;
    billablePercentage: number;
  };
  weeklyTrend: Array<{ week: string; hours: number }>;
  estimatedVsActual: Array<{ estimated: number; actual: number; variance: number }>;
}

interface FinancialAnalytics {
  revenueByProject: Array<{
    projectName: string;
    budget: number;
    used: number;
    remaining: number;
    profitMargin: number;
  }>;
  financialSummary: {
    totalBudget: number;
    totalRevenue: number;
    totalUsed: number;
    totalProfit: number;
    profitMargin: number;
    budgetComplianceRate: number;
  };
  costBreakdown: Array<{ category: string; amount: number }>;
}

interface TeamPerformance {
  teamPerformance: Array<{
    name: string;
    totalTasks: number;
    completedTasks: number;
    productivity: number;
    avgCompletionTime: number;
  }>;
  performanceTrend: Array<{ month: string; tasksCompleted: number }>;
}

interface ClientAnalytics {
  clientAnalytics: Array<{
    clientName: string;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalRevenue: number;
    satisfactionScore: number;
  }>;
  summary: {
    totalClients: number;
    repeatClientRate: number;
    averageProjectsPerClient: number;
    totalRevenue: number;
  };
  revenueDistribution: Array<{ name: string; revenue: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ProjectAnalyticsPage() {
  const [_loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [projectPerf, setProjectPerf] = useState<ProjectPerformance | null>(null);
  const [resourceUtil, setResourceUtil] = useState<ResourceUtilization | null>(null);
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics | null>(null);
  const [financial, setFinancial] = useState<FinancialAnalytics | null>(null);
  const [teamPerf, setTeamPerf] = useState<TeamPerformance | null>(null);
  const [clientAnalytics, setClientAnalytics] = useState<ClientAnalytics | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = dateRange === "all" 
        ? subMonths(endDate, 12) 
        : subDays(endDate, parseInt(dateRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const [
        overviewRes,
        projectPerfRes,
        resourceUtilRes,
        timeRes,
        financialRes,
        teamPerfRes,
        clientRes
      ] = await Promise.all([
        fetch(`/api/project-manager/analytics/overview`),
        fetch(`/api/project-manager/analytics/project-performance?${params}`),
        fetch(`/api/project-manager/analytics/resource-utilization?${params}`),
        fetch(`/api/project-manager/analytics/time-analytics?${params}`),
        fetch(`/api/project-manager/analytics/financial?${params}`),
        fetch(`/api/project-manager/analytics/team-performance?${params}`),
        fetch(`/api/project-manager/analytics/client-analytics?${params}`)
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.overview);
      }
      if (projectPerfRes.ok) setProjectPerf(await projectPerfRes.json());
      if (resourceUtilRes.ok) setResourceUtil(await resourceUtilRes.json());
      if (timeRes.ok) setTimeAnalytics(await timeRes.json());
      if (financialRes.ok) setFinancial(await financialRes.json());
      if (teamPerfRes.ok) setTeamPerf(await teamPerfRes.json());
      if (clientRes.ok) setClientAnalytics(await clientRes.json());

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const handleExport = () => {
    toast.success("Exporting analytics report...");
    // TODO: Implement CSV/PDF export
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into project performance and team productivity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="180">Last 6 months</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {overview.activeProjects} active, {overview.completedProjects} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.productivityScore}%</div>
              <p className="text-xs text-muted-foreground">
                Task completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.budgetUtilization}%</div>
              <p className="text-xs text-muted-foreground">
                {overview.overdueProjects} projects overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Project Health</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(overview.healthScore)}`}>
                {overview.healthScore}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overall health score
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Project Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {projectPerf && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Projects by Status</CardTitle>
                    <CardDescription>Current project distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={projectPerf.projectsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>On-Time vs Delayed</CardTitle>
                    <CardDescription>Project delivery performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'On Time', value: projectPerf.onTimeVsDelayed.onTime },
                            { name: 'Delayed', value: projectPerf.onTimeVsDelayed.delayed }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Variance by Project</CardTitle>
                  <CardDescription>Top 10 projects by budget usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectPerf.budgetVariance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="projectName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                      <Bar dataKey="used" fill="#10b981" name="Used" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Trend</CardTitle>
                  <CardDescription>Monthly project completion rate</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={projectPerf.completionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Projects Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Resource Utilization Tab */}
        <TabsContent value="resources" className="space-y-4">
          {resourceUtil && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Workload</CardTitle>
                    <CardDescription>Task distribution across team members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={resourceUtil.teamWorkload}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completedTasks" fill="#10b981" name="Completed" />
                        <Bar dataKey="inProgressTasks" fill="#f59e0b" name="In Progress" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resource Allocation</CardTitle>
                    <CardDescription>Tasks by status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={resourceUtil.resourceAllocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.status}: ${entry.count}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {resourceUtil.resourceAllocation.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Capacity Analysis</CardTitle>
                  <CardDescription>Team capacity vs utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Capacity</p>
                      <p className="text-2xl font-bold">{resourceUtil.capacity.total}h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Utilized</p>
                      <p className="text-2xl font-bold text-blue-600">{resourceUtil.capacity.utilized}h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Available</p>
                      <p className="text-2xl font-bold text-green-600">{resourceUtil.capacity.available}h</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Utilization Rate</p>
                      <p className="text-2xl font-bold">{resourceUtil.capacity.utilization}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Time Analytics Tab */}
        <TabsContent value="time" className="space-y-4">
          {timeAnalytics && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Time by Project</CardTitle>
                    <CardDescription>Billable vs non-billable hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeAnalytics.timeByProject}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="billable" stackId="a" fill="#10b981" name="Billable" />
                        <Bar dataKey="nonBillable" stackId="a" fill="#ef4444" name="Non-billable" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billable Hours Summary</CardTitle>
                    <CardDescription>Revenue-generating time tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Billable Hours</span>
                        <span className="text-lg font-bold text-green-600">
                          {timeAnalytics.billableVsNonBillable.billable.toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Non-billable Hours</span>
                        <span className="text-lg font-bold text-red-600">
                          {timeAnalytics.billableVsNonBillable.nonBillable.toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-sm font-medium">Billable Rate</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {timeAnalytics.billableVsNonBillable.billablePercentage}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Time Trend</CardTitle>
                  <CardDescription>Hours logged per week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeAnalytics.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="hours" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Financial Analytics Tab */}
        <TabsContent value="financial" className="space-y-4">
          {financial && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${financial.financialSummary.totalBudget.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${financial.financialSummary.totalRevenue.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Profit Margin</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {financial.financialSummary.profitMargin}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Project</CardTitle>
                    <CardDescription>Top 10 revenue-generating projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={financial.revenueByProject}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="projectName" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="used" fill="#10b981" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Breakdown</CardTitle>
                    <CardDescription>Expense distribution by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={financial.costBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                          label
                        >
                          {financial.costBreakdown.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Budget Compliance</CardTitle>
                  <CardDescription>Projects within budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-center text-blue-600">
                    {financial.financialSummary.budgetComplianceRate}%
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    of projects are within allocated budget
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-4">
          {teamPerf && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Team Member Productivity</CardTitle>
                  <CardDescription>Individual performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={teamPerf.teamPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="completedTasks" fill="#10b981" name="Completed Tasks" />
                      <Bar yAxisId="right" dataKey="productivity" fill="#3b82f6" name="Productivity %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Trend</CardTitle>
                  <CardDescription>Team productivity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={teamPerf.performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="tasksCompleted" stroke="#3b82f6" strokeWidth={2} name="Tasks Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Client Analytics Tab */}
        <TabsContent value="clients" className="space-y-4">
          {clientAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Clients</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{clientAnalytics.summary.totalClients}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Repeat Client Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {clientAnalytics.summary.repeatClientRate}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Avg Projects/Client</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {clientAnalytics.summary.averageProjectsPerClient}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${clientAnalytics.summary.totalRevenue.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Clients by Revenue</CardTitle>
                  <CardDescription>Revenue distribution across clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientAnalytics.revenueDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client Portfolio Overview</CardTitle>
                  <CardDescription>Detailed client metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientAnalytics.clientAnalytics.map((client, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <p className="font-medium">{client.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.totalProjects} projects • {client.activeProjects} active
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">
                            ${client.totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Satisfaction: {client.satisfactionScore}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Build and schedule automated reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-12">
                <Filter className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Custom Reports Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Build custom analytics reports with your preferred metrics and time ranges
                </p>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Export Current View
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}