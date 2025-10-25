'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  FileText,
  Calendar,
  Download,
  Mail,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Plus,
  Search,
  Filter,
  Settings,
  Eye,
  RefreshCw,
} from 'lucide-react'
// Dynamic imports for client-only libraries to prevent SSR issues
// import jsPDF from 'jspdf'
// import html2canvas from 'html2canvas'

interface ReportTemplate {
  id: string
  name: string
  type: string
  description: string
  sections: string[]
  isPublic: boolean
  isPrebuilt?: boolean
}

interface Report {
  id: string
  name: string
  type: string
  data: unknown
  generatedAt: string
  views?: number
  downloads?: number
}

interface ScheduledReport {
  id: string
  name: string
  reportType: string
  frequency: string
  recipients: string[]
  enabled: boolean
  nextRunAt: string
}

type ReportConfig = {
  reportName: string
  reportType: string
  dateRange: {
    startDate: string
    endDate: string
  }
  projectIds: string[]
  teamMemberIds: string[]
  includeSections: string[]
  customBranding: {
    logo: string
    primaryColor: string
    companyName: string
  }
}

export default function PerformanceReportsPage() {
  const { data: _session } = useSession()
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'scheduled'>('generate')
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportName: '',
    reportType: '',
    dateRange: {
      startDate: '',
      endDate: '',
    },
    projectIds: [],
    teamMemberIds: [],
    includeSections: [],
    customBranding: {
      logo: '',
      primaryColor: '#3B82F6',
      companyName: '',
    },
  })
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchTemplates()
    fetchReports()
    fetchScheduledReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/project-manager/reports/templates')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/project-manager/reports/history')
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const fetchScheduledReports = async () => {
    try {
      const response = await fetch('/api/project-manager/reports/scheduled')
      const data = await response.json()
      setScheduledReports(data.scheduledReports || [])
    } catch (error) {
      console.error('Error fetching scheduled reports:', error)
    }
  }

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setReportConfig({
      ...reportConfig,
      reportType: template.type,
      includeSections: template.sections,
    })
  }

  const generateReport = async () => {
    if (!reportConfig.reportName || !reportConfig.reportType) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/project-manager/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportConfig),
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedReport(data.report)
        setShowPreview(true)
        fetchReports() // Refresh history
      } else {
        alert('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report')
    } finally {
      setLoading(false)
    }
  }

  const downloadReportAsPDF = async (report: Report) => {
    const element = document.getElementById('report-preview')
    if (!element) return

    try {
      // Dynamic import to prevent SSR issues
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`${report.name}.pdf`)

      // Track download
      await fetch('/api/project-manager/reports/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id, action: 'download' }),
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_STATUS':
        return <BarChart3 className="w-5 h-5" />
      case 'TEAM_PERFORMANCE':
        return <Users className="w-5 h-5" />
      case 'FINANCIAL':
        return <DollarSign className="w-5 h-5" />
      case 'TIME':
        return <Clock className="w-5 h-5" />
      case 'CLIENT':
        return <FileText className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Performance Reports
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Generate, schedule, and manage comprehensive performance reports
              </p>
            </div>
            <button
              onClick={() => setActiveTab('generate')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'generate'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Generate Report
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Report History
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Scheduled Reports
          </button>
        </div>

        {/* Generate Report Tab */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Templates Selection */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Select Report Template
                </h2>
                <div className="space-y-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-blue-600 dark:text-blue-400">
                          {getReportTypeIcon(template.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {template.description}
                          </p>
                          {template.isPrebuilt && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                              Pre-built
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Report Configuration */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Report Configuration
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Name
                    </label>
                    <input
                      type="text"
                      value={reportConfig.reportName}
                      onChange={(e) =>
                        setReportConfig({ ...reportConfig, reportName: e.target.value })
                      }
                      placeholder="e.g., Q4 2025 Project Status"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={reportConfig.dateRange.startDate}
                        onChange={(e) =>
                          setReportConfig({
                            ...reportConfig,
                            dateRange: { ...reportConfig.dateRange, startDate: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={reportConfig.dateRange.endDate}
                        onChange={(e) =>
                          setReportConfig({
                            ...reportConfig,
                            dateRange: { ...reportConfig.dateRange, endDate: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name (for branding)
                    </label>
                    <input
                      type="text"
                      value={reportConfig.customBranding.companyName}
                      onChange={(e) =>
                        setReportConfig({
                          ...reportConfig,
                          customBranding: {
                            ...reportConfig.customBranding,
                            companyName: e.target.value,
                          },
                        })
                      }
                      placeholder="Your Company Name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {selectedTemplate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Included Sections
                      </label>
                      <div className="space-y-2">
                        {selectedTemplate.sections.map((section) => (
                          <label key={section} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={reportConfig.includeSections.includes(section)}
                              onChange={(e) => {
                                const newSections = e.target.checked
                                  ? [...reportConfig.includeSections, section]
                                  : reportConfig.includeSections.filter((s) => s !== section)
                                setReportConfig({ ...reportConfig, includeSections: newSections })
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {section.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={generateReport}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Generating...' : 'Generate Report'}
                    </button>
                    {generatedReport && (
                      <button
                        onClick={() => setShowPreview(true)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        {getReportTypeIcon(report.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{report.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Generated {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {report.views || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            {report.downloads || 0} downloads
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadReportAsPDF(report)}
                        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No reports generated yet</p>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Generate your first report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Automated Report Schedule
                </h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  New Schedule
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {scheduledReports.map((schedule) => (
                <div key={schedule.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{schedule.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {schedule.frequency} • Next run:{' '}
                          {new Date(schedule.nextRunAt).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {Array.isArray(schedule.recipients) 
                              ? schedule.recipients.length 
                              : 0} recipients
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={schedule.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {scheduledReports.length === 0 && (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled reports yet</p>
                  <p className="text-sm mt-2">Set up automated reports to save time</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {showPreview && generatedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadReportAsPDF(generatedReport)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div id="report-preview" className="p-8">
                <ReportPreview report={generatedReport} config={reportConfig} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Report Preview Component
function ReportPreview({ report, config }: { report: Report; config: ReportConfig }) {
  const reportData = report.data as Record<string, unknown>
  
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {report.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {config.customBranding.companyName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Generated on {new Date(report.generatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Report Content */}
      <div className="prose dark:prose-invert max-w-none">
        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
          {JSON.stringify(reportData, null, 2)}
        </pre>
      </div>
    </div>
  )
}