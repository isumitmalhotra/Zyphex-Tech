'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Clock,
  Target,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Send,
  Trash2,
  Eye,
  Settings,
  Play,
  Pause,
  FileBarChart,
  ChevronRight
} from 'lucide-react'

// Report categories and types
const REPORT_CATEGORIES = {
  PROJECTS: {
    label: 'Projects',
    icon: Target,
    color: 'bg-blue-500',
    types: [
      { value: 'PROJECT_STATUS', label: 'Project Status Summary', description: 'Overview of all projects with status, progress, and budget' },
      { value: 'PROJECT_TIMELINE', label: 'Project Timeline', description: 'Milestones and phases for specific projects' },
      { value: 'TASK_COMPLETION', label: 'Task Completion', description: 'Task completion rates and statistics' },
      { value: 'RESOURCE_ALLOCATION', label: 'Resource Allocation', description: 'Team member allocation across projects' },
      { value: 'RISK_ASSESSMENT', label: 'Risk Assessment', description: 'Project risks and mitigation status' }
    ]
  },
  FINANCIAL: {
    label: 'Financial',
    icon: DollarSign,
    color: 'bg-green-500',
    types: [
      { value: 'REVENUE_BY_PROJECT', label: 'Revenue by Project', description: 'Revenue breakdown by project and client' },
      { value: 'PROFITABILITY_ANALYSIS', label: 'Profitability Analysis', description: 'Profit margins and cost analysis' },
      { value: 'BUDGET_VS_ACTUAL', label: 'Budget vs Actual', description: 'Budget comparison with actual spending' },
      { value: 'INVOICE_STATUS', label: 'Invoice Status', description: 'Invoice payment status and aging' },
      { value: 'PAYMENT_COLLECTION', label: 'Payment Collection', description: 'Payment collection performance' }
    ]
  },
  TEAM: {
    label: 'Team',
    icon: Users,
    color: 'bg-purple-500',
    types: [
      { value: 'TEAM_PRODUCTIVITY', label: 'Team Productivity', description: 'Team output and billable hours' },
      { value: 'INDIVIDUAL_PERFORMANCE', label: 'Individual Performance', description: 'Individual team member metrics' },
      { value: 'TIME_TRACKING', label: 'Time Tracking Summary', description: 'Time entry summaries and analysis' },
      { value: 'WORKLOAD_DISTRIBUTION', label: 'Workload Distribution', description: 'Task distribution across team' },
      { value: 'SKILL_UTILIZATION', label: 'Skill Utilization', description: 'How team skills are being used' }
    ]
  },
  CLIENTS: {
    label: 'Clients',
    icon: BarChart3,
    color: 'bg-orange-500',
    types: [
      { value: 'CLIENT_SATISFACTION', label: 'Client Satisfaction', description: 'Client feedback and ratings' },
      { value: 'PROJECT_DELIVERABLES', label: 'Project Deliverables', description: 'Deliverable completion status' },
      { value: 'COMMUNICATION_LOGS', label: 'Communication Logs', description: 'Client communication history' },
      { value: 'SERVICE_LEVEL', label: 'Service Level Reports', description: 'SLA compliance and performance' }
    ]
  },
  TIME: {
    label: 'Time',
    icon: Clock,
    color: 'bg-cyan-500',
    types: [
      { value: 'TIME_TRACKING', label: 'Time Tracking', description: 'Detailed time entry analysis' }
    ]
  }
}

const REPORT_FORMATS = [
  { value: 'PDF', label: 'PDF', icon: FileText },
  { value: 'EXCEL', label: 'Excel', icon: FileBarChart },
  { value: 'CSV', label: 'CSV', icon: FileText },
  { value: 'JSON', label: 'JSON', icon: FileText }
]

const FREQUENCIES = [
  { value: 'ONCE', label: 'Once' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' }
]

interface Report {
  id: string
  name: string
  description?: string
  category: string
  type: string
  status: string
  generatedAt?: Date
  downloadCount: number
  pdfUrl?: string
  excelUrl?: string
  csvUrl?: string
}

interface Schedule {
  id: string
  name: string
  description?: string
  frequency: string
  format: string
  recipients: string[]
  isActive: boolean
  nextRunAt?: Date
  lastRunAt?: Date
  lastStatus?: string
  template: {
    name: string
    type: string
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [reportSearch, setReportSearch] = useState('')
  const [reportCategoryFilter, setReportCategoryFilter] = useState('ALL')
  
  // Schedules state
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [scheduleSearch, setScheduleSearch] = useState('')
  
  // Create report dialog
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  
  // Schedule dialog
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleDescription, setScheduleDescription] = useState('')
  const [scheduleFrequency, setScheduleFrequency] = useState('WEEKLY')
  const [scheduleFormat, setScheduleFormat] = useState('PDF')
  const [scheduleRecipients, setScheduleRecipients] = useState('')

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'PROJECT_MANAGER' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Fetch reports
  useEffect(() => {
    if (session?.user) {
      fetchReports()
      fetchSchedules()
    }
  }, [session])

  // Filter reports
  useEffect(() => {
    let filtered = reports

    if (reportSearch) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
        r.description?.toLowerCase().includes(reportSearch.toLowerCase())
      )
    }

    if (reportCategoryFilter !== 'ALL') {
      filtered = filtered.filter(r => r.category === reportCategoryFilter)
    }

    setFilteredReports(filtered)
  }, [reports, reportSearch, reportCategoryFilter])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/reports/schedule')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const handleGenerateReport = async () => {
    if (!reportName || !selectedType) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          type: selectedType,
          config: {
            filters: [],
            dateRange: dateRange.start && dateRange.end ? {
              start: dateRange.start,
              end: dateRange.end
            } : undefined
          }
        })
      })

      if (response.ok) {
        toast.success('Report generated successfully!')
        setIsCreateReportOpen(false)
        resetCreateForm()
        fetchReports()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to generate report')
      }
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!scheduleName || !selectedType || !scheduleRecipients) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const recipients = scheduleRecipients.split(',').map(email => email.trim())
      
      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scheduleName,
          description: scheduleDescription,
          templateId: 'default', // Would need to select actual template
          frequency: scheduleFrequency,
          format: scheduleFormat,
          recipients,
          config: {
            filters: []
          }
        })
      })

      if (response.ok) {
        toast.success('Schedule created successfully!')
        setIsScheduleOpen(false)
        resetScheduleForm()
        fetchSchedules()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to create schedule')
      }
    } catch (error) {
      toast.error('Failed to create schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = async (reportId: string, format: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/export?format=${format}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportId}.${format.toLowerCase()}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Report downloaded successfully!')
      } else {
        toast.error('Failed to download report')
      }
    } catch (error) {
      toast.error('Failed to download report')
    }
  }

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/reports/schedule?id=${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        toast.success(`Schedule ${!isActive ? 'activated' : 'deactivated'}`)
        fetchSchedules()
      } else {
        toast.error('Failed to update schedule')
      }
    } catch (error) {
      toast.error('Failed to update schedule')
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const response = await fetch(`/api/reports/schedule?id=${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Schedule deleted successfully!')
        fetchSchedules()
      } else {
        toast.error('Failed to delete schedule')
      }
    } catch (error) {
      toast.error('Failed to delete schedule')
    }
  }

  const resetCreateForm = () => {
    setReportName('')
    setReportDescription('')
    setSelectedCategory('')
    setSelectedType('')
    setDateRange({ start: '', end: '' })
  }

  const resetScheduleForm = () => {
    setScheduleName('')
    setScheduleDescription('')
    setScheduleFrequency('WEEKLY')
    setScheduleFormat('PDF')
    setScheduleRecipients('')
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500'
      case 'GENERATING': return 'bg-blue-500'
      case 'FAILED': return 'bg-red-500'
      case 'SCHEDULED': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate insights from your project data
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchReports()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Calendar className="h-4 w-4 mr-2" />
            Schedules
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Generated reports
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {schedules.filter(s => s.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled reports
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.reduce((sum, r) => sum + r.downloadCount, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total downloads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reports.filter(r => 
                    r.generatedAt && new Date(r.generatedAt).getMonth() === new Date().getMonth()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Reports generated
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common reporting tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsCreateReportOpen(true)}
              >
                <Plus className="h-6 w-6" />
                <span>Generate New Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => setIsScheduleOpen(true)}
              >
                <Calendar className="h-6 w-6" />
                <span>Schedule Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2"
                onClick={() => setActiveTab('templates')}
              >
                <FileText className="h-6 w-6" />
                <span>Browse Templates</span>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.slice(0, 5).map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{report.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {report.description || report.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant="outline">{report.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReport(report.id, 'PDF')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports generated yet</p>
                    <Button
                      variant="link"
                      onClick={() => setIsCreateReportOpen(true)}
                      className="mt-2"
                    >
                      Generate your first report
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Choose from pre-built report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(REPORT_CATEGORIES).map(([key, category]) => {
                  const Icon = category.icon
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`${category.color} p-2 rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">{category.label}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-12">
                        {category.types.map(type => (
                          <Card
                            key={type.value}
                            className="cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => {
                              setSelectedCategory(key)
                              setSelectedType(type.value)
                              setIsCreateReportOpen(true)
                            }}
                          >
                            <CardHeader className="p-4">
                              <CardTitle className="text-sm font-medium flex items-center justify-between">
                                {type.label}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {type.description}
                              </CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>All generated reports</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={reportCategoryFilter} onValueChange={setReportCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      <SelectItem value="PROJECTS">Projects</SelectItem>
                      <SelectItem value="FINANCIAL">Financial</SelectItem>
                      <SelectItem value="TEAM">Team</SelectItem>
                      <SelectItem value="CLIENTS">Clients</SelectItem>
                      <SelectItem value="TIME">Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredReports.map(report => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{report.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : 'Not generated'}
                          </span>
                          <Badge variant="outline" className="text-xs">{report.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {report.downloadCount} downloads
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReport(report.id, 'PDF')}
                        title="Download PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReport(report.id, 'EXCEL')}
                        title="Download Excel"
                      >
                        <FileBarChart className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReport(report.id, 'CSV')}
                        title="Download CSV"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredReports.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Scheduled Reports</CardTitle>
                  <CardDescription>Automated report generation and delivery</CardDescription>
                </div>
                <Button onClick={() => setIsScheduleOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-2 h-2 rounded-full ${schedule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{schedule.name}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {schedule.frequency}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {schedule.format}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {schedule.recipients.length} recipients
                          </span>
                          {schedule.nextRunAt && (
                            <span className="text-xs text-muted-foreground">
                              Next: {new Date(schedule.nextRunAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleSchedule(schedule.id, schedule.isActive)}
                        title={schedule.isActive ? 'Pause' : 'Activate'}
                      >
                        {schedule.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {schedules.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No scheduled reports</p>
                    <Button
                      variant="link"
                      onClick={() => setIsScheduleOpen(true)}
                      className="mt-2"
                    >
                      Create your first schedule
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Configure and generate a new report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reportName">Report Name *</Label>
              <Input
                id="reportName"
                placeholder="e.g., Monthly Project Status"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportDescription">Description</Label>
              <Input
                id="reportDescription"
                placeholder="Optional description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label htmlFor="type">Report Type *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_CATEGORIES[selectedCategory as keyof typeof REPORT_CATEGORIES]?.types.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreateReportOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Set up automated report generation and delivery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleName">Schedule Name *</Label>
              <Input
                id="scheduleName"
                placeholder="e.g., Weekly Team Report"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleDescription">Description</Label>
              <Input
                id="scheduleDescription"
                placeholder="Optional description"
                value={scheduleDescription}
                onChange={(e) => setScheduleDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleCategory">Category *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <div className="space-y-2">
                <Label htmlFor="scheduleType">Report Type *</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_CATEGORIES[selectedCategory as keyof typeof REPORT_CATEGORIES]?.types.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format *</Label>
                <Select value={scheduleFormat} onValueChange={setScheduleFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_FORMATS.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients (comma-separated emails) *</Label>
              <Input
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                value={scheduleRecipients}
                onChange={(e) => setScheduleRecipients(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}