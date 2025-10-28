'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  AlertTriangle,
  Users,
  Clock,
  MapPin,
  Ban,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface ActiveSession {
  id: string
  userId: string
  userName: string
  userEmail: string
  ipAddress: string
  userAgent: string
  location: string
  lastActive: string
  createdAt: string
}

interface FailedLogin {
  id: string
  email: string
  ipAddress: string
  userAgent: string
  reason: string
  attemptedAt: string
}

interface BlockedIP {
  id: string
  ipAddress: string
  reason: string
  blockedAt: string
  expiresAt: string | null
  blockedBy: string
}

interface SecurityStats {
  activeSessions: number
  failedLoginsToday: number
  blockedIPs: number
  suspiciousActivity: number
}

export default function SecurityDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<SecurityStats>({
    activeSessions: 0,
    failedLoginsToday: 0,
    blockedIPs: 0,
    suspiciousActivity: 0
  })
  
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([])
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([])
  
  const [activeTab, setActiveTab] = useState<'sessions' | 'failed' | 'blocked'>('sessions')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPeriod, setFilterPeriod] = useState('24h')
  
  const [terminateDialog, setTerminateDialog] = useState<{
    open: boolean
    sessionId: string
  }>({ open: false, sessionId: '' })
  
  const [blockDialog, setBlockDialog] = useState<{
    open: boolean
    ipAddress: string
    reason: string
  }>({ open: false, ipAddress: '', reason: '' })
  
  const [unblockDialog, setUnblockDialog] = useState<{
    open: boolean
    id: string
    ipAddress: string
  }>({ open: false, id: '', ipAddress: '' })

  useEffect(() => {
    fetchSecurityData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPeriod])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      
      // Fetch security stats
      const statsResponse = await fetch('/api/admin/security/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch active sessions
      const sessionsResponse = await fetch('/api/admin/security/sessions')
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json()
        setActiveSessions(sessionsData)
      }

      // Fetch failed logins
      const failedResponse = await fetch(`/api/admin/security/failed-logins?period=${filterPeriod}`)
      if (failedResponse.ok) {
        const failedData = await failedResponse.json()
        setFailedLogins(failedData)
      }

      // Fetch blocked IPs
      const blockedResponse = await fetch('/api/admin/security/blocked-ips')
      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json()
        setBlockedIPs(blockedData)
      }
      
      toast.success('Security data loaded successfully')
    } catch (error) {
      console.error('Failed to fetch security data:', error)
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchSecurityData()
    setRefreshing(false)
  }

  const handleTerminateSession = async (sessionId: string) => {
    setTerminateDialog({ open: true, sessionId })
  }

  const confirmTerminateSession = async () => {
    try {
      const response = await fetch(`/api/admin/security/sessions/${terminateDialog.sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setActiveSessions(prev => prev.filter(s => s.id !== terminateDialog.sessionId))
        setStats(prev => ({ ...prev, activeSessions: prev.activeSessions - 1 }))
        toast.success('Session terminated successfully')
      } else {
        toast.error('Failed to terminate session')
      }
    } catch (error) {
      console.error('Failed to terminate session:', error)
      toast.error('Failed to terminate session')
    } finally {
      setTerminateDialog({ open: false, sessionId: '' })
    }
  }

  const handleBlockIP = async (ipAddress: string, reason: string = 'Manual block') => {
    setBlockDialog({ open: true, ipAddress, reason })
  }

  const confirmBlockIP = async () => {
    try {
      const response = await fetch('/api/admin/security/blocked-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: blockDialog.ipAddress, reason: blockDialog.reason })
      })

      if (response.ok) {
        await fetchSecurityData()
        toast.success(`IP ${blockDialog.ipAddress} blocked successfully`)
      } else {
        toast.error('Failed to block IP address')
      }
    } catch (error) {
      console.error('Failed to block IP:', error)
      toast.error('Failed to block IP address')
    } finally {
      setBlockDialog({ open: false, ipAddress: '', reason: '' })
    }
  }

  const handleUnblockIP = async (ipId: string, ipAddress: string) => {
    setUnblockDialog({ open: true, id: ipId, ipAddress })
  }

  const confirmUnblockIP = async () => {
    try {
      const response = await fetch(`/api/admin/security/blocked-ips/${unblockDialog.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBlockedIPs(prev => prev.filter(b => b.id !== unblockDialog.id))
        setStats(prev => ({ ...prev, blockedIPs: prev.blockedIPs - 1 }))
        toast.success(`IP ${unblockDialog.ipAddress} unblocked successfully`)
      } else {
        toast.error('Failed to unblock IP address')
      }
    } catch (error) {
      console.error('Failed to unblock IP:', error)
      toast.error('Failed to unblock IP address')
    } finally {
      setUnblockDialog({ open: false, id: '', ipAddress: '' })
    }
  }

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      stats,
      activeSessions,
      failedLogins,
      blockedIPs
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
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

  const filteredSessions = activeSessions.filter(session =>
    session.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.ipAddress.includes(searchTerm)
  )

  const filteredFailedLogins = failedLogins.filter(login =>
    login.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    login.ipAddress.includes(searchTerm)
  )

  const filteredBlockedIPs = blockedIPs.filter(blocked =>
    blocked.ipAddress.includes(searchTerm) ||
    blocked.reason.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
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
              <Shield className="w-8 h-8 text-blue-400" />
              Security Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Monitor and manage security events</p>
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
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Sessions</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.activeSessions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Failed Logins Today</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.failedLoginsToday}</p>
                </div>
                <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Blocked IPs</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.blockedIPs}</p>
                </div>
                <div className="w-12 h-12 bg-orange-900/50 rounded-full flex items-center justify-center">
                  <Ban className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Suspicious Activity</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.suspiciousActivity}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-900/50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
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
                  placeholder="Search by email, IP address..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setActiveTab('sessions')}
            className={activeTab === 'sessions' ? 'bg-blue-600' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}
          >
            <Users className="w-4 h-4 mr-2" />
            Active Sessions ({filteredSessions.length})
          </Button>
          <Button
            onClick={() => setActiveTab('failed')}
            className={activeTab === 'failed' ? 'bg-blue-600' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Failed Logins ({filteredFailedLogins.length})
          </Button>
          <Button
            onClick={() => setActiveTab('blocked')}
            className={activeTab === 'blocked' ? 'bg-blue-600' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'}
          >
            <Ban className="w-4 h-4 mr-2" />
            Blocked IPs ({filteredBlockedIPs.length})
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No active sessions found</p>
                </CardContent>
              </Card>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{session.userName}</h3>
                          <Badge className="bg-green-900/50 text-green-300 border-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-slate-400 mb-4">{session.userEmail}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="w-4 h-4" />
                            <span>{session.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>Last active {formatTimeAgo(session.lastActive)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="w-4 h-4" />
                            <span>{session.location || 'Unknown location'}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-500 text-xs mt-2 truncate">{session.userAgent}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBlockIP(session.ipAddress, 'Blocked from active session')}
                          variant="outline"
                          size="sm"
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Block IP
                        </Button>
                        <Button
                          onClick={() => handleTerminateSession(session.id)}
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-slate-300 hover:bg-slate-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Terminate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'failed' && (
          <div className="space-y-4">
            {filteredFailedLogins.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <p className="text-slate-400">No failed login attempts found</p>
                </CardContent>
              </Card>
            ) : (
              filteredFailedLogins.map((login) => (
                <Card key={login.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{login.email}</h3>
                          <Badge className="bg-red-900/50 text-red-300 border-red-700">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                          <div className="flex items-center gap-2 text-slate-400">
                            <MapPin className="w-4 h-4" />
                            <span>{login.ipAddress}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(login.attemptedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{login.reason}</span>
                          </div>
                        </div>
                        
                        <p className="text-slate-500 text-xs truncate">{login.userAgent}</p>
                      </div>
                      
                      <Button
                        onClick={() => handleBlockIP(login.ipAddress, `Failed login attempts from ${login.email}`)}
                        variant="outline"
                        size="sm"
                        className="border-red-700 text-red-400 hover:bg-red-900/20"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Block IP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="space-y-4">
            {filteredBlockedIPs.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No blocked IP addresses</p>
                </CardContent>
              </Card>
            ) : (
              filteredBlockedIPs.map((blocked) => (
                <Card key={blocked.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white font-mono">{blocked.ipAddress}</h3>
                          <Badge className="bg-orange-900/50 text-orange-300 border-orange-700">
                            <Ban className="w-3 h-3 mr-1" />
                            Blocked
                          </Badge>
                        </div>
                        
                        <p className="text-slate-400 mb-4">{blocked.reason}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>Blocked {formatTimeAgo(blocked.blockedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>By {blocked.blockedBy}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{blocked.expiresAt ? `Expires ${formatDate(blocked.expiresAt)}` : 'Permanent'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleUnblockIP(blocked.id, blocked.ipAddress)}
                        variant="outline"
                        size="sm"
                        className="border-green-700 text-green-400 hover:bg-green-900/20"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unblock
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      
      <ConfirmDialog
        open={terminateDialog.open}
        onOpenChange={(open) => setTerminateDialog({ ...terminateDialog, open })}
        title="Terminate Session?"
        description="Are you sure you want to terminate this session? The user will be logged out immediately."
        onConfirm={confirmTerminateSession}
        variant="destructive"
      />
      
      <ConfirmDialog
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog({ ...blockDialog, open })}
        title="Block IP Address?"
        description={`Are you sure you want to block IP address ${blockDialog.ipAddress}? This will prevent all access from this IP.`}
        onConfirm={confirmBlockIP}
        variant="destructive"
      />
      
      <ConfirmDialog
        open={unblockDialog.open}
        onOpenChange={(open) => setUnblockDialog({ ...unblockDialog, open })}
        title="Unblock IP Address?"
        description={`Are you sure you want to unblock IP address ${unblockDialog.ipAddress}? This will restore access from this IP.`}
        onConfirm={confirmUnblockIP}
        variant="default"
      />
    </div>
  )
}
