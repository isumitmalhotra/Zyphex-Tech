'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
import {
  FileText,
  Search,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  User,
  Calendar,
  Paperclip,
  TrendingUp,
  FileCheck,
  RefreshCw,
  Plus,
  FolderOpen,
  Target,
  Award,
  ArrowRight,
  MoreVertical,
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ProjectProposalsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  // Data fetching states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proposals, setProposals] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proposalStats, setProposalStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    async function fetchProposals() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/super-admin/projects/proposals')
        
        if (!response.ok) {
          throw new Error('Failed to fetch proposals')
        }
        
        const data = await response.json()
        setProposals(data.proposals || [])
        setProposalStats(data.stats || null)
        setError(null)
      } catch (err) {
        console.error('Error fetching proposals:', err)
        setError('Failed to load proposals. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProposals()
  }, [])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <SubtleBackground />
        <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <p className="text-lg text-slate-600">Loading proposals...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <SubtleBackground />
        <div className="container mx-auto p-6">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <CardTitle className="text-red-900">Error Loading Proposals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Mock data - Now from API
  // Templates kept for UI (could be moved to database later)
  const templates = [
    { id: 'template-1', name: 'E-Commerce Standard', category: 'Web Development', usageCount: 12 },
    { id: 'template-2', name: 'Mobile App Standard', category: 'Mobile Development', usageCount: 8 },
    { id: 'template-3', name: 'Website Standard', category: 'Web Development', usageCount: 15 },
    { id: 'template-4', name: 'Analytics Platform', category: 'Data & Analytics', usageCount: 5 },
    { id: 'template-5', name: 'Cloud Services', category: 'Infrastructure', usageCount: 7 },
    { id: 'template-6', name: 'SaaS Platform', category: 'Software Development', usageCount: 4 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'revision': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.proposalId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Use stats from API or calculate from filtered data
  const statusCounts = proposalStats ? {
    all: proposalStats.totalProposals || 0,
    pending: proposalStats.pending || 0,
    approved: proposalStats.approved || 0,
    rejected: proposalStats.rejected || 0,
    'under-review': proposalStats.underReview || 0
  } : {
    all: proposals.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pending: proposals.filter((p: any) => p.status === 'pending').length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    approved: proposals.filter((p: any) => p.status === 'approved').length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rejected: proposals.filter((p: any) => p.status === 'rejected').length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'under-review': proposals.filter((p: any) => p.status === 'under-review').length
  };

  const totalValue = proposalStats?.totalValue || 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const approvedValue = proposals.filter((p: any) => p.status === 'approved').reduce((sum: number, p: any) => sum + (p.value || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingValue = proposals.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + (p.value || 0), 0);

  const handleApprove = (proposalId: string) => {
    toast({
      title: 'Proposal Approved',
      description: `Proposal ${proposalId} has been approved successfully.`
    });
  };

  const handleReject = (proposalId: string) => {
    toast({
      title: 'Proposal Rejected',
      description: `Proposal ${proposalId} has been rejected.`,
      variant: 'destructive'
    });
  };

  const handleRequestRevision = (proposalId: string) => {
    toast({
      title: 'Revision Requested',
      description: `Revision request sent for proposal ${proposalId}.`
    });
  };

  const handleConvertToProject = (proposalId: string) => {
    toast({
      title: 'Converting to Project',
      description: `Proposal ${proposalId} is being converted to an active project.`
    });
  };

  const handleSendToClient = (proposalId: string) => {
    toast({
      title: 'Proposal Sent',
      description: `Proposal ${proposalId} has been sent to the client.`
    });
  };

  const handleExportProposal = (proposalId: string) => {
    toast({
      title: 'Exporting Proposal',
      description: `Proposal ${proposalId} is being exported to PDF.`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Project Proposals
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage proposals, track approvals, and convert to projects
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {proposals.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All time submissions
                  </p>
                </div>
                <FileText className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-green-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-green-600">
                    ${(approvedValue / 1000).toFixed(0)}K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {statusCounts.approved} proposals
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-yellow-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-yellow-600">
                    ${(pendingValue / 1000).toFixed(0)}K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {statusCounts.pending} proposals
                  </p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-blue-600">
                    {((statusCounts.approved / (proposals.length - statusCounts.pending)) * 100).toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Approval rate
                  </p>
                </div>
                <Award className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search proposals by title, client, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'zyphex-button-primary' : ''}
                >
                  All ({statusCounts.all})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pending')}
                  className={statusFilter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  Pending ({statusCounts.pending})
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('approved')}
                  className={statusFilter === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved ({statusCounts.approved})
                </Button>
                <Button
                  variant={statusFilter === 'revision' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('under-review')}
                  className={statusFilter === 'under-review' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Under Review ({statusCounts['under-review'] || 0})
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('rejected')}
                  className={statusFilter === 'rejected' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected ({statusCounts.rejected})
                </Button>
              </div>

              <Button className="zyphex-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Proposals List */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-4 pr-4">
                {filteredProposals.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className={`zyphex-card hover-zyphex-lift cursor-pointer transition-all ${
                      selectedProposal === proposal.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedProposal(proposal.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(proposal.status)}>
                              {proposal.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {proposal.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {proposal.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {proposal.status === 'revision' && <RefreshCw className="h-3 w-3 mr-1" />}
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </Badge>
                            <Badge className={getPriorityColor(proposal.priority)}>
                              {proposal.priority.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {proposal.id}
                            </span>
                          </div>
                          <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {proposal.client}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {proposal.submittedDate}
                            </span>
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {proposal.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value</div>
                          <div className="flex items-center gap-1 font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            {(proposal.value / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</div>
                          <div className="font-semibold">{proposal.duration}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Team Size</div>
                          <div className="font-semibold">{proposal.team} members</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attachments</div>
                          <div className="flex items-center gap-1 font-semibold">
                            <Paperclip className="h-3 w-3" />
                            {proposal.attachments}
                          </div>
                        </div>
                      </div>

                      {proposal.status === 'revision' && proposal.revisionNotes && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <RefreshCw className="h-4 w-4 text-blue-500 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-blue-600 mb-1">
                                Revision Requested
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {proposal.revisionNotes}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {proposal.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(proposal.id);
                              }}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 text-red-600 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(proposal.id);
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestRevision(proposal.id);
                              }}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Request Revision
                            </Button>
                          </>
                        )}
                        {proposal.status === 'approved' && (
                          <Button
                            size="sm"
                            className="zyphex-button-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToProject(proposal.id);
                            }}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Convert to Project
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendToClient(proposal.id);
                          }}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Send to Client
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportProposal(proposal.id);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProposal(proposal.id);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredProposals.length === 0 && (
                  <Card className="zyphex-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Proposals Found</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {searchTerm || statusFilter !== 'all'
                          ? 'Try adjusting your filters or search term'
                          : 'Get started by creating your first proposal'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar - Details & Templates */}
          <div className="space-y-6">
            {/* Selected Proposal Details */}
            {selectedProposal && (
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-500" />
                    Proposal Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const proposal = proposals.find(p => p.id === selectedProposal);
                    if (!proposal) return null;

                    return (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">
                            Proposal ID
                          </Label>
                          <div className="font-semibold">{proposal.id}</div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">
                            Client Contact
                          </Label>
                          <div className="space-y-1 mt-1">
                            <div className="font-semibold">{proposal.clientContact}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {proposal.clientEmail}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Scope of Work
                          </Label>
                          <div className="space-y-2">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {proposal.scope?.map((item: any, index: number) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <Target className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">
                            Prepared By
                          </Label>
                          <div className="font-semibold">{proposal.proposalBy}</div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400">
                            Template Used
                          </Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {proposal.template}
                            </Badge>
                          </div>
                        </div>

                        {proposal.status === 'approved' && proposal.approvedDate && (
                          <>
                            <Separator />
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-green-600 mb-1">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-semibold text-sm">Approved</span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Approved on {proposal.approvedDate}
                              </div>
                            </div>
                          </>
                        )}

                        {proposal.status === 'rejected' && proposal.rejectionReason && (
                          <>
                            <Separator />
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-red-600 mb-1">
                                <XCircle className="h-4 w-4" />
                                <span className="font-semibold text-sm">Rejected</span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {proposal.rejectionReason}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Proposal Templates */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  Proposal Templates
                </CardTitle>
                <CardDescription>
                  Pre-built templates for quick proposal creation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 pr-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-500/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1 group-hover:text-purple-600 transition-colors">
                              {template.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {template.category}
                            </div>
                          </div>
                          <FileCheck className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            Used {template.usageCount} times
                          </span>
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />

                <Button variant="outline" className="w-full" size="sm">
                  <Plus className="h-3 w-3 mr-2" />
                  Create New Template
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg. Proposal Value
                  </span>
                  <span className="font-semibold text-green-600">
                    ${(totalValue / proposals.length / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg. Team Size
                  </span>
                  <span className="font-semibold">
                    {(proposals.reduce((sum, p) => sum + p.team, 0) / proposals.length).toFixed(1)} members
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Active Templates
                  </span>
                  <span className="font-semibold">{templates.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    This Month
                  </span>
                  <span className="font-semibold text-purple-600">
                    {proposals.filter(p => p.submittedDate.includes('2025-10')).length} proposals
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
