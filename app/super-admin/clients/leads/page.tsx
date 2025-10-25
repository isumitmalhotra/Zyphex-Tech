'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { SubtleBackground } from '@/components/subtle-background';
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
  BarChart3,
  RefreshCw,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export default function ClientLeadsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Mock data - Replace with actual API calls
  const leads = [
    {
      id: 'LEAD-001',
      name: 'Acme Corporation',
      contactPerson: 'Jennifer Williams',
      email: 'jennifer@acme.com',
      phone: '+1 (555) 111-2222',
      industry: 'Technology',
      company: 'Acme Corporation',
      stage: 'qualified',
      score: 85,
      source: 'Website',
      estimatedValue: 150000,
      probability: 75,
      assignedTo: 'Sarah Johnson',
      createdDate: '2025-10-10',
      lastContact: '2025-10-25',
      nextFollowUp: '2025-10-28',
      notes: 'Very interested in our enterprise solutions. Ready for proposal.',
      activities: [
        { type: 'call', description: 'Discovery call completed', date: '2025-10-25' },
        { type: 'email', description: 'Sent pricing information', date: '2025-10-22' },
        { type: 'meeting', description: 'Initial meeting scheduled', date: '2025-10-20' }
      ],
      tags: ['Enterprise', 'High Priority', 'Decision Maker']
    },
    {
      id: 'LEAD-002',
      name: 'TechStart Solutions',
      contactPerson: 'Michael Brown',
      email: 'michael@techstart.com',
      phone: '+1 (555) 222-3333',
      industry: 'SaaS',
      company: 'TechStart Solutions',
      stage: 'proposal',
      score: 92,
      source: 'Referral',
      estimatedValue: 200000,
      probability: 85,
      assignedTo: 'David Lee',
      createdDate: '2025-09-15',
      lastContact: '2025-10-26',
      nextFollowUp: '2025-10-29',
      notes: 'Proposal sent. Waiting for budget approval from board.',
      activities: [
        { type: 'email', description: 'Proposal sent', date: '2025-10-26' },
        { type: 'meeting', description: 'Requirements discussion', date: '2025-10-24' },
        { type: 'call', description: 'Follow-up call', date: '2025-10-20' }
      ],
      tags: ['Hot Lead', 'Proposal Sent', 'Referral']
    },
    {
      id: 'LEAD-003',
      name: 'Global Innovations Inc',
      contactPerson: 'Sarah Martinez',
      email: 'sarah@globalinnovations.com',
      phone: '+1 (555) 333-4444',
      industry: 'Manufacturing',
      company: 'Global Innovations Inc',
      stage: 'negotiation',
      score: 88,
      source: 'LinkedIn',
      estimatedValue: 180000,
      probability: 80,
      assignedTo: 'Michael Chen',
      createdDate: '2025-09-20',
      lastContact: '2025-10-24',
      nextFollowUp: '2025-10-30',
      notes: 'In final negotiations. Minor pricing concerns to address.',
      activities: [
        { type: 'meeting', description: 'Contract review meeting', date: '2025-10-24' },
        { type: 'email', description: 'Revised proposal sent', date: '2025-10-22' },
        { type: 'call', description: 'Pricing discussion', date: '2025-10-18' }
      ],
      tags: ['Negotiation', 'Price Sensitive', 'Large Deal']
    },
    {
      id: 'LEAD-004',
      name: 'NextGen Enterprises',
      contactPerson: 'Robert Taylor',
      email: 'robert@nextgen.com',
      phone: '+1 (555) 444-5555',
      industry: 'E-Commerce',
      company: 'NextGen Enterprises',
      stage: 'new',
      score: 65,
      source: 'Cold Outreach',
      estimatedValue: 95000,
      probability: 40,
      assignedTo: 'Lisa Anderson',
      createdDate: '2025-10-22',
      lastContact: '2025-10-23',
      nextFollowUp: '2025-10-27',
      notes: 'Initial contact made. Need to schedule discovery call.',
      activities: [
        { type: 'email', description: 'Introduction email sent', date: '2025-10-23' },
        { type: 'call', description: 'Cold call - left voicemail', date: '2025-10-22' }
      ],
      tags: ['New Lead', 'E-Commerce', 'Cold Outreach']
    },
    {
      id: 'LEAD-005',
      name: 'Digital Dynamics',
      contactPerson: 'Emily Chen',
      email: 'emily@digitaldynamics.com',
      phone: '+1 (555) 555-6666',
      industry: 'Marketing',
      company: 'Digital Dynamics',
      stage: 'contacted',
      score: 72,
      source: 'Trade Show',
      estimatedValue: 120000,
      probability: 60,
      assignedTo: 'James Martinez',
      createdDate: '2025-10-01',
      lastContact: '2025-10-21',
      nextFollowUp: '2025-11-01',
      notes: 'Met at industry conference. Interested in digital transformation services.',
      activities: [
        { type: 'meeting', description: 'Coffee meeting at conference', date: '2025-10-21' },
        { type: 'email', description: 'Follow-up email sent', date: '2025-10-15' },
        { type: 'meeting', description: 'Trade show booth visit', date: '2025-10-01' }
      ],
      tags: ['Conference Lead', 'Marketing Agency', 'Warm Lead']
    },
    {
      id: 'LEAD-006',
      name: 'CloudFirst Systems',
      contactPerson: 'David Wilson',
      email: 'david@cloudfirst.com',
      phone: '+1 (555) 666-7777',
      industry: 'Cloud Services',
      company: 'CloudFirst Systems',
      stage: 'disqualified',
      score: 35,
      source: 'Website',
      estimatedValue: 50000,
      probability: 10,
      assignedTo: 'Sarah Johnson',
      createdDate: '2025-09-25',
      lastContact: '2025-10-10',
      nextFollowUp: null,
      notes: 'Budget constraints. Not a good fit at this time. Follow up in Q2 2026.',
      activities: [
        { type: 'call', description: 'Budget discussion - disqualified', date: '2025-10-10' },
        { type: 'email', description: 'Initial inquiry response', date: '2025-09-26' }
      ],
      tags: ['Disqualified', 'Budget Issues', 'Future Opportunity']
    },
    {
      id: 'LEAD-007',
      name: 'InnovateCo',
      contactPerson: 'Anna Johnson',
      email: 'anna@innovateco.com',
      phone: '+1 (555) 777-8888',
      industry: 'Healthcare',
      company: 'InnovateCo',
      stage: 'qualified',
      score: 78,
      source: 'Referral',
      estimatedValue: 135000,
      probability: 70,
      assignedTo: 'David Lee',
      createdDate: '2025-10-05',
      lastContact: '2025-10-26',
      nextFollowUp: '2025-10-31',
      notes: 'Strong interest in healthcare compliance solutions. Decision timeline: Q4 2025.',
      activities: [
        { type: 'meeting', description: 'Demo presentation', date: '2025-10-26' },
        { type: 'call', description: 'Qualification call', date: '2025-10-18' },
        { type: 'email', description: 'Initial contact via referral', date: '2025-10-05' }
      ],
      tags: ['Healthcare', 'Compliance', 'Qualified']
    },
    {
      id: 'LEAD-008',
      name: 'FutureTech Labs',
      contactPerson: 'Chris Anderson',
      email: 'chris@futuretech.com',
      phone: '+1 (555) 888-9999',
      industry: 'Research',
      company: 'FutureTech Labs',
      stage: 'contacted',
      score: 68,
      source: 'LinkedIn',
      estimatedValue: 110000,
      probability: 55,
      assignedTo: 'Lisa Anderson',
      createdDate: '2025-10-12',
      lastContact: '2025-10-24',
      nextFollowUp: '2025-10-29',
      notes: 'Exploring options for R&D management platform. Multiple stakeholders involved.',
      activities: [
        { type: 'email', description: 'Case studies shared', date: '2025-10-24' },
        { type: 'call', description: 'Initial discovery call', date: '2025-10-19' },
        { type: 'email', description: 'LinkedIn connection accepted', date: '2025-10-12' }
      ],
      tags: ['Research', 'Multiple Stakeholders', 'Long Sales Cycle']
    }
  ];

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
    toast({
      title: 'Lead Qualified',
      description: `Lead ${leadId} has been marked as qualified.`
    });
  };

  const handleDisqualifyLead = (leadId: string) => {
    toast({
      title: 'Lead Disqualified',
      description: `Lead ${leadId} has been disqualified.`,
      variant: 'destructive'
    });
  };

  const handleConvertToClient = (leadId: string) => {
    toast({
      title: 'Converting to Client',
      description: `Lead ${leadId} is being converted to an active client.`
    });
  };

  const handleScheduleFollowUp = (leadId: string) => {
    toast({
      title: 'Follow-up Scheduled',
      description: `Follow-up scheduled for lead ${leadId}.`
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      <SubtleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
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

        {/* Lead Pipeline Stages */}
        <div className="mb-8">
          <Card className="zyphex-card">
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
                      {((stage.count / leads.length) * 100).toFixed(0)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leads List */}
          <div className="lg:col-span-2">
            <ScrollArea className="h-[calc(100vh-600px)]">
              <div className="space-y-4 pr-4">
                {filteredLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    className={`zyphex-card hover-zyphex-lift cursor-pointer transition-all ${
                      selectedLead === lead.id ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => setSelectedLead(lead.id)}
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
                        {lead.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {lead.stage !== 'qualified' && lead.stage !== 'disqualified' && (
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
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
                            className="border-red-500/20 text-red-600 hover:bg-red-500/10"
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
                            className="zyphex-button-primary"
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
                            e.stopPropagation();
                            handleScheduleFollowUp(lead.id);
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule Follow-up
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead.id);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredLeads.length === 0 && (
                  <Card className="zyphex-card">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <UserPlus className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Leads Found</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {searchTerm || stageFilter !== 'all' || scoreFilter !== 'all'
                          ? 'Try adjusting your filters or search term'
                          : 'Get started by adding your first lead'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Sidebar - Lead Details & Analytics */}
          <div className="space-y-6">
            {/* Selected Lead Activities */}
            {selectedLead && (
              <Card className="zyphex-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const lead = leads.find(l => l.id === selectedLead);
                    if (!lead) return null;

                    return (
                      <div className="space-y-4">
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3 pr-4">
                            {lead.activities.map((activity, index) => (
                              <div key={index} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                  {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium">{activity.description}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.date}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <Separator />

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Lead Status
                          </Label>
                          <Badge className={getStageBadgeColor(lead.stage)}>
                            {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                          </Badge>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">
                            Lead Score
                          </Label>
                          <div className="flex items-center gap-2">
                            <div className={`text-2xl font-bold ${getScoreColor(lead.score)}`}>
                              {lead.score}
                            </div>
                            <Badge className={getScoreBadgeColor(lead.score)}>
                              {getScoreLabel(lead.score)}
                            </Badge>
                          </div>
                          <Progress value={lead.score} className="h-2 mt-2" />
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Lead Source Distribution */}
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
        </div>
      </div>
    </div>
  );
}
