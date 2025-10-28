'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  Settings,
  Shield,
  Database,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: string
  category: string
  description: string
  ipAddress: string
  userAgent: string
  metadata: Record<string, unknown> | null
  createdAt: string
}

interface AuditStats {
  totalLogs: number
  logsToday: number
  uniqueUsers: number
  categoriesCount: number
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    logsToday: 0,
    uniqueUsers: 0,
    categoriesCount: 0
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('7d')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  
  const logsPerPage = 20

  useEffect(() => {
    fetchAuditLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterCategory, filterPeriod])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      
      // Fetch stats
      const statsResponse = await fetch('/api/admin/audit-logs/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch logs with pagination and filters
      const logsResponse = await fetch(
        `/api/admin/audit-logs?page=${currentPage}&limit=${logsPerPage}&category=${filterCategory}&period=${filterPeriod}&search=${searchTerm}`
      )
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs)
        setTotalPages(Math.ceil(logsData.total / logsPerPage))
      }
      
      if (!loading) toast.success('Audit logs loaded successfully')
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAuditLogs()
    setRefreshing(false)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchAuditLogs()
  }

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/admin/audit-logs/export?category=${filterCategory}&period=${filterPeriod}&search=${searchTerm}`
      )
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Audit logs exported successfully')
      } else {
        toast.error('Failed to export logs')
      }
    } catch (error) {
      console.error('Failed to export:', error)
      toast.error('Failed to export logs')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'user':
        return <Users className="w-4 h-4" />
      case 'auth':
        return <Shield className="w-4 h-4" />
      case 'settings':
        return <Settings className="w-4 h-4" />
      case 'database':
        return <Database className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'user':
        return 'bg-blue-900/50 text-blue-300 border-blue-700'
      case 'auth':
        return 'bg-green-900/50 text-green-300 border-green-700'
      case 'settings':
        return 'bg-purple-900/50 text-purple-300 border-purple-700'
      case 'database':
        return 'bg-orange-900/50 text-orange-300 border-orange-700'
      case 'security':
        return 'bg-red-900/50 text-red-300 border-red-700'
      default:
        return 'bg-slate-900/50 text-slate-300 border-slate-700'
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-64"></div>
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-800 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400" />
              Audit Logs
            </h1>
            <p className="text-slate-400 mt-1">Track all system activities and changes</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Logs</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalLogs.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Logs Today</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.logsToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.uniqueUsers}</p>
                </div>
                <div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Categories</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.categoriesCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-900/50 rounded-full flex items-center justify-center">
                  <Filter className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by user, action, or description..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="user">User Management</option>
                <option value="auth">Authentication</option>
                <option value="settings">Settings</option>
                <option value="database">Database</option>
                <option value="security">Security</option>
                <option value="project">Projects</option>
                <option value="task">Tasks</option>
              </select>
              <select
                value={filterPeriod}
                onChange={(e) => {
                  setFilterPeriod(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs List */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No audit logs found</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getCategoryColor(log.category)}>
                          {getCategoryIcon(log.category)}
                          <span className="ml-1">{log.category}</span>
                        </Badge>
                        <span className="text-sm text-slate-400">{formatTimeAgo(log.createdAt)}</span>
                      </div>
                      
                      <h3 className="text-white font-semibold mb-1">{log.action}</h3>
                      <p className="text-slate-400 text-sm mb-2">{log.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {log.userName} ({log.userEmail})
                        </span>
                        <span>IP: {log.ipAddress}</span>
                        <span>{formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedLog(log)}
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 hover:bg-slate-700 flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-slate-800/50 border-slate-700 mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedLog(null)}>
            <Card className="bg-slate-800 border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Audit Log Details</span>
                  <Button
                    onClick={() => setSelectedLog(null)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700"
                  >
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Action</p>
                  <p className="text-white font-semibold">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Description</p>
                  <p className="text-white">{selectedLog.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">User</p>
                    <p className="text-white">{selectedLog.userName}</p>
                    <p className="text-slate-400 text-xs">{selectedLog.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Category</p>
                    <Badge className={getCategoryColor(selectedLog.category)}>
                      {getCategoryIcon(selectedLog.category)}
                      <span className="ml-1">{selectedLog.category}</span>
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">IP Address</p>
                    <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Timestamp</p>
                    <p className="text-white">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">User Agent</p>
                  <p className="text-white text-xs break-all">{selectedLog.userAgent}</p>
                </div>
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <p className="text-slate-400 text-sm mb-2">Additional Metadata</p>
                    <pre className="bg-slate-900 p-4 rounded-lg text-xs text-slate-300 overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
