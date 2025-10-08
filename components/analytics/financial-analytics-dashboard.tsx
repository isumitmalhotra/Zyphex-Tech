'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  PieChart, 
  BarChart3,
  Calendar,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Activity,
  CreditCard,
  FileText,
  Download
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProfitabilityMetrics {
  projectId: string;
  projectName?: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  costBreakdown: {
    laborCosts: number;
    expenses: number;
    overhead: number;
    materials: number;
  };
  timeBreakdown: {
    totalHours: number;
    billableHours: number;
    utilizationRate: number;
  };
}

interface ClientLifetimeValue {
  clientId: string;
  clientName?: string;
  totalRevenue: number;
  totalProjects: number;
  averageProjectValue: number;
  retentionRate: number;
  profitMargin: number;
  projectedLTV: number;
  riskScore: number;
  paymentHistory: {
    averagePaymentTime: number;
    onTimePaymentRate: number;
    totalPayments: number;
  };
}

interface RevenueProjection {
  period: string;
  projectedRevenue: number;
  confirmedRevenue: number;
  pipelineRevenue: number;
  recurringRevenue: number;
  confidence: number;
}

interface CashFlowAnalysis {
  period: string;
  cashInflow: number;
  cashOutflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
  burnRate: number;
  runwayMonths: number;
}

export default function FinancialAnalyticsDashboard() {
  const [_loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6m');
  const [selectedProject, setSelectedProject] = useState('all');
  
  // Mock data - replace with actual API calls
  const [dashboardData, _setDashboardData] = useState({
    overview: {
      totalRevenue: 285000,
      totalProfit: 95000,
      averageProfitMargin: 33.3,
      activeProjects: 12,
      activeClients: 8
    },
    projectProfitability: [
      {
        projectId: 'proj-1',
        projectName: 'E-commerce Platform',
        totalRevenue: 45000,
        totalCosts: 28000,
        netProfit: 17000,
        profitMargin: 37.8,
        costBreakdown: {
          laborCosts: 22000,
          expenses: 3000,
          overhead: 2500,
          materials: 500
        },
        timeBreakdown: {
          totalHours: 320,
          billableHours: 280,
          utilizationRate: 87.5
        }
      },
      {
        projectId: 'proj-2',
        projectName: 'Mobile App Development',
        totalRevenue: 32000,
        totalCosts: 21000,
        netProfit: 11000,
        profitMargin: 34.4,
        costBreakdown: {
          laborCosts: 18000,
          expenses: 1500,
          overhead: 1200,
          materials: 300
        },
        timeBreakdown: {
          totalHours: 240,
          billableHours: 220,
          utilizationRate: 91.7
        }
      }
    ] as ProfitabilityMetrics[],
    clientLTV: [
      {
        clientId: 'client-1',
        clientName: 'Acme Corporation',
        totalRevenue: 125000,
        totalProjects: 5,
        averageProjectValue: 25000,
        retentionRate: 85,
        profitMargin: 32,
        projectedLTV: 180000,
        riskScore: 15,
        paymentHistory: {
          averagePaymentTime: 18,
          onTimePaymentRate: 95,
          totalPayments: 12
        }
      },
      {
        clientId: 'client-2',
        clientName: 'Tech Solutions Inc',
        totalRevenue: 85000,
        totalProjects: 3,
        averageProjectValue: 28333,
        retentionRate: 75,
        profitMargin: 28,
        projectedLTV: 140000,
        riskScore: 25,
        paymentHistory: {
          averagePaymentTime: 25,
          onTimePaymentRate: 88,
          totalPayments: 8
        }
      }
    ] as ClientLifetimeValue[],
    revenueForecasting: [
      { period: '2024-01', projectedRevenue: 42000, confirmedRevenue: 38000, pipelineRevenue: 25000, recurringRevenue: 15000, confidence: 85 },
      { period: '2024-02', projectedRevenue: 45000, confirmedRevenue: 35000, pipelineRevenue: 30000, recurringRevenue: 15000, confidence: 78 },
      { period: '2024-03', projectedRevenue: 48000, confirmedRevenue: 32000, pipelineRevenue: 35000, recurringRevenue: 15000, confidence: 72 },
      { period: '2024-04', projectedRevenue: 52000, confirmedRevenue: 28000, pipelineRevenue: 40000, recurringRevenue: 18000, confidence: 65 },
      { period: '2024-05', projectedRevenue: 55000, confirmedRevenue: 25000, pipelineRevenue: 45000, recurringRevenue: 18000, confidence: 58 },
      { period: '2024-06', projectedRevenue: 58000, confirmedRevenue: 22000, pipelineRevenue: 50000, recurringRevenue: 20000, confidence: 52 }
    ] as RevenueProjection[],
    cashFlowAnalysis: [
      { period: '2024-01', cashInflow: 42000, cashOutflow: 28000, netCashFlow: 14000, cumulativeCashFlow: 75000, burnRate: 28000, runwayMonths: 2.7 },
      { period: '2024-02', cashInflow: 45000, cashOutflow: 30000, netCashFlow: 15000, cumulativeCashFlow: 90000, burnRate: 30000, runwayMonths: 3.0 },
      { period: '2024-03', cashInflow: 48000, cashOutflow: 32000, netCashFlow: 16000, cumulativeCashFlow: 106000, burnRate: 32000, runwayMonths: 3.3 },
      { period: '2024-04', cashInflow: 52000, cashOutflow: 34000, netCashFlow: 18000, cumulativeCashFlow: 124000, burnRate: 34000, runwayMonths: 3.6 },
      { period: '2024-05', cashInflow: 55000, cashOutflow: 36000, netCashFlow: 19000, cumulativeCashFlow: 143000, burnRate: 36000, runwayMonths: 4.0 },
      { period: '2024-06', cashInflow: 58000, cashOutflow: 38000, netCashFlow: 20000, cumulativeCashFlow: 163000, burnRate: 38000, runwayMonths: 4.3 }
    ] as CashFlowAnalysis[]
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Mock API call - replace with actual implementation
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        // Failed to load dashboard data - handle silently or show user notification
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedTimeframe, selectedProject]);

  const exportData = (format: 'csv' | 'pdf') => {
    // Implementation for data export
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getRiskBadge = (riskScore: number) => {
    if (riskScore <= 30) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Low Risk</Badge>;
    } else if (riskScore <= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />High Risk</Badge>;
    }
  };

  const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#c3dafe'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Analytics</h1>
          <p className="text-gray-600">Comprehensive financial insights and profitability analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="proj-1">E-commerce Platform</SelectItem>
              <SelectItem value="proj-2">Mobile App Development</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportData('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button variant="outline" onClick={() => exportData('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.overview.totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(dashboardData.overview.averageProfitMargin)}</div>
            <p className="text-xs text-muted-foreground">
              Above industry average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Across {dashboardData.overview.activeClients} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              +2 new this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profitability" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profitability">Project Profitability</TabsTrigger>
          <TabsTrigger value="client-ltv">Client Lifetime Value</TabsTrigger>
          <TabsTrigger value="forecasting">Revenue Forecasting</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow Analysis</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Profitability Overview</CardTitle>
                <CardDescription>Revenue, costs, and profit margins by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.projectProfitability.map((project, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{project.projectName}</h4>
                          <p className="text-sm text-gray-600">Project ID: {project.projectId}</p>
                        </div>
                        <Badge variant={project.profitMargin > 30 ? 'default' : 'secondary'}>
                          {formatPercentage(project.profitMargin)} margin
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Revenue</p>
                          <p className="font-semibold text-green-600">{formatCurrency(project.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Costs</p>
                          <p className="font-semibold text-red-600">{formatCurrency(project.totalCosts)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Net Profit</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(project.netProfit)}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Utilization: {formatPercentage(project.timeBreakdown.utilizationRate)}</span>
                          <span>Hours: {project.timeBreakdown.billableHours}/{project.timeBreakdown.totalHours}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown Analysis</CardTitle>
                <CardDescription>Detailed cost structure across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'Labor Costs', value: 40000, color: COLORS[0] },
                        { name: 'Expenses', value: 4500, color: COLORS[1] },
                        { name: 'Overhead', value: 3700, color: COLORS[2] },
                        { name: 'Materials', value: 800, color: COLORS[3] }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      fill="#8884d8"
                    >
                      {[
                        { name: 'Labor Costs', value: 40000 },
                        { name: 'Expenses', value: 4500 },
                        { name: 'Overhead', value: 3700 },
                        { name: 'Materials', value: 800 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="client-ltv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Lifetime Value Analysis</CardTitle>
              <CardDescription>Comprehensive client value metrics and risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.clientLTV.map((client, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium">{client.clientName}</h4>
                        <p className="text-sm text-gray-600">{client.totalProjects} projects • {client.paymentHistory.totalPayments} payments</p>
                      </div>
                      <div className="flex space-x-2">
                        {getRiskBadge(client.riskScore)}
                        <Badge variant="outline">
                          {formatPercentage(client.retentionRate)} retention
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <p className="font-semibold text-lg">{formatCurrency(client.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Projected LTV</p>
                        <p className="font-semibold text-lg text-green-600">{formatCurrency(client.projectedLTV)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg Project Value</p>
                        <p className="font-semibold text-lg">{formatCurrency(client.averageProjectValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Profit Margin</p>
                        <p className="font-semibold text-lg">{formatPercentage(client.profitMargin)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 pt-3 border-t">
                      <span>Avg Payment Time: {client.paymentHistory.averagePaymentTime} days</span>
                      <span>On-Time Rate: {formatPercentage(client.paymentHistory.onTimePaymentRate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecasting</CardTitle>
                <CardDescription>6-month revenue projection with confidence intervals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dashboardData.revenueForecasting}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="confirmedRevenue"
                      stackId="1"
                      stroke="#10b981"
                      fill="#10b981"
                      name="Confirmed Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="pipelineRevenue"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Pipeline Revenue"
                    />
                    <Area
                      type="monotone"
                      dataKey="recurringRevenue"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      name="Recurring Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast Confidence</CardTitle>
                <CardDescription>Confidence levels for revenue projections</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.revenueForecasting}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      name="Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trends</CardTitle>
                <CardDescription>Monthly cash inflow vs outflow analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.cashFlowAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis tickFormatter={(value) => `$${value / 1000}K`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="cashInflow" fill="#10b981" name="Cash Inflow" />
                    <Bar dataKey="cashOutflow" fill="#ef4444" name="Cash Outflow" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Runway Analysis</CardTitle>
                <CardDescription>Cash runway and burn rate trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.cashFlowAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="runwayMonths"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Runway (Months)"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeCashFlow"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Cumulative Cash Flow ($K)"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Summary</CardTitle>
              <CardDescription>Key cash flow metrics and projections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Current Runway</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">4.3 months</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Monthly Burn Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">$38K</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Cash Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">$163K</p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Break-even</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">Q2 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={[
                        { name: 'Software & Tools', value: 8500 },
                        { name: 'Travel & Meetings', value: 3200 },
                        { name: 'Office Supplies', value: 1800 },
                        { name: 'Marketing', value: 2500 },
                        { name: 'Professional Services', value: 4200 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                    >
                      {[
                        { name: 'Software & Tools', value: 8500 },
                        { name: 'Travel & Meetings', value: 3200 },
                        { name: 'Office Supplies', value: 1800 },
                        { name: 'Marketing', value: 2500 },
                        { name: 'Professional Services', value: 4200 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trends</CardTitle>
                <CardDescription>Expense patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: 'Jan', amount: 18500, change: 5.2 },
                      { month: 'Feb', amount: 19200, change: 3.8 },
                      { month: 'Mar', amount: 17800, change: -7.3 },
                      { month: 'Apr', amount: 20100, change: 12.9 },
                      { month: 'May', amount: 19600, change: -2.5 },
                      { month: 'Jun', amount: 21300, change: 8.7 }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value: number) => `$${value / 1000}K`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#ef4444"
                      strokeWidth={3}
                      name="Monthly Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>Key expense metrics and reimbursement status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Total Expenses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">$120,200</p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Pending Reimbursement</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">$8,450</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Avg Per Project</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">$10,017</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Expense Ratio</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">42.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}