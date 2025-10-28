"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  ArrowUpRight,
  Activity,
  RefreshCw
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { StatsGridSkeleton } from "@/components/skeletons/stats-skeleton"

interface OverviewMetrics {
  totalRevenue: number
  activeProjects: number
  totalUsers: number
  activeNow: number
}

interface Project {
  id: string
  status: string
  budget: number | null
}

interface User {
  id: string
  lastActive: string | null
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalRevenue: 0,
    activeProjects: 0,
    totalUsers: 0,
    activeNow: 0
  })

  // Fetch overview data from database
  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      
      // Fetch multiple endpoints in parallel
      const [projectsRes, usersRes, clientsRes] = await Promise.all([
        fetch('/api/admin/projects'),
        fetch('/api/admin/users'),
        fetch('/api/admin/clients')
      ])

      if (!projectsRes.ok || !usersRes.ok || !clientsRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [projects, users] = await Promise.all([
        projectsRes.json(),
        usersRes.json(),
        clientsRes.json()
      ])

      // Calculate metrics from real data
      const totalRevenue = projects.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0)
      const activeProjects = projects.filter((p: Project) =>
        ['IN_PROGRESS', 'ACTIVE'].includes(p.status)
      ).length
      const totalUsers = users.length
      const activeNow = users.filter((u: User) => {
        if (!u.lastActive) return false
        const lastActive = new Date(u.lastActive)
        const now = new Date()
        const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60)
        return diffMinutes < 30 // Active in last 30 minutes
      }).length

      setMetrics({
        totalRevenue,
        activeProjects,
        totalUsers,
        activeNow
      })
      
      toast.success('Analytics data loaded successfully')
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverviewData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    fetchOverviewData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatCurrency = (amount: number): string => {
    return `$${(amount / 1000).toFixed(1)}k`
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <StatsGridSkeleton count={4} />
          <div className="h-96 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
        <Button variant="outline" size="icon" onClick={fetchOverviewData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">From all projects</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeProjects}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Currently in progress</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalUsers}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Registered users</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeNow}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Online in last 30 min</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue from all projects</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Chart integration available</p>
                    <p className="text-xs mt-1">Connect to Google Analytics for detailed charts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">New project created</p>
                      <p className="text-sm text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">New user registered</p>
                      <p className="text-sm text-muted-foreground">4 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Invoice paid</p>
                      <p className="text-sm text-muted-foreground">6 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">Project milestone reached</p>
                      <p className="text-sm text-muted-foreground">8 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">System update completed</p>
                      <p className="text-sm text-muted-foreground">12 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analytics</CardTitle>
              <CardDescription>Website traffic and user behavior metrics (Google Analytics)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Traffic analytics available via Google Analytics integration</p>
                  <p className="text-xs mt-1">Configure GA4 credentials to view real traffic data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Metrics</CardTitle>
              <CardDescription>Track conversion rates and goals from CRM data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Conversion tracking data will display here</p>
                  <p className="text-xs mt-1">Lead and deal conversion metrics from database</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System and application performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Performance metrics will be displayed here</p>
                  <p className="text-xs mt-1">Server, database, and page load performance tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
