'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  FileText, 
  Calculator,
  Settings,
  Users,
  Target
} from 'lucide-react'
import type { BillingModel, BillingConfiguration } from '@/lib/billing/billing-engine'

// Dynamic import for heavy billing component
const BillingConfigurationComponent = dynamic(
  () => import('@/components/billing/billing-configuration'),
  {
    loading: () => <div className="flex items-center justify-center h-64">
      <div className="animate-pulse">Loading billing configuration...</div>
    </div>,
    ssr: false
  }
)

// Mock data for demonstration
const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    client: 'Acme Corp',
    status: 'ACTIVE',
    billingModel: { type: 'HOURLY' as const, hourlyRate: 150 },
    revenue: 12500,
    expenses: 2300,
    profitMargin: 81.6
  },
  {
    id: '2',
    name: 'Mobile App Development',
    client: 'TechStart Inc',
    status: 'ACTIVE',
    billingModel: { type: 'FIXED_FEE' as const, fixedAmount: 25000 },
    revenue: 15000,
    expenses: 3200,
    profitMargin: 78.7
  },
  {
    id: '3',
    name: 'Database Migration',
    client: 'Enterprise Ltd',
    status: 'COMPLETED',
    billingModel: { type: 'MILESTONE_BASED' as const },
    revenue: 8500,
    expenses: 1100,
    profitMargin: 87.1
  }
]

const mockBillingResults = [
  {
    projectId: '1',
    amount: 4500,
    currency: 'USD',
    period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
    breakdown: {
      labor: 4200,
      expenses: 200,
      tax: 420,
      discount: 0,
      total: 4500
    }
  },
  {
    projectId: '2',
    amount: 5000,
    currency: 'USD',
    period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
    breakdown: {
      labor: 4500,
      expenses: 300,
      tax: 450,
      discount: 0,
      total: 5000
    }
  }
]

export default function FinancialManagementDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showBillingConfig, setShowBillingConfig] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  // Calculate summary metrics
  const totalRevenue = mockProjects.reduce((sum, project) => sum + project.revenue, 0)
  const totalExpenses = mockProjects.reduce((sum, project) => sum + project.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const avgProfitMargin = mockProjects.reduce((sum, project) => sum + project.profitMargin, 0) / mockProjects.length

  const pendingBilling = mockBillingResults.reduce((sum, result) => sum + result.amount, 0)

  const handleBillingConfigSave = (config: { billingModel: BillingModel; configuration: BillingConfiguration }) => {
    console.log('Billing configuration saved:', config)
    setShowBillingConfig(false)
    // Here you would typically save to your backend
  }

  const generateInvoice = async (projectId: string) => {
    // Mock invoice generation
    console.log('Generating invoice for project:', projectId)
    // Here you would use the MultiBillingEngine to generate actual invoices
  }

  if (showBillingConfig) {
    return (
      <BillingConfigurationComponent
        projectId={selectedProject || ''}
        onSave={handleBillingConfigSave}
      />
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">
            Comprehensive billing and financial tracking for your projects
          </p>
        </div>
        <Button 
          onClick={() => setShowBillingConfig(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Configure Billing
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {avgProfitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Billing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingBilling.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ready to invoice
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockProjects.filter(p => p.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockProjects.length} total projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Project Performance</CardTitle>
                <CardDescription>Revenue and profit margins by project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${project.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.profitMargin.toFixed(1)}% margin
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Models Summary</CardTitle>
                <CardDescription>Distribution of billing types across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg text-center">
                      <Clock className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="font-semibold">Hourly</p>
                      <p className="text-sm text-muted-foreground">
                        {mockProjects.filter(p => p.billingModel.type === 'HOURLY').length} projects
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="font-semibold">Fixed Fee</p>
                      <p className="text-sm text-muted-foreground">
                        {mockProjects.filter(p => p.billingModel.type === 'FIXED_FEE').length} projects
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <p className="font-semibold">Milestone</p>
                      <p className="text-sm text-muted-foreground">
                        {mockProjects.filter(p => p.billingModel.type === 'MILESTONE_BASED').length} projects
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg text-center">
                      <Calculator className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                      <p className="font-semibold">Mixed</p>
                      <p className="text-sm text-muted-foreground">0 projects</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Financial Overview</CardTitle>
              <CardDescription>Detailed financial tracking for each project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProjects.map((project) => (
                  <Card key={project.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{project.name}</h4>
                            <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{project.client}</p>
                          <p className="text-sm">
                            Billing: {project.billingModel.type.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-semibold text-lg">
                            ${project.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Profit: {project.profitMargin.toFixed(1)}%
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedProject(project.id)
                                setShowBillingConfig(true)
                              }}
                            >
                              Configure
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => generateInvoice(project.id)}
                            >
                              Invoice
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Invoice Generation</CardTitle>
              <CardDescription>Manage time-based, milestone, and recurring invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Time-Based Invoices</CardTitle>
                    <CardDescription>Generate invoices from approved time entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Website Redesign</h4>
                          <p className="text-sm text-muted-foreground">45 billable hours ready</p>
                        </div>
                        <Button size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Mobile App Development</h4>
                          <p className="text-sm text-muted-foreground">32 billable hours ready</p>
                        </div>
                        <Button size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Milestone Invoices</CardTitle>
                    <CardDescription>Bill clients on milestone completion</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">Database Migration</h4>
                          <p className="text-sm text-muted-foreground">3 milestones completed</p>
                        </div>
                        <Button size="sm">
                          <Target className="h-4 w-4 mr-2" />
                          Invoice
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">API Development</h4>
                          <p className="text-sm text-muted-foreground">2 milestones completed</p>
                        </div>
                        <Button size="sm">
                          <Target className="h-4 w-4 mr-2" />
                          Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recurring Invoices</CardTitle>
                    <CardDescription>Automated retainer and subscription billing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                        <div>
                          <h4 className="font-semibold">Acme Corp Retainer</h4>
                          <p className="text-sm text-muted-foreground">Monthly - Next: Feb 1</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <div>
                          <h4 className="font-semibold">TechStart Support</h4>
                          <p className="text-sm text-muted-foreground">Quarterly - Next: Apr 15</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Multi-Currency</CardTitle>
                    <CardDescription>International client billing support</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-sm font-medium">USD → EUR</p>
                          <p className="text-lg font-bold">0.85</p>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <p className="text-sm font-medium">USD → GBP</p>
                          <p className="text-lg font-bold">0.73</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Exchange rates updated hourly</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Revenue chart would go here</p>
                  <p className="text-sm text-muted-foreground">
                    Integration with charting library needed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profitability Analysis</CardTitle>
                <CardDescription>Profit margins by project type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Profitability chart would go here</p>
                  <p className="text-sm text-muted-foreground">
                    Integration with charting library needed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}