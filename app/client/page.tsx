"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { Permission } from "@/lib/auth/permissions"
import {
  Briefcase,
  DollarSign,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
  Download,
} from "lucide-react"
import { SubtleBackground } from "@/components/subtle-background"
import { useClientDashboard } from "@/hooks/use-client-dashboard"
import Link from "next/link"

function ClientDashboardContent() {
  const { dashboardData, loading, error, refresh } = useClientDashboard()

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              <span className="zyphex-subheading">Loading your client portal...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
        <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
          <Alert className="border-red-500/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { client, overview, recentProjects, upcomingMilestones, recentMessages, recentDocuments, recentInvoices, contactHistory } = dashboardData

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
      <SubtleBackground />
      <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold zyphex-heading">Welcome, {client.name}</h1>
            <p className="zyphex-subheading">{client.company ? `${client.company} • ` : ''}{client.email}</p>
          </div>
          <Button 
            onClick={() => refresh()} 
            variant="outline" 
            size="sm"
            className="zyphex-button"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">My Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.totalProjects}</div>
              <p className="text-xs zyphex-subheading">
                {overview.activeProjects} active, {overview.completedProjects} completed
              </p>
              <Progress value={overview.projectCompletionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Total Investment</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">
                ${overview.totalInvestment.toLocaleString()}
              </div>
              <p className="text-xs zyphex-subheading">
                ${overview.paidAmount.toLocaleString()} paid
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading text-yellow-400">
                ${overview.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs zyphex-subheading">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card className="zyphex-card hover-zyphex-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium zyphex-subheading">Project Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold zyphex-heading">{overview.projectCompletionRate}%</div>
              <p className="text-xs zyphex-subheading">Overall completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Projects */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Briefcase className="h-5 w-5" />
                My Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.slice(0, 4).map((project: any) => (
                <div key={project.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{project.name}</h4>
                      <Badge 
                        variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Progress value={project.progress} className="mb-2" />
                  <p className="text-xs zyphex-subheading mb-2">
                    Progress: {project.progress}% • Team: {project.team.members.length} members
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-medium text-blue-400">{project.taskStats.todo}</div>
                      <div className="zyphex-subheading">Todo</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-yellow-400">{project.taskStats.inProgress}</div>
                      <div className="zyphex-subheading">In Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-green-400">{project.taskStats.completed}</div>
                      <div className="zyphex-subheading">Completed</div>
                    </div>
                  </div>

                  {project.documents.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <p className="text-xs zyphex-subheading">
                        Recent documents: {project.documents.slice(0, 2).map((doc: any) => doc.title).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full zyphex-button">
                View All Projects
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Milestones */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Calendar className="h-5 w-5" />
                Upcoming Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingMilestones.map((milestone: any) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">{milestone.title}</h4>
                      <Badge 
                        variant={milestone.priority === 'HIGH' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {milestone.priority}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{milestone.project.name}</p>
                    <p className="text-xs zyphex-subheading">
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </p>
                    {milestone.assignee && (
                      <p className="text-xs zyphex-subheading">
                        Assigned: {milestone.assignee.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {upcomingMilestones.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No upcoming milestones
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <FileText className="h-5 w-5" />
                Recent Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentDocuments.slice(0, 5).map((document: any) => (
                <div key={document.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <h4 className="font-medium zyphex-heading text-sm">{document.title}</h4>
                    <p className="text-xs zyphex-subheading">{document.fileName}</p>
                    <p className="text-xs zyphex-subheading">
                      {document.project.name} • {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs zyphex-subheading">
                      By: {document.uploadedBy.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {recentDocuments.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No documents available
                </p>
              )}
              <Button variant="outline" className="w-full zyphex-button">
                View All Documents
              </Button>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <DollarSign className="h-5 w-5" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentInvoices.slice(0, 5).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium zyphex-heading text-sm">#{invoice.invoiceNumber}</h4>
                      <Badge 
                        variant={
                          invoice.status === 'PAID' ? 'default' : 
                          invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-xs zyphex-subheading">{invoice.project.name}</p>
                    <p className="text-xs zyphex-subheading">
                      Amount: ${invoice.amount.toLocaleString()}
                    </p>
                    {invoice.dueDate && (
                      <p className="text-xs zyphex-subheading">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No invoices available
                </p>
              )}
              <Button variant="outline" className="w-full zyphex-button">
                View All Invoices
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Messages and Contact History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <MessageSquare className="h-5 w-5" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentMessages.slice(0, 5).map((message: any) => (
                <div key={message.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium zyphex-heading">{message.sender.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {message.sender.role}
                        </Badge>
                      </div>
                      <p className="text-xs zyphex-subheading truncate">{message.content}</p>
                      <p className="text-xs zyphex-subheading">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {recentMessages.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No recent messages
                </p>
              )}
              <Button variant="outline" className="w-full zyphex-button">
                View All Messages
              </Button>
            </CardContent>
          </Card>

          {/* Contact History */}
          <Card className="zyphex-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 zyphex-heading">
                <Users className="h-5 w-5" />
                Contact History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactHistory.slice(0, 5).map((contact: any) => (
                <div key={contact.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium zyphex-heading">{contact.type}</p>
                      </div>
                      <p className="text-xs zyphex-subheading">
                        With: {contact.user.name} • {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                      {contact.notes && (
                        <p className="text-xs zyphex-subheading mt-1">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {contactHistory.length === 0 && (
                <p className="text-center text-sm zyphex-subheading py-4">
                  No contact history
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <PermissionGuard 
      permission={Permission.VIEW_DASHBOARD}
      fallback={
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 zyphex-gradient-bg relative min-h-screen">
          <div className="flex flex-1 flex-col gap-4 p-4 relative z-10">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don&apos;t have permission to view this dashboard.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      }
    >
      <ClientDashboardContent />
    </PermissionGuard>
  )
}