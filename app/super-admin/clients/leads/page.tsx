'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { SubtleBackground } from '@/components/subtle-background';
import { ScheduleFollowUpDialog } from '@/components/schedule-followup-dialog';
import { StatsGridSkeleton } from '@/components/skeletons/stats-skeleton';
import { LeadGridSkeleton } from '@/components/skeletons/lead-skeleton';
import {
  UserPlus,
  Search,
  TrendingUp,
  Star,
  Phone,
  Mail,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle,
  Clock,
  Target,
  Award,
  Plus,
  Download,
  Eye,
  MessageSquare,
  Users,
  Briefcase,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  AlertCircle
} from 'lucide-react';

export default function ClientLeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Schedule follow-up dialog state
  const [followUpDialog, setFollowUpDialog] = useState({
    open: false,
    leadId: '',
    leadName: '',
    leadEmail: ''
  });

  // Data fetching states
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leads, setLeads] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const [_leadStats, _setLeadStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    async function fetchLeads() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/super-admin/clients/leads')
        
        if (!response.ok) {
          throw new Error('Failed to fetch leads')
        }
        
        const data = await response.json()
        setLeads(data.leads || [])
        _setLeadStats(data.stats || null)
        setError(null)
      } catch (err) {
        console.error('Error fetching leads:', err)
        setError('Failed to load leads. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [])
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <SubtleBackground />
        <div className="container mx-auto p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <StatsGridSkeleton count={6} />

          {/* Filters and Search Skeleton */}
          <div className="flex gap-4">
            <div className="h-10 flex-1 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
          </div>

          {/* Lead Grid Skeleton */}
          <LeadGridSkeleton count={9} />
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
                <CardTitle className="text-red-900">Error Loading Leads</CardTitle>
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



  const stages = [
    { id: 'new', name: 'New', color: 'bg-gray-500', count: leads.filter(l => l.stage === 'new').length },
    { id: 'contacted', name: 'Contacted', color: 'bg-blue-500', count: leads.filter(l => l.stage === 'contacted').length },
    { id: 'qualified', name: 'Qualified', color: 'bg-cyan-500', count: leads.filter(l => l.stage === 'qualified').length },
    { id: 'proposal', name: 'Proposal', color: 'bg-yellow-500', count: leads.filter(l => l.stage === 'proposal').length },
    { id: 'negotiation', name: 'Negotiation', color: 'bg-orange-500', count: leads.filter(l => l.stage === 'negotiation').length },
    { id: 'disqualified', name: 'Disqualified', color: 'bg-red-500', count: leads.filter(l => l.stage === 'disqualified').length }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'Warm';
    return 'Cold';
  };

  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'contacted': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'qualified': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'proposal': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'negotiation': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'disqualified': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    
    const matchesScore = scoreFilter === 'all' ||
                        (scoreFilter === 'hot' && lead.score >= 80) ||
                        (scoreFilter === 'warm' && lead.score >= 60 && lead.score < 80) ||
                        (scoreFilter === 'cold' && lead.score < 60);
    
    return matchesSearch && matchesStage && matchesScore;
  });

  const totalValue = leads.filter(l => l.stage !== 'disqualified').reduce((sum, l) => sum + l.estimatedValue, 0);
  const avgScore = leads.reduce((sum, l) => sum + l.score, 0) / leads.length;
  const conversionRate = ((leads.filter(l => l.stage === 'negotiation' || l.stage === 'proposal').length / leads.length) * 100);

  const handleQualifyLead = (leadId: string) => {
    toast.success('Lead Qualified', {
      description: `Lead ${leadId} has been marked as qualified.`
    });
  };

  const handleDisqualifyLead = (leadId: string) => {
    toast.error('Lead Disqualified', {
      description: `Lead ${leadId} has been disqualified.`
    });
  };

  const handleConvertToClient = (leadId: string) => {
    toast.success('Converting to Client', {
      description: `Lead ${leadId} is being converted to an active client.`
    });
  };

  const handleScheduleFollowUp = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    
    setFollowUpDialog({
      open: true,
      leadId: lead.id,
      leadName: lead.companyName || lead.name || 'Unknown',
      leadEmail: lead.email || ''
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden flex flex-col">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold zyphex-heading bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Client Leads
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and nurture leads through the sales pipeline
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="zyphex-card border-green-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading">
                    {leads.length}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Active pipeline
                  </p>
                </div>
                <UserPlus className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-blue-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pipeline Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-blue-600">
                    ${(totalValue / 1000).toFixed(0)}K
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Potential revenue
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-purple-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Lead Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-purple-600">
                    {avgScore.toFixed(0)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Overall quality
                  </p>
                </div>
                <Star className="h-10 w-10 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="zyphex-card border-orange-500/20 hover-zyphex-lift">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold zyphex-heading text-orange-600">
                    {conversionRate.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    To proposal/negotiation
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="zyphex-card mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search leads by name, contact, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 zyphex-input w-full"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'zyphex-button-primary' : ''}
                >
                  List View
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={viewMode === 'kanban' ? 'zyphex-button-primary' : ''}
                >
                  Pipeline View
                </Button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Label className="text-sm font-medium mr-2 self-center">Stage:</Label>
                <Button
                  variant={stageFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStageFilter('all')}
                  className={stageFilter === 'all' ? 'zyphex-button-primary' : ''}
                >
                  All ({leads.length})
                </Button>
                {stages.filter(s => s.id !== 'disqualified').map(stage => (
                  <Button
                    key={stage.id}
                    variant={stageFilter === stage.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStageFilter(stage.id)}
                    className={stageFilter === stage.id ? `${stage.color} text-white hover:opacity-90` : ''}
                  >
                    {stage.name} ({stage.count})
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button className="zyphex-button-primary" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex flex-wrap gap-2 items-center">
              <Label className="text-sm font-medium mr-2">Score:</Label>
              <Button
                variant={scoreFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScoreFilter('all')}
                className={scoreFilter === 'all' ? 'zyphex-button-primary' : ''}
              >
                All Scores
              </Button>
              <Button
                variant={scoreFilter === 'hot' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScoreFilter('hot')}
                className={scoreFilter === 'hot' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                <Star className="h-3 w-3 mr-1" />
                Hot (80+)
              </Button>
              <Button
                variant={scoreFilter === 'warm' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScoreFilter('warm')}
                className={scoreFilter === 'warm' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
              >
                Warm (60-79)
              </Button>
              <Button
                variant={scoreFilter === 'cold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScoreFilter('cold')}
                className={scoreFilter === 'cold' ? 'bg-gray-500 hover:bg-gray-600' : ''}
              >
                Cold (&lt;60)
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1">
          {/* Leads List - Takes 3 columns */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Lead Pipeline Stages - Inside main content area */}
            <Card className="zyphex-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Lead Pipeline Stages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {stages.map((stage) => (
                    <div key={stage.id} className="text-center">
                      <div className={`${stage.color} text-white rounded-lg p-4 mb-2`}>
                        <div className="text-2xl font-bold">{stage.count}</div>
                        <div className="text-xs opacity-90 mt-1">{stage.name}</div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {leads.length > 0 ? ((stage.count / leads.length) * 100).toFixed(0) : 0}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Leads List - Flex grow to fill remaining space */}
            <Card className="zyphex-card flex-1 flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-4 p-6">
                {filteredLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className={`zyphex-card hover-zyphex-lift transition-all ${
                      selectedLead === lead.id ? 'ring-2 ring-green-500' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-xl">{lead.name}</CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {lead.id}
                            </Badge>
                            <Badge className={getStageBadgeColor(lead.stage)}>
                              {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                            </Badge>
                            <Badge className={getScoreBadgeColor(lead.score)}>
                              <Star className="h-3 w-3 mr-1" />
                              {lead.score} - {getScoreLabel(lead.score)}
                            </Badge>
                          </div>
                          <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {lead.contactPerson}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {lead.industry}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Created {lead.createdDate}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Lead Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Est. Value</div>
                          <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            {(lead.estimatedValue / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Probability</div>
                          <div className="text-lg font-bold">{lead.probability}%</div>
                          <Progress value={lead.probability} className="h-1 mt-1" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Source</div>
                          <div className="text-sm font-semibold">{lead.source}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned To</div>
                          <div className="text-sm font-semibold">{lead.assignedTo}</div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Contact Information */}
                      <div className="mb-4">
                        <div className="font-semibold mb-2 text-sm">Contact Information</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-blue-600">{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      {/* Follow-up Information */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Contact</div>
                          <div className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lead.lastContact}
                          </div>
                        </div>
                        {lead.nextFollowUp && (
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Follow-up</div>
                            <div className="text-sm flex items-center gap-1 text-orange-600 font-semibold">
                              <Calendar className="h-3 w-3" />
                              {lead.nextFollowUp}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {lead.notes && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{lead.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {lead.tags?.map((tag: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 relative z-10">
                        {lead.stage !== 'qualified' && lead.stage !== 'disqualified' && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQualifyLead(lead.id);
                            }}
                          >
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            Qualify
                          </Button>
                        )}
                        {lead.stage !== 'disqualified' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/20 text-red-600 hover:bg-red-500/10 pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisqualifyLead(lead.id);
                            }}
                          >
                            <ThumbsDown className="h-3 w-3 mr-1" />
                            Disqualify
                          </Button>
                        )}
                        {(lead.stage === 'negotiation' || lead.stage === 'proposal') && (
                          <Button
                            size="sm"
                            className="zyphex-button-primary pointer-events-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConvertToClient(lead.id);
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Convert to Client
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Schedule Follow-up clicked for lead:', lead.id);
                            handleScheduleFollowUp(lead.id);
                          }}
                          className="pointer-events-auto cursor-pointer"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule Follow-up
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('View Details clicked for lead:', lead.id, lead.name);
                            setSelectedLead(lead.id);
                          }}
                          className="pointer-events-auto cursor-pointer"
                          type="button"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredLeads.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
                    <UserPlus className="h-20 w-20 text-gray-400 mb-6" />
                    <h3 className="text-2xl font-semibold mb-3">No Leads Found</h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 text-center max-w-md">
                      {searchTerm || stageFilter !== 'all' || scoreFilter !== 'all'
                        ? 'Try adjusting your filters or search term to find the leads you\'re looking for'
                        : 'Get started by adding your first lead to begin tracking your sales pipeline'}
                    </p>
                    <Button className="zyphex-button-primary mt-6">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Lead
                    </Button>
                  </div>
                )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Lead Details & Analytics - Takes 1 column */}
          <div className="space-y-6 lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-6 pr-4">
                  
                  {/* Selected Lead Details - Shows at top when lead is selected */}
                  {selectedLead ? (
                    <>
                      {/* Selected Lead Info Card */}
                      <Card className="zyphex-card border-2 border-green-500 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Eye className="h-5 w-5 text-green-600" />
                              Lead Details
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLead(null)}
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Close</span>
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          </div>
                          <CardDescription className="text-base font-semibold mt-2">
                            {leads.find(l => l.id === selectedLead)?.name || 'Unknown Lead'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                  {(() => {
                    const lead = leads.find(l => l.id === selectedLead);
                    if (!lead) return (
                      <div className="text-center py-8 text-gray-500">
                        <p>Lead not found</p>
                      </div>
                    );

                    // Get activities array safely
                    const activities = Array.isArray(lead.recentActivities) ? lead.recentActivities : [];

                    return (
                      <div className="space-y-6">
                        {/* Lead Overview */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Status
                            </Label>
                            <Badge className={getStageBadgeColor(lead.stage)}>
                              {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Score
                            </Label>
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-bold ${getScoreColor(lead.score)}`}>
                                {lead.score}
                              </span>
                              <Badge className={getScoreBadgeColor(lead.score)} variant="outline">
                                {getScoreLabel(lead.score)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div>
                          <Label className="text-sm font-semibold mb-3 block">Contact Information</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline break-all">
                                {lead.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <a href={`tel:${lead.phone}`} className="text-gray-700 dark:text-gray-300">
                                {lead.phone}
                              </a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{lead.company}</span>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Lead Value & Probability */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Est. Value
                            </Label>
                            <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                              <DollarSign className="h-4 w-4" />
                              {(lead.estimatedValue / 1000).toFixed(0)}K
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                              Probability
                            </Label>
                            <div className="text-lg font-bold">{lead.probability}%</div>
                            <Progress value={lead.probability} className="h-1.5 mt-1" />
                          </div>
                        </div>

                        <Separator />

                        {/* Recent Activities */}
                        <div>
                          <Label className="text-sm font-semibold mb-3 block">Recent Activities</Label>
                          <ScrollArea className="h-[180px]">
                            <div className="space-y-2 pr-4">
                              {activities.length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                activities.map((activity: any, index: number) => (
                                  <div key={index} className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors">
                                    <div className="h-7 w-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">
                                        {activity.description}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {activity.date}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-6 text-gray-400">
                                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                  <p className="text-xs">No recent activities</p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    );
                  })()}
                        </CardContent>
                      </Card>
                    </>
                  ) : null}

            {/* Lead Source Distribution - Always visible */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" />
                  Lead Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Website', 'Referral', 'LinkedIn', 'Cold Outreach', 'Trade Show'].map((source) => {
                  const count = leads.filter(l => l.source === source).length;
                  return (
                    <div key={source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{source}</span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                      <Progress 
                        value={(count / leads.length) * 100} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Hot Leads (80+)
                  </span>
                  <span className="font-semibold text-green-600">
                    {leads.filter(l => l.score >= 80).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    In Negotiation
                  </span>
                  <span className="font-semibold text-orange-600">
                    {leads.filter(l => l.stage === 'negotiation').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Deal Size
                  </span>
                  <span className="font-semibold text-blue-600">
                    ${(leads.reduce((sum, l) => sum + l.estimatedValue, 0) / leads.length / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    This Month
                  </span>
                  <span className="font-semibold text-purple-600">
                    {leads.filter(l => l.createdDate.includes('2025-10')).length} new leads
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="zyphex-card">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Lead Data
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Conversion Funnel
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Lead Report
                </Button>
              </CardContent>
            </Card>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
      
      {/* Schedule Follow-up Dialog */}
      <ScheduleFollowUpDialog
        open={followUpDialog.open}
        onOpenChange={(open) => setFollowUpDialog({ ...followUpDialog, open })}
        leadId={followUpDialog.leadId}
        leadName={followUpDialog.leadName}
        leadEmail={followUpDialog.leadEmail}
      />
    </div>
  );
}
